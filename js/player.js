"use strict";

class Player {
    constructor(x, y, tileSize, map) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.tileSize = tileSize;
        this.map = map;
        this.speed = 150;
        this.frameX = 0;
        this.frameY = 0;
        this.frameTimer = 0;
        this.frameInterval = 120;
        this.spriteColumns = 5;
        this.spriteRows = 4;
        this.moving = false;

        /* El escudo absorbe un impacto por carga. */
        this.shieldCharges = 0;

        /* Permite atravesar temporalmente bloques destructibles. */
        this.phaseActive = false;
        this.phaseEndTime = 0;

        /* Cantidad de detonaciones remotas disponibles. */
        this.remoteDetonations = 0;

        /* Cantidad de bombas especiales disponibles. */
        this.specialBombs = 0;

        this.image = new Image();
        this.image.src = "assets/sprites/player_sheet.png";
    }

    update(keys, deltaTime, bombs = []) {
        this.updatePhaseEffect(performance.now());

        let directionX = 0;
        let directionY = 0;

        if (keys["ArrowUp"] || keys["w"]) {
            directionY = -1;
            this.setDirection("up");
        }

        if (keys["ArrowDown"] || keys["s"]) {
            directionY = 1;
            this.setDirection("down");
        }

        if (keys["ArrowLeft"] || keys["a"]) {
            directionX = -1;
            this.setDirection("left");
        }

        if (keys["ArrowRight"] || keys["d"]) {
            directionX = 1;
            this.setDirection("right");
        }

        this.moving = directionX !== 0 || directionY !== 0;

        if (directionX !== 0 && directionY !== 0) {
            const diagonalFactor = 1 / Math.sqrt(2);
            directionX *= diagonalFactor;
            directionY *= diagonalFactor;
        }

        const distance = this.speed * (deltaTime / 1000);
        const movementX = directionX * distance;
        const movementY = directionY * distance;

        if (!this.isPositionBlocked(this.x + movementX, this.y, bombs)) {
            this.x += movementX;
        }

        if (!this.isPositionBlocked(this.x, this.y + movementY, bombs)) {
            this.y += movementY;
        }

        this.updateBombPermissions(bombs);
        this.updateAnimation(deltaTime);
    }

    setDirection(direction) {
        const directionRows = {
            down: 0,
            left: 1,
            right: 2,
            up: 3
        };

        this.frameY = directionRows[direction];
    }

    updateAnimation(deltaTime) {
        if (!this.moving) {
            this.frameX = 0;
            this.frameTimer = 0;
            return;
        }

        this.frameTimer += deltaTime;

        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer = 0;
            this.frameX++;

            if (this.frameX >= this.spriteColumns) {
                this.frameX = 0;
            }
        }
    }

    isPositionBlocked(nextX, nextY, bombs) {
        const margin = 8;
        const left = nextX + margin;
        const right = nextX + this.tileSize - margin - 1;
        const top = nextY + margin;
        const bottom = nextY + this.tileSize - margin - 1;

        const points = [
            { x: left, y: top },
            { x: right, y: top },
            { x: left, y: bottom },
            { x: right, y: bottom }
        ];

        for (const point of points) {
            const column = Math.floor(point.x / this.tileSize);
            const row = Math.floor(point.y / this.tileSize);

            if (
                row < 0 ||
                row >= this.map.length ||
                column < 0 ||
                column >= this.map[0].length
            ) {
                return true;
            }

            const tile = this.map[row][column];

            if (tile === 1 || (tile === 2 && !this.phaseActive)) {
                return true;
            }
        }

        for (const bomb of bombs) {
            if (
                bomb.finished ||
                bomb.state === "exploding" ||
                bomb.playerCanPass
            ) {
                continue;
            }

            const bombX = bomb.column * this.tileSize;
            const bombY = bomb.row * this.tileSize;

            const collision =
                left < bombX + this.tileSize &&
                right > bombX &&
                top < bombY + this.tileSize &&
                bottom > bombY;

            if (collision) {
                return true;
            }
        }

        return false;
    }

    updateBombPermissions(bombs) {
        const margin = 8;
        const playerLeft = this.x + margin;
        const playerRight = this.x + this.tileSize - margin;
        const playerTop = this.y + margin;
        const playerBottom = this.y + this.tileSize - margin;

        for (const bomb of bombs) {
            if (!bomb.playerCanPass || bomb.finished) {
                continue;
            }

            const bombX = bomb.column * this.tileSize;
            const bombY = bomb.row * this.tileSize;

            const stillTouchingBomb =
                playerLeft < bombX + this.tileSize &&
                playerRight > bombX &&
                playerTop < bombY + this.tileSize &&
                playerBottom > bombY;

            if (!stillTouchingBomb) {
                bomb.playerCanPass = false;
            }
        }
    }

    addShield() {
        this.shieldCharges = Math.min(this.shieldCharges + 1, 3);
        return this.shieldCharges;
    }

    consumeShield() {
        if (this.shieldCharges <= 0) {
            return false;
        }

        this.shieldCharges--;
        return true;
    }

    addRemoteDetonation() {
        this.remoteDetonations = Math.min(this.remoteDetonations + 1, 5);
        return this.remoteDetonations;
    }

    useRemoteDetonation() {
        if (this.remoteDetonations <= 0) {
            return false;
        }

        this.remoteDetonations--;
        return true;
    }

    addSpecialBomb() {
        this.specialBombs = Math.min(this.specialBombs + 1, 5);
        return this.specialBombs;
    }

    useSpecialBomb() {
        if (this.specialBombs <= 0) {
            return false;
        }

        this.specialBombs--;
        return true;
    }

    activatePhase(duration = 8000) {
        this.phaseActive = true;
        this.phaseEndTime = performance.now() + duration;
    }

    updatePhaseEffect(currentTime) {
        if (!this.phaseActive || currentTime < this.phaseEndTime) {
            return;
        }

        /*
            El efecto no termina mientras el jugador se encuentre
            dentro de un bloque, evitando que quede atrapado.
        */
        if (this.isInsideDestructibleBlock()) {
            this.phaseEndTime = currentTime + 150;
            return;
        }

        this.phaseActive = false;
    }

    isInsideDestructibleBlock() {
        const margin = 8;
        const points = [
            { x: this.x + margin, y: this.y + margin },
            { x: this.x + this.tileSize - margin, y: this.y + margin },
            { x: this.x + margin, y: this.y + this.tileSize - margin },
            {
                x: this.x + this.tileSize - margin,
                y: this.y + this.tileSize - margin
            }
        ];

        return points.some(point => {
            const column = Math.floor(point.x / this.tileSize);
            const row = Math.floor(point.y / this.tileSize);
            return this.map[row]?.[column] === 2;
        });
    }

    resetPosition() {
        this.x = this.startX;
        this.y = this.startY;
        this.frameX = 0;
        this.frameY = 0;
        this.moving = false;
    }

    draw(ctx) {
        if (!this.image.complete || this.image.naturalWidth === 0) {
            return;
        }

        const sourceWidth = this.image.width / this.spriteColumns;
        const sourceHeight = this.image.height / this.spriteRows;
        const sourceX = this.frameX * sourceWidth;
        const sourceY = this.frameY * sourceHeight;

        /* El aura se dibuja detrás del personaje. */
        this.drawPhaseEffect(ctx);

        ctx.drawImage(
            this.image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            this.x,
            this.y,
            this.tileSize,
            this.tileSize
        );

        this.drawShield(ctx);
    }

    drawPhaseEffect(ctx) {
        if (!this.phaseActive) {
            return;
        }

        const time = performance.now();
        const centerX = this.x + this.tileSize / 2;
        const centerY = this.y + this.tileSize / 2;
        const pulse = Math.sin(time / 130) * 3;
        const radius = this.tileSize * 0.58 + pulse;

        const gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            this.tileSize * 0.12,
            centerX,
            centerY,
            radius
        );

        gradient.addColorStop(0, "rgba(232, 178, 255, 0.28)");
        gradient.addColorStop(0.55, "rgba(184, 72, 255, 0.18)");
        gradient.addColorStop(1, "rgba(128, 0, 255, 0)");

        ctx.save();

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 4, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(211, 120, 255, 0.85)";
        ctx.shadowColor = "#b200ff";
        ctx.shadowBlur = 14;
        ctx.stroke();

        for (let index = 0; index < 6; index++) {
            const angle = time / 420 + index * (Math.PI * 2 / 6);
            const particleRadius = radius - 3;
            const particleX = centerX + Math.cos(angle) * particleRadius;
            const particleY = centerY + Math.sin(angle) * particleRadius;

            ctx.beginPath();
            ctx.arc(particleX, particleY, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = "#ecb8ff";
            ctx.fill();
        }

        ctx.restore();
    }

    drawShield(ctx) {
        if (this.shieldCharges <= 0) {
            return;
        }

        const centerX = this.x + this.tileSize / 2;
        const centerY = this.y + this.tileSize / 2;
        const pulse = Math.sin(performance.now() / 120) * 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.tileSize * 0.46 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(50, 220, 255, 0.12)";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#35e6ff";
        ctx.shadowColor = "#00d9ff";
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
    }
}

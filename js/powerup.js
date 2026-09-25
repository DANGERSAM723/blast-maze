"use strict";

class PowerUp {
    constructor(column, row, type, tileSize) {
        this.column = column;
        this.row = row;
        this.type = type;
        this.tileSize = tileSize;
        this.x = column * tileSize;
        this.y = row * tileSize;
        this.active = true;
        this.animationTime = 0;
        this.spriteColumns = 10;

        this.frames = {
            bomb: 1,
            range: 3,
            speed: 5,
            shield: 6,
            phase: 4,
            remote: 0,
            special: 9,
            life: 8
        };

        this.image = new Image();
        this.image.src = "assets/sprites/powerups_sheet.png";

        /*
            Guarda los límites visibles de cada sprite.
            Esto elimina el espacio transparente que existe
            alrededor de algunos cuadros de la hoja.
        */
        this.spriteBounds = new Map();
    }

    update(deltaTime) {
        if (!this.active) {
            return;
        }

        this.animationTime += deltaTime;
    }

    touchesPlayer(player) {
        if (!this.active) {
            return false;
        }

        const playerColumn = Math.floor(
            (player.x + this.tileSize / 2) / this.tileSize
        );

        const playerRow = Math.floor(
            (player.y + this.tileSize / 2) / this.tileSize
        );

        return playerColumn === this.column && playerRow === this.row;
    }

    collect() {
        this.active = false;
    }

    getVisibleBounds(frame, sourceWidth, sourceHeight) {
        if (this.spriteBounds.has(frame)) {
            return this.spriteBounds.get(frame);
        }

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", {
            willReadFrequently: true
        });

        canvas.width = Math.max(1, Math.round(sourceWidth));
        canvas.height = Math.max(1, Math.round(sourceHeight));

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(
            this.image,
            frame * sourceWidth,
            0,
            sourceWidth,
            sourceHeight,
            0,
            0,
            canvas.width,
            canvas.height
        );

        const pixels = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        ).data;

        let minimumX = canvas.width;
        let minimumY = canvas.height;
        let maximumX = -1;
        let maximumY = -1;

        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const alpha = pixels[(y * canvas.width + x) * 4 + 3];

                if (alpha > 12) {
                    minimumX = Math.min(minimumX, x);
                    minimumY = Math.min(minimumY, y);
                    maximumX = Math.max(maximumX, x);
                    maximumY = Math.max(maximumY, y);
                }
            }
        }

        const bounds = maximumX >= minimumX && maximumY >= minimumY
            ? {
                x: minimumX,
                y: minimumY,
                width: maximumX - minimumX + 1,
                height: maximumY - minimumY + 1
            }
            : {
                x: 0,
                y: 0,
                width: sourceWidth,
                height: sourceHeight
            };

        this.spriteBounds.set(frame, bounds);

        return bounds;
    }

    getAuraColor() {
        const colors = {
            bomb: "#ff9b32",
            range: "#c66cff",
            speed: "#55efff",
            shield: "#4ca8ff",
            phase: "#ea69ff",
            remote: "#ff5b72",
            special: "#ffe15b",
            life: "#ff4268"
        };

        return colors[this.type] || "#65efff";
    }

    drawPowerUpBackdrop(ctx, floatingMovement) {
        const centerX = this.x + this.tileSize / 2;
        const centerY =
            this.y + this.tileSize / 2 + floatingMovement;
        const radius = this.tileSize * 0.43;
        const auraColor = this.getAuraColor();
        const pulse = 1 + Math.sin(this.animationTime / 170) * 0.04;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(pulse, pulse);

        /* Disco oscuro para separarlo de cualquier color de suelo. */
        const background = ctx.createRadialGradient(
            0,
            0,
            radius * 0.12,
            0,
            0,
            radius
        );
        background.addColorStop(0, "rgba(24, 31, 45, 0.94)");
        background.addColorStop(0.68, "rgba(5, 9, 17, 0.91)");
        background.addColorStop(1, "rgba(0, 0, 0, 0.56)");

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = background;
        ctx.fill();

        /* Aro luminoso propio de cada tipo de power-up. */
        ctx.shadowColor = auraColor;
        ctx.shadowBlur = 11;
        ctx.strokeStyle = auraColor;
        ctx.globalAlpha = 0.92;
        ctx.lineWidth = Math.max(2, this.tileSize * 0.055);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.73, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.30)";
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }

    drawCustomIcon(ctx, floatingMovement) {
        if (this.type === "life") {
            this.drawLifeIcon(ctx, floatingMovement);
            return true;
        }

        if (this.type === "speed") {
            this.drawSpeedIcon(ctx, floatingMovement);
            return true;
        }

        if (this.type === "range") {
            this.drawRangeIcon(ctx, floatingMovement);
            return true;
        }

        return false;
    }

    prepareIconContext(ctx, floatingMovement) {
        const centerX = this.x + this.tileSize / 2;
        const centerY =
            this.y + this.tileSize / 2 + floatingMovement;
        const scale = this.tileSize / 48;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        return scale;
    }

    drawLifeIcon(ctx, floatingMovement) {
        this.prepareIconContext(ctx, floatingMovement);

        const pulse = 1 + Math.sin(this.animationTime / 130) * 0.05;
        ctx.scale(pulse, pulse);
        ctx.shadowColor = "#ff315f";
        ctx.shadowBlur = 12;

        const gradient = ctx.createLinearGradient(0, -17, 0, 19);
        gradient.addColorStop(0, "#ff7891");
        gradient.addColorStop(0.42, "#ff244f");
        gradient.addColorStop(1, "#9d0028");

        ctx.beginPath();
        ctx.moveTo(0, 19);
        ctx.bezierCurveTo(-4, 14, -19, 5, -19, -7);
        ctx.bezierCurveTo(-19, -18, -5, -22, 0, -12);
        ctx.bezierCurveTo(5, -22, 19, -18, 19, -7);
        ctx.bezierCurveTo(19, 5, 4, 14, 0, 19);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffd5df";
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-11, -10);
        ctx.bezierCurveTo(-8, -14, -4, -14, -2, -10);
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
    }

    drawSpeedIcon(ctx, floatingMovement) {
        this.prepareIconContext(ctx, floatingMovement);

        ctx.shadowColor = "#63efff";
        ctx.shadowBlur = 10;

        /* Alas izquierda y derecha. */
        ctx.fillStyle = "#eefeff";
        ctx.strokeStyle = "#5fe6ff";
        ctx.lineWidth = 1.7;

        ctx.beginPath();
        ctx.moveTo(-10, -10);
        ctx.quadraticCurveTo(-22, -19, -22, -7);
        ctx.quadraticCurveTo(-17, -11, -12, -4);
        ctx.quadraticCurveTo(-22, -8, -20, 3);
        ctx.quadraticCurveTo(-15, 0, -10, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(10, -9);
        ctx.quadraticCurveTo(22, -17, 22, -5);
        ctx.quadraticCurveTo(17, -10, 12, -3);
        ctx.quadraticCurveTo(22, -6, 20, 5);
        ctx.quadraticCurveTo(15, 1, 10, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        /* Zapato espacial. */
        const bootGradient = ctx.createLinearGradient(-10, -15, 13, 17);
        bootGradient.addColorStop(0, "#ffe76a");
        bootGradient.addColorStop(0.5, "#ff9d22");
        bootGradient.addColorStop(1, "#d54318");

        ctx.beginPath();
        ctx.moveTo(-8, -16);
        ctx.lineTo(7, -14);
        ctx.lineTo(5, 2);
        ctx.quadraticCurveTo(9, 7, 17, 9);
        ctx.quadraticCurveTo(21, 11, 18, 16);
        ctx.lineTo(-4, 16);
        ctx.quadraticCurveTo(-11, 15, -11, 9);
        ctx.closePath();
        ctx.fillStyle = bootGradient;
        ctx.fill();
        ctx.strokeStyle = "#fff2a5";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-5, -8);
        ctx.lineTo(5, -7);
        ctx.moveTo(-5, -2);
        ctx.lineTo(4, -1);
        ctx.strokeStyle = "#6e2d22";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    drawRangeIcon(ctx, floatingMovement) {
        this.prepareIconContext(ctx, floatingMovement);

        const pulse = 1 + Math.sin(this.animationTime / 150) * 0.06;
        ctx.scale(pulse, pulse);
        ctx.shadowColor = "#b55cff";
        ctx.shadowBlur = 13;

        /* Opción de alcance: mira energética con cuatro rayos. */
        ctx.strokeStyle = "#d88aff";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.strokeStyle = "#63f4ff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.strokeStyle = "#f2c0ff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(0, -12);
        ctx.moveTo(0, 12);
        ctx.lineTo(0, 22);
        ctx.moveTo(-22, 0);
        ctx.lineTo(-12, 0);
        ctx.moveTo(12, 0);
        ctx.lineTo(22, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.restore();
    }

    draw(ctx) {
        if (!this.active) {
            return;
        }

        const floatingMovement = Math.sin(this.animationTime / 180) * 2;

        this.drawPowerUpBackdrop(ctx, floatingMovement);

        if (this.drawCustomIcon(ctx, floatingMovement)) {
            return;
        }

        if (!this.image.complete || this.image.naturalWidth === 0) {
            return;
        }

        const sourceWidth = this.image.width / this.spriteColumns;
        const sourceHeight = this.image.height;
        const frame = this.frames[this.type] ?? 0;

        const bounds = this.getVisibleBounds(
            frame,
            sourceWidth,
            sourceHeight
        );

        /*
            Mantener la proporción original del sprite.
            Antes todos los power-ups se forzaban a un cuadrado,
            lo que deformaba especialmente los sprites anchos.
        */
        const maximumWidth = this.tileSize * 0.94;
        const maximumHeight = this.tileSize * 0.94;
        const scale = Math.min(
            maximumWidth / bounds.width,
            maximumHeight / bounds.height
        );

        const drawWidth = bounds.width * scale;
        const drawHeight = bounds.height * scale;
        const drawX = this.x + (this.tileSize - drawWidth) / 2;
        const drawY =
            this.y +
            (this.tileSize - drawHeight) / 2 +
            floatingMovement;

        ctx.save();
        const highlighted =
            this.type === "shield" ||
            this.type === "phase" ||
            this.type === "remote" ||
            this.type === "special";

        ctx.shadowColor =
            this.type === "phase" || this.type === "special"
                ? "#c35cff"
                : "#00eaff";
        ctx.shadowBlur = highlighted ? 16 : 10;
        ctx.imageSmoothingEnabled = false;

        ctx.drawImage(
            this.image,
            frame * sourceWidth + bounds.x,
            bounds.y,
            bounds.width,
            bounds.height,
            Math.round(drawX),
            Math.round(drawY),
            Math.round(drawWidth),
            Math.round(drawHeight)
        );

        ctx.restore();
    }
}

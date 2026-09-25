"use strict";

class Bomb {
    constructor(
        column,
        row,
        tileSize,
        map,
        range = 2,
        isSpecial = false
    ) {
        this.column = column;
        this.row = row;
        this.tileSize = tileSize;
        this.map = map;
        this.isSpecial = isSpecial;
        this.range = isSpecial ? range + 2 : range;
        this.state = "armed";
        this.finished = false;
        this.playerCanPass = true;
        this.fuseDuration = 3000;
        this.explosionDuration = 600;
        this.fuseTimer = 0;
        this.explosionTimer = 0;
        this.frameX = 0;
        this.frameTimer = 0;
        this.frameInterval = 150;
        this.spriteColumns = 8;
        this.explosionTiles = [];
        this.destroyedBlocks = [];
        this.powerUpsProcessed = false;
        this.explosionSoundPlayed = false;
        this.image = new Image();
        this.image.src = "assets/sprites/bomb_explosion_sheet.png";
    }

    update(deltaTime) {
        if (this.finished) return;

        if (this.state === "armed") {
            this.updateFuse(deltaTime);
        } else if (this.state === "exploding") {
            this.updateExplosion(deltaTime);
        }
    }

    updateFuse(deltaTime) {
        this.fuseTimer += deltaTime;
        this.frameTimer += deltaTime;

        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer = 0;
            this.frameX++;
            if (this.frameX > 3) this.frameX = 0;
        }

        if (this.fuseTimer >= this.fuseDuration) {
            this.explode();
        }
    }

    explode() {
        if (this.state === "exploding" || this.finished) {
            return false;
        }

        this.state = "exploding";
        this.explosionTimer = 0;
        this.frameTimer = 0;
        this.frameX = 4;
        this.playerCanPass = false;
        this.calculateExplosionTiles();
        return true;
    }

    forceExplode() {
        return this.explode();
    }

    calculateExplosionTiles() {
        this.explosionTiles = [
            { column: this.column, row: this.row }
        ];

        this.destroyedBlocks = [];

        const directions = [
            { column: 0, row: -1 },
            { column: 0, row: 1 },
            { column: -1, row: 0 },
            { column: 1, row: 0 }
        ];

        for (const direction of directions) {
            for (let distance = 1; distance <= this.range; distance++) {
                const nextColumn =
                    this.column + direction.column * distance;

                const nextRow =
                    this.row + direction.row * distance;

                if (
                    nextRow < 0 ||
                    nextRow >= this.map.length ||
                    nextColumn < 0 ||
                    nextColumn >= this.map[0].length
                ) {
                    break;
                }

                const tile = this.map[nextRow][nextColumn];

                /* Ninguna bomba puede atravesar muros permanentes. */
                if (tile === 1) {
                    break;
                }

                this.explosionTiles.push({
                    column: nextColumn,
                    row: nextRow
                });

                if (tile === 2) {
                    this.destroyedBlocks.push({
                        column: nextColumn,
                        row: nextRow
                    });

                    this.map[nextRow][nextColumn] = 0;

                    /* La bomba especial continúa después del bloque. */
                    if (!this.isSpecial) {
                        break;
                    }
                }
            }
        }
    }

    updateExplosion(deltaTime) {
        this.explosionTimer += deltaTime;
        this.frameTimer += deltaTime;

        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer = 0;
            this.frameX++;
            if (this.frameX > 7) this.frameX = 4;
        }

        if (this.explosionTimer >= this.explosionDuration) {
            this.finished = true;
        }
    }

    containsTile(column, row) {
        return this.explosionTiles.some(tile =>
            tile.column === column && tile.row === row
        );
    }

    draw(ctx) {
        if (
            this.finished ||
            !this.image.complete ||
            this.image.naturalWidth === 0
        ) {
            return;
        }

        if (this.state === "armed") {
            this.drawFrame(ctx, this.column, this.row);
            return;
        }

        for (const tile of this.explosionTiles) {
            this.drawFrame(ctx, tile.column, tile.row);
        }
    }

    drawFrame(ctx, column, row) {
        const sourceWidth = this.image.width / this.spriteColumns;
        const sourceHeight = this.image.height;

        ctx.save();

        if (this.isSpecial) {
            ctx.filter = "hue-rotate(95deg) saturate(1.8) brightness(1.15)";
            ctx.shadowColor = "#d65cff";
            ctx.shadowBlur = 12;
        }

        ctx.drawImage(
            this.image,
            this.frameX * sourceWidth,
            0,
            sourceWidth,
            sourceHeight,
            column * this.tileSize,
            row * this.tileSize,
            this.tileSize,
            this.tileSize
        );

        ctx.restore();
    }
}

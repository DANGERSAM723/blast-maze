    "use strict";

class RandomEnemy {

    constructor(column, row, tileSize, map) {

        this.column = column;
        this.row = row;

        this.tileSize = tileSize;
        this.map = map;

        this.x = column * tileSize;
        this.y = row * tileSize;

        this.targetX = this.x;
        this.targetY = this.y;

        this.speed = 65;

        this.direction = "down";
        this.previousDirection = "up";

        this.moving = false;
        this.alive = true;

        this.frameX = 0;
        this.frameY = 0;

        this.frameTimer = 0;
        this.frameInterval = 140;

        this.spriteColumns = 4;
        this.spriteRows = 4;

        this.image = new Image();

        this.image.src =
            "assets/sprites/enemy_random_sheet.png";
    }


    update(deltaTime) {

        if (!this.alive) {
            return;
        }


        if (!this.moving) {
            this.chooseDirection();
        }


        this.move(deltaTime);

        this.updateAnimation(deltaTime);
    }


    chooseDirection() {

        const possibleDirections = [];

        const directions = [
            {
                name: "up",
                rowChange: -1,
                columnChange: 0,
                opposite: "down"
            },
            {
                name: "down",
                rowChange: 1,
                columnChange: 0,
                opposite: "up"
            },
            {
                name: "left",
                rowChange: 0,
                columnChange: -1,
                opposite: "right"
            },
            {
                name: "right",
                rowChange: 0,
                columnChange: 1,
                opposite: "left"
            }
        ];


        directions.forEach((direction) => {

            const newRow =
                this.row + direction.rowChange;

            const newColumn =
                this.column + direction.columnChange;


            if (
                this.canMoveTo(newColumn, newRow)
            ) {
                possibleDirections.push(direction);
            }
        });


        if (possibleDirections.length === 0) {

            this.moving = false;

            return;
        }


        /*
            Si hay varias opciones se intenta evitar
            que el enemigo regrese inmediatamente.
        */

        let filteredDirections =
            possibleDirections.filter((direction) => {

                return (
                    direction.name !==
                    this.previousDirection
                );
            });


        if (filteredDirections.length === 0) {
            filteredDirections = possibleDirections;
        }


        const randomIndex = Math.floor(
            Math.random() * filteredDirections.length
        );


        const selectedDirection =
            filteredDirections[randomIndex];


        this.direction = selectedDirection.name;
        this.previousDirection =
            selectedDirection.opposite;


        const destinationColumn =
            this.column +
            selectedDirection.columnChange;

        const destinationRow =
            this.row +
            selectedDirection.rowChange;


        this.targetX =
            destinationColumn * this.tileSize;

        this.targetY =
            destinationRow * this.tileSize;


        this.moving = true;

        this.setAnimationRow();
    }


    canMoveTo(column, row) {

        if (
            row < 0 ||
            row >= this.map.length ||
            column < 0 ||
            column >= this.map[0].length
        ) {
            return false;
        }


        const tile = this.map[row][column];


        return tile === 0 || tile === 6;
    }


    move(deltaTime) {

        if (!this.moving) {
            return;
        }


        const movement =
            this.speed * (deltaTime / 1000);


        const differenceX =
            this.targetX - this.x;

        const differenceY =
            this.targetY - this.y;


        if (Math.abs(differenceX) > 0) {

            this.x +=
                Math.sign(differenceX) *
                Math.min(movement, Math.abs(differenceX));
        }


        if (Math.abs(differenceY) > 0) {

            this.y +=
                Math.sign(differenceY) *
                Math.min(movement, Math.abs(differenceY));
        }


        const reachedTarget =
            Math.abs(this.x - this.targetX) < 0.1 &&
            Math.abs(this.y - this.targetY) < 0.1;


        if (reachedTarget) {

            this.x = this.targetX;
            this.y = this.targetY;

            this.column =
                Math.round(this.x / this.tileSize);

            this.row =
                Math.round(this.y / this.tileSize);

            this.moving = false;
        }
    }


    setAnimationRow() {

        const rows = {
            down: 0,
            left: 1,
            right: 2,
            up: 3
        };


        this.frameY = rows[this.direction];
    }


    updateAnimation(deltaTime) {

        if (!this.moving) {

            this.frameX = 0;

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


    getCurrentTile() {

        const centerX =
            this.x + this.tileSize / 2;

        const centerY =
            this.y + this.tileSize / 2;


        return {
            column: Math.floor(centerX / this.tileSize),
            row: Math.floor(centerY / this.tileSize)
        };
    }


    touchesPlayer(player) {

        const margin = 10;

        return (
            this.x + margin <
                player.x + this.tileSize - margin &&

            this.x + this.tileSize - margin >
                player.x + margin &&

            this.y + margin <
                player.y + this.tileSize - margin &&

            this.y + this.tileSize - margin >
                player.y + margin
        );
    }


    isInsideExplosion(explosionTiles) {

        const enemyTile = this.getCurrentTile();


        return explosionTiles.some((tile) => {

            return (
                tile.column === enemyTile.column &&
                tile.row === enemyTile.row
            );
        });
    }


    destroy() {
        this.alive = false;
    }


    draw(ctx) {

        if (
            !this.alive ||
            !this.image.complete ||
            this.image.naturalWidth === 0
        ) {
            return;
        }


        const sourceWidth =
            this.image.width / this.spriteColumns;

        const sourceHeight =
            this.image.height / this.spriteRows;

        const sourceX =
            this.frameX * sourceWidth;

        const sourceY =
            this.frameY * sourceHeight;


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
    }
}
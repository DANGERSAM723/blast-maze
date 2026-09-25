"use strict";

class BFSEnemy extends RandomEnemy {
    constructor(column, row, tileSize, map) {
        super(column, row, tileSize, map);

        this.image = new Image();
        this.image.src = "assets/sprites/enemy_bfs_sheet.png";

        this.speed = 75;
        this.scoreValue = 200;
        this.currentPath = [];

        /* Información utilizada por el Modo Debug. */
        this.algorithmName = "BFS";
        this.debugColor = "#35ff7a";
    }

    update(deltaTime, player) {
        if (!this.alive) {
            return;
        }

        /* La ruta se actualiza al terminar de recorrer una casilla. */
        if (!this.moving) {
            this.calculateNextMovement(player);
        }

        this.move(deltaTime);
        this.updateAnimation(deltaTime);
    }

    calculateNextMovement(player) {
        const playerColumn = Math.floor(
            (player.x + this.tileSize / 2) / this.tileSize
        );

        const playerRow = Math.floor(
            (player.y + this.tileSize / 2) / this.tileSize
        );

        this.currentPath = this.findPath(
            this.column,
            this.row,
            playerColumn,
            playerRow
        );

        if (this.currentPath.length > 0) {
            const nextTile = this.currentPath[0];
            this.prepareMovement(nextTile.column, nextTile.row);
        }
    }

    findPath(startColumn, startRow, targetColumn, targetRow) {
        const queue = [
            { column: startColumn, row: startRow }
        ];

        const visited = new Set();
        const parents = new Map();
        const startKey = `${startColumn},${startRow}`;

        visited.add(startKey);

        const directions = [
            { column: 0, row: -1 },
            { column: 0, row: 1 },
            { column: -1, row: 0 },
            { column: 1, row: 0 }
        ];

        while (queue.length > 0) {
            const current = queue.shift();

            if (
                current.column === targetColumn &&
                current.row === targetRow
            ) {
                return this.reconstructPath(
                    parents,
                    current,
                    startColumn,
                    startRow
                );
            }

            for (const direction of directions) {
                const nextColumn = current.column + direction.column;
                const nextRow = current.row + direction.row;
                const nextKey = `${nextColumn},${nextRow}`;

                if (
                    !visited.has(nextKey) &&
                    this.canMoveTo(nextColumn, nextRow)
                ) {
                    visited.add(nextKey);
                    parents.set(nextKey, current);
                    queue.push({
                        column: nextColumn,
                        row: nextRow
                    });
                }
            }
        }

        return [];
    }

    reconstructPath(parents, target, startColumn, startRow) {
        const path = [];
        let current = target;

        while (
            current.column !== startColumn ||
            current.row !== startRow
        ) {
            path.unshift(current);

            const currentKey = `${current.column},${current.row}`;
            current = parents.get(currentKey);

            if (!current) {
                return [];
            }
        }

        return path;
    }

    prepareMovement(destinationColumn, destinationRow) {
        const differenceColumn = destinationColumn - this.column;
        const differenceRow = destinationRow - this.row;

        if (differenceColumn === 1) {
            this.direction = "right";
        } else if (differenceColumn === -1) {
            this.direction = "left";
        } else if (differenceRow === 1) {
            this.direction = "down";
        } else if (differenceRow === -1) {
            this.direction = "up";
        }

        this.targetX = destinationColumn * this.tileSize;
        this.targetY = destinationRow * this.tileSize;
        this.moving = true;
        this.setAnimationRow();
    }
}

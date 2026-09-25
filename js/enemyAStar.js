"use strict";

class AStarEnemy extends BFSEnemy {
    constructor(column, row, tileSize, map) {
        super(column, row, tileSize, map);

        this.image = new Image();
        this.image.src = "assets/sprites/enemy_astar_sheet.png";

        this.speed = 85;
        this.scoreValue = 300;

        /* Información utilizada por el Modo Debug. */
        this.algorithmName = "A*";
        this.debugColor = "#ff9f1c";
    }

    /*
        A* utiliza:
        g = distancia recorrida desde el inicio.
        h = distancia estimada hasta el jugador.
        f = g + h.
    */
    findPath(startColumn, startRow, targetColumn, targetRow) {
        const start = {
            column: startColumn,
            row: startRow
        };

        const openList = [start];
        const closedList = new Set();
        const parents = new Map();
        const gScore = new Map();
        const fScore = new Map();
        const startKey = this.createKey(startColumn, startRow);

        gScore.set(startKey, 0);
        fScore.set(
            startKey,
            this.manhattanDistance(
                startColumn,
                startRow,
                targetColumn,
                targetRow
            )
        );

        const directions = [
            { column: 0, row: -1 },
            { column: 0, row: 1 },
            { column: -1, row: 0 },
            { column: 1, row: 0 }
        ];

        while (openList.length > 0) {
            let bestIndex = 0;

            for (let index = 1; index < openList.length; index++) {
                const currentKey = this.createKey(
                    openList[index].column,
                    openList[index].row
                );

                const bestKey = this.createKey(
                    openList[bestIndex].column,
                    openList[bestIndex].row
                );

                if (fScore.get(currentKey) < fScore.get(bestKey)) {
                    bestIndex = index;
                }
            }

            const current = openList.splice(bestIndex, 1)[0];
            const currentKey = this.createKey(
                current.column,
                current.row
            );

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

            closedList.add(currentKey);

            for (const direction of directions) {
                const nextColumn = current.column + direction.column;
                const nextRow = current.row + direction.row;
                const nextKey = this.createKey(nextColumn, nextRow);

                if (
                    !this.canMoveTo(nextColumn, nextRow) ||
                    closedList.has(nextKey)
                ) {
                    continue;
                }

                const tentativeG = gScore.get(currentKey) + 1;
                const previousG = gScore.has(nextKey)
                    ? gScore.get(nextKey)
                    : Infinity;

                if (tentativeG < previousG) {
                    parents.set(nextKey, current);
                    gScore.set(nextKey, tentativeG);

                    const heuristic = this.manhattanDistance(
                        nextColumn,
                        nextRow,
                        targetColumn,
                        targetRow
                    );

                    fScore.set(nextKey, tentativeG + heuristic);

                    const alreadyOpen = openList.some(node =>
                        node.column === nextColumn &&
                        node.row === nextRow
                    );

                    if (!alreadyOpen) {
                        openList.push({
                            column: nextColumn,
                            row: nextRow
                        });
                    }
                }
            }
        }

        return [];
    }

    manhattanDistance(columnA, rowA, columnB, rowB) {
        return (
            Math.abs(columnA - columnB) +
            Math.abs(rowA - rowB)
        );
    }

    createKey(column, row) {
        return `${column},${row}`;
    }
}

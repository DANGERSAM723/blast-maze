"use strict";

/* 0 = piso, 1 = muro indestructible, 2 = bloque destructible. */
class MazeGenerator {
    constructor(rows = 11, columns = 15) {
        this.rows = rows;
        this.columns = columns;
        this.FLOOR = 0;
        this.WALL = 1;
        this.BLOCK = 2;
    }

    generate(level = 1) {
        const map = this.createBaseMap();
        const playerStart = { column: 1, row: 1 };
        const enemySpawns = this.createEnemySpawns(level, playerStart);
        const protectedTiles = this.createProtectedTiles(playerStart, enemySpawns);

        this.placeDestructibleBlocks(map, level, protectedTiles);
        const exit = this.chooseExit(map, protectedTiles);
        map[exit.row][exit.column] = this.BLOCK;

        return { map, playerStart, enemySpawns, exit };
    }

    createEnemySpawns(level, playerStart) {
        const INITIAL_ENEMIES = 6;
        const MAXIMUM_ENEMIES = 18;
        const desiredAmount = Math.min(
            INITIAL_ENEMIES + Math.max(0, level - 1),
            MAXIMUM_ENEMIES
        );
        const candidates = [];

        for (let row = 1; row < this.rows - 1; row++) {
            for (let column = 1; column < this.columns - 1; column++) {
                const fixedWall = row % 2 === 0 && column % 2 === 0;
                const distanceFromPlayer =
                    Math.abs(column - playerStart.column) +
                    Math.abs(row - playerStart.row);

                if (!fixedWall && distanceFromPlayer >= 6) {
                    candidates.push({ column, row });
                }
            }
        }

        for (let index = candidates.length - 1; index > 0; index--) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [candidates[index], candidates[randomIndex]] =
                [candidates[randomIndex], candidates[index]];
        }

        const positions = [];
        const used = new Set();
        const addPosition = position => {
            const key = `${position.column},${position.row}`;
            if (!used.has(key) && positions.length < desiredAmount) {
                used.add(key);
                positions.push(position);
            }
        };

        candidates.forEach(addPosition);

        return positions;
    }

    createBaseMap() {
        const map = [];
        for (let row = 0; row < this.rows; row++) {
            const currentRow = [];
            for (let column = 0; column < this.columns; column++) {
                const border = row === 0 || row === this.rows - 1 ||
                    column === 0 || column === this.columns - 1;
                const fixedWall = row % 2 === 0 && column % 2 === 0;
                currentRow.push(border || fixedWall ? this.WALL : this.FLOOR);
            }
            map.push(currentRow);
        }
        return map;
    }

    createProtectedTiles(playerStart, enemySpawns) {
        const protectedTiles = new Set();
        const protect = (column, row) => {
            if (column > 0 && column < this.columns - 1 &&
                row > 0 && row < this.rows - 1) {
                protectedTiles.add(`${column},${row}`);
            }
        };

        protect(playerStart.column, playerStart.row);
        protect(playerStart.column + 1, playerStart.row);
        protect(playerStart.column, playerStart.row + 1);

        enemySpawns.forEach(spawn => {
            protect(spawn.column, spawn.row);
            const possibleExits = [
                { column: spawn.column - 1, row: spawn.row },
                { column: spawn.column + 1, row: spawn.row },
                { column: spawn.column, row: spawn.row - 1 },
                { column: spawn.column, row: spawn.row + 1 }
            ];
            const validExit = possibleExits.find(position => {
                const inside = position.column > 0 && position.column < this.columns - 1 &&
                    position.row > 0 && position.row < this.rows - 1;
                const fixedWall = position.column % 2 === 0 && position.row % 2 === 0;
                return inside && !fixedWall;
            });
            if (validExit) protect(validExit.column, validExit.row);
        });
        return protectedTiles;
    }

    placeDestructibleBlocks(map, level, protectedTiles) {
        const probability = Math.min(0.34 + (level - 1) * 0.025, 0.64);
        for (let row = 1; row < this.rows - 1; row++) {
            for (let column = 1; column < this.columns - 1; column++) {
                const key = `${column},${row}`;
                if (map[row][column] === this.FLOOR &&
                    !protectedTiles.has(key) && Math.random() < probability) {
                    map[row][column] = this.BLOCK;
                }
            }
        }
    }

    chooseExit(map, protectedTiles) {
        const candidates = [];
        for (let row = 1; row < this.rows - 1; row++) {
            for (let column = 1; column < this.columns - 1; column++) {
                const distance = Math.abs(column - 1) + Math.abs(row - 1);
                if (map[row][column] !== this.WALL &&
                    !protectedTiles.has(`${column},${row}`) && distance >= 7) {
                    candidates.push({ column, row });
                }
            }
        }
        return candidates.length > 0
            ? candidates[Math.floor(Math.random() * candidates.length)]
            : { column: this.columns - 2, row: this.rows - 3 };
    }
}

const mazeGenerator = new MazeGenerator(11, 19);
function generateLevel(level) {
    return mazeGenerator.generate(level);
}

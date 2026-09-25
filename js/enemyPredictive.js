
"use strict";

class PredictiveEnemy extends AStarEnemy {

    constructor(column, row, tileSize, map) {

        super(column, row, tileSize, map);

        this.image = new Image();
        this.image.src =
            "assets/sprites/enemy_predictive_sheet.png";

        this.speed = 90;
        this.scoreValue = 400;

        /*
            Cantidad máxima de casillas que el enemigo
            intentará adelantarse al jugador.
        */

        this.predictionDistance = 3;
    }


    /*
        Reemplaza el método utilizado por BFS y A*.

        En vez de buscar directamente la casilla actual
        del jugador, calcula una casilla adelantada.
    */

    calculateNextMovement(player) {

        const playerColumn = Math.floor(
            (player.x + this.tileSize / 2) /
            this.tileSize
        );

        const playerRow = Math.floor(
            (player.y + this.tileSize / 2) /
            this.tileSize
        );


        const prediction = this.getPredictionTarget(
            player,
            playerColumn,
            playerRow
        );


        this.currentPath = this.findPath(
            this.column,
            this.row,
            prediction.column,
            prediction.row
        );


        /*
            Si la posición predicha no tiene una ruta,
            buscar directamente la posición actual.
        */

        if (this.currentPath.length === 0) {

            this.currentPath = this.findPath(
                this.column,
                this.row,
                playerColumn,
                playerRow
            );
        }


        if (this.currentPath.length > 0) {

            const nextTile =
                this.currentPath[0];

            this.prepareMovement(
                nextTile.column,
                nextTile.row
            );
        }
    }


    /*
        Determina hacia dónde está mirando el jugador.

        En player.js se utilizan las filas:
        0 = abajo
        1 = izquierda
        2 = derecha
        3 = arriba
    */

    getPlayerDirection(player) {

        const directions = {
            0: {
                column: 0,
                row: 1
            },

            1: {
                column: -1,
                row: 0
            },

            2: {
                column: 1,
                row: 0
            },

            3: {
                column: 0,
                row: -1
            }
        };


        return directions[player.frameY] || {
            column: 0,
            row: 0
        };
    }


    /*
        Busca una casilla válida delante del jugador.

        Primero intenta predecir tres casillas.
        Si existe un obstáculo, prueba dos y después una.
    */

    getPredictionTarget(
        player,
        playerColumn,
        playerRow
    ) {

        const direction =
            this.getPlayerDirection(player);


        for (
            let distance =
                this.predictionDistance;

            distance >= 1;

            distance--
        ) {

            const predictedColumn =
                playerColumn +
                direction.column * distance;

            const predictedRow =
                playerRow +
                direction.row * distance;


            if (
                this.canMoveTo(
                    predictedColumn,
                    predictedRow
                )
            ) {
                return {
                    column: predictedColumn,
                    row: predictedRow
                };
            }
        }


        /*
            Si todas las casillas adelantadas están
            bloqueadas, perseguirá la casilla actual.
        */

        return {
            column: playerColumn,
            row: playerRow
        };
    }
}
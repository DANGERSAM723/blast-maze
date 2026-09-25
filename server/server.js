
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const DATA_DIRECTORY = path.join(__dirname, "data");
const SCORES_FILE = path.join(DATA_DIRECTORY, "scores.json");
const MAX_BODY_SIZE = 100000;

function ensureDataFile() {
    if (!fs.existsSync(DATA_DIRECTORY)) {
        fs.mkdirSync(DATA_DIRECTORY, { recursive: true });
    }

    if (!fs.existsSync(SCORES_FILE)) {
        fs.writeFileSync(SCORES_FILE, "[]\n", "utf8");
    }
}

function readScores() {
    ensureDataFile();

    try {
        const content = fs.readFileSync(SCORES_FILE, "utf8");
        const scores = JSON.parse(content);
        return Array.isArray(scores) ? scores : [];
    } catch (error) {
        console.error("No se pudo leer scores.json:", error.message);
        return [];
    }
}

function writeScores(scores) {
    fs.writeFileSync(
        SCORES_FILE,
        `${JSON.stringify(scores, null, 4)}\n`,
        "utf8"
    );
}

function sendJson(response, statusCode, data) {
    response.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    });

    response.end(JSON.stringify(data));
}

function normalizeInteger(value, minimum = 0) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return minimum;
    }

    return Math.max(minimum, Math.floor(number));
}

function createScore(data) {
    return {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        puntuacion: normalizeInteger(data.puntuacion),
        nivelMaximo: normalizeInteger(data.nivelMaximo, 1),
        enemigosEliminados: normalizeInteger(data.enemigosEliminados),
        duracionSegundos: normalizeInteger(data.duracionSegundos),
        mayorReaccionCadena: normalizeInteger(data.mayorReaccionCadena),
        fecha: new Date().toISOString()
    };
}

function handlePostScore(request, response) {
    let body = "";

    request.on("data", chunk => {
        body += chunk;

        if (body.length > MAX_BODY_SIZE) {
            request.destroy();
        }
    });

    request.on("end", () => {
        try {
            const data = JSON.parse(body || "{}");
            const score = createScore(data);
            const scores = readScores();

            scores.push(score);

            /* Se conservan las 1000 partidas más recientes. */
            const recentScores = scores.slice(-1000);
            writeScores(recentScores);

            sendJson(response, 201, {
                message: "Estadísticas guardadas correctamente.",
                score
            });
        } catch (error) {
            sendJson(response, 400, {
                error: "Los datos enviados no son válidos."
            });
        }
    });

    request.on("error", () => {
        if (!response.headersSent) {
            sendJson(response, 400, {
                error: "No se pudo recibir la solicitud."
            });
        }
    });
}

const server = http.createServer((request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "OPTIONS") {
        sendJson(response, 204, {});
        return;
    }

    if (url.pathname === "/api/scores" && request.method === "GET") {
        const scores = readScores().sort(
            (a, b) => b.puntuacion - a.puntuacion
        );

        sendJson(response, 200, scores);
        return;
    }

    if (url.pathname === "/api/scores" && request.method === "POST") {
        handlePostScore(request, response);
        return;
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
        sendJson(response, 200, {
            status: "ok",
            message: "Servidor de Blast Maze activo."
        });
        return;
    }

    sendJson(response, 404, {
        error: "Ruta no encontrada."
    });
});

ensureDataFile();

server.listen(PORT, () => {
    console.log("========================================");
    console.log(" Servidor de Blast Maze iniciado");
    console.log(` http://localhost:${PORT}`);
    console.log(" Estadísticas: /api/scores");
    console.log("========================================");
});

server.on("error", error => {
    if (error.code === "EADDRINUSE") {
        console.error(`El puerto ${PORT} ya está siendo utilizado.`);
    } else {
        console.error("Error del servidor:", error.message);
    }
});

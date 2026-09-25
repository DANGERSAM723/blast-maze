"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const messageElement = document.getElementById("mensaje");
const livesElement = document.getElementById("vidas");
const pointsElement = document.getElementById("puntos");
const levelElement = document.getElementById("nivel");
const timeElement = document.getElementById("tiempo");
const inventoryBombsElement = document.getElementById("inventarioBombas");
const inventoryRangeElement = document.getElementById("inventarioAlcance");
const inventorySpeedElement = document.getElementById("inventarioVelocidad");
const inventoryLivesElement = document.getElementById("inventarioVidas");
const inventoryShieldsElement = document.getElementById("inventarioEscudos");
const inventoryPhaseElement = document.getElementById("inventarioFase");
const inventoryRemoteElement = document.getElementById("inventarioRemotas");
const inventorySpecialElement = document.getElementById("inventarioEspeciales");

const menuInicio = document.getElementById("menuInicio");
const pantallaPausa = document.getElementById("pantallaPausa");
const pantallaNivel = document.getElementById("pantallaNivel");
const pantallaFinal = document.getElementById("pantallaFinal");
const mensajeNivel = document.getElementById("mensajeNivel");
const tituloFinal = document.getElementById("tituloFinal");
const mensajeFinal = document.getElementById("mensajeFinal");
const botonComenzar = document.getElementById("botonComenzar");
const botonContinuar = document.getElementById("botonContinuar");
const botonMenuPrincipal = document.getElementById("botonMenuPrincipal");
const botonSiguienteNivel = document.getElementById("botonSiguienteNivel");
const botonReiniciar = document.getElementById("botonReiniciar");
const botonInformacion = document.getElementById("botonInformacion");
const botonVolverMenu = document.getElementById("botonVolverMenu");
const pantallaInformacion = document.getElementById("pantallaInformacion");
const botonResultados = document.getElementById("botonResultados");
const pantallaResultados = document.getElementById("pantallaResultados");
const botonActualizarResultados = document.getElementById("botonActualizarResultados");
const botonVolverResultados = document.getElementById("botonVolverResultados");
const estadoResultados = document.getElementById("estadoResultados");
const cuerpoResultados = document.getElementById("cuerpoResultados");
const totalPartidasElement = document.getElementById("totalPartidas");
const mejorPuntuacionElement = document.getElementById("mejorPuntuacion");
const mejorNivelElement = document.getElementById("mejorNivel");
const mejorCadenaElement = document.getElementById("mejorCadena");

const TILE_SIZE = 48;
const TILE_TYPE = { FLOOR: 0, WALL: 1, BLOCK: 2 };
let levelData = generateLevel(1);
let levelMap = levelData.map;
let EXIT_COLUMN = levelData.exit.column;
let EXIT_ROW = levelData.exit.row;
const MAP_ROWS = levelMap.length;
const MAP_COLUMNS = levelMap[0].length;
canvas.width = MAP_COLUMNS * TILE_SIZE;
canvas.height = MAP_ROWS * TILE_SIZE;

let lives = 3;
let points = 0;
let level = 1;
let remainingTime = 120;
let gameStarted = false;
let gamePaused = false;
let waitingNextLevel = false;
let gameOver = false;
let gameWon = false;
let loopStarted = false;
let lastTime = 0;
let accumulatedSecond = 0;
let debugMode = false;

/* Estadísticas enviadas al servidor Node.js. */
const STATISTICS_API = "http://localhost:3000/api/scores";
let enemiesDefeated = 0;
let largestChainReaction = 0;
let gameStartTimestamp = 0;
let statisticsSaved = false;

let exitRevealed = false;
let exitFrame = 0;
let exitFrameTimer = 0;
const EXIT_FRAME_INTERVAL = 130;
const EXIT_SPRITE_COLUMNS = 6;

let maximumBombs = 1;
let bombRange = 2;
const MAXIMUM_BOMBS_LIMIT = 5;
const BOMB_RANGE_LIMIT = 6;
const PLAYER_SPEED_LIMIT = 240;
const LIVES_LIMIT = 5;
const POWER_UP_PROBABILITY = 0.35;

const PLAYER_START_X = TILE_SIZE;
const PLAYER_START_Y = TILE_SIZE;
function createPlayer() {
    return new Player(PLAYER_START_X, PLAYER_START_Y, TILE_SIZE, levelMap);
}
let player = createPlayer();

const INVULNERABILITY_TIME = 2000;
let playerInvulnerable = false;
let invulnerabilityEndTime = 0;
let bombs = [];
let enemies = [];
let powerUps = [];
let spacePressed = false;
const keys = {};

function playSound(effectName) {
    if (window.audioManager) window.audioManager.playEffect(effectName);
}

const tilesImage = new Image();
const exitImage = new Image();
const TILE_SHEET_COLUMNS = 4;
const TILE_SHEET_ROWS = 2;
const tileFrames = {
    floor: { column: 0, row: 0 },
    wall: { column: 1, row: 0 },
    block: { column: 3, row: 0 }
};

function hideScreen(element) { element.classList.add("oculto"); }
function showScreen(element) { element.classList.remove("oculto"); }
function clearKeys() {
    Object.keys(keys).forEach(key => keys[key] = false);
    spacePressed = false;
}

botonComenzar.addEventListener("click", () => {
    hideScreen(menuInicio);
    gameStarted = true;
    gamePaused = false;
    lastTime = performance.now();
    if (gameStartTimestamp === 0) {
        gameStartTimestamp = Date.now();
    }
    messageElement.textContent = "Encuentra la salida y elimina a los enemigos.";
    canvas.focus();
});

botonContinuar.addEventListener("click", resumeGame);
botonMenuPrincipal.addEventListener("click", returnToMainMenu);
botonSiguienteNivel.addEventListener("click", startNextLevel);
botonReiniciar.addEventListener("click", restartGame);
botonInformacion.addEventListener("click", openInformation);
botonVolverMenu.addEventListener("click", closeInformation);
botonResultados.addEventListener("click", openResults);
botonActualizarResultados.addEventListener("click", loadResults);
botonVolverResultados.addEventListener("click", closeResults);

function openInformation() {
    hideScreen(menuInicio);
    showScreen(pantallaInformacion);
}

function closeInformation() {
    hideScreen(pantallaInformacion);
    showScreen(menuInicio);
    botonInformacion.focus();
}

function openResults() {
    hideScreen(menuInicio);
    showScreen(pantallaResultados);
    loadResults();
}

function closeResults() {
    hideScreen(pantallaResultados);
    showScreen(menuInicio);
    botonResultados.focus();
}

async function loadResults() {
    estadoResultados.textContent = "Cargando partidas guardadas...";
    botonActualizarResultados.disabled = true;

    try {
        const response = await fetch(STATISTICS_API, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const results = await response.json();
        renderResults(Array.isArray(results) ? results : []);
    } catch (error) {
        cuerpoResultados.replaceChildren();
        estadoResultados.textContent =
            "No se pudieron cargar los resultados. Inicia server.js y vuelve a intentarlo.";
        updateResultsSummary([]);
        console.error("Error al cargar resultados:", error);
    } finally {
        botonActualizarResultados.disabled = false;
    }
}

function renderResults(results) {
    cuerpoResultados.replaceChildren();
    updateResultsSummary(results);

    if (results.length === 0) {
        estadoResultados.textContent = "Todavía no existen partidas guardadas.";
        return;
    }

    estadoResultados.textContent =
        `Mostrando ${results.length} partida${results.length === 1 ? "" : "s"}.`;

    results.forEach((result, index) => {
        const row = document.createElement("tr");
        const values = [
            index + 1,
            result.puntuacion ?? 0,
            result.nivelMaximo ?? 1,
            result.enemigosEliminados ?? 0,
            formatDuration(result.duracionSegundos ?? 0),
            result.mayorReaccionCadena ?? 0,
            formatResultDate(result.fecha)
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        cuerpoResultados.appendChild(row);
    });
}

function updateResultsSummary(results) {
    const highestScore = results.reduce(
        (maximum, result) => Math.max(maximum, Number(result.puntuacion) || 0),
        0
    );
    const highestLevel = results.reduce(
        (maximum, result) => Math.max(maximum, Number(result.nivelMaximo) || 0),
        0
    );
    const highestChain = results.reduce(
        (maximum, result) => Math.max(maximum, Number(result.mayorReaccionCadena) || 0),
        0
    );

    totalPartidasElement.textContent = results.length;
    mejorPuntuacionElement.textContent = highestScore;
    mejorNivelElement.textContent = highestLevel;
    mejorCadenaElement.textContent = highestChain;
}

function formatDuration(totalSeconds) {
    const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatResultDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Sin fecha";
    }

    return date.toLocaleString("es-MX", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

function pauseGame() {
    if (!gameStarted || gameOver || waitingNextLevel) return;
    gamePaused = true;
    clearKeys();
    showScreen(pantallaPausa);
}

function resumeGame() {
    if (!gamePaused) return;
    gamePaused = false;
    lastTime = performance.now();
    hideScreen(pantallaPausa);
    messageElement.textContent = "Partida reanudada.";
}

function returnToMainMenu() {
    clearKeys();
    hideScreen(pantallaPausa);
    hideScreen(pantallaNivel);
    hideScreen(pantallaFinal);
    hideScreen(pantallaInformacion);
    hideScreen(pantallaResultados);

    lives = 3;
    points = 0;
    level = 1;
    remainingTime = 120;
    maximumBombs = 1;
    bombRange = 2;
    gameStarted = false;
    gamePaused = false;
    waitingNextLevel = false;
    gameOver = false;
    gameWon = false;
    accumulatedSecond = 0;
    lastTime = performance.now();
    playerInvulnerable = false;
    invulnerabilityEndTime = 0;
    enemiesDefeated = 0;
    largestChainReaction = 0;
    gameStartTimestamp = 0;
    statisticsSaved = false;
    exitRevealed = false;
    exitFrame = 0;
    exitFrameTimer = 0;

    generateCurrentLevel();
    player = createPlayer();
    bombs = [];
    powerUps = [];
    createEnemies();
    updateHUD();

    messageElement.textContent = "Presiona comenzar para iniciar.";
    showScreen(menuInicio);
    botonComenzar.focus();

    if (window.audioManager) {
        window.audioManager.playMenuMusic();
    }
}

window.addEventListener("keydown", event => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (event.code === "Space" || event.key.startsWith("Arrow")) event.preventDefault();

    if (event.key === "Escape") {
        if (!pantallaResultados.classList.contains("oculto")) {
            closeResults();
            return;
        }

        if (!pantallaInformacion.classList.contains("oculto")) {
            closeInformation();
            return;
        }
    }

    if (event.key === "F3") {
        event.preventDefault();
        debugMode = !debugMode;
        messageElement.textContent = debugMode
            ? "Modo Debug activado."
            : "Modo Debug desactivado.";
        return;
    }

    if (key === "p" && gameStarted && !gameOver && !waitingNextLevel) {
        gamePaused ? resumeGame() : pauseGame();
        return;
    }

    if (key === "r" && gameOver) {
        restartGame();
        return;
    }

    if (key === "e" && gameStarted && !gamePaused && !waitingNextLevel && !gameOver) {
        if (!event.repeat) detonateRemoteBomb();
        return;
    }

    if (key === "q" && gameStarted && !gamePaused && !waitingNextLevel && !gameOver) {
        if (!event.repeat) placeBomb(true);
        return;
    }

    if (!gameStarted || gamePaused || waitingNextLevel || gameOver) return;
    keys[key] = true;

    if (event.code === "Space" && !spacePressed) {
        spacePressed = true;
        placeBomb(false);
    }
});

window.addEventListener("keyup", event => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    keys[key] = false;
    if (event.code === "Space") spacePressed = false;
});
window.addEventListener("blur", () => {
    clearKeys();
    if (gameStarted && !gamePaused && !gameOver && !waitingNextLevel) pauseGame();
});

function createEnemies() {
    enemies = [];
    const positions = levelData.enemySpawns;
    const enemyTypes = [RandomEnemy, BFSEnemy, AStarEnemy, PredictiveEnemy];

    positions.forEach((position, index) => {
        const EnemyType = index < enemyTypes.length
            ? enemyTypes[index]
            : enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const enemy = new EnemyType(
            position.column,
            position.row,
            TILE_SIZE,
            levelMap
        );

        if (EnemyType === RandomEnemy) {
            enemy.scoreValue = 100;
        }

        enemies.push(enemy);
    });

    const levelsAfterMaximumEnemies = Math.max(0, level - 13);
    const multiplier = Math.min(
        1 + levelsAfterMaximumEnemies * 0.10,
        2.50
    );
    enemies.forEach(enemy => enemy.speed *= multiplier);
}

function generateCurrentLevel() {
    levelData = generateLevel(level);
    levelMap = levelData.map;
    EXIT_COLUMN = levelData.exit.column;
    EXIT_ROW = levelData.exit.row;
}

function drawTile(frame, x, y) {
    const sw = tilesImage.width / TILE_SHEET_COLUMNS;
    const sh = tilesImage.height / TILE_SHEET_ROWS;
    ctx.drawImage(tilesImage, frame.column * sw, frame.row * sh, sw, sh, x, y, TILE_SIZE, TILE_SIZE);
}

/*
    PALETA DINÁMICA DEL ESCENARIO

    Cada nivel utiliza un tono diferente. El ángulo áureo evita
    que los colores consecutivos se parezcan y permite generar
    niveles distintos indefinidamente.
*/
const floorTexture = document.createElement("canvas");
floorTexture.width = TILE_SIZE;
floorTexture.height = TILE_SIZE;
let floorTextureLevel = 0;

function getLevelPalette(levelNumber) {
    const hue = Math.round((210 + (levelNumber - 1) * 137.508) % 360);
    const secondaryHue = (hue + 48) % 360;

    return {
        hue,
        secondaryHue,
        floorLight: `hsl(${hue}, 48%, 88%)`,
        floorMiddle: `hsl(${hue}, 46%, 74%)`,
        floorDark: `hsl(${hue}, 42%, 58%)`,
        panelLight: `hsla(${secondaryHue}, 58%, 91%, 0.88)`,
        panelDark: `hsla(${hue}, 46%, 64%, 0.80)`,
        accent: `hsl(${secondaryHue}, 92%, 48%)`,
        accentDark: `hsl(${secondaryHue}, 72%, 30%)`,
        wallTint: `hsla(${hue}, 85%, 48%, 0.14)`,
        blockBorder: `hsl(${secondaryHue}, 92%, 66%)`
    };
}

function createFloorTexture(levelNumber) {
    const floorCtx = floorTexture.getContext("2d");
    const size = TILE_SIZE;
    const palette = getLevelPalette(levelNumber);

    floorTextureLevel = levelNumber;

    floorCtx.clearRect(0, 0, size, size);

    /* Base metálica clara y diferente para cada nivel. */
    const metalGradient = floorCtx.createLinearGradient(0, 0, size, size);
    metalGradient.addColorStop(0, palette.floorLight);
    metalGradient.addColorStop(0.34, palette.floorMiddle);
    metalGradient.addColorStop(0.72, palette.floorDark);
    metalGradient.addColorStop(1, palette.floorMiddle);
    floorCtx.fillStyle = metalGradient;
    floorCtx.fillRect(0, 0, size, size);

    /* Contorno negro para separar cada casilla. */
    floorCtx.strokeStyle = "#07090d";
    floorCtx.lineWidth = 4;
    floorCtx.strokeRect(2, 2, size - 4, size - 4);

    /* Marco energético que cambia de color en cada nivel. */
    const accentGradient = floorCtx.createLinearGradient(4, 4, size - 4, size - 4);
    accentGradient.addColorStop(0, palette.accent);
    accentGradient.addColorStop(0.52, palette.accentDark);
    accentGradient.addColorStop(1, palette.accent);
    floorCtx.strokeStyle = accentGradient;
    floorCtx.lineWidth = 2;
    floorCtx.strokeRect(5, 5, size - 10, size - 10);

    /* Panel central claro con suficiente variación para mostrar profundidad. */
    const panelGradient = floorCtx.createLinearGradient(8, 8, 8, size - 8);
    panelGradient.addColorStop(0, palette.panelLight);
    panelGradient.addColorStop(1, palette.panelDark);
    floorCtx.fillStyle = panelGradient;
    floorCtx.fillRect(8, 8, size - 16, size - 16);

    floorCtx.strokeStyle = "rgba(0, 0, 0, 0.68)";
    floorCtx.lineWidth = 1;
    floorCtx.strokeRect(8.5, 8.5, size - 17, size - 17);

    /* Líneas diagonales grabadas en el metal. */
    floorCtx.beginPath();
    floorCtx.moveTo(10, size - 15);
    floorCtx.lineTo(size - 15, 10);
    floorCtx.moveTo(15, size - 10);
    floorCtx.lineTo(size - 10, 15);
    floorCtx.strokeStyle = "rgba(255, 255, 255, 0.20)";
    floorCtx.lineWidth = 1;
    floorCtx.stroke();

    /* Cuatro remaches oscuros con brillo del color del nivel. */
    const rivets = [
        { x: 6, y: 6 },
        { x: size - 6, y: 6 },
        { x: 6, y: size - 6 },
        { x: size - 6, y: size - 6 }
    ];

    for (const rivet of rivets) {
        floorCtx.beginPath();
        floorCtx.arc(rivet.x, rivet.y, 2.3, 0, Math.PI * 2);
        floorCtx.fillStyle = "#181b20";
        floorCtx.fill();

        floorCtx.beginPath();
        floorCtx.arc(rivet.x - 0.5, rivet.y - 0.5, 0.8, 0, Math.PI * 2);
        floorCtx.fillStyle = palette.accent;
        floorCtx.fill();
    }
}

function drawFloorTile(x, y, row, column) {
    if (floorTextureLevel !== level) {
        createFloorTexture(level);
    }

    ctx.drawImage(floorTexture, x, y);

    /* Alternancia mínima para que el suelo no se vea completamente plano. */
    if ((row + column) % 2 === 1) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
        ctx.fillRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
    }
}

function drawWallTile(x, y) {
    const palette = getLevelPalette(level);

    drawTile(tileFrames.wall, x, y);
    ctx.fillStyle = palette.wallTint;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
}

function drawDestructibleBlock(x, y) {
    const palette = getLevelPalette(level);

    drawTile(tileFrames.block, x, y);

    /* Oscurece el bloque destruible para separarlo del suelo. */
    ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
    ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

    /* Borde luminoso que identifica que es un bloque distinto. */
    ctx.save();
    ctx.strokeStyle = palette.blockBorder;
    ctx.globalAlpha = 0.82;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);

    ctx.strokeStyle = "rgba(0, 0, 0, 0.88)";
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 6, y + 6, TILE_SIZE - 12, TILE_SIZE - 12);
    ctx.restore();
}

createFloorTexture(level);

function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < MAP_ROWS; row++) {
        for (let column = 0; column < MAP_COLUMNS; column++) {
            const tile = levelMap[row][column];
            const x = column * TILE_SIZE;
            const y = row * TILE_SIZE;
            drawFloorTile(x, y, row, column);
            if (tile === TILE_TYPE.WALL) drawWallTile(x, y);
            else if (tile === TILE_TYPE.BLOCK) drawDestructibleBlock(x, y);
        }
    }

    drawExit();
}

function updateExit(deltaTime) {
    if (!exitRevealed) return;
    exitFrameTimer += deltaTime;
    if (exitFrameTimer >= EXIT_FRAME_INTERVAL) {
        exitFrameTimer = 0;
        exitFrame = (exitFrame + 1) % EXIT_SPRITE_COLUMNS;
    }
}

function drawExit() {
    if (!exitRevealed || !exitImage.complete || exitImage.naturalWidth === 0) return;
    const sw = exitImage.width / EXIT_SPRITE_COLUMNS;
    ctx.save();
    if (enemies.length > 0) ctx.globalAlpha = 0.45;
    else { ctx.shadowColor = "#00eaff"; ctx.shadowBlur = 18; }
    ctx.drawImage(exitImage, exitFrame * sw, 0, sw, exitImage.height,
        EXIT_COLUMN * TILE_SIZE, EXIT_ROW * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.restore();
}

function checkExitCollision() {
    if (!exitRevealed || enemies.length > 0 || gameOver || waitingNextLevel) return;
    const column = Math.floor((player.x + TILE_SIZE / 2) / TILE_SIZE);
    const row = Math.floor((player.y + TILE_SIZE / 2) / TILE_SIZE);
    if (column === EXIT_COLUMN && row === EXIT_ROW) completeLevel();
}

function placeBomb(isSpecial = false) {
    if (isSpecial && player.specialBombs <= 0) {
        messageElement.textContent = "No tienes cargas de bomba especial.";
        return;
    }

    const activeBombs = bombs.filter(bomb => !bomb.finished).length;
    if (activeBombs >= maximumBombs) {
        messageElement.textContent = `Límite de bombas: ${maximumBombs}.`;
        return;
    }
    const column = Math.floor((player.x + TILE_SIZE / 2) / TILE_SIZE);
    const row = Math.floor((player.y + TILE_SIZE / 2) / TILE_SIZE);
    if (levelMap[row][column] !== TILE_TYPE.FLOOR) return;
    if (bombs.some(bomb => bomb.column === column && bomb.row === row && !bomb.finished)) return;
    bombs.push(
        new Bomb(
            column,
            row,
            TILE_SIZE,
            levelMap,
            bombRange,
            isSpecial
        )
    );

    if (isSpecial) {
        player.useSpecialBomb();
        updatePowerUpInventory();
    }

    playSound("bombPlace");
    messageElement.textContent = isSpecial
        ? `Bomba especial colocada. Cargas: ${player.specialBombs}.`
        : "Bomba colocada. ¡Aléjate!";
}

function detonateRemoteBomb() {
    if (player.remoteDetonations <= 0) {
        messageElement.textContent = "No tienes cargas de detonación remota.";
        return;
    }

    const remoteBomb = bombs.find(bomb =>
        !bomb.finished && bomb.state === "armed"
    );

    if (!remoteBomb) {
        messageElement.textContent = "Coloca una bomba antes de usar la detonación remota.";
        return;
    }

    if (remoteBomb.forceExplode()) {
        player.useRemoteDetonation();
        updatePowerUpInventory();
        messageElement.textContent =
            `Detonación remota activada. Cargas: ${player.remoteDetonations}.`;
    }
}

function updateBombs(deltaTime, currentTime) {
    bombs.forEach(bomb => bomb.update(deltaTime));
    activateChainReactions();
    bombs.forEach(bomb => {
        if (bomb.state === "exploding" && !bomb.finished) {
            if (!bomb.explosionSoundPlayed) {
                bomb.explosionSoundPlayed = true;
                playSound("explosion");
            }
            destroyPowerUpsWithExplosion(bomb);
            checkPlayerExplosionCollision(bomb, currentTime);
            checkEnemyExplosionCollision(bomb);
        }
    });
    bombs.forEach(bomb => { if (bomb.finished) processDestroyedBlocks(bomb); });
    bombs = bombs.filter(bomb => !bomb.finished);
}

function activateChainReactions() {
    const roots = bombs.filter(bomb =>
        bomb.state === "exploding" &&
        !bomb.finished &&
        !bomb.chainPropagationProcessed
    );

    roots.forEach(root => {
        const queue = [root];
        const processed = new Set();
        let chainSize = 0;

        while (queue.length > 0) {
            const exploding = queue.shift();

            if (processed.has(exploding)) {
                continue;
            }

            processed.add(exploding);
            exploding.chainPropagationProcessed = true;
            chainSize++;

            bombs.forEach(other => {
                if (
                    other !== exploding &&
                    !other.finished &&
                    other.state === "armed" &&
                    exploding.containsTile(other.column, other.row) &&
                    other.forceExplode()
                ) {
                    queue.push(other);
                }
            });
        }

        if (chainSize > 1) {
            largestChainReaction = Math.max(
                largestChainReaction,
                chainSize
            );

            messageElement.textContent =
                `¡Explosión en cadena de ${chainSize} bombas!`;
        }
    });
}

function drawBombs() { bombs.forEach(bomb => bomb.draw(ctx)); }

function processDestroyedBlocks(bomb) {
    if (bomb.powerUpsProcessed) return;
    bomb.powerUpsProcessed = true;
    const blocks = Array.isArray(bomb.destroyedBlocks) ? bomb.destroyedBlocks : [];
    blocks.forEach(block => {
        if (block.column === EXIT_COLUMN && block.row === EXIT_ROW) {
            exitRevealed = true;
            messageElement.textContent = "¡Salida descubierta! Elimina a todos los enemigos.";
            return;
        }
        if (Math.random() > POWER_UP_PROBABILITY) return;
        const types = [
            "bomb",
            "range",
            "speed",
            "shield",
            "phase",
            "remote",
            "special",
            "life"
        ];
        const type = types[Math.floor(Math.random() * types.length)];
        powerUps.push(new PowerUp(block.column, block.row, type, TILE_SIZE));
    });
}

function updatePowerUps(deltaTime) {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.update(deltaTime);
        if (powerUp.active && powerUp.touchesPlayer(player)) {
            applyPowerUp(powerUp);
            playSound("powerUp");
            powerUp.collect();
            powerUps.splice(i, 1);
        }
    }
}

function applyPowerUp(powerUp) {
    if (powerUp.type === "bomb" && maximumBombs < MAXIMUM_BOMBS_LIMIT) {
        maximumBombs++;
        messageElement.textContent = `Bombas simultáneas: ${maximumBombs}.`;
    } else if (powerUp.type === "range" && bombRange < BOMB_RANGE_LIMIT) {
        bombRange++;
        messageElement.textContent = `Alcance: ${bombRange}.`;
    } else if (powerUp.type === "speed" && player.speed < PLAYER_SPEED_LIMIT) {
        player.speed = Math.min(player.speed + 20, PLAYER_SPEED_LIMIT);
        messageElement.textContent = `Velocidad: ${player.speed}.`;
    } else if (powerUp.type === "life" && lives < LIVES_LIMIT) {
        lives++;
        updateHUD();
        messageElement.textContent = `Vida adicional. Vidas: ${lives}.`;
    } else if (powerUp.type === "shield") {
        const charges = player.addShield();
        messageElement.textContent = `Escudo activado. Cargas: ${charges}.`;
    } else if (powerUp.type === "phase") {
        player.activatePhase(8000);
        messageElement.textContent =
            "Modo fantasma activado: atraviesa bloques durante 8 segundos.";
    } else if (powerUp.type === "remote") {
        const charges = player.addRemoteDetonation();
        messageElement.textContent =
            `Detonación remota obtenida. Presiona E. Cargas: ${charges}.`;
    } else if (powerUp.type === "special") {
        const charges = player.addSpecialBomb();
        messageElement.textContent =
            `Bomba especial obtenida. Presiona Q. Cargas: ${charges}.`;
    } else {
        messageElement.textContent = "Esta mejora ya alcanzó su nivel máximo.";
    }

    updatePowerUpInventory();
}

function destroyPowerUpsWithExplosion(bomb) {
    powerUps = powerUps.filter(powerUp => !bomb.containsTile(powerUp.column, powerUp.row));
}
function drawPowerUps() { powerUps.forEach(powerUp => powerUp.draw(ctx)); }

function updateEnemies(deltaTime, currentTime) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.update(deltaTime, player);
        if (enemy.alive && enemy.touchesPlayer(player)) damagePlayer(currentTime);
        if (!enemy.alive) enemies.splice(i, 1);
    }
    if (enemies.length === 0) {
        messageElement.textContent = exitRevealed
            ? "Salida activada. Dirígete al portal."
            : "Elimina el bloque que oculta la salida.";
    }
}

function drawEnemies() { enemies.forEach(enemy => enemy.draw(ctx)); }

function checkEnemyExplosionCollision(bomb) {
    enemies.forEach(enemy => {
        if (enemy.alive && enemy.isInsideExplosion(bomb.explosionTiles)) {
            enemy.destroy();
            playSound("enemyDefeated");
            const earned = enemy.scoreValue || 100;
            points += earned;
            enemiesDefeated++;
            updateHUD();
            messageElement.textContent = `Enemigo destruido: +${earned}.`;
        }
    });
}

function checkPlayerExplosionCollision(bomb, currentTime) {
    if (playerInvulnerable || gameOver) return;
    const column = Math.floor((player.x + TILE_SIZE / 2) / TILE_SIZE);
    const row = Math.floor((player.y + TILE_SIZE / 2) / TILE_SIZE);
    if (bomb.containsTile(column, row)) damagePlayer(currentTime);
}

function damagePlayer(currentTime) {
    if (playerInvulnerable || gameOver) return;

    if (player.consumeShield()) {
        playerInvulnerable = true;
        invulnerabilityEndTime = currentTime + 1000;
        playSound("powerUp");
        messageElement.textContent =
            `El escudo absorbió el impacto. Cargas: ${player.shieldCharges}.`;
        updatePowerUpInventory();
        return;
    }

    lives--;
    playSound("damage");
    updateHUD();
    if (lives <= 0) { finishGame(false); return; }
    playerInvulnerable = true;
    invulnerabilityEndTime = currentTime + INVULNERABILITY_TIME;
    player.resetPosition();
    messageElement.textContent = `Daño recibido. Vidas: ${lives}.`;
}

function updateInvulnerability(currentTime) {
    if (playerInvulnerable && currentTime >= invulnerabilityEndTime) playerInvulnerable = false;
}

function drawPlayer(currentTime) {
    if (!playerInvulnerable || Math.floor(currentTime / 100) % 2 === 0) player.draw(ctx);
}

function drawDebugOverlay() {
    if (!debugMode) return;

    ctx.save();

    /* Cuadrícula y coordenadas de cada casilla. */
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0, 255, 255, 0.42)";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(210, 250, 255, 0.75)";

    for (let row = 0; row < MAP_ROWS; row++) {
        for (let column = 0; column < MAP_COLUMNS; column++) {
            const x = column * TILE_SIZE;
            const y = row * TILE_SIZE;
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillText(`${column},${row}`, x + 3, y + 3);
        }
    }

    drawDebugRoutes();

    /* Hitbox real del jugador. */
    const playerMargin = 8;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#00ff66";
    ctx.strokeRect(
        player.x + playerMargin,
        player.y + playerMargin,
        TILE_SIZE - playerMargin * 2,
        TILE_SIZE - playerMargin * 2
    );

    /* Centro y posición del jugador. */
    const playerCenterX = player.x + TILE_SIZE / 2;
    const playerCenterY = player.y + TILE_SIZE / 2;
    ctx.fillStyle = "#00ff66";
    ctx.beginPath();
    ctx.arc(playerCenterX, playerCenterY, 3, 0, Math.PI * 2);
    ctx.fill();

    /* Hitboxes y posiciones de los enemigos. */
    enemies.forEach((enemy, index) => {
        ctx.strokeStyle = "#ff3b4f";
        ctx.strokeRect(
            enemy.x + 7,
            enemy.y + 7,
            TILE_SIZE - 14,
            TILE_SIZE - 14
        );

        ctx.fillStyle = "#ffeb3b";
        ctx.font = "bold 11px monospace";
        ctx.fillText(`E${index + 1}`, enemy.x + 4, enemy.y + TILE_SIZE - 13);
    });

    /* Casillas ocupadas por bombas. */
    bombs.forEach(bomb => {
        ctx.lineWidth = 3;
        ctx.strokeStyle = bomb.isSpecial ? "#dc62ff" : "#ff9d00";
        ctx.strokeRect(
            bomb.column * TILE_SIZE + 4,
            bomb.row * TILE_SIZE + 4,
            TILE_SIZE - 8,
            TILE_SIZE - 8
        );
    });

    /* Casillas ocupadas por power-ups. */
    powerUps.forEach((powerUp, index) => {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#fff200";
        ctx.strokeRect(
            powerUp.column * TILE_SIZE + 9,
            powerUp.row * TILE_SIZE + 9,
            TILE_SIZE - 18,
            TILE_SIZE - 18
        );

        ctx.font = "bold 9px monospace";
        ctx.fillStyle = "#fff200";
        ctx.fillText(
            `P${index + 1}:${powerUp.type}`,
            powerUp.column * TILE_SIZE + 2,
            powerUp.row * TILE_SIZE + TILE_SIZE - 11
        );
    });

    drawDebugPanel();
    ctx.restore();
}

function drawDebugRoutes() {
    enemies.forEach(enemy => {
        if (
            !enemy.alive ||
            !Array.isArray(enemy.currentPath) ||
            enemy.currentPath.length === 0 ||
            !enemy.algorithmName
        ) {
            return;
        }

        const color = enemy.debugColor || "#ffffff";
        const startX = enemy.x + TILE_SIZE / 2;
        const startY = enemy.y + TILE_SIZE / 2;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, startY);

        enemy.currentPath.forEach(tile => {
            const centerX = tile.column * TILE_SIZE + TILE_SIZE / 2;
            const centerY = tile.row * TILE_SIZE + TILE_SIZE / 2;
            ctx.lineTo(centerX, centerY);
        });

        ctx.lineWidth = 4;
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.82;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.stroke();

        enemy.currentPath.forEach((tile, index) => {
            const centerX = tile.column * TILE_SIZE + TILE_SIZE / 2;
            const centerY = tile.row * TILE_SIZE + TILE_SIZE / 2;

            ctx.beginPath();
            ctx.arc(centerX, centerY, index === 0 ? 6 : 4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        });

        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = color;
        ctx.fillText(enemy.algorithmName, startX, startY - 18);
        ctx.restore();
    });
}

function drawDebugPanel() {
    const column = Math.floor((player.x + TILE_SIZE / 2) / TILE_SIZE);
    const row = Math.floor((player.y + TILE_SIZE / 2) / TILE_SIZE);

    const information = [
        "DEBUG F3",
        `Jugador: x=${player.x.toFixed(1)} y=${player.y.toFixed(1)}`,
        `Casilla: columna=${column} fila=${row}`,
        `Enemigos: ${enemies.length}`,
        `Bombas: ${bombs.length}/${maximumBombs}`,
        `Power-ups: ${powerUps.length}`,
        `Escudos: ${player.shieldCharges}`,
        `Remotas: ${player.remoteDetonations}`,
        `Especiales: ${player.specialBombs}`
    ];

    powerUps.slice(0, 6).forEach((powerUp, index) => {
        information.push(
            `P${index + 1} ${powerUp.type}: (${powerUp.column},${powerUp.row})`
        );
    });

    if (powerUps.length > 6) {
        information.push(`Otros power-ups: ${powerUps.length - 6}`);
    }

    enemies.forEach(enemy => {
        if (enemy.algorithmName && Array.isArray(enemy.currentPath)) {
            information.push(
                `${enemy.algorithmName}: ruta=${enemy.currentPath.length} casillas`
            );
        }
    });

    const panelWidth = 245;
    const panelHeight = information.length * 16 + 14;

    ctx.fillStyle = "rgba(0, 5, 18, 0.86)";
    ctx.fillRect(7, 7, panelWidth, panelHeight);
    ctx.strokeStyle = "#00eaff";
    ctx.lineWidth = 2;
    ctx.strokeRect(7, 7, panelWidth, panelHeight);

    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    information.forEach((text, index) => {
        ctx.fillStyle = index === 0 ? "#00eaff" : "#ffffff";
        ctx.fillText(text, 15, 14 + index * 16);
    });
}

function completeLevel() {
    points += 500 * level;
    updateHUD();
    clearKeys();

    waitingNextLevel = true;
    mensajeNivel.textContent = `Nivel ${level} superado. Bonificación: ${500 * level} puntos.`;
    showScreen(pantallaNivel);
}

function startNextLevel() {
    hideScreen(pantallaNivel);
    waitingNextLevel = false;
    level++;
    generateCurrentLevel();
    player.map = levelMap;
    player.resetPosition();
    bombs = [];
    enemies = [];
    powerUps = [];
    exitRevealed = false;
    exitFrame = 0;
    exitFrameTimer = 0;
    playerInvulnerable = false;
    remainingTime = Math.max(60, 120 - (level - 1) * 10);
    accumulatedSecond = 0;
    lastTime = performance.now();
    createEnemies();
    updateHUD();
    if (level <= 13) {
        messageElement.textContent =
            `Nivel ${level}: ${enemies.length} enemigos en posiciones aleatorias.`;
    } else {
        const speedIncrease = Math.min((level - 13) * 10, 150);
        messageElement.textContent =
            `Nivel ${level}: 18 enemigos, velocidad aumentada ${speedIncrease}%.`;
    }
}

function updateTimer(deltaTime) {
    accumulatedSecond += deltaTime;

    while (accumulatedSecond >= 1000) {
        accumulatedSecond -= 1000;
        remainingTime--;

        if (remainingTime <= 0) {
            remainingTime = 0;
            updateHUD();

            handleTimeExpired();
            return;
        }
    }

    updateHUD();
}

function handleTimeExpired() {
    lives--;
    playSound("damage");
    updateHUD();

    if (lives <= 0) {
        finishGame(false);
        return;
    }

    bombs = [];
    clearKeys();
    player.resetPosition();

    playerInvulnerable = true;
    invulnerabilityEndTime = performance.now() + INVULNERABILITY_TIME;

    remainingTime = Math.max(60, 120 - (level - 1) * 10);
    accumulatedSecond = 0;
    lastTime = performance.now();

    updateHUD();
    messageElement.textContent =
        `Tiempo agotado. Perdiste una vida. Vidas: ${lives}.`;
}

function updateHUD() {
    livesElement.textContent = lives;
    pointsElement.textContent = points;
    levelElement.textContent = level;
    timeElement.textContent = remainingTime;
    updatePowerUpInventory();
}

function updatePowerUpInventory() {
    if (!player) {
        return;
    }

    inventoryBombsElement.textContent = `+${Math.max(0, maximumBombs - 1)}`;
    inventoryRangeElement.textContent = `+${Math.max(0, bombRange - 2)}`;
    inventorySpeedElement.textContent =
        `+${Math.max(0, Math.round((player.speed - 150) / 20))}`;
    inventoryLivesElement.textContent = lives;
    inventoryShieldsElement.textContent = player.shieldCharges;
    inventoryPhaseElement.textContent = player.phaseActive ? "ON" : "OFF";
    inventoryRemoteElement.textContent = player.remoteDetonations;
    inventorySpecialElement.textContent = player.specialBombs;
}

function finishGame(victory) {
    gameWon = victory;
    gameOver = true;
    clearKeys();
    tituloFinal.textContent = victory ? "¡VICTORIA!" : "FIN DEL JUEGO";
    mensajeFinal.textContent = victory
        ? `Nivel máximo alcanzado: ${level}. Puntuación final: ${points}.`
        : `Puntuación obtenida: ${points}.`;
    messageElement.textContent = victory ? "¡Has completado Blast Maze!" : "La partida ha terminado.";
    showScreen(pantallaFinal);
    saveGameStatistics();
}

async function saveGameStatistics() {
    if (statisticsSaved) {
        return;
    }

    statisticsSaved = true;

    const start = gameStartTimestamp || Date.now();
    const durationSeconds = Math.max(
        0,
        Math.floor((Date.now() - start) / 1000)
    );

    const statistics = {
        puntuacion: points,
        nivelMaximo: level,
        enemigosEliminados: enemiesDefeated,
        duracionSegundos: durationSeconds,
        mayorReaccionCadena: largestChainReaction
    };

    try {
        const response = await fetch(STATISTICS_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(statistics),
            keepalive: true
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        console.log("Estadísticas guardadas:", statistics);
    } catch (error) {
        statisticsSaved = false;
        console.error(
            "No se pudieron guardar las estadísticas. Verifica que server.js esté ejecutándose.",
            error
        );
    }
}

function restartGame() {
    hideScreen(pantallaFinal);
    hideScreen(pantallaPausa);
    hideScreen(pantallaNivel);
    lives = 3;
    points = 0;
    level = 1;
    remainingTime = 120;
    maximumBombs = 1;
    bombRange = 2;
    gameOver = false;
    gameWon = false;
    gameStarted = true;
    gamePaused = false;
    waitingNextLevel = false;
    accumulatedSecond = 0;
    lastTime = performance.now();
    playerInvulnerable = false;
    enemiesDefeated = 0;
    largestChainReaction = 0;
    gameStartTimestamp = Date.now();
    statisticsSaved = false;
    exitRevealed = false;
    exitFrame = 0;
    exitFrameTimer = 0;
    generateCurrentLevel();
    player = createPlayer();
    bombs = [];
    powerUps = [];
    createEnemies();
    updateHUD();
    messageElement.textContent = "Nueva partida iniciada.";
}

function gameLoop(currentTime) {
    if (lastTime === 0) lastTime = currentTime;
    let deltaTime = Math.min(currentTime - lastTime, 100);
    lastTime = currentTime;

    if (gameStarted && !gamePaused && !waitingNextLevel && !gameOver) {
        player.update(keys, deltaTime, bombs);
        updateBombs(deltaTime, currentTime);
        updatePowerUps(deltaTime);
        updateEnemies(deltaTime, currentTime);
        updateExit(deltaTime);
        updateInvulnerability(currentTime);
        checkExitCollision();
        updateTimer(deltaTime);
    }

    drawMap();
    drawPowerUps();
    drawBombs();
    drawEnemies();
    drawPlayer(currentTime);
    drawDebugOverlay();
    requestAnimationFrame(gameLoop);
}

tilesImage.addEventListener("load", () => {
    createEnemies();
    updateHUD();
    messageElement.textContent = "Presiona comenzar para iniciar.";
    if (!loopStarted) {
        loopStarted = true;
        requestAnimationFrame(gameLoop);
    }
});

tilesImage.addEventListener("error", () => {
    messageElement.textContent = "Error al cargar tiles_sheet.png";
});

exitImage.addEventListener("error", () => console.error("No se encontró exit_sheet.png"));
tilesImage.src = "assets/sprites/tiles_sheet.png";
exitImage.src = "assets/sprites/exit_sheet.png";

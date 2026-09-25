
Blast Maze: Arena Bomber

Videojuego arcade web de laberintos generado por niveles. El jugador destruye bloques con bombas, elimina enemigos con distintas estrategias de búsqueda y localiza el portal para avanzar. Los resultados se guardan mediante un servidor Node.js.

Integrantes

David Domínguez

Yenni Lopez

Samuel Pantaleon

Nota de entrega: la consigna recibida indica equipos de dos; el equipo debe confirmar con el docente la participación de tres integrantes antes de entregar.

Tecnologías

HTML5, CSS3, JavaScript, Canvas 2D, Fetch API, Node.js y JSON. El servidor usa los módulos nativos http, fs y path. El desarrollo del juego no requiere motores ni frameworks.

Requisitos

Navegador moderno con HTML5 Canvas y audio.

Node.js instalado para consultar y guardar resultados.

Carpeta del proyecto con index.html, css/, js/, assets/ y server/.

Instalación y ejecución

Descarga o clona el repositorio en tu equipo.

Abre una terminal en la raíz del proyecto.

Ejecuta node server/server.js y deja esa terminal abierta.

Comprueba que http://localhost:3000/api/health devuelve status: "ok".

En Visual Studio Code abre index.html con Live Server. Su dirección habitual es http://127.0.0.1:5500/index.html.

Selecciona Comenzar partida.

No se necesita npm install: el servidor presentado utiliza módulos nativos de Node.js. Si cambias el puerto del backend, modifica también STATISTICS_API en js/main.js.

Controles

Tecla

Acción

W A S D o flechas

Mover al jugador

Espacio

Colocar bomba normal

Q

Colocar bomba especial, si hay cargas

E

Detonar una bomba armada, si hay cargas remotas

P

Pausar o continuar

M

Activar o silenciar el sonido

F3

Mostrar u ocultar el modo Debug

R

Reiniciar al terminar la partida

Juego

El primer nivel inicia con 6 enemigos y 120 segundos. En cada nivel se suma un enemigo hasta llegar a 18; desde el nivel 14 aumenta su velocidad. Hay enemigos aleatorios, BFS, A* y predictivos. Al romper bloques pueden aparecer mejoras de alcance, bombas simultáneas, velocidad, vida, escudo, fase, detonación remota y bomba especial. Para avanzar hay que eliminar a los enemigos y descubrir la salida oculta.

Estructura del proyecto

index.html                Interfaz y carga de scripts
css/styles.css            Estilos y pantallas
js/map.js                 Generación del laberinto
js/player.js              Movimiento, colisiones y habilidades
js/bomb.js                Bombas, explosiones y cadenas
js/enemy.js               Enemigo aleatorio y clase base
js/enemyBFS.js            Búsqueda en anchura
js/enemyAStar.js          Búsqueda A*
js/enemyPredictive.js     Comportamiento predictivo
js/powerup.js             Mejoras coleccionables
js/main.js                Bucle del juego, HUD y resultados
js/audio.js               Música y efectos
assets/sprites/           Hojas de sprites e iconos
assets/ui/                Marco de la interfaz espacial
assets/audio/             Música y efectos
server/server.js          API local
server/data/scores.json   Datos locales de las partidas

La carpeta server/data/ se crea automáticamente cuando se inicia el servidor. El repositorio debe conservar las carpetas y archivos reales de la copia final. Corrige cualquier nombre distinto en esta lista antes de publicarla.

Estadísticas y API

GET http://localhost:3000/api/health: estado del servidor.

GET http://localhost:3000/api/scores: listado de partidas ordenado por puntuación.

POST http://localhost:3000/api/scores: guarda puntuación, nivel máximo, enemigos eliminados, duración y mayor reacción en cadena.

Los resultados se consultan desde Resultados y estadísticas en el menú principal. El backend persiste hasta las 1000 partidas más recientes en server/data/scores.json.

Recursos y atribuciones

El inventario gráfico y técnico está en el documento técnico ProyectoVideojuego_Dominguez_Lopez_Pantaleon.pdf. Antes de hacer público este repositorio, completar para cada imagen y sonido la procedencia, autor, URL y licencia real. No asignar una licencia libre a archivos cuya licencia no se conoce. Si algún recurso no permite redistribución pública, reemplazarlo por otro autorizado.

Comprobaciones antes de entregar

Copia verificar-proyecto.js a la raíz y ejecuta node verificar-proyecto.js antes de publicar; el script detecta archivos faltantes, audios vacíos, errores de sintaxis y el ID del botón de audio.

Verificar que todos los scripts declarados en index.html existan en js/.

En la versión revisada el botón HTML usa botonAudio; asegurar que js/audio.js busque ese mismo identificador y comprobar clic y tecla M.

Confirmar que los MP3 y WAV tengan contenido y se reproduzcan.

Probar menú, nivel 1, las cuatro conductas de enemigos, ocho mejoras, pausa, portal, pantalla final y resultados.

Abrir el repositorio desde una ventana privada para comprobar que el enlace entregado sea accesible.

Documentación

El manual técnico explica la arquitectura, módulos, algoritmos, pruebas y recursos. El manual de usuario contiene instalación, controles y solución d
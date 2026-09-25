"use strict";

class AudioManager {
    constructor() {
        this.muted = false;
        this.musicVolume = 0.28;
        this.effectVolume = 0.65;
        this.finalSound = null;

        this.menuMusic = this.createAudio("assets/audio/menu.mp3", true, this.musicVolume);
        this.gameMusic = this.createAudio("assets/audio/game.mp3", true, this.musicVolume);

        this.effects = {
            bombPlace: this.createAudio("assets/audio/bomb-place.wav", false, this.effectVolume),
            explosion: this.createAudio("assets/audio/explosion.wav", false, this.effectVolume),
            powerUp: this.createAudio("assets/audio/powerup.wav", false, this.effectVolume),
            damage: this.createAudio("assets/audio/damage.wav", false, this.effectVolume),
            enemyDefeated: this.createAudio("assets/audio/enemy-defeated.wav", false, this.effectVolume),
            victory: this.createAudio("assets/audio/victory.wav", false, this.effectVolume),
            defeat: this.createAudio("assets/audio/defeat.wav", false, this.effectVolume)
        };

        this.configureControls();
        this.observeScreens();
    }

    createAudio(source, loop, volume) {
        const audio = new Audio(source);
        audio.loop = loop;
        audio.volume = volume;
        audio.preload = "auto";
        return audio;
    }

    safePlay(audio) {
        if (!audio || this.muted) return;
        const result = audio.play();
        if (result && typeof result.catch === "function") {
            result.catch(() => {});
        }
    }

    stopAudio(audio) {
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
    }

    stopMusic() {
        this.stopAudio(this.menuMusic);
        this.stopAudio(this.gameMusic);
    }

    playMenuMusic() {
        if (this.muted) return;
        this.stopAudio(this.gameMusic);
        this.menuMusic.currentTime = 0;
        this.safePlay(this.menuMusic);
    }

    playGameMusic() {
        if (this.muted) return;
        this.stopFinalSound();
        this.stopAudio(this.menuMusic);
        if (this.gameMusic.paused) this.safePlay(this.gameMusic);
    }

    pauseGameMusic() {
        this.gameMusic.pause();
    }

    resumeGameMusic() {
        if (!this.muted) this.safePlay(this.gameMusic);
    }

    playEffect(name, maximumDuration = 0) {
        const original = this.effects[name];
        if (!original || this.muted) return null;

        const sound = original.cloneNode(true);
        sound.volume = this.effectVolume;
        sound.currentTime = 0;
        this.safePlay(sound);

        if (maximumDuration > 0) {
            window.setTimeout(() => this.stopAudio(sound), maximumDuration);
        }

        return sound;
    }

    playFinalSound(name) {
        this.stopMusic();
        this.stopFinalSound();
        this.finalSound = this.playEffect(name);

        if (this.finalSound) {
            this.finalSound.loop = true;
        }
    }

    stopFinalSound() {
        if (!this.finalSound) return;
        this.stopAudio(this.finalSound);
        this.finalSound = null;
    }

    toggleMute() {
        this.muted = !this.muted;

        if (this.muted) {
            this.stopMusic();
            this.stopFinalSound();
        } else {
            const menu = document.getElementById("menuInicio");
            const finalScreen = document.getElementById("pantallaFinal");

            if (menu && !menu.classList.contains("oculto")) {
                this.playMenuMusic();
            } else if (!finalScreen || finalScreen.classList.contains("oculto")) {
                this.playGameMusic();
            }
        }

        this.updateMuteButton();
    }

    updateMuteButton() {
        const button = document.getElementById("botonAudio");
        if (!button) return;
        button.textContent = this.muted ? "🔇 Sonido" : "🔊 Sonido";
        button.setAttribute("aria-pressed", String(this.muted));
    }

    configureControls() {
        const startButton = document.getElementById("botonComenzar");
        const continueButton = document.getElementById("botonContinuar");
        const nextButton = document.getElementById("botonSiguienteNivel");
        const restartButton = document.getElementById("botonReiniciar");
        const soundButton = document.getElementById("botonSonido");

        if (startButton) startButton.addEventListener("click", () => this.playGameMusic());
        if (continueButton) continueButton.addEventListener("click", () => this.resumeGameMusic());
        if (nextButton) nextButton.addEventListener("click", () => this.playGameMusic());
        if (restartButton) restartButton.addEventListener("click", () => this.playGameMusic());
        if (soundButton) soundButton.addEventListener("click", () => this.toggleMute());

        window.addEventListener("keydown", event => {
            if (event.key.toLowerCase() === "m") this.toggleMute();
        });

        this.updateMuteButton();
    }

    observeScreens() {
        const pauseScreen = document.getElementById("pantallaPausa");
        const finalScreen = document.getElementById("pantallaFinal");

        if (pauseScreen) {
            new MutationObserver(() => {
                pauseScreen.classList.contains("oculto")
                    ? this.resumeGameMusic()
                    : this.pauseGameMusic();
            }).observe(pauseScreen, { attributes: true, attributeFilter: ["class"] });
        }

        if (finalScreen) {
            new MutationObserver(() => {
                if (finalScreen.classList.contains("oculto")) return;

                const title = document.getElementById("tituloFinal");
                const victory = title && title.textContent.includes("VICTORIA");
                this.playFinalSound(victory ? "victory" : "defeat");
            }).observe(finalScreen, { attributes: true, attributeFilter: ["class"] });
        }
    }
}

window.audioManager = new AudioManager();

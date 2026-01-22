export default class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.soundsEnabled = true;
        this.musicEnabled = true;
        this.volume = 0.5;
        
        // Create placeholder sounds (will be replaced with actual audio files)
        this.createPlaceholderSounds();
    }

    createPlaceholderSounds() {
        // These are placeholder - in a real game, you'd load actual audio files
        // For now, we'll use silent sounds that can be replaced later
        this.sounds = {
            shoot: null,
            enemyShoot: null,
            explosion: null,
            collect: null,
            bossHit: null,
            music: null
        };
    }

    playShoot() {
        if (this.soundsEnabled && this.sounds.shoot) {
            this.scene.sound.play('shoot', { volume: this.volume * 0.3 });
        }
    }

    playEnemyShoot() {
        if (this.soundsEnabled && this.sounds.enemyShoot) {
            this.scene.sound.play('enemyShoot', { volume: this.volume * 0.2 });
        }
    }

    playExplosion() {
        if (this.soundsEnabled && this.sounds.explosion) {
            this.scene.sound.play('explosion', { volume: this.volume * 0.5 });
        }
    }

    playCollect() {
        if (this.soundsEnabled && this.sounds.collect) {
            this.scene.sound.play('collect', { volume: this.volume * 0.4 });
        }
    }

    playBossHit() {
        if (this.soundsEnabled && this.sounds.bossHit) {
            this.scene.sound.play('bossHit', { volume: this.volume * 0.6 });
        }
    }

    playMusic() {
        if (this.musicEnabled && this.sounds.music) {
            this.sounds.music.play({ loop: true, volume: this.volume * 0.3 });
        }
    }

    stopMusic() {
        if (this.sounds.music) {
            this.sounds.music.stop();
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    toggleSounds() {
        this.soundsEnabled = !this.soundsEnabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.playMusic();
        } else {
            this.stopMusic();
        }
    }
}

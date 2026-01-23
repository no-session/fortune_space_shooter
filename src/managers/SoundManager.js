export default class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.soundsEnabled = true;
        this.musicEnabled = true;
        this.volume = 0.5;

        // Check which sounds are available
        this.sounds = {
            shoot: scene.cache.audio.exists('shoot'),
            enemyShoot: scene.cache.audio.exists('enemyShoot'),
            explosion: scene.cache.audio.exists('explosion'),
            explosionBig: scene.cache.audio.exists('explosionBig'),
            hit: scene.cache.audio.exists('hit'),
            collect: scene.cache.audio.exists('collect'),
            powerup: scene.cache.audio.exists('powerup')
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

    playExplosionBig() {
        if (this.soundsEnabled && this.sounds.explosionBig) {
            this.scene.sound.play('explosionBig', { volume: this.volume * 0.7 });
        }
    }

    playHit() {
        if (this.soundsEnabled && this.sounds.hit) {
            this.scene.sound.play('hit', { volume: this.volume * 0.4 });
        }
    }

    playCollect() {
        if (this.soundsEnabled && this.sounds.collect) {
            this.scene.sound.play('collect', { volume: this.volume * 0.4 });
        }
    }

    playPowerup() {
        if (this.soundsEnabled && this.sounds.powerup) {
            this.scene.sound.play('powerup', { volume: this.volume * 0.5 });
        }
    }

    // Alias for backward compatibility
    playBossHit() {
        this.playExplosionBig();
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    toggleSounds() {
        this.soundsEnabled = !this.soundsEnabled;
        return this.soundsEnabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        return this.musicEnabled;
    }
}

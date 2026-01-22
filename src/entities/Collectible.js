import Phaser from 'phaser';
import { COLLECTIBLE_TYPES, COLLECTIBLE_VALUES, GAME_CONFIG } from '../utils/constants.js';

export default class Collectible extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = COLLECTIBLE_TYPES.COIN) {
        const textureKey = `collectible-${type}`;
        super(scene, x, y, textureKey);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.type = type;
        this.value = COLLECTIBLE_VALUES[type];
        this.speed = GAME_CONFIG.COLLECTIBLE_SPEED;
        
        // Set velocity downward with slight drift
        const drift = (Math.random() - 0.5) * 50;
        this.setVelocity(drift, this.speed);
        
        // Visual effects
        this.setScale(1.2);
        
        // Rotation animation
        scene.tweens.add({
            targets: this,
            rotation: Math.PI * 2,
            duration: 1000,
            repeat: -1
        });
        
        // Pulse animation for rare collectibles
        if (type === COLLECTIBLE_TYPES.STAR || type === COLLECTIBLE_TYPES.FORTUNE_COIN) {
            scene.tweens.add({
                targets: this,
                scale: 1.5,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
    }

    update() {
        // Remove if off screen
        if (this.y > this.scene.scale.height + 50) {
            this.destroy();
        }
    }

    collect() {
        // Play collect sound
        if (this.scene.soundManager) {
            this.scene.soundManager.playCollect();
        }
        
        // Create collection effect
        const particles = this.scene.add.particles(this.x, this.y, 'collectible-coin', {
            speed: { min: 50, max: 100 },
            scale: { start: 0.5, end: 0 },
            lifespan: 300,
            quantity: 5
        });
        
        this.scene.time.delayedCall(300, () => {
            particles.destroy();
        });
        
        this.destroy();
    }
}

import Phaser from 'phaser';
import { COLLECTIBLE_TYPES, COLLECTIBLE_VALUES, GAME_CONFIG } from '../utils/constants.js';

// Texture mapping for collectibles
const COLLECTIBLE_TEXTURES = {
    [COLLECTIBLE_TYPES.COIN]: 'collectible-coin',
    [COLLECTIBLE_TYPES.CRYSTAL]: 'collectible-crystal',
    [COLLECTIBLE_TYPES.STAR]: 'collectible-star',
    [COLLECTIBLE_TYPES.FORTUNE_COIN]: 'collectible-fortune'
};

export default class Collectible extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = COLLECTIBLE_TYPES.COIN) {
        const textureKey = COLLECTIBLE_TEXTURES[type] || 'collectible-coin';
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
        this.setScale(0.8);
        this.setDepth(70);
        
        // Rotation animation
        scene.tweens.add({
            targets: this,
            rotation: Math.PI * 2,
            duration: 1500,
            repeat: -1
        });
        
        // Pulse animation for rare collectibles
        if (type === COLLECTIBLE_TYPES.STAR || type === COLLECTIBLE_TYPES.FORTUNE_COIN) {
            scene.tweens.add({
                targets: this,
                scale: 1.0,
                duration: 400,
                yoyo: true,
                repeat: -1
            });
            
            // Add glow effect for fortune coins
            if (type === COLLECTIBLE_TYPES.FORTUNE_COIN) {
                this.setTint(0xffd700);
            }
        }
        
        // Bobbing motion
        scene.tweens.add({
            targets: this,
            y: y + 10,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
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
        
        // Show score popup
        this.showScorePopup();
        
        // Create collection effect with particles
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const color = this.type === COLLECTIBLE_TYPES.CRYSTAL ? 0x00bfff : 0xffd700;
            const particle = this.scene.add.circle(this.x, this.y, 3, color);
            particle.setDepth(100);
            
            const distance = Phaser.Math.Between(20, 40);
            const targetX = this.x + Math.cos(angle) * distance;
            const targetY = this.y + Math.sin(angle) * distance;
            
            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                scale: 0,
                duration: 300,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
        
        this.destroy();
    }

    showScorePopup() {
        const scoreText = this.scene.add.text(this.x, this.y - 20, `+${this.value}`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: this.type === COLLECTIBLE_TYPES.FORTUNE_COIN ? '#ffd700' : '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        scoreText.setOrigin(0.5);
        scoreText.setDepth(150);
        
        this.scene.tweens.add({
            targets: scoreText,
            y: this.y - 50,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                scoreText.destroy();
            }
        });
    }
}

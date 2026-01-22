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
        this.value = COLLECTIBLE_VALUES[type] || 10;
        this.speed = GAME_CONFIG.COLLECTIBLE_SPEED;
        this.collected = false; // Prevent multiple collections
        this.tweens = []; // Store tweens for cleanup
        
        // Set velocity downward with slight drift
        const drift = (Math.random() - 0.5) * 50;
        this.setVelocity(drift, this.speed);
        
        // Visual effects
        this.setScale(0.8);
        this.setDepth(70);
        
        // Rotation animation
        const rotationTween = scene.tweens.add({
            targets: this,
            rotation: Math.PI * 2,
            duration: 1500,
            repeat: -1
        });
        this.tweens.push(rotationTween);
        
        // Pulse animation for rare collectibles
        if (type === COLLECTIBLE_TYPES.STAR || type === COLLECTIBLE_TYPES.FORTUNE_COIN) {
            const pulseTween = scene.tweens.add({
                targets: this,
                scale: 1.0,
                duration: 400,
                yoyo: true,
                repeat: -1
            });
            this.tweens.push(pulseTween);
            
            // Add glow effect for fortune coins
            if (type === COLLECTIBLE_TYPES.FORTUNE_COIN) {
                this.setTint(0xffd700);
            }
        }
    }

    update() {
        // Remove if off screen
        if (this.y > this.scene.scale.height + 50) {
            this.cleanup();
        }
    }

    collect() {
        // Prevent multiple collections
        if (this.collected) return;
        this.collected = true;
        
        // Store values before cleanup
        const x = this.x;
        const y = this.y;
        const scene = this.scene;
        const type = this.type;
        const value = this.value;
        
        // Stop all tweens immediately
        this.stopTweens();
        
        // Play collect sound
        if (scene.soundManager) {
            scene.soundManager.playCollect();
        }
        
        // Show score popup
        this.showScorePopup(scene, x, y, value, type);
        
        // Create collection effect with particles
        this.createParticleEffect(scene, x, y, type);
        
        // Destroy the collectible
        this.destroy();
    }

    showScorePopup(scene, x, y, value, type) {
        const scoreText = scene.add.text(x, y - 20, `+${value}`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: type === COLLECTIBLE_TYPES.FORTUNE_COIN ? '#ffd700' : '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        scoreText.setOrigin(0.5);
        scoreText.setDepth(150);
        
        scene.tweens.add({
            targets: scoreText,
            y: y - 50,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                scoreText.destroy();
            }
        });
    }

    createParticleEffect(scene, x, y, type) {
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const color = type === COLLECTIBLE_TYPES.CRYSTAL ? 0x00bfff : 0xffd700;
            const particle = scene.add.circle(x, y, 3, color);
            particle.setDepth(100);
            
            const distance = Phaser.Math.Between(15, 30);
            const targetX = x + Math.cos(angle) * distance;
            const targetY = y + Math.sin(angle) * distance;
            
            scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                scale: 0,
                duration: 250,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    stopTweens() {
        this.tweens.forEach(tween => {
            if (tween && tween.isPlaying) {
                tween.stop();
            }
        });
        this.tweens = [];
    }

    cleanup() {
        this.stopTweens();
        this.destroy();
    }

    destroy() {
        this.stopTweens();
        super.destroy();
    }
}

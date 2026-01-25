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

        // Lifetime management - collectibles fade out after 5 seconds
        this.lifetime = 5000;
        this.createdAt = scene.time.now;
        this.isFading = false;

        // Set velocity downward with slight drift
        const drift = (Math.random() - 0.5) * 50;
        if (this.body) {
            this.setVelocity(drift, this.speed);
        }

        // Magnetic attraction settings
        this.magnetRange = 80; // pixels
        this.magnetStrength = 400; // speed when attracted
        
        // Visual effects - scale 0.5 for 64x64 assets to appear as ~32x32
        this.setScale(0.5);
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
                scale: 0.65,
                duration: 400,
                yoyo: true,
                repeat: -1
            });
            this.tweens.push(pulseTween);
        }
    }

    update(player) {
        if (this.collected || !this.active) return;

        const currentTime = this.scene.time.now;
        const age = currentTime - this.createdAt;

        // Fade out after lifetime expires
        if (age > this.lifetime && !this.isFading) {
            this.isFading = true;
            this.scene.tweens.add({
                targets: this,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    if (!this.collected) {
                        this.destroy();
                    }
                }
            });
        }

        // Magnetic attraction to player
        if (player && player.active && player.body && !this.isFading) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

            if (distance < this.magnetRange) {
                // Calculate direction to player
                const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

                // Stronger attraction when closer
                const strength = this.magnetStrength * (1 - distance / this.magnetRange);

                if (this.body) {
                    this.setVelocity(
                        Math.cos(angle) * strength,
                        Math.sin(angle) * strength
                    );
                }
            }
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

        // Use EffectManager if available, otherwise fallback to local methods
        if (scene.effectManager) {
            const color = type === COLLECTIBLE_TYPES.FORTUNE_COIN ? '#ffd700' : '#ffffff';
            scene.effectManager.showScorePopup(x, y, value, { color, prefix: '+' });
            scene.effectManager.createCollectEffect(x, y, type);
        } else {
            // Fallback
            this.showScorePopup(scene, x, y, value, type);
            this.createParticleEffect(scene, x, y, type);
        }

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
        if (this.tweens) {
            this.tweens.forEach(tween => {
                if (tween && tween.isPlaying) {
                    tween.stop();
                }
            });
            this.tweens = [];
        }
    }

    destroy() {
        this.stopTweens();
        super.destroy();
    }
}

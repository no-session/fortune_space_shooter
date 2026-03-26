import Phaser from 'phaser';
import { POWERUP_TYPES, POWERUP_CONFIG, GAME_CONFIG } from '../utils/constants.js';

export default class PowerUp extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = POWERUP_TYPES.SHIELD) {
        // Use a small invisible sprite — visuals are drawn with graphics
        super(scene, x, y, 'bullet_plasma1');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.type = type;
        this.config = POWERUP_CONFIG[type];
        this.collected = false;
        this.tweensList = [];

        // Make the base sprite invisible — we draw our own visuals
        this.setAlpha(0);
        this.setScale(0.01);
        this.setDepth(75);

        // Set velocity downward with slight drift
        const drift = (Math.random() - 0.5) * 40;
        if (this.body) {
            this.setVelocity(drift, GAME_CONFIG.COLLECTIBLE_SPEED * 0.8);
            this.body.setSize(28, 28);
        }

        // Lifetime management
        this.lifetime = 6000;
        this.createdAt = scene.time.now;
        this.isFading = false;

        // Create visual representation
        this.createVisuals();
    }

    createVisuals() {
        const { color, glowColor, label } = this.config;

        // Outer glow circle
        this.glow = this.scene.add.circle(this.x, this.y, 18, glowColor, 0.3);
        this.glow.setDepth(74);

        // Main circle
        this.circle = this.scene.add.circle(this.x, this.y, 12, color, 0.9);
        this.circle.setDepth(75);

        // Label text
        this.label = this.scene.add.text(this.x, this.y, label, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.label.setOrigin(0.5);
        this.label.setDepth(76);

        // Pulse animation on glow
        const pulseTween = this.scene.tweens.add({
            targets: this.glow,
            scale: 1.4,
            alpha: 0.15,
            duration: 600,
            yoyo: true,
            repeat: -1
        });
        this.tweensList.push(pulseTween);

        // Rotation on glow
        const rotateTween = this.scene.tweens.add({
            targets: this.circle,
            rotation: Math.PI * 2,
            duration: 2000,
            repeat: -1
        });
        this.tweensList.push(rotateTween);
    }

    update(player) {
        if (this.collected || !this.active) return;

        // Sync visual positions
        if (this.glow) this.glow.setPosition(this.x, this.y);
        if (this.circle) this.circle.setPosition(this.x, this.y);
        if (this.label) this.label.setPosition(this.x, this.y);

        const currentTime = this.scene.time.now;
        const age = currentTime - this.createdAt;

        // Fade out after lifetime
        if (age > this.lifetime && !this.isFading) {
            this.isFading = true;
            const targets = [this.glow, this.circle, this.label].filter(Boolean);
            this.scene.tweens.add({
                targets: targets,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    if (!this.collected) {
                        this.destroy();
                    }
                }
            });
        }

        // Magnetic attraction to player (power-ups are slightly magnetic)
        if (player && player.active && player.body && !this.isFading) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            if (distance < 60) {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                const strength = 300 * (1 - distance / 60);
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
        if (this.collected) return;
        this.collected = true;

        // Flash effect at collection point
        const flash = this.scene.add.circle(this.x, this.y, 25, this.config.color, 0.8);
        flash.setDepth(100);
        this.scene.tweens.add({
            targets: flash,
            scale: 2.5,
            alpha: 0,
            duration: 300,
            onComplete: () => flash.destroy()
        });

        // Particle burst
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const particle = this.scene.add.circle(this.x, this.y, 3, this.config.color);
            particle.setDepth(100);
            const dist = Phaser.Math.Between(20, 40);
            this.scene.tweens.add({
                targets: particle,
                x: this.x + Math.cos(angle) * dist,
                y: this.y + Math.sin(angle) * dist,
                alpha: 0,
                scale: 0,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }

        this.destroy();
    }

    stopTweens() {
        if (this.tweensList) {
            this.tweensList.forEach(tween => {
                if (tween && tween.isPlaying) {
                    tween.stop();
                }
            });
            this.tweensList = [];
        }
    }

    destroy() {
        this.stopTweens();
        if (this.glow) { this.glow.destroy(); this.glow = null; }
        if (this.circle) { this.circle.destroy(); this.circle = null; }
        if (this.label) { this.label.destroy(); this.label = null; }
        super.destroy();
    }
}

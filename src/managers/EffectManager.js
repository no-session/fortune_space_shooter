import Phaser from 'phaser';
import { EFFECT_CONFIG, COLORS } from '../utils/constants.js';

export default class EffectManager {
    constructor(scene) {
        this.scene = scene;
        this.activeEffects = [];
    }

    // Score popup for kills and collectibles
    showScorePopup(x, y, points, options = {}) {
        const {
            color = EFFECT_CONFIG.COLOR_KILL,
            size = EFFECT_CONFIG.POPUP_MEDIUM,
            multiplier = null,
            prefix = '+'
        } = options;

        let text = `${prefix}${points}`;
        if (multiplier && multiplier > 1) {
            text = `${prefix}${points} x${multiplier.toFixed(1)}`;
        }

        const popup = this.scene.add.text(x, y - 20, text, {
            fontSize: size,
            fontFamily: 'monospace',
            color: color,
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'bold'
        });
        popup.setOrigin(0.5);
        popup.setDepth(EFFECT_CONFIG.DEPTH_SCORE_POPUP);

        // Pop-in scale animation
        popup.setScale(0.5);
        this.scene.tweens.add({
            targets: popup,
            scale: 1.2,
            duration: 100,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: popup,
                    scale: 1,
                    y: y - 60,
                    alpha: 0,
                    duration: 800,
                    ease: 'Power2',
                    onComplete: () => popup.destroy()
                });
            }
        });
    }

    // Large streak announcement
    showStreakAnnouncement(streakLevel) {
        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2 - 50;

        // Determine color based on streak level
        let color = '#ffff00';
        if (streakLevel >= 20) color = '#ff0000';
        else if (streakLevel >= 10) color = '#ff00ff';
        else if (streakLevel >= 5) color = '#00ffff';

        const text = `${streakLevel}x KILL STREAK!`;

        const announcement = this.scene.add.text(centerX, centerY, text, {
            fontSize: EFFECT_CONFIG.POPUP_HUGE,
            fontFamily: 'monospace',
            color: color,
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold'
        });
        announcement.setOrigin(0.5);
        announcement.setDepth(EFFECT_CONFIG.DEPTH_STREAK_ANNOUNCEMENT);
        announcement.setAlpha(0);

        // Dramatic entrance
        this.scene.tweens.add({
            targets: announcement,
            alpha: 1,
            scale: { from: 2, to: 1 },
            duration: 200,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Hold then fade
                this.scene.time.delayedCall(1000, () => {
                    this.scene.tweens.add({
                        targets: announcement,
                        alpha: 0,
                        y: centerY - 30,
                        duration: 500,
                        onComplete: () => announcement.destroy()
                    });
                });
            }
        });

        // Screen shake for big streaks
        if (streakLevel >= 10) {
            this.screenShake(EFFECT_CONFIG.SHAKE_MEDIUM);
        } else {
            this.screenShake(EFFECT_CONFIG.SHAKE_SMALL);
        }
    }

    // Wave clear bonus display
    showWaveClearBonus(bonusData) {
        const centerX = this.scene.scale.width / 2;
        let startY = this.scene.scale.height / 2 + 80;
        const lineHeight = 35;

        const lines = [];

        if (bonusData.waveClearPoints > 0) {
            lines.push({
                text: `Wave Clear: +${bonusData.waveClearPoints}`,
                color: bonusData.perfect ? EFFECT_CONFIG.COLOR_PERFECT : EFFECT_CONFIG.COLOR_BONUS
            });
        }

        if (bonusData.accuracyPoints > 0) {
            const accPercent = Math.round(bonusData.accuracy * 100);
            lines.push({
                text: `Accuracy ${accPercent}%: +${bonusData.accuracyPoints}`,
                color: EFFECT_CONFIG.COLOR_BONUS
            });
        }

        if (bonusData.grazePoints > 0) {
            lines.push({
                text: `Grazes (${bonusData.grazeCount}): +${bonusData.grazePoints}`,
                color: EFFECT_CONFIG.COLOR_GRAZE
            });
        }

        if (bonusData.totalBonus > 0) {
            lines.push({
                text: `TOTAL BONUS: +${bonusData.totalBonus}`,
                color: '#ffffff',
                size: EFFECT_CONFIG.POPUP_LARGE
            });
        }

        lines.forEach((line, index) => {
            const delay = index * 300;

            this.scene.time.delayedCall(delay, () => {
                const text = this.scene.add.text(centerX, startY + index * lineHeight, line.text, {
                    fontSize: line.size || EFFECT_CONFIG.POPUP_MEDIUM,
                    fontFamily: 'monospace',
                    color: line.color,
                    stroke: '#000000',
                    strokeThickness: 3
                });
                text.setOrigin(0.5);
                text.setDepth(EFFECT_CONFIG.DEPTH_BONUS_OVERLAY);
                text.setAlpha(0);

                this.scene.tweens.add({
                    targets: text,
                    alpha: 1,
                    x: { from: centerX - 50, to: centerX },
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => {
                        this.scene.time.delayedCall(2000, () => {
                            this.scene.tweens.add({
                                targets: text,
                                alpha: 0,
                                y: text.y - 20,
                                duration: 500,
                                onComplete: () => text.destroy()
                            });
                        });
                    }
                });
            });
        });

        if (bonusData.totalBonus > 500) {
            this.screenShake(EFFECT_CONFIG.SHAKE_MEDIUM);
        }
    }

    // Graze effect - cyan sparkles
    showGrazeEffect(x, y) {
        // Small cyan flash
        const flash = this.scene.add.circle(x, y, 15, 0x00ffff, 0.6);
        flash.setDepth(EFFECT_CONFIG.DEPTH_PARTICLES);

        this.scene.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });

        // Sparkle particles
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 * i) / 4 + Math.random() * 0.5;
            const particle = this.scene.add.circle(x, y, 2, 0x00ffff);
            particle.setDepth(EFFECT_CONFIG.DEPTH_PARTICLES);

            const distance = Phaser.Math.Between(15, 25);
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                duration: 200,
                onComplete: () => particle.destroy()
            });
        }

        // Small popup
        this.showScorePopup(x, y, 'GRAZE', {
            color: EFFECT_CONFIG.COLOR_GRAZE,
            size: EFFECT_CONFIG.POPUP_SMALL,
            prefix: ''
        });
    }

    // Explosion particles
    createExplosion(x, y, size = 'medium') {
        let particleCount, particleSize, distance, duration, color;

        switch (size) {
            case 'small':
                particleCount = 6;
                particleSize = 3;
                distance = [15, 30];
                duration = 250;
                color = 0xff6600;
                break;
            case 'large':
                particleCount = 12;
                particleSize = 5;
                distance = [30, 60];
                duration = 400;
                color = 0xff4400;
                this.screenShake(EFFECT_CONFIG.SHAKE_MEDIUM);
                break;
            default: // medium
                particleCount = 8;
                particleSize = 4;
                distance = [20, 40];
                duration = 300;
                color = 0xff6600;
        }

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const particle = this.scene.add.circle(x, y, particleSize, color);
            particle.setDepth(EFFECT_CONFIG.DEPTH_PARTICLES);

            const dist = Phaser.Math.Between(distance[0], distance[1]);
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0,
                scale: 0,
                duration: duration,
                onComplete: () => particle.destroy()
            });
        }
    }

    // Collectible collection effect
    createCollectEffect(x, y, type) {
        const color = type === 'crystal' ? 0x00bfff : 0xffd700;

        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const particle = this.scene.add.circle(x, y, 3, color);
            particle.setDepth(EFFECT_CONFIG.DEPTH_PARTICLES);

            const distance = Phaser.Math.Between(15, 30);
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0,
                duration: 250,
                onComplete: () => particle.destroy()
            });
        }
    }

    // Screen shake
    screenShake(config = EFFECT_CONFIG.SHAKE_SMALL) {
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(config.duration, config.intensity);
        }
    }

    // Screen flash
    screenFlash(color = 0xffffff, duration = 100) {
        if (this.scene.cameras && this.scene.cameras.main) {
            const r = (color >> 16) & 0xff;
            const g = (color >> 8) & 0xff;
            const b = color & 0xff;
            this.scene.cameras.main.flash(duration, r, g, b);
        }
    }

    // Cleanup
    destroy() {
        this.activeEffects.forEach(effect => {
            if (effect && effect.destroy) {
                effect.destroy();
            }
        });
        this.activeEffects = [];
    }
}

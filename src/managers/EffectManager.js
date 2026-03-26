import Phaser from 'phaser';
import { EFFECT_CONFIG, COLORS, COMBO_ANNOUNCEMENTS } from '../utils/constants.js';

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

    // Combo announcement (fighting game style)
    showComboAnnouncement(comboLevel) {
        // Find the highest matching announcement
        let announcement = null;
        for (let i = COMBO_ANNOUNCEMENTS.length - 1; i >= 0; i--) {
            if (comboLevel >= COMBO_ANNOUNCEMENTS[i].combo) {
                announcement = COMBO_ANNOUNCEMENTS[i];
                break;
            }
        }
        if (!announcement) return;

        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2 - 80;

        const isRainbow = announcement.color === 'rainbow';

        const text = this.scene.add.text(centerX, centerY, announcement.text, {
            fontSize: announcement.size,
            fontFamily: 'monospace',
            color: isRainbow ? '#ff0000' : announcement.color,
            stroke: '#000000',
            strokeThickness: 5,
            fontStyle: 'bold'
        });
        text.setOrigin(0.5);
        text.setDepth(EFFECT_CONFIG.DEPTH_STREAK_ANNOUNCEMENT + 10);
        text.setAlpha(0);

        // Rainbow color cycle
        if (isRainbow) {
            const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff', '#ff00ff'];
            let ci = 0;
            const colorTimer = this.scene.time.addEvent({
                delay: 100,
                callback: () => {
                    if (text && text.active) {
                        text.setColor(colors[ci]);
                        ci = (ci + 1) % colors.length;
                    }
                },
                loop: true
            });
            // Store for cleanup
            text._colorTimer = colorTimer;
        }

        // Dramatic entrance
        this.scene.tweens.add({
            targets: text,
            alpha: 1,
            scale: { from: 3, to: 1 },
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.time.delayedCall(1000, () => {
                    this.scene.tweens.add({
                        targets: text,
                        alpha: 0,
                        y: centerY - 50,
                        scale: 1.5,
                        duration: 500,
                        onComplete: () => {
                            if (text._colorTimer) text._colorTimer.destroy();
                            text.destroy();
                        }
                    });
                });
            }
        });

        if (announcement.shake) {
            this.screenShake(EFFECT_CONFIG.SHAKE_LARGE);
        } else {
            this.screenShake(EFFECT_CONFIG.SHAKE_SMALL);
        }
    }

    // Wave name display
    showWaveName(waveNumber, waveName, isBoss = false) {
        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2 - 30;

        // Wave number
        const waveLabel = this.scene.add.text(centerX, centerY - 30, `WAVE ${waveNumber}`, {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: isBoss ? '#ff0000' : '#00ffff',
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold'
        });
        waveLabel.setOrigin(0.5);
        waveLabel.setDepth(EFFECT_CONFIG.DEPTH_STREAK_ANNOUNCEMENT);
        waveLabel.setAlpha(0);

        // Wave name
        const nameText = this.scene.add.text(centerX, centerY + 10, waveName, {
            fontSize: isBoss ? '32px' : '28px',
            fontFamily: 'monospace',
            color: isBoss ? '#ff4444' : '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        nameText.setOrigin(0.5);
        nameText.setDepth(EFFECT_CONFIG.DEPTH_STREAK_ANNOUNCEMENT);
        nameText.setAlpha(0);

        // Animate in
        this.scene.tweens.add({
            targets: [waveLabel, nameText],
            alpha: 1,
            duration: 400,
            ease: 'Power2'
        });

        this.scene.tweens.add({
            targets: waveLabel,
            x: { from: centerX - 100, to: centerX },
            duration: 400,
            ease: 'Power2'
        });

        this.scene.tweens.add({
            targets: nameText,
            x: { from: centerX + 100, to: centerX },
            duration: 400,
            ease: 'Power2'
        });

        // Fade out after 2 seconds
        this.scene.time.delayedCall(2000, () => {
            this.scene.tweens.add({
                targets: [waveLabel, nameText],
                alpha: 0,
                y: '-=30',
                duration: 500,
                onComplete: () => {
                    waveLabel.destroy();
                    nameText.destroy();
                }
            });
        });
    }

    // Confetti effect — colored particles falling with gravity
    confetti(x, y, count = 30, colors = null) {
        const defaultColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffd700];
        const palette = colors || defaultColors;

        for (let i = 0; i < count; i++) {
            const px = x + Phaser.Math.Between(-100, 100);
            const py = y + Phaser.Math.Between(-20, 20);
            const color = palette[Math.floor(Math.random() * palette.length)];
            const size = Phaser.Math.Between(3, 6);

            const particle = this.scene.add.rectangle(px, py, size, size * 1.5, color);
            particle.setDepth(EFFECT_CONFIG.DEPTH_STREAK_ANNOUNCEMENT);
            particle.setAngle(Phaser.Math.Between(0, 360));

            this.scene.tweens.add({
                targets: particle,
                y: py + Phaser.Math.Between(200, 500),
                x: px + Phaser.Math.Between(-80, 80),
                angle: Phaser.Math.Between(-360, 360),
                alpha: 0,
                duration: Phaser.Math.Between(1500, 2500),
                ease: 'Quad.easeIn',
                onComplete: () => particle.destroy()
            });
        }
    }

    // Slow motion effect
    slowMotion(scale, duration) {
        if (!this.scene || !this.scene.time) return;
        this.scene.time.timeScale = scale;
        this.scene.time.delayedCall(duration * scale, () => {
            if (this.scene && this.scene.time) {
                this.scene.time.timeScale = 1;
            }
        });
    }

    // Boss-defeat fireworks: 10-15 bursts over 3 seconds
    createFireworks() {
        const burstCount = Phaser.Math.Between(10, 15);
        const colors = [0xffd700, 0x00ffff, 0xff00ff, 0x00ff00];
        const w = this.scene.scale.width;
        const h = this.scene.scale.height;

        for (let i = 0; i < burstCount; i++) {
            const delay = Phaser.Math.Between(0, 3000);
            this.scene.time.delayedCall(delay, () => {
                const x = Phaser.Math.Between(50, w - 50);
                const burstY = Phaser.Math.Between(60, h * 0.5);
                const startY = h + 20;
                const color = colors[Math.floor(Math.random() * colors.length)];

                // Rocket trail going up
                const rocket = this.scene.add.circle(x, startY, 3, 0xffffff);
                rocket.setDepth(300);

                this.scene.tweens.add({
                    targets: rocket,
                    y: burstY,
                    duration: 400,
                    ease: 'Power2',
                    onComplete: () => {
                        rocket.destroy();
                        // Explode into particles
                        const particleCount = Phaser.Math.Between(12, 20);
                        for (let p = 0; p < particleCount; p++) {
                            const angle = (Math.PI * 2 * p) / particleCount;
                            const speed = Phaser.Math.Between(40, 100);
                            const size = Phaser.Math.Between(2, 4);
                            const particle = this.scene.add.circle(x, burstY, size, color);
                            particle.setDepth(300);

                            this.scene.tweens.add({
                                targets: particle,
                                x: x + Math.cos(angle) * speed,
                                y: burstY + Math.sin(angle) * speed + 30, // gravity pull
                                alpha: 0,
                                scale: 0.2,
                                duration: Phaser.Math.Between(600, 1200),
                                ease: 'Power2',
                                onComplete: () => particle.destroy()
                            });
                        }
                    }
                });
            });
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

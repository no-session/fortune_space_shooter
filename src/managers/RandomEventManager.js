import Phaser from 'phaser';
import Collectible from '../entities/Collectible.js';
import { RANDOM_EVENTS, COLLECTIBLE_TYPES, EFFECT_CONFIG } from '../utils/constants.js';

export default class RandomEventManager {
    constructor(scene) {
        this.scene = scene;
        this.activeEvent = null;
        this.eventTimer = null;
        this.doublePointsActive = false;

        // Schedule first event
        this.scheduleNextEvent();
    }

    scheduleNextEvent() {
        const delay = Phaser.Math.Between(RANDOM_EVENTS.MIN_INTERVAL, RANDOM_EVENTS.MAX_INTERVAL);
        this.eventTimer = this.scene.time.delayedCall(delay, () => {
            this.triggerRandomEvent();
        });
    }

    triggerRandomEvent() {
        if (this.activeEvent) return;

        const eventTypes = Object.keys(RANDOM_EVENTS.TYPES);
        const chosen = eventTypes[Math.floor(Math.random() * eventTypes.length)];

        switch (chosen) {
            case 'COIN_SHOWER':
                this.coinShower();
                break;
            case 'ENEMY_FREEZE':
                this.enemyFreeze();
                break;
            case 'DOUBLE_POINTS':
                this.doublePoints();
                break;
            case 'MYSTERY_BOX':
                this.mysteryBox();
                break;
        }
    }

    showEventText(emoji, name, color = '#ffd700') {
        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2 - 100;

        const text = this.scene.add.text(centerX, centerY, `${emoji} ${name}!`, {
            fontSize: '40px',
            fontFamily: 'monospace',
            color: color,
            stroke: '#000000',
            strokeThickness: 5,
            fontStyle: 'bold'
        });
        text.setOrigin(0.5);
        text.setDepth(EFFECT_CONFIG.DEPTH_STREAK_ANNOUNCEMENT + 50);
        text.setAlpha(0);

        this.scene.tweens.add({
            targets: text,
            alpha: 1,
            scale: { from: 2, to: 1 },
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.time.delayedCall(1500, () => {
                    this.scene.tweens.add({
                        targets: text,
                        alpha: 0,
                        y: centerY - 40,
                        duration: 500,
                        onComplete: () => text.destroy()
                    });
                });
            }
        });

        this.scene.effectManager.screenShake(EFFECT_CONFIG.SHAKE_MEDIUM);
    }

    coinShower() {
        const config = RANDOM_EVENTS.TYPES.COIN_SHOWER;
        this.activeEvent = 'COIN_SHOWER';
        this.showEventText(config.emoji, config.name, '#ffd700');

        let coinsSpawned = 0;
        const spawnInterval = config.duration / config.coinCount;

        const timer = this.scene.time.addEvent({
            delay: spawnInterval,
            callback: () => {
                if (coinsSpawned >= config.coinCount) return;
                const x = Phaser.Math.Between(50, this.scene.scale.width - 50);
                const collectible = new Collectible(this.scene, x, -20, COLLECTIBLE_TYPES.COIN);
                this.scene.collectibles.add(collectible);
                coinsSpawned++;
            },
            repeat: config.coinCount - 1
        });

        this.scene.time.delayedCall(config.duration + 1000, () => {
            this.activeEvent = null;
            this.scheduleNextEvent();
        });
    }

    enemyFreeze() {
        const config = RANDOM_EVENTS.TYPES.ENEMY_FREEZE;
        this.activeEvent = 'ENEMY_FREEZE';
        this.showEventText(config.emoji, config.name, '#00ccff');

        // Freeze all enemies
        const frozenEnemies = [];
        this.scene.enemies.children.entries.forEach(enemy => {
            if (enemy && enemy.active) {
                enemy.frozenVelocityX = enemy.body ? enemy.body.velocity.x : 0;
                enemy.frozenVelocityY = enemy.body ? enemy.body.velocity.y : 0;
                if (enemy.body) {
                    enemy.body.setVelocity(0, 0);
                }
                enemy.setTint(0x4488ff);
                enemy.frozen = true;
                frozenEnemies.push(enemy);
            }
        });

        // Also freeze formations
        this.scene.formationManager.activeFormations.forEach(f => {
            f._frozenSpeed = f.speed;
            f.speed = 0;
        });

        this.scene.time.delayedCall(config.duration, () => {
            // Unfreeze
            frozenEnemies.forEach(enemy => {
                if (enemy && enemy.active) {
                    enemy.clearTint();
                    enemy.frozen = false;
                    if (enemy.body) {
                        enemy.body.setVelocity(enemy.frozenVelocityX || 0, enemy.frozenVelocityY || 0);
                    }
                }
            });

            this.scene.formationManager.activeFormations.forEach(f => {
                if (f._frozenSpeed !== undefined) {
                    f.speed = f._frozenSpeed;
                    delete f._frozenSpeed;
                }
            });

            this.activeEvent = null;
            this.scheduleNextEvent();
        });
    }

    doublePoints() {
        const config = RANDOM_EVENTS.TYPES.DOUBLE_POINTS;
        this.activeEvent = 'DOUBLE_POINTS';
        this.doublePointsActive = true;
        this.showEventText(config.emoji, config.name, '#ffff00');

        // Turn score text gold
        if (this.scene.scoreText) {
            this.scene.scoreText.setColor('#ffd700');
        }

        this.scene.time.delayedCall(config.duration, () => {
            this.doublePointsActive = false;
            if (this.scene.scoreText) {
                this.scene.scoreText.setColor('#ffffff');
            }
            this.activeEvent = null;
            this.scheduleNextEvent();
        });
    }

    mysteryBox() {
        this.activeEvent = 'MYSTERY_BOX';
        const config = RANDOM_EVENTS.TYPES.MYSTERY_BOX;
        this.showEventText(config.emoji, config.name, '#ff88ff');

        const centerX = this.scene.scale.width / 2;

        // Create mystery box as a graphics object
        const box = this.scene.add.container(centerX, -40);
        box.setDepth(150);

        const bg = this.scene.add.rectangle(0, 0, 36, 36, 0xff00ff);
        bg.setStrokeStyle(3, 0xffffff);
        const qMark = this.scene.add.text(0, 0, '?', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        qMark.setOrigin(0.5);
        box.add([bg, qMark]);

        // Pulse animation
        this.scene.tweens.add({
            targets: box,
            scaleX: { from: 0.9, to: 1.1 },
            scaleY: { from: 0.9, to: 1.1 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Physics body for collection
        this.scene.physics.add.existing(box);
        box.body.setSize(36, 36);
        box.body.setOffset(-18, -18);
        box.body.setVelocityY(config.fallSpeed);

        // Track if collected
        box.collected = false;

        // Overlap with player
        const overlap = this.scene.physics.add.overlap(
            box, this.scene.player,
            () => {
                if (box.collected) return;
                box.collected = true;
                this.collectMysteryBox(box);
                overlap.destroy();
            }
        );

        // Destroy if goes off screen
        const checkTimer = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                if (!box || !box.active) {
                    checkTimer.destroy();
                    return;
                }
                if (box.y > this.scene.scale.height + 50) {
                    box.destroy();
                    checkTimer.destroy();
                    this.activeEvent = null;
                    this.scheduleNextEvent();
                }
            },
            loop: true
        });
    }

    collectMysteryBox(box) {
        // Particle burst
        this.scene.effectManager.createExplosion(box.x, box.y, 'large');
        this.scene.effectManager.screenFlash(0xff00ff, 200);

        if (this.scene.soundManager) {
            this.scene.soundManager.playCollect();
        }

        const reward = Math.random();
        if (reward < 0.33) {
            // 3 random power-ups
            this.scene.effectManager.showScorePopup(box.x, box.y, 'TRIPLE POWER-UP!', {
                color: '#ff00ff', size: EFFECT_CONFIG.POPUP_LARGE, prefix: ''
            });
            const types = ['shield', 'rapid_fire', 'magnet'];
            types.forEach((t, i) => {
                this.scene.time.delayedCall(i * 300, () => {
                    this.scene.applyPowerUp(t);
                });
            });
        } else if (reward < 0.66) {
            // 1000 bonus points
            const pts = this.scene.randomEventManager && this.scene.randomEventManager.doublePointsActive ? 2000 : 1000;
            this.scene.scoreManager.addBonusScore(pts, 'generic');
            this.scene.effectManager.showScorePopup(box.x, box.y, pts, {
                color: '#ffd700', size: EFFECT_CONFIG.POPUP_HUGE
            });
        } else {
            // Extra life
            this.scene.player.lives++;
            this.scene.effectManager.showScorePopup(box.x, box.y, 'EXTRA LIFE!', {
                color: '#00ff00', size: EFFECT_CONFIG.POPUP_HUGE, prefix: ''
            });
        }

        box.destroy();
        this.activeEvent = null;
        this.scheduleNextEvent();
    }

    getPointsMultiplier() {
        return this.doublePointsActive ? 2 : 1;
    }

    destroy() {
        if (this.eventTimer) {
            this.eventTimer.destroy();
        }
    }
}

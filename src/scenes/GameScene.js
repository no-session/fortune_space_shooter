import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import Boss from '../entities/Boss.js';
import Collectible from '../entities/Collectible.js';
import FormationManager from '../managers/FormationManager.js';
import WaveManager from '../managers/WaveManager.js';
import ScoreManager from '../managers/ScoreManager.js';
import SoundManager from '../managers/SoundManager.js';
import StreakManager from '../managers/StreakManager.js';
import EffectManager from '../managers/EffectManager.js';
import BonusSystem from '../systems/BonusSystem.js';
import { COLLECTIBLE_TYPES, GAME_CONFIG, EFFECT_CONFIG } from '../utils/constants.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Create starfield background
        this.createStarfield();
        
        // Initialize managers
        this.formationManager = new FormationManager(this);
        this.waveManager = new WaveManager(this);
        this.scoreManager = new ScoreManager(this);
        this.soundManager = new SoundManager(this);
        this.streakManager = new StreakManager(this);
        this.effectManager = new EffectManager(this);
        this.bonusSystem = new BonusSystem(this);
        
        // Create player
        this.player = new Player(this, this.scale.width / 2, this.scale.height - 50);
        
        // Create groups
        this.enemies = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.collectibles = this.physics.add.group();
        this.bosses = this.physics.add.group();
        
        // Collision detection
        this.setupCollisions();
        
        // UI
        this.createUI();
        
        // Initialize particle emitter for effects
        this.particleEmitter = null;
        
        // Start first wave
        this.waveManager.startWave(1);
        this.bonusSystem.startWave(1);
        
        // Pause key
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.pauseKey.on('down', () => {
            this.scene.pause();
            this.scene.launch('PauseScene');
        });
        
        // Game state
        this.gameOver = false;
        this.paused = false;
        this.waveTransitioning = false;
    }

    createStarfield() {
        // Add scrolling background image
        this.bg1 = this.add.image(this.scale.width / 2, this.scale.height / 2, 'background');
        this.bg1.setDisplaySize(this.scale.width, this.scale.height);
        this.bg1.setDepth(0);
        
        this.bg2 = this.add.image(this.scale.width / 2, -this.scale.height / 2, 'background');
        this.bg2.setDisplaySize(this.scale.width, this.scale.height);
        this.bg2.setDepth(0);
        
        this.bgSpeed = 50;
        
        // Create additional star layers for parallax effect on top
        this.starfieldLayers = [];
        
        for (let i = 0; i < 2; i++) {
            const stars = this.add.group();
            const starCount = 30 + i * 15;
            const speed = 80 + i * 40;
            const size = 1 + i * 0.5;
            
            for (let j = 0; j < starCount; j++) {
                const x = Phaser.Math.Between(0, this.scale.width);
                const y = Phaser.Math.Between(0, this.scale.height);
                const alpha = 0.3 + Math.random() * 0.5;
                const star = this.add.circle(x, y, size, 0xffffff, alpha);
                star.setDepth(1);
                stars.add(star);
            }
            
            this.starfieldLayers.push({ stars, speed });
        }
    }

    updateStarfield() {
        // Scroll background images
        const delta = this.game.loop.delta / 1000;
        
        this.bg1.y += this.bgSpeed * delta;
        this.bg2.y += this.bgSpeed * delta;
        
        // Reset backgrounds when they scroll off screen
        if (this.bg1.y >= this.scale.height * 1.5) {
            this.bg1.y = this.bg2.y - this.scale.height;
        }
        if (this.bg2.y >= this.scale.height * 1.5) {
            this.bg2.y = this.bg1.y - this.scale.height;
        }
        
        // Update star particles
        this.starfieldLayers.forEach((layer) => {
            layer.stars.children.entries.forEach(star => {
                star.y += layer.speed * delta;
                
                if (star.y > this.scale.height) {
                    star.y = 0;
                    star.x = Phaser.Math.Between(0, this.scale.width);
                }
            });
        });
    }

    setupCollisions() {
        // Player bullets vs enemies (check all active formations)
        this.physics.add.overlap(
            this.player.bullets,
            this.enemies,
            (bullet, enemy) => {
                if (bullet.active && enemy.active) {
                    bullet.destroy();
                    this.bonusSystem.recordShotHit(); // Track accuracy
                    enemy.takeDamage(10);
                    if (enemy.health <= 0) {
                        this.onEnemyKilled(enemy);
                    }
                }
            }
        );

        // Player bullets vs bosses
        this.physics.add.overlap(
            this.player.bullets,
            this.bosses,
            (bullet, boss) => {
                if (bullet.active && boss.active) {
                    bullet.destroy();
                    this.bonusSystem.recordShotHit(); // Track accuracy
                    boss.takeDamage(10);
                }
            }
        );
        
        // Enemy bullets vs player
        this.physics.add.overlap(
            this.enemyBullets,
            this.player,
            (bullet, player) => {
                if (bullet.active && player.active && !this.player.invincible && !this.player.isDying) {
                    bullet.destroy();
                    this.player.takeDamage(10);
                    if (!this.player.isAlive()) {
                        this.triggerGameOver();
                    }
                }
            }
        );
        
        // Enemies vs player
        this.physics.add.overlap(
            this.enemies,
            this.player,
            (enemy, player) => {
                if (enemy.active && player.active && !this.player.invincible && !this.player.isDying) {
                    enemy.die();
                    this.player.takeDamage(20);
                    if (!this.player.isAlive()) {
                        this.triggerGameOver();
                    }
                }
            }
        );
        
        // Collectibles vs player
        this.physics.add.overlap(
            this.collectibles,
            this.player,
            (obj1, obj2) => {
                // Phaser can swap parameter order - identify which is which
                let collectible, player;
                if (obj1 === this.player || obj1?.constructor?.name === 'Player') {
                    player = obj1;
                    collectible = obj2;
                } else {
                    collectible = obj1;
                    player = obj2;
                }

                // Check collected flag first to prevent duplicate processing
                if (!collectible || !player) {
                    return;
                }
                if (collectible.collected) {
                    return;
                }
                if (!collectible.active || !player.active) {
                    return;
                }

                // Mark as collected immediately
                collectible.collected = true;

                // Play collect sound
                if (this.soundManager) {
                    this.soundManager.playCollect();
                }

                // Add score
                const value = collectible.value || 10;
                const type = collectible.type || 'coin';
                this.scoreManager.addCollectible(value, this.game.getTime(), type);
                this.updateUI();

                // Collect the item (handles effects and destruction)
                if (typeof collectible.collect === 'function') {
                    collectible.collect();
                } else {
                    collectible.destroy();
                }
            }
        );
        
        // Boss bullets vs player (set up in update loop for dynamic tracking)
    }

    createUI() {
        // Score text
        this.scoreText = this.add.text(10, 10, 'Score: 0', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
        this.scoreText.setDepth(1000);
        
        // Combo text
        this.comboText = this.add.text(10, 35, '', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ffff00'
        });
        this.comboText.setDepth(1000);

        // Shop currency text (shows collectibles value for shop)
        this.currencyText = this.add.text(10, 60, 'Shop Currency: 0', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffd700'
        });
        this.currencyText.setDepth(1000);

        // Wave text
        this.waveText = this.add.text(this.scale.width - 150, 10, 'Wave: 1', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
        this.waveText.setDepth(1000);
        this.waveText.setOrigin(0, 0);
        
        // Lives text
        this.livesText = this.add.text(this.scale.width - 150, 35, 'Lives: 3', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#00ff00'
        });
        this.livesText.setDepth(1000);
        this.livesText.setOrigin(0, 0);

        // Kill streak text (top right)
        this.streakText = this.add.text(this.scale.width - 150, 60, '', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ff00ff'
        });
        this.streakText.setDepth(1000);
        this.streakText.setOrigin(0, 0);

        // Accuracy text (top right)
        this.accuracyText = this.add.text(this.scale.width - 150, 80, '', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#888888'
        });
        this.accuracyText.setDepth(1000);
        this.accuracyText.setOrigin(0, 0);
    }

    updateUI() {
        this.scoreText.setText(`Score: ${this.scoreManager.getScore()}`);

        const combo = this.scoreManager.getCombo();
        if (combo > 0) {
            this.comboText.setText(`Combo: x${this.scoreManager.getComboMultiplier().toFixed(1)}`);
        } else {
            this.comboText.setText('');
        }

        // Update shop currency display
        const currency = this.scoreManager.getShopCurrency();
        this.currencyText.setText(`Shop Currency: ${currency}`);

        this.waveText.setText(`Wave: ${this.waveManager.getCurrentWave()}`);
        this.livesText.setText(`Lives: ${this.player.lives}`);

        // Update kill streak display
        const streak = this.streakManager.getCurrentStreak();
        if (streak >= 3) {
            const mult = this.streakManager.getStreakMultiplier();
            this.streakText.setText(`Streak: ${streak}x (${mult.toFixed(1)}x)`);
            // Color based on streak level
            if (streak >= 20) this.streakText.setColor('#ff0000');
            else if (streak >= 10) this.streakText.setColor('#ff00ff');
            else if (streak >= 5) this.streakText.setColor('#00ffff');
            else this.streakText.setColor('#ffff00');
        } else {
            this.streakText.setText('');
        }

        // Update accuracy display
        const accuracy = this.bonusSystem.getAccuracyPercent();
        if (this.bonusSystem.shotsFired > 0) {
            this.accuracyText.setText(`Accuracy: ${accuracy}%`);
        }
    }

    update(time) {
        if (this.gameOver || this.paused) return;
        
        // Update starfield
        this.updateStarfield();
        
        // Update player
        this.player.update(time);
        
        // Update managers
        this.formationManager.update(time);
        this.scoreManager.updateCombo();
        this.streakManager.update(this.game.loop.delta);

        // Graze detection for enemy bullets
        if (this.player && this.player.active && !this.player.invincible) {
            this.enemyBullets.children.entries.forEach(bullet => {
                if (!bullet || !bullet.active) return;

                const grazeResult = this.bonusSystem.checkGraze(bullet, this.player);
                if (grazeResult) {
                    this.scoreManager.addBonusScore(grazeResult.points, 'graze');
                    this.effectManager.showGrazeEffect(grazeResult.x, grazeResult.y);
                }
            });
        }
        
        // Update enemies from formations
        this.formationManager.activeFormations.forEach(formation => {
            formation.enemies.forEach(enemy => {
                if (enemy && enemy.active) {
                    enemy.update(time);
                    // Add to enemies group for collision tracking
                    if (!this.enemies.contains(enemy)) {
                        this.enemies.add(enemy);
                    }
                }
            });
        });
        
        // Update standalone enemies
        this.enemies.children.entries.forEach(enemy => {
            if (enemy && enemy.active) {
                enemy.update(time);
            }
        });
        
        // Update bosses
        this.bosses.children.entries.forEach(boss => {
            if (boss && boss.active) {
                boss.update(time);
                
                // Check boss bullets vs player
                if (boss.bullets) {
                    this.physics.overlap(
                        boss.bullets,
                        this.player,
                        (bullet, player) => {
                            if (bullet.active && player.active && !this.player.invincible && !this.player.isDying) {
                                bullet.destroy();
                                this.player.takeDamage(15);
                                if (!this.player.isAlive()) {
                                    this.triggerGameOver();
                                }
                            }
                        }
                    );
                }
            }
        });

        // Update collectibles (use slice to avoid modifying array during iteration)
        const collectiblesList = this.collectibles.children.entries.slice();
        for (let i = collectiblesList.length - 1; i >= 0; i--) {
            const collectible = collectiblesList[i];
            if (collectible && collectible.active && !collectible.collected) {
                // Update collectible (handles lifetime, fading, magnetic attraction)
                if (collectible.update) {
                    collectible.update(this.player);
                }

                // Manual distance-based collection (backup if physics overlap fails)
                if (this.player && this.player.active && this.player.body) {
                    const distance = Phaser.Math.Distance.Between(
                        collectible.x, collectible.y,
                        this.player.x, this.player.y
                    );
                    if (distance < 30) {
                        // Collect it manually
                        collectible.collected = true;
                        if (this.soundManager) {
                            this.soundManager.playCollect();
                        }
                        const value = collectible.value || 10;
                        const type = collectible.type || 'coin';
                        this.scoreManager.addCollectible(value, this.game.getTime(), type);
                        this.updateUI();
                        if (typeof collectible.collect === 'function') {
                            collectible.collect();
                        } else {
                            collectible.destroy();
                        }
                        continue;
                    }
                }

                // Check if off screen
                if (collectible.y > this.scale.height + 50) {
                    collectible.destroy();
                }
            }
        }
        
        // Check for wave completion (only if not already transitioning)
        if (this.waveManager.isWaveComplete() && !this.waveTransitioning) {
            console.log('Wave complete! Starting next wave transition...');
            this.nextWave();
        }
        
        // Update UI
        this.updateUI();
        
        // Clean up off-screen player bullets (use slice to avoid modifying during iteration)
        const playerBulletsList = this.player.bullets.children.entries.slice();
        for (let i = playerBulletsList.length - 1; i >= 0; i--) {
            const bullet = playerBulletsList[i];
            if (bullet && bullet.y < -50) {
                bullet.destroy();
            }
        }
        
        // Clean up off-screen enemy bullets (use slice to avoid modifying during iteration)
        const enemyBulletsList = this.enemyBullets.children.entries.slice();
        for (let i = enemyBulletsList.length - 1; i >= 0; i--) {
            const bullet = enemyBulletsList[i];
            if (bullet && (bullet.y > this.scale.height + 50 || bullet.y < -50)) {
                bullet.destroy();
            }
        }

        // Clean up off-screen boss bullets (critical fix: boss bullets weren't being cleaned up)
        this.bosses.children.entries.forEach(boss => {
            if (boss && boss.bullets) {
                const bossBulletsList = boss.bullets.children.entries.slice();
                for (let i = bossBulletsList.length - 1; i >= 0; i--) {
                    const bullet = bossBulletsList[i];
                    if (bullet && (bullet.y > this.scale.height + 50 || bullet.y < -50 ||
                                  bullet.x < -50 || bullet.x > this.scale.width + 50)) {
                        bullet.destroy();
                    }
                }
            }
        });
    }

    onEnemyKilled(enemy) {
        const time = this.game.getTime();

        // Record kill for streak system
        const streakData = this.streakManager.recordKill(enemy.type, time);

        // Calculate and add score with streak multiplier
        const finalPoints = this.scoreManager.addKillScore(enemy.points, streakData.multiplier);

        // Show score popup with streak info
        this.effectManager.showScorePopup(enemy.x, enemy.y, finalPoints, {
            color: EFFECT_CONFIG.COLOR_KILL,
            size: streakData.streakLevel >= 5 ? EFFECT_CONFIG.POPUP_LARGE : EFFECT_CONFIG.POPUP_MEDIUM,
            multiplier: streakData.multiplier > 1 ? streakData.multiplier : null
        });

        // Show streak milestone announcement
        if (streakData.milestone) {
            this.effectManager.showStreakAnnouncement(streakData.milestone);
        }

        // Create explosion via EffectManager
        const explosionSize = (enemy.type === 'bomber' || enemy.type === 'elite') ? 'large' : 'medium';
        this.effectManager.createExplosion(enemy.x, enemy.y, explosionSize);

        // Drop collectible
        if (Math.random() < enemy.dropChance) {
            this.dropCollectible(enemy.x, enemy.y);
        }

        // Update wave manager and UI
        this.waveManager.onEnemyKilled();
        this.updateUI();
    }

    createExplosionParticles(x, y) {
        // Legacy method - delegate to EffectManager
        this.effectManager.createExplosion(x, y, 'medium');
    }

    dropCollectible(x, y) {
        const rand = Math.random();
        let type = COLLECTIBLE_TYPES.COIN;
        
        if (rand < 0.05) {
            type = COLLECTIBLE_TYPES.FORTUNE_COIN;
        } else if (rand < 0.15) {
            type = COLLECTIBLE_TYPES.STAR;
        } else if (rand < 0.4) {
            type = COLLECTIBLE_TYPES.CRYSTAL;
        }
        
        const collectible = new Collectible(this, x, y, type);
        this.collectibles.add(collectible);
    }

    spawnBoss(type, x, y) {
        const boss = new Boss(this, x, y, type);
        this.bosses.add(boss);
    }

    spawnMiniDrone(x, y) {
        const drone = new Enemy(this, x, y, 'scout');
        drone.setVelocityY(200);
        this.enemies.add(drone);
    }

    nextWave() {
        if (this.waveTransitioning) return;
        this.waveTransitioning = true;

        // Clear all enemy bullets between waves (gives player a breather)
        if (this.enemyBullets) {
            this.enemyBullets.clear(true, true);
        }

        // Clear all boss bullets between waves
        this.bosses.children.entries.forEach(boss => {
            if (boss && boss.bullets) {
                boss.bullets.clear(true, true);
            }
        });

        const currentWave = this.waveManager.getCurrentWave();

        // Calculate wave bonuses
        const enemiesKilled = this.waveManager.getEnemiesKilledThisWave ?
            this.waveManager.getEnemiesKilledThisWave() : this.waveManager.enemiesKilled || 0;
        const totalEnemies = this.waveManager.getTotalEnemiesThisWave ?
            this.waveManager.getTotalEnemiesThisWave() : this.waveManager.totalEnemies || enemiesKilled;

        const bonusData = this.bonusSystem.calculateWaveBonuses(enemiesKilled, totalEnemies);

        // Award bonuses to score
        if (bonusData.waveClearPoints > 0) {
            this.scoreManager.addBonusScore(bonusData.waveClearPoints, 'waveClear');
        }
        if (bonusData.accuracyPoints > 0) {
            this.scoreManager.addBonusScore(bonusData.accuracyPoints, 'accuracy');
        }
        // Graze points already awarded during gameplay

        // Show wave complete message
        const waveText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            bonusData.perfect ? `Wave ${currentWave} PERFECT!` : `Wave ${currentWave} Complete!`,
            {
                fontSize: '32px',
                fontFamily: 'monospace',
                color: bonusData.perfect ? '#00ff00' : '#00ffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        waveText.setOrigin(0.5);
        waveText.setDepth(1000);

        // Show bonus breakdown
        if (bonusData.totalBonus > 0) {
            this.effectManager.showWaveClearBonus(bonusData);
        }

        this.updateUI();

        // Fade out and start next wave after delay
        this.tweens.add({
            targets: waveText,
            alpha: 0,
            y: waveText.y - 50,
            duration: 1500,
            onComplete: () => {
                waveText.destroy();

                // Reset wave-specific bonus tracking
                this.bonusSystem.resetWaveStats();

                // If boss wave, go to shop
                if (this.waveManager.isBossWave()) {
                    // Start the next wave first to prevent re-triggering
                    this.waveManager.startWave(currentWave + 1);
                    this.bonusSystem.startWave(currentWave + 1);
                    this.waveTransitioning = false;

                    // Then launch shop
                    this.scene.pause();
                    this.scene.launch('ShopScene', {
                        score: this.scoreManager.getScore(),
                        wave: currentWave
                    });
                } else {
                    // Start next wave
                    this.waveManager.startWave(currentWave + 1);
                    this.bonusSystem.startWave(currentWave + 1);
                    this.waveTransitioning = false;
                }
            }
        });
    }

    onBossDefeated(scoreValue = 5000) {
        this.waveManager.onBossKilled();
        this.scoreManager.addScore(scoreValue); // Boss-specific score bonus

        // Big explosion effect
        this.createBossExplosion();

        // Screen shake
        this.cameras.main.shake(800, 0.02);
    }

    createBossExplosion() {
        // Create multiple explosion rings
        for (let ring = 0; ring < 3; ring++) {
            const delay = ring * 100;
            this.time.delayedCall(delay, () => {
                const explosion = this.add.circle(
                    this.scale.width / 2,
                    this.scale.height / 4,
                    50 + ring * 30,
                    0xff6600
                );
                explosion.setDepth(200);
                explosion.setAlpha(0.8);
                
                this.tweens.add({
                    targets: explosion,
                    scale: 3 + ring,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        explosion.destroy();
                    }
                });
            });
        }
    }

    triggerGameOver() {
        if (this.gameOver) return;
        
        this.gameOver = true;
        this.scene.pause();
        
        // Save score
        const finalScore = this.scoreManager.getScore();
        const maxCombo = this.scoreManager.getMaxCombo();
        
        this.scene.launch('GameOverScene', {
            score: finalScore,
            wave: this.waveManager.getCurrentWave(),
            maxCombo: maxCombo
        });
    }
}

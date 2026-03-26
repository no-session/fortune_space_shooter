import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import Boss from '../entities/Boss.js';
import Collectible from '../entities/Collectible.js';
import FormationManager from '../managers/FormationManager.js';
import WaveManager from '../managers/WaveManager.js';
import ScoreManager from '../managers/ScoreManager.js';
import SoundManager from '../managers/SoundManager.js';
import EffectManager from '../managers/EffectManager.js';
import XPManager from '../managers/XPManager.js';
import BonusSystem from '../systems/BonusSystem.js';
import ParticleEngine from '../systems/ParticleEngine.js';
import StatsTracker from '../managers/StatsTracker.js';
import {
    COLLECTIBLE_TYPES, COLLECTIBLE_VALUES, GAME_CONFIG,
    ENEMY_TYPES, ENEMY_STATS, BOSS_TYPES, BOSS_WAVE_SEQUENCE,
    POWERUP_TYPES, FORMATION_TYPES, WEAPON_TYPES
} from '../utils/constants.js';

/**
 * ChallengeScene — runs one of 5 challenge modes.
 * Reuses existing game systems (Player, Enemy, Boss, etc.)
 */
export default class ChallengeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ChallengeScene' });
    }

    init(data) {
        this.challenge = data.challenge;
    }

    create() {
        this.cameras.main.fadeIn(300, 0, 0, 0);
        const width = this.scale.width;
        const height = this.scale.height;

        // Background
        this.createStarfield();

        // Core managers
        this.scoreManager = new ScoreManager(this);
        this.soundManager = new SoundManager(this);
        this.effectManager = new EffectManager(this);
        this.bonusSystem = new BonusSystem(this);
        this.particleEngine = new ParticleEngine(this);

        // Physics groups
        this.enemies = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.collectibles = this.physics.add.group();
        this.powerups = this.physics.add.group();
        this.bosses = this.physics.add.group();

        // Challenge state
        this.challengeOver = false;
        this.challengeStartTime = Date.now();
        this.challengeScore = 0;
        this.challengeTimer = 0;
        this.wavesCompleted = 0;
        this.bossesDefeated = 0;
        this.collectiblesGathered = 0;
        this.timeSurvived = 0;
        this.totalKills = 0;
        this.streakManager = { getCurrentStreak: () => 0, getStreakMultiplier: () => 1, update: () => {}, resetStreak: () => {} };

        // Create player
        this.player = new Player(this, width / 2, height - 50);

        // Challenge-specific setup
        this._setupChallenge();

        // Setup collisions
        this.setupCollisions();

        // UI
        this.createChallengeUI();

        // Pause key
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.pauseKey.on('down', () => {
            // Quick back to menu on ESC in challenge mode
            this._endChallenge();
        });

        this.gameOver = false;
    }

    // ── Challenge-specific setup ──────────────────────────

    _setupChallenge() {
        const id = this.challenge.id;

        if (id === 'speed_blitz') {
            this._setupSpeedBlitz();
        } else if (id === 'boss_rush') {
            this._setupBossRush();
        } else if (id === 'coin_frenzy') {
            this._setupCoinFrenzy();
        } else if (id === 'one_life') {
            this._setupOneLife();
        } else if (id === 'dodge_master') {
            this._setupDodgeMaster();
        }
    }

    // ── SPEED BLITZ ───────────────────────────────────────
    _setupSpeedBlitz() {
        this.challengeTimer = 60; // 60 seconds
        this.wavesNeeded = 3;
        this.wavesCompleted = 0;
        this.formationManager = new FormationManager(this);

        // Spawn first wave immediately
        this._spawnSpeedBlitzWave();
    }

    _spawnSpeedBlitzWave() {
        if (this.challengeOver) return;
        const types = [ENEMY_TYPES.SCOUT, ENEMY_TYPES.FIGHTER, ENEMY_TYPES.BOMBER];
        const formTypes = [FORMATION_TYPES.V, FORMATION_TYPES.GRID, FORMATION_TYPES.CIRCLE];
        const count = 6 + this.wavesCompleted * 3;

        // Spawn a formation with enemies
        const formType = Phaser.Utils.Array.GetRandom(formTypes);
        const enemyType = types[Math.min(this.wavesCompleted, types.length - 1)];

        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(50, this.scale.width - 50);
            const y = Phaser.Math.Between(-200, -50);
            const enemy = new Enemy(this, x, y, enemyType);
            enemy.setVelocityY(ENEMY_STATS[enemyType].speed * 1.5); // 1.5x speed for blitz
            this.enemies.add(enemy);
        }

        this._blitzCheckTimer = this.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => {
                // Check if all enemies destroyed
                const alive = this.enemies.children.entries.filter(e => e && e.active).length;
                const bossAlive = this.bosses.children.entries.filter(b => b && b.active).length;
                if (alive === 0 && bossAlive === 0) {
                    this.wavesCompleted++;
                    if (this.wavesCompleted >= this.wavesNeeded) {
                        this._blitzCheckTimer.destroy();
                        this.challengeScore = this.scoreManager.getScore() * 3; // 3x multiplier
                        this._endChallenge();
                    } else {
                        this._spawnSpeedBlitzWave();
                    }
                }
            }
        });
    }

    // ── BOSS RUSH ─────────────────────────────────────────
    _setupBossRush() {
        this.bossQueue = [
            BOSS_TYPES.MOTHERSHIP,
            BOSS_TYPES.DREADNOUGHT,
            BOSS_TYPES.BATTLECRUISER,
            BOSS_TYPES.DESTROYER,
            BOSS_TYPES.OVERLORD
        ];
        this.bossesDefeated = 0;
        this._spawnNextBoss();
    }

    _spawnNextBoss() {
        if (this.challengeOver) return;
        if (this.bossQueue.length === 0) {
            // All bosses defeated! Score = time taken in seconds
            this.challengeScore = Math.floor((Date.now() - this.challengeStartTime) / 1000);
            this._endChallenge();
            return;
        }

        // Restore player health between bosses
        this.player.health = this.player.maxHealth;

        const bossType = this.bossQueue.shift();
        const boss = new Boss(this, this.scale.width / 2, -80, bossType);
        this.bosses.add(boss);

        // Set up boss bullet collision
        if (boss.bullets) {
            this.physics.add.overlap(
                boss.bullets,
                this.player,
                (bullet, player) => {
                    if (bullet.active && player.active && !this.player.invincible && !this.player.isDying) {
                        bullet.destroy();
                        this.player.takeDamage(15);
                        if (!this.player.isAlive()) {
                            this.challengeScore = Math.floor((Date.now() - this.challengeStartTime) / 1000);
                            this._endChallenge();
                        }
                    }
                }
            );
        }

        // Watch for boss death
        this._bossCheckTimer = this.time.addEvent({
            delay: 300,
            loop: true,
            callback: () => {
                const bossAlive = this.bosses.children.entries.filter(b => b && b.active).length;
                if (bossAlive === 0) {
                    this._bossCheckTimer.destroy();
                    this.bossesDefeated++;
                    this.effectManager.showScorePopup(
                        this.scale.width / 2, this.scale.height / 2,
                        `BOSS ${this.bossesDefeated}/5 DEFEATED!`,
                        { color: '#00ff00', size: '28px', prefix: '' }
                    );
                    this.time.delayedCall(2000, () => this._spawnNextBoss());
                }
            }
        });
    }

    // ── COIN FRENZY ───────────────────────────────────────
    _setupCoinFrenzy() {
        this.challengeTimer = 90; // 90 seconds
        this.collectiblesGathered = 0;

        // Disable player shooting
        this.player.isFiring = false;
        this.player.autoFire = false;
        // Override shoot to do nothing
        this.player.shoot = () => {};

        // Rain coins continuously
        this._coinRainTimer = this.time.addEvent({
            delay: 200,
            loop: true,
            callback: () => {
                if (this.challengeOver) return;
                const types = [COLLECTIBLE_TYPES.COIN, COLLECTIBLE_TYPES.COIN, COLLECTIBLE_TYPES.COIN,
                               COLLECTIBLE_TYPES.CRYSTAL, COLLECTIBLE_TYPES.STAR];
                const type = Phaser.Utils.Array.GetRandom(types);
                const x = Phaser.Math.Between(30, this.scale.width - 30);
                const collectible = new Collectible(this, x, -20, type);
                this.collectibles.add(collectible);
            }
        });
    }

    // ── ONE LIFE ──────────────────────────────────────────
    _setupOneLife() {
        this.player.lives = 1;
        this.player.maxHealth = 50;
        this.player.health = 50;
        this.wavesCompleted = 0;

        this.formationManager = new FormationManager(this);
        this.waveManager = new WaveManager(this);

        // Start first wave
        this.waveManager.startWave(1);
        this._showWaveText(1);

        // Monitor wave completion
        this._oneLifeCheckTimer = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.challengeOver) return;
                const alive = this.enemies.children.entries.filter(e => e && e.active).length;
                const bossAlive = this.bosses.children.entries.filter(b => b && b.active).length;
                if (alive === 0 && bossAlive === 0 && !this._waveTransitioning) {
                    this._waveTransitioning = true;
                    this.wavesCompleted++;
                    this.time.delayedCall(1500, () => {
                        this._waveTransitioning = false;
                        const nextWave = this.wavesCompleted + 1;
                        this.waveManager.startWave(nextWave);
                        this._showWaveText(nextWave);
                    });
                }
            }
        });
    }

    _showWaveText(waveNum) {
        this.effectManager.showScorePopup(
            this.scale.width / 2, this.scale.height / 2 - 50,
            `WAVE ${waveNum}`,
            { color: '#00ffff', size: '32px', prefix: '' }
        );
    }

    // ── DODGE MASTER ──────────────────────────────────────
    _setupDodgeMaster() {
        this.challengeTimer = 60; // 60 seconds to survive
        this.timeSurvived = 0;
        this._grazeScore = 0;

        // Disable player shooting
        this.player.shoot = () => {};
        this.player.isFiring = false;

        // Spawn bullet patterns
        this._dodgePatternIndex = 0;
        this._spawnDodgePattern();

        this._dodgePatternTimer = this.time.addEvent({
            delay: 3000,
            loop: true,
            callback: () => {
                if (this.challengeOver) return;
                this._dodgePatternIndex++;
                this._spawnDodgePattern();
            }
        });
    }

    _spawnDodgePattern() {
        const patterns = ['spiral', 'grid', 'random_burst', 'wave', 'cross'];
        const pattern = patterns[this._dodgePatternIndex % patterns.length];
        const cx = this.scale.width / 2;

        if (pattern === 'spiral') {
            // Spiral bullet pattern from center top
            for (let i = 0; i < 24; i++) {
                this.time.delayedCall(i * 80, () => {
                    if (this.challengeOver) return;
                    const angle = (i / 24) * Math.PI * 4; // 2 full rotations
                    const bx = cx + Math.cos(angle) * 30;
                    const speed = 180;
                    const vx = Math.cos(angle) * speed * 0.4;
                    const vy = speed;
                    this._spawnDodgeBullet(bx, 10, vx, vy);
                });
            }
        } else if (pattern === 'grid') {
            // Grid of bullets falling
            for (let col = 0; col < 10; col++) {
                for (let row = 0; row < 3; row++) {
                    this.time.delayedCall(row * 300, () => {
                        if (this.challengeOver) return;
                        const bx = 40 + col * 80;
                        this._spawnDodgeBullet(bx, -10, 0, 200);
                    });
                }
            }
        } else if (pattern === 'random_burst') {
            // Random bursts from multiple points
            for (let burst = 0; burst < 3; burst++) {
                const bx = Phaser.Math.Between(100, this.scale.width - 100);
                for (let j = 0; j < 8; j++) {
                    const angle = (j / 8) * Math.PI * 2;
                    this.time.delayedCall(burst * 500, () => {
                        if (this.challengeOver) return;
                        this._spawnDodgeBullet(bx, 30, Math.cos(angle) * 120, Math.sin(angle) * 120 + 100);
                    });
                }
            }
        } else if (pattern === 'wave') {
            // Sine-wave pattern across screen
            for (let i = 0; i < 15; i++) {
                this.time.delayedCall(i * 120, () => {
                    if (this.challengeOver) return;
                    const bx = (i / 15) * this.scale.width;
                    this._spawnDodgeBullet(bx, -5, 0, 160);
                });
            }
        } else if (pattern === 'cross') {
            // Cross pattern from center
            for (let i = 0; i < 12; i++) {
                this.time.delayedCall(i * 100, () => {
                    if (this.challengeOver) return;
                    // Vertical line
                    this._spawnDodgeBullet(cx, -10, 0, 220);
                    // Horizontal lines from sides
                    this._spawnDodgeBullet(0, 200 + i * 20, 200, 50);
                    this._spawnDodgeBullet(this.scale.width, 200 + i * 20, -200, 50);
                });
            }
        }
    }

    _spawnDodgeBullet(x, y, vx, vy) {
        const texture = this.textures.exists('bullet_energy1') ? 'bullet_energy1' : 'bullet_plasma1';
        const bullet = this.enemyBullets.create(x, y, texture);
        if (bullet) {
            bullet.setVelocity(vx, vy);
            bullet.setScale(0.6);
            bullet.setDepth(50);
            bullet.setTint(0xff4444);
            if (bullet.body) bullet.body.allowGravity = false;

            // Destroy if off screen
            this.time.delayedCall(5000, () => {
                if (bullet && bullet.active) bullet.destroy();
            });
        }
    }

    // ── Collisions ────────────────────────────────────────

    setupCollisions() {
        // Player bullets vs enemies
        this.physics.add.overlap(
            this.player.bullets, this.enemies,
            (bullet, enemy) => {
                if (bullet.active && enemy.active) {
                    bullet.destroy();
                    const damage = 10;
                    enemy.takeDamage(damage);
                    this.totalKills++;
                }
            }
        );

        // Player bullets vs bosses
        this.physics.add.overlap(
            this.player.bullets, this.bosses,
            (bullet, boss) => {
                if (bullet.active && boss.active) {
                    bullet.destroy();
                    boss.takeDamage(10);
                }
            }
        );

        // Enemy bullets vs player
        this.physics.add.overlap(
            this.enemyBullets, this.player,
            (bullet, player) => {
                if (bullet.active && player.active && !this.player.invincible && !this.player.isDying) {
                    bullet.destroy();
                    this.player.takeDamage(10);
                    if (!this.player.isAlive()) {
                        this._onPlayerDead();
                    }
                }
            }
        );

        // Enemies vs player collision
        this.physics.add.overlap(
            this.enemies, this.player,
            (enemy, player) => {
                if (enemy.active && player.active && !this.player.invincible && !this.player.isDying) {
                    enemy.die();
                    this.player.takeDamage(20);
                    if (!this.player.isAlive()) {
                        this._onPlayerDead();
                    }
                }
            }
        );

        // Collectibles vs player
        this.physics.add.overlap(
            this.collectibles, this.player,
            (obj1, obj2) => {
                let collectible = (obj1 === this.player) ? obj2 : obj1;
                if (!collectible || collectible.collected || !collectible.active) return;
                collectible.collected = true;

                if (this.soundManager) this.soundManager.playCollect();

                // For coin frenzy, count by type
                if (this.challenge.id === 'coin_frenzy') {
                    const type = collectible.type || 'coin';
                    if (type === COLLECTIBLE_TYPES.COIN || type === COLLECTIBLE_TYPES.FORTUNE_COIN) {
                        this.collectiblesGathered += 1;
                    } else if (type === COLLECTIBLE_TYPES.CRYSTAL) {
                        this.collectiblesGathered += 5;
                    } else if (type === COLLECTIBLE_TYPES.STAR) {
                        this.collectiblesGathered += 10;
                    } else {
                        this.collectiblesGathered += 1;
                    }
                } else {
                    const value = collectible.value || 10;
                    this.scoreManager.addCollectible(value, this.game.getTime(), collectible.type);
                }

                if (typeof collectible.collect === 'function') {
                    collectible.collect();
                } else {
                    collectible.destroy();
                }
            }
        );
    }

    _onPlayerDead() {
        if (this.challengeOver) return;
        const id = this.challenge.id;

        if (id === 'one_life') {
            this.challengeScore = this.wavesCompleted;
        } else if (id === 'dodge_master') {
            this.challengeScore = Math.floor((Date.now() - this.challengeStartTime) / 1000);
        } else if (id === 'speed_blitz') {
            this.challengeScore = this.scoreManager.getScore() * 3;
        } else if (id === 'boss_rush') {
            this.challengeScore = Math.floor((Date.now() - this.challengeStartTime) / 1000);
        } else {
            this.challengeScore = this.scoreManager.getScore();
        }
        this._endChallenge();
    }

    // ── UI ────────────────────────────────────────────────

    createChallengeUI() {
        const width = this.scale.width;

        // Challenge name
        this.challengeNameText = this.add.text(width / 2, 10, `${this.challenge.icon} ${this.challenge.name}`, {
            fontSize: '20px', fontFamily: 'monospace', color: this.challenge.color,
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5, 0).setDepth(1000);

        // Timer / Score display
        this.timerText = this.add.text(width / 2, 35, '', {
            fontSize: '24px', fontFamily: 'monospace', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5, 0).setDepth(1000);

        // Secondary info
        this.infoText = this.add.text(width / 2, 60, '', {
            fontSize: '16px', fontFamily: 'monospace', color: '#aaaaaa'
        }).setOrigin(0.5, 0).setDepth(1000);

        // Health bar
        this.healthBarBg = this.add.rectangle(10, this.scale.height - 25, 150, 14, 0x333333).setOrigin(0, 0).setDepth(1000);
        this.healthBarFill = this.add.rectangle(11, this.scale.height - 24, 148, 12, 0x00ff00).setOrigin(0, 0).setDepth(1001);
    }

    updateChallengeUI() {
        const id = this.challenge.id;
        const elapsed = (Date.now() - this.challengeStartTime) / 1000;

        if (id === 'speed_blitz') {
            const remaining = Math.max(0, 60 - elapsed);
            this.timerText.setText(`TIME: ${Math.ceil(remaining)}s`);
            this.infoText.setText(`Waves: ${this.wavesCompleted}/${this.wavesNeeded}  Score: ${this.scoreManager.getScore() * 3}`);
            if (remaining <= 0 && !this.challengeOver) {
                this.challengeScore = this.scoreManager.getScore() * 3;
                this._endChallenge();
            }
        } else if (id === 'boss_rush') {
            this.timerText.setText(`TIME: ${Math.floor(elapsed)}s`);
            this.infoText.setText(`Bosses: ${this.bossesDefeated}/5`);
        } else if (id === 'coin_frenzy') {
            const remaining = Math.max(0, 90 - elapsed);
            this.timerText.setText(`TIME: ${Math.ceil(remaining)}s`);
            this.infoText.setText(`Points: ${this.collectiblesGathered}`);
            if (remaining <= 0 && !this.challengeOver) {
                this.challengeScore = this.collectiblesGathered;
                this._endChallenge();
            }
        } else if (id === 'one_life') {
            this.timerText.setText(`WAVE: ${this.wavesCompleted + 1}`);
            this.infoText.setText(`HP: ${this.player.health}/${this.player.maxHealth}`);
        } else if (id === 'dodge_master') {
            const remaining = Math.max(0, 60 - elapsed);
            this.timerText.setText(`SURVIVE: ${Math.ceil(remaining)}s`);
            this.infoText.setText(`Time: ${Math.floor(elapsed)}s`);
            if (remaining <= 0 && !this.challengeOver) {
                this.challengeScore = 60; // perfect score = survived full 60s
                this._endChallenge();
            }
        }

        // Health bar
        if (this.player && this.player.active) {
            const pct = this.player.health / this.player.maxHealth;
            this.healthBarFill.displayWidth = Math.max(0, 148 * pct);
            this.healthBarFill.setFillStyle(pct <= 0.25 ? 0xff0000 : pct <= 0.5 ? 0xffff00 : 0x00ff00);
        }
    }

    // ── Starfield ─────────────────────────────────────────

    createStarfield() {
        if (this.textures.exists('background')) {
            const bg = this.add.image(this.scale.width / 2, this.scale.height / 2, 'background');
            bg.setDisplaySize(this.scale.width, this.scale.height);
            bg.setAlpha(0.4);
        }

        this.starfieldLayers = [];
        for (let i = 0; i < 2; i++) {
            const stars = this.add.group();
            const count = 30 + i * 15;
            const speed = 80 + i * 40;
            for (let j = 0; j < count; j++) {
                const star = this.add.circle(
                    Phaser.Math.Between(0, this.scale.width),
                    Phaser.Math.Between(0, this.scale.height),
                    1 + i * 0.5, 0xffffff, 0.3 + Math.random() * 0.5
                );
                star.setDepth(1);
                stars.add(star);
            }
            this.starfieldLayers.push({ stars, speed });
        }
    }

    updateStarfield() {
        const delta = this.game.loop.delta / 1000;
        this.starfieldLayers.forEach(layer => {
            layer.stars.children.entries.forEach(star => {
                star.y += layer.speed * delta;
                if (star.y > this.scale.height) {
                    star.y = 0;
                    star.x = Phaser.Math.Between(0, this.scale.width);
                }
            });
        });
    }

    // ── Update Loop ───────────────────────────────────────

    update(time) {
        if (this.challengeOver) return;

        this.updateStarfield();
        this.player.update(time);

        // Update enemies
        this.enemies.children.entries.forEach(e => {
            if (e && e.active) e.update(time);
        });

        // Update bosses
        this.bosses.children.entries.forEach(boss => {
            if (boss && boss.active) {
                boss.update(time);
                // Boss bullet overlap (one-time setup)
                if (boss.bullets && !boss._challengeOverlapSetup) {
                    boss._challengeOverlapSetup = true;
                    this.physics.add.overlap(
                        boss.bullets, this.player,
                        (bullet, player) => {
                            if (bullet.active && player.active && !this.player.invincible && !this.player.isDying) {
                                bullet.destroy();
                                this.player.takeDamage(15);
                                if (!this.player.isAlive()) this._onPlayerDead();
                            }
                        }
                    );
                }
            }
        });

        // Update formations if they exist
        if (this.formationManager) {
            this.formationManager.update(time);
            this.formationManager.activeFormations.forEach(formation => {
                formation.enemies.forEach(enemy => {
                    if (enemy && enemy.active && !this.enemies.contains(enemy)) {
                        this.enemies.add(enemy);
                    }
                });
            });
        }

        // Update collectibles
        this.collectibles.children.entries.slice().forEach(c => {
            if (c && c.active && !c.collected) {
                if (c.update) c.update(this.player);
                if (c.y > this.scale.height + 50) c.destroy();
            }
        });

        // Clean off-screen enemy bullets
        this.enemyBullets.children.entries.slice().forEach(b => {
            if (b && b.active) {
                if (b.y > this.scale.height + 30 || b.y < -30 || b.x < -30 || b.x > this.scale.width + 30) {
                    b.destroy();
                }
            }
        });

        this.updateChallengeUI();
    }

    // ── End Challenge ─────────────────────────────────────

    _endChallenge() {
        if (this.challengeOver) return;
        this.challengeOver = true;

        // Save score
        StatsTracker.updateChallengeScore(this.challenge.id, this.challengeScore);

        // Award XP
        const xpManager = new XPManager();
        xpManager.addXP(this.challenge.xpReward);

        // Show results overlay
        this._showResults();
    }

    _showResults() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85).setDepth(2000);

        // Title
        this.add.text(width / 2, height / 2 - 120, 'CHALLENGE COMPLETE!', {
            fontSize: '28px', fontFamily: 'monospace', color: '#00ff00',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(2001);

        // Challenge name
        this.add.text(width / 2, height / 2 - 85, `${this.challenge.icon} ${this.challenge.name}`, {
            fontSize: '22px', fontFamily: 'monospace', color: this.challenge.color
        }).setOrigin(0.5).setDepth(2001);

        // Score
        const scoreLabel = this.challenge.invertScore ? 'Time' : 'Score';
        const scoreVal = this.challenge.invertScore
            ? `${this.challengeScore}s`
            : this.challengeScore.toLocaleString();
        this.add.text(width / 2, height / 2 - 40, `${scoreLabel}: ${scoreVal}`, {
            fontSize: '32px', fontFamily: 'monospace', color: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2001);

        // Star rating
        const bestScore = StatsTracker.getChallengeScore(this.challenge.id);
        const stars = this._getStarRating(bestScore);
        const starsStr = stars >= 3 ? '★★★ GOLD' : stars >= 2 ? '★★ SILVER' : stars >= 1 ? '★ BRONZE' : 'NO MEDAL';
        const starsColor = stars >= 3 ? '#ffd700' : stars >= 2 ? '#c0c0c0' : stars >= 1 ? '#cd7f32' : '#666666';
        this.add.text(width / 2, height / 2, starsStr, {
            fontSize: '24px', fontFamily: 'monospace', color: starsColor
        }).setOrigin(0.5).setDepth(2001);

        // XP earned
        this.add.text(width / 2, height / 2 + 35, `+${this.challenge.xpReward} XP`, {
            fontSize: '18px', fontFamily: 'monospace', color: '#ffd700'
        }).setOrigin(0.5).setDepth(2001);

        // Buttons
        const retryBtn = this.add.rectangle(width / 2 - 100, height / 2 + 90, 160, 45, 0x00ff00);
        retryBtn.setInteractive({ useHandCursor: true }).setDepth(2001);
        this.add.text(width / 2 - 100, height / 2 + 90, 'RETRY', {
            fontSize: '18px', fontFamily: 'monospace', color: '#000000', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2002);
        retryBtn.on('pointerdown', () => {
            this.scene.restart({ challenge: this.challenge });
        });
        retryBtn.on('pointerover', () => retryBtn.setFillStyle(0x44ff44));
        retryBtn.on('pointerout', () => retryBtn.setFillStyle(0x00ff00));

        const backBtn = this.add.rectangle(width / 2 + 100, height / 2 + 90, 160, 45, 0x00ffff);
        backBtn.setInteractive({ useHandCursor: true }).setDepth(2001);
        this.add.text(width / 2 + 100, height / 2 + 90, 'BACK', {
            fontSize: '18px', fontFamily: 'monospace', color: '#000000', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2002);
        backBtn.on('pointerdown', () => {
            this.scene.start('ChallengeSelectScene');
        });
        backBtn.on('pointerover', () => backBtn.setFillStyle(0x44ffff));
        backBtn.on('pointerout', () => backBtn.setFillStyle(0x00ffff));
    }

    _getStarRating(score) {
        if (score <= 0) return 0;
        const t = this.challenge.thresholds;
        if (this.challenge.invertScore) {
            if (score <= t.gold) return 3;
            if (score <= t.silver) return 2;
            if (score <= t.bronze) return 1;
        } else {
            if (score >= t.gold) return 3;
            if (score >= t.silver) return 2;
            if (score >= t.bronze) return 1;
        }
        return 0;
    }

    // Stub methods that game entities may call
    triggerGameOver() { this._onPlayerDead(); }
    showDamageNumber() {}
    applyPowerUp() {}
    spawnMiniBoss() {}
    spawnHazards() {}
}

import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import Boss from '../entities/Boss.js';
import Collectible from '../entities/Collectible.js';
import PowerUp from '../entities/PowerUp.js';
import Hazard from '../entities/Hazard.js';
import Drone from '../entities/Drone.js';
import FormationManager from '../managers/FormationManager.js';
import WaveManager from '../managers/WaveManager.js';
import ScoreManager from '../managers/ScoreManager.js';
import SoundManager from '../managers/SoundManager.js';
import StreakManager from '../managers/StreakManager.js';
import EffectManager from '../managers/EffectManager.js';
import RandomEventManager from '../managers/RandomEventManager.js';
import AchievementManager from '../managers/AchievementManager.js';
import XPManager from '../managers/XPManager.js';
import BonusSystem from '../systems/BonusSystem.js';
import DailyChallenge from '../managers/DailyChallenge.js';
import TouchControls from '../ui/TouchControls.js';
import ScreenWipe from '../effects/ScreenWipe.js';
import Pet from '../entities/Pet.js';
import MusicManager from '../managers/MusicManager.js';
import StatsTracker from '../managers/StatsTracker.js';
import ParticleEngine from '../systems/ParticleEngine.js';
import ReplayManager from '../managers/ReplayManager.js';
import TipsManager from '../managers/TipsManager.js';
import HUDConfig from '../ui/HUDConfig.js';
import { COLLECTIBLE_TYPES, COLLECTIBLE_VALUES, GAME_CONFIG, EFFECT_CONFIG, POWERUP_TYPES, POWERUP_CONFIG, POWERUP_DROP_CHANCE, KILL_MILESTONES, WAVE_NAMES, DIFFICULTY_MODES, COMBO_ANNOUNCEMENTS, SHIP_SKINS, WEAPON_TYPES, WEAPON_CONFIG, WEAPON_UPGRADE_NAMES, HAZARD_TYPES, HAZARD_CONFIG, DRONE_CONFIG, PET_TYPES, PET_CONFIG, ACHIEVEMENT_REWARDS, WEATHER_TYPES, WEATHER_CONFIG, MINI_BOSS_CONFIG } from '../utils/constants.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        // Endless mode flag passed from menu
        this._initEndlessMode = data && data.endlessMode === true;
    }

    create() {
        // Fade in
        this.cameras.main.fadeIn(300, 0, 0, 0);

        // Endless mode setup
        this.endlessMode = this._initEndlessMode || false;

        // Load difficulty settings
        const difficultyKey = localStorage.getItem('fortune-difficulty') || 'NORMAL';
        this.difficulty = DIFFICULTY_MODES[difficultyKey] || DIFFICULTY_MODES.NORMAL;

        // Create starfield background
        this.createStarfield();

        // Initialize managers
        this.formationManager = new FormationManager(this);
        this.waveManager = new WaveManager(this);
        this.waveManager.endlessMode = this.endlessMode;
        this.scoreManager = new ScoreManager(this);
        this.soundManager = new SoundManager(this);
        this.streakManager = new StreakManager(this);
        this.effectManager = new EffectManager(this);
        this.bonusSystem = new BonusSystem(this);

        // HUD configuration
        this.hudConfig = new HUDConfig();

        // Replay manager
        this.replayManager = new ReplayManager();

        // Tips manager
        this.tipsManager = new TipsManager(this);

        // Color blind mode
        this.colorBlindMode = localStorage.getItem('fortune-color-blind') === 'true';

        // Combo finisher state
        this.finisherReady = false;
        this.finisherButton = null;
        this.finisherText = null;
        this.finisherTimer = null;
        this.finisherActive = false;
        this.finisherEndTime = 0;

        // Create player
        this.player = new Player(this, this.scale.width / 2, this.scale.height - 50);

        // XP Manager — apply perks before difficulty
        this.xpManager = new XPManager();
        const hpBonus = this.xpManager.getHPBonus();
        const unlockedWeapons = this.xpManager.getUnlockedWeapons();
        unlockedWeapons.forEach(w => this.player.unlockWeapon(w));

        // Apply difficulty to player health
        let baseHealth = GAME_CONFIG.PLAYER_HEALTH;
        if (hpBonus > 0) baseHealth = Math.floor(baseHealth * (1 + hpBonus));
        if (this.difficulty.healthMultiplier !== 1) {
            this.player.maxHealth = Math.floor(baseHealth * this.difficulty.healthMultiplier);
        } else {
            this.player.maxHealth = baseHealth;
        }
        this.player.health = this.player.maxHealth;

        // Touch controls for mobile
        this.touchControls = null;
        if (TouchControls.isTouchDevice()) {
            this.touchControls = new TouchControls(this.player);
        }

        // Daily challenge tracking
        this.dailyChallenge = new DailyChallenge();
        this.dailyChallengeCoins = 0;

        // Spin power-up pending from shop
        this._spinPowerUpPending = false;

        // Create groups
        this.enemies = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.collectibles = this.physics.add.group();
        this.powerups = this.physics.add.group();
        this.bosses = this.physics.add.group();

        // Hazards
        this.hazards = [];

        // Companion drone
        this.drone = null;
        this.droneUnlocked = !!localStorage.getItem('fortune-drone-unlocked');

        // Edge warning arrows
        this.edgeWarnings = [];

        // Kill milestone tracking
        this.totalKills = 0;
        this.reachedMilestones = new Set();

        // Active power-up timers for UI
        this.activePowerUpTimers = [];

        // Combo announcement tracking
        this.lastComboAnnouncement = 0;

        // Collision detection
        this.setupCollisions();

        // UI
        this.createUI();

        // Ensure chat box polling is active if Ridhaan is playing
        if (window.chatBox) {
            window.chatBox.startPolling();
        }

        // Initialize particle engine and legacy emitter
        this.particleEngine = new ParticleEngine(this);
        this.particleEmitter = null;

        // Random event manager
        this.randomEventManager = new RandomEventManager(this);

        // Achievement manager
        this.achievementManager = new AchievementManager(this);

        // Apply XP start perks
        if (this.xpManager.startsWithShield()) {
            this.applyPowerUp(POWERUP_TYPES.SHIELD);
        }

        // Konami code: apply all power-ups for 30 seconds
        if (sessionStorage.getItem('fortune-konami-activated') === 'true') {
            sessionStorage.removeItem('fortune-konami-activated');
            this.time.delayedCall(500, () => {
                this.applyPowerUp(POWERUP_TYPES.SHIELD);
                this.applyPowerUp(POWERUP_TYPES.RAPID_FIRE);
                this.applyPowerUp(POWERUP_TYPES.MAGNET);
                this.effectManager.showScorePopup(
                    this.scale.width / 2, this.scale.height / 2,
                    'ALL POWER-UPS!', { color: '#ff00ff', size: '28px', prefix: '' }
                );
            });
        }

        // High score tracking for real-time celebration
        this.personalBest = this.getPersonalBest();
        this.highScoreBeaten = false;

        // --- PET SYSTEM ---
        this.pet = null;
        const selectedPet = localStorage.getItem('fortune-selected-pet');
        if (selectedPet && PET_CONFIG[selectedPet]) {
            this.pet = new Pet(this, this.player, selectedPet);
            // Apply pet passive abilities
            if (this.pet.getScoreBonus() > 0) {
                this.scoreManager.petScoreBonus = this.pet.getScoreBonus();
            }
            if (this.pet.getMagnetRangeBonus() > 0) {
                this.player.baseMagnetRange += this.pet.getMagnetRangeBonus();
            }
        }

        // --- ACHIEVEMENT REWARDS ---
        this.applyAchievementRewards();

        // --- AUTO-DIFFICULTY ADJUSTMENT (hidden) ---
        this.deathsThisWave = 0;
        this.autoDifficultyActive = false;
        this.autoDifficultyEnemySpeedMod = 1;
        this.autoDifficultyDropMod = 1;
        this.perfectWaveStreak = 0;
        this.nextWaveSpeedBoost = 1;

        // --- WEATHER SYSTEM ---
        this.currentWeather = WEATHER_TYPES.NORMAL;
        this.weatherParticles = [];
        this.weatherGraphics = this.add.graphics();
        this.weatherGraphics.setDepth(2);
        this.weatherOverlay = null;

        // --- DANGER ZONE ---
        this.dangerZoneGraphics = this.add.graphics();
        this.dangerZoneGraphics.setDepth(997);
        this.dangerZoneText = null;
        this.dangerFrameCounter = 0;

        // Magnet beam graphics
        this.magnetGraphics = this.add.graphics();
        this.magnetGraphics.setDepth(95);

        // Game session tracking
        this.gameStartTime = Date.now();
        this.powerupsCollected = 0;
        this.waveDamageTaken = false; // track damage per wave for survival bonus

        // Bonus stage state
        this.bonusStageActive = false;
        this.bonusStageTimer = 0;
        this.bonusStageCollected = 0;
        this.bonusStageTimerText = null;
        this.bonusStageLabel = null;

        // Start first wave with wave name
        this.waveManager.startWave(1);
        this.bonusSystem.startWave(1);
        this.showWaveNameDisplay(1);

        // Pause key
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.pauseKey.on('down', () => {
            this.scene.pause();
            this.scene.launch('PauseScene');
        });

        // --- MUSIC MANAGER ---
        this.musicManager = new MusicManager(this);
        this.musicManager.start();

        // --- EMOTE KEYS (1-4) ---
        this.emoteKeys = {
            1: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
            2: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
            3: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
            4: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR)
        };
        this.emoteKeys[1].on('down', () => this.showEmote(1));
        this.emoteKeys[2].on('down', () => this.showEmote(2));
        this.emoteKeys[3].on('down', () => this.showEmote(3));
        this.emoteKeys[4].on('down', () => this.showEmote(4));
        this.emoteCooldown = false;

        // F key for combo finisher
        this.finisherKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.finisherKey.on('down', () => this.activateFinisher());

        // Track weapon switch for tips
        const origCycleWeapon = this.player.cycleWeapon.bind(this.player);
        this.player.cycleWeapon = () => {
            origCycleWeapon();
            if (this.tipsManager) this.tipsManager.onWeaponSwitch();
        };

        // Camera: subtle follow player with lerp
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setFollowOffset(0, -this.scale.height / 2 + 50);
        // Stop following so it's just a subtle lag, not a full chase
        this.time.delayedCall(100, () => {
            this.cameras.main.stopFollow();
        });

        // Low health vignette overlay
        this.lowHealthOverlay = this.add.rectangle(
            this.scale.width / 2, this.scale.height / 2,
            this.scale.width + 40, this.scale.height + 40,
            0xff0000, 0
        );
        this.lowHealthOverlay.setDepth(998);
        this.lowHealthOverlay.setScrollFactor(0);

        // Game state
        this.gameOver = false;
        this.paused = false;
        this.waveTransitioning = false;
        this._pendingBonusStage = false;

        // Listen for scene resume (after shop closes) to trigger bonus stage
        this.events.on('resume', () => {
            if (this._pendingBonusStage) {
                this._pendingBonusStage = false;
                this.startBonusStage();
            }
        });

        // Unlock skins based on best score
        this.checkSkinUnlocks();
    }

    checkSkinUnlocks() {
        const scores = JSON.parse(localStorage.getItem('fortune_leaderboard') || '[]');
        const best = scores.length > 0 ? Math.max(...scores) : 0;
        const unlocked = JSON.parse(localStorage.getItem('fortune-unlocked-skins') || '["default"]');
        let changed = false;
        Object.keys(SHIP_SKINS).forEach(id => {
            if (!unlocked.includes(id) && best >= SHIP_SKINS[id].unlockScore) {
                unlocked.push(id);
                changed = true;
            }
        });
        if (changed) {
            localStorage.setItem('fortune-unlocked-skins', JSON.stringify(unlocked));
        }
    }

    showWaveNameDisplay(waveNumber) {
        const isBoss = waveNumber % 5 === 0 && waveNumber > 0;
        if (this.musicManager) this.musicManager.setBossMode(isBoss);
        let waveName;

        if (isBoss) {
            // Use boss name
            const bossIndex = Math.floor((waveNumber / 5) - 1) % 5;
            const bossNames = ['Mothership', 'Dreadnought', 'Battlecruiser', 'Destroyer', 'Overlord'];
            waveName = `BOSS: ${bossNames[bossIndex]}`;
        } else if (WAVE_NAMES[waveNumber]) {
            waveName = WAVE_NAMES[waveNumber];
        } else {
            waveName = WAVE_NAMES.RANDOM_POOL[Math.floor(Math.random() * WAVE_NAMES.RANDOM_POOL.length)];
        }

        this.effectManager.showWaveName(waveNumber, waveName, isBoss);

        // Update background tint every 5 waves
        this.setBackgroundTintForWave(waveNumber);
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

        // Background ambient objects (planets, nebulae)
        this.bgObjects = [];
        this.createBgAmbientObjects();

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

    createBgAmbientObjects() {
        // Create 2-3 distant parallax objects (planets/nebulae)
        const types = ['planet', 'planet', 'nebula'];
        for (let i = 0; i < 3; i++) {
            const type = types[i];
            const x = Phaser.Math.Between(50, this.scale.width - 50);
            const y = Phaser.Math.Between(-200, this.scale.height);
            const obj = this.add.circle(x, y,
                type === 'planet' ? Phaser.Math.Between(30, 60) : Phaser.Math.Between(50, 90),
                type === 'planet' ? Phaser.Math.Between(0x334455, 0x665544) : 0x220044,
                type === 'planet' ? 0.12 : 0.08
            );
            obj.setDepth(1);
            obj._bgType = type;
            obj._speed = type === 'planet' ? 8 + i * 3 : 5;
            this.bgObjects.push(obj);
        }
    }

    updateBgAmbientObjects() {
        const delta = this.game.loop.delta / 1000;
        for (const obj of this.bgObjects) {
            obj.y += obj._speed * delta;
            if (obj.y > this.scale.height + 100) {
                obj.y = -100;
                obj.x = Phaser.Math.Between(50, this.scale.width - 50);
            }
        }
    }

    setBackgroundTintForWave(wave) {
        // Every 5 waves, shift background hue
        const tints = [0xffffff, 0xddaaff, 0xaaddff, 0xaaffaa, 0xffddaa, 0xffaacc];
        const tintIndex = Math.floor(wave / 5) % tints.length;
        const tint = tints[tintIndex];
        if (this.bg1) this.bg1.setTint(tint);
        if (this.bg2) this.bg2.setTint(tint);
    }

    setupCollisions() {
        // Player bullets vs enemies (check all active formations)
        this.physics.add.overlap(
            this.player.bullets,
            this.enemies,
            (bullet, enemy) => {
                if (bullet.active && enemy.active) {
                    bullet.destroy();
                    this.bonusSystem.recordShotHit();
                    const isCrit = Math.random() < 0.1;
                    let damage = isCrit ? 20 : 10;
                    if (this.pet) damage += this.pet.getExtraDamage();
                    if (this.achievementDamageBonus) damage = Math.floor(damage * (1 + this.achievementDamageBonus));
                    if (this.finisherActive) damage *= 3;
                    enemy.takeDamage(damage);
                    this.showDamageNumber(enemy.x, enemy.y, damage, isCrit || this.finisherActive);
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
                    this.bonusSystem.recordShotHit();
                    const isCrit = Math.random() < 0.1;
                    let damage = isCrit ? 20 : 10;
                    if (this.pet) damage += this.pet.getExtraDamage();
                    if (this.achievementDamageBonus) damage = Math.floor(damage * (1 + this.achievementDamageBonus));
                    if (this.finisherActive) damage *= 3;
                    boss.takeDamage(damage);
                    this.showDamageNumber(boss.x, boss.y, damage, isCrit || this.finisherActive);
                }
            }
        );
        
        // Enemy bullets vs player
        this.physics.add.overlap(
            this.enemyBullets,
            this.player,
            (bullet, player) => {
                if (bullet.active && player.active && !this.player.invincible && !this.player.isDying) {
                    // Ghost pet dodge check
                    if (this.pet && this.pet.shouldDodge()) {
                        bullet.destroy();
                        this.effectManager.showScorePopup(
                            this.player.x, this.player.y - 30,
                            'DODGED!', { color: '#ffffff', size: '16px', prefix: '' }
                        );
                        return;
                    }
                    bullet.destroy();
                    const bulletSpeed = bullet.body ? Math.abs(bullet.body.velocity.y) : 400;
                    this.player.takeDamage(10);
                    this.waveDamageTaken = true;
                    if (this.player.isDying) this.onPlayerDeath();
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
                    this.waveDamageTaken = true;
                    if (this.player.isDying) this.onPlayerDeath();
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
                const collectResult = this.scoreManager.addCollectible(value, this.game.getTime(), type);
                if (collectResult && collectResult.chain) {
                    this.handleCollectibleChain(collectResult.chain);
                }
                if (this.achievementManager) this.achievementManager.onCollectibleCollected();
                if (this.bonusStageActive) this.bonusStageCollected++;
                if (type === COLLECTIBLE_TYPES.COIN || type === COLLECTIBLE_TYPES.FORTUNE_COIN) this.dailyChallengeCoins++;
                StatsTracker.recordCollectible(type);
                this.updateUI();

                // Collect the item (handles effects and destruction)
                if (typeof collectible.collect === 'function') {
                    collectible.collect();
                } else {
                    collectible.destroy();
                }
            }
        );
        
        // Power-ups vs player
        this.physics.add.overlap(
            this.powerups,
            this.player,
            (obj1, obj2) => {
                let powerup, player;
                if (obj1 === this.player || obj1?.constructor?.name === 'Player') {
                    player = obj1;
                    powerup = obj2;
                } else {
                    powerup = obj1;
                    player = obj2;
                }

                if (!powerup || !player || powerup.collected || !powerup.active || !player.active) return;

                powerup.collected = true;
                this.applyPowerUp(powerup.type);

                if (this.soundManager) {
                    this.soundManager.playCollect();
                }

                if (typeof powerup.collect === 'function') {
                    powerup.collect();
                } else {
                    powerup.destroy();
                }
            }
        );

        // Boss bullets vs player (set up in update loop for dynamic tracking)
    }

    applyHUDVisibility() {
        if (!this.hudConfig) return;
        const vis = (key) => this.hudConfig.isVisible(key);
        if (this.scoreText) this.scoreText.setVisible(vis('score'));
        if (this.multiplierBadge) this.multiplierBadge.setVisible(vis('score'));
        if (this.comboText) this.comboText.setVisible(vis('combo'));
        if (this.livesText) this.livesText.setVisible(vis('lives'));
        if (this.waveText) this.waveText.setVisible(vis('wave'));
        if (this.healthBarBg) this.healthBarBg.setVisible(vis('healthBar'));
        if (this.healthBarFill) this.healthBarFill.setVisible(vis('healthBar'));
        if (this.healthText) this.healthText.setVisible(vis('healthBar'));
        if (this.accuracyText) this.accuracyText.setVisible(vis('accuracy'));
        if (this.streakText) this.streakText.setVisible(vis('streak'));
        if (this.currencyText) this.currencyText.setVisible(vis('currency'));
        if (this.radarBg) this.radarBg.setVisible(vis('radar'));
    }

    createUI() {
        // Score text
        this.scoreText = this.add.text(10, 10, 'Score: 0', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
        this.scoreText.setDepth(1000);

        // Multiplier badge (next to score)
        this.multiplierBadge = this.add.text(0, 10, '', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffd700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.multiplierBadge.setDepth(1001);
        this.multiplierBadge.setAlpha(0);
        this._lastMultiplier = 1;
        this._scorePulseTween = null;

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

        // --- Health Bar ---
        this.healthBarBg = this.add.rectangle(10, 88, 150, 14, 0x333333);
        this.healthBarBg.setOrigin(0, 0);
        this.healthBarBg.setDepth(1000);

        this.healthBarFill = this.add.rectangle(11, 89, 148, 12, 0x00ff00);
        this.healthBarFill.setOrigin(0, 0);
        this.healthBarFill.setDepth(1001);

        this.healthText = this.add.text(165, 87, `HP: ${this.player.health}/${this.player.maxHealth}`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
        this.healthText.setDepth(1000);

        // --- Power-up indicators container ---
        this.powerUpIndicators = [];

        // --- Weapon type display (with upgrade name) ---
        const initWeaponName = this.getWeaponDisplayName();
        this.weaponText = this.add.text(10, 128, initWeaponName, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#00ffff'
        });
        this.weaponText.setDepth(1000);

        // --- Screenshot button ---
        this.screenshotBtn = this.add.text(this.scale.width - 40, 10, '\uD83D\uDCF8', {
            fontSize: '24px'
        }).setInteractive({ useHandCursor: true }).setDepth(1002).setScrollFactor(0);
        this.screenshotBtn.on('pointerdown', () => this.takeScreenshot());

        // --- Sound toggle icon ---
        const soundLvl = localStorage.getItem('fortune-sound-level') || 'HIGH';
        this.soundIcon = this.add.text(this.scale.width - 40, 40, soundLvl === 'OFF' ? '\uD83D\uDD07' : '\uD83D\uDD0A', {
            fontSize: '20px'
        }).setInteractive({ useHandCursor: true }).setDepth(1002).setScrollFactor(0);
        this.soundIcon.on('pointerdown', () => {
            const level = this.soundManager.cycleSoundLevel();
            this.soundIcon.setText(level === 'OFF' ? '\uD83D\uDD07' : '\uD83D\uDD0A');
        });

        // --- Level display ---
        const lvl = this.xpManager ? this.xpManager.getLevel() : 1;
        this.levelText = this.add.text(this.scale.width - 150, 100, `Lv.${lvl}`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffd700'
        });
        this.levelText.setDepth(1000);
        this.levelText.setOrigin(0, 0);

        // --- Mini Radar ---
        this.createRadar();

        // --- Mobile weapon switch button ---
        if (this.touchControls) {
            this.createWeaponSwitchButton();
        }

        // Endless mode HUD indicator
        if (this.endlessMode) {
            this.endlessBadge = this.add.text(this.scale.width / 2, 10, 'ENDLESS MODE', {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#ff00ff',
                stroke: '#000000',
                strokeThickness: 2,
                fontStyle: 'bold'
            });
            this.endlessBadge.setOrigin(0.5, 0);
            this.endlessBadge.setDepth(1002);
        }

        // Apply HUD visibility preferences
        this.applyHUDVisibility();
    }

    createRadar() {
        const radarSize = 80;
        const radarX = this.scale.width - radarSize / 2 - 10;
        const radarY = radarSize / 2 + 120;

        // Radar background
        this.radarBg = this.add.circle(radarX, radarY, radarSize / 2, 0x000000, 0.5);
        this.radarBg.setStrokeStyle(1, 0x00ff00, 0.5);
        this.radarBg.setDepth(999);

        this.radarCenter = { x: radarX, y: radarY };
        this.radarSize = radarSize;
        this.radarDots = [];
    }

    updateRadar() {
        // Clean old dots
        this.radarDots.forEach(d => { if (d) d.destroy(); });
        this.radarDots = [];

        // Skip if radar hidden
        if (this.hudConfig && !this.hudConfig.isVisible('radar')) return;

        const cx = this.radarCenter.x;
        const cy = this.radarCenter.y;
        const halfR = this.radarSize / 2;
        const scaleX = halfR / (this.scale.width / 2);
        const scaleY = halfR / (this.scale.height / 2);
        const playerCX = this.scale.width / 2;
        const playerCY = this.scale.height / 2;

        // Player dot (green, center)
        const playerDot = this.add.circle(cx, cy, 2, 0x00ff00, 1);
        playerDot.setDepth(1000);
        this.radarDots.push(playerDot);

        // Helper to add a radar dot
        const addDot = (worldX, worldY, color, size = 1.5) => {
            const rx = cx + (worldX - this.player.x) * scaleX;
            const ry = cy + (worldY - this.player.y) * scaleY;
            // Only show if within radar circle
            const dist = Phaser.Math.Distance.Between(rx, ry, cx, cy);
            if (dist < halfR - 2) {
                const dot = this.add.circle(rx, ry, size, color, 0.9);
                dot.setDepth(1000);
                this.radarDots.push(dot);
            }
        };

        // Enemies (red)
        this.enemies.children.entries.forEach(e => {
            if (e && e.active) addDot(e.x, e.y, 0xff0000);
        });

        // Bosses (large red)
        this.bosses.children.entries.forEach(b => {
            if (b && b.active) addDot(b.x, b.y, 0xff0000, 3);
        });

        // Power-ups (blue)
        this.powerups.children.entries.forEach(p => {
            if (p && p.active && !p.collected) addDot(p.x, p.y, 0x4488ff);
        });

        // Collectibles (yellow)
        this.collectibles.children.entries.forEach(c => {
            if (c && c.active && !c.collected) addDot(c.x, c.y, 0xffff00, 1);
        });
    }

    createWeaponSwitchButton() {
        const btnX = this.scale.width - 60;
        const btnY = this.scale.height - 60;

        const btn = this.add.circle(btnX, btnY, 25, 0x333366, 0.7);
        btn.setStrokeStyle(2, 0x00ffff, 0.8);
        btn.setDepth(1000);
        btn.setInteractive();

        const label = this.add.text(btnX, btnY, 'W', {
            fontSize: '18px', fontFamily: 'monospace', color: '#00ffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1001);

        btn.on('pointerdown', () => {
            if (this.player) this.player.cycleWeapon();
        });

        this.weaponSwitchBtn = btn;
        this.weaponSwitchLabel = label;
    }

    updateUI() {
        this.scoreText.setText(`Score: ${this.scoreManager.getScore()}`);

        const combo = this.scoreManager.getCombo();
        const multiplier = this.scoreManager.getComboMultiplier();

        if (combo > 0) {
            this.comboText.setText(`Combo: x${multiplier.toFixed(1)}`);

            // Position multiplier badge next to score text
            this.multiplierBadge.setX(this.scoreText.x + this.scoreText.width + 10);
            this.multiplierBadge.setText(`x${multiplier.toFixed(1)}`);
            this.multiplierBadge.setAlpha(1);

            // Pulse score text when multiplier active
            if (!this._scorePulseTween) {
                this._scorePulseTween = this.tweens.add({
                    targets: this.scoreText,
                    alpha: { from: 1, to: 0.7 },
                    duration: 400,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }

            // Flash badge bigger when multiplier increases
            if (multiplier > this._lastMultiplier) {
                this.tweens.add({
                    targets: this.multiplierBadge,
                    scale: { from: 1.6, to: 1 },
                    duration: 300,
                    ease: 'Back.easeOut'
                });
            }
            this._lastMultiplier = multiplier;
        } else {
            // Combo lost - show fade text if we had a multiplier
            if (this._lastMultiplier > 1) {
                this._lastMultiplier = 1;
                const lostText = this.add.text(this.scoreText.x + 60, this.scoreText.y + 20, 'combo lost', {
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#ff4444',
                    fontStyle: 'italic'
                });
                lostText.setDepth(1001);
                this.tweens.add({
                    targets: lostText,
                    alpha: 0,
                    y: lostText.y - 20,
                    duration: 800,
                    onComplete: () => lostText.destroy()
                });
            }

            this.comboText.setText('');
            this.multiplierBadge.setAlpha(0);

            // Stop score pulse
            if (this._scorePulseTween) {
                this._scorePulseTween.stop();
                this._scorePulseTween = null;
                this.scoreText.setAlpha(1);
            }
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

        // Update health bar
        if (this.healthBarFill && this.player) {
            const healthPct = this.player.health / this.player.maxHealth;
            const targetWidth = Math.max(0, 148 * healthPct);

            // Smooth tween
            this.tweens.add({
                targets: this.healthBarFill,
                displayWidth: targetWidth,
                duration: 200,
                ease: 'Power1'
            });

            // Color based on health %
            let barColor = 0x00ff00;
            if (healthPct <= 0.25) barColor = 0xff0000;
            else if (healthPct <= 0.5) barColor = 0xffff00;
            this.healthBarFill.setFillStyle(barColor);

            // Color blind mode: show bigger numeric HP
            if (this.colorBlindMode) {
                this.healthText.setText(`HP: ${this.player.health}/${this.player.maxHealth}`);
                this.healthText.setFontSize('16px');
                this.healthText.setStyle({ fontStyle: 'bold' });
            } else {
                this.healthText.setText(`HP: ${this.player.health}/${this.player.maxHealth}`);
            }
        }

        // Update weapon display with upgrade name
        if (this.weaponText && this.player) {
            const displayName = this.getWeaponDisplayName();
            const wConfig = WEAPON_CONFIG[this.player.currentWeapon];
            this.weaponText.setText(`${displayName} [Q]`);
            this.weaponText.setColor(Phaser.Display.Color.IntegerToColor(wConfig.color).rgba);
        }

        // Update power-up indicators
        this.updatePowerUpIndicators();
    }

    updatePowerUpIndicators() {
        // Clear old indicators
        this.powerUpIndicators.forEach(indicator => {
            if (indicator.bg) indicator.bg.destroy();
            if (indicator.text) indicator.text.destroy();
        });
        this.powerUpIndicators = [];

        const startX = 10;
        const startY = 108;

        this.activePowerUpTimers.forEach((timer, index) => {
            const x = startX + index * 60;

            let label = timer.label;
            if (!timer.permanent) {
                const elapsed = this.time.now - timer.startTime;
                const remaining = Math.max(0, Math.ceil((timer.duration - elapsed) / 1000));
                label = `${timer.label} ${remaining}s`;
            } else if (timer.label === 'SHIELD') {
                label = `S:${this.player.shieldHits}`;
            }

            const bg = this.add.rectangle(x, startY, 55, 16, timer.color, 0.3);
            bg.setOrigin(0, 0);
            bg.setDepth(1000);

            const text = this.add.text(x + 3, startY + 1, label, {
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#ffffff'
            });
            text.setDepth(1001);

            this.powerUpIndicators.push({ bg, text });
        });
    }

    update(time) {
        if (this.gameOver || this.paused) return;

        // Update bonus stage if active
        if (this.bonusStageActive) {
            this.updateBonusStage(this.game.loop.delta);
        }

        // Update starfield and ambient bg objects
        this.updateStarfield();
        this.updateBgAmbientObjects();

        // Update player
        this.player.update(time);
        
        // Update managers
        this.formationManager.update(time);
        this.scoreManager.updateCombo();
        this.streakManager.update(this.game.loop.delta);

        // Combo announcements + achievement tracking
        const currentCombo = this.scoreManager.getCombo();
        if (currentCombo > 0 && currentCombo !== this.lastComboAnnouncement) {
            // Achievement check for combo
            if (this.achievementManager) {
                this.achievementManager.onComboChanged(currentCombo);
            }
            for (let i = COMBO_ANNOUNCEMENTS.length - 1; i >= 0; i--) {
                if (currentCombo === COMBO_ANNOUNCEMENTS[i].combo) {
                    this.effectManager.showComboAnnouncement(currentCombo);
                    this.lastComboAnnouncement = currentCombo;
                    // Color blind mode: add shape indicators alongside combo text
                    if (this.colorBlindMode) {
                        const shapes = ['diamond', 'triangle', 'star', 'hexagon', 'circle'];
                        const shapeName = shapes[Math.min(i, shapes.length - 1)];
                        this.effectManager.showScorePopup(
                            this.scale.width / 2, this.scale.height / 2 + 40,
                            `[${shapeName.toUpperCase()}] x${currentCombo}`,
                            { color: '#ffffff', size: '18px', prefix: '' }
                        );
                    }
                    break;
                }
            }
        }
        if (currentCombo === 0) {
            this.lastComboAnnouncement = 0;
        }

        // --- COMBO FINISHER CHECK ---
        if (currentCombo >= 25 && !this.finisherReady && !this.finisherActive) {
            this.showFinisherButton();
        }

        // --- FINISHER ACTIVE: Upgrade bullets ---
        if (this.finisherActive && Date.now() > this.finisherEndTime) {
            this.finisherActive = false;
        }

        // --- REPLAY RECORDING ---
        if (this.replayManager) {
            this.replayManager.record(this.player, time);
        }

        // --- DYNAMIC TIPS ---
        if (this.tipsManager) {
            this.tipsManager.update(time);
        }

        // Daily challenge progress tracking
        if (this.dailyChallenge && !this.dailyChallenge.completed) {
            const justCompleted = this.dailyChallenge.trackProgress({
                wave: this.waveManager.getCurrentWave(),
                combo: currentCombo,
                kills: this.totalKills,
                coins: this.dailyChallengeCoins
            });
            if (justCompleted) {
                this.showDailyChallengeComplete();
            }
        }

        // Apply pending spin power-up
        if (this._spinPowerUpPending) {
            this._spinPowerUpPending = false;
            const types = Object.values(POWERUP_TYPES);
            this.applyPowerUp(types[Phaser.Math.Between(0, types.length - 1)]);
        }

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

                // Set up boss bullet collision once per boss
                if (boss.bullets && !boss._bulletOverlapSetup) {
                    boss._bulletOverlapSetup = true;
                    this.physics.add.overlap(
                        boss.bullets,
                        this.player,
                        (bullet, player) => {
                            if (bullet.active && player.active && !this.player.invincible && !this.player.isDying) {
                                // Ghost pet dodge check
                                if (this.pet && this.pet.shouldDodge()) {
                                    bullet.destroy();
                                    this.effectManager.showScorePopup(
                                        this.player.x, this.player.y - 30,
                                        'DODGED!', { color: '#ffffff', size: '16px', prefix: '' }
                                    );
                                    return;
                                }
                                bullet.destroy();
                                this.player.takeDamage(15);
                                this.waveDamageTaken = true;
                                if (this.player.isDying) this.onPlayerDeath();
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
                        const manualResult = this.scoreManager.addCollectible(value, this.game.getTime(), type);
                        if (manualResult && manualResult.chain) {
                            this.handleCollectibleChain(manualResult.chain);
                        }
                        if (this.achievementManager) this.achievementManager.onCollectibleCollected();
                        if (this.bonusStageActive) this.bonusStageCollected++;
                        if (type === COLLECTIBLE_TYPES.COIN || type === COLLECTIBLE_TYPES.FORTUNE_COIN) this.dailyChallengeCoins++;
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
        
        // Update power-ups
        const powerupsList = this.powerups.children.entries.slice();
        for (let i = powerupsList.length - 1; i >= 0; i--) {
            const powerup = powerupsList[i];
            if (powerup && powerup.active && !powerup.collected) {
                if (powerup.update) {
                    powerup.update(this.player);
                }
                // Color blind mode: make power-up labels larger and more prominent
                if (this.colorBlindMode && powerup.label && !powerup._cbEnhanced) {
                    powerup._cbEnhanced = true;
                    powerup.label.setFontSize('22px');
                    powerup.label.setStroke('#000000', 3);
                }
                if (powerup.y > this.scale.height + 50) {
                    powerup.destroy();
                }
            }
        }

        // Update shield timer display (remove if shield depleted)
        if (this.player.shieldHits <= 0) {
            this.removePowerUpTimer('SHIELD');
        }

        // Check for wave completion (only if not already transitioning)
        if (this.waveManager.isWaveComplete() && !this.waveTransitioning) {
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
            // Color blind mode: add square outline marker to enemy bullets
            if (this.colorBlindMode && bullet && bullet.active && !bullet._cbMarker) {
                bullet._cbMarker = true;
                const marker = this.add.rectangle(0, 0, 12, 12);
                marker.setStrokeStyle(2, 0xff4444, 0.9);
                marker.setFillStyle(0xff4444, 0);
                marker.setDepth(51);
                bullet._cbGraphic = marker;
            }
            // Update color blind marker position
            if (bullet && bullet.active && bullet._cbGraphic) {
                bullet._cbGraphic.setPosition(bullet.x, bullet.y);
            } else if (bullet && bullet._cbGraphic && !bullet.active) {
                bullet._cbGraphic.destroy();
                bullet._cbGraphic = null;
            }
        }

        // Clean up inactive/destroyed enemies from group
        this.enemies.children.entries.slice().forEach(enemy => {
            if (!enemy || !enemy.active) {
                this.enemies.remove(enemy, true, true);
            }
        });

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

        // --- LASER COLLISION ---
        if (this.player && this.player.laserActive && this.player.laserGraphic) {
            const laserX = this.player.x;
            const laserW = WEAPON_CONFIG[WEAPON_TYPES.LASER].beamWidth * 2;
            const dmg = WEAPON_CONFIG[WEAPON_TYPES.LASER].damagePerFrame;

            this.enemies.children.entries.forEach(enemy => {
                if (enemy && enemy.active) {
                    if (Math.abs(enemy.x - laserX) < laserW + enemy.displayWidth / 2 && enemy.y < this.player.y) {
                        enemy.takeDamage(dmg);
                    }
                }
            });
            this.bosses.children.entries.forEach(boss => {
                if (boss && boss.active) {
                    if (Math.abs(boss.x - laserX) < laserW + 30 && boss.y < this.player.y) {
                        boss.takeDamage(dmg);
                    }
                }
            });
        }

        // --- UPDATE HAZARDS ---
        this.updateHazards();

        // --- UPDATE DRONE ---
        this.updateDrone(time);

        // --- UPDATE EDGE WARNINGS ---
        this.updateEdgeWarnings();

        // --- MAGNET TRACTOR BEAM VISUALS ---
        this.updateMagnetBeams();

        // --- HIGH SCORE REAL-TIME CHECK ---
        this.checkHighScoreLive();

        // --- UPDATE PET ---
        this.updatePet(time);

        // --- UPDATE WEATHER ---
        this.updateWeather();

        // --- UPDATE DANGER ZONE ---
        this.updateDangerZone();

        // --- UPDATE RADAR ---
        this.updateRadar();

        // --- CAMERA EFFECTS ---
        this.updateCameraEffects();

        // --- DRONE BULLET COLLISIONS ---
        if (this.drone && this.drone.alive && this.drone.bullets) {
            const droneBullets = this.drone.bullets.children.entries.slice();
            for (let i = droneBullets.length - 1; i >= 0; i--) {
                const bullet = droneBullets[i];
                if (!bullet || !bullet.active) continue;

                // vs enemies
                this.enemies.children.entries.forEach(enemy => {
                    if (enemy && enemy.active && bullet.active) {
                        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
                        if (dist < 20) {
                            bullet.destroy();
                            enemy.takeDamage(DRONE_CONFIG.bulletDamage);
                        }
                    }
                });

                // vs bosses
                if (bullet.active) {
                    this.bosses.children.entries.forEach(boss => {
                        if (boss && boss.active && bullet.active) {
                            const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, boss.x, boss.y);
                            if (dist < 40) {
                                bullet.destroy();
                                boss.takeDamage(DRONE_CONFIG.bulletDamage);
                            }
                        }
                    });
                }
            }
        }
    }

    // --- HAZARD SYSTEM ---
    spawnHazards(type) {
        const config = HAZARD_CONFIG[type];

        if (type === HAZARD_TYPES.ASTEROID) {
            const count = Phaser.Math.Between(config.count.min, config.count.max);
            for (let i = 0; i < count; i++) {
                const x = Phaser.Math.Between(50, this.scale.width - 50);
                const y = Phaser.Math.Between(-200, -50);
                const hazard = new Hazard(this, x, y, type);
                this.hazards.push(hazard);
            }
        } else if (type === HAZARD_TYPES.NEBULA) {
            const count = Phaser.Math.Between(config.count.min, config.count.max);
            for (let i = 0; i < count; i++) {
                const x = Phaser.Math.Between(100, this.scale.width - 100);
                const y = Phaser.Math.Between(-300, -100);
                const hazard = new Hazard(this, x, y, type);
                this.hazards.push(hazard);
            }
        }
    }

    updateHazards() {
        const delta = this.game.loop.delta;

        for (let i = this.hazards.length - 1; i >= 0; i--) {
            const hazard = this.hazards[i];
            const alive = hazard.update(delta);
            if (!alive) {
                this.hazards.splice(i, 1);
                continue;
            }

            if (hazard.type === HAZARD_TYPES.ASTEROID) {
                // Asteroid vs player
                if (this.player && this.player.active && !this.player.invincible && !this.player.isDying) {
                    if (hazard.overlapsSprite(this.player)) {
                        this.player.takeDamage(HAZARD_CONFIG[HAZARD_TYPES.ASTEROID].playerDamage);
                        this.waveDamageTaken = true;
                    }
                }

                // Asteroid vs enemies
                this.enemies.children.entries.forEach(enemy => {
                    if (enemy && enemy.active && hazard.overlapsSprite(enemy)) {
                        enemy.takeDamage(HAZARD_CONFIG[HAZARD_TYPES.ASTEROID].enemyDamage);
                    }
                });

                // Asteroid blocks player bullets
                const bullets = this.player.bullets.children.entries.slice();
                for (let j = bullets.length - 1; j >= 0; j--) {
                    const bullet = bullets[j];
                    if (bullet && bullet.active && hazard.overlapsBullet(bullet)) {
                        bullet.destroy();
                    }
                }
            } else if (hazard.type === HAZARD_TYPES.NEBULA) {
                // Nebula effects on player: speed boost
                if (this.player && this.player.active && hazard.containsPoint(this.player.x, this.player.y)) {
                    // Speed boost handled via temporary multiplier
                    if (!this.player._nebulaBoost) {
                        this.player._nebulaBoost = true;
                        this.player._origSpeed = this.player.speed;
                        this.player.speed = Math.floor(this.player.speed * HAZARD_CONFIG[HAZARD_TYPES.NEBULA].playerSpeedBoost);
                    }
                } else if (this.player && this.player._nebulaBoost) {
                    this.player.speed = this.player._origSpeed;
                    this.player._nebulaBoost = false;
                }

                // Nebula effects on enemies: partial invisibility
                this.enemies.children.entries.forEach(enemy => {
                    if (enemy && enemy.active) {
                        if (hazard.containsPoint(enemy.x, enemy.y)) {
                            enemy.setAlpha(HAZARD_CONFIG[HAZARD_TYPES.NEBULA].enemyAlpha);
                        } else if (enemy.alpha < 1 && !enemy.frozen) {
                            enemy.setAlpha(1);
                        }
                    }
                });
            }
        }
    }

    // --- COMPANION DRONE ---
    updateDrone(time) {
        // Spawn drone at wave 15 or if purchased
        if (!this.drone && (this.droneUnlocked || this.waveManager.getCurrentWave() >= 15)) {
            this.drone = new Drone(this, this.player);
            this.droneUnlocked = true;
            localStorage.setItem('fortune-drone-unlocked', '1');
        }

        if (this.drone) {
            if (this.drone.alive) {
                this.drone.update(time);
            }
        }
    }

    respawnDrone() {
        if (this.drone && !this.drone.alive) {
            this.drone.respawn();
        }
    }

    // --- EDGE WARNING ARROWS ---
    updateEdgeWarnings() {
        // Clean old arrows
        this.edgeWarnings.forEach(a => { if (a) a.destroy(); });
        this.edgeWarnings = [];

        if (!this.player || !this.player.active) return;

        const margin = 20;
        const screenW = this.scale.width;
        const screenH = this.scale.height;

        // Check enemies above screen or near edges
        this.enemies.children.entries.forEach(enemy => {
            if (!enemy || !enemy.active) return;

            // Off-screen top
            if (enemy.y < -10 && enemy.y > -200) {
                const arrowX = Phaser.Math.Clamp(enemy.x, margin, screenW - margin);
                const alpha = Phaser.Math.Clamp(1 - (Math.abs(enemy.y) / 200), 0.3, 1);
                const arrow = this.add.triangle(arrowX, 12, 0, 10, 6, 0, 12, 10, 0xff4444, alpha);
                arrow.setDepth(998);
                this.edgeWarnings.push(arrow);
            }

            // Off-screen left
            if (enemy.x < -10 && enemy.x > -150) {
                const arrowY = Phaser.Math.Clamp(enemy.y, margin, screenH - margin);
                const alpha = Phaser.Math.Clamp(1 - (Math.abs(enemy.x) / 150), 0.3, 1);
                const arrow = this.add.triangle(12, arrowY, 10, 0, 0, 6, 10, 12, 0xff4444, alpha);
                arrow.setDepth(998);
                this.edgeWarnings.push(arrow);
            }

            // Off-screen right
            if (enemy.x > screenW + 10 && enemy.x < screenW + 150) {
                const arrowY = Phaser.Math.Clamp(enemy.y, margin, screenH - margin);
                const alpha = Phaser.Math.Clamp(1 - ((enemy.x - screenW) / 150), 0.3, 1);
                const arrow = this.add.triangle(screenW - 12, arrowY, 0, 0, 10, 6, 0, 12, 0xff4444, alpha);
                arrow.setDepth(998);
                this.edgeWarnings.push(arrow);
            }
        });
    }

    onEnemyKilled(enemy) {
        const time = this.game.getTime();

        // Record kill for streak system
        const streakData = this.streakManager.recordKill(enemy.type, time);

        // Calculate and add score with streak multiplier + double points event + wave modifier
        const eventMultiplier = this.randomEventManager ? this.randomEventManager.getPointsMultiplier() : 1;
        const waveMod = this.waveManager.getActiveModifier();
        const wavePointsMult = waveMod ? (waveMod.pointsMultiplier || 1) : 1;
        const finalPoints = this.scoreManager.addKillScore(enemy.points * eventMultiplier * wavePointsMult, streakData.multiplier);

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

        // Drop collectible (with wave modifier multiplier)
        const dropMod = this.waveManager.getActiveModifier();
        const dropMult = dropMod ? (dropMod.dropMultiplier || 1) : 1;
        const dropRolls = Math.max(1, Math.floor(dropMult));
        for (let d = 0; d < dropRolls; d++) {
            if (Math.random() < enemy.dropChance) {
                this.dropCollectible(enemy.x + Phaser.Math.Between(-10, 10), enemy.y + Phaser.Math.Between(-10, 10));
            }
        }

        // Mini-boss drops 3 power-ups
        if (enemy.isMiniBoss) {
            for (let i = 0; i < MINI_BOSS_CONFIG.powerUpDrops; i++) {
                this.time.delayedCall(i * 200, () => {
                    this.dropPowerUp(enemy.x + Phaser.Math.Between(-30, 30), enemy.y + Phaser.Math.Between(-20, 20));
                });
            }
        } else {
            // Drop power-up (difficulty-adjusted chance, separate from collectibles)
            const endlessMult = this.getEndlessPowerUpDropMultiplier();
            const adjustedDropChance = POWERUP_DROP_CHANCE * (this.difficulty ? this.difficulty.powerUpDropMultiplier : 1) * this.autoDifficultyDropMod * endlessMult;
            if (Math.random() < adjustedDropChance) {
                this.dropPowerUp(enemy.x, enemy.y);
            }
        }

        // Track kills for milestones
        this.totalKills++;
        this.checkKillMilestone();

        // Stats tracking
        StatsTracker.recordEnemyKill(enemy.type);
        StatsTracker.recordEncounter(enemy.type);

        // Achievement tracking
        if (this.achievementManager) {
            this.achievementManager.onEnemyKilled();
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

        // Wave survival bonus: no damage taken this wave
        if (!this.waveDamageTaken) {
            this.scoreManager.addBonusScore(1000, 'waveClear');
            this.showWaveSurvivalBonus();
            if (this.achievementManager) this.achievementManager.onWaveCompletedNoDamage();
            this.onPerfectWave();
        }

        // Reset auto-difficulty for the completed wave
        this.resetAutoDifficulty();

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

        // Fade out wave complete text
        this.tweens.add({
            targets: waveText,
            alpha: 0,
            y: waveText.y - 50,
            duration: 1500,
            onComplete: () => {
                waveText.destroy();

                // Reset wave-specific bonus tracking
                this.bonusSystem.resetWaveStats();
                this.waveDamageTaken = false;

                // Respawn drone if destroyed
                if (this.drone && !this.drone.alive) {
                    this.respawnDrone();
                }

                const nextWaveNum = currentWave + 1;

                // Achievement: wave start check
                if (this.achievementManager) {
                    this.achievementManager.onWaveStart(nextWaveNum);
                }

                // Screen wipe transition, then countdown, then spawn
                ScreenWipe.random(this, 800, () => {
                    // If boss wave, go to shop (unless endless mode), then possibly bonus stage
                    if (this.waveManager.isBossWave() && !this.endlessMode) {
                        this.waveManager.startWave(nextWaveNum);
                        this.bonusSystem.startWave(nextWaveNum);
                        this.showWaveNameDisplay(nextWaveNum);
                        this.waveTransitioning = false;

                        this.scene.pause();
                        this.scene.launch('ShopScene', {
                            score: this.scoreManager.getScore(),
                            wave: currentWave
                        });

                        if (currentWave % 10 === 0) {
                            this._pendingBonusStage = true;
                        }
                    } else {
                        // Show quick wave summary before countdown
                        this.showWaveSummary();

                        // Pick weather for new wave
                        const weather = this.pickWeather();
                        this.startWeather(weather);

                        // Show countdown then start wave
                        this.showWaveCountdown(() => {
                            this.waveManager.startWave(nextWaveNum);
                            this.bonusSystem.startWave(nextWaveNum);
                            this.showWaveNameDisplay(nextWaveNum);
                            this.waveTransitioning = false;
                        });
                    }
                });
            }
        });
    }

    onBossDefeated(scoreValue = 5000) {
        this.waveManager.onBossKilled();
        this.scoreManager.addScore(scoreValue);

        // Achievement: boss slayer + last stand
        if (this.achievementManager && this.player) {
            const healthPct = this.player.health / this.player.maxHealth;
            this.achievementManager.onBossDefeated(healthPct);

            // Daily challenge: boss on wave 5 with health check
            if (this.dailyChallenge && this.waveManager.getCurrentWave() === 5) {
                this.dailyChallenge.trackProgress({ bossDefeatedWithHpPercent: healthPct });
            }
        }

        // EPIC boss death: slow motion
        this.time.timeScale = 0.5;
        this.effectManager.screenFlash(0xffffff, 300);

        // Multiple explosions
        this.createBossExplosion();

        // Celebration fireworks!
        this.effectManager.createFireworks();

        // Screen shake
        this.cameras.main.shake(1000, 0.03);

        // Zoom out slightly to show the spectacle
        this.cameras.main.zoomTo(0.9, 300);

        // Return to normal after 2s real time (adjusted for 0.5x scale)
        this.time.delayedCall(1000, () => {
            this.time.timeScale = 1;
            // Zoom back to normal after boss dies
            this.cameras.main.zoomTo(1, 500);
            // Switch music back from boss mode
            if (this.musicManager) this.musicManager.setBossMode(false);
        });
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

    // --- POWER-UP SYSTEM ---

    dropPowerUp(x, y) {
        // Weighted random selection based on drop chances
        const rand = Math.random();
        let cumulative = 0;
        let selectedType = POWERUP_TYPES.SHIELD;

        const types = Object.values(POWERUP_TYPES);
        const totalChance = types.reduce((sum, t) => sum + POWERUP_CONFIG[t].dropChance, 0);

        for (const type of types) {
            cumulative += POWERUP_CONFIG[type].dropChance / totalChance;
            if (rand < cumulative) {
                selectedType = type;
                break;
            }
        }

        const powerup = new PowerUp(this, x, y, selectedType);
        this.powerups.add(powerup);
    }

    applyPowerUp(type) {
        const config = POWERUP_CONFIG[type];
        this.powerupsCollected++;
        StatsTracker.recordPowerUpUsed(type);

        // Camera zoom pulse on power-up collect
        this.cameraZoomPulse();

        // Show announcement
        this.effectManager.showScorePopup(
            this.player.x, this.player.y,
            type.toUpperCase().replace('_', ' '),
            { color: '#ffffff', size: EFFECT_CONFIG.POPUP_LARGE, prefix: '' }
        );

        switch (type) {
            case POWERUP_TYPES.SHIELD:
                this.player.activateShield(config.hitsAbsorbed);
                this.addPowerUpTimer('SHIELD', 0, 0x0088ff);
                break;

            case POWERUP_TYPES.RAPID_FIRE:
                this.player.activateRapidFire(config.duration);
                this.addPowerUpTimer('RAPID', config.duration, 0xff3333);
                this.time.delayedCall(config.duration, () => {
                    this.player.deactivateRapidFire();
                    this.removePowerUpTimer('RAPID');
                });
                break;

            case POWERUP_TYPES.SCREEN_NUKE:
                this.executeScreenNuke();
                break;

            case POWERUP_TYPES.MAGNET:
                this.player.activateMagnet(config.magnetRange);
                this.addPowerUpTimer('MAGNET', config.duration, 0xffdd00);
                this.time.delayedCall(config.duration, () => {
                    this.player.deactivateMagnet();
                    this.removePowerUpTimer('MAGNET');
                });
                break;
        }
    }

    executeScreenNuke() {
        if (this.achievementManager) this.achievementManager.onNukeUsed();

        // EPIC slow motion nuke
        this.effectManager.screenFlash(0xffffff, 400);
        this.effectManager.screenShake({ duration: 800, intensity: 0.025 });

        // Slow time to 0.3x
        this.time.timeScale = 0.3;

        // Camera zoom in slightly
        this.cameras.main.zoomTo(1.05, 300);

        // Kill enemies in staggered sequence
        const enemiesToKill = this.enemies.children.entries.slice();
        enemiesToKill.forEach((enemy, index) => {
            if (enemy && enemy.active) {
                this.time.delayedCall(index * 50, () => {
                    if (enemy && enemy.active) {
                        enemy.die();
                    }
                });
            }
        });

        // Return time to normal after 1.5 real seconds (adjusted for timeScale)
        this.time.delayedCall(500, () => {
            // 500 * 0.3 ≈ 1.5s real
            this.time.timeScale = 1;
            this.cameras.main.zoomTo(1, 300);
        });
    }

    addPowerUpTimer(label, duration, color) {
        // Remove existing timer with same label
        this.removePowerUpTimer(label);

        const timer = {
            label,
            color,
            startTime: this.time.now,
            duration,
            permanent: duration === 0
        };
        this.activePowerUpTimers.push(timer);
    }

    removePowerUpTimer(label) {
        this.activePowerUpTimers = this.activePowerUpTimers.filter(t => t.label !== label);
    }

    // --- BOSS WARNING SYSTEM ---

    showBossWarning(callback) {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        // Red tint overlay
        const overlay = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0xff0000, 0.1);
        overlay.setDepth(900);

        // Warning text
        const warningText = this.add.text(centerX, centerY, 'WARNING', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 6,
            fontStyle: 'bold'
        });
        warningText.setOrigin(0.5);
        warningText.setDepth(1000);
        warningText.setAlpha(0);

        // Boss entrance: zoom out to show more battlefield
        this.cameras.main.zoomTo(0.95, 1500);

        // Flash 3 times
        let flashCount = 0;
        const flashWarning = () => {
            if (flashCount >= 3) {
                warningText.destroy();
                overlay.destroy();
                if (callback) callback();
                return;
            }

            this.tweens.add({
                targets: warningText,
                alpha: { from: 0, to: 1 },
                scale: { from: 1.5, to: 1 },
                duration: 300,
                yoyo: true,
                hold: 200,
                onComplete: () => {
                    flashCount++;
                    flashWarning();
                }
            });

            // Camera shake each flash
            this.cameras.main.shake(200, 0.008);
        };

        // Pulse the overlay
        this.tweens.add({
            targets: overlay,
            alpha: { from: 0.05, to: 0.15 },
            duration: 400,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                overlay.destroy();
            }
        });

        flashWarning();
    }

    // --- KILL MILESTONE CELEBRATIONS ---

    checkKillMilestone() {
        for (const milestone of KILL_MILESTONES) {
            if (this.totalKills >= milestone.kills && !this.reachedMilestones.has(milestone.kills)) {
                this.reachedMilestones.add(milestone.kills);
                this.showKillMilestone(milestone);
            }
        }
    }

    showKillMilestone(milestone) {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2 - 80;

        const text = this.add.text(centerX, centerY, milestone.text, {
            fontSize: '36px',
            fontFamily: 'monospace',
            color: milestone.color,
            stroke: '#000000',
            strokeThickness: 5,
            fontStyle: 'bold'
        });
        text.setOrigin(0.5);
        text.setDepth(EFFECT_CONFIG.DEPTH_STREAK_ANNOUNCEMENT);
        text.setAlpha(0);

        this.tweens.add({
            targets: text,
            alpha: 1,
            scale: { from: 2, to: 1 },
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    this.tweens.add({
                        targets: text,
                        alpha: 0,
                        y: centerY - 40,
                        duration: 500,
                        onComplete: () => text.destroy()
                    });
                });
            }
        });

        this.effectManager.screenShake(EFFECT_CONFIG.SHAKE_MEDIUM);

        // Confetti effect for special milestones
        if (milestone.confetti) {
            this.spawnConfetti();
        }
    }

    spawnConfetti() {
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffd700];

        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(50, this.scale.width - 50);
            const y = Phaser.Math.Between(-20, 50);
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Phaser.Math.Between(3, 6);

            const particle = this.add.circle(x, y, size, color);
            particle.setDepth(EFFECT_CONFIG.DEPTH_STREAK_ANNOUNCEMENT);

            this.tweens.add({
                targets: particle,
                y: y + Phaser.Math.Between(200, 500),
                x: x + Phaser.Math.Between(-80, 80),
                alpha: 0,
                duration: Phaser.Math.Between(1500, 2500),
                ease: 'Quad.easeIn',
                onComplete: () => particle.destroy()
            });
        }
    }

    // --- WAVE SURVIVAL BONUS ---
    showWaveSurvivalBonus() {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2 + 30;

        const text = this.add.text(centerX, centerY, '✨ PERFECT WAVE! +1000 BONUS', {
            fontSize: '28px',
            fontFamily: 'monospace',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold'
        });
        text.setOrigin(0.5);
        text.setDepth(EFFECT_CONFIG.DEPTH_STREAK_ANNOUNCEMENT + 20);
        text.setAlpha(0);

        this.tweens.add({
            targets: text,
            alpha: 1,
            scale: { from: 1.5, to: 1 },
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    this.tweens.add({
                        targets: text,
                        alpha: 0,
                        y: centerY - 40,
                        duration: 500,
                        onComplete: () => text.destroy()
                    });
                });
            }
        });

        // Confetti celebration
        this.effectManager.confetti(centerX, centerY - 50, 40);
    }

    // --- BONUS STAGE ---
    startBonusStage() {
        this.bonusStageActive = true;
        this.bonusStageCollected = 0;
        this.bonusStageTimer = 15000; // 15 seconds
        this.waveTransitioning = true; // prevent normal wave progression

        // Clear any remaining enemies and bullets
        this.enemies.clear(true, true);
        this.enemyBullets.clear(true, true);

        // Show BONUS STAGE announcement
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        const label = this.add.text(centerX, centerY, 'BONUS STAGE!', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 6,
            fontStyle: 'bold'
        });
        label.setOrigin(0.5);
        label.setDepth(EFFECT_CONFIG.DEPTH_STREAK_ANNOUNCEMENT + 30);
        label.setAlpha(0);

        // Sparkle confetti around the text
        this.effectManager.confetti(centerX, centerY, 50, [0xffd700, 0xffaa00, 0xffff00, 0xffffff]);
        this.effectManager.screenShake(EFFECT_CONFIG.SHAKE_MEDIUM);

        this.tweens.add({
            targets: label,
            alpha: 1,
            scale: { from: 2.5, to: 1 },
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    this.tweens.add({
                        targets: label,
                        alpha: 0,
                        duration: 400,
                        onComplete: () => label.destroy()
                    });
                });
            }
        });

        // Timer display at top
        this.bonusStageTimerText = this.add.text(centerX, 20, '15', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.bonusStageTimerText.setOrigin(0.5, 0);
        this.bonusStageTimerText.setDepth(1002);

        // Collected counter
        this.bonusStageLabel = this.add.text(centerX, 55, 'Collected: 0', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.bonusStageLabel.setOrigin(0.5, 0);
        this.bonusStageLabel.setDepth(1002);

        // Start spawning collectibles in patterns
        this.bonusStageSpawnTimer = this.time.addEvent({
            delay: 300,
            callback: () => this.spawnBonusCollectible(),
            loop: true
        });

        this.bonusStagePatternIndex = 0;
    }

    spawnBonusCollectible() {
        if (!this.bonusStageActive) return;

        const width = this.scale.width;
        const pattern = this.bonusStagePatternIndex % 4;
        this.bonusStagePatternIndex++;

        const types = [COLLECTIBLE_TYPES.COIN, COLLECTIBLE_TYPES.COIN, COLLECTIBLE_TYPES.COIN,
                       COLLECTIBLE_TYPES.CRYSTAL, COLLECTIBLE_TYPES.STAR];

        switch (pattern) {
            case 0: {
                // Wave pattern: 5 coins in a sine wave
                for (let i = 0; i < 5; i++) {
                    const x = 100 + i * ((width - 200) / 4);
                    const type = types[Math.floor(Math.random() * types.length)];
                    const c = new Collectible(this, x, -20 - i * 15, type);
                    this.collectibles.add(c);
                }
                break;
            }
            case 1: {
                // V-shape
                for (let i = 0; i < 5; i++) {
                    const x = width / 2 + (i - 2) * 60;
                    const yOff = Math.abs(i - 2) * 25;
                    const type = i === 2 ? COLLECTIBLE_TYPES.STAR : COLLECTIBLE_TYPES.COIN;
                    const c = new Collectible(this, x, -20 - yOff, type);
                    this.collectibles.add(c);
                }
                break;
            }
            case 2: {
                // Circle arc
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * i) / 5;
                    const x = width / 2 + Math.cos(angle) * 150;
                    const type = i % 3 === 0 ? COLLECTIBLE_TYPES.CRYSTAL : COLLECTIBLE_TYPES.COIN;
                    const c = new Collectible(this, x, -20, type);
                    this.collectibles.add(c);
                }
                break;
            }
            case 3: {
                // Random cluster with a star in the middle
                const cx = Phaser.Math.Between(100, width - 100);
                for (let i = 0; i < 4; i++) {
                    const ox = Phaser.Math.Between(-50, 50);
                    const c = new Collectible(this, cx + ox, -20 - i * 10, COLLECTIBLE_TYPES.COIN);
                    this.collectibles.add(c);
                }
                const star = new Collectible(this, cx, -30, COLLECTIBLE_TYPES.STAR);
                this.collectibles.add(star);
                break;
            }
        }
    }

    updateBonusStage(delta) {
        if (!this.bonusStageActive) return;

        this.bonusStageTimer -= delta;
        const seconds = Math.max(0, Math.ceil(this.bonusStageTimer / 1000));

        if (this.bonusStageTimerText) {
            this.bonusStageTimerText.setText(seconds.toString());
            if (seconds <= 5) this.bonusStageTimerText.setColor('#ff4444');
        }
        if (this.bonusStageLabel) {
            this.bonusStageLabel.setText(`Collected: ${this.bonusStageCollected}`);
        }

        if (this.bonusStageTimer <= 0) {
            this.endBonusStage();
        }
    }

    endBonusStage() {
        this.bonusStageActive = false;

        // Stop spawning
        if (this.bonusStageSpawnTimer) {
            this.bonusStageSpawnTimer.destroy();
            this.bonusStageSpawnTimer = null;
        }

        // Clean up timer UI
        if (this.bonusStageTimerText) { this.bonusStageTimerText.destroy(); this.bonusStageTimerText = null; }
        if (this.bonusStageLabel) { this.bonusStageLabel.destroy(); this.bonusStageLabel = null; }

        // Show results
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        const resultText = this.add.text(centerX, centerY - 20, `BONUS COMPLETE!`, {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold'
        });
        resultText.setOrigin(0.5);
        resultText.setDepth(EFFECT_CONFIG.DEPTH_STREAK_ANNOUNCEMENT + 30);

        const countText = this.add.text(centerX, centerY + 25, `${this.bonusStageCollected} items collected!`, {
            fontSize: '22px',
            fontFamily: 'monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        countText.setOrigin(0.5);
        countText.setDepth(EFFECT_CONFIG.DEPTH_STREAK_ANNOUNCEMENT + 30);

        this.effectManager.confetti(centerX, centerY - 60, 50);

        // Fade out and resume normal gameplay
        this.time.delayedCall(2500, () => {
            this.tweens.add({
                targets: [resultText, countText],
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    resultText.destroy();
                    countText.destroy();
                    this.waveTransitioning = false;
                }
            });
        });
    }

    showDailyChallengeComplete() {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2 - 40;

        // Award bonus points
        this.scoreManager.addBonusScore(this.dailyChallenge.getBonusPoints(), 'daily');

        const text = this.add.text(centerX, centerY, 'DAILY CHALLENGE COMPLETE!\n+2000 BONUS', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold',
            align: 'center'
        });
        text.setOrigin(0.5);
        text.setDepth(EFFECT_CONFIG.DEPTH_STREAK_ANNOUNCEMENT + 30);
        text.setAlpha(0);

        this.tweens.add({
            targets: text,
            alpha: 1,
            scale: { from: 2, to: 1 },
            duration: 400,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(2500, () => {
                    this.tweens.add({
                        targets: text,
                        alpha: 0, y: centerY - 50, duration: 500,
                        onComplete: () => text.destroy()
                    });
                });
            }
        });

        this.effectManager.confetti(centerX, centerY - 30, 40, [0xffd700, 0xffaa00, 0xffff00]);
    }

    triggerGameOver() {
        if (this.gameOver) return;

        this.gameOver = true;

        // Stop music
        if (this.musicManager) {
            this.musicManager.destroy();
            this.musicManager = null;
        }

        // Auto-screenshot with stats visible
        this.autoScreenshotGameOver();

        // Fade out before showing game over
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.pause();
            this._launchGameOver();
        });

        // Clean up touch controls
        if (this.touchControls) {
            this.touchControls.destroy();
            this.touchControls = null;
        }

        // Clean up magnet graphics
        if (this.magnetGraphics) {
            this.magnetGraphics.destroy();
            this.magnetGraphics = null;
        }

        // Clean up hazards
        this.hazards.forEach(h => { if (h) h.destroy(); });
        this.hazards = [];

        // Clean up drone
        if (this.drone) {
            this.drone.destroy();
            this.drone = null;
        }

        // Clean up pet
        if (this.pet) {
            this.pet.destroy();
            this.pet = null;
        }

        // Clean up weather
        this.clearWeather();
        if (this.weatherGraphics) {
            this.weatherGraphics.destroy();
            this.weatherGraphics = null;
        }

        // Clean up danger zone
        if (this.dangerZoneGraphics) {
            this.dangerZoneGraphics.destroy();
            this.dangerZoneGraphics = null;
        }
        if (this.dangerZoneText) {
            this.dangerZoneText.destroy();
            this.dangerZoneText = null;
        }

        // Clean up edge warnings
        this.edgeWarnings.forEach(a => { if (a) a.destroy(); });
        this.edgeWarnings = [];

        // Clean up radar
        this.radarDots.forEach(d => { if (d) d.destroy(); });
        this.radarDots = [];

        // Save replay data
        if (this.replayManager) {
            this.replayManager.save();
        }

        // Cleanup tips
        if (this.tipsManager) {
            this.tipsManager.destroy();
        }

        // Cleanup finisher
        this.clearFinisherButton();

        // Save endless best wave
        if (this.endlessMode) {
            const currentBest = parseInt(localStorage.getItem('fortune-endless-best-wave') || '0', 10);
            const waveReached = this.waveManager.getCurrentWave();
            if (waveReached > currentBest) {
                localStorage.setItem('fortune-endless-best-wave', waveReached.toString());
            }
        }

        // Award XP
        const finalScore = this.scoreManager.getScore();
        if (this.xpManager) {
            const xpResult = this.xpManager.addXP(finalScore);
            // Pass XP data to game over scene
            this._xpResult = xpResult;
        }

        // Persistent stats tracking
        StatsTracker.recordGamePlayed();
        StatsTracker.recordScoreEarned(finalScore);
        StatsTracker.updateHighestSingleScore(finalScore);
        StatsTracker.updateHighestWave(this.waveManager.getCurrentWave());
        StatsTracker.updateHighestCombo(this.scoreManager.getMaxCombo());
        StatsTracker.recordTimePlayed(Math.floor((Date.now() - this.gameStartTime) / 1000));
        StatsTracker.recordWeaponUsed(this.player.currentWeapon);
        const selectedPet = localStorage.getItem('fortune-selected-pet');
        if (selectedPet) StatsTracker.recordPetUsed(selectedPet);

        // Gather all stats (store for deferred launch)
        this._gameOverData = {
            score: finalScore,
            wave: this.waveManager.getCurrentWave(),
            maxCombo: this.scoreManager.getMaxCombo(),
            enemiesKilled: this.totalKills,
            accuracy: this.bonusSystem.getAccuracyPercent(),
            powerupsCollected: this.powerupsCollected,
            timePlayed: Date.now() - this.gameStartTime,
            achievementsUnlocked: this.achievementManager ? this.achievementManager.getSessionUnlocked() : [],
            xpResult: this._xpResult || null,
            endlessMode: this.endlessMode
        };

        // If fade hasn't been set up (fallback), launch immediately
        if (!this.cameras.main) {
            this._launchGameOver();
        }
    }

    updateCameraEffects() {
        if (!this.player || !this.player.active) return;

        // Subtle camera lag following player movement
        const cam = this.cameras.main;
        const targetX = (this.player.x - this.scale.width / 2) * 0.03;
        const targetY = (this.player.y - this.scale.height / 2) * 0.03;
        cam.scrollX += (targetX - cam.scrollX) * 0.1;
        cam.scrollY += (targetY - cam.scrollY) * 0.1;

        // Low health vignette
        if (this.lowHealthOverlay) {
            const healthPct = this.player.health / this.player.maxHealth;
            if (healthPct <= 0.25) {
                const pulse = 0.08 + 0.04 * Math.sin(this.time.now * 0.005);
                this.lowHealthOverlay.setAlpha(pulse);
            } else {
                this.lowHealthOverlay.setAlpha(0);
            }
        }
    }

    cameraZoomPulse() {
        const cam = this.cameras.main;
        cam.zoomTo(1.02, 100);
        this.time.delayedCall(100, () => {
            cam.zoomTo(1, 100);
        });
    }

    showDamageNumber(x, y, damage, isCrit) {
        const text = this.add.text(x + Phaser.Math.Between(-10, 10), y - 10, isCrit ? `-${damage}!` : `-${damage}`, {
            fontSize: isCrit ? '16px' : '13px',
            fontFamily: 'monospace',
            color: isCrit ? '#ffff00' : '#ffffff',
            fontStyle: isCrit ? 'bold' : 'normal',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setDepth(160);

        this.tweens.add({
            targets: text,
            y: y - 40,
            alpha: 0,
            duration: 500,
            ease: 'Power1',
            onComplete: () => text.destroy()
        });

        // Spark effect for crits
        if (isCrit) {
            for (let i = 0; i < 4; i++) {
                const spark = this.add.circle(x, y, 2, 0xffff00);
                spark.setDepth(160);
                this.tweens.add({
                    targets: spark,
                    x: x + Phaser.Math.Between(-25, 25),
                    y: y + Phaser.Math.Between(-25, 25),
                    alpha: 0,
                    duration: 250,
                    onComplete: () => spark.destroy()
                });
            }
        }
    }

    // --- MAGNET TRACTOR BEAM VISUALS ---
    updateMagnetBeams() {
        if (!this.magnetGraphics) return;
        this.magnetGraphics.clear();

        if (!this.player || !this.player.magnetActive || !this.player.active) return;

        const px = this.player.x;
        const py = this.player.y;
        const magnetRange = this.player.getMagnetRange();

        this.collectibles.children.entries.forEach(c => {
            if (!c || !c.active || c.collected) return;
            const dist = Phaser.Math.Distance.Between(c.x, c.y, px, py);
            if (dist < magnetRange) {
                // Brighter as collectible gets closer
                const alpha = 0.05 + 0.15 * (1 - dist / magnetRange);
                this.magnetGraphics.lineStyle(1, 0xffffff, alpha);
                this.magnetGraphics.beginPath();
                this.magnetGraphics.moveTo(c.x, c.y);
                this.magnetGraphics.lineTo(px, py);
                this.magnetGraphics.closePath();
                this.magnetGraphics.strokePath();
            }
        });
    }

    // --- HIGH SCORE REAL-TIME CHECK ---
    getPersonalBest() {
        const scores = JSON.parse(localStorage.getItem('fortune_leaderboard') || '[]');
        return scores.length > 0 ? Math.max(...scores) : 0;
    }

    checkHighScoreLive() {
        if (this.highScoreBeaten) return;
        const currentScore = this.scoreManager.getScore();
        if (this.personalBest > 0 && currentScore > this.personalBest) {
            this.highScoreBeaten = true;
            this.showNewHighScore();
        }
    }

    showNewHighScore() {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2 - 50;

        const text = this.add.text(centerX, centerY, 'NEW HIGH SCORE!', {
            fontSize: '36px',
            fontFamily: 'monospace',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 5,
            fontStyle: 'bold'
        });
        text.setOrigin(0.5);
        text.setDepth(1010);
        text.setAlpha(0);

        // Flash animation
        this.tweens.add({
            targets: text,
            alpha: 1,
            scale: { from: 2.5, to: 1 },
            duration: 400,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Flashing effect
                this.tweens.add({
                    targets: text,
                    alpha: { from: 1, to: 0.3 },
                    duration: 300,
                    yoyo: true,
                    repeat: 4,
                    onComplete: () => {
                        this.tweens.add({
                            targets: text,
                            alpha: 0,
                            y: centerY - 40,
                            duration: 500,
                            onComplete: () => text.destroy()
                        });
                    }
                });
            }
        });

        // Confetti burst
        this.spawnConfetti();
        this.effectManager.screenShake({ duration: 400, intensity: 0.015 });
    }

    // --- WAVE COUNTDOWN ---
    showWaveCountdown(callback) {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        const numbers = ['3', '2', '1', 'GO!'];

        numbers.forEach((num, index) => {
            this.time.delayedCall(index * 800, () => {
                const isGo = num === 'GO!';
                const color = isGo ? '#00ff00' : '#ffffff';
                const fontSize = isGo ? '56px' : '64px';

                const text = this.add.text(centerX, centerY, num, {
                    fontSize: fontSize,
                    fontFamily: 'monospace',
                    color: color,
                    stroke: '#000000',
                    strokeThickness: 6,
                    fontStyle: 'bold'
                });
                text.setOrigin(0.5);
                text.setDepth(1010);

                // Scale down and fade
                this.tweens.add({
                    targets: text,
                    scale: { from: 1.5, to: 0.5 },
                    alpha: { from: 1, to: 0 },
                    duration: 700,
                    ease: 'Power2',
                    onComplete: () => text.destroy()
                });

                // Green burst effect on GO!
                if (isGo) {
                    const burst = this.add.circle(centerX, centerY, 20, 0x00ff00, 0.5);
                    burst.setDepth(1009);
                    this.tweens.add({
                        targets: burst,
                        scale: 8,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => burst.destroy()
                    });
                }
            });
        });

        // Callback after countdown completes
        this.time.delayedCall(numbers.length * 800, () => {
            if (callback) callback();
        });
    }

    // --- FORMATION PREVIEW ---
    showFormationPreview(formationType, enemyCount, startX, startY, callback) {
        const previewDots = [];

        // Calculate positions based on formation type (simplified preview)
        const positions = this.calculateFormationPositions(formationType, enemyCount, startX, startY);

        positions.forEach((pos, i) => {
            const dot = this.add.circle(pos.x, pos.y, 8, 0xffffff, 0);
            dot.setStrokeStyle(1, 0x00ffff, 0);
            dot.setDepth(50);
            previewDots.push(dot);

            // Fade in with stagger
            this.tweens.add({
                targets: dot,
                fillAlpha: 0.15,
                strokeAlpha: 0.3,
                duration: 300,
                delay: i * 30
            });
        });

        // Fade out after 1 second, then callback
        this.time.delayedCall(800, () => {
            previewDots.forEach((dot, i) => {
                this.tweens.add({
                    targets: dot,
                    fillAlpha: 0,
                    strokeAlpha: 0,
                    duration: 300,
                    delay: i * 15,
                    onComplete: () => dot.destroy()
                });
            });

            this.time.delayedCall(400, () => {
                if (callback) callback();
            });
        });
    }

    calculateFormationPositions(type, count, startX, startY) {
        const positions = [];
        const spacing = 40;

        switch (type) {
            case 'v': {
                const rows = Math.ceil(Math.sqrt(count));
                let idx = 0;
                for (let row = 0; row < rows && idx < count; row++) {
                    const inRow = Math.min(count - idx, row + 1);
                    const offset = -(inRow - 1) * spacing / 2;
                    for (let col = 0; col < inRow; col++) {
                        positions.push({ x: startX + offset + col * spacing, y: startY + row * 30 });
                        idx++;
                    }
                }
                break;
            }
            case 'grid': {
                const cols = Math.ceil(Math.sqrt(count));
                for (let i = 0; i < count; i++) {
                    const col = i % cols;
                    const row = Math.floor(i / cols);
                    positions.push({
                        x: startX + (col - cols / 2) * spacing,
                        y: startY + row * 35
                    });
                }
                break;
            }
            case 'circle': {
                for (let i = 0; i < count; i++) {
                    const angle = (Math.PI * 2 * i) / count;
                    positions.push({
                        x: startX + Math.cos(angle) * 60,
                        y: startY + Math.sin(angle) * 60
                    });
                }
                break;
            }
            default: {
                // Wave/spiral: just show a horizontal line
                for (let i = 0; i < count; i++) {
                    positions.push({
                        x: startX + (i - count / 2) * spacing,
                        y: startY
                    });
                }
                break;
            }
        }
        return positions;
    }

    // --- ACHIEVEMENT REWARDS ---
    applyAchievementRewards() {
        const rewards = JSON.parse(localStorage.getItem('fortune-achievement-rewards') || '{}');

        // wave_10: +500 starting bonus points
        if (rewards.wave_10) {
            this.scoreManager.addBonusScore(500, 'waveClear');
            this.effectManager.showScorePopup(
                this.scale.width / 2, this.scale.height / 2 + 50,
                '+500 BONUS', { color: '#ffd700', size: '18px', prefix: '' }
            );
        }

        // combo_20: +1 second combo window
        if (rewards.combo_20) {
            this.scoreManager.comboTimeout += 1000;
        }

        // first_blood pet unlock handled by pet selection in menu
        // boss_slayer damage bonus applied in collision handlers via this.achievementDamageBonus
        this.achievementDamageBonus = rewards.boss_slayer ? 0.05 : 0;
    }

    // --- PET UPDATE ---
    updatePet(time) {
        if (this.pet) {
            this.pet.update(time);
        }
    }

    // --- WEATHER SYSTEM ---
    pickWeather() {
        const rand = Math.random();
        let cumulative = 0;
        for (const [type, config] of Object.entries(WEATHER_CONFIG)) {
            cumulative += config.chance;
            if (rand < cumulative) {
                return type;
            }
        }
        return WEATHER_TYPES.NORMAL;
    }

    startWeather(weather) {
        // Clean old weather
        this.clearWeather();
        this.currentWeather = weather;

        if (weather === WEATHER_TYPES.NORMAL) return;

        const config = WEATHER_CONFIG[weather];

        // Show weather name
        const weatherText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 80, config.name + ' approaching...', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#' + config.color.toString(16).padStart(6, '0'),
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'italic'
        });
        weatherText.setOrigin(0.5);
        weatherText.setDepth(1005);
        weatherText.setAlpha(0);

        this.tweens.add({
            targets: weatherText,
            alpha: 1,
            duration: 500,
            onComplete: () => {
                this.time.delayedCall(2000, () => {
                    this.tweens.add({
                        targets: weatherText,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => weatherText.destroy()
                    });
                });
            }
        });

        // Create overlay for nebula storm
        if (weather === WEATHER_TYPES.NEBULA_STORM) {
            this.weatherOverlay = this.add.rectangle(
                this.scale.width / 2, this.scale.height / 2,
                this.scale.width, this.scale.height,
                0x440066, 0.08
            );
            this.weatherOverlay.setDepth(2);
        }
    }

    clearWeather() {
        this.weatherParticles.forEach(p => { if (p) p.destroy(); });
        this.weatherParticles = [];
        if (this.weatherOverlay) {
            this.weatherOverlay.destroy();
            this.weatherOverlay = null;
        }
        if (this.weatherGraphics) this.weatherGraphics.clear();
    }

    updateWeather() {
        if (this.currentWeather === WEATHER_TYPES.NORMAL) return;

        const delta = this.game.loop.delta / 1000;
        const config = WEATHER_CONFIG[this.currentWeather];

        if (this.currentWeather === WEATHER_TYPES.SPACE_RAIN) {
            // Spawn rain-like particles (thin blue lines)
            if (this.weatherParticles.length < (config.particleCount || 25)) {
                const x = Phaser.Math.Between(0, this.scale.width);
                const line = this.add.rectangle(x, -10, 1, Phaser.Math.Between(8, 20), config.color, 0.4);
                line.setDepth(2);
                line.setRotation(-0.3);
                line._speed = Phaser.Math.Between(300, 500);
                this.weatherParticles.push(line);
            }
            // Move particles
            for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
                const p = this.weatherParticles[i];
                p.y += p._speed * delta;
                p.x -= 40 * delta;
                if (p.y > this.scale.height + 20) {
                    p.y = -10;
                    p.x = Phaser.Math.Between(0, this.scale.width);
                }
            }
        } else if (this.currentWeather === WEATHER_TYPES.SOLAR_FLARE) {
            // Occasional bright flash
            if (Math.random() < 0.003) {
                const flash = this.add.rectangle(
                    this.scale.width / 2, this.scale.height / 2,
                    this.scale.width, this.scale.height, 0xffaa00, 0.06
                );
                flash.setDepth(2);
                this.tweens.add({
                    targets: flash,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => flash.destroy()
                });
            }
        } else if (this.currentWeather === WEATHER_TYPES.NEBULA_STORM) {
            // Swirling purple particles
            if (this.weatherParticles.length < (config.particleCount || 20)) {
                const x = Phaser.Math.Between(0, this.scale.width);
                const y = Phaser.Math.Between(0, this.scale.height);
                const particle = this.add.circle(x, y, Phaser.Math.Between(3, 8), config.color, 0.15);
                particle.setDepth(2);
                particle._angle = Math.random() * Math.PI * 2;
                particle._speed = Phaser.Math.Between(20, 50);
                particle._radius = Phaser.Math.Between(30, 80);
                particle._cx = x;
                particle._cy = y;
                this.weatherParticles.push(particle);
            }
            for (const p of this.weatherParticles) {
                p._angle += 0.02;
                p.x = p._cx + Math.cos(p._angle) * p._radius * 0.3;
                p.y += 15 * delta;
                if (p.y > this.scale.height + 20) {
                    p.y = -10;
                    p._cx = Phaser.Math.Between(0, this.scale.width);
                }
            }

            // Pulse overlay
            if (this.weatherOverlay) {
                const pulse = 0.05 + 0.03 * Math.sin(this.time.now * 0.002);
                this.weatherOverlay.setAlpha(pulse);
            }
        }
    }

    // --- DANGER ZONE INDICATOR ---
    updateDangerZone() {
        this.dangerFrameCounter++;
        if (this.dangerFrameCounter % 30 !== 0) return;

        if (!this.dangerZoneGraphics) return;
        this.dangerZoneGraphics.clear();

        if (!this.player || !this.player.active) return;

        const dangerThreshold = this.scale.height * 0.85;
        if (this.player.y < dangerThreshold) {
            if (this.dangerZoneText) {
                this.dangerZoneText.setAlpha(0);
            }
            return;
        }

        // Check for approaching enemy bullets
        let bulletApproaching = false;
        this.enemyBullets.children.entries.forEach(bullet => {
            if (!bullet || !bullet.active) return;
            if (bullet.y > this.player.y - 150 && bullet.y < this.player.y &&
                Math.abs(bullet.x - this.player.x) < 120) {
                bulletApproaching = true;
            }
        });

        // Also check boss bullets
        if (!bulletApproaching) {
            this.bosses.children.entries.forEach(boss => {
                if (boss && boss.bullets) {
                    boss.bullets.children.entries.forEach(bullet => {
                        if (!bullet || !bullet.active) return;
                        if (bullet.y > this.player.y - 150 && bullet.y < this.player.y &&
                            Math.abs(bullet.x - this.player.x) < 120) {
                            bulletApproaching = true;
                        }
                    });
                }
            });
        }

        if (bulletApproaching) {
            // Pulse red at bottom edge
            const pulse = 0.15 + 0.1 * Math.sin(this.time.now * 0.01);
            this.dangerZoneGraphics.fillStyle(0xff0000, pulse);
            this.dangerZoneGraphics.fillRect(0, this.scale.height - 8, this.scale.width, 8);

            // Show DANGER text near player
            if (!this.dangerZoneText) {
                this.dangerZoneText = this.add.text(0, 0, 'DANGER!', {
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    color: '#ff4444',
                    stroke: '#000000',
                    strokeThickness: 2,
                    fontStyle: 'bold'
                });
                this.dangerZoneText.setOrigin(0.5);
                this.dangerZoneText.setDepth(998);
            }
            this.dangerZoneText.setPosition(this.player.x, this.player.y - 35);
            this.dangerZoneText.setAlpha(0.6 + 0.4 * Math.sin(this.time.now * 0.01));
        } else {
            if (this.dangerZoneText) {
                this.dangerZoneText.setAlpha(0);
            }
        }
    }

    // --- AUTO-DIFFICULTY ADJUSTMENT (hidden) ---
    onPlayerDeath() {
        this.deathsThisWave++;
        StatsTracker.recordDeath();
        if (this.tipsManager) this.tipsManager.onPlayerDeath();
        if (this.deathsThisWave >= 3 && !this.autoDifficultyActive) {
            this.autoDifficultyActive = true;
            this.autoDifficultyEnemySpeedMod = 0.85; // 15% slower bullets
            this.autoDifficultyDropMod = 1.2; // 20% more drops

            // Encouraging message
            this.effectManager.showScorePopup(
                this.scale.width / 2, this.scale.height / 2,
                'You got this! Keep going!',
                { color: '#00ff88', size: '22px', prefix: '' }
            );
        }
    }

    resetAutoDifficulty() {
        this.deathsThisWave = 0;
        if (this.autoDifficultyActive) {
            this.autoDifficultyActive = false;
            this.autoDifficultyEnemySpeedMod = 1;
            this.autoDifficultyDropMod = 1;
        }
    }

    onPerfectWave() {
        this.perfectWaveStreak++;
        StatsTracker.recordPerfectWave();
        if (this.perfectWaveStreak >= 1) {
            this.nextWaveSpeedBoost = 1.1; // 10% faster enemies next wave
        }
    }

    // --- COLLECTIBLE CHAIN HANDLING ---
    handleCollectibleChain(chainResult) {
        if (!chainResult) return;

        const typeNames = {
            coin: 'COIN',
            crystal: 'CRYSTAL',
            star: 'STAR',
            fortune_coin: 'FORTUNE'
        };
        const typeName = typeNames[chainResult.type] || chainResult.type.toUpperCase();

        if (chainResult.count === 2 && !chainResult.bonus) {
            // Show chain progress
            this.effectManager.showScorePopup(
                this.player.x, this.player.y - 50,
                `${typeName} x2...`,
                { color: '#ffaa00', size: '16px', prefix: '' }
            );
        } else if (chainResult.count === 3 && chainResult.bonus) {
            // Show chain completion
            this.effectManager.showScorePopup(
                this.player.x, this.player.y - 50,
                `${typeName} x3 -> BONUS!`,
                { color: '#ff00ff', size: '22px', prefix: '' }
            );

            // Spawn bonus collectible
            this.spawnChainBonus(chainResult.type);
        }
    }

    spawnChainBonus(type) {
        let bonusType;
        switch (type) {
            case COLLECTIBLE_TYPES.COIN:
                bonusType = COLLECTIBLE_TYPES.CRYSTAL;
                break;
            case COLLECTIBLE_TYPES.CRYSTAL:
                bonusType = COLLECTIBLE_TYPES.STAR;
                break;
            case COLLECTIBLE_TYPES.STAR:
                bonusType = COLLECTIBLE_TYPES.FORTUNE_COIN;
                break;
            case COLLECTIBLE_TYPES.FORTUNE_COIN:
                // Extra life + gold flash
                if (this.player) {
                    this.player.lives++;
                    this.effectManager.screenFlash(0xffd700, 300);
                    this.effectManager.showScorePopup(
                        this.player.x, this.player.y - 60,
                        'EXTRA LIFE!',
                        { color: '#ffd700', size: '28px', prefix: '' }
                    );
                }
                return;
            default:
                bonusType = COLLECTIBLE_TYPES.CRYSTAL;
        }

        const c = new Collectible(this, this.player.x, this.player.y - 60, bonusType);
        this.collectibles.add(c);
    }

    _launchGameOver() {
        this.scene.launch('GameOverScene', this._gameOverData);
    }

    getWeaponDisplayName() {
        if (!this.player) return 'Pea Shooter';
        const weapon = this.player.currentWeapon;
        const level = this.player.weaponLevel;
        const names = WEAPON_UPGRADE_NAMES[weapon];
        if (names) {
            const maxLevel = Math.max(...Object.keys(names).map(Number));
            return names[Math.min(level, maxLevel)] || names[maxLevel];
        }
        return WEAPON_CONFIG[weapon].name;
    }

    takeScreenshot() {
        // Temporarily hide screenshot button
        if (this.screenshotBtn) this.screenshotBtn.setVisible(false);
        if (this.soundIcon) this.soundIcon.setVisible(false);

        // Wait one frame for the UI to hide, then capture
        this.time.delayedCall(50, () => {
            const canvas = this.game.canvas;
            const dataUrl = canvas.toDataURL('image/png');

            // Restore UI
            if (this.screenshotBtn) this.screenshotBtn.setVisible(true);
            if (this.soundIcon) this.soundIcon.setVisible(true);

            this.showScreenshotModal(dataUrl);
        });
    }

    showScreenshotModal(dataUrl) {
        const width = this.scale.width;
        const height = this.scale.height;
        const elements = [];

        // Pause game while viewing screenshot
        this.scene.pause();

        // Dark overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); z-index: 2000;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
        `;

        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.cssText = 'max-width: 90%; max-height: 70%; border: 2px solid #00ffff; border-radius: 4px;';
        overlay.appendChild(img);

        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'margin-top: 16px; display: flex; gap: 16px;';

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'SAVE';
        saveBtn.style.cssText = `
            padding: 10px 32px; font-family: monospace; font-size: 18px;
            background: #00ff00; color: #000; border: none; cursor: pointer; border-radius: 4px;
        `;
        saveBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `fortune-screenshot-${Date.now()}.png`;
            a.click();
        };

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'CLOSE';
        closeBtn.style.cssText = `
            padding: 10px 32px; font-family: monospace; font-size: 18px;
            background: #333; color: #fff; border: 1px solid #666; cursor: pointer; border-radius: 4px;
        `;
        closeBtn.onclick = () => {
            overlay.remove();
            this.scene.resume();
        };

        btnContainer.appendChild(saveBtn);
        btnContainer.appendChild(closeBtn);
        overlay.appendChild(btnContainer);
        document.body.appendChild(overlay);
    }

    autoScreenshotGameOver() {
        try {
            const canvas = this.game.canvas;
            const dataUrl = canvas.toDataURL('image/png');
            // Store for GameOverScene to access
            localStorage.setItem('fortune-last-screenshot', dataUrl);
        } catch (e) {
            // Ignore errors
        }
    }

    spawnMiniBoss() {
        const x = Phaser.Math.Between(100, this.scale.width - 100);
        const y = -50;
        const miniBoss = new Enemy(this, x, y, 'fighter');

        // Override stats for mini-boss
        miniBoss.health = MINI_BOSS_CONFIG.health;
        miniBoss.maxHealth = MINI_BOSS_CONFIG.health;
        miniBoss.speed = MINI_BOSS_CONFIG.speed;
        miniBoss.points = MINI_BOSS_CONFIG.points;
        miniBoss.setScale(MINI_BOSS_CONFIG.scale);
        miniBoss.setTint(MINI_BOSS_CONFIG.tint);
        miniBoss.isMiniBoss = true;
        miniBoss.setVelocity(Phaser.Math.Between(-60, 60), 80);
        miniBoss.setCollideWorldBounds(true);

        this.enemies.add(miniBoss);

        // Wave manager tracks it
        this.waveManager.enemiesRemaining += 1;

        // Show warning
        this.effectManager.showScorePopup(
            this.scale.width / 2, this.scale.height / 2 - 80,
            'MINI-BOSS!',
            { color: '#ffd700', size: '36px', prefix: '' }
        );
    }

    // --- WAVE SUMMARY (quick 1.5s flash) ---
    showWaveSummary() {
        const summary = this.waveManager.getWaveSummary();
        if (!summary || summary.wave <= 0) return;

        const perfect = !this.waveDamageTaken;
        const centerX = this.scale.width / 2;
        const y = 50;

        let label = `Wave ${summary.wave}  |  Kills: ${summary.kills}  |  Score: +${summary.score}  |  Time: ${summary.time}s`;
        if (perfect) label += '  PERFECT!';

        const text = this.add.text(centerX, y, label, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: perfect ? '#00ff00' : '#00ffff',
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'bold'
        });
        text.setOrigin(0.5);
        text.setDepth(1008);
        text.setAlpha(0);

        this.tweens.add({
            targets: text,
            alpha: 1,
            duration: 200,
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    this.tweens.add({
                        targets: text,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => text.destroy()
                    });
                });
            }
        });
    }

    // --- PLAYER EMOTES ---
    showEmote(num) {
        if (this.emoteCooldown || !this.player || !this.player.active) return;
        this.emoteCooldown = true;
        this.time.delayedCall(2500, () => { this.emoteCooldown = false; });

        const emotes = {
            1: { text: '\u{1F60E}', effect: 'none' },       // cool face
            2: { text: '\u{1F525}', effect: 'fire' },        // fire
            3: { text: '\u{1F4AA}', effect: 'strong' },      // strong
            4: { text: '\u{1F602}', effect: 'laugh' }        // laughing
        };

        const emote = emotes[num];
        if (!emote) return;

        // Show emoji above ship
        const emoji = this.add.text(this.player.x, this.player.y - 50, emote.text, {
            fontSize: '32px'
        });
        emoji.setOrigin(0.5);
        emoji.setDepth(200);

        this.tweens.add({
            targets: emoji,
            y: this.player.y - 80,
            alpha: 0,
            duration: 2000,
            ease: 'Power1',
            onComplete: () => emoji.destroy()
        });

        // Special effects per emote
        if (emote.effect === 'fire') {
            // Small flame particles
            for (let i = 0; i < 6; i++) {
                const flame = this.add.circle(
                    this.player.x + Phaser.Math.Between(-15, 15),
                    this.player.y - 30,
                    Phaser.Math.Between(2, 5),
                    0xff6600
                );
                flame.setDepth(199);
                this.tweens.add({
                    targets: flame,
                    y: flame.y - Phaser.Math.Between(30, 60),
                    alpha: 0,
                    scale: 0,
                    duration: Phaser.Math.Between(400, 800),
                    onComplete: () => flame.destroy()
                });
            }
        } else if (emote.effect === 'strong') {
            // Brief scale up
            this.tweens.add({
                targets: this.player,
                scaleX: 1.0,
                scaleY: 1.0,
                duration: 200,
                yoyo: true,
                onComplete: () => {
                    this.player.setScale(0.8);
                }
            });
        } else if (emote.effect === 'laugh') {
            // Wiggle side to side
            this.tweens.add({
                targets: this.player,
                x: { from: this.player.x - 5, to: this.player.x + 5 },
                duration: 80,
                yoyo: true,
                repeat: 5
            });
        }
    }

    // --- COMBO FINISHER MOVE ---
    showFinisherButton() {
        if (this.finisherReady) return;
        this.finisherReady = true;

        const btnX = this.scale.width / 2;
        const btnY = this.scale.height - 60;

        // Glowing button
        this.finisherButton = this.add.rectangle(btnX, btnY, 180, 50, 0x00ffff, 0.3);
        this.finisherButton.setStrokeStyle(3, 0x00ffff, 1);
        this.finisherButton.setDepth(1010);
        this.finisherButton.setInteractive({ useHandCursor: true });
        this.finisherButton.on('pointerdown', () => this.activateFinisher());

        this.finisherText = this.add.text(btnX, btnY, 'FINISHER! [F]', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#00ffff',
            fontStyle: 'bold',
            stroke: '#003366',
            strokeThickness: 3
        });
        this.finisherText.setOrigin(0.5);
        this.finisherText.setDepth(1011);

        // Glow pulse animation
        this.tweens.add({
            targets: [this.finisherButton, this.finisherText],
            alpha: { from: 1, to: 0.5 },
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Scale pulse on button
        this.tweens.add({
            targets: this.finisherButton,
            scaleX: { from: 1, to: 1.05 },
            scaleY: { from: 1, to: 1.05 },
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Auto-remove after 3 seconds if not pressed
        this.finisherTimer = this.time.delayedCall(3000, () => {
            this.clearFinisherButton();
        });
    }

    clearFinisherButton() {
        this.finisherReady = false;
        if (this.finisherButton) {
            this.finisherButton.destroy();
            this.finisherButton = null;
        }
        if (this.finisherText) {
            this.finisherText.destroy();
            this.finisherText = null;
        }
        if (this.finisherTimer) {
            this.finisherTimer.destroy();
            this.finisherTimer = null;
        }
    }

    activateFinisher() {
        if (!this.finisherReady) return;
        this.clearFinisherButton();
        this.finisherActive = true;
        this.finisherEndTime = Date.now() + 5000; // 5 seconds

        // Reset combo
        if (this.scoreManager) {
            this.scoreManager.combo = 0;
            this.scoreManager.comboMultiplier = 1;
            this.scoreManager.comboTimer = 0;
        }

        // Screen flash + slowmo
        this.effectManager.screenFlash(0x00ffff, 400);
        this.time.timeScale = 0.3;

        // FINISHER! text
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        const finText = this.add.text(centerX, centerY, 'FINISHER!', {
            fontSize: '64px',
            fontFamily: 'monospace',
            color: '#00ffff',
            stroke: '#003366',
            strokeThickness: 8,
            fontStyle: 'bold'
        });
        finText.setOrigin(0.5);
        finText.setDepth(1020);
        finText.setAlpha(0);

        this.tweens.add({
            targets: finText,
            alpha: 1,
            scale: { from: 2.5, to: 1 },
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(500, () => {
                    this.tweens.add({
                        targets: finText,
                        alpha: 0,
                        y: centerY - 50,
                        duration: 400,
                        onComplete: () => finText.destroy()
                    });
                });
            }
        });

        // Return time to normal after 1 second (adjusted for 0.3x)
        this.time.delayedCall(333, () => {
            this.time.timeScale = 1;
        });

        this.cameras.main.shake(500, 0.02);
    }

    // --- COLOR BLIND MODE HELPERS ---
    toggleColorBlindMode() {
        this.colorBlindMode = !this.colorBlindMode;
        localStorage.setItem('fortune-color-blind', this.colorBlindMode.toString());
        return this.colorBlindMode;
    }

    // --- ENDLESS MODE: Skip shop, increase power-up drops ---
    // Override nextWave for endless mode
    getEndlessPowerUpDropMultiplier() {
        return this.endlessMode ? 1.5 : 1;
    }

    // Cleanup music on scene shutdown
    shutdown() {
        if (this.musicManager) {
            this.musicManager.destroy();
            this.musicManager = null;
        }
    }
}

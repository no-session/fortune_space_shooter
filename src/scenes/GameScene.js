import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import Boss from '../entities/Boss.js';
import Collectible from '../entities/Collectible.js';
import FormationManager from '../managers/FormationManager.js';
import WaveManager from '../managers/WaveManager.js';
import ScoreManager from '../managers/ScoreManager.js';
import SoundManager from '../managers/SoundManager.js';
import { COLLECTIBLE_TYPES, GAME_CONFIG } from '../utils/constants.js';

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
        
        // Start first wave
        this.waveManager.startWave(1);
        
        // Pause key
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.pauseKey.on('down', () => {
            this.scene.pause();
            this.scene.launch('PauseScene');
        });
        
        // Game state
        this.gameOver = false;
        this.paused = false;
    }

    createStarfield() {
        // Create multiple layers of stars for parallax effect
        this.starfieldLayers = [];
        
        for (let i = 0; i < 3; i++) {
            const stars = this.add.group();
            const starCount = 50 + i * 20;
            const speed = 50 + i * 30;
            const size = 1 + i;
            
            for (let j = 0; j < starCount; j++) {
                const x = Phaser.Math.Between(0, this.scale.width);
                const y = Phaser.Math.Between(0, this.scale.height);
                const star = this.add.circle(x, y, size, 0xffffff);
                stars.add(star);
            }
            
            this.starfieldLayers.push({ stars, speed });
        }
    }

    updateStarfield() {
        this.starfieldLayers.forEach((layer, index) => {
            layer.stars.children.entries.forEach(star => {
                star.y += layer.speed * (this.game.loop.delta / 1000);
                
                if (star.y > this.scale.height) {
                    star.y = 0;
                    star.x = Phaser.Math.Between(0, this.scale.width);
                }
            });
        });
    }

    setupCollisions() {
        // Player bullets vs enemies
        this.physics.add.overlap(
            this.player.bullets,
            this.enemies,
            (bullet, enemy) => {
                bullet.destroy();
                enemy.takeDamage(10);
                if (!enemy.active) {
                    this.onEnemyKilled(enemy);
                }
            }
        );
        
        // Player bullets vs bosses
        this.physics.add.overlap(
            this.player.bullets,
            this.bosses,
            (bullet, boss) => {
                bullet.destroy();
                boss.takeDamage(10);
            }
        );
        
        // Enemy bullets vs player
        this.physics.add.overlap(
            this.enemyBullets,
            this.player,
            (bullet, player) => {
                bullet.destroy();
                player.takeDamage(10);
                if (!player.isAlive()) {
                    this.gameOver();
                }
            }
        );
        
        // Enemies vs player
        this.physics.add.overlap(
            this.enemies,
            this.player,
            (enemy, player) => {
                enemy.die();
                player.takeDamage(20);
                if (!player.isAlive()) {
                    this.gameOver();
                }
            }
        );
        
        // Collectibles vs player
        this.physics.add.overlap(
            this.collectibles,
            this.player,
            (collectible, player) => {
                const value = this.scoreManager.addCollectible(
                    collectible.value,
                    this.game.getTime()
                );
                collectible.collect();
                this.updateUI();
            }
        );
        
        // Boss bullets vs player
        this.bosses.children.entries.forEach(boss => {
            if (boss.bullets) {
                this.physics.add.overlap(
                    boss.bullets,
                    this.player,
                    (bullet, player) => {
                        bullet.destroy();
                        player.takeDamage(15);
                        if (!player.isAlive()) {
                            this.gameOver();
                        }
                    }
                );
            }
        });
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
    }

    updateUI() {
        this.scoreText.setText(`Score: ${this.scoreManager.getScore()}`);
        
        const combo = this.scoreManager.getCombo();
        if (combo > 0) {
            this.comboText.setText(`Combo: x${this.scoreManager.getComboMultiplier().toFixed(1)}`);
        } else {
            this.comboText.setText('');
        }
        
        this.waveText.setText(`Wave: ${this.waveManager.getCurrentWave()}`);
        this.livesText.setText(`Lives: ${this.player.lives}`);
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
        
        // Update enemies
        this.enemies.children.entries.forEach(enemy => {
            if (enemy && enemy.active) {
                enemy.update(time);
            }
        });
        
        // Update bosses
        this.bosses.children.entries.forEach(boss => {
            if (boss && boss.active) {
                boss.update(time);
            }
        });
        
        // Update collectibles
        this.collectibles.children.entries.forEach(collectible => {
            if (collectible && collectible.active) {
                collectible.update();
            }
        });
        
        // Check for wave completion
        if (this.waveManager.isWaveComplete()) {
            this.nextWave();
        }
        
        // Update UI
        this.updateUI();
        
        // Clean up off-screen bullets
        this.player.bullets.children.entries.forEach(bullet => {
            if (bullet && bullet.y < -50) {
                bullet.destroy();
            }
        });
    }

    onEnemyKilled(enemy) {
        // Add to enemies group for tracking
        if (!this.enemies.contains(enemy)) {
            this.enemies.add(enemy);
        }
        
        // Add score
        this.scoreManager.addEnemyKill(enemy.points);
        
        // Drop collectible
        if (Math.random() < enemy.dropChance) {
            this.dropCollectible(enemy.x, enemy.y);
        }
        
        // Update wave manager
        this.waveManager.onEnemyKilled();
        
        // Remove from enemies group
        this.enemies.remove(enemy);
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
        const currentWave = this.waveManager.getCurrentWave();
        
        // If boss wave, go to shop
        if (this.waveManager.isBossWave()) {
            this.scene.pause();
            this.scene.launch('ShopScene', {
                score: this.scoreManager.getScore(),
                wave: currentWave
            });
        } else {
            // Start next wave
            this.waveManager.startWave(currentWave + 1);
        }
    }

    onBossDefeated() {
        this.waveManager.onBossKilled();
        this.scoreManager.addScore(5000); // Big bonus for boss
    }

    gameOver() {
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

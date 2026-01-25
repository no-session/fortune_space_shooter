import Phaser from 'phaser';
import { BOSS_CONFIG, BOSS_TYPES } from '../utils/constants.js';

export default class Boss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, bossType = BOSS_TYPES.MOTHERSHIP) {
        // Load configuration for this boss type (fallback to mothership if invalid)
        const config = BOSS_CONFIG[bossType] || BOSS_CONFIG[BOSS_TYPES.MOTHERSHIP];

        // Validate texture exists, fallback to mothership if not
        const textureKey = `boss-${bossType}`;
        const fallbackTexture = 'boss-mothership';
        const finalTexture = scene.textures.exists(textureKey) ? textureKey : fallbackTexture;

        super(scene, x, y, finalTexture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Store config reference
        this.config = config;
        this.bossType = bossType;
        this.bossName = config.name;

        // Health from config
        this.maxHealth = config.maxHealth;
        this.health = this.maxHealth;
        this.scoreValue = config.scoreValue;

        // Phase system
        this.currentPhase = 1;
        this.totalPhases = 3;

        // Movement - from phase 1 config
        this.moveDirection = 1;
        this.moveSpeed = config.phases[1].moveSpeed;

        // Shooting - from phase 1 config
        this.shootInterval = config.phases[1].shootInterval;
        this.lastShot = 0;
        this.bullets = scene.physics.add.group();

        // Visual - scale down from 1024x1024 images to appropriate game size (~200px wide)
        this.setScale(0.2);
        this.setCollideWorldBounds(true);
        this.setDepth(90);

        // Health bar
        this.createHealthBar();

        // Enter animation
        this.enterScene();
    }

    createHealthBar() {
        const barWidth = 300;
        const barHeight = 20;
        const x = this.scene.scale.width / 2;
        const y = 30;

        // Background
        this.healthBarBg = this.scene.add.rectangle(x, y, barWidth + 4, barHeight + 4, 0x000000);
        this.healthBarBg.setDepth(1000);

        // Health bar border
        this.healthBarBorder = this.scene.add.rectangle(x, y, barWidth + 2, barHeight + 2, 0x333333);
        this.healthBarBorder.setDepth(1001);

        // Health bar - use boss primary color
        const barColor = this.config.sprite.primaryColor;
        this.healthBar = this.scene.add.rectangle(x, y, barWidth, barHeight, barColor);
        this.healthBar.setDepth(1002);

        // Health text with boss name
        this.healthText = this.scene.add.text(x, y, this.bossName, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.healthText.setOrigin(0.5);
        this.healthText.setDepth(1003);
    }

    enterScene() {
        // Start above screen and move down
        this.setPosition(this.scene.scale.width / 2, -100);
        this.setVelocityY(100);

        this.scene.time.delayedCall(2000, () => {
            this.setVelocityY(0);
            this.setPosition(this.scene.scale.width / 2, 100);
        });
    }

    update(time) {
        // Don't update if entering
        if (this.y < 80) return;

        // Horizontal movement
        if (this.x <= 120) {
            this.moveDirection = 1;
        } else if (this.x >= this.scene.scale.width - 120) {
            this.moveDirection = -1;
        }
        this.setVelocityX(this.moveSpeed * this.moveDirection);

        // Shooting based on phase config
        if (time > this.lastShot) {
            this.shoot();
            this.lastShot = time + this.shootInterval;
        }

        // Update health bar
        this.updateHealthBar();
    }

    shoot() {
        // Get current phase attacks from config
        const phaseConfig = this.config.phases[this.currentPhase];
        if (!phaseConfig || !phaseConfig.attacks) return;

        // Limit maximum concurrent bullets to prevent screen flooding
        if (this.bullets.children.entries.length > 100) {
            return;
        }

        // Execute each attack in the phase
        phaseConfig.attacks.forEach(attack => {
            this.executeAttack(attack);
        });
    }

    executeAttack(attack) {
        switch (attack.type) {
            case 'spread':
                this.shootSpread(attack.count, attack.spacing, attack.speed);
                break;
            case 'rapid':
                this.shootRapid(attack.count, attack.speed);
                break;
            case 'circular':
                this.shootCircular(attack.count, attack.speed);
                break;
            case 'cross':
                this.shootCross(attack.count, attack.speed);
                break;
            case 'drones':
                if (Math.random() < attack.chance) {
                    this.deployDrones();
                }
                break;
        }
    }

    shootSpread(count = 5, spacing = 30, speed = 250) {
        // Fire bullets in a spread pattern
        const halfCount = Math.floor(count / 2);
        for (let i = -halfCount; i <= halfCount; i++) {
            const bullet = this.scene.physics.add.sprite(
                this.x + i * spacing,
                this.y + 50,
                'bullet-enemy'
            );
            bullet.setVelocityY(speed);
            bullet.setVelocityX(i * (spacing * 2));
            bullet.setScale(1.2);
            bullet.setDepth(50);
            this.bullets.add(bullet);
        }
    }

    shootRapid(count = 3, speed = 350) {
        // Fire quick successive bullets
        for (let i = 0; i < count; i++) {
            this.scene.time.delayedCall(i * 100, () => {
                if (!this.active) return;
                const bullet = this.scene.physics.add.sprite(this.x, this.y + 50, 'bullet-enemy');
                bullet.setVelocityY(speed);
                bullet.setVelocityX(Phaser.Math.Between(-50, 50));
                bullet.setScale(1.5);
                bullet.setDepth(50);
                this.bullets.add(bullet);
            });
        }
    }

    shootCircular(count = 8, speed = 200) {
        // Fire bullets in all directions (360 degrees)
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const bullet = this.scene.physics.add.sprite(this.x, this.y, 'bullet-enemy');
            bullet.setVelocityX(Math.cos(angle) * speed);
            bullet.setVelocityY(Math.sin(angle) * speed);
            bullet.setScale(1.3);
            bullet.setDepth(50);
            this.bullets.add(bullet);
        }
    }

    shootCross(count = 4, speed = 300) {
        // Fire in cardinal directions (cross pattern)
        const directions = [
            { x: 0, y: 1 },   // Down
            { x: 1, y: 0 },   // Right
            { x: 0, y: -1 },  // Up (behind boss)
            { x: -1, y: 0 },  // Left
            { x: 1, y: 1 },   // Down-right
            { x: -1, y: 1 },  // Down-left
            { x: 1, y: -1 },  // Up-right
            { x: -1, y: -1 }  // Up-left
        ];

        const actualCount = Math.min(count, directions.length);
        for (let i = 0; i < actualCount; i++) {
            const dir = directions[i];
            const bullet = this.scene.physics.add.sprite(this.x, this.y + 30, 'bullet-enemy');
            bullet.setVelocityX(dir.x * speed);
            bullet.setVelocityY(dir.y * speed);
            bullet.setScale(1.4);
            bullet.setDepth(50);
            this.bullets.add(bullet);
        }
    }

    deployDrones() {
        // Spawn mini enemies
        if (this.scene && this.scene.spawnMiniDrone) {
            this.scene.spawnMiniDrone(this.x - 60, this.y + 50);
            this.scene.spawnMiniDrone(this.x + 60, this.y + 50);
        }
    }

    takeDamage(amount) {
        this.health -= amount;

        // Flash effect
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });

        // Phase transitions based on config thresholds
        const healthPercent = this.health / this.maxHealth;
        const phases = this.config.phases;

        // Check for phase 2 transition (with null check)
        if (phases[2] && healthPercent < phases[2].healthThreshold && this.currentPhase === 1) {
            this.transitionToPhase(2);
        }
        // Check for phase 3 transition (with null check)
        else if (phases[3] && healthPercent < phases[3].healthThreshold && this.currentPhase === 2) {
            this.transitionToPhase(3);
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    transitionToPhase(newPhase) {
        this.currentPhase = newPhase;
        const phaseConfig = this.config.phases[newPhase];

        // Update stats from phase config
        this.shootInterval = phaseConfig.shootInterval;
        this.moveSpeed = phaseConfig.moveSpeed;

        // Visual/audio feedback
        this.createPhaseTransitionEffect();
    }

    createPhaseTransitionEffect() {
        // Flash and shake
        this.scene.cameras.main.flash(200, 255, 100, 100);
        this.scene.cameras.main.shake(300, 0.01);

        // Burst of bullets in circular pattern
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const bullet = this.scene.physics.add.sprite(this.x, this.y, 'bullet-enemy');
            bullet.setVelocityX(Math.cos(angle) * 200);
            bullet.setVelocityY(Math.sin(angle) * 200);
            bullet.setScale(1);
            bullet.setDepth(50);
            this.bullets.add(bullet);
        }
    }

    updateHealthBar() {
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        const barWidth = 300;

        this.healthBar.setSize(barWidth * healthPercent, 20);
        this.healthBar.setPosition(
            this.scene.scale.width / 2 - (barWidth * (1 - healthPercent)) / 2,
            30
        );

        // Change color based on health (use boss colors)
        if (healthPercent > 0.66) {
            this.healthBar.setFillStyle(this.config.sprite.primaryColor);
        } else if (healthPercent > 0.33) {
            this.healthBar.setFillStyle(this.config.sprite.accentColor);
        } else {
            this.healthBar.setFillStyle(0xffff00); // Warning yellow for low health
        }

        this.healthText.setText(`${this.bossName} - Phase ${this.currentPhase} - ${Math.ceil(healthPercent * 100)}%`);
    }

    die() {
        // Store references before scheduling delayed calls
        const scene = this.scene;
        const bossX = this.x;
        const bossY = this.y;
        const scoreValue = this.scoreValue;

        // Multiple explosion animations with defensive checks
        for (let i = 0; i < 5; i++) {
            const delay = i * 150;
            if (!scene || !scene.time) continue;

            scene.time.delayedCall(delay, () => {
                // Check if scene still exists and is valid
                if (!scene || !scene.textures || !scene.textures.exists('explosion3_1')) return;

                const offsetX = Phaser.Math.Between(-80, 80);
                const offsetY = Phaser.Math.Between(-40, 40);
                const explosion = scene.add.sprite(bossX + offsetX, bossY + offsetY, 'explosion3_1');
                explosion.setScale(1.5);
                explosion.setDepth(200);

                if (scene.anims && scene.anims.exists('explode_large')) {
                    explosion.play('explode_large');
                    explosion.on('animationcomplete', () => {
                        explosion.destroy();
                    });
                } else {
                    // Fallback: destroy after delay
                    if (scene.time) {
                        scene.time.delayedCall(300, () => {
                            explosion.destroy();
                        });
                    } else {
                        explosion.destroy();
                    }
                }
            });
        }

        // Screen shake and flash effects
        if (scene && scene.cameras && scene.cameras.main) {
            scene.cameras.main.shake(800, 0.03);
            scene.cameras.main.flash(500, 255, 200, 100);
        }

        // Play explosion sound
        if (scene && scene.soundManager) {
            scene.soundManager.playExplosion();
        }

        // Remove health bar
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.healthBarBorder) this.healthBarBorder.destroy();
        if (this.healthBar) this.healthBar.destroy();
        if (this.healthText) this.healthText.destroy();

        // Destroy bullets
        if (this.bullets) {
            this.bullets.clear(true, true);
        }

        // Trigger boss defeated after explosions (pass score value)
        if (scene && scene.time) {
            scene.time.delayedCall(800, () => {
                if (scene && scene.onBossDefeated) {
                    scene.onBossDefeated(scoreValue);
                }
            });
        }

        this.destroy();
    }
}

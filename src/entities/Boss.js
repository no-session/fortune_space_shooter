import Phaser from 'phaser';

export default class Boss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, bossType = 'mothership') {
        super(scene, x, y, 'boss-mothership');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.bossType = bossType;
        this.maxHealth = 1000;
        this.health = this.maxHealth;
        this.currentPhase = 1;
        this.totalPhases = 3;
        
        // Movement
        this.moveDirection = 1;
        this.moveSpeed = 80;
        
        // Shooting
        this.shootInterval = 1500;
        this.lastShot = 0;
        this.bullets = scene.physics.add.group();
        
        // Visual
        this.setScale(1.2);
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
        
        // Health bar
        this.healthBar = this.scene.add.rectangle(x, y, barWidth, barHeight, 0xff0000);
        this.healthBar.setDepth(1002);
        
        // Health text
        this.healthText = this.scene.add.text(x, y, 'BOSS', {
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
        
        // Shooting based on phase
        if (time > this.lastShot) {
            this.shoot();
            this.lastShot = time + this.shootInterval;
        }
        
        // Update health bar
        this.updateHealthBar();
    }

    shoot() {
        const phase = this.currentPhase;
        
        if (phase === 1) {
            // Phase 1: Bullet spread
            this.shootSpread();
        } else if (phase === 2) {
            // Phase 2: Deploy mini-drones + spread
            this.shootSpread();
            if (Math.random() < 0.3) {
                this.deployDrones();
            }
        } else if (phase === 3) {
            // Phase 3: Rapid fire + drones
            this.shootRapid();
            if (Math.random() < 0.2) {
                this.deployDrones();
            }
        }
    }

    shootSpread() {
        // Fire 5 bullets in a spread
        for (let i = -2; i <= 2; i++) {
            const bullet = this.scene.physics.add.sprite(this.x + i * 30, this.y + 50, 'bullet-enemy');
            bullet.setVelocityY(250);
            bullet.setVelocityX(i * 60);
            bullet.setScale(1.2);
            bullet.setDepth(50);
            this.bullets.add(bullet);
        }
    }

    shootRapid() {
        // Fire 3 quick bullets
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 100, () => {
                if (!this.active) return;
                const bullet = this.scene.physics.add.sprite(this.x, this.y + 50, 'bullet-enemy');
                bullet.setVelocityY(350);
                bullet.setVelocityX(Phaser.Math.Between(-50, 50));
                bullet.setScale(1.5);
                bullet.setDepth(50);
                this.bullets.add(bullet);
            });
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
        
        // Phase transitions
        const healthPercent = this.health / this.maxHealth;
        if (healthPercent < 0.66 && this.currentPhase === 1) {
            this.currentPhase = 2;
            this.shootInterval = 1200;
            this.moveSpeed = 100;
            this.createPhaseTransitionEffect();
        } else if (healthPercent < 0.33 && this.currentPhase === 2) {
            this.currentPhase = 3;
            this.shootInterval = 800;
            this.moveSpeed = 120;
            this.createPhaseTransitionEffect();
        }
        
        if (this.health <= 0) {
            this.die();
        }
    }

    createPhaseTransitionEffect() {
        // Flash and shake
        this.scene.cameras.main.flash(200, 255, 100, 100);
        this.scene.cameras.main.shake(300, 0.01);
        
        // Burst of bullets
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
        
        // Change color based on health
        if (healthPercent > 0.66) {
            this.healthBar.setFillStyle(0xff0000);
        } else if (healthPercent > 0.33) {
            this.healthBar.setFillStyle(0xff6600);
        } else {
            this.healthBar.setFillStyle(0xffff00);
        }
        
        this.healthText.setText(`BOSS - Phase ${this.currentPhase} - ${Math.ceil(healthPercent * 100)}%`);
    }

    die() {
        // Store references before scheduling delayed calls
        const scene = this.scene;
        const bossX = this.x;
        const bossY = this.y;

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

        // Trigger boss defeated after explosions
        if (scene && scene.time) {
            scene.time.delayedCall(800, () => {
                if (scene && scene.onBossDefeated) {
                    scene.onBossDefeated();
                }
            });
        }

        this.destroy();
    }
}

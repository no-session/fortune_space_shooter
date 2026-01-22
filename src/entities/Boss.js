import Phaser from 'phaser';

export default class Boss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, bossType = 'mothership') {
        super(scene, x, y, `boss-${bossType}`);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.bossType = bossType;
        this.maxHealth = 1000;
        this.health = this.maxHealth;
        this.currentPhase = 1;
        this.totalPhases = 3;
        
        // Movement
        this.moveDirection = 1;
        this.moveSpeed = 50;
        
        // Shooting
        this.shootInterval = 1500;
        this.lastShot = 0;
        this.bullets = scene.physics.add.group();
        
        // Visual
        this.setScale(1);
        this.setCollideWorldBounds(true);
        
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
        this.healthBarBg = this.scene.add.rectangle(x, y, barWidth, barHeight, 0x333333);
        this.healthBarBg.setDepth(1000);
        
        // Health bar
        this.healthBar = this.scene.add.rectangle(x, y, barWidth, barHeight, 0xff0000);
        this.healthBar.setDepth(1001);
        
        // Health text
        this.healthText = this.scene.add.text(x, y, 'BOSS', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
        this.healthText.setOrigin(0.5);
        this.healthText.setDepth(1002);
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
        // Horizontal movement
        if (this.x <= 100) {
            this.moveDirection = 1;
        } else if (this.x >= this.scene.scale.width - 100) {
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
            // Phase 2: Deploy mini-drones
            this.deployDrones();
        } else if (phase === 3) {
            // Phase 3: Laser beam
            this.shootLaser();
        }
    }

    shootSpread() {
        // Fire 5 bullets in a spread
        for (let i = -2; i <= 2; i++) {
            const bullet = this.scene.physics.add.sprite(this.x, this.y + 50, 'bullet-enemy');
            bullet.setVelocityY(300);
            bullet.setVelocityX(i * 100);
            bullet.setScale(1.5);
            this.bullets.add(bullet);
        }
    }

    deployDrones() {
        // Spawn mini enemies
        if (this.scene && this.scene.spawnMiniDrone) {
            this.scene.spawnMiniDrone(this.x - 50, this.y + 50);
            this.scene.spawnMiniDrone(this.x + 50, this.y + 50);
        }
    }

    shootLaser() {
        // Create a large laser beam
        const laser = this.scene.add.rectangle(this.x, this.y + 50, 20, 400, 0xff0000);
        laser.setDepth(100);
        
        // Move laser down
        this.scene.tweens.add({
            targets: laser,
            y: this.scene.scale.height + 200,
            duration: 1000,
            onComplete: () => {
                laser.destroy();
            }
        });
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
            this.shootInterval = 1000;
        } else if (healthPercent < 0.33 && this.currentPhase === 2) {
            this.currentPhase = 3;
            this.shootInterval = 800;
        }
        
        if (this.health <= 0) {
            this.die();
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
        if (healthPercent > 0.5) {
            this.healthBar.setFillStyle(0xff0000);
        } else if (healthPercent > 0.25) {
            this.healthBar.setFillStyle(0xff6600);
        } else {
            this.healthBar.setFillStyle(0xffff00);
        }
        
        this.healthText.setText(`BOSS - Phase ${this.currentPhase} - ${Math.ceil(healthPercent * 100)}%`);
    }

    die() {
        // Big explosion
        const explosion = this.scene.add.circle(this.x, this.y, 50, 0xff6600);
        explosion.setDepth(200);
        
        this.scene.tweens.add({
            targets: explosion,
            radius: 200,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Screen shake
        this.scene.cameras.main.shake(500, 0.02);
        
        // Play explosion sound
        if (this.scene.soundManager) {
            this.scene.soundManager.playExplosion();
        }
        
        // Remove health bar
        this.healthBarBg.destroy();
        this.healthBar.destroy();
        this.healthText.destroy();
        
        // Destroy bullets
        this.bullets.clear(true, true);
        
        // Trigger boss defeated
        if (this.scene && this.scene.onBossDefeated) {
            this.scene.onBossDefeated();
        }
        
        this.destroy();
    }
}

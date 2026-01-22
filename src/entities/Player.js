import Phaser from 'phaser';
import { GAME_CONFIG } from '../utils/constants.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        this.setScale(1.5);
        
        // Player stats
        this.health = GAME_CONFIG.PLAYER_HEALTH;
        this.maxHealth = GAME_CONFIG.PLAYER_HEALTH;
        this.speed = GAME_CONFIG.PLAYER_SPEED;
        this.lives = GAME_CONFIG.PLAYER_LIVES;
        
        // Weapon stats
        this.fireRate = 200; // milliseconds between shots
        this.lastFired = 0;
        this.bulletSpeed = GAME_CONFIG.BULLET_SPEED;
        this.bulletSpread = 1; // number of bullets per shot
        this.weaponLevel = 1;
        
        // Controls
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys('W,S,A,D');
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Bullet group
        this.bullets = scene.physics.add.group();
        
        // Auto-fire flag
        this.autoFire = true;
        this.isFiring = false;
        
        // Set up input
        this.setupInput();
    }

    setupInput() {
        // Space bar to toggle auto-fire
        this.spaceKey.on('down', () => {
            this.isFiring = true;
        });
        
        this.spaceKey.on('up', () => {
            this.isFiring = false;
        });
    }

    update(time) {
        // Movement
        let velocityX = 0;
        let velocityY = 0;
        
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            velocityX = -this.speed;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            velocityX = this.speed;
        }
        
        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            velocityY = -this.speed;
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            velocityY = this.speed;
        }
        
        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }
        
        this.setVelocity(velocityX, velocityY);
        
        // Shooting
        if (this.autoFire || this.isFiring) {
            if (time > this.lastFired) {
                this.shoot();
                this.lastFired = time + this.fireRate;
            }
        }
    }

    shoot() {
        const bulletX = this.x;
        const bulletY = this.y - 20;
        
        if (this.bulletSpread === 1) {
            // Single bullet
            const bullet = this.scene.physics.add.sprite(bulletX, bulletY, 'bullet-player');
            bullet.setVelocityY(-this.bulletSpeed);
            bullet.setScale(1.5);
            this.bullets.add(bullet);
        } else if (this.bulletSpread === 2) {
            // Two bullets side by side
            const bullet1 = this.scene.physics.add.sprite(bulletX - 10, bulletY, 'bullet-player');
            const bullet2 = this.scene.physics.add.sprite(bulletX + 10, bulletY, 'bullet-player');
            bullet1.setVelocityY(-this.bulletSpeed);
            bullet2.setVelocityY(-this.bulletSpeed);
            bullet1.setScale(1.5);
            bullet2.setScale(1.5);
            this.bullets.add(bullet1);
            this.bullets.add(bullet2);
        } else if (this.bulletSpread >= 3) {
            // Three bullets: center, left, right
            const bullet1 = this.scene.physics.add.sprite(bulletX, bulletY, 'bullet-player');
            const bullet2 = this.scene.physics.add.sprite(bulletX - 15, bulletY, 'bullet-player');
            const bullet3 = this.scene.physics.add.sprite(bulletX + 15, bulletY, 'bullet-player');
            bullet1.setVelocityY(-this.bulletSpeed);
            bullet2.setVelocityY(-this.bulletSpeed);
            bullet2.setVelocityX(-50);
            bullet3.setVelocityY(-this.bulletSpeed);
            bullet3.setVelocityX(50);
            bullet1.setScale(1.5);
            bullet2.setScale(1.5);
            bullet3.setScale(1.5);
            this.bullets.add(bullet1);
            this.bullets.add(bullet2);
            this.bullets.add(bullet3);
        }
        
        // Play shoot sound if available
        if (this.scene.soundManager) {
            this.scene.soundManager.playShoot();
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        } else {
            // Flash effect
            this.setTint(0xff0000);
            this.scene.time.delayedCall(100, () => {
                this.clearTint();
            });
        }
    }

    die() {
        this.lives--;
        this.health = this.maxHealth;
        
        // Create explosion
        if (this.scene.soundManager) {
            this.scene.soundManager.playExplosion();
        }
        
        // Reset position
        this.setPosition(this.scene.scale.width / 2, this.scene.scale.height - 50);
        
        // Invincibility period
        this.setAlpha(0.5);
        this.scene.time.delayedCall(2000, () => {
            this.setAlpha(1);
        });
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    upgradeWeapon() {
        this.weaponLevel++;
        if (this.weaponLevel === 2) {
            this.bulletSpread = 2;
            this.fireRate = 150;
        } else if (this.weaponLevel === 3) {
            this.bulletSpread = 3;
            this.fireRate = 100;
        } else if (this.weaponLevel >= 4) {
            this.bulletSpread = 4;
            this.fireRate = 80;
        }
    }

    upgradeSpeed() {
        this.speed += 50;
    }

    isAlive() {
        return this.lives > 0;
    }
}

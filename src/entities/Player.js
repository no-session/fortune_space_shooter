import Phaser from 'phaser';
import { GAME_CONFIG } from '../utils/constants.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player_m');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        this.setScale(0.8);
        this.setDepth(100);
        
        // Player stats
        this.health = GAME_CONFIG.PLAYER_HEALTH;
        this.maxHealth = GAME_CONFIG.PLAYER_HEALTH;
        this.speed = GAME_CONFIG.PLAYER_SPEED;
        this.lives = GAME_CONFIG.PLAYER_LIVES;
        
        // Weapon stats
        this.fireRate = 150; // milliseconds between shots
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
        
        // Banking animation state
        this.currentFrame = 'player_m';
        this.bankingTween = null;
        
        // Exhaust effect
        this.createExhaust();
        
        // Invincibility
        this.invincible = false;
        
        // Set up input
        this.setupInput();
    }

    createExhaust() {
        // Create exhaust sprite behind the player
        this.exhaust = this.scene.add.sprite(this.x, this.y + 30, 'exhaust_1');
        this.exhaust.setScale(0.6);
        this.exhaust.setDepth(99);
        this.exhaust.play('exhaust');
    }

    setupInput() {
        // Space bar for manual fire
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
        
        // Update banking animation based on horizontal movement
        this.updateBankingAnimation(velocityX);
        
        // Update exhaust position
        if (this.exhaust) {
            this.exhaust.setPosition(this.x, this.y + 35);
        }
        
        // Shooting
        if (this.autoFire || this.isFiring) {
            if (time > this.lastFired) {
                this.shoot();
                this.lastFired = time + this.fireRate;
            }
        }
    }

    updateBankingAnimation(velocityX) {
        let targetFrame = 'player_m';
        
        if (velocityX < -50) {
            targetFrame = velocityX < -150 ? 'player_l2' : 'player_l1';
        } else if (velocityX > 50) {
            targetFrame = velocityX > 150 ? 'player_r2' : 'player_r1';
        }
        
        if (targetFrame !== this.currentFrame) {
            this.currentFrame = targetFrame;
            this.setTexture(targetFrame);
        }
    }

    shoot() {
        const bulletX = this.x;
        const bulletY = this.y - 30;
        
        // Determine bullet texture based on weapon level
        const bulletTexture = this.weaponLevel >= 3 ? 'bullet_proton1' : 'bullet_plasma1';
        
        if (this.bulletSpread === 1) {
            // Single bullet
            this.createBullet(bulletX, bulletY, 0, bulletTexture);
        } else if (this.bulletSpread === 2) {
            // Two bullets side by side
            this.createBullet(bulletX - 15, bulletY, 0, bulletTexture);
            this.createBullet(bulletX + 15, bulletY, 0, bulletTexture);
        } else if (this.bulletSpread >= 3) {
            // Three bullets with spread
            this.createBullet(bulletX, bulletY, 0, bulletTexture);
            this.createBullet(bulletX - 20, bulletY, -50, bulletTexture);
            this.createBullet(bulletX + 20, bulletY, 50, bulletTexture);
        }
        
        // Play shoot sound if available
        if (this.scene.soundManager) {
            this.scene.soundManager.playShoot();
        }
    }

    createBullet(x, y, offsetX, texture) {
        const bullet = this.scene.physics.add.sprite(x, y, texture);
        bullet.setVelocityY(-this.bulletSpeed);
        bullet.setVelocityX(offsetX);
        bullet.setScale(0.5);
        bullet.setDepth(50);
        this.bullets.add(bullet);
    }

    takeDamage(amount) {
        if (this.invincible) return;
        
        this.health -= amount;
        
        // Flash effect
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });
        
        // Screen shake
        this.scene.cameras.main.shake(100, 0.01);
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    die() {
        this.lives--;
        
        // Create explosion
        this.createDeathExplosion();
        
        // Play explosion sound
        if (this.scene.soundManager) {
            this.scene.soundManager.playExplosion();
        }
        
        if (this.lives > 0) {
            // Respawn
            this.health = this.maxHealth;
            this.setPosition(this.scene.scale.width / 2, this.scene.scale.height - 50);
            
            // Invincibility period
            this.invincible = true;
            this.setAlpha(0.5);
            
            // Blink effect
            const blinkTween = this.scene.tweens.add({
                targets: this,
                alpha: { from: 0.3, to: 0.8 },
                duration: 100,
                repeat: 15,
                yoyo: true
            });
            
            this.scene.time.delayedCall(2000, () => {
                this.invincible = false;
                this.setAlpha(1);
                if (blinkTween) blinkTween.stop();
            });
        }
    }

    createDeathExplosion() {
        const explosion = this.scene.add.sprite(this.x, this.y, 'explosion1_1');
        explosion.setScale(1.5);
        explosion.setDepth(200);
        explosion.play('explode_medium');
        explosion.on('animationcomplete', () => {
            explosion.destroy();
        });
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    upgradeWeapon() {
        this.weaponLevel++;
        if (this.weaponLevel === 2) {
            this.bulletSpread = 2;
            this.fireRate = 120;
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

    destroy() {
        if (this.exhaust) {
            this.exhaust.destroy();
        }
        super.destroy();
    }
}

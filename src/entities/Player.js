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
        
        // Manual fire only (space bar)
        this.autoFire = false;
        this.isFiring = false;
        
        // Banking animation state
        this.currentFrame = 'player_m';
        this.bankingTween = null;
        
        // Exhaust effect
        this.createExhaust();
        
        // Invincibility and dying state
        this.invincible = false;
        this.isDying = false;
        
        // Set up input
        this.setupInput();
    }

    createExhaust() {
        // Create exhaust sprite behind the player
        // Check if the texture exists before creating the sprite
        if (!this.scene.textures.exists('exhaust_1')) {
            console.warn('Exhaust texture not loaded, skipping exhaust effect');
            this.exhaust = null;
            return;
        }
        
        this.exhaust = this.scene.add.sprite(this.x, this.y + 30, 'exhaust_1');
        this.exhaust.setScale(0.6);
        this.exhaust.setDepth(99);
        
        // Check if animation exists before playing
        if (this.scene.anims.exists('exhaust')) {
            this.exhaust.play('exhaust');
        } else {
            console.warn('Exhaust animation not found');
        }
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
        // Safety check - don't update if physics body doesn't exist
        if (!this.body || !this.active) return;

        // Don't update if dying
        if (this.isDying) {
            this.setVelocity(0, 0);
            return;
        }

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
        const bullet = this.bullets.create(x, y, texture);
        if (bullet) {
            bullet.setVelocityY(-this.bulletSpeed);
            bullet.setVelocityX(offsetX);
            bullet.setScale(0.5);
            bullet.setDepth(50);
            bullet.body.allowGravity = false;
        }
    }

    takeDamage(amount) {
        if (this.invincible || this.isDying) return;
        if (!this.scene || !this.scene.time) return; // Safety check
        if (!this.active || !this.visible) return; // Don't take damage if not visible

        this.health -= amount;

        // Brief invincibility after taking damage
        this.invincible = true;
        this.scene.time.delayedCall(200, () => {
            if (!this.isDying) {
                this.invincible = false;
            }
        });

        // Flash effect (but don't affect alpha during blink animation)
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });

        // Screen shake
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(100, 0.01);
        }

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    die() {
        if (this.isDying) return;
        this.isDying = true;
        this.invincible = true;

        this.lives--;

        // Create explosion
        this.createDeathExplosion();

        // Play explosion sound
        if (this.scene.soundManager) {
            this.scene.soundManager.playExplosion();
        }

        if (this.lives > 0) {
            // Hide player temporarily
            this.setAlpha(0);

            // Respawn after short delay
            if (this.scene && this.scene.time) {
                this.scene.time.delayedCall(500, () => {
                    this.health = this.maxHealth;
                    this.setPosition(this.scene.scale.width / 2, this.scene.scale.height - 50);
                    this.isDying = false;
                    this.setAlpha(1); // Make sure player is visible
                    this.setActive(true);
                    this.setVisible(true);

                    // Stop any existing blink tweens first
                    if (this.blinkTween && this.blinkTween.isPlaying()) {
                        this.blinkTween.stop();
                    }

                    // Blink effect during invincibility
                    this.blinkTween = this.scene.tweens.add({
                        targets: this,
                        alpha: { from: 0.4, to: 1.0 },
                        duration: 100,
                        repeat: 15,
                        yoyo: true,
                        onComplete: () => {
                            // Ensure alpha is reset when tween completes
                            if (this.active && !this.isDying) {
                                this.setAlpha(1);
                                this.setVisible(true);
                            }
                        }
                    });

                    this.scene.time.delayedCall(2000, () => {
                        this.invincible = false;
                        if (this.active && !this.isDying) {
                            this.setAlpha(1);
                            this.setVisible(true);
                        }
                        if (this.blinkTween && this.blinkTween.isPlaying()) {
                            this.blinkTween.stop();
                        }
                        this.blinkTween = null;
                    });
                });
            }
        } else {
            // Game over - no more lives
            this.setAlpha(0); // Hide player
            this.isDying = false;

            // Trigger game over after a short delay
            if (this.scene && this.scene.time && this.scene.triggerGameOver) {
                this.scene.time.delayedCall(1000, () => {
                    this.scene.triggerGameOver();
                });
            }
        }
    }

    createDeathExplosion() {
        // Check if explosion texture exists
        if (!this.scene.textures.exists('explosion1_1')) {
            console.warn('Explosion texture not loaded');
            return;
        }
        
        const explosion = this.scene.add.sprite(this.x, this.y, 'explosion1_1');
        explosion.setScale(1.5);
        explosion.setDepth(200);
        
        // Check if animation exists before playing
        if (this.scene.anims.exists('explode_medium')) {
            explosion.play('explode_medium');
            explosion.on('animationcomplete', () => {
                explosion.destroy();
            });
        } else {
            // Fallback: destroy after a short delay
            this.scene.time.delayedCall(300, () => {
                explosion.destroy();
            });
        }
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
        // Stop any running blink tween
        if (this.blinkTween && this.blinkTween.isPlaying()) {
            this.blinkTween.stop();
        }

        if (this.exhaust) {
            this.exhaust.destroy();
        }
        super.destroy();
    }
}

import Phaser from 'phaser';
import { ENEMY_TYPES, ENEMY_STATS } from '../utils/constants.js';

// Mapping enemy types to texture prefixes
const ENEMY_TEXTURES = {
    [ENEMY_TYPES.SCOUT]: 'enemy_scout',
    [ENEMY_TYPES.FIGHTER]: 'enemy_fighter',
    [ENEMY_TYPES.BOMBER]: 'enemy_bomber',
    [ENEMY_TYPES.ELITE]: 'enemy_elite'
};

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = ENEMY_TYPES.SCOUT) {
        const texturePrefix = ENEMY_TEXTURES[type] || 'enemy_scout';
        super(scene, x, y, `${texturePrefix}_m`);
        
        this.scene = scene;
        this.type = type;
        this.stats = ENEMY_STATS[type];
        this.texturePrefix = texturePrefix;
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set stats
        this.health = this.stats.health;
        this.maxHealth = this.stats.health;
        this.speed = this.stats.speed;
        this.points = this.stats.points;
        this.dropChance = this.stats.dropChance;
        
        // Movement
        this.velocityX = 0;
        this.velocityY = 0;
        this.setCollideWorldBounds(true);
        this.body.onWorldBounds = true;
        
        // Shooting (for fighters)
        if (this.stats.shoots) {
            this.shootInterval = this.stats.shootInterval;
            this.lastShot = 0;
            this.bullets = scene.physics.add.group();
        }
        
        // Formation reference
        this.formation = null;
        this.formationOffset = { x: 0, y: 0 };
        
        // Visual
        this.setScale(0.7);
        this.setDepth(80);
        
        // Current animation frame
        this.currentFrame = `${texturePrefix}_m`;
        this.lastVelocityX = 0;
        
        // Flip the sprite to face downward (enemies face player)
        this.setFlipY(true);
        
        // World bounds collision
        scene.physics.world.on('worldbounds', (body) => {
            if (body.gameObject === this) {
                this.onWorldBounds();
            }
        });
    }

    update(time) {
        // Safety check - don't update if physics body doesn't exist
        if (!this.body || !this.active) return;

        // Update banking animation based on horizontal movement
        this.updateBankingAnimation();

        // Shooting for fighters
        if (this.stats.shoots && time > this.lastShot) {
            this.shoot();
            this.lastShot = time + this.shootInterval;
        }

        // Update position based on formation or individual movement
        if (this.formation) {
            // Position is managed by formation
            return;
        }

        // Individual movement
        this.setVelocity(this.velocityX, this.velocityY);
    }

    updateBankingAnimation() {
        const velocityX = this.body ? this.body.velocity.x : 0;
        
        // Only update if velocity changed significantly
        if (Math.abs(velocityX - this.lastVelocityX) < 20) return;
        this.lastVelocityX = velocityX;
        
        let targetFrame = `${this.texturePrefix}_m`;
        
        if (velocityX < -30) {
            targetFrame = velocityX < -80 ? `${this.texturePrefix}_l2` : `${this.texturePrefix}_l1`;
        } else if (velocityX > 30) {
            targetFrame = velocityX > 80 ? `${this.texturePrefix}_r2` : `${this.texturePrefix}_r1`;
        }
        
        if (targetFrame !== this.currentFrame) {
            this.currentFrame = targetFrame;
            this.setTexture(targetFrame);
        }
    }

    shoot() {
        // Create bullet sprite with physics
        const bullet = this.scene.physics.add.sprite(this.x, this.y + 30, 'bullet-enemy');

        if (!bullet || !bullet.body) {
            console.warn('Failed to create enemy bullet');
            return;
        }

        // Configure bullet physics and appearance
        bullet.setScale(1);
        bullet.setDepth(50);
        bullet.body.setAllowGravity(false);
        bullet.body.setVelocityY(400); // Move downward toward player

        // Add to scene's enemyBullets group for collision detection
        if (this.scene.enemyBullets) {
            this.scene.enemyBullets.add(bullet, true); // true = don't reset physics properties
        }

        // Also track in local bullets group for cleanup
        this.bullets.add(bullet, true);

        // Play shoot sound if available
        if (this.scene.soundManager) {
            this.scene.soundManager.playEnemyShoot();
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        
        // Flash effect
        this.setTint(0xffffff);
        this.scene.time.delayedCall(50, () => {
            this.clearTint();
        });
        
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        // Create explosion animation with defensive check
        if (this.scene && this.scene.textures && this.scene.textures.exists('explosion1_1')) {
            const explosion = this.scene.add.sprite(this.x, this.y, 'explosion1_1');
            explosion.setScale(1);
            explosion.setDepth(150);

            if (this.scene.anims && this.scene.anims.exists('explode_small')) {
                explosion.play('explode_small');
                explosion.on('animationcomplete', () => {
                    explosion.destroy();
                });
            } else {
                // Fallback: destroy after a short delay
                if (this.scene.time) {
                    this.scene.time.delayedCall(300, () => {
                        explosion.destroy();
                    });
                } else {
                    explosion.destroy();
                }
            }
        }

        // Play explosion sound
        if (this.scene && this.scene.soundManager) {
            this.scene.soundManager.playExplosion();
        }
        
        // Drop collectible
        if (Math.random() < this.dropChance) {
            this.dropCollectible();
        }
        
        // Remove from formation if in one
        if (this.formation) {
            this.formation.removeEnemy(this);
        }
        
        // Destroy bullets
        if (this.bullets) {
            this.bullets.clear(true, true);
        }
        
        // Destroy enemy
        this.destroy();
    }

    dropCollectible() {
        // Trigger collectible drop in scene
        if (this.scene && this.scene.onEnemyKilled) {
            this.scene.onEnemyKilled(this);
        }
    }

    onWorldBounds() {
        // Handle world bounds collision
        if (this.body && this.body.blocked.down) {
            // Enemy reached bottom - damage player or remove
            this.destroy();
        }
    }

    setFormation(formation, offsetX, offsetY) {
        this.formation = formation;
        this.formationOffset = { x: offsetX, y: offsetY };
    }

    setMovement(velocityX, velocityY) {
        this.velocityX = velocityX;
        this.velocityY = velocityY;
    }
}

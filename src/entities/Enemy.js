import Phaser from 'phaser';
import { ENEMY_TYPES, ENEMY_STATS } from '../utils/constants.js';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = ENEMY_TYPES.SCOUT) {
        const textureKey = `enemy-${type}`;
        super(scene, x, y, textureKey);
        
        this.scene = scene;
        this.type = type;
        this.stats = ENEMY_STATS[type];
        
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
        this.setScale(1.2);
        
        // World bounds collision
        scene.physics.world.on('worldbounds', (event) => {
            if (event.gameObject === this) {
                this.onWorldBounds();
            }
        });
    }

    update(time) {
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

    shoot() {
        const bullet = this.scene.physics.add.sprite(this.x, this.y + 20, 'bullet-enemy');
        bullet.setVelocityY(this.stats.speed || 400);
        bullet.setScale(1.2);
        this.bullets.add(bullet);
        
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
        // Create explosion
        const explosion = this.scene.add.sprite(this.x, this.y, 'explosion');
        explosion.setScale(2);
        explosion.setTint(0xff6600);
        
        // Animate explosion
        this.scene.tweens.add({
            targets: explosion,
            scale: 3,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Play explosion sound
        if (this.scene.soundManager) {
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
        if (this.body.blocked.down) {
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

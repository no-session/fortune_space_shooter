import Phaser from 'phaser';
import { ENEMY_TYPES, ENEMY_STATS } from '../utils/constants.js';

// Mapping enemy types to texture prefixes
const ENEMY_TEXTURES = {
    [ENEMY_TYPES.SCOUT]: 'enemy_scout',
    [ENEMY_TYPES.FIGHTER]: 'enemy_fighter',
    [ENEMY_TYPES.BOMBER]: 'enemy_bomber',
    [ENEMY_TYPES.ELITE]: 'enemy_elite',
    [ENEMY_TYPES.SPLITTER]: 'enemy_fighter'
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
            // Apply difficulty multiplier to shoot interval (higher multiplier = faster shooting = lower interval)
            const diffMultiplier = scene.difficulty ? scene.difficulty.enemyShootRateMultiplier : 1;
            this.shootInterval = Math.floor(this.stats.shootInterval / diffMultiplier);
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
        
        // Splitter gets green tint; isMini flag prevents recursive splitting
        this.isMini = false;

        // --- Visual variety per enemy type ---
        this.visualFrameCount = 0;
        if (this.type === ENEMY_TYPES.SCOUT) {
            // Slight random green-hue tint
            const greenVariation = 0x00cc00 + (Math.floor(Math.random() * 0x33) << 8);
            this.setTint(greenVariation);
        } else if (this.type === ENEMY_TYPES.SPLITTER) {
            this.setTint(0x44ff44);
        }

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

        this.visualFrameCount++;

        // --- Per-type visual effects ---
        this.updateVisualEffects(time);

        // Update banking animation based on horizontal movement
        this.updateBankingAnimation();

        // Shooting for fighters (with telegraph flash)
        if (this.stats.shoots && time > this.lastShot) {
            this.shoot();
            this.lastShot = time + this.shootInterval;
        } else if (this.stats.shoots && this.lastShot - time < 200 && this.lastShot - time > 0) {
            // Fighter telegraph: bright red flash 200ms before firing
            if (!this.frozen) this.setTint(0xff2222);
        }

        // Update position based on formation or individual movement
        if (this.formation) {
            // Position is managed by formation
            return;
        }

        // Individual movement
        this.setVelocity(this.velocityX, this.velocityY);
    }

    updateVisualEffects(time) {
        if (this.frozen) return; // don't override freeze tint

        switch (this.type) {
            case ENEMY_TYPES.BOMBER:
                // Pulsing size: scale between 0.7 and 0.8
                {
                    const pulse = 0.7 + 0.1 * (0.5 + 0.5 * Math.sin(time * 0.004));
                    this.setScale(this.isMini ? pulse * 0.65 : pulse);
                }
                break;

            case ENEMY_TYPES.ELITE:
                // Rotating shield circle (visual only)
                if (!this.shieldCircle && this.scene) {
                    this.shieldCircle = this.scene.add.circle(this.x, this.y, 24, 0x00ffff, 0);
                    this.shieldCircle.setStrokeStyle(1.5, 0x00ffff, 0.4);
                    this.shieldCircle.setDepth(this.depth - 1);
                }
                if (this.shieldCircle) {
                    const r = 24 + 3 * Math.sin(time * 0.005);
                    this.shieldCircle.setPosition(this.x, this.y);
                    this.shieldCircle.setRadius(r);
                }
                break;

            case ENEMY_TYPES.SPLITTER:
                // Pulsing green glow
                {
                    const g = 0x44 + Math.floor(0x33 * (0.5 + 0.5 * Math.sin(time * 0.006)));
                    this.setTint((g << 8) | 0x0000ff & 0x44ff44 | (g << 8));
                    // Simpler: alternate between two greens
                    this.setTint(this.visualFrameCount % 30 < 15 ? 0x44ff44 : 0x88ff88);
                }
                break;
        }
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
            // Restore freeze tint if frozen, restore type tint, or clear
            if (this.frozen) {
                this.setTint(0x4488ff);
            } else if (this.type === ENEMY_TYPES.SPLITTER) {
                this.setTint(0x44ff44);
            } else if (this.type === ENEMY_TYPES.SCOUT) {
                // Re-apply green tint
                this.setTint(0x00dd00);
            } else {
                this.clearTint();
            }
        });
        
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        // Splitter: spawn 2 mini scouts on death (only if not already a mini)
        if (this.stats.splits && !this.isMini && this.scene) {
            for (let i = 0; i < 2; i++) {
                const offsetX = i === 0 ? -30 : 30;
                const mini = new Enemy(this.scene, this.x + offsetX, this.y, ENEMY_TYPES.SCOUT);
                mini.isMini = true;
                mini.setScale(0.45);
                // Fly outward at 45-degree angles
                const angleX = i === 0 ? -80 : 80;
                mini.setVelocity(angleX, 150);
                mini.setCollideWorldBounds(false);
                if (this.scene.enemies) {
                    this.scene.enemies.add(mini);
                }
                // Count minis toward wave enemies
                if (this.scene.waveManager) {
                    this.scene.waveManager.enemiesRemaining += 1;
                }
            }
        }

        // Type-specific death effects
        this.createDeathEffect();

        // Play explosion sound
        if (this.scene && this.scene.soundManager) {
            this.scene.soundManager.playExplosion();
        }
        
        // Notify scene of kill (handles score, collectible drops, wave manager)
        if (this.scene && this.scene.onEnemyKilled) {
            this.scene.onEnemyKilled(this);
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

    createDeathEffect() {
        if (!this.scene || !this.scene.textures) return;

        const x = this.x;
        const y = this.y;

        switch (this.type) {
            case ENEMY_TYPES.SCOUT:
                // Small quick explosion (existing behavior)
                this.playExplosionAnim(x, y, 'explode_small', 1);
                break;

            case ENEMY_TYPES.FIGHTER:
                // Medium explosion + 2 bullet fragments flying outward (visual only)
                this.playExplosionAnim(x, y, 'explode_medium', 1.2);
                for (let i = 0; i < 2; i++) {
                    const angle = i === 0 ? -1 : 1;
                    const frag = this.scene.add.circle(x, y, 3, 0xff4400);
                    frag.setDepth(150);
                    this.scene.tweens.add({
                        targets: frag,
                        x: x + angle * Phaser.Math.Between(60, 100),
                        y: y + Phaser.Math.Between(-30, 30),
                        alpha: 0,
                        duration: 400,
                        onComplete: () => frag.destroy()
                    });
                }
                break;

            case ENEMY_TYPES.BOMBER:
                // Large explosion + small screen shake
                this.playExplosionAnim(x, y, 'explode_large', 1.5);
                if (this.scene.cameras && this.scene.cameras.main) {
                    this.scene.cameras.main.shake(150, 0.008);
                }
                break;

            case ENEMY_TYPES.ELITE:
                // Explosion + lightning bolt effect (cyan lines from death point)
                this.playExplosionAnim(x, y, 'explode_medium', 1.3);
                for (let i = 0; i < 4; i++) {
                    const graphics = this.scene.add.graphics();
                    graphics.setDepth(151);
                    const endX = x + Phaser.Math.Between(-80, 80);
                    const endY = y + Phaser.Math.Between(-80, 80);
                    const midX = (x + endX) / 2 + Phaser.Math.Between(-20, 20);
                    const midY = (y + endY) / 2 + Phaser.Math.Between(-20, 20);
                    graphics.lineStyle(2, 0x00ffff, 0.9);
                    graphics.beginPath();
                    graphics.moveTo(x, y);
                    graphics.lineTo(midX, midY);
                    graphics.lineTo(endX, endY);
                    graphics.strokePath();
                    this.scene.tweens.add({
                        targets: graphics,
                        alpha: 0,
                        duration: 300,
                        delay: i * 30,
                        onComplete: () => graphics.destroy()
                    });
                }
                break;

            case ENEMY_TYPES.SPLITTER:
                // Green poof
                for (let i = 0; i < 8; i++) {
                    const poof = this.scene.add.circle(x, y, Phaser.Math.Between(3, 6), 0x44ff44);
                    poof.setDepth(150);
                    this.scene.tweens.add({
                        targets: poof,
                        x: x + Phaser.Math.Between(-50, 50),
                        y: y + Phaser.Math.Between(-50, 50),
                        alpha: 0,
                        scale: 0.3,
                        duration: 350,
                        onComplete: () => poof.destroy()
                    });
                }
                break;

            default:
                this.playExplosionAnim(x, y, 'explode_small', 1);
                break;
        }
    }

    playExplosionAnim(x, y, animKey, scale) {
        if (!this.scene.textures.exists('explosion1_1')) return;
        const explosion = this.scene.add.sprite(x, y, 'explosion1_1');
        explosion.setScale(scale);
        explosion.setDepth(150);
        if (this.scene.anims && this.scene.anims.exists(animKey)) {
            explosion.play(animKey);
            explosion.on('animationcomplete', () => explosion.destroy());
        } else {
            this.scene.time.delayedCall(300, () => explosion.destroy());
        }
    }

    onWorldBounds() {
        // Handle world bounds collision
        if (this.body && this.body.blocked.down) {
            // Enemy reached bottom - count it and remove

            // Remove from formation if in one
            if (this.formation) {
                this.formation.removeEnemy(this);
            }

            // Notify wave manager that enemy is gone
            if (this.scene && this.scene.waveManager) {
                this.scene.waveManager.onEnemyKilled();
            }

            // Destroy enemy
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

    destroy() {
        // Clean up visual effects
        if (this.shieldCircle) {
            this.shieldCircle.destroy();
            this.shieldCircle = null;
        }
        // Clean up bullets when enemy is destroyed (even if not through die())
        if (this.bullets) {
            this.bullets.clear(true, true);
        }
        super.destroy();
    }
}

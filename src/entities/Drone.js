import Phaser from 'phaser';
import { DRONE_CONFIG, GAME_CONFIG } from '../utils/constants.js';

export default class Drone {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        this.health = DRONE_CONFIG.health;
        this.maxHealth = DRONE_CONFIG.health;
        this.alive = true;
        this.angle = 0;
        this.lastFireTime = 0;

        // Create visual — small blue circle
        this.graphic = scene.add.circle(player.x, player.y, 8, DRONE_CONFIG.color, 0.9);
        this.graphic.setStrokeStyle(2, 0x88ccff, 0.8);
        this.graphic.setDepth(101);

        // Small inner dot
        this.dot = scene.add.circle(player.x, player.y, 3, 0xffffff, 0.8);
        this.dot.setDepth(102);

        // Health bar background
        this.healthBarBg = scene.add.rectangle(player.x, player.y - 14, 18, 3, 0x333333);
        this.healthBarBg.setDepth(102);

        // Health bar fill
        this.healthBarFill = scene.add.rectangle(player.x, player.y - 14, 18, 3, 0x44ff44);
        this.healthBarFill.setOrigin(0, 0.5);
        this.healthBarFill.setDepth(103);

        // Bullets group
        this.bullets = scene.physics.add.group();
    }

    update(time) {
        if (!this.alive || !this.player || !this.player.active) return;

        // Orbit around player
        this.angle += DRONE_CONFIG.orbitSpeed * (this.scene.game.loop.delta / 1000);
        const px = this.player.x + Math.cos(this.angle) * DRONE_CONFIG.orbitDistance;
        const py = this.player.y + Math.sin(this.angle) * DRONE_CONFIG.orbitDistance;

        // Clamp to screen bounds
        const cx = Phaser.Math.Clamp(px, 10, GAME_CONFIG.WIDTH - 10);
        const cy = Phaser.Math.Clamp(py, 10, GAME_CONFIG.HEIGHT - 10);

        this.graphic.setPosition(cx, cy);
        this.dot.setPosition(cx, cy);
        this.healthBarBg.setPosition(cx, cy - 14);
        this.healthBarFill.setPosition(cx - 9, cy - 14);

        // Update health bar
        const pct = this.health / this.maxHealth;
        this.healthBarFill.displayWidth = 18 * pct;
        this.healthBarFill.setFillStyle(pct > 0.5 ? 0x44ff44 : (pct > 0.25 ? 0xffff00 : 0xff4444));

        // Auto-fire at nearest enemy
        if (time > this.lastFireTime + DRONE_CONFIG.fireInterval) {
            this.autoFire(cx, cy);
            this.lastFireTime = time;
        }

        // Clean up off-screen bullets
        const bulletsList = this.bullets.children.entries.slice();
        for (let i = bulletsList.length - 1; i >= 0; i--) {
            const bullet = bulletsList[i];
            if (bullet && (bullet.y < -50 || bullet.y > GAME_CONFIG.HEIGHT + 50 ||
                          bullet.x < -50 || bullet.x > GAME_CONFIG.WIDTH + 50)) {
                bullet.destroy();
            }
        }
    }

    autoFire(cx, cy) {
        if (!this.scene || !this.scene.enemies) return;

        // Find nearest active enemy
        let nearest = null;
        let nearestDist = Infinity;

        this.scene.enemies.children.entries.forEach(enemy => {
            if (enemy && enemy.active) {
                const dist = Phaser.Math.Distance.Between(cx, cy, enemy.x, enemy.y);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = enemy;
                }
            }
        });

        // Also check bosses
        if (this.scene.bosses) {
            this.scene.bosses.children.entries.forEach(boss => {
                if (boss && boss.active) {
                    const dist = Phaser.Math.Distance.Between(cx, cy, boss.x, boss.y);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearest = boss;
                    }
                }
            });
        }

        if (!nearest) return;

        // Create bullet toward nearest enemy
        const angle = Phaser.Math.Angle.Between(cx, cy, nearest.x, nearest.y);
        const bullet = this.scene.physics.add.sprite(cx, cy, 'bullet_plasma1');
        if (!bullet) return;

        bullet.setScale(0.3);
        bullet.setDepth(50);
        bullet.setTint(DRONE_CONFIG.color);
        bullet.body.setAllowGravity(false);
        bullet.setVelocity(
            Math.cos(angle) * DRONE_CONFIG.bulletSpeed,
            Math.sin(angle) * DRONE_CONFIG.bulletSpeed
        );
        bullet.droneOwned = true;
        bullet.damage = DRONE_CONFIG.bulletDamage;

        this.bullets.add(bullet);
    }

    takeDamage(amount) {
        if (!this.alive) return;
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }

        // Flash effect
        this.graphic.setFillStyle(0xff4444, 1);
        this.scene.time.delayedCall(100, () => {
            if (this.alive && this.graphic) {
                this.graphic.setFillStyle(DRONE_CONFIG.color, 0.9);
            }
        });
    }

    die() {
        this.alive = false;

        // Small explosion
        const flash = this.scene.add.circle(this.graphic.x, this.graphic.y, 15, DRONE_CONFIG.color, 0.7);
        flash.setDepth(150);
        this.scene.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => flash.destroy()
        });

        this.setVisible(false);
    }

    respawn() {
        this.health = this.maxHealth;
        this.alive = true;
        this.setVisible(true);
    }

    setVisible(visible) {
        if (this.graphic) this.graphic.setVisible(visible);
        if (this.dot) this.dot.setVisible(visible);
        if (this.healthBarBg) this.healthBarBg.setVisible(visible);
        if (this.healthBarFill) this.healthBarFill.setVisible(visible);
    }

    getPosition() {
        return { x: this.graphic ? this.graphic.x : 0, y: this.graphic ? this.graphic.y : 0 };
    }

    destroy() {
        if (this.graphic) { this.graphic.destroy(); this.graphic = null; }
        if (this.dot) { this.dot.destroy(); this.dot = null; }
        if (this.healthBarBg) { this.healthBarBg.destroy(); this.healthBarBg = null; }
        if (this.healthBarFill) { this.healthBarFill.destroy(); this.healthBarFill = null; }
        if (this.bullets) { this.bullets.clear(true, true); }
    }
}

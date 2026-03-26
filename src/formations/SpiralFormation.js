import Phaser from 'phaser';
import Enemy from '../entities/Enemy.js';

export default class SpiralFormation {
    constructor(scene, enemyType, count, startX, startY) {
        this.scene = scene;
        this.enemyType = enemyType;
        this.count = count;
        this.startX = startX;
        this.startY = startY;
        this.enemies = [];

        // Movement properties
        this.velocityY = 35; // Slow downward drift
        this.rotationSpeed = 1.2; // Radians per second
        this.rotationAngle = 0;
        this.spiralRadius = 120; // Starting radius
        this.shrinkRate = 5; // Pixels per second radius shrink

        // Create formation
        this.createFormation();
    }

    createFormation() {
        const angleStep = (Math.PI * 2) / this.count;

        for (let i = 0; i < this.count; i++) {
            // Place enemies along the spiral — outer rings get more spacing
            const ringAngle = angleStep * i;
            // Vary radius slightly for spiral feel (outer enemies farther out)
            const radius = this.spiralRadius * (0.5 + 0.5 * (i / this.count));
            const offsetX = Math.cos(ringAngle) * radius;
            const offsetY = Math.sin(ringAngle) * radius;

            const x = this.startX + offsetX;
            const y = this.startY + offsetY;

            const enemy = new Enemy(this.scene, x, y, this.enemyType);
            enemy.setFormation(this, offsetX, offsetY);
            this.enemies.push(enemy);
        }
    }

    update(time) {
        const delta = this.scene.game.loop.delta / 1000;

        // Move formation center downward
        this.startY += this.velocityY * delta;

        // Rotate the spiral
        this.rotationAngle += this.rotationSpeed * delta;

        // Slowly shrink the radius (tightening spiral)
        this.spiralRadius = Math.max(40, this.spiralRadius - this.shrinkRate * delta);

        // Update enemy positions (reverse iteration)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy && enemy.active) {
                // Recalculate position based on current rotation and radius
                const baseAngle = (Math.PI * 2 * i) / this.count;
                const currentAngle = baseAngle + this.rotationAngle;
                const radius = this.spiralRadius * (0.5 + 0.5 * (i / this.count));

                const newX = this.startX + Math.cos(currentAngle) * radius;
                const newY = this.startY + Math.sin(currentAngle) * radius;

                enemy.setPosition(newX, newY);

                // Remove if off screen
                if (enemy.y > this.scene.scale.height + 50) {
                    if (this.scene.waveManager) {
                        this.scene.waveManager.onEnemyKilled();
                    }
                    enemy.destroy();
                    this.removeEnemy(enemy);
                }
            }
        }
    }

    removeEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
    }

    destroy() {
        this.enemies.forEach(enemy => {
            if (enemy && enemy.active) {
                enemy.destroy();
            }
        });
        this.enemies = [];
    }
}

import Phaser from 'phaser';
import Enemy from '../entities/Enemy.js';

export default class CircleFormation {
    constructor(scene, enemyType, count, startX, startY) {
        this.scene = scene;
        this.enemyType = enemyType;
        this.count = count;
        this.centerX = startX;
        this.centerY = startY;
        this.enemies = [];
        
        // Movement properties
        this.radius = 80;
        this.rotation = 0;
        this.rotationSpeed = 0.5;
        this.velocityY = 50; // Increased downward movement
        
        // Create formation
        this.createFormation();
    }

    createFormation() {
        const angleStep = (Math.PI * 2) / this.count;
        
        for (let i = 0; i < this.count; i++) {
            const angle = i * angleStep;
            const x = this.centerX + Math.cos(angle) * this.radius;
            const y = this.centerY + Math.sin(angle) * this.radius;
            
            const enemy = new Enemy(this.scene, x, y, this.enemyType);
            enemy.setFormation(this, Math.cos(angle) * this.radius, Math.sin(angle) * this.radius);
            this.enemies.push(enemy);
        }
    }

    update(time) {
        const delta = this.scene.game.loop.delta / 1000;
        
        // Rotate formation
        this.rotation += this.rotationSpeed * delta;
        
        // Move down
        this.centerY += this.velocityY * delta;
        
        // Update enemy positions (reverse iteration to safely remove during loop)
        const angleStep = (Math.PI * 2) / Math.max(this.enemies.length, 1);
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy && enemy.active) {
                const angle = i * angleStep + this.rotation;
                const x = this.centerX + Math.cos(angle) * this.radius;
                const y = this.centerY + Math.sin(angle) * this.radius;
                enemy.setPosition(x, y);

                // Remove enemy if it goes off screen
                if (enemy.y > this.scene.scale.height + 50) {
                    // Notify wave manager before destroying
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

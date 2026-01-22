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
        this.velocityY = 30;
        
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
        // Rotate formation
        this.rotation += this.rotationSpeed * (this.scene.game.loop.delta / 1000);
        
        // Move down
        this.centerY += this.velocityY * (this.scene.game.loop.delta / 1000);
        
        // Update enemy positions
        const angleStep = (Math.PI * 2) / Math.max(this.enemies.length, 1);
        this.enemies.forEach((enemy, index) => {
            if (enemy && enemy.active) {
                const angle = index * angleStep + this.rotation;
                const x = this.centerX + Math.cos(angle) * this.radius;
                const y = this.centerY + Math.sin(angle) * this.radius;
                enemy.setPosition(x, y);
            }
        });
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

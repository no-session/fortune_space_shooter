import Phaser from 'phaser';
import Enemy from '../entities/Enemy.js';

export default class GridFormation {
    constructor(scene, enemyType, count, startX, startY) {
        this.scene = scene;
        this.enemyType = enemyType;
        this.count = count;
        this.startX = startX;
        this.startY = startY;
        this.enemies = [];
        
        // Movement properties
        this.velocityX = 60;
        this.velocityY = 0;
        this.direction = 1;
        this.sineOffset = 0;
        
        // Create formation
        this.createFormation();
    }

    createFormation() {
        const cols = Math.ceil(Math.sqrt(this.count));
        const rows = Math.ceil(this.count / cols);
        const spacingX = 50;
        const spacingY = 40;
        
        let enemyIndex = 0;
        for (let row = 0; row < rows && enemyIndex < this.count; row++) {
            for (let col = 0; col < cols && enemyIndex < this.count; col++) {
                const x = this.startX + (col - cols / 2) * spacingX;
                const y = this.startY + row * spacingY;
                
                const enemy = new Enemy(this.scene, x, y, this.enemyType);
                enemy.setFormation(this, x - this.startX, y - this.startY);
                this.enemies.push(enemy);
                enemyIndex++;
            }
        }
    }

    update(time) {
        // Side-to-side movement with slight sine wave
        this.sineOffset += 0.02;
        const sineMovement = Math.sin(this.sineOffset) * 20;
        
        this.startX += this.velocityX * this.direction * (this.scene.game.loop.delta / 1000);
        this.startY += sineMovement * (this.scene.game.loop.delta / 1000);
        
        // Bounce off edges
        if (this.startX < 150) {
            this.direction = 1;
        } else if (this.startX > this.scene.scale.width - 150) {
            this.direction = -1;
        }
        
        // Update enemy positions
        this.enemies.forEach((enemy) => {
            if (enemy && enemy.active) {
                const offsetX = enemy.formationOffset.x;
                const offsetY = enemy.formationOffset.y;
                enemy.setPosition(this.startX + offsetX, this.startY + offsetY);
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

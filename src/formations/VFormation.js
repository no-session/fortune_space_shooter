import Phaser from 'phaser';
import Enemy from '../entities/Enemy.js';

export default class VFormation {
    constructor(scene, enemyType, count, startX, startY) {
        this.scene = scene;
        this.enemyType = enemyType;
        this.count = count;
        this.startX = startX;
        this.startY = startY;
        this.enemies = [];
        
        // Movement properties
        this.velocityX = 50;
        this.velocityY = 40; // Constant downward movement
        this.direction = 1; // 1 for right, -1 for left
        
        // Create formation
        this.createFormation();
    }

    createFormation() {
        const rows = Math.ceil(Math.sqrt(this.count));
        let enemyIndex = 0;
        
        for (let row = 0; row < rows && enemyIndex < this.count; row++) {
            const enemiesInRow = Math.min(this.count - enemyIndex, row + 1);
            const spacing = 40;
            const startOffset = -(enemiesInRow - 1) * spacing / 2;
            
            for (let col = 0; col < enemiesInRow; col++) {
                const x = this.startX + startOffset + col * spacing;
                const y = this.startY + row * 30;
                
                const enemy = new Enemy(this.scene, x, y, this.enemyType);
                enemy.setFormation(this, x - this.startX, y - this.startY);
                this.enemies.push(enemy);
                enemyIndex++;
            }
        }
    }

    update(time) {
        const delta = this.scene.game.loop.delta / 1000;
        
        // Move formation as a unit
        this.startX += this.velocityX * this.direction * delta;
        this.startY += this.velocityY * delta; // Constant downward movement
        
        // Bounce off edges
        if (this.startX < 100) {
            this.direction = 1;
        } else if (this.startX > this.scene.scale.width - 100) {
            this.direction = -1;
        }
        
        // Update enemy positions (reverse iteration to safely remove during loop)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy && enemy.active) {
                const offsetX = enemy.formationOffset.x;
                const offsetY = enemy.formationOffset.y;
                enemy.setPosition(this.startX + offsetX, this.startY + offsetY);

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

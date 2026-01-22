import Phaser from 'phaser';
import Enemy from '../entities/Enemy.js';

export default class WaveFormation {
    constructor(scene, enemyType, count, startX, startY) {
        this.scene = scene;
        this.enemyType = enemyType;
        this.count = count;
        this.startX = startX;
        this.startY = startY;
        this.enemies = [];
        
        // Movement properties
        this.velocityX = 40;
        this.direction = 1;
        this.waveOffset = 0;
        this.waveAmplitude = 30;
        this.waveFrequency = 0.05;
        
        // Create formation
        this.createFormation();
    }

    createFormation() {
        const spacing = 50;
        const startOffset = -(this.count - 1) * spacing / 2;
        
        for (let i = 0; i < this.count; i++) {
            const x = this.startX + startOffset + i * spacing;
            const y = this.startY;
            
            const enemy = new Enemy(this.scene, x, y, this.enemyType);
            enemy.setFormation(this, i * spacing - (this.count - 1) * spacing / 2, 0);
            this.enemies.push(enemy);
        }
    }

    update(time) {
        // Move horizontally
        this.startX += this.velocityX * this.direction * (this.scene.game.loop.delta / 1000);
        
        // Update wave offset
        this.waveOffset += this.waveFrequency;
        
        // Bounce off edges
        if (this.startX < 150) {
            this.direction = 1;
        } else if (this.startX > this.scene.scale.width - 150) {
            this.direction = -1;
        }
        
        // Update enemy positions with sine wave
        this.enemies.forEach((enemy, index) => {
            if (enemy && enemy.active) {
                const offsetX = enemy.formationOffset.x;
                const waveY = Math.sin(this.waveOffset + index * 0.5) * this.waveAmplitude;
                enemy.setPosition(this.startX + offsetX, this.startY + waveY);
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

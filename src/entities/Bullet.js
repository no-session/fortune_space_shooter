import Phaser from 'phaser';

export default class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, isPlayerBullet = true) {
        const textureKey = isPlayerBullet ? 'bullet-player' : 'bullet-enemy';
        super(scene, x, y, textureKey);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.isPlayerBullet = isPlayerBullet;
        
        // Remove bullet when it goes off screen
        scene.physics.world.on('worldbounds', (event) => {
            if (event.gameObject === this) {
                this.destroy();
            }
        });
    }

    update() {
        // Check if bullet is off screen
        if (this.y < -50 || this.y > this.scene.scale.height + 50) {
            this.destroy();
        }
    }
}

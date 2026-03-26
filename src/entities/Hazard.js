import Phaser from 'phaser';
import { HAZARD_TYPES, HAZARD_CONFIG, GAME_CONFIG } from '../utils/constants.js';

export default class Hazard extends Phaser.GameObjects.Container {
    constructor(scene, x, y, type = HAZARD_TYPES.ASTEROID) {
        super(scene, x, y);

        this.scene = scene;
        this.type = type;
        this.config = HAZARD_CONFIG[type];

        scene.add.existing(this);
        this.setDepth(70);

        if (type === HAZARD_TYPES.ASTEROID) {
            this.createAsteroid();
        } else if (type === HAZARD_TYPES.NEBULA) {
            this.createNebula();
        }

        // Movement
        this.speedX = (Math.random() - 0.5) * 60;
        this.speedY = type === HAZARD_TYPES.ASTEROID
            ? Phaser.Math.Between(this.config.speed.min, this.config.speed.max)
            : this.config.speed;
    }

    createAsteroid() {
        const size = Phaser.Math.Between(this.config.size.min, this.config.size.max);
        this.radius = size;

        // Draw rocky asteroid shape
        const gfx = this.scene.add.graphics();
        gfx.fillStyle(this.config.color, 1);
        gfx.lineStyle(2, 0x777777, 0.8);

        // Jagged circle
        const points = [];
        const segments = 8;
        for (let i = 0; i < segments; i++) {
            const angle = (Math.PI * 2 * i) / segments;
            const r = size + Phaser.Math.Between(-size * 0.3, size * 0.3);
            points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
        }

        gfx.beginPath();
        gfx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            gfx.lineTo(points[i].x, points[i].y);
        }
        gfx.closePath();
        gfx.fillPath();
        gfx.strokePath();

        // Add some detail dots
        gfx.fillStyle(0x444444, 0.6);
        for (let i = 0; i < 3; i++) {
            const dx = Phaser.Math.Between(-size * 0.4, size * 0.4);
            const dy = Phaser.Math.Between(-size * 0.4, size * 0.4);
            gfx.fillCircle(dx, dy, Phaser.Math.Between(2, 5));
        }

        this.add(gfx);
        this.gfx = gfx;
    }

    createNebula() {
        const w = Phaser.Math.Between(this.config.width.min, this.config.width.max);
        const h = Phaser.Math.Between(this.config.height.min, this.config.height.max);
        this.nebulaWidth = w;
        this.nebulaHeight = h;

        const color = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];

        // Semi-transparent rectangle with soft edges
        const rect = this.scene.add.rectangle(0, 0, w, h, color, 0.2);
        rect.setStrokeStyle(1, color, 0.1);
        this.add(rect);

        // Add some inner glow spots
        for (let i = 0; i < 4; i++) {
            const cx = Phaser.Math.Between(-w * 0.3, w * 0.3);
            const cy = Phaser.Math.Between(-h * 0.3, h * 0.3);
            const r = Phaser.Math.Between(15, 30);
            const spot = this.scene.add.circle(cx, cy, r, color, 0.15);
            this.add(spot);
        }

        this.nebulaRect = rect;
        this.nebulaColor = color;
    }

    update(delta) {
        const dt = delta / 1000;
        this.x += this.speedX * dt;
        this.y += this.speedY * dt;

        // Wrap horizontally
        if (this.x < -60) this.x = GAME_CONFIG.WIDTH + 60;
        if (this.x > GAME_CONFIG.WIDTH + 60) this.x = -60;

        // Remove if off bottom
        if (this.y > GAME_CONFIG.HEIGHT + 100) {
            this.destroy();
            return false;
        }

        return true;
    }

    // Check if a point is inside this hazard's bounds
    containsPoint(px, py) {
        if (this.type === HAZARD_TYPES.ASTEROID) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, px, py);
            return dist < this.radius;
        } else if (this.type === HAZARD_TYPES.NEBULA) {
            const hw = this.nebulaWidth / 2;
            const hh = this.nebulaHeight / 2;
            return px > this.x - hw && px < this.x + hw &&
                   py > this.y - hh && py < this.y + hh;
        }
        return false;
    }

    // Check collision with a sprite (circle-based for asteroids)
    overlapsSprite(sprite) {
        if (!sprite || !sprite.active) return false;

        if (this.type === HAZARD_TYPES.ASTEROID) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, sprite.x, sprite.y);
            const spriteRadius = Math.max(sprite.displayWidth, sprite.displayHeight) / 2;
            return dist < this.radius + spriteRadius;
        }
        return false;
    }

    // Check if a bullet hits this asteroid
    overlapsBullet(bullet) {
        if (!bullet || !bullet.active) return false;
        if (this.type !== HAZARD_TYPES.ASTEROID) return false;

        const dist = Phaser.Math.Distance.Between(this.x, this.y, bullet.x, bullet.y);
        return dist < this.radius;
    }

    destroy() {
        super.destroy();
    }
}

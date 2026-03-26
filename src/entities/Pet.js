import { PET_TYPES, PET_CONFIG } from '../utils/constants.js';

export default class Pet {
    constructor(scene, player, petType) {
        this.scene = scene;
        this.player = player;
        this.type = petType;
        this.config = PET_CONFIG[petType];
        this.time = 0;

        // Create pet graphics container
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(101);

        // Position offset from player
        this.offsetX = -40;
        this.offsetY = -10;
        this.currentX = player.x + this.offsetX;
        this.currentY = player.y + this.offsetY;

        // Animation state
        this.bobTime = 0;
        this.pulseTime = 0;
        this.ghostAlpha = 1;
        this.ghostDir = -1;
    }

    update(time) {
        if (!this.player || !this.player.active) return;

        this.time = time;
        this.bobTime += 0.05;
        this.pulseTime += 0.03;

        // Smooth follow with lerp
        const targetX = this.player.x + this.offsetX;
        const targetY = this.player.y + this.offsetY + Math.sin(this.bobTime) * 6;
        this.currentX += (targetX - this.currentX) * 0.08;
        this.currentY += (targetY - this.currentY) * 0.08;

        // Draw pet
        this.graphics.clear();
        this.drawPet();
    }

    drawPet() {
        const x = this.currentX;
        const y = this.currentY;
        const g = this.graphics;

        switch (this.type) {
            case PET_TYPES.STAR_BUDDY:
                this.drawStar(g, x, y);
                break;
            case PET_TYPES.SPACE_CAT:
                this.drawCat(g, x, y);
                break;
            case PET_TYPES.FIRE_SPRITE:
                this.drawFire(g, x, y);
                break;
            case PET_TYPES.GHOST_FRIEND:
                this.drawGhost(g, x, y);
                break;
        }
    }

    drawStar(g, x, y) {
        const size = 8 + Math.sin(this.pulseTime) * 1.5;
        const color = 0xffff00;
        const glowAlpha = 0.3 + Math.sin(this.pulseTime * 2) * 0.15;

        // Glow
        g.fillStyle(color, glowAlpha);
        g.fillCircle(x, y, size + 4);

        // Star shape (5 points)
        g.fillStyle(color, 0.9);
        g.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2 + this.bobTime * 0.5;
            const outerX = x + Math.cos(angle) * size;
            const outerY = y + Math.sin(angle) * size;
            const innerAngle = angle + Math.PI / 5;
            const innerX = x + Math.cos(innerAngle) * (size * 0.4);
            const innerY = y + Math.sin(innerAngle) * (size * 0.4);

            if (i === 0) g.moveTo(outerX, outerY);
            else g.lineTo(outerX, outerY);
            g.lineTo(innerX, innerY);
        }
        g.closePath();
        g.fillPath();
    }

    drawCat(g, x, y) {
        const color = 0x00ffff;

        // Body circle
        g.fillStyle(color, 0.8);
        g.fillCircle(x, y, 7);

        // Ears (triangles)
        g.fillStyle(color, 0.9);
        // Left ear
        g.fillTriangle(x - 7, y - 5, x - 3, y - 12, x - 1, y - 5);
        // Right ear
        g.fillTriangle(x + 7, y - 5, x + 3, y - 12, x + 1, y - 5);

        // Eyes
        g.fillStyle(0x000000, 1);
        g.fillCircle(x - 3, y - 1, 1.5);
        g.fillCircle(x + 3, y - 1, 1.5);

        // Tiny nose
        g.fillStyle(0xff88aa, 1);
        g.fillCircle(x, y + 2, 1);
    }

    drawFire(g, x, y) {
        const flicker = Math.sin(this.pulseTime * 4);
        const size = 7 + flicker * 2;

        // Outer glow
        g.fillStyle(0xff2200, 0.2 + flicker * 0.1);
        g.fillCircle(x, y, size + 5);

        // Outer flame (orange)
        g.fillStyle(0xff6600, 0.7);
        g.fillCircle(x, y, size);

        // Inner flame (yellow)
        g.fillStyle(0xffaa00, 0.8);
        g.fillCircle(x, y + 1, size * 0.6);

        // Core (bright)
        g.fillStyle(0xffff88, 0.9);
        g.fillCircle(x, y + 2, size * 0.3);
    }

    drawGhost(g, x, y) {
        // Phase in/out
        this.ghostAlpha += this.ghostDir * 0.015;
        if (this.ghostAlpha <= 0.25) { this.ghostAlpha = 0.25; this.ghostDir = 1; }
        if (this.ghostAlpha >= 0.8) { this.ghostAlpha = 0.8; this.ghostDir = -1; }

        const alpha = this.ghostAlpha;

        // Body
        g.fillStyle(0xffffff, alpha);
        g.fillCircle(x, y - 2, 8);

        // Bottom wavy part
        g.fillStyle(0xffffff, alpha);
        g.fillRect(x - 8, y - 2, 16, 8);
        // Wavy bottom edge
        for (let i = 0; i < 3; i++) {
            const wx = x - 6 + i * 6;
            const wy = y + 6 + Math.sin(this.bobTime * 2 + i) * 2;
            g.fillCircle(wx, wy, 3);
        }

        // Eyes
        g.fillStyle(0x000000, alpha + 0.2);
        g.fillCircle(x - 3, y - 3, 2);
        g.fillCircle(x + 3, y - 3, 2);
    }

    // --- Ability Methods ---

    getScoreBonus() {
        if (this.config.ability === 'score_bonus') return this.config.abilityValue;
        return 0;
    }

    getMagnetRangeBonus() {
        if (this.config.ability === 'magnet_range') return this.config.abilityValue;
        return 0;
    }

    getExtraDamage() {
        if (this.config.ability === 'extra_damage') return this.config.abilityValue;
        return 0;
    }

    shouldDodge() {
        if (this.config.ability === 'dodge_chance') {
            return Math.random() < this.config.abilityValue;
        }
        return false;
    }

    destroy() {
        if (this.graphics) {
            this.graphics.destroy();
            this.graphics = null;
        }
    }
}

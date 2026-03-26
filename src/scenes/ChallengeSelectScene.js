import Phaser from 'phaser';
import StatsTracker from '../managers/StatsTracker.js';

/**
 * Challenge selection screen — pick from 5 pre-designed challenges.
 */

const CHALLENGES = [
    {
        id: 'speed_blitz',
        name: 'SPEED BLITZ',
        icon: '⚡',
        color: '#ffff00',
        description: 'Survive 3 waves in 60 seconds.\nEnemies spawn 2x faster.\nScore multiplier 3x.',
        thresholds: { bronze: 1000, silver: 3000, gold: 6000 },
        xpReward: 500
    },
    {
        id: 'boss_rush',
        name: 'BOSS RUSH',
        icon: '💀',
        color: '#ff4444',
        description: 'Fight all 5 bosses back-to-back.\nFull health between bosses.\nBeat the clock!',
        thresholds: { bronze: 300, silver: 200, gold: 120 }, // seconds (lower = better)
        invertScore: true, // lower is better for time
        xpReward: 500
    },
    {
        id: 'coin_frenzy',
        name: 'COIN FRENZY',
        icon: '🪙',
        color: '#ffd700',
        description: 'Coins rain from the sky!\nNo enemies. Collect in 90 seconds.\nCoins=1, Crystals=5, Stars=10.',
        thresholds: { bronze: 50, silver: 150, gold: 300 },
        xpReward: 500
    },
    {
        id: 'one_life',
        name: 'ONE LIFE',
        icon: '💔',
        color: '#ff00ff',
        description: 'Normal gameplay but 1 life, 50 HP.\nNo health pickups.\nHow far can you get?',
        thresholds: { bronze: 5, silver: 15, gold: 30 }, // waves
        xpReward: 500
    },
    {
        id: 'dodge_master',
        name: 'DODGE MASTER',
        icon: '🌀',
        color: '#00ffff',
        description: 'You cannot shoot!\nBullets rain in patterns.\nSurvive 60 seconds.',
        thresholds: { bronze: 20, silver: 40, gold: 60 }, // seconds survived
        xpReward: 500
    }
];

export { CHALLENGES };

export default class ChallengeSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ChallengeSelectScene' });
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.cameras.main.fadeIn(300, 0, 0, 0);

        // Background
        if (this.textures.exists('background')) {
            const bg = this.add.image(width / 2, height / 2, 'background');
            bg.setDisplaySize(width, height);
            bg.setAlpha(0.3);
        }
        this.add.rectangle(width / 2, height / 2, width, height, 0x000011, 0.6);

        // Title
        this.add.text(width / 2, 35, 'CHALLENGE MODE', {
            fontSize: '36px', fontFamily: 'monospace', color: '#ff00ff',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(10);

        this.add.text(width / 2, 65, 'Pick your challenge!', {
            fontSize: '14px', fontFamily: 'monospace', color: '#aaaacc'
        }).setOrigin(0.5).setDepth(10);

        // Challenge cards
        const startY = 100;
        const cardHeight = 85;
        const gap = 8;

        CHALLENGES.forEach((ch, i) => {
            const y = startY + i * (cardHeight + gap);
            this._createChallengeCard(ch, width / 2, y, width - 60, cardHeight);
        });

        // Back button
        const backBtn = this.add.rectangle(width / 2, height - 35, 180, 40, 0x111122);
        backBtn.setStrokeStyle(2, 0xff00ff);
        backBtn.setInteractive({ useHandCursor: true });
        backBtn.setDepth(10);
        this.add.text(width / 2, height - 35, 'BACK TO MENU', {
            fontSize: '16px', fontFamily: 'monospace', color: '#ff00ff'
        }).setOrigin(0.5).setDepth(11);

        backBtn.on('pointerover', () => backBtn.setFillStyle(0x223344));
        backBtn.on('pointerout', () => backBtn.setFillStyle(0x111122));
        backBtn.on('pointerdown', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MenuScene');
            });
        });
    }

    _createChallengeCard(challenge, cx, cy, w, h) {
        const bestScore = StatsTracker.getChallengeScore(challenge.id);
        const starRating = this._getStarRating(challenge, bestScore);

        // Card bg
        const card = this.add.rectangle(cx, cy, w, h, 0x0a0a1a, 0.9);
        card.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(challenge.color).color);
        card.setInteractive({ useHandCursor: true });
        card.setDepth(10);

        // Icon
        this.add.text(cx - w / 2 + 25, cy - 12, challenge.icon, {
            fontSize: '28px'
        }).setOrigin(0.5).setDepth(11);

        // Name
        this.add.text(cx - w / 2 + 60, cy - 22, challenge.name, {
            fontSize: '18px', fontFamily: 'monospace', color: challenge.color,
            fontStyle: 'bold'
        }).setOrigin(0, 0).setDepth(11);

        // Description (truncated single line)
        const descLine = challenge.description.split('\n')[0];
        this.add.text(cx - w / 2 + 60, cy + 2, descLine, {
            fontSize: '11px', fontFamily: 'monospace', color: '#888899'
        }).setOrigin(0, 0).setDepth(11);

        // Best score
        const scoreLabel = challenge.invertScore ? 'Best Time' : 'Best Score';
        const scoreVal = bestScore > 0
            ? (challenge.invertScore ? `${bestScore}s` : bestScore.toLocaleString())
            : '---';
        this.add.text(cx + w / 2 - 15, cy - 20, `${scoreLabel}: ${scoreVal}`, {
            fontSize: '11px', fontFamily: 'monospace', color: '#aaaaaa'
        }).setOrigin(1, 0).setDepth(11);

        // Stars
        const starsStr = starRating >= 3 ? '★★★' : starRating >= 2 ? '★★☆' : starRating >= 1 ? '★☆☆' : '☆☆☆';
        const starsColor = starRating >= 3 ? '#ffd700' : starRating >= 2 ? '#c0c0c0' : starRating >= 1 ? '#cd7f32' : '#444444';
        this.add.text(cx + w / 2 - 15, cy + 5, starsStr, {
            fontSize: '16px', fontFamily: 'monospace', color: starsColor
        }).setOrigin(1, 0).setDepth(11);

        // Click handler
        card.on('pointerover', () => card.setFillStyle(0x1a1a3a));
        card.on('pointerout', () => card.setFillStyle(0x0a0a1a));
        card.on('pointerdown', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('ChallengeScene', { challenge });
            });
        });
    }

    _getStarRating(challenge, score) {
        if (score <= 0) return 0;
        const t = challenge.thresholds;
        if (challenge.invertScore) {
            // Lower is better (time-based)
            if (score <= t.gold) return 3;
            if (score <= t.silver) return 2;
            if (score <= t.bronze) return 1;
        } else {
            if (score >= t.gold) return 3;
            if (score >= t.silver) return 2;
            if (score >= t.bronze) return 1;
        }
        return 0;
    }
}

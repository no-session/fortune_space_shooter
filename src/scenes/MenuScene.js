import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // Create starfield background
        this.createStarfield();
        
        // Title
        const title = this.add.text(width / 2, height / 4, 'FORTUNE', {
            fontSize: '64px',
            fontFamily: 'monospace',
            color: '#00ffff',
            stroke: '#0080ff',
            strokeThickness: 4
        });
        title.setOrigin(0.5);
        
        // Subtitle
        const subtitle = this.add.text(width / 2, height / 4 + 70, 'Space Shooter', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
        subtitle.setOrigin(0.5);
        
        // Start button
        const startButton = this.add.rectangle(width / 2, height / 2 + 50, 200, 50, 0x00ffff);
        startButton.setInteractive({ useHandCursor: true });
        
        const startText = this.add.text(width / 2, height / 2 + 50, 'START GAME', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#000000'
        });
        startText.setOrigin(0.5);
        
        startButton.on('pointerover', () => {
            startButton.setFillStyle(0x00ffff);
            startButton.setScale(1.1);
        });
        
        startButton.on('pointerout', () => {
            startButton.setFillStyle(0x00ffff);
            startButton.setScale(1);
        });
        
        startButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
        
        // Instructions
        const instructions = this.add.text(width / 2, height - 100, 
            'WASD or Arrow Keys: Move\nSPACE: Shoot\nESC: Pause', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#888888',
            align: 'center'
        });
        instructions.setOrigin(0.5);
        
        // Leaderboard button
        const leaderboardButton = this.add.rectangle(width / 2, height / 2 + 120, 200, 50, 0x666666);
        leaderboardButton.setInteractive({ useHandCursor: true });
        
        const leaderboardText = this.add.text(width / 2, height / 2 + 120, 'LEADERBOARD', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
        leaderboardText.setOrigin(0.5);
        
        leaderboardButton.on('pointerover', () => {
            leaderboardButton.setFillStyle(0x888888);
            leaderboardButton.setScale(1.1);
        });
        
        leaderboardButton.on('pointerout', () => {
            leaderboardButton.setFillStyle(0x666666);
            leaderboardButton.setScale(1);
        });
        
        leaderboardButton.on('pointerdown', () => {
            this.showLeaderboard();
        });
    }

    createStarfield() {
        this.starfieldLayers = [];
        
        for (let i = 0; i < 3; i++) {
            const stars = this.add.group();
            const starCount = 50 + i * 20;
            const speed = 20 + i * 10;
            const size = 1 + i;
            
            for (let j = 0; j < starCount; j++) {
                const x = Phaser.Math.Between(0, this.scale.width);
                const y = Phaser.Math.Between(0, this.scale.height);
                const star = this.add.circle(x, y, size, 0xffffff);
                stars.add(star);
            }
            
            this.starfieldLayers.push({ stars, speed });
        }
    }

    update() {
        // Animate starfield
        this.starfieldLayers.forEach(layer => {
            layer.stars.children.entries.forEach(star => {
                star.y += layer.speed * (this.game.loop.delta / 1000);
                
                if (star.y > this.scale.height) {
                    star.y = 0;
                    star.x = Phaser.Math.Between(0, this.scale.width);
                }
            });
        });
    }

    showLeaderboard() {
        const scores = this.getLeaderboard();
        const width = this.scale.width;
        const height = this.scale.height;
        
        // Dark overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
        overlay.setDepth(2000);
        
        // Leaderboard panel
        const panel = this.add.rectangle(width / 2, height / 2, 400, 400, 0x222222);
        panel.setDepth(2001);
        panel.setStrokeStyle(2, 0x00ffff);
        
        // Title
        const title = this.add.text(width / 2, height / 2 - 150, 'LEADERBOARD', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#00ffff'
        });
        title.setOrigin(0.5);
        title.setDepth(2002);
        
        // Scores
        let yOffset = -80;
        scores.forEach((score, index) => {
            const rank = this.add.text(width / 2 - 150, height / 2 + yOffset, `${index + 1}.`, {
                fontSize: '20px',
                fontFamily: 'monospace',
                color: '#ffffff'
            });
            rank.setOrigin(0, 0.5);
            rank.setDepth(2002);
            
            const scoreText = this.add.text(width / 2 + 50, height / 2 + yOffset, score.toString(), {
                fontSize: '20px',
                fontFamily: 'monospace',
                color: '#ffff00'
            });
            scoreText.setOrigin(1, 0.5);
            scoreText.setDepth(2002);
            
            yOffset += 35;
        });
        
        // Close button
        const closeButton = this.add.rectangle(width / 2, height / 2 + 150, 150, 40, 0x00ffff);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.setDepth(2002);
        
        const closeText = this.add.text(width / 2, height / 2 + 150, 'CLOSE', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#000000'
        });
        closeText.setOrigin(0.5);
        closeText.setDepth(2003);
        
        closeButton.on('pointerdown', () => {
            overlay.destroy();
            panel.destroy();
            title.destroy();
            closeButton.destroy();
            closeText.destroy();
            scores.forEach((_, index) => {
                this.children.list.forEach(child => {
                    if (child.text && (child.text.includes(`${index + 1}.`) || child.text === score.toString())) {
                        child.destroy();
                    }
                });
            });
        });
    }

    getLeaderboard() {
        const scores = JSON.parse(localStorage.getItem('fortune_leaderboard') || '[]');
        return scores.sort((a, b) => b - a).slice(0, 10);
    }
}

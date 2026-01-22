import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.score = data.score || 0;
        this.wave = data.wave || 1;
        this.maxCombo = data.maxCombo || 0;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // Dark overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
        
        // Game Over text
        const gameOverText = this.add.text(width / 2, height / 3, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        });
        gameOverText.setOrigin(0.5);
        
        // Stats
        const statsY = height / 2;
        const finalScore = this.add.text(width / 2, statsY, `Final Score: ${this.score}`, {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
        finalScore.setOrigin(0.5);
        
        const waveText = this.add.text(width / 2, statsY + 40, `Wave Reached: ${this.wave}`, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
        waveText.setOrigin(0.5);
        
        const comboText = this.add.text(width / 2, statsY + 70, `Max Combo: ${this.maxCombo}`, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#ffff00'
        });
        comboText.setOrigin(0.5);
        
        // Save score
        this.saveScore(this.score);
        
        // New high score indicator
        const leaderboard = this.getLeaderboard();
        if (leaderboard.length > 0 && this.score >= leaderboard[0]) {
            const newRecord = this.add.text(width / 2, statsY + 110, 'NEW HIGH SCORE!', {
                fontSize: '28px',
                fontFamily: 'monospace',
                color: '#00ff00',
                stroke: '#008000',
                strokeThickness: 2
            });
            newRecord.setOrigin(0.5);
        }
        
        // Buttons
        const menuButton = this.add.rectangle(width / 2, height - 150, 200, 50, 0x00ffff);
        menuButton.setInteractive({ useHandCursor: true });
        
        const menuText = this.add.text(width / 2, height - 150, 'MAIN MENU', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#000000'
        });
        menuText.setOrigin(0.5);
        
        menuButton.on('pointerover', () => {
            menuButton.setFillStyle(0x00dddd);
            menuButton.setScale(1.1);
        });
        
        menuButton.on('pointerout', () => {
            menuButton.setFillStyle(0x00ffff);
            menuButton.setScale(1);
        });
        
        menuButton.on('pointerdown', () => {
            this.scene.stop('GameOverScene');
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        });
        
        // Leaderboard button
        const leaderboardButton = this.add.rectangle(width / 2, height - 80, 200, 50, 0x666666);
        leaderboardButton.setInteractive({ useHandCursor: true });
        
        const leaderboardText = this.add.text(width / 2, height - 80, 'LEADERBOARD', {
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

    saveScore(score) {
        let leaderboard = JSON.parse(localStorage.getItem('fortune_leaderboard') || '[]');
        leaderboard.push(score);
        leaderboard = leaderboard.sort((a, b) => b - a).slice(0, 10);
        localStorage.setItem('fortune_leaderboard', JSON.stringify(leaderboard));
    }

    getLeaderboard() {
        return JSON.parse(localStorage.getItem('fortune_leaderboard') || '[]');
    }

    showLeaderboard() {
        const scores = this.getLeaderboard();
        const width = this.scale.width;
        const height = this.scale.height;
        
        // Dark overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);
        overlay.setDepth(3000);
        
        // Leaderboard panel
        const panel = this.add.rectangle(width / 2, height / 2, 400, 400, 0x222222);
        panel.setDepth(3001);
        panel.setStrokeStyle(2, 0x00ffff);
        
        // Title
        const title = this.add.text(width / 2, height / 2 - 150, 'LEADERBOARD', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#00ffff'
        });
        title.setOrigin(0.5);
        title.setDepth(3002);
        
        // Scores
        let yOffset = -80;
        scores.forEach((score, index) => {
            const rank = this.add.text(width / 2 - 150, height / 2 + yOffset, `${index + 1}.`, {
                fontSize: '20px',
                fontFamily: 'monospace',
                color: '#ffffff'
            });
            rank.setOrigin(0, 0.5);
            rank.setDepth(3002);
            
            const scoreText = this.add.text(width / 2 + 50, height / 2 + yOffset, score.toString(), {
                fontSize: '20px',
                fontFamily: 'monospace',
                color: score === this.score ? '#00ff00' : '#ffff00'
            });
            scoreText.setOrigin(1, 0.5);
            scoreText.setDepth(3002);
            
            yOffset += 35;
        });
        
        // Close button
        const closeButton = this.add.rectangle(width / 2, height / 2 + 150, 150, 40, 0x00ffff);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.setDepth(3002);
        
        const closeText = this.add.text(width / 2, height / 2 + 150, 'CLOSE', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#000000'
        });
        closeText.setOrigin(0.5);
        closeText.setDepth(3003);
        
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
}

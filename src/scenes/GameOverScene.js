import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.score = data.score || 0;
        this.wave = data.wave || 1;
        this.maxCombo = data.maxCombo || 0;
        this.enemiesKilled = data.enemiesKilled || 0;
        this.accuracy = data.accuracy || 0;
        this.powerupsCollected = data.powerupsCollected || 0;
        this.timePlayed = data.timePlayed || 0;
        this.achievementsUnlocked = data.achievementsUnlocked || [];
        this.xpResult = data.xpResult || null;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Track total games played
        let gamesPlayed = parseInt(localStorage.getItem('fortune-games-played') || '0', 10);
        gamesPlayed++;
        localStorage.setItem('fortune-games-played', gamesPlayed.toString());

        // Fade in
        this.cameras.main.fadeIn(300, 0, 0, 0);

        // Dark overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);

        // Game Over text
        const gameOverText = this.add.text(width / 2, 40, 'GAME OVER', {
            fontSize: '42px',
            fontFamily: 'monospace',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        });
        gameOverText.setOrigin(0.5);

        // Pilot name
        const pilotName = localStorage.getItem('fortune-pilot-name') || 'Pilot';
        this.add.text(width / 2, 72, `Commander ${pilotName}  |  Game #${gamesPlayed}`, {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#88ccff'
        }).setOrigin(0.5);

        // Star rating
        let stars, starColor;
        if (this.score >= 15000) {
            stars = '⭐⭐⭐';
            starColor = '#ffd700';
        } else if (this.score >= 5000) {
            stars = '⭐⭐';
            starColor = '#ffaa00';
        } else {
            stars = '⭐';
            starColor = '#aaaaaa';
        }

        // Format time
        const totalSeconds = Math.floor(this.timePlayed / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Stats to show, staggered animation
        const statsStartY = 110;
        const lineHeight = 32;
        const stats = [
            { label: 'Total Score', value: this.score.toLocaleString(), color: '#ffd700', size: '26px' },
            { label: 'Rating', value: stars, color: starColor, size: '22px' },
            { label: 'Waves Survived', value: this.wave.toString(), color: '#00ffff', size: '18px' },
            { label: 'Enemies Killed', value: this.enemiesKilled.toString(), color: '#ff4444', size: '18px' },
            { label: 'Accuracy', value: `${this.accuracy}%`, color: '#88ff88', size: '18px' },
            { label: 'Best Combo', value: `${this.maxCombo}x`, color: '#ffff00', size: '18px' },
            { label: 'Power-ups Collected', value: this.powerupsCollected.toString(), color: '#ff88ff', size: '18px' },
            { label: 'Time Played', value: timeStr, color: '#aaaaaa', size: '18px' },
        ];

        if (this.achievementsUnlocked.length > 0) {
            const achievementStr = this.achievementsUnlocked.map(a => a.icon).join(' ');
            stats.push({ label: 'Achievements', value: achievementStr, color: '#ffd700', size: '18px' });
        }

        // XP info
        if (this.xpResult) {
            stats.push({ label: 'XP Earned', value: `+${this.xpResult.xpGained}`, color: '#ffd700', size: '18px' });
            if (this.xpResult.leveledUp) {
                stats.push({ label: 'LEVEL UP!', value: `Lv.${this.xpResult.newLevel}`, color: '#00ff00', size: '22px' });
            }
        }

        // Animate stats appearing one by one
        stats.forEach((stat, index) => {
            const y = statsStartY + index * lineHeight;
            const delay = index * 200;

            this.time.delayedCall(delay, () => {
                // Label on left
                const labelText = this.add.text(width / 2 - 150, y, stat.label, {
                    fontSize: stat.size,
                    fontFamily: 'monospace',
                    color: '#999999'
                });
                labelText.setOrigin(0, 0.5);
                labelText.setAlpha(0);

                // Value on right
                const valueText = this.add.text(width / 2 + 150, y, stat.value, {
                    fontSize: stat.size,
                    fontFamily: 'monospace',
                    color: stat.color,
                    fontStyle: index === 0 ? 'bold' : 'normal'
                });
                valueText.setOrigin(1, 0.5);
                valueText.setAlpha(0);

                // Fade in
                this.tweens.add({
                    targets: [labelText, valueText],
                    alpha: 1,
                    x: { from: labelText.x - 20, to: labelText.x },
                    duration: 300,
                    ease: 'Power2'
                });
                this.tweens.add({
                    targets: valueText,
                    x: { from: valueText.x + 20, to: valueText.x },
                    alpha: 1,
                    duration: 300,
                    ease: 'Power2'
                });
            });
        });

        // Fun comment based on performance
        let comment;
        if (this.score >= 15000) {
            comment = 'LEGENDARY! You are a true space warrior!';
        } else if (this.score >= 5000) {
            comment = 'Great run, pilot! You are getting better!';
        } else {
            comment = 'Not bad for a warm-up! Try again?';
        }

        const commentY = statsStartY + stats.length * lineHeight + 10;
        const commentDelay = stats.length * 200 + 200;

        this.time.delayedCall(commentDelay, () => {
            const commentText = this.add.text(width / 2, commentY, comment, {
                fontSize: '16px',
                fontFamily: 'monospace',
                color: '#88ccff',
                fontStyle: 'italic',
                align: 'center',
                wordWrap: { width: 350 }
            });
            commentText.setOrigin(0.5, 0);
            commentText.setAlpha(0);

            this.tweens.add({
                targets: commentText,
                alpha: 1,
                duration: 500
            });
        });

        // Save score locally
        this.saveScore(this.score);

        // Submit to online leaderboard
        this.submitOnlineScore();

        // New high score indicator
        const leaderboard = this.getLeaderboard();
        if (leaderboard.length > 0 && this.score >= leaderboard[0]) {
            const newRecordDelay = commentDelay + 300;
            this.time.delayedCall(newRecordDelay, () => {
                const newRecord = this.add.text(width / 2, commentY + 40, 'NEW HIGH SCORE!', {
                    fontSize: '24px',
                    fontFamily: 'monospace',
                    color: '#00ff00',
                    stroke: '#008000',
                    strokeThickness: 2
                });
                newRecord.setOrigin(0.5);
                newRecord.setAlpha(0);

                this.tweens.add({
                    targets: newRecord,
                    alpha: 1,
                    scale: { from: 1.5, to: 1 },
                    duration: 400,
                    ease: 'Back.easeOut'
                });
            });
        }

        // Buttons (appear after stats)
        const buttonsDelay = commentDelay + 500;
        const buttonY = height - 70;

        this.time.delayedCall(buttonsDelay, () => {
            // QUICK RESTART button (most prominent)
            const restartButton = this.add.rectangle(width / 2, buttonY - 55, 260, 50, 0x00ff00);
            restartButton.setInteractive({ useHandCursor: true });

            const restartText = this.add.text(width / 2, buttonY - 55, 'QUICK RESTART [R]', {
                fontSize: '20px',
                fontFamily: 'monospace',
                color: '#000000',
                fontStyle: 'bold'
            });
            restartText.setOrigin(0.5);

            // Pulse the restart button to attract attention
            this.tweens.add({
                targets: restartButton,
                scaleX: { from: 1, to: 1.03 },
                scaleY: { from: 1, to: 1.03 },
                duration: 600,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            this.tweens.add({
                targets: restartText,
                scaleX: { from: 1, to: 1.03 },
                scaleY: { from: 1, to: 1.03 },
                duration: 600,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            restartButton.on('pointerover', () => {
                restartButton.setFillStyle(0x44ff44);
                restartButton.setScale(1.05);
            });
            restartButton.on('pointerout', () => {
                restartButton.setFillStyle(0x00ff00);
                restartButton.setScale(1);
            });
            restartButton.on('pointerdown', () => {
                this.quickRestart();
            });

            // R key for quick restart
            this.input.keyboard.on('keydown-R', () => {
                this.quickRestart();
            });

            // Menu button
            const menuButton = this.add.rectangle(width / 2 - 110, buttonY, 180, 45, 0x00ffff);
            menuButton.setInteractive({ useHandCursor: true });

            const menuText = this.add.text(width / 2 - 110, buttonY, 'MAIN MENU', {
                fontSize: '18px',
                fontFamily: 'monospace',
                color: '#000000'
            });
            menuText.setOrigin(0.5);

            menuButton.on('pointerover', () => {
                menuButton.setFillStyle(0x00dddd);
                menuButton.setScale(1.05);
            });
            menuButton.on('pointerout', () => {
                menuButton.setFillStyle(0x00ffff);
                menuButton.setScale(1);
            });
            menuButton.on('pointerdown', () => {
                this.cameras.main.fadeOut(300, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.stop('GameOverScene');
                    this.scene.stop('GameScene');
                    this.scene.start('MenuScene');
                });
            });

            // Leaderboard button
            const lbButton = this.add.rectangle(width / 2 + 110, buttonY, 180, 45, 0x666666);
            lbButton.setInteractive({ useHandCursor: true });

            const lbText = this.add.text(width / 2 + 110, buttonY, 'LEADERBOARD', {
                fontSize: '18px',
                fontFamily: 'monospace',
                color: '#ffffff'
            });
            lbText.setOrigin(0.5);

            lbButton.on('pointerover', () => {
                lbButton.setFillStyle(0x888888);
                lbButton.setScale(1.05);
            });
            lbButton.on('pointerout', () => {
                lbButton.setFillStyle(0x666666);
                lbButton.setScale(1);
            });
            lbButton.on('pointerdown', () => {
                this.showLeaderboard();
            });
        });
    }

    quickRestart() {
        this.cameras.main.fadeOut(200, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.stop('GameOverScene');
            this.scene.stop('GameScene');
            this.scene.start('GameScene');
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

    submitOnlineScore() {
        const name = localStorage.getItem('fortune-pilot-name') || 'Pilot';
        fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'submit',
                name: name,
                score: this.score,
                wave: this.wave
            })
        }).catch(() => {
            // Silently fail if offline
        });
    }

    showLeaderboard() {
        const scores = this.getLeaderboard();
        const width = this.scale.width;
        const height = this.scale.height;

        const elements = [];

        // Dark overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);
        overlay.setDepth(3000);
        elements.push(overlay);

        // Leaderboard panel
        const panel = this.add.rectangle(width / 2, height / 2, 400, 400, 0x222222);
        panel.setDepth(3001);
        panel.setStrokeStyle(2, 0x00ffff);
        elements.push(panel);

        // Title
        const title = this.add.text(width / 2, height / 2 - 150, 'LEADERBOARD', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#00ffff'
        });
        title.setOrigin(0.5);
        title.setDepth(3002);
        elements.push(title);

        // Scores
        let yOffset = -80;
        scores.forEach((score, index) => {
            const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#ffffff';

            const rank = this.add.text(width / 2 - 150, height / 2 + yOffset, `${index + 1}.`, {
                fontSize: '20px',
                fontFamily: 'monospace',
                color: rankColor
            });
            rank.setOrigin(0, 0.5);
            rank.setDepth(3002);
            elements.push(rank);

            const scoreText = this.add.text(width / 2 + 50, height / 2 + yOffset, score.toLocaleString(), {
                fontSize: '20px',
                fontFamily: 'monospace',
                color: score === this.score ? '#00ff00' : '#ffff00'
            });
            scoreText.setOrigin(1, 0.5);
            scoreText.setDepth(3002);
            elements.push(scoreText);

            yOffset += 35;
        });

        // Close button
        const closeButton = this.add.rectangle(width / 2, height / 2 + 150, 150, 40, 0x00ffff);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.setDepth(3002);
        elements.push(closeButton);

        const closeText = this.add.text(width / 2, height / 2 + 150, 'CLOSE', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#000000'
        });
        closeText.setOrigin(0.5);
        closeText.setDepth(3003);
        elements.push(closeText);

        closeButton.on('pointerdown', () => {
            elements.forEach(el => { if (el && el.destroy) el.destroy(); });
        });
    }
}

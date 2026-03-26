import Phaser from 'phaser';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        const gameScene = this.scene.get('GameScene');

        // Dark overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75).setDepth(0);

        // Decorative lines
        this.add.rectangle(width / 2, 60, 400, 2, 0x00ffff, 0.3).setDepth(1);
        this.add.rectangle(width / 2, height - 60, 400, 2, 0x00ffff, 0.3).setDepth(1);

        // PAUSED title
        const pauseText = this.add.text(width / 2, 90, 'PAUSED', {
            fontSize: '52px',
            fontFamily: 'monospace',
            color: '#00ffff',
            stroke: '#0050aa',
            strokeThickness: 5
        });
        pauseText.setOrigin(0.5);

        // Pulsing animation on title
        this.tweens.add({
            targets: pauseText,
            alpha: { from: 1, to: 0.6 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // --- Current stats ---
        let statsY = 150;
        const statsStyle = { fontSize: '18px', fontFamily: 'monospace', color: '#cccccc' };

        if (gameScene) {
            const score = gameScene.scoreManager ? gameScene.scoreManager.getScore() : 0;
            const wave = gameScene.waveManager ? gameScene.waveManager.getCurrentWave() : 1;
            const lives = gameScene.player ? gameScene.player.lives : 0;
            const health = gameScene.player ? gameScene.player.health : 0;
            const maxHealth = gameScene.player ? gameScene.player.maxHealth : 100;

            this.add.text(width / 2, statsY, `Score: ${score}`, statsStyle).setOrigin(0.5);
            statsY += 28;
            this.add.text(width / 2, statsY, `Wave: ${wave}`, statsStyle).setOrigin(0.5);
            statsY += 28;
            this.add.text(width / 2, statsY, `Lives: ${lives}  |  HP: ${health}/${maxHealth}`, statsStyle).setOrigin(0.5);
            statsY += 28;

            // Show active power-ups
            if (gameScene.activePowerUpTimers && gameScene.activePowerUpTimers.length > 0) {
                const powerUpNames = gameScene.activePowerUpTimers.map(t => t.label).join(', ');
                this.add.text(width / 2, statsY, `Active: ${powerUpNames}`, {
                    fontSize: '16px', fontFamily: 'monospace', color: '#ffdd00'
                }).setOrigin(0.5);
                statsY += 28;
            }
        }

        // --- Buttons ---
        const buttonStartY = statsY + 30;

        // RESUME
        this.createButton(width / 2, buttonStartY, 'RESUME', 0x00ffff, () => {
            this.startCountdown();
        });

        // RESTART
        this.createButton(width / 2, buttonStartY + 70, 'RESTART', 0xffaa00, () => {
            this.scene.stop('PauseScene');
            this.scene.stop('GameScene');
            this.scene.start('GameScene');
        });

        // QUIT TO MENU
        this.createButton(width / 2, buttonStartY + 140, 'QUIT TO MENU', 0x666688, () => {
            this.scene.stop('PauseScene');
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        });

        // ESC key to resume
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey.on('down', () => {
            this.startCountdown();
        });
    }

    createButton(x, y, label, color, callback) {
        const btn = this.add.rectangle(x, y, 240, 50, 0x222222);
        btn.setStrokeStyle(2, color);
        btn.setInteractive({ useHandCursor: true });

        const txt = this.add.text(x, y, label, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: `#${color.toString(16).padStart(6, '0')}`
        });
        txt.setOrigin(0.5);

        btn.on('pointerover', () => {
            btn.setFillStyle(0x333344);
            btn.setScale(1.05);
            txt.setScale(1.05);
        });
        btn.on('pointerout', () => {
            btn.setFillStyle(0x222222);
            btn.setScale(1);
            txt.setScale(1);
        });
        btn.on('pointerdown', callback);
    }

    startCountdown() {
        // Disable further input
        this.input.enabled = false;

        // Remove all existing UI
        this.children.removeAll(true);

        const width = this.scale.width;
        const height = this.scale.height;

        // Dark overlay stays
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

        const countdownText = this.add.text(width / 2, height / 2, '3', {
            fontSize: '72px',
            fontFamily: 'monospace',
            color: '#00ffff',
            stroke: '#003366',
            strokeThickness: 6
        });
        countdownText.setOrigin(0.5);

        let count = 3;
        const tick = () => {
            if (count <= 0) {
                this.scene.stop('PauseScene');
                this.scene.resume('GameScene');
                return;
            }
            countdownText.setText(count.toString());
            countdownText.setScale(1.5);
            this.tweens.add({
                targets: countdownText,
                scale: 1,
                alpha: { from: 1, to: 0.4 },
                duration: 800,
                ease: 'Power2',
                onComplete: () => {
                    count--;
                    tick();
                }
            });
        };
        tick();
    }
}

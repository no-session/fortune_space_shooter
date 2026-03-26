import Phaser from 'phaser';
import HUDConfig from '../ui/HUDConfig.js';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        const gameScene = this.scene.get('GameScene');

        // Track which submenu is showing
        this.showingHUDSettings = false;

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
        const buttonStartY = statsY + 20;
        const buttonSpacing = 55;

        // RESUME
        this.createButton(width / 2, buttonStartY, 'RESUME', 0x00ffff, () => {
            this.startCountdown();
        });

        // RESTART
        this.createButton(width / 2, buttonStartY + buttonSpacing, 'RESTART', 0xffaa00, () => {
            this.scene.stop('PauseScene');
            this.scene.stop('GameScene');
            this.scene.start('GameScene');
        });

        // QUIT TO MENU
        this.createButton(width / 2, buttonStartY + buttonSpacing * 2, 'QUIT TO MENU', 0x666688, () => {
            this.scene.stop('PauseScene');
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        });

        // Sound toggle
        const soundLevel = localStorage.getItem('fortune-sound-level') || 'HIGH';
        const soundLabels = { HIGH: 'SOUND: ON', LOW: 'SOUND: LOW', OFF: 'SOUND: OFF' };
        this.soundBtnLabel = soundLabels[soundLevel] || 'SOUND: ON';
        this.createButton(width / 2, buttonStartY + buttonSpacing * 3, this.soundBtnLabel, 0x44aa44, () => {
            const gs = this.scene.get('GameScene');
            if (gs && gs.soundManager) {
                gs.soundManager.cycleSoundLevel();
                this.scene.restart();
            }
        });

        // HUD SETTINGS button
        this.createButton(width / 2, buttonStartY + buttonSpacing * 4, 'HUD SETTINGS', 0x8888ff, () => {
            this.showHUDSettingsOverlay();
        });

        // COLOR BLIND MODE toggle
        const cbMode = localStorage.getItem('fortune-color-blind') === 'true';
        const cbLabel = cbMode ? 'COLOR BLIND: ON' : 'COLOR BLIND: OFF';
        this.createButton(width / 2, buttonStartY + buttonSpacing * 5, cbLabel, 0xff88ff, () => {
            const gs = this.scene.get('GameScene');
            if (gs) {
                gs.toggleColorBlindMode();
                this.scene.restart();
            }
        });

        // ESC key to resume
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey.on('down', () => {
            if (!this.showingHUDSettings) {
                this.startCountdown();
            }
        });
    }

    showHUDSettingsOverlay() {
        this.showingHUDSettings = true;
        const width = this.scale.width;
        const height = this.scale.height;
        const elements = [];

        const hudConfig = new HUDConfig();
        const items = hudConfig.getAll();

        // Overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);
        overlay.setDepth(2000);
        elements.push(overlay);

        // Title
        const title = this.add.text(width / 2, 80, 'HUD SETTINGS', {
            fontSize: '32px', fontFamily: 'monospace', color: '#8888ff',
            stroke: '#000000', strokeThickness: 4
        });
        title.setOrigin(0.5);
        title.setDepth(2001);
        elements.push(title);

        const subtitle = this.add.text(width / 2, 115, 'Toggle HUD elements on/off', {
            fontSize: '13px', fontFamily: 'monospace', color: '#888888'
        });
        subtitle.setOrigin(0.5);
        subtitle.setDepth(2001);
        elements.push(subtitle);

        // Toggle buttons for each HUD element
        const startY = 155;
        const lineH = 40;
        const toggleTexts = [];

        items.forEach((item, index) => {
            const y = startY + index * lineH;
            const isOn = item.visible;

            // Label
            const label = this.add.text(width / 2 - 100, y, item.label, {
                fontSize: '16px', fontFamily: 'monospace', color: '#cccccc'
            });
            label.setOrigin(0, 0.5);
            label.setDepth(2001);
            elements.push(label);

            // Toggle button
            const toggleBg = this.add.rectangle(width / 2 + 100, y, 70, 28,
                isOn ? 0x00aa00 : 0x663333);
            toggleBg.setStrokeStyle(1, isOn ? 0x00ff00 : 0xff4444);
            toggleBg.setDepth(2001);
            toggleBg.setInteractive({ useHandCursor: true });
            elements.push(toggleBg);

            const toggleLabel = this.add.text(width / 2 + 100, y, isOn ? 'ON' : 'OFF', {
                fontSize: '14px', fontFamily: 'monospace',
                color: isOn ? '#00ff00' : '#ff4444', fontStyle: 'bold'
            });
            toggleLabel.setOrigin(0.5);
            toggleLabel.setDepth(2002);
            elements.push(toggleLabel);
            toggleTexts.push({ bg: toggleBg, label: toggleLabel, key: item.key });

            toggleBg.on('pointerdown', () => {
                const nowVisible = hudConfig.toggle(item.key);
                toggleLabel.setText(nowVisible ? 'ON' : 'OFF');
                toggleLabel.setColor(nowVisible ? '#00ff00' : '#ff4444');
                toggleBg.setFillStyle(nowVisible ? 0x00aa00 : 0x663333);
                toggleBg.setStrokeStyle(1, nowVisible ? 0x00ff00 : 0xff4444);

                // Apply immediately to GameScene
                const gs = this.scene.get('GameScene');
                if (gs) {
                    gs.hudConfig = hudConfig;
                    gs.applyHUDVisibility();
                }
            });

            toggleBg.on('pointerover', () => toggleBg.setScale(1.05));
            toggleBg.on('pointerout', () => toggleBg.setScale(1));
        });

        // CLOSE button
        const closeY = startY + items.length * lineH + 20;
        const closeBtn = this.add.rectangle(width / 2, closeY, 150, 40, 0x00ffff);
        closeBtn.setDepth(2001);
        closeBtn.setInteractive({ useHandCursor: true });
        elements.push(closeBtn);

        const closeText = this.add.text(width / 2, closeY, 'CLOSE', {
            fontSize: '18px', fontFamily: 'monospace', color: '#000000'
        });
        closeText.setOrigin(0.5);
        closeText.setDepth(2002);
        elements.push(closeText);

        closeBtn.on('pointerdown', () => {
            elements.forEach(el => { if (el && el.destroy) el.destroy(); });
            this.showingHUDSettings = false;
        });
        closeBtn.on('pointerover', () => closeBtn.setFillStyle(0x00dddd));
        closeBtn.on('pointerout', () => closeBtn.setFillStyle(0x00ffff));
    }

    createButton(x, y, label, color, callback) {
        const btn = this.add.rectangle(x, y, 240, 42, 0x222222);
        btn.setStrokeStyle(2, color);
        btn.setInteractive({ useHandCursor: true });

        const txt = this.add.text(x, y, label, {
            fontSize: '18px',
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

        return { btn, txt };
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

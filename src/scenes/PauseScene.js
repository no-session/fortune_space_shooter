import Phaser from 'phaser';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // Dark overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        
        // Pause text
        const pauseText = this.add.text(width / 2, height / 2 - 50, 'PAUSED', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#00ffff',
            stroke: '#0080ff',
            strokeThickness: 4
        });
        pauseText.setOrigin(0.5);
        
        // Resume button
        const resumeButton = this.add.rectangle(width / 2, height / 2 + 50, 200, 50, 0x00ffff);
        resumeButton.setInteractive({ useHandCursor: true });
        
        const resumeText = this.add.text(width / 2, height / 2 + 50, 'RESUME', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#000000'
        });
        resumeText.setOrigin(0.5);
        
        resumeButton.on('pointerover', () => {
            resumeButton.setFillStyle(0x00dddd);
            resumeButton.setScale(1.1);
        });
        
        resumeButton.on('pointerout', () => {
            resumeButton.setFillStyle(0x00ffff);
            resumeButton.setScale(1);
        });
        
        resumeButton.on('pointerdown', () => {
            this.scene.stop('PauseScene');
            this.scene.resume('GameScene');
        });
        
        // Menu button
        const menuButton = this.add.rectangle(width / 2, height / 2 + 120, 200, 50, 0x666666);
        menuButton.setInteractive({ useHandCursor: true });
        
        const menuText = this.add.text(width / 2, height / 2 + 120, 'MAIN MENU', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
        menuText.setOrigin(0.5);
        
        menuButton.on('pointerover', () => {
            menuButton.setFillStyle(0x888888);
            menuButton.setScale(1.1);
        });
        
        menuButton.on('pointerout', () => {
            menuButton.setFillStyle(0x666666);
            menuButton.setScale(1);
        });
        
        menuButton.on('pointerdown', () => {
            this.scene.stop('PauseScene');
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        });
        
        // ESC key to resume
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey.on('down', () => {
            this.scene.stop('PauseScene');
            this.scene.resume('GameScene');
        });
    }
}

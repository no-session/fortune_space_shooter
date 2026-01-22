import Phaser from 'phaser';

export default class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }

    init(data) {
        this.score = data.score || 0;
        this.wave = data.wave || 1;
        this.currency = Math.floor(this.score / 100); // Convert score to currency
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x000033);
        
        // Title
        const title = this.add.text(width / 2, 50, 'UPGRADE SHOP', {
            fontSize: '36px',
            fontFamily: 'monospace',
            color: '#00ffff'
        });
        title.setOrigin(0.5);
        
        // Currency display
        const currencyText = this.add.text(width / 2, 100, `Currency: ${this.currency}`, {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ffff00'
        });
        currencyText.setOrigin(0.5);
        
        // Upgrade options
        const upgrades = [
            { name: 'Weapon Upgrade', cost: 50, description: 'Increase fire rate and spread' },
            { name: 'Speed Upgrade', cost: 30, description: 'Increase movement speed' },
            { name: 'Health Boost', cost: 40, description: 'Restore full health' },
            { name: 'Extra Life', cost: 100, description: 'Gain an extra life' }
        ];
        
        this.upgradeButtons = [];
        let yPos = 180;
        
        upgrades.forEach((upgrade, index) => {
            const button = this.add.rectangle(width / 2, yPos, 500, 60, 0x333333);
            button.setInteractive({ useHandCursor: true });
            button.setStrokeStyle(2, 0x00ffff);
            
            const nameText = this.add.text(width / 2 - 200, yPos, upgrade.name, {
                fontSize: '20px',
                fontFamily: 'monospace',
                color: '#ffffff'
            });
            nameText.setOrigin(0, 0.5);
            
            const costText = this.add.text(width / 2 + 200, yPos, `${upgrade.cost}`, {
                fontSize: '20px',
                fontFamily: 'monospace',
                color: this.currency >= upgrade.cost ? '#00ff00' : '#ff0000'
            });
            costText.setOrigin(1, 0.5);
            
            const descText = this.add.text(width / 2, yPos + 25, upgrade.description, {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#888888'
            });
            descText.setOrigin(0.5);
            
            button.on('pointerover', () => {
                if (this.currency >= upgrade.cost) {
                    button.setFillStyle(0x444444);
                }
            });
            
            button.on('pointerout', () => {
                button.setFillStyle(0x333333);
            });
            
            button.on('pointerdown', () => {
                if (this.currency >= upgrade.cost) {
                    this.purchaseUpgrade(upgrade, index);
                    this.currency -= upgrade.cost;
                    currencyText.setText(`Currency: ${this.currency}`);
                    costText.setColor(this.currency >= upgrade.cost ? '#00ff00' : '#ff0000');
                }
            });
            
            this.upgradeButtons.push({ button, nameText, costText, descText, upgrade });
            yPos += 100;
        });
        
        // Continue button
        const continueButton = this.add.rectangle(width / 2, height - 80, 200, 50, 0x00ffff);
        continueButton.setInteractive({ useHandCursor: true });
        
        const continueText = this.add.text(width / 2, height - 80, 'CONTINUE', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#000000'
        });
        continueText.setOrigin(0.5);
        
        continueButton.on('pointerover', () => {
            continueButton.setFillStyle(0x00dddd);
            continueButton.setScale(1.1);
        });
        
        continueButton.on('pointerout', () => {
            continueButton.setFillStyle(0x00ffff);
            continueButton.setScale(1);
        });
        
        continueButton.on('pointerdown', () => {
            this.scene.stop('ShopScene');
            this.scene.resume('GameScene');
        });
        
        // Store upgrades for game scene
        this.purchasedUpgrades = [];
    }

    purchaseUpgrade(upgrade, index) {
        this.purchasedUpgrades.push(upgrade.name);
        
        // Apply upgrade to game scene
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.player) {
            if (upgrade.name === 'Weapon Upgrade') {
                gameScene.player.upgradeWeapon();
            } else if (upgrade.name === 'Speed Upgrade') {
                gameScene.player.upgradeSpeed();
            } else if (upgrade.name === 'Health Boost') {
                gameScene.player.heal(100);
            } else if (upgrade.name === 'Extra Life') {
                gameScene.player.lives++;
            }
        }
        
        // Visual feedback
        const button = this.upgradeButtons[index].button;
        button.setFillStyle(0x00ff00);
        this.time.delayedCall(200, () => {
            button.setFillStyle(0x333333);
        });
    }
}

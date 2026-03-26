import Phaser from 'phaser';
import { DRONE_CONFIG } from '../utils/constants.js';

const UPGRADE_ICONS = {
    'Weapon Upgrade': { emoji: 'W', color: 0xff4444 },
    'Speed Upgrade':  { emoji: 'S', color: 0x44ff44 },
    'Health Boost':   { emoji: '+', color: 0x44ddff },
    'Extra Life':     { emoji: 'L', color: 0xffdd00 },
    'Lucky Spin':     { emoji: '?', color: 0xff88ff },
    'Companion Drone': { emoji: 'D', color: 0x44aaff }
};

const SPIN_RESULTS = [
    { label: '2x Currency Back!', apply: 'currency' },
    { label: 'Free Power-Up!', apply: 'powerup' },
    { label: '+1 Weapon Level!', apply: 'weapon' },
    { label: 'Nothing... dud!', apply: 'dud' }
];

export default class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }

    init(data) {
        this.score = data.score || 0;
        this.wave = data.wave || 1;
        this.currency = Math.floor(this.score / 100);
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        const gameScene = this.scene.get('GameScene');

        // Background with gradient feel
        this.add.rectangle(width / 2, height / 2, width, height, 0x050520);

        // Decorative starfield
        for (let i = 0; i < 40; i++) {
            const sx = Phaser.Math.Between(0, width);
            const sy = Phaser.Math.Between(0, height);
            const star = this.add.circle(sx, sy, Phaser.Math.Between(1, 2), 0xffffff, Math.random() * 0.4 + 0.1);
            star.setDepth(0);
        }

        // Top decorative line
        this.add.rectangle(width / 2, 20, 500, 2, 0x00ffff, 0.3);

        // Title with glow
        const titleGlow = this.add.text(width / 2, 50, 'UPGRADE SHOP', {
            fontSize: '36px', fontFamily: 'monospace', color: '#003344'
        }).setOrigin(0.5).setAlpha(0.5);
        const title = this.add.text(width / 2, 50, 'UPGRADE SHOP', {
            fontSize: '36px', fontFamily: 'monospace', color: '#00ffff',
            stroke: '#0060aa', strokeThickness: 3
        }).setOrigin(0.5);
        this.tweens.add({
            targets: [title, titleGlow], alpha: { from: 1, to: 0.7 },
            duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // Currency display
        this.currencyText = this.add.text(width / 2, 90, `Currency: ${this.currency}`, {
            fontSize: '22px', fontFamily: 'monospace', color: '#ffd700'
        }).setOrigin(0.5);

        // Current stats display
        let statsLine = '';
        if (gameScene && gameScene.player) {
            const p = gameScene.player;
            statsLine = `Weapon Lv${p.weaponLevel}  |  Speed ${p.speed}  |  HP ${p.health}/${p.maxHealth}  |  Lives ${p.lives}`;
        }
        this.statsText = this.add.text(width / 2, 115, statsLine, {
            fontSize: '13px', fontFamily: 'monospace', color: '#888888'
        }).setOrigin(0.5);

        // Upgrades
        const upgrades = [
            { name: 'Weapon Upgrade', cost: 50, description: 'Better weapons, more bullets', maxCheck: () => gameScene?.player?.weaponLevel >= 4 },
            { name: 'Speed Upgrade',  cost: 30, description: 'Move faster around the screen', maxCheck: () => gameScene?.player?.speed >= 500 },
            { name: 'Health Boost',   cost: 40, description: 'Restore all your health', maxCheck: () => false },
            { name: 'Extra Life',     cost: 100, description: 'One more chance to survive', maxCheck: () => false },
            { name: 'Lucky Spin',     cost: 25, description: 'Spin for a mystery reward!', maxCheck: () => false },
            { name: 'Companion Drone', cost: DRONE_CONFIG.shopCost, description: 'Auto-firing buddy that orbits you!', maxCheck: () => !!localStorage.getItem('fortune-drone-unlocked') || (gameScene && gameScene.drone) }
        ];

        this.upgradeButtons = [];
        let yPos = 155;

        upgrades.forEach((upgrade, index) => {
            const isMaxed = upgrade.maxCheck();
            const iconData = UPGRADE_ICONS[upgrade.name];

            // Icon circle
            const icon = this.add.circle(width / 2 - 220, yPos + 10, 16, iconData.color, 0.3);
            icon.setStrokeStyle(2, iconData.color, 0.8);
            const iconText = this.add.text(width / 2 - 220, yPos + 10, iconData.emoji, {
                fontSize: '16px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5);

            // Button background
            const btn = this.add.rectangle(width / 2, yPos + 10, 500, 55, isMaxed ? 0x222222 : 0x1a1a3a);
            btn.setStrokeStyle(2, isMaxed ? 0x444444 : 0x00ffff, isMaxed ? 0.3 : 0.6);

            // Name
            const nameText = this.add.text(width / 2 - 190, yPos + 2, upgrade.name, {
                fontSize: '18px', fontFamily: 'monospace',
                color: isMaxed ? '#555555' : '#ffffff'
            }).setOrigin(0, 0.5);

            // Description
            const descText = this.add.text(width / 2 - 190, yPos + 22, upgrade.description, {
                fontSize: '12px', fontFamily: 'monospace',
                color: isMaxed ? '#333333' : '#888888'
            }).setOrigin(0, 0.5);

            // Cost or SOLD OUT
            let costText;
            if (isMaxed) {
                costText = this.add.text(width / 2 + 210, yPos + 10, 'SOLD OUT', {
                    fontSize: '16px', fontFamily: 'monospace', color: '#ff4444', fontStyle: 'bold'
                }).setOrigin(1, 0.5);
            } else {
                costText = this.add.text(width / 2 + 210, yPos + 10, `${upgrade.cost}`, {
                    fontSize: '18px', fontFamily: 'monospace',
                    color: this.currency >= upgrade.cost ? '#00ff00' : '#ff4444'
                }).setOrigin(1, 0.5);
            }

            if (!isMaxed) {
                btn.setInteractive({ useHandCursor: true });

                btn.on('pointerover', () => {
                    if (this.currency >= upgrade.cost) {
                        btn.setFillStyle(0x2a2a5a);
                        btn.setScale(1.02);
                        icon.setFillStyle(iconData.color, 0.6);
                    }
                });
                btn.on('pointerout', () => {
                    btn.setFillStyle(0x1a1a3a);
                    btn.setScale(1);
                    icon.setFillStyle(iconData.color, 0.3);
                });
                btn.on('pointerdown', () => {
                    if (this.currency >= upgrade.cost) {
                        this.currency -= upgrade.cost;
                        this.currencyText.setText(`Currency: ${this.currency}`);

                        if (upgrade.name === 'Lucky Spin') {
                            this.startLuckySpin(width, yPos + 10);
                        } else {
                            this.purchaseUpgrade(upgrade.name);
                        }

                        // Update cost color
                        costText.setColor(this.currency >= upgrade.cost ? '#00ff00' : '#ff4444');

                        // Flash feedback
                        btn.setFillStyle(0x00aa44);
                        this.time.delayedCall(200, () => btn.setFillStyle(0x1a1a3a));

                        // Update stats
                        this.updateStatsText();
                    }
                });
            }

            this.upgradeButtons.push({ btn, nameText, costText, descText, upgrade });
            yPos += 70;
        });

        // Bottom decorative line
        this.add.rectangle(width / 2, height - 110, 500, 2, 0x00ffff, 0.3);

        // Continue button
        const contBtn = this.add.rectangle(width / 2, height - 70, 220, 50, 0x00ffff);
        contBtn.setInteractive({ useHandCursor: true });
        const contText = this.add.text(width / 2, height - 70, 'CONTINUE', {
            fontSize: '22px', fontFamily: 'monospace', color: '#000000', fontStyle: 'bold'
        }).setOrigin(0.5);

        contBtn.on('pointerover', () => { contBtn.setFillStyle(0x00dddd); contBtn.setScale(1.08); contText.setScale(1.08); });
        contBtn.on('pointerout', () => { contBtn.setFillStyle(0x00ffff); contBtn.setScale(1); contText.setScale(1); });
        contBtn.on('pointerdown', () => {
            this.scene.stop('ShopScene');
            this.scene.resume('GameScene');
        });

        this.purchasedUpgrades = [];
    }

    updateStatsText() {
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.player) {
            const p = gameScene.player;
            this.statsText.setText(
                `Weapon Lv${p.weaponLevel}  |  Speed ${p.speed}  |  HP ${p.health}/${p.maxHealth}  |  Lives ${p.lives}`
            );
        }
    }

    purchaseUpgrade(name) {
        this.purchasedUpgrades.push(name);
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.player) {
            if (name === 'Weapon Upgrade') {
                gameScene.player.upgradeWeapon();
            } else if (name === 'Speed Upgrade') {
                gameScene.player.upgradeSpeed();
            } else if (name === 'Health Boost') {
                gameScene.player.heal(100);
            } else if (name === 'Extra Life') {
                gameScene.player.lives++;
            } else if (name === 'Companion Drone') {
                gameScene.droneUnlocked = true;
                localStorage.setItem('fortune-drone-unlocked', '1');
            }
        }
    }

    startLuckySpin(centerX, centerY) {
        const width = this.scale.width;

        // Overlay for spin
        const overlay = this.add.rectangle(width / 2, this.scale.height / 2, width, this.scale.height, 0x000000, 0.5);
        overlay.setDepth(500);

        const spinText = this.add.text(width / 2, this.scale.height / 2 - 20, 'SPINNING...', {
            fontSize: '28px', fontFamily: 'monospace', color: '#ff88ff',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(501);

        const resultText = this.add.text(width / 2, this.scale.height / 2 + 20, '', {
            fontSize: '22px', fontFamily: 'monospace', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(501);

        // Cycle through results visually
        let cycleIndex = 0;
        let speed = 60;
        const finalResult = SPIN_RESULTS[Phaser.Math.Between(0, SPIN_RESULTS.length - 1)];

        const cycle = this.time.addEvent({
            delay: speed,
            callback: () => {
                resultText.setText(SPIN_RESULTS[cycleIndex % SPIN_RESULTS.length].label);
                cycleIndex++;
            },
            loop: true
        });

        // Slow down and stop after ~2 seconds
        this.time.delayedCall(1500, () => {
            cycle.destroy();

            // Final few slow reveals
            let slowIndex = 0;
            const slowCycle = this.time.addEvent({
                delay: 200,
                callback: () => {
                    resultText.setText(SPIN_RESULTS[(cycleIndex + slowIndex) % SPIN_RESULTS.length].label);
                    slowIndex++;
                },
                repeat: 4
            });

            this.time.delayedCall(1200, () => {
                // Show final result
                spinText.setText('YOU GOT:');
                spinText.setColor('#00ffff');
                resultText.setText(finalResult.label);
                resultText.setColor(finalResult.apply === 'dud' ? '#ff4444' : '#00ff00');
                resultText.setFontSize(26);

                // Apply result
                this.applySpinResult(finalResult);

                // Dismiss after 2 seconds
                this.time.delayedCall(2000, () => {
                    overlay.destroy();
                    spinText.destroy();
                    resultText.destroy();
                    this.updateStatsText();
                });
            });
        });
    }

    applySpinResult(result) {
        const gameScene = this.scene.get('GameScene');
        switch (result.apply) {
            case 'currency':
                this.currency += 50;
                this.currencyText.setText(`Currency: ${this.currency}`);
                break;
            case 'powerup':
                // Give a random power-up at next wave start
                if (gameScene) gameScene._spinPowerUpPending = true;
                break;
            case 'weapon':
                if (gameScene && gameScene.player) gameScene.player.upgradeWeapon();
                break;
            case 'dud':
                // Nothing happens
                break;
        }
    }
}

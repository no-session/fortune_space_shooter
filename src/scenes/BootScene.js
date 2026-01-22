import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Create loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        const percentText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: '0%',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);

        const assetText = this.make.text({
            x: width / 2,
            y: height / 2 + 50,
            text: '',
            style: {
                font: '16px monospace',
                fill: '#ffffff'
            }
        });
        assetText.setOrigin(0.5, 0.5);

        // Update progress bar
        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0x00ffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('fileprogress', (file) => {
            assetText.setText('Loading: ' + file.key);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();
        });

        // Load placeholder assets (will be replaced with actual assets)
        this.loadPlaceholderAssets();
    }

    loadPlaceholderAssets() {
        // Assets will be created as graphics in create()
        // This is just a placeholder to trigger the loading bar
        this.load.once('complete', () => {
            // Loading complete
        });
    }

    create() {
        // Create actual placeholder graphics
        this.createPlaceholderGraphics();
        
        // Start menu scene
        this.scene.start('MenuScene');
    }

    createPlaceholderGraphics() {
        // Player ship (triangle)
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0x00ffff);
        playerGraphics.fillTriangle(10, 0, 0, 20, 20, 20);
        playerGraphics.generateTexture('player', 20, 20);
        playerGraphics.destroy();

        // Enemy scout (small red square)
        const scoutGraphics = this.add.graphics();
        scoutGraphics.fillStyle(0xff0000);
        scoutGraphics.fillRect(0, 0, 16, 16);
        scoutGraphics.generateTexture('enemy-scout', 16, 16);
        scoutGraphics.destroy();

        // Enemy fighter (medium red square)
        const fighterGraphics = this.add.graphics();
        fighterGraphics.fillStyle(0xff6600);
        fighterGraphics.fillRect(0, 0, 20, 20);
        fighterGraphics.generateTexture('enemy-fighter', 20, 20);
        fighterGraphics.destroy();

        // Enemy bomber (large red square)
        const bomberGraphics = this.add.graphics();
        bomberGraphics.fillStyle(0xcc0000);
        bomberGraphics.fillRect(0, 0, 24, 24);
        bomberGraphics.generateTexture('enemy-bomber', 24, 24);
        bomberGraphics.destroy();

        // Enemy elite (purple square)
        const eliteGraphics = this.add.graphics();
        eliteGraphics.fillStyle(0xff00ff);
        eliteGraphics.fillRect(0, 0, 22, 22);
        eliteGraphics.generateTexture('enemy-elite', 22, 22);
        eliteGraphics.destroy();

        // Player bullet (yellow circle)
        const bulletPlayerGraphics = this.add.graphics();
        bulletPlayerGraphics.fillStyle(0xffff00);
        bulletPlayerGraphics.fillCircle(4, 4, 4);
        bulletPlayerGraphics.generateTexture('bullet-player', 8, 8);
        bulletPlayerGraphics.destroy();

        // Enemy bullet (red circle)
        const bulletEnemyGraphics = this.add.graphics();
        bulletEnemyGraphics.fillStyle(0xff0000);
        bulletEnemyGraphics.fillCircle(4, 4, 4);
        bulletEnemyGraphics.generateTexture('bullet-enemy', 8, 8);
        bulletEnemyGraphics.destroy();

        // Collectible coin (gold circle)
        const coinGraphics = this.add.graphics();
        coinGraphics.fillStyle(0xffd700);
        coinGraphics.fillCircle(8, 8, 8);
        coinGraphics.generateTexture('collectible-coin', 16, 16);
        coinGraphics.destroy();

        // Collectible crystal (blue diamond)
        const crystalGraphics = this.add.graphics();
        crystalGraphics.fillStyle(0x0080ff);
        crystalGraphics.fillTriangle(8, 0, 16, 12, 0, 12);
        crystalGraphics.fillTriangle(8, 16, 16, 4, 0, 4);
        crystalGraphics.generateTexture('collectible-crystal', 16, 16);
        crystalGraphics.destroy();

        // Collectible star (yellow star - using circle as fallback)
        const starGraphics = this.add.graphics();
        starGraphics.fillStyle(0xffff00);
        starGraphics.fillCircle(8, 8, 8);
        starGraphics.fillStyle(0xffaa00);
        starGraphics.fillCircle(8, 8, 5);
        starGraphics.generateTexture('collectible-star', 16, 16);
        starGraphics.destroy();

        // Collectible fortune coin (gold with glow)
        const fortuneGraphics = this.add.graphics();
        fortuneGraphics.fillStyle(0xffd700);
        fortuneGraphics.fillCircle(10, 10, 10);
        fortuneGraphics.fillStyle(0xffff00);
        fortuneGraphics.fillCircle(10, 10, 6);
        fortuneGraphics.generateTexture('collectible-fortune', 20, 20);
        fortuneGraphics.destroy();

        // Boss mothership (large rectangle)
        const bossGraphics = this.add.graphics();
        bossGraphics.fillStyle(0x8b0000);
        bossGraphics.fillRect(0, 0, 200, 100);
        bossGraphics.fillStyle(0xff0000);
        bossGraphics.fillRect(10, 10, 180, 80);
        bossGraphics.generateTexture('boss-mothership', 200, 100);
        bossGraphics.destroy();

        // Explosion (orange circle)
        const explosionGraphics = this.add.graphics();
        explosionGraphics.fillStyle(0xff6600);
        explosionGraphics.fillCircle(8, 8, 8);
        explosionGraphics.generateTexture('explosion', 16, 16);
        explosionGraphics.destroy();
    }
}

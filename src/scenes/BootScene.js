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

        // Log loading errors
        this.load.on('loaderror', (file) => {
            console.error('Failed to load asset:', file.key, file.src);
        });

        // Load all SpaceRage assets
        this.loadSpaceRageAssets();

        // Load audio assets
        this.loadAudioAssets();
    }

    loadAudioAssets() {
        const audioPath = 'assets/audio';

        this.load.audio('shoot', `${audioPath}/shoot.ogg`);
        this.load.audio('enemyShoot', `${audioPath}/enemy_shoot.ogg`);
        this.load.audio('explosion', `${audioPath}/explosion.ogg`);
        this.load.audio('explosionBig', `${audioPath}/explosion_big.ogg`);
        this.load.audio('hit', `${audioPath}/hit.ogg`);
        this.load.audio('collect', `${audioPath}/collect.ogg`);
        this.load.audio('powerup', `${audioPath}/powerup.ogg`);
    }

    loadSpaceRageAssets() {
        const basePath = 'assets/sprites/SpaceRage';
        
        // Background
        this.load.image('background', `${basePath}/BG.png`);
        
        // Player ship frames (blue variant)
        this.load.image('player_l2', `${basePath}/Player/player_b_l2.png`);
        this.load.image('player_l1', `${basePath}/Player/player_b_l1.png`);
        this.load.image('player_m', `${basePath}/Player/player_b_m.png`);
        this.load.image('player_r1', `${basePath}/Player/player_b_r1.png`);
        this.load.image('player_r2', `${basePath}/Player/player_b_r2.png`);
        
        // Enemy Type 1 (Scout - green variant)
        this.load.image('enemy_scout_l2', `${basePath}/Enemies/enemy_1_g_l2.png`);
        this.load.image('enemy_scout_l1', `${basePath}/Enemies/enemy_1_g_l1.png`);
        this.load.image('enemy_scout_m', `${basePath}/Enemies/enemy_1_g_m.png`);
        this.load.image('enemy_scout_r1', `${basePath}/Enemies/enemy_1_g_r1.png`);
        this.load.image('enemy_scout_r2', `${basePath}/Enemies/enemy_1_g_r2.png`);
        
        // Enemy Type 2 (Fighter - red variant)
        this.load.image('enemy_fighter_l2', `${basePath}/Enemies/enemy_2_r_l2.png`);
        this.load.image('enemy_fighter_l1', `${basePath}/Enemies/enemy_2_r_l1.png`);
        this.load.image('enemy_fighter_m', `${basePath}/Enemies/enemy_2_r_m.png`);
        this.load.image('enemy_fighter_r1', `${basePath}/Enemies/enemy_2_r_r1.png`);
        this.load.image('enemy_fighter_r2', `${basePath}/Enemies/enemy_2_r_r2.png`);
        
        // Enemy Type 3 (Bomber - blue variant of type 2)
        this.load.image('enemy_bomber_l2', `${basePath}/Enemies/enemy_2_b_l2.png`);
        this.load.image('enemy_bomber_l1', `${basePath}/Enemies/enemy_2_b_l1.png`);
        this.load.image('enemy_bomber_m', `${basePath}/Enemies/enemy_2_b_m.png`);
        this.load.image('enemy_bomber_r1', `${basePath}/Enemies/enemy_2_b_r1.png`);
        this.load.image('enemy_bomber_r2', `${basePath}/Enemies/enemy_2_b_r2.png`);
        
        // Enemy Type 4 (Elite - red variant of type 1)
        this.load.image('enemy_elite_l2', `${basePath}/Enemies/enemy_1_r_l2.png`);
        this.load.image('enemy_elite_l1', `${basePath}/Enemies/enemy_1_r_l1.png`);
        this.load.image('enemy_elite_m', `${basePath}/Enemies/enemy_1_r_m.png`);
        this.load.image('enemy_elite_r1', `${basePath}/Enemies/enemy_1_r_r1.png`);
        this.load.image('enemy_elite_r2', `${basePath}/Enemies/enemy_1_r_r2.png`);
        
        // Mines (for bomber drops or obstacles)
        for (let i = 1; i <= 9; i++) {
            this.load.image(`mine_${i}`, `${basePath}/Enemies/mine_1_0${i}.png`);
        }
        
        // Explosions
        for (let i = 1; i <= 11; i++) {
            const num = i < 10 ? `0${i}` : i;
            this.load.image(`explosion1_${i}`, `${basePath}/Explosions/explosion_1_${num}.png`);
        }
        for (let i = 1; i <= 9; i++) {
            this.load.image(`explosion2_${i}`, `${basePath}/Explosions/explosion_2_0${i}.png`);
        }
        for (let i = 1; i <= 9; i++) {
            this.load.image(`explosion3_${i}`, `${basePath}/Explosions/explosion_3_0${i}.png`);
        }
        
        // FX - Bullets
        this.load.image('bullet_plasma1', `${basePath}/FX/plasma_1.png`);
        this.load.image('bullet_plasma2', `${basePath}/FX/plasma_2.png`);
        this.load.image('bullet_proton1', `${basePath}/FX/proton_01.png`);
        this.load.image('bullet_proton2', `${basePath}/FX/proton_02.png`);
        this.load.image('bullet_proton3', `${basePath}/FX/proton_03.png`);
        this.load.image('bullet_vulcan1', `${basePath}/FX/vulcan_1.png`);
        this.load.image('bullet_vulcan2', `${basePath}/FX/vulcan_2.png`);
        this.load.image('bullet_vulcan3', `${basePath}/FX/vulcan_3.png`);
        
        // FX - Exhaust
        for (let i = 1; i <= 5; i++) {
            this.load.image(`exhaust_${i}`, `${basePath}/FX/exhaust_0${i}.png`);
        }

        // Boss sprites
        const bossPath = 'assets/sprites';
        this.load.image('boss-mothership', `${bossPath}/boss_mothership.png`);
        this.load.image('boss-dreadnought', `${bossPath}/boss_dreadnought.png`);
        this.load.image('boss-battlecruiser', `${bossPath}/boss_battlecruiser.png`);
        this.load.image('boss-destroyer', `${bossPath}/boss_destroyer.png`);
        this.load.image('boss-overlord', `${bossPath}/boss_overlord.png`);
    }

    create() {
        // Create animations
        this.createAnimations();
        
        // Create collectible graphics (not in SpaceRage pack)
        this.createCollectibleGraphics();
        
        // Create additional placeholder graphics
        this.createPlaceholderGraphics();
        
        // Start menu scene
        this.scene.start('MenuScene');
    }

    createAnimations() {
        // Helper function to check if all textures exist
        const texturesExist = (keys) => {
            return keys.every(key => this.textures.exists(key));
        };

        // Explosion animation 1 (small)
        const explosion1Keys = ['explosion1_1', 'explosion1_2', 'explosion1_3', 'explosion1_4', 'explosion1_5', 'explosion1_6', 'explosion1_7', 'explosion1_8', 'explosion1_9', 'explosion1_10', 'explosion1_11'];
        if (texturesExist(explosion1Keys)) {
            this.anims.create({
                key: 'explode_small',
                frames: explosion1Keys.map(key => ({ key })),
                frameRate: 20,
                repeat: 0
            });
        } else {
            console.warn('Skipping explode_small animation - missing textures');
        }


        // Explosion animation 2 (medium)
        const explosion2Keys = ['explosion2_1', 'explosion2_2', 'explosion2_3', 'explosion2_4', 'explosion2_5', 'explosion2_6', 'explosion2_7', 'explosion2_8', 'explosion2_9'];
        if (texturesExist(explosion2Keys)) {
            this.anims.create({
                key: 'explode_medium',
                frames: explosion2Keys.map(key => ({ key })),
                frameRate: 18,
                repeat: 0
            });
        } else {
            console.warn('Skipping explode_medium animation - missing textures');
        }


        // Explosion animation 3 (large - for bosses)
        const explosion3Keys = ['explosion3_1', 'explosion3_2', 'explosion3_3', 'explosion3_4', 'explosion3_5', 'explosion3_6', 'explosion3_7', 'explosion3_8', 'explosion3_9'];
        if (texturesExist(explosion3Keys)) {
            this.anims.create({
                key: 'explode_large',
                frames: explosion3Keys.map(key => ({ key })),
                frameRate: 15,
                repeat: 0
            });
        } else {
            console.warn('Skipping explode_large animation - missing textures');
        }


        // Exhaust animation
        const exhaustKeys = ['exhaust_1', 'exhaust_2', 'exhaust_3', 'exhaust_4', 'exhaust_5'];
        if (texturesExist(exhaustKeys)) {
            this.anims.create({
                key: 'exhaust',
                frames: exhaustKeys.map(key => ({ key })),
                frameRate: 15,
                repeat: -1
            });
        } else {
            console.warn('Skipping exhaust animation - missing textures');
        }


        // Mine rotation animation
        const mineKeys = ['mine_1', 'mine_2', 'mine_3', 'mine_4', 'mine_5', 'mine_6', 'mine_7', 'mine_8', 'mine_9'];
        if (texturesExist(mineKeys)) {
            this.anims.create({
                key: 'mine_rotate',
                frames: mineKeys.map(key => ({ key })),
                frameRate: 10,
                repeat: -1
            });
        } else {
            console.warn('Skipping mine_rotate animation - missing textures');
        }
    }

    createCollectibleGraphics() {
        // Coin (gold circle)
        const coinGraphics = this.add.graphics();
        coinGraphics.fillStyle(0xffd700);
        coinGraphics.fillCircle(16, 16, 14);
        coinGraphics.fillStyle(0xffec8b);
        coinGraphics.fillCircle(16, 16, 10);
        coinGraphics.fillStyle(0xffd700);
        coinGraphics.fillCircle(14, 14, 6);
        coinGraphics.generateTexture('collectible-coin', 32, 32);
        coinGraphics.destroy();

        // Crystal (blue diamond)
        const crystalGraphics = this.add.graphics();
        crystalGraphics.fillStyle(0x00bfff);
        crystalGraphics.fillTriangle(16, 2, 28, 16, 16, 30);
        crystalGraphics.fillTriangle(16, 2, 4, 16, 16, 30);
        crystalGraphics.fillStyle(0x87ceeb);
        crystalGraphics.fillTriangle(16, 6, 22, 16, 16, 26);
        crystalGraphics.generateTexture('collectible-crystal', 32, 32);
        crystalGraphics.destroy();

        // Star (yellow star shape)
        const starGraphics = this.add.graphics();
        starGraphics.fillStyle(0xffff00);
        // Draw star shape
        starGraphics.fillCircle(16, 16, 12);
        starGraphics.fillStyle(0xffffff);
        starGraphics.fillCircle(16, 16, 6);
        starGraphics.generateTexture('collectible-star', 32, 32);
        starGraphics.destroy();

        // Fortune Coin (special gold with sparkle)
        const fortuneGraphics = this.add.graphics();
        fortuneGraphics.fillStyle(0xffd700);
        fortuneGraphics.fillCircle(18, 18, 16);
        fortuneGraphics.fillStyle(0xffec8b);
        fortuneGraphics.fillCircle(18, 18, 12);
        fortuneGraphics.fillStyle(0xff6600);
        fortuneGraphics.fillCircle(18, 18, 8);
        fortuneGraphics.fillStyle(0xffffff);
        fortuneGraphics.fillCircle(12, 12, 4);
        fortuneGraphics.generateTexture('collectible-fortune', 36, 36);
        fortuneGraphics.destroy();
    }

    createPlaceholderGraphics() {
        // Enemy bullet (red energy)
        const bulletEnemyGraphics = this.add.graphics();
        bulletEnemyGraphics.fillStyle(0xff0000);
        bulletEnemyGraphics.fillCircle(8, 8, 6);
        bulletEnemyGraphics.fillStyle(0xff6600);
        bulletEnemyGraphics.fillCircle(8, 8, 4);
        bulletEnemyGraphics.generateTexture('bullet-enemy', 16, 16);
        bulletEnemyGraphics.destroy();
    }
}

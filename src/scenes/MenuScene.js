import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Setup sound effects for menu
        this.setupSounds();

        // Create animated starfield background
        this.createStarfield();

        // Create scanlines overlay for retro CRT effect
        this.createScanlines();

        // Add decorative ships flying in background
        this.createBackgroundShips();

        // Add floating collectibles
        this.createFloatingCollectibles();

        // Create the main title with glow effect
        this.createTitle(width, height);

        // Create retro-styled buttons
        this.createButtons(width, height);

        // Create instructions with retro styling
        this.createInstructions(width, height);

        // Add decorative player ship
        this.createHeroShip(width, height);

        // Add version text
        this.add.text(width - 10, height - 10, 'v1.0', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#444444'
        }).setOrigin(1, 1).setDepth(100);
    }

    setupSounds() {
        // Track if audio has been unlocked by user interaction
        this.audioUnlocked = false;

        // Create sound instances with default settings
        this.sounds = {
            hover: null,
            click: null,
            type: null,
            collect: null
        };

        // Check if sounds are loaded and create instances
        if (this.sound && this.cache.audio.exists('hit')) {
            this.sounds.hover = this.sound.add('hit', { volume: 0.15 });
        }
        if (this.sound && this.cache.audio.exists('powerup')) {
            this.sounds.click = this.sound.add('powerup', { volume: 0.4 });
        }
        if (this.sound && this.cache.audio.exists('shoot')) {
            this.sounds.type = this.sound.add('shoot', { volume: 0.08 });
        }
        if (this.sound && this.cache.audio.exists('collect')) {
            this.sounds.collect = this.sound.add('collect', { volume: 0.2 });
        }

        // Listen for first user interaction to unlock audio
        this.input.once('pointerdown', () => {
            this.audioUnlocked = true;
            // Resume audio context if suspended
            if (this.sound.context && this.sound.context.state === 'suspended') {
                this.sound.context.resume();
            }
        });
    }

    playSound(key, volume = 1, requireUnlock = true) {
        try {
            // Skip if audio not unlocked and this sound requires it
            if (requireUnlock && !this.audioUnlocked) return;

            if (this.sound && this.cache.audio.exists(key)) {
                this.sound.play(key, { volume });
            }
        } catch (e) {
            // Ignore sound errors
        }
    }

    playHoverSound() {
        // Only play if audio has been unlocked by a click
        try {
            if (this.audioUnlocked && this.sounds.hover && !this.sounds.hover.isPlaying) {
                this.sounds.hover.play();
            }
        } catch (e) {
            // Ignore sound errors
        }
    }

    playClickSound() {
        // Click IS user interaction - unlock audio and play
        try {
            // Unlock audio on click
            this.audioUnlocked = true;
            if (this.sound.context && this.sound.context.state === 'suspended') {
                this.sound.context.resume();
            }

            if (this.sounds.click) {
                this.sounds.click.play();
            }
        } catch (e) {
            // Ignore sound errors
        }
    }

    playTypeSound() {
        // Only play typewriter sounds if audio has been unlocked
        try {
            if (this.audioUnlocked && this.sounds.type) {
                this.sounds.type.play();
            }
        } catch (e) {
            // Ignore sound errors
        }
    }

    createTitle(width, height) {
        // Main title with glow effect
        const titleGlow = this.add.text(width / 2, height / 6, 'FORTUNE', {
            fontSize: '72px',
            fontFamily: 'monospace',
            color: '#003344'
        });
        titleGlow.setOrigin(0.5);
        titleGlow.setDepth(10);
        titleGlow.setAlpha(0.5);

        const title = this.add.text(width / 2, height / 6, 'FORTUNE', {
            fontSize: '72px',
            fontFamily: 'monospace',
            color: '#00ffff',
            stroke: '#0080ff',
            strokeThickness: 4,
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: '#00ffff',
                blur: 20,
                fill: true
            }
        });
        title.setOrigin(0.5);
        title.setDepth(11);

        // Pulsing glow animation on title
        this.tweens.add({
            targets: [title, titleGlow],
            alpha: { from: 1, to: 0.7 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Scale pulse on glow
        this.tweens.add({
            targets: titleGlow,
            scaleX: { from: 1, to: 1.05 },
            scaleY: { from: 1, to: 1.05 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // "by Ridhaan" credit in italics
        const credit = this.add.text(width / 2, height / 6 + 50, 'by Ridhaan', {
            fontSize: '18px',
            fontFamily: 'monospace',
            fontStyle: 'italic',
            color: '#88ccff'
        });
        credit.setOrigin(0.5);
        credit.setDepth(11);

        // Subtitle with typewriter effect
        const subtitleText = ':: SPACE SHOOTER ::';
        const subtitle = this.add.text(width / 2, height / 6 + 85, '', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ff00ff',
            stroke: '#660066',
            strokeThickness: 2
        });
        subtitle.setOrigin(0.5);
        subtitle.setDepth(11);

        // Typewriter animation with sound
        let charIndex = 0;
        this.time.addEvent({
            delay: 80,
            callback: () => {
                subtitle.setText(subtitleText.substring(0, charIndex + 1));
                // Play type sound for non-space characters
                if (subtitleText[charIndex] !== ' ' && subtitleText[charIndex] !== ':') {
                    this.playTypeSound();
                }
                charIndex++;
            },
            repeat: subtitleText.length - 1
        });

        // Blinking tagline
        const tagline = this.add.text(width / 2, height / 6 + 120, 'DEFEND THE GALAXY', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffff00'
        });
        tagline.setOrigin(0.5);
        tagline.setDepth(11);
        tagline.setAlpha(0);

        // Fade in tagline after subtitle types
        this.time.delayedCall(subtitleText.length * 80 + 500, () => {
            this.playSound('collect', 0.25);
            this.tweens.add({
                targets: tagline,
                alpha: { from: 0, to: 1 },
                duration: 500
            });

            // Then blink
            this.time.delayedCall(500, () => {
                this.tweens.add({
                    targets: tagline,
                    alpha: { from: 1, to: 0.3 },
                    duration: 800,
                    yoyo: true,
                    repeat: -1
                });
            });
        });
    }

    createButtons(width, height) {
        const buttonY = height / 2 + 80;

        // Start button with retro border
        this.createRetroButton(
            width / 2,
            buttonY,
            'START GAME',
            0x00ffff,
            () => this.scene.start('GameScene')
        );

        // Leaderboard button
        this.createRetroButton(
            width / 2,
            buttonY + 70,
            'LEADERBOARD',
            0x666688,
            () => this.showLeaderboard()
        );

        // Blinking "INSERT COIN" text
        const insertCoin = this.add.text(width / 2, buttonY - 50, '[ PRESS START ]', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#00ff00'
        });
        insertCoin.setOrigin(0.5);
        insertCoin.setDepth(11);

        this.tweens.add({
            targets: insertCoin,
            alpha: { from: 1, to: 0 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    createRetroButton(x, y, text, color, callback) {
        const buttonWidth = 220;
        const buttonHeight = 50;

        // Outer border (double-line retro style)
        const outerBorder = this.add.rectangle(x, y, buttonWidth + 8, buttonHeight + 8);
        outerBorder.setStrokeStyle(2, color);
        outerBorder.setDepth(10);

        // Inner button
        const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0x111122);
        button.setStrokeStyle(2, color);
        button.setInteractive({ useHandCursor: true });
        button.setDepth(10);

        // Button text
        const buttonText = this.add.text(x, y, text, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: Phaser.Display.Color.IntegerToColor(color).rgba
        });
        buttonText.setOrigin(0.5);
        buttonText.setDepth(11);

        // Corner decorations
        const cornerSize = 6;
        const corners = [
            { x: x - buttonWidth/2, y: y - buttonHeight/2 },
            { x: x + buttonWidth/2, y: y - buttonHeight/2 },
            { x: x - buttonWidth/2, y: y + buttonHeight/2 },
            { x: x + buttonWidth/2, y: y + buttonHeight/2 }
        ];

        corners.forEach(corner => {
            const c = this.add.rectangle(corner.x, corner.y, cornerSize, cornerSize, color);
            c.setDepth(11);
        });

        // Hover effects
        button.on('pointerover', () => {
            button.setFillStyle(0x223344);
            outerBorder.setStrokeStyle(3, 0xffffff);
            buttonText.setScale(1.05);

            // Play hover sound
            this.playHoverSound();

            // Small screen shake
            this.cameras.main.shake(50, 0.002);
        });

        button.on('pointerout', () => {
            button.setFillStyle(0x111122);
            outerBorder.setStrokeStyle(2, color);
            buttonText.setScale(1);
        });

        button.on('pointerdown', () => {
            // Play click sound
            this.playClickSound();
            // Small delay to let sound play before transition
            this.time.delayedCall(100, callback);
        });

        return { button, outerBorder, buttonText };
    }

    createInstructions(width, height) {
        const instructionY = height - 80;

        // Retro border box for instructions
        const boxWidth = 350;
        const boxHeight = 60;

        const instructionBox = this.add.rectangle(width / 2, instructionY, boxWidth, boxHeight, 0x000000, 0.5);
        instructionBox.setStrokeStyle(1, 0x444466);
        instructionBox.setDepth(10);

        const instructions = this.add.text(width / 2, instructionY,
            'WASD/ARROWS: Move  |  SPACE: Shoot  |  ESC: Pause', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#666699',
            align: 'center'
        });
        instructions.setOrigin(0.5);
        instructions.setDepth(11);
    }

    createHeroShip(width, height) {
        // Add player ship as decoration
        const ship = this.add.image(width / 2, height / 2 - 20, 'player_m');
        ship.setScale(3);
        ship.setDepth(9);

        // Gentle floating animation
        this.tweens.add({
            targets: ship,
            y: ship.y - 10,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Add exhaust effect below ship
        const exhaust = this.add.image(width / 2, height / 2 + 25, 'exhaust_1');
        exhaust.setScale(2.5);
        exhaust.setDepth(8);
        exhaust.setAlpha(0.8);

        // Animate exhaust
        let exhaustFrame = 1;
        this.time.addEvent({
            delay: 100,
            callback: () => {
                exhaustFrame = (exhaustFrame % 5) + 1;
                if (this.textures.exists(`exhaust_${exhaustFrame}`)) {
                    exhaust.setTexture(`exhaust_${exhaustFrame}`);
                }
            },
            loop: true
        });

        // Make exhaust follow ship
        this.tweens.add({
            targets: exhaust,
            y: exhaust.y - 10,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createBackgroundShips() {
        // Periodically spawn enemy ships flying across
        this.time.addEvent({
            delay: 3000,
            callback: () => this.spawnBackgroundEnemy(),
            loop: true
        });

        // Spawn a couple immediately
        this.time.delayedCall(500, () => this.spawnBackgroundEnemy());
        this.time.delayedCall(1500, () => this.spawnBackgroundEnemy());
    }

    spawnBackgroundEnemy() {
        const enemyTypes = ['enemy_scout_m', 'enemy_fighter_m', 'enemy_bomber_m'];
        const type = Phaser.Utils.Array.GetRandom(enemyTypes);

        const side = Math.random() > 0.5 ? 'left' : 'right';
        const startX = side === 'left' ? -50 : this.scale.width + 50;
        const endX = side === 'left' ? this.scale.width + 50 : -50;
        const y = Phaser.Math.Between(50, this.scale.height - 150);

        const enemy = this.add.image(startX, y, type);
        enemy.setScale(1.5);
        enemy.setAlpha(0.4);
        enemy.setDepth(3);

        if (side === 'right') {
            enemy.setFlipX(true);
        }

        this.tweens.add({
            targets: enemy,
            x: endX,
            duration: Phaser.Math.Between(4000, 7000),
            ease: 'Linear',
            onComplete: () => enemy.destroy()
        });
    }

    createFloatingCollectibles() {
        const collectibleTypes = ['collectible-coin', 'collectible-crystal', 'collectible-star'];

        // Create a few floating collectibles
        for (let i = 0; i < 5; i++) {
            this.time.delayedCall(i * 800, () => {
                this.spawnFloatingCollectible(Phaser.Utils.Array.GetRandom(collectibleTypes));
            });
        }

        // Keep spawning them
        this.time.addEvent({
            delay: 4000,
            callback: () => {
                this.spawnFloatingCollectible(Phaser.Utils.Array.GetRandom(collectibleTypes));
            },
            loop: true
        });
    }

    spawnFloatingCollectible(type) {
        const x = Phaser.Math.Between(50, this.scale.width - 50);
        const collectible = this.add.image(x, -30, type);
        collectible.setScale(1.2);
        collectible.setAlpha(0.6);
        collectible.setDepth(4);

        // Floating down with slight wave motion
        this.tweens.add({
            targets: collectible,
            y: this.scale.height + 30,
            duration: Phaser.Math.Between(6000, 10000),
            ease: 'Linear',
            onComplete: () => collectible.destroy()
        });

        // Horizontal wave motion
        this.tweens.add({
            targets: collectible,
            x: x + Phaser.Math.Between(-50, 50),
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Rotation
        this.tweens.add({
            targets: collectible,
            angle: 360,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });
    }

    createStarfield() {
        // Add background image
        this.bg = this.add.image(this.scale.width / 2, this.scale.height / 2, 'background');
        this.bg.setDisplaySize(this.scale.width, this.scale.height);
        this.bg.setDepth(0);
        this.bg.setAlpha(0.6);

        // Dark overlay
        const overlay = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            0x000011,
            0.4
        );
        overlay.setDepth(1);

        this.starfieldLayers = [];

        // Enhanced starfield with color variation
        const starColors = [0xffffff, 0x00ffff, 0xffff00, 0xff00ff];

        for (let i = 0; i < 3; i++) {
            const stars = this.add.group();
            const starCount = 30 + i * 20;
            const speed = 20 + i * 20;
            const size = 1 + i * 0.5;

            for (let j = 0; j < starCount; j++) {
                const x = Phaser.Math.Between(0, this.scale.width);
                const y = Phaser.Math.Between(0, this.scale.height);
                const alpha = 0.3 + Math.random() * 0.6;
                const color = Phaser.Utils.Array.GetRandom(starColors);
                const star = this.add.circle(x, y, size, color, alpha);
                star.setDepth(2);
                star.baseAlpha = alpha;
                stars.add(star);

                // Random twinkle effect
                if (Math.random() > 0.7) {
                    this.tweens.add({
                        targets: star,
                        alpha: { from: alpha, to: alpha * 0.3 },
                        duration: Phaser.Math.Between(500, 1500),
                        yoyo: true,
                        repeat: -1,
                        delay: Phaser.Math.Between(0, 2000)
                    });
                }
            }

            this.starfieldLayers.push({ stars, speed });
        }
    }

    createScanlines() {
        // Create scanlines effect
        const graphics = this.add.graphics();
        graphics.setDepth(200);
        graphics.setAlpha(0.08);

        for (let y = 0; y < this.scale.height; y += 4) {
            graphics.fillStyle(0x000000);
            graphics.fillRect(0, y, this.scale.width, 2);
        }

        // Vignette effect (darkened corners)
        const vignette = this.add.graphics();
        vignette.setDepth(199);

        const vignetteGradient = vignette.createGeometryMask();
        vignette.fillStyle(0x000000, 0.3);
        vignette.fillRect(0, 0, 50, this.scale.height);
        vignette.fillRect(this.scale.width - 50, 0, 50, this.scale.height);
        vignette.fillRect(0, 0, this.scale.width, 30);
        vignette.fillRect(0, this.scale.height - 30, this.scale.width, 30);
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

        // Store references for cleanup
        this.leaderboardElements = [];

        // Dark overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
        overlay.setDepth(2000);
        this.leaderboardElements.push(overlay);

        // Leaderboard panel with retro border
        const panel = this.add.rectangle(width / 2, height / 2, 400, 420, 0x0a0a1a);
        panel.setDepth(2001);
        panel.setStrokeStyle(3, 0x00ffff);
        this.leaderboardElements.push(panel);

        // Double border effect
        const outerPanel = this.add.rectangle(width / 2, height / 2, 416, 436);
        outerPanel.setDepth(2000);
        outerPanel.setStrokeStyle(2, 0x004466);
        this.leaderboardElements.push(outerPanel);

        // Title with glow
        const title = this.add.text(width / 2, height / 2 - 170, 'HIGH SCORES', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#00ffff',
            stroke: '#004466',
            strokeThickness: 2
        });
        title.setOrigin(0.5);
        title.setDepth(2002);
        this.leaderboardElements.push(title);

        // Decorative line
        const line = this.add.rectangle(width / 2, height / 2 - 135, 300, 2, 0x00ffff);
        line.setDepth(2002);
        this.leaderboardElements.push(line);

        // Scores
        let yOffset = -100;
        if (scores.length === 0) {
            const noScores = this.add.text(width / 2, height / 2, 'NO SCORES YET', {
                fontSize: '18px',
                fontFamily: 'monospace',
                color: '#666666'
            });
            noScores.setOrigin(0.5);
            noScores.setDepth(2002);
            this.leaderboardElements.push(noScores);
        } else {
            scores.forEach((score, index) => {
                const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#ffffff';

                const rank = this.add.text(width / 2 - 150, height / 2 + yOffset, `${index + 1}.`, {
                    fontSize: '20px',
                    fontFamily: 'monospace',
                    color: rankColor
                });
                rank.setOrigin(0, 0.5);
                rank.setDepth(2002);
                this.leaderboardElements.push(rank);

                const scoreText = this.add.text(width / 2 + 100, height / 2 + yOffset, score.toLocaleString(), {
                    fontSize: '20px',
                    fontFamily: 'monospace',
                    color: rankColor
                });
                scoreText.setOrigin(1, 0.5);
                scoreText.setDepth(2002);
                this.leaderboardElements.push(scoreText);

                yOffset += 35;
            });
        }

        // Close button
        const closeButton = this.add.rectangle(width / 2, height / 2 + 170, 150, 45, 0x111122);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.setDepth(2002);
        closeButton.setStrokeStyle(2, 0x00ffff);
        this.leaderboardElements.push(closeButton);

        const closeText = this.add.text(width / 2, height / 2 + 170, 'CLOSE', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#00ffff'
        });
        closeText.setOrigin(0.5);
        closeText.setDepth(2003);
        this.leaderboardElements.push(closeText);

        closeButton.on('pointerover', () => {
            closeButton.setFillStyle(0x223344);
            this.playHoverSound();
        });

        closeButton.on('pointerout', () => {
            closeButton.setFillStyle(0x111122);
        });

        closeButton.on('pointerdown', () => {
            this.playClickSound();
            this.leaderboardElements.forEach(el => el.destroy());
            this.leaderboardElements = [];
        });
    }

    getLeaderboard() {
        const scores = JSON.parse(localStorage.getItem('fortune_leaderboard') || '[]');
        return scores.sort((a, b) => b - a).slice(0, 10);
    }
}

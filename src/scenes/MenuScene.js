import Phaser from 'phaser';
import ChatBox from '../ui/ChatBox.js';
import DailyChallenge from '../managers/DailyChallenge.js';
import XPManager from '../managers/XPManager.js';
import { SHIP_SKINS, DIFFICULTY_MODES, PET_TYPES, PET_CONFIG } from '../utils/constants.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Fade in
        this.cameras.main.fadeIn(300, 0, 0, 0);

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

        // Daily challenge banner
        this.createDailyChallengeBanner(width, height);

        // XP and level display
        this.createXPDisplay(width, height);

        // Total stats on menu
        this.createMenuStats(width, height);

        // Credits at bottom
        this.add.text(width / 2, height - 15, 'Made with \u2764\uFE0F by Ridhaan & Papa', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#555577'
        }).setOrigin(0.5, 1).setDepth(100);

        // Sparkle effects behind title
        this.createTitleSparkles(width, height);

        // Konami Code easter egg listener
        this.setupKonamiCode();

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

    createMenuStats(width, height) {
        const gamesPlayed = parseInt(localStorage.getItem('fortune-games-played') || '0', 10);
        const bestScore = this.getBestScore();
        const xpManager = new XPManager();
        const level = xpManager.getLevel();

        const statsStr = `Games: ${gamesPlayed}  |  Best: ${bestScore.toLocaleString()}  |  Lv.${level}`;
        this.add.text(width / 2, height / 6 + 140, statsStr, {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#556677'
        }).setOrigin(0.5).setDepth(11);
    }

    createTitleSparkles(width, height) {
        const titleY = height / 6;
        // Spawn sparkle particles around the title area
        this.time.addEvent({
            delay: 400,
            loop: true,
            callback: () => {
                const sx = width / 2 + Phaser.Math.Between(-160, 160);
                const sy = titleY + Phaser.Math.Between(-30, 30);
                const sparkle = this.add.circle(sx, sy, Phaser.Math.Between(1, 3), 0xffffff, 0.8);
                sparkle.setDepth(9);
                this.tweens.add({
                    targets: sparkle,
                    alpha: 0,
                    scale: 0,
                    duration: Phaser.Math.Between(400, 800),
                    onComplete: () => sparkle.destroy()
                });
            }
        });
    }

    fadeToScene(sceneKey, data = {}) {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(sceneKey, data);
        });
    }

    createDailyChallengeBanner(width, height) {
        const dc = new DailyChallenge();
        const bannerY = height - 55;

        // Banner background
        const bg = this.add.rectangle(width / 2, bannerY, 500, 36, 0x111133, 0.8);
        bg.setStrokeStyle(1, 0xffd700, 0.5);
        bg.setDepth(12);

        if (dc.completed) {
            const text = this.add.text(width / 2, bannerY, 'DAILY CHALLENGE: COMPLETED!', {
                fontSize: '14px', fontFamily: 'monospace', color: '#00ff00', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(13);
        } else {
            const text = this.add.text(width / 2, bannerY, `DAILY CHALLENGE: ${dc.description}`, {
                fontSize: '13px', fontFamily: 'monospace', color: '#ffd700'
            }).setOrigin(0.5).setDepth(13);

            // Subtle pulse
            this.tweens.add({
                targets: text,
                alpha: { from: 1, to: 0.6 },
                duration: 1200,
                yoyo: true,
                repeat: -1
            });
        }
    }

    createXPDisplay(width, height) {
        const xpManager = new XPManager();
        const level = xpManager.getLevel();
        const xp = xpManager.getXP();
        const progress = xpManager.getXPProgress();
        const nextReq = xpManager.getXPForNextLevel();
        const title = xpManager.getTitle();

        const xpY = height - 90;

        // Level text
        let levelStr = `Lv.${level}`;
        if (title) levelStr += ` - ${title}`;

        const lvlText = this.add.text(width / 2, xpY - 12, levelStr, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffd700',
            fontStyle: 'bold'
        });
        lvlText.setOrigin(0.5);
        lvlText.setDepth(12);

        // XP bar background
        const barWidth = 200;
        const barHeight = 8;
        const barX = width / 2 - barWidth / 2;

        const barBg = this.add.rectangle(width / 2, xpY + 6, barWidth, barHeight, 0x333333);
        barBg.setDepth(12);

        // XP bar fill
        const fillWidth = Math.max(1, barWidth * progress);
        const barFill = this.add.rectangle(barX + fillWidth / 2, xpY + 6, fillWidth, barHeight, 0xffd700);
        barFill.setDepth(13);

        // XP text
        const xpStr = nextReq !== null ? `${xp} / ${nextReq} XP` : `${xp} XP (MAX)`;
        const xpText = this.add.text(width / 2, xpY + 18, xpStr, {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#888888'
        });
        xpText.setOrigin(0.5);
        xpText.setDepth(12);
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

        // Pilot name display
        const pilotName = localStorage.getItem('fortune-pilot-name') || 'Pilot';
        const pilotText = this.add.text(width / 2, height / 6 + 108, `Commander ${pilotName}`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#44ff88',
            fontStyle: 'bold'
        });
        pilotText.setOrigin(0.5);
        pilotText.setDepth(11);

        // Blinking tagline
        const tagline = this.add.text(width / 2, height / 6 + 128, 'DEFEND THE GALAXY', {
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
        const buttonY = height / 2 + 50;

        // Difficulty selector
        this.selectedDifficulty = localStorage.getItem('fortune-difficulty') || 'NORMAL';
        this.createDifficultySelector(width, buttonY - 70);

        // Start button with retro border
        this.createRetroButton(
            width / 2,
            buttonY,
            'START GAME',
            0x00ffff,
            () => {
                fetch('/api/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'start' })
                })
                .then(r => r.json())
                .then(data => {
                    if (data.isMumbai) {
                        this.showRidhaanPrompt();
                    } else {
                        this.fadeToScene('GameScene');
                    }
                })
                .catch(() => {
                    this.fadeToScene('GameScene');
                });
            }
        );

        // Skins button
        this.createRetroButton(
            width / 2 - 120,
            buttonY + 60,
            'SKINS',
            0xffd700,
            () => this.showSkinsOverlay()
        );

        // Leaderboard button
        this.createRetroButton(
            width / 2 + 120,
            buttonY + 60,
            'SCORES',
            0x666688,
            () => this.showLeaderboard()
        );

        // Achievements button
        this.createRetroButton(
            width / 2 - 120,
            buttonY + 115,
            'ACHIEVEMENTS',
            0xffa500,
            () => this.showAchievements()
        );

        // Pets button
        this.createRetroButton(
            width / 2 + 120,
            buttonY + 115,
            'PETS',
            0xff88ff,
            () => this.showPetsOverlay()
        );

        // STORY replay button (small)
        this.createSmallButton(width / 2 - 60, buttonY + 165, 'STORY', 0x8844ff, () => {
            this.fadeToScene('IntroScene', { replay: true });
        });

        // SOUND toggle button (small)
        const soundLevel = localStorage.getItem('fortune-sound-level') || 'HIGH';
        const soundLabel = soundLevel === 'OFF' ? 'SOUND OFF' : soundLevel === 'LOW' ? 'SOUND LOW' : 'SOUND ON';
        this.soundBtnText = null;
        this.createSmallButton(width / 2 + 60, buttonY + 165, soundLabel, 0x44aa44, () => {
            this.cycleSoundLevel();
        }, (txt) => { this.soundBtnText = txt; });

        // Blinking "INSERT COIN" text
        const insertCoin = this.add.text(width / 2, buttonY - 30, '[ PRESS START ]', {
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

    createDifficultySelector(width, y) {
        const modes = ['EASY', 'NORMAL', 'HARD'];
        this.difficultyButtons = [];

        modes.forEach((mode, i) => {
            const config = DIFFICULTY_MODES[mode];
            const x = width / 2 + (i - 1) * 110;
            const isSelected = mode === this.selectedDifficulty;

            const bg = this.add.rectangle(x, y, 95, 30, isSelected ? 0x223344 : 0x111122);
            bg.setStrokeStyle(2, isSelected ? 0xffffff : config.color);
            bg.setInteractive({ useHandCursor: true });
            bg.setDepth(10);

            const label = this.add.text(x, y, config.name, {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: isSelected ? '#ffffff' : Phaser.Display.Color.IntegerToColor(config.color).rgba
            });
            label.setOrigin(0.5);
            label.setDepth(11);

            bg.on('pointerover', () => {
                bg.setFillStyle(0x334455);
                this.playHoverSound();
            });
            bg.on('pointerout', () => {
                bg.setFillStyle(mode === this.selectedDifficulty ? 0x223344 : 0x111122);
            });
            bg.on('pointerdown', () => {
                this.playClickSound();
                this.selectedDifficulty = mode;
                localStorage.setItem('fortune-difficulty', mode);
                // Update visuals
                this.difficultyButtons.forEach(btn => {
                    const sel = btn.mode === mode;
                    btn.bg.setStrokeStyle(2, sel ? 0xffffff : DIFFICULTY_MODES[btn.mode].color);
                    btn.bg.setFillStyle(sel ? 0x223344 : 0x111122);
                    btn.label.setColor(sel ? '#ffffff' : Phaser.Display.Color.IntegerToColor(DIFFICULTY_MODES[btn.mode].color).rgba);
                });
            });

            this.difficultyButtons.push({ bg, label, mode });
        });
    }

    showSkinsOverlay() {
        const width = this.scale.width;
        const height = this.scale.height;
        const elements = [];

        // Get unlocked skins and best score
        const unlockedSkins = JSON.parse(localStorage.getItem('fortune-unlocked-skins') || '["default"]');
        const bestScore = this.getBestScore();
        const selectedSkin = localStorage.getItem('fortune-selected-skin') || 'default';

        // Check for newly unlockable skins
        const skinIds = Object.keys(SHIP_SKINS);
        skinIds.forEach(id => {
            if (!unlockedSkins.includes(id) && bestScore >= SHIP_SKINS[id].unlockScore) {
                unlockedSkins.push(id);
            }
        });
        localStorage.setItem('fortune-unlocked-skins', JSON.stringify(unlockedSkins));

        // Dark overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
        overlay.setDepth(2000);
        elements.push(overlay);

        // Panel
        const panel = this.add.rectangle(width / 2, height / 2, 500, 380, 0x0a0a1a);
        panel.setDepth(2001);
        panel.setStrokeStyle(3, 0xffd700);
        elements.push(panel);

        // Title
        const title = this.add.text(width / 2, height / 2 - 160, 'SHIP SKINS', {
            fontSize: '28px',
            fontFamily: 'monospace',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 2
        });
        title.setOrigin(0.5);
        title.setDepth(2002);
        elements.push(title);

        // Show skins in a row
        const startX = width / 2 - 160;
        const skinY = height / 2 - 40;

        skinIds.forEach((id, i) => {
            const skin = SHIP_SKINS[id];
            const x = startX + i * 110;
            const isUnlocked = unlockedSkins.includes(id);
            const isSelected = id === selectedSkin;

            // Card bg
            const cardColor = isSelected ? 0x334455 : 0x1a1a2e;
            const card = this.add.rectangle(x, skinY, 90, 120, cardColor);
            card.setStrokeStyle(2, isSelected ? 0xffd700 : (isUnlocked ? 0x444466 : 0x333333));
            card.setDepth(2002);
            elements.push(card);

            // Glow for selected
            if (isSelected) {
                const glow = this.add.rectangle(x, skinY, 96, 126);
                glow.setStrokeStyle(3, 0xffd700);
                glow.setDepth(2001);
                elements.push(glow);
                this.tweens.add({
                    targets: glow,
                    alpha: { from: 1, to: 0.3 },
                    duration: 800,
                    yoyo: true,
                    repeat: -1
                });
            }

            // Ship icon
            const ship = this.add.image(x, skinY - 25, 'player_m');
            ship.setScale(1.5);
            ship.setDepth(2003);
            elements.push(ship);

            if (isUnlocked) {
                if (skin.tint && skin.tint !== 'rainbow') {
                    ship.setTint(skin.tint);
                } else if (skin.tint === 'rainbow') {
                    let ci = 0;
                    const rt = this.time.addEvent({
                        delay: 300,
                        callback: () => { ship.setTint(skin.colors[ci]); ci = (ci + 1) % skin.colors.length; },
                        loop: true
                    });
                    elements.push({ destroy: () => rt.destroy() });
                }
            } else {
                ship.setTint(0x333333);
                // Lock icon
                const lock = this.add.text(x, skinY - 25, '🔒', { fontSize: '20px' });
                lock.setOrigin(0.5);
                lock.setDepth(2004);
                elements.push(lock);
            }

            // Name
            const nameText = this.add.text(x, skinY + 20, skin.name, {
                fontSize: '10px',
                fontFamily: 'monospace',
                color: isUnlocked ? '#ffffff' : '#666666',
                align: 'center',
                wordWrap: { width: 85 }
            });
            nameText.setOrigin(0.5);
            nameText.setDepth(2003);
            elements.push(nameText);

            // Requirement or SELECTED label
            let infoStr = '';
            if (!isUnlocked) {
                infoStr = `${skin.unlockScore.toLocaleString()} pts`;
            } else if (isSelected) {
                infoStr = 'EQUIPPED';
            }
            const info = this.add.text(x, skinY + 40, infoStr, {
                fontSize: '10px',
                fontFamily: 'monospace',
                color: isSelected ? '#ffd700' : '#888888'
            });
            info.setOrigin(0.5);
            info.setDepth(2003);
            elements.push(info);

            // Click to select
            if (isUnlocked && !isSelected) {
                card.setInteractive({ useHandCursor: true });
                card.on('pointerdown', () => {
                    this.playClickSound();
                    localStorage.setItem('fortune-selected-skin', id);
                    // Refresh overlay
                    elements.forEach(el => { if (el && el.destroy) el.destroy(); });
                    this.showSkinsOverlay();
                });
                card.on('pointerover', () => {
                    card.setFillStyle(0x334455);
                    this.playHoverSound();
                });
                card.on('pointerout', () => {
                    card.setFillStyle(0x1a1a2e);
                });
            }
        });

        // Best score info
        const scoreInfo = this.add.text(width / 2, height / 2 + 90, `Your Best Score: ${bestScore.toLocaleString()}`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#888888'
        });
        scoreInfo.setOrigin(0.5);
        scoreInfo.setDepth(2002);
        elements.push(scoreInfo);

        // Close button
        const closeBtn = this.add.rectangle(width / 2, height / 2 + 140, 120, 40, 0x111122);
        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.setDepth(2002);
        closeBtn.setStrokeStyle(2, 0xffd700);
        elements.push(closeBtn);

        const closeText = this.add.text(width / 2, height / 2 + 140, 'CLOSE', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffd700'
        });
        closeText.setOrigin(0.5);
        closeText.setDepth(2003);
        elements.push(closeText);

        closeBtn.on('pointerover', () => { closeBtn.setFillStyle(0x223344); this.playHoverSound(); });
        closeBtn.on('pointerout', () => { closeBtn.setFillStyle(0x111122); });
        closeBtn.on('pointerdown', () => {
            this.playClickSound();
            elements.forEach(el => { if (el && el.destroy) el.destroy(); });
        });
    }

    getBestScore() {
        const scores = JSON.parse(localStorage.getItem('fortune_leaderboard') || '[]');
        return scores.length > 0 ? Math.max(...scores) : 0;
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
            // Bounce effect
            this.tweens.add({
                targets: [button, buttonText],
                scale: { from: 0.95, to: 1 },
                duration: 150,
                ease: 'Back.easeOut'
            });
            // Small delay to let sound play before transition
            this.time.delayedCall(100, callback);
        });

        return { button, outerBorder, buttonText };
    }

    createSmallButton(x, y, text, color, callback, textRefCallback) {
        const btn = this.add.rectangle(x, y, 100, 30, 0x111122);
        btn.setStrokeStyle(1, color);
        btn.setInteractive({ useHandCursor: true });
        btn.setDepth(10);

        const txt = this.add.text(x, y, text, {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: Phaser.Display.Color.IntegerToColor(color).rgba
        }).setOrigin(0.5).setDepth(11);

        if (textRefCallback) textRefCallback(txt);

        btn.on('pointerover', () => {
            btn.setFillStyle(0x223344);
            this.playHoverSound();
        });
        btn.on('pointerout', () => btn.setFillStyle(0x111122));
        btn.on('pointerdown', () => {
            this.playClickSound();
            callback();
        });
    }

    cycleSoundLevel() {
        const levels = ['HIGH', 'LOW', 'OFF'];
        const labels = { HIGH: 'SOUND ON', LOW: 'SOUND LOW', OFF: 'SOUND OFF' };
        let current = localStorage.getItem('fortune-sound-level') || 'HIGH';
        const idx = (levels.indexOf(current) + 1) % levels.length;
        current = levels[idx];
        localStorage.setItem('fortune-sound-level', current);
        if (this.soundBtnText) this.soundBtnText.setText(labels[current]);
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

    setupKonamiCode() {
        const sequence = [
            Phaser.Input.Keyboard.KeyCodes.UP,
            Phaser.Input.Keyboard.KeyCodes.UP,
            Phaser.Input.Keyboard.KeyCodes.DOWN,
            Phaser.Input.Keyboard.KeyCodes.DOWN,
            Phaser.Input.Keyboard.KeyCodes.LEFT,
            Phaser.Input.Keyboard.KeyCodes.RIGHT,
            Phaser.Input.Keyboard.KeyCodes.LEFT,
            Phaser.Input.Keyboard.KeyCodes.RIGHT,
            Phaser.Input.Keyboard.KeyCodes.B,
            Phaser.Input.Keyboard.KeyCodes.A
        ];
        this.konamiIndex = 0;

        this.input.keyboard.on('keydown', (event) => {
            if (event.keyCode === sequence[this.konamiIndex]) {
                this.konamiIndex++;
                if (this.konamiIndex === sequence.length) {
                    this.konamiIndex = 0;
                    this.activateKonamiCode();
                }
            } else {
                this.konamiIndex = 0;
            }
        });
    }

    activateKonamiCode() {
        // Only once per session
        if (sessionStorage.getItem('fortune-konami-used')) return;

        sessionStorage.setItem('fortune-konami-activated', 'true');
        sessionStorage.setItem('fortune-konami-used', 'true');

        const width = this.scale.width;
        const height = this.scale.height;

        // Rainbow flash
        const rainbowColors = [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x8800ff, 0xff00ff];
        let flashIndex = 0;
        const flashOverlay = this.add.rectangle(width / 2, height / 2, width, height, rainbowColors[0], 0.4);
        flashOverlay.setDepth(9999);

        const flashTimer = this.time.addEvent({
            delay: 80,
            repeat: 13,
            callback: () => {
                flashIndex = (flashIndex + 1) % rainbowColors.length;
                flashOverlay.setFillStyle(rainbowColors[flashIndex], 0.4);
            }
        });

        // Cheat activated text
        const cheatText = this.add.text(width / 2, height / 2, 'CHEAT ACTIVATED!', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            fontStyle: 'bold'
        });
        cheatText.setOrigin(0.5);
        cheatText.setDepth(10000);
        cheatText.setAlpha(0);

        this.tweens.add({
            targets: cheatText,
            alpha: 1,
            scale: { from: 2, to: 1 },
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    this.tweens.add({
                        targets: [cheatText, flashOverlay],
                        alpha: 0,
                        duration: 500,
                        onComplete: () => {
                            cheatText.destroy();
                            flashOverlay.destroy();
                        }
                    });
                });
            }
        });

        this.cameras.main.shake(500, 0.015);

        if (this.sounds.click) {
            try { this.sounds.click.play(); } catch (e) { /* ignore */ }
        }
    }

    showLeaderboard() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.leaderboardElements = [];
        this.lbTab = 'local'; // 'local' or 'online'

        // Dark overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
        overlay.setDepth(2000);
        this.leaderboardElements.push(overlay);

        // Panel
        const panel = this.add.rectangle(width / 2, height / 2, 420, 450, 0x0a0a1a);
        panel.setDepth(2001);
        panel.setStrokeStyle(3, 0x00ffff);
        this.leaderboardElements.push(panel);

        // Title
        const title = this.add.text(width / 2, height / 2 - 190, 'HIGH SCORES', {
            fontSize: '28px', fontFamily: 'monospace', color: '#00ffff',
            stroke: '#004466', strokeThickness: 2
        }).setOrigin(0.5).setDepth(2002);
        this.leaderboardElements.push(title);

        // Tab buttons
        const localTab = this.add.rectangle(width / 2 - 65, height / 2 - 155, 110, 28, 0x223344);
        localTab.setStrokeStyle(1, 0x00ffff).setInteractive({ useHandCursor: true }).setDepth(2002);
        this.leaderboardElements.push(localTab);
        const localTabText = this.add.text(width / 2 - 65, height / 2 - 155, 'LOCAL', {
            fontSize: '13px', fontFamily: 'monospace', color: '#00ffff'
        }).setOrigin(0.5).setDepth(2003);
        this.leaderboardElements.push(localTabText);

        const onlineTab = this.add.rectangle(width / 2 + 65, height / 2 - 155, 110, 28, 0x111122);
        onlineTab.setStrokeStyle(1, 0x666688).setInteractive({ useHandCursor: true }).setDepth(2002);
        this.leaderboardElements.push(onlineTab);
        const onlineTabText = this.add.text(width / 2 + 65, height / 2 - 155, 'ONLINE', {
            fontSize: '13px', fontFamily: 'monospace', color: '#666688'
        }).setOrigin(0.5).setDepth(2003);
        this.leaderboardElements.push(onlineTabText);

        // Score area container
        this.lbScoreElements = [];

        const showLocalScores = () => {
            this.lbScoreElements.forEach(el => el.destroy());
            this.lbScoreElements = [];
            localTab.setFillStyle(0x223344);
            localTabText.setColor('#00ffff');
            onlineTab.setFillStyle(0x111122);
            onlineTabText.setColor('#666688');

            const scores = this.getLeaderboard();
            let yOffset = -115;
            if (scores.length === 0) {
                const ns = this.add.text(width / 2, height / 2, 'NO SCORES YET', {
                    fontSize: '18px', fontFamily: 'monospace', color: '#666666'
                }).setOrigin(0.5).setDepth(2002);
                this.lbScoreElements.push(ns);
            } else {
                scores.forEach((score, i) => {
                    const c = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#ffffff';
                    const r = this.add.text(width / 2 - 150, height / 2 + yOffset, `${i + 1}.`, {
                        fontSize: '18px', fontFamily: 'monospace', color: c
                    }).setOrigin(0, 0.5).setDepth(2002);
                    const s = this.add.text(width / 2 + 100, height / 2 + yOffset, score.toLocaleString(), {
                        fontSize: '18px', fontFamily: 'monospace', color: c
                    }).setOrigin(1, 0.5).setDepth(2002);
                    this.lbScoreElements.push(r, s);
                    yOffset += 30;
                });
            }
        };

        const showOnlineScores = () => {
            this.lbScoreElements.forEach(el => el.destroy());
            this.lbScoreElements = [];
            onlineTab.setFillStyle(0x223344);
            onlineTabText.setColor('#00ffff');
            localTab.setFillStyle(0x111122);
            localTabText.setColor('#666688');

            const loading = this.add.text(width / 2, height / 2 - 30, 'Loading...', {
                fontSize: '16px', fontFamily: 'monospace', color: '#888888'
            }).setOrigin(0.5).setDepth(2002);
            this.lbScoreElements.push(loading);

            fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'top', limit: 10 })
            })
            .then(r => r.json())
            .then(data => {
                // Clear loading
                this.lbScoreElements.forEach(el => el.destroy());
                this.lbScoreElements = [];

                const entries = data.scores || [];
                if (entries.length === 0) {
                    const ns = this.add.text(width / 2, height / 2, 'NO ONLINE SCORES YET', {
                        fontSize: '16px', fontFamily: 'monospace', color: '#666666'
                    }).setOrigin(0.5).setDepth(2002);
                    this.lbScoreElements.push(ns);
                    return;
                }

                let yOff = -115;
                const pilotName = localStorage.getItem('fortune-pilot-name') || 'Pilot';
                entries.forEach((entry, i) => {
                    const c = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#ffffff';
                    const isYou = entry.name === pilotName;
                    const r = this.add.text(width / 2 - 160, height / 2 + yOff, `${i + 1}.`, {
                        fontSize: '16px', fontFamily: 'monospace', color: c
                    }).setOrigin(0, 0.5).setDepth(2002);
                    const n = this.add.text(width / 2 - 130, height / 2 + yOff, entry.name || '???', {
                        fontSize: '16px', fontFamily: 'monospace', color: isYou ? '#00ff00' : c
                    }).setOrigin(0, 0.5).setDepth(2002);
                    const s = this.add.text(width / 2 + 130, height / 2 + yOff, Number(entry.score).toLocaleString(), {
                        fontSize: '16px', fontFamily: 'monospace', color: c
                    }).setOrigin(1, 0.5).setDepth(2002);
                    this.lbScoreElements.push(r, n, s);
                    yOff += 28;
                });

                // Show player rank
                if (data.playerRank) {
                    const rankText = this.add.text(width / 2, height / 2 + yOff + 10, `You are #${data.playerRank}!`, {
                        fontSize: '16px', fontFamily: 'monospace', color: '#00ff00', fontStyle: 'bold'
                    }).setOrigin(0.5).setDepth(2002);
                    this.lbScoreElements.push(rankText);
                }
            })
            .catch(() => {
                this.lbScoreElements.forEach(el => el.destroy());
                this.lbScoreElements = [];
                const err = this.add.text(width / 2, height / 2, 'Could not load online scores', {
                    fontSize: '14px', fontFamily: 'monospace', color: '#ff4444'
                }).setOrigin(0.5).setDepth(2002);
                this.lbScoreElements.push(err);
            });
        };

        localTab.on('pointerdown', showLocalScores);
        onlineTab.on('pointerdown', showOnlineScores);

        // Show local by default
        showLocalScores();

        // Close button
        const closeButton = this.add.rectangle(width / 2, height / 2 + 190, 150, 40, 0x111122);
        closeButton.setInteractive({ useHandCursor: true }).setDepth(2002).setStrokeStyle(2, 0x00ffff);
        this.leaderboardElements.push(closeButton);

        const closeText = this.add.text(width / 2, height / 2 + 190, 'CLOSE', {
            fontSize: '18px', fontFamily: 'monospace', color: '#00ffff'
        }).setOrigin(0.5).setDepth(2003);
        this.leaderboardElements.push(closeText);

        closeButton.on('pointerover', () => { closeButton.setFillStyle(0x223344); this.playHoverSound(); });
        closeButton.on('pointerout', () => closeButton.setFillStyle(0x111122));
        closeButton.on('pointerdown', () => {
            this.playClickSound();
            this.lbScoreElements.forEach(el => el.destroy());
            this.leaderboardElements.forEach(el => el.destroy());
            this.leaderboardElements = [];
            this.lbScoreElements = [];
        });
    }

    getLeaderboard() {
        const scores = JSON.parse(localStorage.getItem('fortune_leaderboard') || '[]');
        return scores.sort((a, b) => b - a).slice(0, 10);
    }


    showAchievements() {
        const width = this.scale.width;
        const height = this.scale.height;
        const elements = [];

        // Load achievements from localStorage
        const saved = JSON.parse(localStorage.getItem('fortune-achievements') || '{}');
        const achievements = [
            { id: 'first_blood', name: 'First Blood', description: 'Kill your first enemy', icon: '🗡️' },
            { id: 'combo_5', name: 'Combo Starter', description: 'Get a 5x combo', icon: '🔥' },
            { id: 'combo_20', name: 'Combo King', description: 'Get a 20x combo', icon: '👑' },
            { id: 'wave_10', name: 'Survivor', description: 'Reach wave 10', icon: '🛡️' },
            { id: 'wave_25', name: 'Veteran', description: 'Reach wave 25', icon: '⭐' },
            { id: 'boss_slayer', name: 'Boss Slayer', description: 'Defeat your first boss', icon: '💀' },
            { id: 'no_hit_wave', name: 'Untouchable', description: 'Complete a wave without damage', icon: '✨' },
            { id: 'collector', name: 'Coin Collector', description: 'Collect 100 collectibles total', icon: '🪙' },
            { id: 'nuke_master', name: 'Nuclear Option', description: 'Use 3 screen nukes in one game', icon: '💣' },
            { id: 'speed_demon', name: 'Speed Demon', description: 'Kill 10 enemies in 5 seconds', icon: '⚡' },
            { id: 'mystery_lover', name: 'Mystery Lover', description: 'Catch 3 mystery boxes', icon: '🎁' },
            { id: 'survivor', name: 'Last Stand', description: 'Win a boss fight with <10% health', icon: '💪' }
        ];

        // Dark overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
        overlay.setDepth(2000);
        elements.push(overlay);

        // Panel
        const panel = this.add.rectangle(width / 2, height / 2, 550, 480, 0x0a0a1a);
        panel.setDepth(2001);
        panel.setStrokeStyle(3, 0xffa500);
        elements.push(panel);

        // Title
        const title = this.add.text(width / 2, height / 2 - 210, 'ACHIEVEMENTS', {
            fontSize: '28px',
            fontFamily: 'monospace',
            color: '#ffa500',
            stroke: '#000000',
            strokeThickness: 2
        });
        title.setOrigin(0.5);
        title.setDepth(2002);
        elements.push(title);

        // Count unlocked
        const unlockedCount = achievements.filter(a => saved[a.id]).length;
        const countText = this.add.text(width / 2, height / 2 - 185, `${unlockedCount} / ${achievements.length} unlocked`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#888888'
        });
        countText.setOrigin(0.5);
        countText.setDepth(2002);
        elements.push(countText);

        // Achievement grid (2 columns)
        const startX = width / 2 - 240;
        const startY = height / 2 - 155;
        const colWidth = 250;
        const rowHeight = 55;

        achievements.forEach((a, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = startX + col * colWidth;
            const y = startY + row * rowHeight;
            const unlocked = saved[a.id] || false;

            // Background card
            const cardColor = unlocked ? 0x1a2a1a : 0x1a1a2a;
            const card = this.add.rectangle(x + 115, y + 20, 235, 45, cardColor);
            card.setStrokeStyle(1, unlocked ? 0x44ff44 : 0x333344);
            card.setDepth(2002);
            elements.push(card);

            // Icon
            const icon = this.add.text(x + 12, y + 10, unlocked ? a.icon : '🔒', {
                fontSize: '20px'
            });
            icon.setDepth(2003);
            elements.push(icon);

            // Name
            const nameText = this.add.text(x + 40, y + 7, a.name, {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: unlocked ? '#ffffff' : '#555555',
                fontStyle: 'bold'
            });
            nameText.setDepth(2003);
            elements.push(nameText);

            // Description
            const desc = this.add.text(x + 40, y + 24, a.description, {
                fontSize: '10px',
                fontFamily: 'monospace',
                color: unlocked ? '#88ff88' : '#444444'
            });
            desc.setDepth(2003);
            elements.push(desc);
        });

        // Close button
        const closeBtn = this.add.rectangle(width / 2, height / 2 + 210, 120, 40, 0x111122);
        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.setDepth(2002);
        closeBtn.setStrokeStyle(2, 0xffa500);
        elements.push(closeBtn);

        const closeText = this.add.text(width / 2, height / 2 + 210, 'CLOSE', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffa500'
        });
        closeText.setOrigin(0.5);
        closeText.setDepth(2003);
        elements.push(closeText);

        closeBtn.on('pointerover', () => { closeBtn.setFillStyle(0x223344); this.playHoverSound(); });
        closeBtn.on('pointerout', () => { closeBtn.setFillStyle(0x111122); });
        closeBtn.on('pointerdown', () => {
            this.playClickSound();
            elements.forEach(el => { if (el && el.destroy) el.destroy(); });
        });
    }

    showRidhaanPrompt() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Dim overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        overlay.setDepth(2000);

        // Question text
        const questionText = this.add.text(width / 2, height / 2 - 60, 'Is this Ridhaan? 🎮', {
            fontSize: '28px',
            fontFamily: 'monospace',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        questionText.setOrigin(0.5);
        questionText.setDepth(2001);

        // Yes button
        const yesBtn = this.add.text(width / 2 - 80, height / 2 + 20, '✅ YES!', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 3,
            backgroundColor: '#003300',
            padding: { x: 15, y: 10 }
        });
        yesBtn.setOrigin(0.5);
        yesBtn.setDepth(2001);
        yesBtn.setInteractive({ useHandCursor: true });

        // No button
        const noBtn = this.add.text(width / 2 + 80, height / 2 + 20, '❌ Nope', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ff6666',
            stroke: '#000000',
            strokeThickness: 3,
            backgroundColor: '#330000',
            padding: { x: 15, y: 10 }
        });
        noBtn.setOrigin(0.5);
        noBtn.setDepth(2001);
        noBtn.setInteractive({ useHandCursor: true });

        // Yes → fetch personal message, show it, then start game
        yesBtn.on('pointerdown', () => {
            fetch('/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'confirm_ridhaan' })
            })
            .then(r => r.json())
            .then(data => {
                // Clear prompt
                overlay.destroy();
                questionText.destroy();
                yesBtn.destroy();
                noBtn.destroy();

                // Show personal message
                const msg = this.add.text(width / 2, height / 2, data.message || 'Have fun! 🚀', {
                    fontSize: '22px',
                    fontFamily: 'monospace',
                    color: '#ffd700',
                    stroke: '#000000',
                    strokeThickness: 4,
                    align: 'center',
                    wordWrap: { width: width - 80 }
                });
                msg.setOrigin(0.5);
                msg.setDepth(2001);

                // Create chat box for Ridhaan
                if (!window.chatBox) {
                    window.chatBox = new ChatBox();
                }

                // Start game after showing message
                this.time.delayedCall(3000, () => {
                    this.scene.start('GameScene');
                });
            })
            .catch(() => {
                this.scene.start('GameScene');
            });
        });

        // No → just start the game
        noBtn.on('pointerdown', () => {
            overlay.destroy();
            questionText.destroy();
            yesBtn.destroy();
            noBtn.destroy();
            this.scene.start('GameScene');
        });
    }

    showPetsOverlay() {
        const width = this.scale.width;
        const height = this.scale.height;
        const elements = [];

        const xpManager = new XPManager();
        const playerLevel = xpManager.getLevel();
        const selectedPet = localStorage.getItem('fortune-selected-pet') || '';
        const achievementRewards = JSON.parse(localStorage.getItem('fortune-achievement-rewards') || '{}');

        // Dark overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
        overlay.setDepth(2000);
        elements.push(overlay);

        // Panel
        const panel = this.add.rectangle(width / 2, height / 2, 520, 400, 0x0a0a1a);
        panel.setDepth(2001);
        panel.setStrokeStyle(3, 0xff88ff);
        elements.push(panel);

        // Title
        const title = this.add.text(width / 2, height / 2 - 170, 'SPACE PETS', {
            fontSize: '28px',
            fontFamily: 'monospace',
            color: '#ff88ff',
            stroke: '#000000',
            strokeThickness: 2
        });
        title.setOrigin(0.5);
        title.setDepth(2002);
        elements.push(title);

        const subtitle = this.add.text(width / 2, height / 2 - 145, 'Choose a companion to help you fight!', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#888888'
        });
        subtitle.setOrigin(0.5);
        subtitle.setDepth(2002);
        elements.push(subtitle);

        // Pet cards
        const petIds = Object.keys(PET_CONFIG);
        const startX = width / 2 - 190;
        const petY = height / 2 - 40;

        petIds.forEach((id, i) => {
            const config = PET_CONFIG[id];
            const x = startX + i * 100;

            // Check unlock: level requirement OR first_blood unlocks star_buddy
            let isUnlocked = playerLevel >= config.unlockLevel;
            if (id === 'star_buddy' && achievementRewards.first_blood) {
                isUnlocked = true;
            }
            const isSelected = id === selectedPet;

            // Card
            const cardColor = isSelected ? 0x334455 : 0x1a1a2e;
            const card = this.add.rectangle(x, petY, 85, 130, cardColor);
            card.setStrokeStyle(2, isSelected ? 0xff88ff : (isUnlocked ? 0x444466 : 0x333333));
            card.setDepth(2002);
            elements.push(card);

            if (isSelected) {
                const glow = this.add.rectangle(x, petY, 91, 136);
                glow.setStrokeStyle(3, 0xff88ff);
                glow.setDepth(2001);
                elements.push(glow);
                this.tweens.add({
                    targets: glow,
                    alpha: { from: 1, to: 0.3 },
                    duration: 800,
                    yoyo: true,
                    repeat: -1
                });
            }

            // Pet preview (simple colored circle)
            const previewColor = isUnlocked ? config.color : 0x333333;
            const preview = this.add.circle(x, petY - 30, 15, previewColor, isUnlocked ? 0.9 : 0.3);
            preview.setDepth(2003);
            elements.push(preview);

            // Cat ears for space cat
            if (id === 'space_cat' && isUnlocked) {
                const earL = this.add.triangle(x - 10, petY - 45, 0, 8, 5, 0, 10, 8, previewColor, 0.9);
                earL.setDepth(2003);
                elements.push(earL);
                const earR = this.add.triangle(x + 10, petY - 45, 0, 8, 5, 0, 10, 8, previewColor, 0.9);
                earR.setDepth(2003);
                elements.push(earR);
            }

            if (!isUnlocked) {
                const lock = this.add.text(x, petY - 30, '🔒', { fontSize: '16px' });
                lock.setOrigin(0.5);
                lock.setDepth(2004);
                elements.push(lock);
            }

            // Name
            const nameText = this.add.text(x, petY + 10, config.name, {
                fontSize: '9px',
                fontFamily: 'monospace',
                color: isUnlocked ? '#ffffff' : '#666666',
                align: 'center',
                wordWrap: { width: 80 }
            });
            nameText.setOrigin(0.5);
            nameText.setDepth(2003);
            elements.push(nameText);

            // Ability description
            const descText = this.add.text(x, petY + 30, config.description, {
                fontSize: '8px',
                fontFamily: 'monospace',
                color: isUnlocked ? '#88ff88' : '#555555',
                align: 'center',
                wordWrap: { width: 80 }
            });
            descText.setOrigin(0.5);
            descText.setDepth(2003);
            elements.push(descText);

            // Unlock requirement or EQUIPPED
            let infoStr = '';
            if (!isUnlocked) {
                infoStr = `Lv.${config.unlockLevel}`;
            } else if (isSelected) {
                infoStr = 'EQUIPPED';
            }
            const info = this.add.text(x, petY + 50, infoStr, {
                fontSize: '9px',
                fontFamily: 'monospace',
                color: isSelected ? '#ff88ff' : '#888888'
            });
            info.setOrigin(0.5);
            info.setDepth(2003);
            elements.push(info);

            // Click to select/deselect
            if (isUnlocked) {
                card.setInteractive({ useHandCursor: true });
                card.on('pointerdown', () => {
                    this.playClickSound();
                    if (isSelected) {
                        localStorage.removeItem('fortune-selected-pet');
                    } else {
                        localStorage.setItem('fortune-selected-pet', id);
                    }
                    elements.forEach(el => { if (el && el.destroy) el.destroy(); });
                    this.showPetsOverlay();
                });
                card.on('pointerover', () => {
                    card.setFillStyle(0x334455);
                    this.playHoverSound();
                });
                card.on('pointerout', () => {
                    card.setFillStyle(isSelected ? 0x334455 : 0x1a1a2e);
                });
            }
        });

        // Current level info
        const lvlInfo = this.add.text(width / 2, height / 2 + 100, `Your Level: ${playerLevel}`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#888888'
        });
        lvlInfo.setOrigin(0.5);
        lvlInfo.setDepth(2002);
        elements.push(lvlInfo);

        // None option
        const noneBtn = this.add.rectangle(width / 2, height / 2 + 130, 100, 30, selectedPet ? 0x1a1a2e : 0x334455);
        noneBtn.setStrokeStyle(1, 0x888888);
        noneBtn.setInteractive({ useHandCursor: true });
        noneBtn.setDepth(2002);
        elements.push(noneBtn);

        const noneText = this.add.text(width / 2, height / 2 + 130, 'NO PET', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: selectedPet ? '#888888' : '#ffffff'
        });
        noneText.setOrigin(0.5);
        noneText.setDepth(2003);
        elements.push(noneText);

        noneBtn.on('pointerdown', () => {
            this.playClickSound();
            localStorage.removeItem('fortune-selected-pet');
            elements.forEach(el => { if (el && el.destroy) el.destroy(); });
            this.showPetsOverlay();
        });

        // Close button
        const closeBtn = this.add.rectangle(width / 2, height / 2 + 165, 120, 40, 0x111122);
        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.setDepth(2002);
        closeBtn.setStrokeStyle(2, 0xff88ff);
        elements.push(closeBtn);

        const closeText = this.add.text(width / 2, height / 2 + 165, 'CLOSE', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ff88ff'
        });
        closeText.setOrigin(0.5);
        closeText.setDepth(2003);
        elements.push(closeText);

        closeBtn.on('pointerover', () => { closeBtn.setFillStyle(0x223344); this.playHoverSound(); });
        closeBtn.on('pointerout', () => { closeBtn.setFillStyle(0x111122); });
        closeBtn.on('pointerdown', () => {
            this.playClickSound();
            elements.forEach(el => { if (el && el.destroy) el.destroy(); });
        });
    }
}

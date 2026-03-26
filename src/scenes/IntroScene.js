import Phaser from 'phaser';

export default class IntroScene extends Phaser.Scene {
    constructor() {
        super({ key: 'IntroScene' });
    }

    init(data) {
        // If called from menu replay, force show
        this.forceShow = data && data.replay;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Check if first play
        const firstPlay = !localStorage.getItem('fortune-first-play');
        if (!firstPlay && !this.forceShow) {
            this.scene.start('MenuScene');
            return;
        }

        this.cameras.main.fadeIn(500, 0, 0, 0);

        // Create starfield background
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 2),
                0xffffff,
                Math.random() * 0.6 + 0.2
            );
            star.setDepth(0);
            this.stars.push(star);
        }

        // Animate stars drifting
        this.time.addEvent({
            delay: 50,
            loop: true,
            callback: () => {
                for (const star of this.stars) {
                    star.y += 0.5;
                    if (star.y > height) {
                        star.y = 0;
                        star.x = Phaser.Math.Between(0, width);
                    }
                }
            }
        });

        this.slideIndex = 0;

        this.slides = [
            {
                text: 'The year is 3026.\nEarth is under attack!',
                color: '#ff4444',
                size: '28px'
            },
            {
                text: 'Only one pilot\ncan save us...',
                color: '#00ffff',
                size: '28px'
            },
            {
                text: null, // Name input slide
                color: '#ffd700',
                size: '28px'
            }
        ];

        // Container for slide content
        this.slideContainer = this.add.container(0, 0);
        this.slideContainer.setDepth(10);

        this.showSlide(0);

        // Skip hint
        this.skipText = this.add.text(width / 2, height - 30, 'Click or tap to continue', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#555555'
        }).setOrigin(0.5).setDepth(10);

        this.tweens.add({
            targets: this.skipText,
            alpha: { from: 1, to: 0.3 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Click to advance
        this.input.on('pointerdown', () => this.advanceSlide());
        this.input.keyboard.on('keydown-SPACE', () => this.advanceSlide());
        this.input.keyboard.on('keydown-ENTER', () => this.advanceSlide());
    }

    showSlide(index) {
        // Clear previous
        this.slideContainer.removeAll(true);

        const width = this.scale.width;
        const height = this.scale.height;
        const slide = this.slides[index];

        if (index === 2) {
            // Name input slide
            this.showNameInput();
            return;
        }

        const text = this.add.text(width / 2, height / 2 - 20, slide.text, {
            fontSize: slide.size,
            fontFamily: 'monospace',
            color: slide.color,
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3,
            lineSpacing: 12
        }).setOrigin(0.5);

        text.setAlpha(0);
        this.slideContainer.add(text);

        this.tweens.add({
            targets: text,
            alpha: 1,
            y: height / 2 - 30,
            duration: 600,
            ease: 'Power2'
        });

        // Dramatic effect for slide 1
        if (index === 0) {
            this.cameras.main.shake(300, 0.008);
        }
    }

    showNameInput() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Disable click-to-advance while on name input
        this.onNameSlide = true;

        const prompt = this.add.text(width / 2, height / 2 - 80, 'YOU.\nCommander...', {
            fontSize: '28px',
            fontFamily: 'monospace',
            color: '#ffd700',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3,
            lineSpacing: 12
        }).setOrigin(0.5);
        prompt.setAlpha(0);
        this.slideContainer.add(prompt);

        this.tweens.add({
            targets: prompt,
            alpha: 1,
            duration: 600,
            ease: 'Power2'
        });

        // Create HTML input for name
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.placeholder = 'Enter your name...';
        inputElement.maxLength = 16;
        inputElement.style.cssText = `
            position: absolute;
            width: 220px;
            padding: 10px 16px;
            font-family: monospace;
            font-size: 18px;
            color: #00ffff;
            background: #111133;
            border: 2px solid #00ffff;
            border-radius: 4px;
            text-align: center;
            outline: none;
            z-index: 1000;
        `;

        // Position the input over the canvas
        const canvas = this.game.canvas;
        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width / width;
        const scaleY = rect.height / height;
        const inputX = rect.left + (width / 2) * scaleX - 126;
        const inputY = rect.top + (height / 2) * scaleY - 10;
        inputElement.style.left = inputX + 'px';
        inputElement.style.top = inputY + 'px';

        document.body.appendChild(inputElement);
        this.nameInput = inputElement;

        // Focus after a brief delay
        this.time.delayedCall(400, () => {
            inputElement.focus();
        });

        // GO button
        const goBtn = this.add.rectangle(width / 2, height / 2 + 60, 180, 45, 0x00ff00);
        goBtn.setInteractive({ useHandCursor: true });
        goBtn.setAlpha(0);
        this.slideContainer.add(goBtn);

        const goText = this.add.text(width / 2, height / 2 + 60, 'LAUNCH!', {
            fontSize: '22px',
            fontFamily: 'monospace',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);
        this.slideContainer.add(goText);

        this.tweens.add({
            targets: [goBtn, goText],
            alpha: 1,
            duration: 400,
            delay: 600
        });

        goBtn.on('pointerover', () => {
            goBtn.setFillStyle(0x44ff44);
            goBtn.setScale(1.05);
        });
        goBtn.on('pointerout', () => {
            goBtn.setFillStyle(0x00ff00);
            goBtn.setScale(1);
        });
        goBtn.on('pointerdown', () => this.finishIntro());

        // Enter key also finishes
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.enterKey.on('down', () => this.finishIntro());
    }

    finishIntro() {
        if (this.finished) return;
        this.finished = true;

        // Get name
        let name = 'Pilot';
        if (this.nameInput) {
            const val = this.nameInput.value.trim();
            if (val.length > 0) name = val;
            this.nameInput.remove();
            this.nameInput = null;
        }

        // Store
        localStorage.setItem('fortune-pilot-name', name);
        localStorage.setItem('fortune-first-play', '1');

        // Transition to menu
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MenuScene');
        });
    }

    advanceSlide() {
        if (this.onNameSlide) return;
        if (this.finished) return;

        this.slideIndex++;
        if (this.slideIndex >= this.slides.length) {
            return;
        }

        this.showSlide(this.slideIndex);
    }

    shutdown() {
        // Cleanup HTML input if still present
        if (this.nameInput) {
            this.nameInput.remove();
            this.nameInput = null;
        }
    }
}

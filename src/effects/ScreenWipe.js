import Phaser from 'phaser';

export default class ScreenWipe {
    // Horizontal wipe: black bar sweeps left to right
    static horizontalWipe(scene, duration = 800, callback = null) {
        const width = scene.scale.width;
        const height = scene.scale.height;

        const bar = scene.add.rectangle(-width, height / 2, width, height, 0x000000);
        bar.setDepth(5000);

        scene.tweens.add({
            targets: bar,
            x: width / 2,
            duration: duration / 2,
            ease: 'Power2',
            onComplete: () => {
                scene.tweens.add({
                    targets: bar,
                    x: width * 1.5,
                    duration: duration / 2,
                    ease: 'Power2',
                    onComplete: () => {
                        bar.destroy();
                        if (callback) callback();
                    }
                });
            }
        });
    }

    // Circular reveal: circle grows from center outward
    static circularReveal(scene, duration = 1000, callback = null) {
        const width = scene.scale.width;
        const height = scene.scale.height;
        const maxRadius = Math.sqrt(width * width + height * height) / 2;

        // Full screen black overlay
        const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000);
        overlay.setDepth(5000);

        // Create a circle that acts as a "hole" - we'll fake this with a ring
        const circle = scene.add.circle(width / 2, height / 2, 1, 0x000000);
        circle.setDepth(5001);
        circle.setStrokeStyle(maxRadius, 0x000000);

        // Grow the clear area by shrinking the stroke
        scene.tweens.add({
            targets: circle,
            radius: maxRadius,
            duration: duration * 0.4,
            ease: 'Power2',
            onUpdate: () => {
                const remaining = Math.max(0, maxRadius - circle.radius);
                circle.setStrokeStyle(remaining, 0x000000);
            },
            onComplete: () => {
                overlay.destroy();
                circle.destroy();
                if (callback) callback();
            }
        });

        // Fade overlay out as circle grows
        scene.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: duration * 0.5,
            delay: duration * 0.2
        });
    }

    // Pixelate: screen briefly covered by large rectangles then clears
    static pixelate(scene, duration = 800, callback = null) {
        const width = scene.scale.width;
        const height = scene.scale.height;
        const blockSize = 40;
        const cols = Math.ceil(width / blockSize);
        const rows = Math.ceil(height / blockSize);
        const blocks = [];

        // Create grid of blocks with staggered appearance
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * blockSize + blockSize / 2;
                const y = r * blockSize + blockSize / 2;
                const block = scene.add.rectangle(x, y, blockSize, blockSize, 0x000000, 0);
                block.setDepth(5000);
                blocks.push(block);

                const delay = (r + c) * 15;

                // Fade in
                scene.tweens.add({
                    targets: block,
                    alpha: 1,
                    duration: duration * 0.3,
                    delay: delay,
                });
            }
        }

        // Then fade all out
        scene.time.delayedCall(duration * 0.5, () => {
            blocks.forEach((block, i) => {
                const delay = i * 5;
                scene.tweens.add({
                    targets: block,
                    alpha: 0,
                    duration: duration * 0.3,
                    delay: delay,
                    onComplete: () => block.destroy()
                });
            });

            scene.time.delayedCall(duration * 0.4 + blocks.length * 5, () => {
                if (callback) callback();
            });
        });
    }

    // Standard fade
    static fade(scene, duration = 600, callback = null) {
        const width = scene.scale.width;
        const height = scene.scale.height;

        const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
        overlay.setDepth(5000);

        scene.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: duration / 2,
            yoyo: true,
            onComplete: () => {
                overlay.destroy();
                if (callback) callback();
            }
        });
    }

    // Pick a random wipe effect
    static random(scene, duration = 800, callback = null) {
        const effects = [
            ScreenWipe.horizontalWipe,
            ScreenWipe.circularReveal,
            ScreenWipe.pixelate,
            ScreenWipe.fade
        ];
        const chosen = effects[Math.floor(Math.random() * effects.length)];
        chosen(scene, duration, callback);
    }
}

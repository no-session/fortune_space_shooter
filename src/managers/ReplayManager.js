// Ghost Replay Manager
// Records player movement/shooting data and plays back as a ghost ship

export default class ReplayManager {
    constructor() {
        this.recording = [];
        this.recordInterval = 100; // ms between snapshots
        this.maxDataPoints = 900; // ~90 seconds
        this.lastRecordTime = 0;
        this.storageKey = 'fortune-ghost-replay';
    }

    // Called every frame during gameplay, records at 100ms intervals
    record(player, time) {
        if (!player || !player.active) return;
        if (time - this.lastRecordTime < this.recordInterval) return;

        this.lastRecordTime = time;

        this.recording.push({
            x: Math.round(player.x),
            y: Math.round(player.y),
            shooting: player.isFiring,
            frame: player.currentFrame,
            t: time
        });

        // Keep only last maxDataPoints
        if (this.recording.length > this.maxDataPoints) {
            this.recording.shift();
        }
    }

    // Save recording to localStorage
    save() {
        if (this.recording.length === 0) return;
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.recording));
        } catch (e) {
            // Storage full or unavailable
        }
    }

    // Get saved replay data
    getReplay() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    // Returns true if a replay exists
    hasReplay() {
        return !!localStorage.getItem(this.storageKey);
    }

    // Play replay in a scene — creates a ghost ship and animates through data
    playReplay(scene, onComplete) {
        const data = this.getReplay();
        if (!data || data.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        // Create ghost ship sprite (semi-transparent, cyan-tinted)
        const firstFrame = data[0];
        const ghost = scene.add.image(firstFrame.x, firstFrame.y, firstFrame.frame || 'player_m');
        ghost.setScale(0.8);
        ghost.setAlpha(0.4);
        ghost.setTint(0x00ffff);
        ghost.setDepth(100);

        // Ghost trail effect
        let trailTimer = 0;

        // Label
        const label = scene.add.text(firstFrame.x, firstFrame.y - 35, 'GHOST', {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#00ffff'
        });
        label.setOrigin(0.5);
        label.setAlpha(0.5);
        label.setDepth(101);

        let index = 0;
        const startTime = data[0].t;

        const replayEvent = scene.time.addEvent({
            delay: this.recordInterval,
            loop: true,
            callback: () => {
                if (index >= data.length) {
                    // Replay complete
                    scene.tweens.add({
                        targets: [ghost, label],
                        alpha: 0,
                        duration: 500,
                        onComplete: () => {
                            ghost.destroy();
                            label.destroy();
                            replayEvent.destroy();
                            if (onComplete) onComplete();
                        }
                    });
                    return;
                }

                const point = data[index];
                ghost.setPosition(point.x, point.y);
                label.setPosition(point.x, point.y - 35);

                // Update frame
                if (point.frame && scene.textures.exists(point.frame)) {
                    ghost.setTexture(point.frame);
                }

                // Shooting indicator (flash brighter)
                if (point.shooting) {
                    ghost.setAlpha(0.6);
                    // Small muzzle flash
                    const flash = scene.add.circle(point.x, point.y - 20, 3, 0x00ffff, 0.6);
                    flash.setDepth(99);
                    scene.tweens.add({
                        targets: flash,
                        alpha: 0,
                        y: flash.y - 15,
                        duration: 150,
                        onComplete: () => flash.destroy()
                    });
                } else {
                    ghost.setAlpha(0.4);
                }

                // Ghost trail every 3rd frame
                trailTimer++;
                if (trailTimer % 3 === 0) {
                    const trail = scene.add.image(point.x, point.y, point.frame || 'player_m');
                    trail.setScale(0.8);
                    trail.setAlpha(0.15);
                    trail.setTint(0x00ffff);
                    trail.setDepth(99);
                    scene.tweens.add({
                        targets: trail,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => trail.destroy()
                    });
                }

                index++;
            }
        });

        // Return control object for cleanup
        return {
            stop: () => {
                replayEvent.destroy();
                ghost.destroy();
                label.destroy();
            }
        };
    }
}

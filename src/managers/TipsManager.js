// Dynamic Tips Manager
// Shows contextual helpful tips during gameplay for new/struggling players

const TIPS = {
    lowHealth: [
        'Try to collect health power-ups! They have a green glow.',
        'Stay near the top of the screen to dodge enemy fire.',
        'Shield power-ups (S) absorb 3 hits. Grab them!'
    ],
    died: [
        'You are invincible for 2 seconds after respawning. Use that time!',
        'Use WASD or Arrow Keys to dodge between bullets.',
        'Try staying in the center for more escape routes.'
    ],
    lowCombo: [
        'Collect coins quickly to build combos for bonus points!',
        'Combos give +10% score per level. Chain those pickups!',
        'Magnet power-ups (M) pull items to you automatically.'
    ],
    noWeaponSwitch: [
        'Press Q to try different weapons. Laser is great for bosses!',
        'Wave weapon fires sine-wave bullets. Try pressing Q!',
        'Each weapon type has different strengths. Experiment!'
    ],
    boss: [
        'Focus fire on the boss and dodge the bullet patterns!',
        'Bosses have 3 phases. They get faster as health drops.',
        'Save your screen nukes (N) for boss fights!'
    ],
    general: [
        'Graze enemy bullets for +25 bonus points per near-miss!',
        'Collect 3 of the same item in a row for a chain bonus!',
        'Perfect waves (no damage) give +1000 bonus points.'
    ]
};

export default class TipsManager {
    constructor(scene) {
        this.scene = scene;
        this.lastTipTime = 0;
        this.tipCooldown = 45000; // 45 seconds between tips
        this.shownTips = new Set();
        this.lastDeathTime = 0;
        this.weaponSwitchUsed = false;
        this.tipText = null;
        this.active = false;
    }

    shouldShowTips() {
        // Only show for new players (< 10 games) or EASY difficulty
        const gamesPlayed = parseInt(localStorage.getItem('fortune-games-played') || '0', 10);
        const difficulty = localStorage.getItem('fortune-difficulty') || 'NORMAL';
        return gamesPlayed < 10 || difficulty === 'EASY';
    }

    onPlayerDeath() {
        this.lastDeathTime = Date.now();
    }

    onWeaponSwitch() {
        this.weaponSwitchUsed = true;
    }

    update(time) {
        if (!this.shouldShowTips()) return;
        if (this.active) return;
        if (time - this.lastTipTime < this.tipCooldown) return;

        const player = this.scene.player;
        if (!player || !player.active) return;

        const tip = this.selectTip(player, time);
        if (tip) {
            this.showTip(tip);
            this.lastTipTime = time;
        }
    }

    selectTip(player, time) {
        const healthPct = player.health / player.maxHealth;
        const recentDeath = (Date.now() - this.lastDeathTime) < 10000;
        const combo = this.scene.scoreManager ? this.scene.scoreManager.getCombo() : 0;
        const isBossWave = this.scene.waveManager ? this.scene.waveManager.isBossWave() : false;

        let category;
        if (isBossWave) {
            category = 'boss';
        } else if (recentDeath) {
            category = 'died';
        } else if (healthPct < 0.5) {
            category = 'lowHealth';
        } else if (combo === 0) {
            category = 'lowCombo';
        } else if (!this.weaponSwitchUsed && this.scene.waveManager &&
                   this.scene.waveManager.getCurrentWave() >= 3) {
            category = 'noWeaponSwitch';
        } else {
            category = 'general';
        }

        const tips = TIPS[category];
        // Try to find an unshown tip
        const unshown = tips.filter(t => !this.shownTips.has(t));
        if (unshown.length > 0) {
            const tip = unshown[Math.floor(Math.random() * unshown.length)];
            this.shownTips.add(tip);
            return tip;
        }

        // All shown, pick random
        return tips[Math.floor(Math.random() * tips.length)];
    }

    showTip(text) {
        if (this.tipText) {
            this.tipText.destroy();
            this.tipText = null;
        }

        this.active = true;
        const width = this.scene.scale.width;

        this.tipText = this.scene.add.text(width / 2, this.scene.scale.height - 30, text, {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#88ccff',
            stroke: '#000000',
            strokeThickness: 2,
            fontStyle: 'italic',
            wordWrap: { width: width - 40 },
            align: 'center'
        });
        this.tipText.setOrigin(0.5, 1);
        this.tipText.setDepth(1005);
        this.tipText.setAlpha(0);

        // Fade in
        this.scene.tweens.add({
            targets: this.tipText,
            alpha: 0.9,
            duration: 500,
            onComplete: () => {
                // Stay for 4 seconds, then fade out
                this.scene.time.delayedCall(4000, () => {
                    if (this.tipText) {
                        this.scene.tweens.add({
                            targets: this.tipText,
                            alpha: 0,
                            duration: 500,
                            onComplete: () => {
                                if (this.tipText) {
                                    this.tipText.destroy();
                                    this.tipText = null;
                                }
                                this.active = false;
                            }
                        });
                    } else {
                        this.active = false;
                    }
                });
            }
        });
    }

    destroy() {
        if (this.tipText) {
            this.tipText.destroy();
            this.tipText = null;
        }
    }
}

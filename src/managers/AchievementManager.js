const ACHIEVEMENTS = [
    { id: 'first_blood', name: 'First Blood', description: 'Kill your first enemy', icon: '🗡️' },
    { id: 'combo_5', name: 'Combo Starter', description: 'Get a 5x combo', icon: '🔥' },
    { id: 'combo_20', name: 'Combo King', description: 'Get a 20x combo', icon: '👑' },
    { id: 'wave_10', name: 'Survivor', description: 'Reach wave 10', icon: '🛡️' },
    { id: 'wave_25', name: 'Veteran', description: 'Reach wave 25', icon: '⭐' },
    { id: 'boss_slayer', name: 'Boss Slayer', description: 'Defeat your first boss', icon: '💀' },
    { id: 'no_hit_wave', name: 'Untouchable', description: 'Complete a wave without taking damage', icon: '✨' },
    { id: 'collector', name: 'Coin Collector', description: 'Collect 100 collectibles total', icon: '🪙' },
    { id: 'nuke_master', name: 'Nuclear Option', description: 'Use 3 screen nukes in one game', icon: '💣' },
    { id: 'speed_demon', name: 'Speed Demon', description: 'Kill 10 enemies in 5 seconds', icon: '⚡' },
    { id: 'mystery_lover', name: 'Mystery Lover', description: 'Catch 3 mystery boxes', icon: '🎁' },
    { id: 'survivor', name: 'Last Stand', description: 'Win a boss fight with less than 10% health', icon: '💪' }
];

export default class AchievementManager {
    constructor(scene) {
        this.scene = scene;
        this.achievements = this.load();
        this.sessionUnlocked = [];

        // Tracking stats for this game session
        this.nukesUsed = 0;
        this.mysteryBoxesCaught = 0;
        this.recentKillTimes = []; // timestamps of recent kills for speed_demon
        this.totalCollectiblesAllTime = this.loadTotalCollectibles();
    }

    load() {
        const saved = JSON.parse(localStorage.getItem('fortune-achievements') || '{}');
        const result = {};
        ACHIEVEMENTS.forEach(a => {
            result[a.id] = {
                ...a,
                unlocked: saved[a.id] || false
            };
        });
        return result;
    }

    save() {
        const data = {};
        Object.keys(this.achievements).forEach(id => {
            if (this.achievements[id].unlocked) {
                data[id] = true;
            }
        });
        localStorage.setItem('fortune-achievements', JSON.stringify(data));
    }

    loadTotalCollectibles() {
        return parseInt(localStorage.getItem('fortune-total-collectibles') || '0', 10);
    }

    saveTotalCollectibles() {
        localStorage.setItem('fortune-total-collectibles', this.totalCollectiblesAllTime.toString());
    }

    unlock(id) {
        if (!this.achievements[id] || this.achievements[id].unlocked) return;
        this.achievements[id].unlocked = true;
        this.sessionUnlocked.push(this.achievements[id]);
        this.save();
        this.showToast(this.achievements[id]);
    }

    showToast(achievement) {
        // Create DOM-based toast notification that shows above the game
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: -80px;
            right: 20px;
            background: linear-gradient(135deg, #ffd700, #ffaa00);
            color: #000;
            padding: 12px 20px;
            border-radius: 10px;
            font-family: monospace;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(255, 215, 0, 0.5);
            transition: top 0.4s ease-out;
            min-width: 250px;
            border: 2px solid #fff;
        `;
        toast.innerHTML = `
            <div style="font-size: 20px; margin-bottom: 4px;">${achievement.icon} ${achievement.name}</div>
            <div style="font-size: 12px; color: #333;">${achievement.description}</div>
            <div style="font-size: 10px; color: #555; margin-top: 2px;">ACHIEVEMENT UNLOCKED!</div>
        `;
        document.body.appendChild(toast);

        // Slide in
        requestAnimationFrame(() => {
            toast.style.top = '20px';
        });

        // Play sound if available
        if (this.scene && this.scene.soundManager) {
            this.scene.soundManager.playCollect();
        }

        // Slide out after 3 seconds
        setTimeout(() => {
            toast.style.top = '-80px';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 400);
        }, 3000);
    }

    // --- Check methods called from GameScene ---

    onEnemyKilled() {
        // First blood
        this.unlock('first_blood');

        // Speed demon tracking
        const now = Date.now();
        this.recentKillTimes.push(now);
        // Keep only kills within last 5 seconds
        this.recentKillTimes = this.recentKillTimes.filter(t => now - t <= 5000);
        if (this.recentKillTimes.length >= 10) {
            this.unlock('speed_demon');
        }
    }

    onComboChanged(comboLevel) {
        if (comboLevel >= 5) this.unlock('combo_5');
        if (comboLevel >= 20) this.unlock('combo_20');
    }

    onWaveStart(waveNumber) {
        if (waveNumber >= 10) this.unlock('wave_10');
        if (waveNumber >= 25) this.unlock('wave_25');
    }

    onBossDefeated(playerHealthPercent) {
        this.unlock('boss_slayer');
        if (playerHealthPercent < 0.1) {
            this.unlock('survivor');
        }
    }

    onWaveCompletedNoDamage() {
        this.unlock('no_hit_wave');
    }

    onCollectibleCollected() {
        this.totalCollectiblesAllTime++;
        this.saveTotalCollectibles();
        if (this.totalCollectiblesAllTime >= 100) {
            this.unlock('collector');
        }
    }

    onNukeUsed() {
        this.nukesUsed++;
        if (this.nukesUsed >= 3) {
            this.unlock('nuke_master');
        }
    }

    onMysteryBoxCaught() {
        this.mysteryBoxesCaught++;
        if (this.mysteryBoxesCaught >= 3) {
            this.unlock('mystery_lover');
        }
    }

    getSessionUnlocked() {
        return this.sessionUnlocked;
    }

    getAllAchievements() {
        return Object.values(this.achievements);
    }
}

export { ACHIEVEMENTS };

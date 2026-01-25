export default class ScoreManager {
    constructor(scene) {
        this.scene = scene;
        this.score = 0;
        this.combo = 0;
        this.comboMultiplier = 1;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.comboTimeout = 2000; // 2 seconds to maintain combo

        // Collectible chain tracking
        this.lastCollectibleTime = 0;
        this.collectibleChainWindow = 1000; // 1 second window

        // Collectible count tracking
        this.collectiblesCollected = 0;
        this.collectiblesByType = {
            coin: 0,
            crystal: 0,
            star: 0,
            fortune_coin: 0
        };

        // Kill tracking
        this.enemiesKilled = 0;

        // Bonus tracking
        this.bonusesEarned = {
            waveClear: 0,
            accuracy: 0,
            graze: 0
        };
    }

    addScore(points) {
        const finalPoints = Math.floor(points * this.comboMultiplier);
        this.score += finalPoints;
        this.updateCombo();
        return finalPoints;
    }

    addEnemyKill(points) {
        this.enemiesKilled++;
        return this.addScore(points);
    }

    // Add kill with streak multiplier
    addKillScore(basePoints, streakMultiplier = 1) {
        this.enemiesKilled++;
        const finalPoints = Math.floor(basePoints * streakMultiplier * this.comboMultiplier);
        this.score += finalPoints;
        return finalPoints;
    }

    // Add bonus score (wave clear, accuracy, graze)
    addBonusScore(points, bonusType = 'generic') {
        this.score += points;
        if (this.bonusesEarned[bonusType] !== undefined) {
            this.bonusesEarned[bonusType] += points;
        }
        return points;
    }

    addCollectible(value, time, type = 'coin') {
        // Track collectible count
        this.collectiblesCollected++;
        if (this.collectiblesByType[type] !== undefined) {
            this.collectiblesByType[type]++;
        }

        // Check if within combo window
        if (time - this.lastCollectibleTime < this.collectibleChainWindow) {
            this.combo++;
            this.comboMultiplier = 1 + (this.combo * 0.1); // 10% per combo
            this.comboTimer = this.comboTimeout;
        } else {
            // Reset combo if too much time passed
            this.combo = 1;
            this.comboMultiplier = 1.1;
            this.comboTimer = this.comboTimeout;
        }

        this.lastCollectibleTime = time;
        this.maxCombo = Math.max(this.maxCombo, this.combo);

        return this.addScore(value);
    }

    updateCombo() {
        // Combo decays over time
        if (this.comboTimer > 0) {
            this.comboTimer -= this.scene.game.loop.delta;
        } else {
            // Combo expired
            if (this.combo > 0) {
                this.combo = 0;
                this.comboMultiplier = 1;
            }
        }
    }

    getScore() {
        return this.score;
    }

    getCombo() {
        return this.combo;
    }

    getComboMultiplier() {
        return this.comboMultiplier;
    }

    reset() {
        this.score = 0;
        this.combo = 0;
        this.comboMultiplier = 1;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.lastCollectibleTime = 0;
        this.collectiblesCollected = 0;
        this.collectiblesByType = {
            coin: 0,
            crystal: 0,
            star: 0,
            fortune_coin: 0
        };
        this.enemiesKilled = 0;
        this.bonusesEarned = {
            waveClear: 0,
            accuracy: 0,
            graze: 0
        };
    }

    getEnemiesKilled() {
        return this.enemiesKilled;
    }

    getBonusesEarned() {
        return this.bonusesEarned;
    }

    getSessionStats() {
        return {
            score: this.score,
            enemiesKilled: this.enemiesKilled,
            collectiblesCollected: this.collectiblesCollected,
            maxCombo: this.maxCombo,
            bonuses: this.bonusesEarned
        };
    }

    getMaxCombo() {
        return this.maxCombo;
    }

    getCollectiblesCollected() {
        return this.collectiblesCollected;
    }

    getCollectiblesByType() {
        return this.collectiblesByType;
    }

    getShopCurrency() {
        return Math.floor(this.score / 100);
    }
}

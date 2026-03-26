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

        // Consecutive same-type chain tracking
        this.consecutiveType = null;
        this.consecutiveCount = 0;

        // Pet score bonus (set externally by GameScene)
        this.petScoreBonus = 0;
    }

    addScore(points) {
        const petBonus = 1 + this.petScoreBonus;
        const finalPoints = Math.floor(points * this.comboMultiplier * petBonus);
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

        // Track consecutive same-type chains
        const chainResult = this.trackChain(type);

        const score = this.addScore(value);

        // Return chain info along with score
        if (chainResult) {
            return { score, chain: chainResult };
        }
        return { score, chain: null };
    }

    trackChain(type) {
        if (type === this.consecutiveType) {
            this.consecutiveCount++;
        } else {
            this.consecutiveType = type;
            this.consecutiveCount = 1;
        }

        // Return chain status for display
        if (this.consecutiveCount === 2) {
            return { type, count: 2, bonus: false };
        }
        if (this.consecutiveCount === 3) {
            this.consecutiveCount = 0;
            this.consecutiveType = null;
            return { type, count: 3, bonus: true };
        }
        return null;
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
        this.consecutiveType = null;
        this.consecutiveCount = 0;
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

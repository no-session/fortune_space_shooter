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
    }

    addScore(points) {
        const finalPoints = Math.floor(points * this.comboMultiplier);
        this.score += finalPoints;
        this.updateCombo();
        return finalPoints;
    }

    addEnemyKill(points) {
        return this.addScore(points);
    }

    addCollectible(value, time) {
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
    }

    getMaxCombo() {
        return this.maxCombo;
    }
}

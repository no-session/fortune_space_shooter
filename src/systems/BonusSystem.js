import { BONUS_CONFIG } from '../utils/constants.js';

export default class BonusSystem {
    constructor(scene) {
        this.scene = scene;

        // Accuracy tracking
        this.shotsFired = 0;
        this.shotsHit = 0;

        // Wave tracking
        this.waveStartTime = 0;
        this.damageTakenThisWave = false;
        this.currentWave = 0;

        // Graze tracking
        this.grazeCount = 0;
        this.grazedBullets = new Set(); // Track which bullets already grazed
    }

    // Track when player fires a shot
    recordShotFired() {
        this.shotsFired++;
    }

    // Track when a shot hits an enemy
    recordShotHit() {
        this.shotsHit++;
    }

    // Track when player takes damage
    recordDamageTaken() {
        this.damageTakenThisWave = true;
    }

    // Check for graze (near-miss)
    checkGraze(bullet, player) {
        if (!bullet || !player || !bullet.active || !player.active) return null;
        if (player.invincible) return null;

        // Skip if we already grazed this bullet (use object reference directly)
        if (this.grazedBullets.has(bullet)) return null;

        const distance = Phaser.Math.Distance.Between(
            bullet.x, bullet.y,
            player.x, player.y
        );

        // Graze zone: close but not hitting
        // Player hitbox is roughly 20-25px, graze zone extends to GRAZE_DISTANCE
        if (distance > 20 && distance < BONUS_CONFIG.GRAZE_DISTANCE) {
            this.grazeCount++;

            // Mark bullet as grazed using object reference
            this.grazedBullets.add(bullet);

            return {
                points: BONUS_CONFIG.GRAZE_POINTS,
                distance: distance,
                x: bullet.x,
                y: bullet.y
            };
        }

        return null;
    }

    // Start tracking a new wave
    startWave(waveNumber) {
        this.currentWave = waveNumber;
        this.waveStartTime = this.scene.time.now;
        this.damageTakenThisWave = false;
        this.grazeCount = 0;
        this.grazedBullets.clear();
        // Don't reset accuracy - it's cumulative
    }

    // Calculate end-of-wave bonuses
    calculateWaveBonuses(enemiesKilled, totalEnemies) {
        const result = {
            waveClearPoints: 0,
            accuracyPoints: 0,
            grazePoints: 0,
            totalBonus: 0,
            perfect: false,
            accuracy: 0,
            grazeCount: this.grazeCount
        };

        // Wave clear bonus
        const clearPercent = totalEnemies > 0 ? enemiesKilled / totalEnemies : 0;
        if (clearPercent >= 0.8) {
            result.waveClearPoints = BONUS_CONFIG.WAVE_CLEAR_BASE * this.currentWave;

            // Perfect wave bonus (no damage taken)
            if (!this.damageTakenThisWave && clearPercent >= 1.0) {
                result.perfect = true;
                result.waveClearPoints = Math.floor(result.waveClearPoints * BONUS_CONFIG.PERFECT_WAVE_MULTIPLIER);
            }

            // Fast clear bonus (under 30 seconds)
            const clearTime = this.scene.time.now - this.waveStartTime;
            if (clearTime < 30000) {
                result.waveClearPoints = Math.floor(result.waveClearPoints * BONUS_CONFIG.FAST_CLEAR_MULTIPLIER);
            }
        }

        // Accuracy bonus
        result.accuracy = this.getAccuracy();
        if (result.accuracy >= BONUS_CONFIG.ACCURACY_THRESHOLD) {
            if (result.accuracy >= BONUS_CONFIG.ACCURACY_EXCELLENT) {
                result.accuracyPoints = BONUS_CONFIG.ACCURACY_BASE_POINTS * 2;
            } else if (result.accuracy >= BONUS_CONFIG.ACCURACY_GOOD) {
                result.accuracyPoints = BONUS_CONFIG.ACCURACY_BASE_POINTS;
            } else {
                result.accuracyPoints = Math.floor(BONUS_CONFIG.ACCURACY_BASE_POINTS * 0.5);
            }
        }

        // Graze bonus
        result.grazePoints = this.grazeCount * BONUS_CONFIG.GRAZE_POINTS;

        // Total
        result.totalBonus = result.waveClearPoints + result.accuracyPoints + result.grazePoints;

        return result;
    }

    // Get current accuracy
    getAccuracy() {
        if (this.shotsFired === 0) return 0;
        return this.shotsHit / this.shotsFired;
    }

    getAccuracyPercent() {
        return Math.round(this.getAccuracy() * 100);
    }

    // Get stats
    getStats() {
        return {
            shotsFired: this.shotsFired,
            shotsHit: this.shotsHit,
            accuracy: this.getAccuracy(),
            grazeCount: this.grazeCount,
            perfectWave: !this.damageTakenThisWave
        };
    }

    // Reset for new game
    reset() {
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.waveStartTime = 0;
        this.damageTakenThisWave = false;
        this.currentWave = 0;
        this.grazeCount = 0;
        this.grazedBullets.clear();
    }

    // Reset wave-specific stats (keep accuracy cumulative)
    resetWaveStats() {
        this.grazeCount = 0;
        this.grazedBullets.clear();
        this.damageTakenThisWave = false;
    }
}

import { STREAK_CONFIG } from '../utils/constants.js';

export default class StreakManager {
    constructor(scene) {
        this.scene = scene;

        // Kill streak tracking
        this.killStreak = 0;
        this.maxStreak = 0;
        this.streakTimer = 0;
        this.lastKillTime = 0;

        // Milestone tracking
        this.lastMilestone = 0;
    }

    // Record an enemy kill
    recordKill(enemyType, time) {
        const timeSinceLastKill = time - this.lastKillTime;

        // Check if within streak window
        if (this.lastKillTime === 0 || timeSinceLastKill < STREAK_CONFIG.DECAY_TIME) {
            this.killStreak++;
        } else {
            // Streak broken, start fresh
            this.killStreak = 1;
        }

        this.lastKillTime = time;
        this.streakTimer = STREAK_CONFIG.DECAY_TIME;
        this.maxStreak = Math.max(this.maxStreak, this.killStreak);

        // Calculate multiplier
        const multiplier = this.getStreakMultiplier();

        // Check for milestone
        const milestone = this.checkMilestone();

        return {
            streakLevel: this.killStreak,
            multiplier: multiplier,
            milestone: milestone,
            maxStreak: this.maxStreak
        };
    }

    // Check if we hit a milestone
    checkMilestone() {
        for (const milestone of STREAK_CONFIG.MILESTONES) {
            if (this.killStreak === milestone && milestone > this.lastMilestone) {
                this.lastMilestone = milestone;
                return milestone;
            }
        }
        return null;
    }

    // Reset streak (on damage or timeout)
    resetStreak() {
        if (this.killStreak > 0) {
            const wasStreak = this.killStreak;
            this.killStreak = 0;
            this.streakTimer = 0;
            this.lastMilestone = 0;
            return wasStreak;
        }
        return 0;
    }

    // Get current multiplier
    getStreakMultiplier() {
        const multiplier = 1 + (this.killStreak * STREAK_CONFIG.MULTIPLIER_PER_KILL);
        return Math.min(multiplier, STREAK_CONFIG.MAX_MULTIPLIER);
    }

    // Update streak timer (call from scene.update)
    update(delta) {
        if (this.streakTimer > 0) {
            this.streakTimer -= delta;

            if (this.streakTimer <= 0) {
                this.resetStreak();
            }
        }
    }

    // Getters
    getCurrentStreak() {
        return this.killStreak;
    }

    getMaxStreak() {
        return this.maxStreak;
    }

    getStreakTimeRemaining() {
        return Math.max(0, this.streakTimer);
    }

    getStreakPercentage() {
        if (this.killStreak === 0) return 0;
        return this.streakTimer / STREAK_CONFIG.DECAY_TIME;
    }

    // Reset for new game
    reset() {
        this.killStreak = 0;
        this.maxStreak = 0;
        this.streakTimer = 0;
        this.lastKillTime = 0;
        this.lastMilestone = 0;
    }
}

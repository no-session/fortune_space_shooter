import { XP_CONFIG } from '../utils/constants.js';

export default class XPManager {
    constructor() {
        this.xp = parseInt(localStorage.getItem('fortune-xp') || '0', 10);
        this.level = this.calculateLevel();
    }

    calculateLevel() {
        let level = 1;
        for (const entry of XP_CONFIG.LEVELS) {
            if (this.xp >= entry.xpRequired) {
                level = entry.level;
            } else {
                break;
            }
        }
        return level;
    }

    getLevel() {
        return this.level;
    }

    getXP() {
        return this.xp;
    }

    getXPForCurrentLevel() {
        const current = XP_CONFIG.LEVELS.find(l => l.level === this.level);
        return current ? current.xpRequired : 0;
    }

    getXPForNextLevel() {
        const next = XP_CONFIG.LEVELS.find(l => l.level === this.level + 1);
        return next ? next.xpRequired : null;
    }

    getXPProgress() {
        const currentReq = this.getXPForCurrentLevel();
        const nextReq = this.getXPForNextLevel();
        if (nextReq === null) return 1; // Max level
        const range = nextReq - currentReq;
        if (range <= 0) return 1;
        return (this.xp - currentReq) / range;
    }

    addXP(score) {
        const xpGained = Math.floor(score / XP_CONFIG.SCORE_TO_XP_DIVISOR);
        const oldLevel = this.level;
        this.xp += xpGained;
        localStorage.setItem('fortune-xp', this.xp.toString());
        this.level = this.calculateLevel();

        const leveledUp = this.level > oldLevel;
        const newPerks = [];

        if (leveledUp) {
            for (let lv = oldLevel + 1; lv <= this.level; lv++) {
                if (XP_CONFIG.PERKS[lv]) {
                    newPerks.push({ level: lv, ...XP_CONFIG.PERKS[lv] });
                }
            }
        }

        return { xpGained, leveledUp, newLevel: this.level, newPerks };
    }

    getPerk(level) {
        return XP_CONFIG.PERKS[level] || null;
    }

    hasReachedLevel(level) {
        return this.level >= level;
    }

    getTitle() {
        if (this.level >= 10) return 'Space Ace';
        return null;
    }

    getUnlockedWeapons() {
        const weapons = ['blaster'];
        if (this.level >= 2) weapons.push('wave');
        if (this.level >= 3) weapons.push('laser');
        return weapons;
    }

    getHPBonus() {
        if (this.level >= 5) return 0.10;
        return 0;
    }

    startsWithShield() {
        return this.level >= 7;
    }
}

/**
 * Deterministic daily challenge system.
 * Same challenge for everyone on the same day.
 */

const CHALLENGE_TEMPLATES = [
    { type: 'wave',     generate: (seed) => ({ description: `Reach wave ${5 + (seed % 11)}`, target: 5 + (seed % 11) }) },
    { type: 'combo',    generate: (seed) => ({ description: `Get a combo of ${10 + (seed % 16)}`, target: 10 + (seed % 16) }) },
    { type: 'kills',    generate: (seed) => ({ description: `Destroy ${30 + (seed % 71)} enemies`, target: 30 + (seed % 71) }) },
    { type: 'coins',    generate: (seed) => ({ description: `Collect ${20 + (seed % 31)} coins`, target: 20 + (seed % 31) }) },
    { type: 'boss_hp',  generate: () => ({ description: 'Beat the wave 5 boss with over 50% health', target: 0.5 }) }
];

export default class DailyChallenge {
    constructor() {
        this.today = this.getDateKey();
        const seed = this.hashDate(this.today);
        const template = CHALLENGE_TEMPLATES[seed % CHALLENGE_TEMPLATES.length];
        const details = template.generate(seed);

        this.type = template.type;
        this.description = details.description;
        this.target = details.target;
        this.progress = 0;
        this.completed = this.isCompletedToday();

        // Track first-ever completion for 'Daily Hero' achievement
        this.firstEverCompleted = localStorage.getItem('fortune-daily-hero') === 'true';
    }

    getDateKey() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    hashDate(dateStr) {
        let hash = 0;
        for (let i = 0; i < dateStr.length; i++) {
            hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    isCompletedToday() {
        return localStorage.getItem(`fortune-daily-${this.today}`) === 'done';
    }

    markCompleted() {
        this.completed = true;
        localStorage.setItem(`fortune-daily-${this.today}`, 'done');
        if (!this.firstEverCompleted) {
            this.firstEverCompleted = true;
            localStorage.setItem('fortune-daily-hero', 'true');
        }
    }

    /**
     * Called from GameScene during gameplay to track progress.
     * Returns true if challenge was JUST completed this call.
     */
    trackProgress(data) {
        if (this.completed) return false;

        switch (this.type) {
            case 'wave':
                this.progress = data.wave || 0;
                break;
            case 'combo':
                this.progress = Math.max(this.progress, data.combo || 0);
                break;
            case 'kills':
                this.progress = data.kills || 0;
                break;
            case 'coins':
                this.progress = data.coins || 0;
                break;
            case 'boss_hp':
                // data.bossDefeatedWithHpPercent is set when boss on wave 5 is beaten
                if (data.bossDefeatedWithHpPercent !== undefined && data.bossDefeatedWithHpPercent > this.target) {
                    this.progress = 1;
                }
                break;
        }

        if (this.isGoalMet() && !this.completed) {
            this.markCompleted();
            return true; // just completed
        }
        return false;
    }

    isGoalMet() {
        if (this.type === 'boss_hp') return this.progress >= 1;
        return this.progress >= this.target;
    }

    getProgressText() {
        if (this.completed) return 'COMPLETED!';
        if (this.type === 'boss_hp') return this.progress >= 1 ? 'Done!' : 'In progress...';
        return `${this.progress} / ${this.target}`;
    }

    getBonusPoints() {
        return 2000;
    }
}

/**
 * StatsTracker — Persistent all-time statistics stored in localStorage.
 *
 * Updates incrementally: each method modifies only the relevant key.
 * All keys are prefixed with 'fortune-stats-'.
 */
const PREFIX = 'fortune-stats-';

function getNum(key) {
    return parseInt(localStorage.getItem(PREFIX + key) || '0', 10);
}
function setNum(key, val) {
    localStorage.setItem(PREFIX + key, val.toString());
}
function incNum(key, amount = 1) {
    setNum(key, getNum(key) + amount);
}
function getObj(key) {
    try { return JSON.parse(localStorage.getItem(PREFIX + key) || '{}'); } catch { return {}; }
}
function setObj(key, obj) {
    localStorage.setItem(PREFIX + key, JSON.stringify(obj));
}

export default class StatsTracker {
    // ── Read helpers (all-time values) ────────────────────

    static get totalGamesPlayed()      { return getNum('games-played'); }
    static get totalEnemiesKilled()    { return getNum('enemies-killed'); }
    static get totalBossesDefeated()   { return getNum('bosses-defeated'); }
    static get totalCollectibles()     { return getNum('collectibles-total'); }
    static get totalPowerUpsUsed()     { return getNum('powerups-used'); }
    static get totalScore()            { return getNum('score-lifetime'); }
    static get totalTimePlayed()       { return getNum('time-played'); }
    static get highestWave()           { return getNum('highest-wave'); }
    static get highestCombo()          { return getNum('highest-combo'); }
    static get highestSingleScore()    { return getNum('highest-single-score'); }
    static get totalAchievements()     { return getNum('achievements-unlocked'); }
    static get perfectWaves()          { return getNum('perfect-waves'); }
    static get dailyChallengesCompleted() { return getNum('daily-challenges'); }
    static get totalDeaths()           { return getNum('total-deaths'); }

    static get enemiesByType()         { return getObj('enemies-by-type'); }
    static get collectiblesByType()    { return getObj('collectibles-by-type'); }
    static get powerUpsByType()        { return getObj('powerups-by-type'); }
    static get weaponUsage()           { return getObj('weapon-usage'); }
    static get petUsage()              { return getObj('pet-usage'); }
    static get challengeScores()       { return getObj('challenge-scores'); }

    // ── Increment helpers ─────────────────────────────────

    static recordGamePlayed()           { incNum('games-played'); }
    static recordDeath()                { incNum('total-deaths'); }
    static recordPerfectWave()          { incNum('perfect-waves'); }
    static recordDailyChallenge()       { incNum('daily-challenges'); }
    static recordAchievementUnlocked()  { incNum('achievements-unlocked'); }

    static recordEnemyKill(enemyType) {
        incNum('enemies-killed');
        const byType = getObj('enemies-by-type');
        byType[enemyType] = (byType[enemyType] || 0) + 1;
        setObj('enemies-by-type', byType);
    }

    static recordBossDefeated() {
        incNum('bosses-defeated');
    }

    static recordCollectible(collectibleType) {
        incNum('collectibles-total');
        const byType = getObj('collectibles-by-type');
        byType[collectibleType] = (byType[collectibleType] || 0) + 1;
        setObj('collectibles-by-type', byType);
    }

    static recordPowerUpUsed(powerUpType) {
        incNum('powerups-used');
        const byType = getObj('powerups-by-type');
        byType[powerUpType] = (byType[powerUpType] || 0) + 1;
        setObj('powerups-by-type', byType);
    }

    static recordScoreEarned(score) {
        incNum('score-lifetime', score);
    }

    static recordTimePlayed(seconds) {
        incNum('time-played', seconds);
    }

    static recordWeaponUsed(weaponType) {
        const usage = getObj('weapon-usage');
        usage[weaponType] = (usage[weaponType] || 0) + 1;
        setObj('weapon-usage', usage);
    }

    static recordPetUsed(petType) {
        const usage = getObj('pet-usage');
        usage[petType] = (usage[petType] || 0) + 1;
        setObj('pet-usage', usage);
    }

    static updateHighestWave(wave) {
        if (wave > getNum('highest-wave')) setNum('highest-wave', wave);
    }

    static updateHighestCombo(combo) {
        if (combo > getNum('highest-combo')) setNum('highest-combo', combo);
    }

    static updateHighestSingleScore(score) {
        if (score > getNum('highest-single-score')) setNum('highest-single-score', score);
    }

    // ── Challenge scores ──────────────────────────────────

    static getChallengeScore(challengeId) {
        const scores = getObj('challenge-scores');
        return scores[challengeId] || 0;
    }

    static updateChallengeScore(challengeId, score) {
        const scores = getObj('challenge-scores');
        if (!scores[challengeId] || score > scores[challengeId]) {
            scores[challengeId] = score;
            setObj('challenge-scores', scores);
        }
    }

    // ── Bestiary encounters ───────────────────────────────

    static recordEncounter(enemyType) {
        const enc = getObj('encounters');
        enc[enemyType] = (enc[enemyType] || 0) + 1;
        setObj('encounters', enc);
    }

    static getEncounters() {
        return getObj('encounters');
    }

    // ── Derived / fun stats ───────────────────────────────

    static getFavoriteWeapon() {
        const usage = getObj('weapon-usage');
        let best = null, max = 0;
        for (const [k, v] of Object.entries(usage)) {
            if (v > max) { max = v; best = k; }
        }
        return best;
    }

    static getFavoritePet() {
        const usage = getObj('pet-usage');
        let best = null, max = 0;
        for (const [k, v] of Object.entries(usage)) {
            if (v > max) { max = v; best = k; }
        }
        return best;
    }

    static getKillComparison() {
        const kills = getNum('enemies-killed');
        if (kills >= 5000) return 'more than the population of a small town';
        if (kills >= 1000) return 'a whole fleet';
        if (kills >= 500)  return 'a battalion';
        if (kills >= 100)  return 'a small army';
        if (kills >= 50)   return 'a platoon';
        if (kills >= 10)   return 'a squad';
        return 'a handful';
    }

    static formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    }

    // ── Full stats object (for display) ───────────────────

    static getAllStats() {
        return {
            gamesPlayed: StatsTracker.totalGamesPlayed,
            enemiesKilled: StatsTracker.totalEnemiesKilled,
            enemiesByType: StatsTracker.enemiesByType,
            bossesDefeated: StatsTracker.totalBossesDefeated,
            collectibles: StatsTracker.totalCollectibles,
            collectiblesByType: StatsTracker.collectiblesByType,
            powerUpsUsed: StatsTracker.totalPowerUpsUsed,
            powerUpsByType: StatsTracker.powerUpsByType,
            totalScore: StatsTracker.totalScore,
            timePlayed: StatsTracker.totalTimePlayed,
            highestWave: StatsTracker.highestWave,
            highestCombo: StatsTracker.highestCombo,
            highestSingleScore: StatsTracker.highestSingleScore,
            achievements: StatsTracker.totalAchievements,
            perfectWaves: StatsTracker.perfectWaves,
            dailyChallenges: StatsTracker.dailyChallengesCompleted,
            deaths: StatsTracker.totalDeaths,
            favoriteWeapon: StatsTracker.getFavoriteWeapon(),
            favoritePet: StatsTracker.getFavoritePet(),
            killComparison: StatsTracker.getKillComparison()
        };
    }
}

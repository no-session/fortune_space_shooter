import { FORMATION_TYPES, ENEMY_TYPES, BOSS_WAVE_SEQUENCE } from '../utils/constants.js';

export default class WaveManager {
    constructor(scene) {
        this.scene = scene;
        this.currentWave = 0;
        this.enemiesRemaining = 0;
        this.waveComplete = false;
        this.bossWave = false;
    }

    startWave(waveNumber) {
        this.currentWave = waveNumber;
        this.waveComplete = false;
        this.bossWave = waveNumber % 5 === 0 && waveNumber > 0;

        if (this.bossWave) {
            this.startBossWave();
        } else {
            this.startNormalWave();
        }
    }

    startNormalWave() {
        const formationManager = this.scene.formationManager;

        // Gentler difficulty scaling for better early game experience
        // Wave 1: 4 enemies, 1 formation = 4 total
        // Wave 2: 5 enemies, 1 formation = 5 total
        // Wave 3: 6 enemies, 1 formation = 6 total
        // Wave 4: 7 enemies, 2 formations = 14 total
        // Wave 6+: continues scaling up to 10 enemies, 3 formations = 30 max
        const enemyCount = Math.min(3 + this.currentWave, 10);
        const formationCount = Math.min(1 + Math.floor(this.currentWave / 4), 3);

        this.enemiesRemaining = enemyCount * formationCount;

        // Spawn formations with longer delays for breathing room
        const formationTypes = [
            FORMATION_TYPES.V,
            FORMATION_TYPES.GRID,
            FORMATION_TYPES.CIRCLE,
            FORMATION_TYPES.WAVE
        ];

        // Longer delays between formations (2 seconds instead of 1)
        const spawnDelay = 2000;

        for (let i = 0; i < formationCount; i++) {
            const delay = i * spawnDelay;
            const formationType = formationTypes[Math.floor(Math.random() * formationTypes.length)];
            const startX = this.scene.scale.width / 2 + (Math.random() - 0.5) * 200;
            const startY = -50 - i * 100;

            this.scene.time.delayedCall(delay, () => {
                const enemyType = this.getEnemyTypeForWave();
                formationManager.createFormation(
                    formationType,
                    enemyType,
                    enemyCount,
                    startX,
                    startY
                );
            });
        }
    }

    getEnemyTypeForWave() {
        if (this.currentWave >= 12) {
            const rand = Math.random();
            if (rand < 0.1) return ENEMY_TYPES.ELITE;
            else if (rand < 0.3) return ENEMY_TYPES.BOMBER;
            else if (rand < 0.6) return ENEMY_TYPES.FIGHTER;
            else return ENEMY_TYPES.SCOUT;
        }
        if (this.currentWave >= 8) {
            const rand = Math.random();
            if (rand < 0.2) return ENEMY_TYPES.BOMBER;
            else if (rand < 0.5) return ENEMY_TYPES.FIGHTER;
            else return ENEMY_TYPES.SCOUT;
        }
        if (this.currentWave >= 4) {
            return Math.random() < 0.7 ? ENEMY_TYPES.SCOUT : ENEMY_TYPES.FIGHTER;
        }
        return ENEMY_TYPES.SCOUT;
    }

    startBossWave() {
        // Boss wave - spawn boss
        this.enemiesRemaining = 1; // Boss counts as 1
        const bossX = this.scene.scale.width / 2;
        const bossY = -100;

        // Calculate which boss to spawn based on wave number
        // Wave 5 -> index 0, Wave 10 -> index 1, etc., cycles every 5 boss waves
        const bossIndex = Math.floor((this.currentWave / 5) - 1) % BOSS_WAVE_SEQUENCE.length;
        const bossType = BOSS_WAVE_SEQUENCE[bossIndex];

        this.scene.time.delayedCall(500, () => {
            if (this.scene.spawnBoss) {
                this.scene.spawnBoss(bossType, bossX, bossY);
            }
        });
    }

    onEnemyKilled() {
        // Only decrement if there are enemies remaining (prevent negative counts)
        if (this.enemiesRemaining > 0) {
            this.enemiesRemaining--;
        }

        // Only mark complete once
        if (this.enemiesRemaining <= 0 && !this.waveComplete) {
            this.waveComplete = true;
        }
    }

    onBossKilled() {
        this.enemiesRemaining = 0;
        this.waveComplete = true;
    }

    isWaveComplete() {
        return this.waveComplete;
    }

    isBossWave() {
        return this.bossWave;
    }

    getCurrentWave() {
        return this.currentWave;
    }
}

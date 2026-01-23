import { FORMATION_TYPES, ENEMY_TYPES } from '../utils/constants.js';

export default class WaveManager {
    constructor(scene) {
        this.scene = scene;
        this.currentWave = 0;
        this.enemiesRemaining = 0;
        this.waveComplete = false;
        this.bossWave = false;
    }

    startWave(waveNumber) {
        console.log(`Starting wave ${waveNumber}...`);
        this.currentWave = waveNumber;
        this.waveComplete = false;
        this.bossWave = waveNumber % 5 === 0 && waveNumber > 0;

        if (this.bossWave) {
            console.log('This is a boss wave!');
            this.startBossWave();
        } else {
            console.log('This is a normal wave');
            this.startNormalWave();
        }
    }

    startNormalWave() {
        const formationManager = this.scene.formationManager;
        const enemyCount = Math.min(5 + this.currentWave * 2, 20);
        const formationCount = Math.min(2 + Math.floor(this.currentWave / 3), 5);
        
        this.enemiesRemaining = enemyCount * formationCount;
        
        // Determine enemy types based on wave
        let enemyType = ENEMY_TYPES.SCOUT;
        if (this.currentWave >= 3) {
            enemyType = Math.random() < 0.5 ? ENEMY_TYPES.SCOUT : ENEMY_TYPES.FIGHTER;
        }
        if (this.currentWave >= 6) {
            const rand = Math.random();
            if (rand < 0.3) enemyType = ENEMY_TYPES.BOMBER;
            else if (rand < 0.6) enemyType = ENEMY_TYPES.FIGHTER;
            else enemyType = ENEMY_TYPES.SCOUT;
        }
        if (this.currentWave >= 10) {
            const rand = Math.random();
            if (rand < 0.1) enemyType = ENEMY_TYPES.ELITE;
            else if (rand < 0.4) enemyType = ENEMY_TYPES.BOMBER;
            else if (rand < 0.7) enemyType = ENEMY_TYPES.FIGHTER;
            else enemyType = ENEMY_TYPES.SCOUT;
        }
        
        // Spawn formations with delay
        const formationTypes = [
            FORMATION_TYPES.V,
            FORMATION_TYPES.GRID,
            FORMATION_TYPES.CIRCLE,
            FORMATION_TYPES.WAVE
        ];
        
        for (let i = 0; i < formationCount; i++) {
            const delay = i * 1000;
            const formationType = formationTypes[Math.floor(Math.random() * formationTypes.length)];
            const startX = this.scene.scale.width / 2 + (Math.random() - 0.5) * 200;
            const startY = -50 - i * 100;
            
            this.scene.time.delayedCall(delay, () => {
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

    startBossWave() {
        // Boss wave - spawn boss
        this.enemiesRemaining = 1; // Boss counts as 1
        const bossX = this.scene.scale.width / 2;
        const bossY = -100;
        
        this.scene.time.delayedCall(500, () => {
            if (this.scene.spawnBoss) {
                this.scene.spawnBoss('mothership', bossX, bossY);
            }
        });
    }

    onEnemyKilled() {
        // Only decrement if there are enemies remaining (prevent negative counts)
        if (this.enemiesRemaining > 0) {
            this.enemiesRemaining--;
            console.log(`Enemy killed. Enemies remaining: ${this.enemiesRemaining}`);
        }

        // Only mark complete once
        if (this.enemiesRemaining <= 0 && !this.waveComplete) {
            this.waveComplete = true;
            console.log('Wave marked as complete!');
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

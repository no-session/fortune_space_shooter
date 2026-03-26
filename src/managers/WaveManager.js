import { FORMATION_TYPES, ENEMY_TYPES, BOSS_WAVE_SEQUENCE, HAZARD_TYPES, MINI_BOSS_CONFIG, WAVE_MODIFIERS } from '../utils/constants.js';

export default class WaveManager {
    constructor(scene) {
        this.scene = scene;
        this.currentWave = 0;
        this.enemiesRemaining = 0;
        this.waveComplete = false;
        this.bossWave = false;
        this.activeModifier = null;

        // Endless mode flag — set by GameScene
        this.endlessMode = false;

        // Wave summary tracking
        this.waveStartTime = 0;
        this.waveKills = 0;
        this.waveScoreStart = 0;
    }

    startWave(waveNumber) {
        this.currentWave = waveNumber;
        this.waveComplete = false;
        this.activeModifier = null;

        // Endless mode boss logic: mini-boss every 5, full boss every 10, double boss every 20
        if (this.endlessMode) {
            this.bossWave = waveNumber % 10 === 0 && waveNumber > 0;
            this._endlessMiniBoss = waveNumber % 5 === 0 && waveNumber % 10 !== 0 && waveNumber > 0;
            this._endlessDoubleBoss = waveNumber % 20 === 0 && waveNumber > 0;
        } else {
            this.bossWave = waveNumber % 5 === 0 && waveNumber > 0;
        }

        // Track wave stats for summary
        this.waveStartTime = Date.now();
        this.waveKills = 0;
        this.waveScoreStart = this.scene.scoreManager ? this.scene.scoreManager.getScore() : 0;

        // Roll for wave modifier on non-boss waves past wave 5
        if (!this.bossWave && waveNumber > 5 && Math.random() < 0.3) {
            const modKeys = Object.keys(WAVE_MODIFIERS);
            const modKey = modKeys[Math.floor(Math.random() * modKeys.length)];
            this.activeModifier = WAVE_MODIFIERS[modKey];
            this.showModifierAnnouncement();
        }

        // Spawn environmental hazards on certain waves
        this.maybeSpawnHazards();

        if (this.bossWave) {
            this.startBossWave();
            // Double boss in endless mode every 20 waves
            if (this.endlessMode && this._endlessDoubleBoss) {
                this.enemiesRemaining = 2;
                this.scene.time.delayedCall(3000, () => {
                    if (this.scene.spawnBoss) {
                        const bossIndex2 = (Math.floor((waveNumber / 10) - 1) + 2) % BOSS_WAVE_SEQUENCE.length;
                        this.scene.spawnBoss(BOSS_WAVE_SEQUENCE[bossIndex2],
                            this.scene.scale.width / 2 + 100, -100);
                    }
                });
            }
        } else {
            this.startNormalWave();

            // Endless mode: mini-boss every 5 waves (not full boss waves)
            if (this.endlessMode && this._endlessMiniBoss) {
                this.scene.time.delayedCall(2000, () => {
                    if (this.scene.spawnMiniBoss) {
                        this.scene.spawnMiniBoss();
                    }
                });
            }
            // Normal mode: Mini-boss on every 3rd non-boss wave
            else if (!this.endlessMode && waveNumber >= 3 && waveNumber % 3 === 0 && waveNumber % 5 !== 0) {
                this.scene.time.delayedCall(3000, () => {
                    if (this.scene.spawnMiniBoss) {
                        this.scene.spawnMiniBoss();
                    }
                });
            }
        }
    }

    maybeSpawnHazards() {
        // Spawn hazards on waves 7, 14, 21, 28, ...
        if (this.currentWave >= 7 && this.currentWave % 7 === 0 && this.scene.spawnHazards) {
            // Alternate between asteroid and nebula
            const hazardType = (this.currentWave / 7) % 2 === 1
                ? HAZARD_TYPES.ASTEROID
                : HAZARD_TYPES.NEBULA;
            this.scene.spawnHazards(hazardType);
        }
    }

    showModifierAnnouncement() {
        if (!this.activeModifier) return;
        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2 + 50;

        const modText = this.scene.add.text(centerX, centerY, this.activeModifier.name, {
            fontSize: '28px',
            fontFamily: 'monospace',
            color: this.activeModifier.color,
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold'
        });
        modText.setOrigin(0.5);
        modText.setDepth(1005);
        modText.setAlpha(0);

        const descText = this.scene.add.text(centerX, centerY + 35, this.activeModifier.description, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        descText.setOrigin(0.5);
        descText.setDepth(1005);
        descText.setAlpha(0);

        this.scene.tweens.add({
            targets: [modText, descText],
            alpha: 1,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.scene.time.delayedCall(2000, () => {
                    this.scene.tweens.add({
                        targets: [modText, descText],
                        alpha: 0,
                        y: '-=30',
                        duration: 500,
                        onComplete: () => { modText.destroy(); descText.destroy(); }
                    });
                });
            }
        });
    }

    startNormalWave() {
        const formationManager = this.scene.formationManager;

        // Endless mode: enemy count grows +1 every 2 waves, no cap
        let enemyCount, formationCount;
        if (this.endlessMode) {
            enemyCount = 4 + Math.floor(this.currentWave / 2);
            formationCount = Math.min(1 + Math.floor(this.currentWave / 3), 5);
        } else {
            enemyCount = Math.min(3 + this.currentWave, 10);
            formationCount = Math.min(1 + Math.floor(this.currentWave / 4), 3);
        }

        // Apply modifier: double enemies
        const enemyMult = this.activeModifier ? (this.activeModifier.enemyMultiplier || 1) : 1;
        this.enemiesRemaining = Math.floor(enemyCount * formationCount * enemyMult);

        // Spawn formations with longer delays for breathing room
        const formationTypes = [
            FORMATION_TYPES.V,
            FORMATION_TYPES.GRID,
            FORMATION_TYPES.CIRCLE,
            FORMATION_TYPES.WAVE
        ];

        // Add spiral formation from wave 6+
        if (this.currentWave >= 6) {
            formationTypes.push(FORMATION_TYPES.SPIRAL);
        }

        // Longer delays between formations (2 seconds instead of 1)
        const spawnDelay = 2000;

        for (let i = 0; i < formationCount; i++) {
            const delay = i * spawnDelay;
            const formationType = formationTypes[Math.floor(Math.random() * formationTypes.length)];
            const startX = this.scene.scale.width / 2 + (Math.random() - 0.5) * 200;
            const startY = -50 - i * 100;

            this.scene.time.delayedCall(delay, () => {
                const enemyType = this.getEnemyTypeForWave();

                const spawnAndModify = () => {
                    formationManager.createFormation(
                        formationType,
                        enemyType,
                        enemyCount,
                        startX,
                        startY
                    );
                    this.applyModifierToNewEnemies();
                };

                // Show formation preview before spawning
                if (this.scene.showFormationPreview) {
                    const previewY = 80 + i * 80;
                    this.scene.showFormationPreview(formationType, enemyCount, startX, previewY, spawnAndModify);
                } else {
                    spawnAndModify();
                }
            });
        }
    }

    applyModifierToNewEnemies() {
        if (!this.activeModifier || !this.scene.enemies) return;

        this.scene.enemies.children.entries.forEach((enemy, idx) => {
            if (!enemy || !enemy.active) return;

            // Speed modifier
            if (this.activeModifier.speedMultiplier && !enemy._modApplied) {
                enemy.speed = Math.floor(enemy.speed * this.activeModifier.speedMultiplier);
                enemy._modApplied = true;
            }

            // Shield modifier: every Nth enemy gets extra health
            if (this.activeModifier.shieldedEveryN && !enemy._modApplied) {
                if ((idx + 1) % this.activeModifier.shieldedEveryN === 0) {
                    enemy.health += this.activeModifier.shieldExtraHits * 10;
                    enemy.maxHealth = enemy.health;
                    // Visual: blue tint for shielded enemies
                    enemy.setTint(0x4488ff);
                }
                enemy._modApplied = true;
            }
        });
    }

    getEnemyTypeForWave() {
        // Endless mode: faster type introduction
        const effectiveWave = this.endlessMode ? Math.floor(this.currentWave * 1.5) : this.currentWave;
        if (effectiveWave >= 12) {
            const rand = Math.random();
            if (rand < 0.08) return ENEMY_TYPES.ELITE;
            else if (rand < 0.2) return ENEMY_TYPES.SPLITTER;
            else if (rand < 0.35) return ENEMY_TYPES.BOMBER;
            else if (rand < 0.6) return ENEMY_TYPES.FIGHTER;
            else return ENEMY_TYPES.SCOUT;
        }
        if (effectiveWave >= 10) {
            const rand = Math.random();
            if (rand < 0.15) return ENEMY_TYPES.SPLITTER;
            else if (rand < 0.3) return ENEMY_TYPES.BOMBER;
            else if (rand < 0.55) return ENEMY_TYPES.FIGHTER;
            else return ENEMY_TYPES.SCOUT;
        }
        if (effectiveWave >= 8) {
            const rand = Math.random();
            if (rand < 0.2) return ENEMY_TYPES.BOMBER;
            else if (rand < 0.5) return ENEMY_TYPES.FIGHTER;
            else return ENEMY_TYPES.SCOUT;
        }
        if (effectiveWave >= 4) {
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

        // Show boss warning first, then spawn after 3-second warning
        if (this.scene.showBossWarning) {
            this.scene.showBossWarning(() => {
                this.scene.time.delayedCall(500, () => {
                    if (this.scene.spawnBoss) {
                        this.scene.spawnBoss(bossType, bossX, bossY);
                    }
                });
            });
        } else {
            this.scene.time.delayedCall(500, () => {
                if (this.scene.spawnBoss) {
                    this.scene.spawnBoss(bossType, bossX, bossY);
                }
            });
        }
    }

    onEnemyKilled() {
        this.waveKills++;

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

    getActiveModifier() {
        return this.activeModifier;
    }

    getWaveSummary() {
        const elapsed = Math.round((Date.now() - this.waveStartTime) / 1000);
        const scoreGained = this.scene.scoreManager
            ? this.scene.scoreManager.getScore() - this.waveScoreStart
            : 0;
        return {
            wave: this.currentWave,
            kills: this.waveKills,
            score: scoreGained,
            time: elapsed
        };
    }
}

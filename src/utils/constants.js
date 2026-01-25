// Game Constants
export const GAME_CONFIG = {
    WIDTH: 800,
    HEIGHT: 600,
    PLAYER_SPEED: 300,
    BULLET_SPEED: 600,
    ENEMY_BULLET_SPEED: 400,
    COLLECTIBLE_SPEED: 150,
    PLAYER_LIVES: 3,
    PLAYER_HEALTH: 100
};

// Enemy Types
export const ENEMY_TYPES = {
    SCOUT: 'scout',
    FIGHTER: 'fighter',
    BOMBER: 'bomber',
    ELITE: 'elite'
};

// Enemy Stats
export const ENEMY_STATS = {
    [ENEMY_TYPES.SCOUT]: {
        health: 10,
        speed: 150,
        points: 50,
        dropChance: 0.3
    },
    [ENEMY_TYPES.FIGHTER]: {
        health: 25,
        speed: 100,
        points: 100,
        dropChance: 0.5,
        shoots: true,
        shootInterval: 2000
    },
    [ENEMY_TYPES.BOMBER]: {
        health: 40,
        speed: 80,
        points: 150,
        dropChance: 0.6,
        dropsBombs: true
    },
    [ENEMY_TYPES.ELITE]: {
        health: 60,
        speed: 120,
        points: 250,
        dropChance: 0.8
    }
};

// Collectible Types
export const COLLECTIBLE_TYPES = {
    COIN: 'coin',
    CRYSTAL: 'crystal',
    STAR: 'star',
    FORTUNE_COIN: 'fortune_coin'
};

// Collectible Values
export const COLLECTIBLE_VALUES = {
    [COLLECTIBLE_TYPES.COIN]: 100,
    [COLLECTIBLE_TYPES.CRYSTAL]: 250,
    [COLLECTIBLE_TYPES.STAR]: 500,
    [COLLECTIBLE_TYPES.FORTUNE_COIN]: 1000
};

// Formation Types
export const FORMATION_TYPES = {
    V: 'v',
    GRID: 'grid',
    CIRCLE: 'circle',
    WAVE: 'wave',
    DIAMOND: 'diamond'
};

// Colors
export const COLORS = {
    PRIMARY: 0x00ffff,
    SECONDARY: 0xff00ff,
    DANGER: 0xff0000,
    SUCCESS: 0x00ff00,
    WARNING: 0xffff00,
    GOLD: 0xffd700,
    BLUE: 0x0080ff
};

// Boss Types
export const BOSS_TYPES = {
    MOTHERSHIP: 'mothership',
    DREADNOUGHT: 'dreadnought',
    BATTLECRUISER: 'battlecruiser',
    DESTROYER: 'destroyer',
    OVERLORD: 'overlord'
};

// Boss wave sequence (cycles every 5 boss waves)
export const BOSS_WAVE_SEQUENCE = [
    BOSS_TYPES.MOTHERSHIP,      // Wave 5, 30, 55...
    BOSS_TYPES.DREADNOUGHT,     // Wave 10, 35, 60...
    BOSS_TYPES.BATTLECRUISER,   // Wave 15, 40, 65...
    BOSS_TYPES.DESTROYER,       // Wave 20, 45, 70...
    BOSS_TYPES.OVERLORD         // Wave 25, 50, 75...
];

// Boss Stats and Configuration
export const BOSS_CONFIG = {
    [BOSS_TYPES.MOTHERSHIP]: {
        name: 'Mothership',
        maxHealth: 1000,
        scoreValue: 5000,
        sprite: {
            primaryColor: 0xff0000,
            secondaryColor: 0x8b0000,
            accentColor: 0xcc0000
        },
        phases: {
            1: {
                healthThreshold: 1.0,
                moveSpeed: 80,
                shootInterval: 1500,
                attacks: [
                    { type: 'spread', count: 5, spacing: 30, speed: 250 }
                ]
            },
            2: {
                healthThreshold: 0.66,
                moveSpeed: 100,
                shootInterval: 1200,
                attacks: [
                    { type: 'spread', count: 5, spacing: 30, speed: 250 },
                    { type: 'drones', chance: 0.3 }
                ]
            },
            3: {
                healthThreshold: 0.33,
                moveSpeed: 120,
                shootInterval: 800,
                attacks: [
                    { type: 'rapid', count: 3, speed: 350 },
                    { type: 'drones', chance: 0.2 }
                ]
            }
        }
    },
    [BOSS_TYPES.DREADNOUGHT]: {
        name: 'Dreadnought',
        maxHealth: 1200,
        scoreValue: 6000,
        sprite: {
            primaryColor: 0x9400d3,
            secondaryColor: 0x4b0082,
            accentColor: 0xff00ff
        },
        phases: {
            1: {
                healthThreshold: 1.0,
                moveSpeed: 60,
                shootInterval: 1800,
                attacks: [
                    { type: 'circular', count: 8, speed: 200 }
                ]
            },
            2: {
                healthThreshold: 0.66,
                moveSpeed: 70,
                shootInterval: 1400,
                attacks: [
                    { type: 'circular', count: 10, speed: 220 },
                    { type: 'spread', count: 3, spacing: 40, speed: 280 }
                ]
            },
            3: {
                healthThreshold: 0.33,
                moveSpeed: 90,
                shootInterval: 1000,
                attacks: [
                    { type: 'circular', count: 12, speed: 250 },
                    { type: 'drones', chance: 0.25 }
                ]
            }
        }
    },
    [BOSS_TYPES.BATTLECRUISER]: {
        name: 'Battlecruiser',
        maxHealth: 900,
        scoreValue: 5500,
        sprite: {
            primaryColor: 0x00ffff,
            secondaryColor: 0x00008b,
            accentColor: 0x87ceeb
        },
        phases: {
            1: {
                healthThreshold: 1.0,
                moveSpeed: 100,
                shootInterval: 1200,
                attacks: [
                    { type: 'rapid', count: 4, speed: 400 }
                ]
            },
            2: {
                healthThreshold: 0.66,
                moveSpeed: 120,
                shootInterval: 1000,
                attacks: [
                    { type: 'rapid', count: 5, speed: 420 },
                    { type: 'spread', count: 3, spacing: 25, speed: 300 }
                ]
            },
            3: {
                healthThreshold: 0.33,
                moveSpeed: 140,
                shootInterval: 700,
                attacks: [
                    { type: 'rapid', count: 6, speed: 450 },
                    { type: 'spread', count: 5, spacing: 20, speed: 320 }
                ]
            }
        }
    },
    [BOSS_TYPES.DESTROYER]: {
        name: 'Destroyer',
        maxHealth: 1100,
        scoreValue: 6500,
        sprite: {
            primaryColor: 0xff8c00,
            secondaryColor: 0xff4500,
            accentColor: 0xff6347
        },
        phases: {
            1: {
                healthThreshold: 1.0,
                moveSpeed: 90,
                shootInterval: 1400,
                attacks: [
                    { type: 'spread', count: 7, spacing: 25, speed: 270 },
                    { type: 'drones', chance: 0.2 }
                ]
            },
            2: {
                healthThreshold: 0.66,
                moveSpeed: 100,
                shootInterval: 1100,
                attacks: [
                    { type: 'cross', count: 4, speed: 300 },
                    { type: 'drones', chance: 0.3 }
                ]
            },
            3: {
                healthThreshold: 0.33,
                moveSpeed: 110,
                shootInterval: 800,
                attacks: [
                    { type: 'rapid', count: 4, speed: 380 },
                    { type: 'spread', count: 5, spacing: 30, speed: 300 },
                    { type: 'drones', chance: 0.35 }
                ]
            }
        }
    },
    [BOSS_TYPES.OVERLORD]: {
        name: 'Overlord',
        maxHealth: 1500,
        scoreValue: 8000,
        sprite: {
            primaryColor: 0xffd700,
            secondaryColor: 0xdaa520,
            accentColor: 0xffff00
        },
        phases: {
            1: {
                healthThreshold: 1.0,
                moveSpeed: 70,
                shootInterval: 1600,
                attacks: [
                    { type: 'spread', count: 7, spacing: 30, speed: 260 },
                    { type: 'circular', count: 6, speed: 180 }
                ]
            },
            2: {
                healthThreshold: 0.66,
                moveSpeed: 85,
                shootInterval: 1200,
                attacks: [
                    { type: 'spread', count: 9, spacing: 25, speed: 280 },
                    { type: 'rapid', count: 4, speed: 350 },
                    { type: 'drones', chance: 0.3 }
                ]
            },
            3: {
                healthThreshold: 0.33,
                moveSpeed: 100,
                shootInterval: 900,
                attacks: [
                    { type: 'circular', count: 12, speed: 220 },
                    { type: 'rapid', count: 5, speed: 400 },
                    { type: 'cross', count: 4, speed: 320 },
                    { type: 'drones', chance: 0.4 }
                ]
            }
        }
    }
};

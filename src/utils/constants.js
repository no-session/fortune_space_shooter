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

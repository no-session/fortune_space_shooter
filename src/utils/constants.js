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
        shootInterval: 3000  // Increased from 2000ms for less aggressive early game
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
    DIAMOND: 'diamond',
    SPIRAL: 'spiral'
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

// Kill Streak Configuration
export const STREAK_CONFIG = {
    DECAY_TIME: 4000,           // 4 seconds to maintain streak
    MULTIPLIER_PER_KILL: 0.05,  // 5% bonus per consecutive kill
    MAX_MULTIPLIER: 3.0,        // Cap at 300%
    MILESTONES: [5, 10, 15, 20, 25, 50]
};

// Bonus System Configuration
export const BONUS_CONFIG = {
    // Wave Clear Bonuses
    WAVE_CLEAR_BASE: 500,
    PERFECT_WAVE_MULTIPLIER: 2.0,  // No damage taken
    FAST_CLEAR_MULTIPLIER: 1.5,    // Under 30 seconds

    // Accuracy Bonuses
    ACCURACY_THRESHOLD: 0.4,       // 40% minimum for bonus
    ACCURACY_EXCELLENT: 0.8,       // 80%+ = excellent
    ACCURACY_GOOD: 0.6,            // 60%+ = good
    ACCURACY_BASE_POINTS: 500,

    // Graze System
    GRAZE_DISTANCE: 35,            // Pixels for near-miss
    GRAZE_POINTS: 25,              // Points per graze
    GRAZE_COOLDOWN: 100            // MS between grazes per bullet
};

// Visual Effect Configuration
export const EFFECT_CONFIG = {
    // Depths
    DEPTH_PARTICLES: 100,
    DEPTH_SCORE_POPUP: 150,
    DEPTH_STREAK_ANNOUNCEMENT: 200,
    DEPTH_BONUS_OVERLAY: 250,

    // Screen Shake Intensities
    SHAKE_SMALL: { duration: 100, intensity: 0.005 },
    SHAKE_MEDIUM: { duration: 200, intensity: 0.01 },
    SHAKE_LARGE: { duration: 300, intensity: 0.015 },
    SHAKE_BOSS: { duration: 500, intensity: 0.025 },

    // Popup Sizes
    POPUP_SMALL: '16px',
    POPUP_MEDIUM: '22px',
    POPUP_LARGE: '28px',
    POPUP_HUGE: '36px',

    // Colors
    COLOR_KILL: '#00ffff',
    COLOR_COLLECTIBLE: '#ffffff',
    COLOR_BONUS: '#ffd700',
    COLOR_STREAK: '#ff00ff',
    COLOR_GRAZE: '#00ffff',
    COLOR_PERFECT: '#00ff00'
};

// Power-Up Types
export const POWERUP_TYPES = {
    SHIELD: 'shield',
    RAPID_FIRE: 'rapid_fire',
    SCREEN_NUKE: 'screen_nuke',
    MAGNET: 'magnet'
};

// Power-Up Configuration
export const POWERUP_CONFIG = {
    [POWERUP_TYPES.SHIELD]: {
        duration: 0,           // Permanent until hits consumed
        color: 0x0088ff,
        glowColor: 0x00aaff,
        label: 'S',
        hitsAbsorbed: 3,
        dropChance: 0.03       // 3% of kills
    },
    [POWERUP_TYPES.RAPID_FIRE]: {
        duration: 10000,       // 10 seconds
        color: 0xff3333,
        glowColor: 0xff5555,
        label: 'R',
        dropChance: 0.03       // 3% of kills
    },
    [POWERUP_TYPES.SCREEN_NUKE]: {
        duration: 0,           // Instant
        color: 0xffffff,
        glowColor: 0xffffaa,
        label: 'N',
        dropChance: 0.02       // 2% of kills (rare)
    },
    [POWERUP_TYPES.MAGNET]: {
        duration: 8000,        // 8 seconds
        color: 0xffdd00,
        glowColor: 0xffee44,
        label: 'M',
        magnetRange: 200,
        dropChance: 0.02       // 2% of kills
    }
};

// Total power-up drop chance (~10% of kills)
export const POWERUP_DROP_CHANCE = 0.10;

// Kill Milestone Configuration
export const KILL_MILESTONES = [
    { kills: 50, text: '🔥 50 KILLS!', color: '#ff6600', confetti: false },
    { kills: 100, text: '💯 100 KILLS!', color: '#ff00ff', confetti: true },
    { kills: 250, text: '⚡ DESTROYER!', color: '#00ffff', confetti: false },
    { kills: 500, text: '👑 LEGEND!', color: '#ffd700', confetti: true }
];

// Ship Skins
export const SHIP_SKINS = {
    default: {
        name: 'Blue Wing',
        tint: null, // no tint, use default texture
        unlockScore: 0,
        description: 'Standard issue fighter'
    },
    red_fury: {
        name: 'Red Fury',
        tint: 0xff4444,
        unlockScore: 1000,
        description: 'Unlocks at 1,000 score'
    },
    golden: {
        name: 'Golden Eagle',
        tint: 0xffd700,
        unlockScore: 5000,
        description: 'Unlocks at 5,000 score'
    },
    rainbow: {
        name: 'Rainbow Rider',
        tint: 'rainbow', // special case: cycles colors
        unlockScore: 10000,
        description: 'Unlocks at 10,000 score',
        colors: [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x8800ff, 0xff00ff]
    }
};

// Random Events
export const RANDOM_EVENTS = {
    MIN_INTERVAL: 60000,  // 60 seconds minimum
    MAX_INTERVAL: 90000,  // 90 seconds maximum
    TYPES: {
        COIN_SHOWER: {
            name: 'COIN SHOWER',
            emoji: '🪙',
            duration: 5000,
            coinCount: 20
        },
        ENEMY_FREEZE: {
            name: 'FREEZE',
            emoji: '❄️',
            duration: 4000
        },
        DOUBLE_POINTS: {
            name: 'DOUBLE POINTS',
            emoji: '2️⃣',
            duration: 10000
        },
        MYSTERY_BOX: {
            name: 'MYSTERY BOX',
            emoji: '❓',
            fallSpeed: 80
        }
    }
};

// Wave Names
export const WAVE_NAMES = {
    1: 'First Contact',
    2: 'Scout Patrol',
    3: 'Getting Serious',
    4: 'Fighter Squadron',
    // Wave 5+ boss waves use boss name
    RANDOM_POOL: [
        'Alien Ambush', 'Space Storm', 'Meteor Shower', 'Dark Fleet',
        'Star Strike', 'Cosmic Chaos', 'Nova Blast', 'Galactic Fury',
        'Supernova', 'Black Hole Battalion'
    ]
};

// Difficulty Modes
export const DIFFICULTY_MODES = {
    EASY: {
        name: 'EASY',
        color: 0x00ff00,
        healthMultiplier: 1.5,
        enemyShootRateMultiplier: 0.7,
        powerUpDropMultiplier: 2.0
    },
    NORMAL: {
        name: 'NORMAL',
        color: 0x00ffff,
        healthMultiplier: 1.0,
        enemyShootRateMultiplier: 1.0,
        powerUpDropMultiplier: 1.0
    },
    HARD: {
        name: 'HARD',
        color: 0xff0000,
        healthMultiplier: 0.7,
        enemyShootRateMultiplier: 1.5,
        powerUpDropMultiplier: 0.5
    }
};

// Combo Announcements
export const COMBO_ANNOUNCEMENTS = [
    { combo: 5, text: 'NICE!', color: '#00ff00', size: '32px' },
    { combo: 10, text: 'AWESOME!', color: '#0088ff', size: '36px' },
    { combo: 15, text: 'INCREDIBLE!', color: '#aa00ff', size: '40px' },
    { combo: 20, text: 'UNSTOPPABLE!', color: '#ff0000', size: '48px' },
    { combo: 30, text: 'GOD MODE!', color: 'rainbow', size: '56px', shake: true }
];

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

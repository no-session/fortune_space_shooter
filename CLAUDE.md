# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Technology Stack

- **Phaser 3.80.1**: Game framework handling rendering, physics, input, and scene management
- **Vite 5**: Build tool and dev server with hot module replacement
- **JavaScript ES6+ modules**: All code uses ES modules syntax

## Architecture Overview

### Scene Flow

The game follows a linear scene progression managed by Phaser's scene system:

1. **BootScene** → Loads all assets (sprites, audio)
2. **MenuScene** → Main menu and leaderboard
3. **GameScene** → Main gameplay loop
4. **ShopScene** → Between boss waves (every 5 waves)
5. **GameOverScene** → Final score and leaderboard entry
6. **PauseScene** → Overlay scene (ESC key)

### Core Game Loop (GameScene)

GameScene orchestrates all gameplay systems through specialized managers:

- **FormationManager**: Creates and updates enemy formations (V, Grid, Circle, Wave patterns)
- **WaveManager**: Controls wave progression, difficulty scaling, and boss spawning (every 5th wave)
- **ScoreManager**: Handles scoring, combo system, and multiplier calculation
- **SoundManager**: Manages all audio playback

### Entity System

All game entities extend `Phaser.Physics.Arcade.Sprite`:

- **Player** (`src/entities/Player.js`): Player ship with manual firing (space bar), banking animations, health/lives system
- **Enemy** (`src/entities/Enemy.js`): Four types (Scout, Fighter, Bomber, Elite) with different stats defined in `constants.js`
- **Boss** (`src/entities/Boss.js`): Multi-phase bosses that spawn every 5 waves
- **Bullet** (`src/entities/Bullet.js`): Projectiles for both player and enemies
- **Collectible** (`src/entities/Collectible.js`): Drops from enemies (Coin, Crystal, Star, Fortune Coin)

### Formation System

Enemy formations are managed separately from individual enemy AI:

- Formations in `src/formations/` define group movement patterns
- Each formation creates enemies and manages their relative positions
- Enemies maintain a `formation` reference and `formationOffset` for coordinated movement
- Formations move as a unit (horizontal oscillation + constant downward movement)
- Individual enemies are removed from formations when destroyed

### Constants and Configuration

All game tuning values are centralized in `src/utils/constants.js`:

- `GAME_CONFIG`: Core game parameters (speeds, dimensions, player stats)
- `ENEMY_TYPES` & `ENEMY_STATS`: Enemy type definitions with health, speed, points, drop chances
- `COLLECTIBLE_TYPES` & `COLLECTIBLE_VALUES`: Collectible scoring values
- `FORMATION_TYPES`: Available formation patterns
- `COLORS`: UI color palette

## Key Gameplay Systems

### Wave Progression

- Wave difficulty scales with enemy count and type distribution
- Boss waves occur every 5 waves (wave % 5 === 0)
- Normal waves spawn multiple formations with delays
- Enemy type selection becomes more varied in higher waves (Scout → Fighter → Bomber → Elite)

### Combo System

- Collecting items within 1-second window builds combo
- Each combo level adds 10% multiplier (combo * 0.1)
- Combo timer resets to 2 seconds on each collectible
- Score calculation: `points * comboMultiplier`

### Visual Effects

- Parallax scrolling starfield (2 layers at different speeds)
- Background image scrolls continuously
- Screen shake on explosions and damage
- Particle effects for impacts
- Banking animations for player and enemies based on horizontal movement

## Asset Structure

Assets are loaded in BootScene:

- Sprites: Located in `assets/sprites/` (Kenney Pixel Shmup assets)
- Audio: Located in `assets/audio/`
- Background: `assets/images/background.png`
- All assets use CC0/public domain licensing

## Important Implementation Notes

### Array Iteration Safety

When iterating over game object arrays that may be modified during iteration (enemies, collectibles, bullets), use reverse iteration:

```javascript
for (let i = array.length - 1; i >= 0; i--) {
    // Process array[i]
}
```

This prevents skipping elements when items are removed mid-loop.

### Entity Lifecycle

- Entities are added to Phaser groups (`this.enemies`, `this.collectibles`, etc.)
- Physics collisions are configured in `GameScene.setupCollisions()`
- Call `destroy()` on entities to properly clean up sprites and physics bodies
- Formation manager automatically removes formations when `enemies.length === 0`

### Player Controls

- Movement: WASD or Arrow Keys
- Shoot: SPACE (manual fire only, `autoFire` is disabled)
- Pause: ESC
- Player has banking animation frames: `player_l1`, `player_l2`, `player_m`, `player_r1`, `player_r2`

## Debugging

The codebase currently contains debug logging code (fetch calls to localhost:7247) in `ScoreManager.js`. These can be safely removed or commented out for production builds.

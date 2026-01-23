# Space Shooter Game - Testing Checklist

## Pre-Deployment Testing Guide

This document outlines comprehensive tests to catch common issues before deploying to production.

---

## 1. Asset Loading Tests

### Verify All Assets Load
- [ ] Start game and check browser console for "Failed to load asset" errors
- [ ] Verify player ship sprites appear (not green placeholders)
- [ ] Verify enemy ships appear with correct colors (green scouts, red fighters, blue bombers)
- [ ] Verify explosions animate properly
- [ ] Verify collectibles (coins, crystals, stars) appear correctly
- [ ] Verify background scrolls smoothly
- [ ] Check exhaust animation behind player ship

### Missing Asset Handling
- [ ] Game should not crash if an asset fails to load
- [ ] Console warnings should appear for missing assets
- [ ] Fallback graphics/animations should display

---

## 2. Player Mechanics Tests

### Basic Movement
- [ ] Arrow keys move player in all 4 directions
- [ ] WASD keys move player in all 4 directions
- [ ] Player cannot move outside screen boundaries
- [ ] Diagonal movement speed is normalized (not faster)
- [ ] Player ship banks left/right when moving horizontally

### Shooting Mechanics
- [ ] Space bar fires bullets upward
- [ ] Holding space fires continuously (auto-fire disabled)
- [ ] Bullets move upward at correct speed
- [ ] Bullets destroy when they leave screen bounds
- [ ] No bullet limit/lag even with rapid firing

### Player Health & Lives
- [ ] Player takes damage when hit by enemy bullets
- [ ] Player flashes red briefly when damaged
- [ ] Player becomes invincible for ~200ms after taking damage
- [ ] Screen shakes when player is hit
- [ ] Player dies when health reaches 0
- [ ] **CRITICAL:** Player remains visible throughout gameplay (never vanishes)
- [ ] **CRITICAL:** Respawn blink animation doesn't make player invisible
- [ ] Blink animation shows player between 40-100% opacity (always visible)

### Respawn System
- [ ] Player respawns at center-bottom after dying (if lives remaining)
- [ ] Player is invincible for 2 seconds after respawning
- [ ] Player blinks during invincibility period
- [ ] Player becomes fully visible (alpha = 1) after invincibility ends
- [ ] Lives counter decrements correctly
- [ ] Game over triggers when all lives are lost

### Collision Detection
- [ ] Player bullets destroy enemies on hit
- [ ] Enemy bullets damage player on hit
- [ ] Enemies damage player on collision
- [ ] Collectibles are collected when player touches them
- [ ] **CRITICAL:** Collisions work even during respawn blink animation
- [ ] No crashes with error "player.takeDamage is not a function"

---

## 3. Enemy Mechanics Tests

### Enemy Types & Spawning
- [ ] Scout enemies (green) appear in early waves
- [ ] Fighter enemies (red) appear from wave 3+
- [ ] Bomber enemies (blue) appear from wave 6+
- [ ] Elite enemies appear from wave 10+
- [ ] Enemies spawn in formations (V, Grid, Circle, Wave)
- [ ] Enemies move smoothly in formation patterns

### Enemy Combat
- [ ] Fighter enemies shoot red bullets downward
- [ ] **CRITICAL:** Enemy bullets MOVE downward (not stationary like mines)
- [ ] Enemy bullets travel at ~400 pixels/second
- [ ] Enemy bullets are visible (small red circles)
- [ ] Enemy bullets damage player on contact
- [ ] **CRITICAL:** No console warnings "Failed to create enemy bullet"
- [ ] Enemies take damage when hit by player bullets
- [ ] Enemies flash white when damaged
- [ ] Enemies die after taking enough damage

### Enemy Death & Drops
- [ ] Explosion animation plays when enemy dies
- [ ] Explosion sound plays
- [ ] Collectibles drop randomly based on dropChance
- [ ] Score increases when enemy is killed
- [ ] Enemy bullets are destroyed when enemy dies
- [ ] No crashes with error "Cannot read properties of undefined (reading 'textures')"

---

## 4. Boss Battle Tests

### Boss Spawning
- [ ] Boss appears every 5th wave (waves 5, 10, 15, etc.)
- [ ] Boss health bar appears at top of screen
- [ ] Boss phases are displayed (Phase 1, Phase 2, Phase 3)
- [ ] Boss moves across the screen

### Boss Combat
- [ ] Boss shoots multiple bullet patterns
- [ ] Boss bullets damage player (15 damage vs 10 for regular enemies)
- [ ] Boss takes damage from player bullets
- [ ] Boss health bar updates in real-time
- [ ] Boss transitions through phases as health decreases
- [ ] Boss becomes more aggressive in later phases

### Boss Death
- [ ] **CRITICAL:** Multiple explosions appear when boss dies (5 explosions staggered)
- [ ] **CRITICAL:** No crash with "Cannot read properties of undefined (reading 'textures')"
- [ ] Screen shakes intensely during boss death
- [ ] Screen flash effect occurs
- [ ] Boss health bar is destroyed
- [ ] Boss defeat callback is triggered after 800ms
- [ ] Upgrade shop appears after boss is defeated

---

## 5. Wave System Tests

### Wave Progression
- [ ] Wave counter displays current wave number
- [ ] "Wave X Complete!" message appears between waves
- [ ] Next wave starts after completion message fades
- [ ] Enemy count increases with each wave
- [ ] Enemy difficulty increases with wave number
- [ ] Formations become more complex in later waves

### Wave Transitions
- [ ] Game pauses briefly between waves
- [ ] **CRITICAL:** No duplicate wave transitions
- [ ] Wave counter updates correctly
- [ ] Enemy formations don't overlap during transition

---

## 6. Upgrade Shop Tests

### Shop Appearance
- [ ] Shop appears after completing boss wave
- [ ] Shop displays "UPGRADE SHOP" title
- [ ] Currency is calculated from score (score / 100)
- [ ] Currency display shows correct amount
- [ ] Four upgrade options are shown:
  - Weapon Upgrade (50 currency)
  - Speed Upgrade (30 currency)
  - Health Boost (40 currency)
  - Extra Life (100 currency)

### Shop Functionality
- [ ] Can purchase upgrades if enough currency
- [ ] Cost text is green if affordable, red if not
- [ ] Hover effect works on upgrade buttons
- [ ] Purchase feedback (button flashes green)
- [ ] Currency decreases after purchase
- [ ] Upgrade is applied immediately to player
- [ ] Can purchase multiple upgrades

### Shop Closing & Reopening Issues
- [ ] **CRITICAL:** "Continue" button works
- [ ] **CRITICAL:** Shop closes when Continue is clicked
- [ ] **CRITICAL:** Game resumes after shop closes
- [ ] **CRITICAL:** Shop does NOT reopen when pressing space/arrow keys
- [ ] **CRITICAL:** Shop does NOT reopen repeatedly in a loop
- [ ] **CRITICAL:** Shop only appears once per boss wave
- [ ] Next wave starts properly after shop closes

---

## 7. Collectible System Tests

### Collectible Types
- [ ] Coins (gold circles) drop from enemies
- [ ] Crystals (blue diamonds) drop rarely
- [ ] Stars (yellow stars) drop very rarely
- [ ] Fortune coins (special gold) drop extremely rarely

### Collectible Behavior
- [ ] Collectibles move downward slowly
- [ ] Collectibles drift slightly left/right
- [ ] Collectibles rotate continuously
- [ ] Rare collectibles pulse in size
- [ ] Fortune coins have gold tint

### Collection Mechanics
- [ ] Score popup appears when collected (+10, +25, +50, +100)
- [ ] Particle effect bursts outward from collection point
- [ ] Collect sound plays
- [ ] Score increases immediately
- [ ] **CRITICAL:** No game freeze/hang when collecting items
- [ ] **CRITICAL:** No error "Cannot read properties of undefined (reading 'setVelocity')"
- [ ] Multiple collectibles can be collected rapidly without issues
- [ ] Collectibles destroyed when leaving screen bounds

---

## 8. UI & HUD Tests

### Score Display
- [ ] Score displays in top-left
- [ ] Score updates in real-time
- [ ] Score persists between waves
- [ ] Score is passed to shop correctly

### Lives Display
- [ ] Lives count displays in top-right
- [ ] Lives are green colored
- [ ] Lives decrement when player dies
- [ ] Lives increase when Extra Life is purchased

### Wave Display
- [ ] Wave number displays in top-right
- [ ] Wave updates between waves
- [ ] Wave is passed to shop correctly

### Health Bar (if implemented)
- [ ] Health bar shows current/max health
- [ ] Health bar color changes based on health level
- [ ] Health bar updates smoothly

---

## 9. Scene Management Tests

### Scene Transitions
- [ ] Boot → Menu → Game transitions work
- [ ] Pause menu works (ESC key)
- [ ] Can resume from pause menu
- [ ] Game over scene appears when lives = 0
- [ ] Can restart from game over scene
- [ ] Can return to main menu

### Scene State
- [ ] Game state is preserved when pausing
- [ ] Enemies don't move when paused
- [ ] Player can't take damage when paused
- [ ] Bullets stop moving when paused
- [ ] Time-based events pause correctly

---

## 10. Performance Tests

### Frame Rate
- [ ] Game runs at steady 60 FPS
- [ ] No frame drops during heavy action
- [ ] Smooth scrolling background
- [ ] Smooth enemy formations
- [ ] No stuttering during explosions

### Memory Leaks
- [ ] Play for 10+ minutes without slowdown
- [ ] Complete 10+ waves without issues
- [ ] Defeat 3+ bosses without memory issues
- [ ] Check browser memory usage stays reasonable
- [ ] No accumulation of destroyed objects

### Object Cleanup
- [ ] Bullets are destroyed off-screen
- [ ] Enemies are destroyed when killed
- [ ] Explosions are destroyed after animation
- [ ] Collectibles are destroyed off-screen
- [ ] Tweens are stopped when objects destroyed
- [ ] Event listeners are removed on destroy

---

## 11. Error Handling Tests

### Common Errors to Check For
- [ ] **ERR_CONNECTION_REFUSED**: No debug fetch() calls in production
- [ ] **"player.isAlive is not a function"**: Use this.player in callbacks
- [ ] **"player.takeDamage is not a function"**: Use this.player in callbacks
- [ ] **"Cannot read properties of undefined (reading 'textures')"**: Add null checks
- [ ] **"Cannot read properties of undefined (reading 'setVelocity')"**: Check body exists
- [ ] **"Cannot read properties of undefined (reading 'time')"**: Check scene.time exists
- [ ] **Failed to create enemy bullet**: Check physics group initialization

### Defensive Programming Checks
- [ ] All scene references checked before use (this.scene && this.scene.time)
- [ ] All physics bodies checked (this.body && this.active)
- [ ] All texture existence checked before sprite creation
- [ ] All animation existence checked before playing
- [ ] All delayed callbacks store references to avoid undefined
- [ ] All group operations pass preserve flag when needed

---

## 12. Audio Tests (if implemented)

### Sound Effects
- [ ] Player shoot sound plays
- [ ] Enemy shoot sound plays
- [ ] Explosion sounds play
- [ ] Collect sound plays
- [ ] Boss defeat sound plays

### Background Music
- [ ] Music starts with game
- [ ] Music loops properly
- [ ] Music volume is reasonable
- [ ] Music stops on game over

---

## 13. Input Tests

### Keyboard Input
- [ ] Arrow keys work
- [ ] WASD keys work
- [ ] Space bar works
- [ ] ESC key pauses game
- [ ] Multiple keys can be pressed simultaneously
- [ ] Key repeat works correctly (holding space)

### Input During Special States
- [ ] Input works during normal gameplay
- [ ] Input disabled during pause
- [ ] Input disabled during shop
- [ ] Input disabled during game over
- [ ] **CRITICAL:** Input doesn't trigger shop reopening

---

## 14. Browser Compatibility Tests

### Test in Multiple Browsers
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Chrome (if mobile supported)
- [ ] Mobile Safari (if mobile supported)

### Screen Sizes
- [ ] 1920x1080 (Full HD)
- [ ] 1366x768 (Laptop)
- [ ] 2560x1440 (2K)
- [ ] 3840x2160 (4K)
- [ ] Mobile portrait (if supported)
- [ ] Mobile landscape (if supported)

---

## 15. Production Deployment Tests

### Vercel/Production Environment
- [ ] All assets load correctly (not 404)
- [ ] public/ directory is deployed
- [ ] No console errors on load
- [ ] Game initializes properly
- [ ] Same functionality as local development
- [ ] No CORS errors
- [ ] No missing dependencies

### Build Process
- [ ] `npm run build` succeeds
- [ ] `npm run preview` shows working game
- [ ] No build warnings
- [ ] Bundle size is reasonable
- [ ] Assets are bundled correctly

---

## Testing Workflow

### Before Each Commit
1. Run local dev server: `npm run dev`
2. Test the specific feature you changed
3. Play through at least 2-3 waves
4. Check browser console for errors
5. Test edge cases related to your change

### Before Each Push
1. Build production bundle: `npm run build`
2. Preview production build: `npm run preview`
3. Play through at least 5 waves
4. Defeat at least 1 boss
5. Check all console logs/errors
6. Test in 2+ browsers

### Before Production Deploy
1. Complete full playthrough (10+ waves)
2. Defeat 2+ bosses
3. Test all upgrade options
4. Intentionally die to test game over
5. Test pause/resume multiple times
6. Check performance metrics
7. Review all console logs
8. Test on production domain after deploy

---

## Known Issues Fixed

✅ Player vanishing after being hit
✅ Enemy bullets not moving (appearing as stationary mines)
✅ Shop reopening repeatedly when pressing keys
✅ Boss explosion crash (textures undefined)
✅ Game freezing when collecting items
✅ Player disappearing after losing lives
✅ Console errors from debug fetch() calls
✅ Missing sprites in production (public/ not deployed)
✅ Collision callbacks using wrong player reference
✅ Physics body undefined crashes

---

## Emergency Debugging

If you encounter an error in production:

1. **Check browser console** for the exact error message
2. **Note the file and line number** (e.g., Boss.js:228)
3. **Check if scene/body/texture exists** before accessing
4. **Store references** before delayed callbacks
5. **Add defensive null checks** everywhere
6. **Test locally** after fixing before deploying

---

## Quick Test Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for type errors (if using TypeScript)
npm run type-check

# Run linter
npm run lint
```

---

## Success Criteria

The game is ready for production when:

- ✅ Can play for 15+ minutes without crashes
- ✅ Can complete 10+ waves without errors
- ✅ Can defeat 2+ bosses without issues
- ✅ All console errors are resolved
- ✅ All critical tests pass
- ✅ Performance remains stable
- ✅ Works in all target browsers
- ✅ Assets load correctly in production

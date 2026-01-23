# Automated Gameplay Tests

## Overview

This directory contains Playwright automated tests for the Space Shooter game. These tests will automatically play the game in your Chromium browser and verify functionality.

---

## Setup

Playwright is already installed. If you need to reinstall:

```bash
npm install -D @playwright/test
```

---

## Running Tests

### 1. Quick Test (Recommended First)

Run basic tests to verify game loads:

```bash
npm run test:basic
```

**Tests included:**
- Game loads without errors
- Assets load correctly
- Canvas renders
- Menu scene appears

**Duration:** ~30 seconds

---

### 2. Gameplay Tests

Run tests that simulate actual gameplay:

```bash
npm run test:gameplay
```

**Tests included:**
- 30-second gameplay session
- Player controls (arrows, WASD, space)
- Critical error detection
- Rapid input stress test

**Duration:** ~2 minutes

---

### 3. Advanced Tests

Run comprehensive long-duration tests:

```bash
npm run test:advanced
```

**Tests included:**
- 2-minute gameplay session
- Pause and resume functionality
- Memory leak detection
- Wave progression
- Shop popup loop bug check

**Duration:** ~5-10 minutes

---

### 4. Run All Tests

Run every test:

```bash
npm test
```

**Duration:** ~15 minutes

---

### 5. Watch Tests Run (Headed Mode)

See the browser while tests run:

```bash
npm run test:headed
```

This opens a visible browser window so you can watch the game being played automatically.

---

### 6. Interactive UI Mode

Run tests with Playwright's interactive UI:

```bash
npm run test:ui
```

This gives you:
- Visual test progress
- Ability to run individual tests
- Step-by-step debugging
- Screenshots and videos

---

## Test Results

### Where Results Are Saved

- **Screenshots:** `test-results/*.png`
- **Videos:** `test-results/videos/` (on failure)
- **HTML Report:** Run `npm run test:report` to view

### Viewing the Report

After tests complete:

```bash
npm run test:report
```

This opens a detailed HTML report showing:
- Pass/fail status for each test
- Screenshots at various points
- Console logs and errors
- Execution times

---

## Test Files

### `game-basic.spec.js`
Basic smoke tests:
- ✅ Game loads
- ✅ Assets load
- ✅ Canvas renders
- ✅ Menu appears

### `game-gameplay.spec.js`
Gameplay functionality:
- ✅ 30-second play session
- ✅ All controls work
- ✅ No critical errors
- ✅ Rapid input handling

### `game-advanced.spec.js`
Long-running tests:
- ✅ 2-minute play session
- ✅ Pause/resume
- ✅ Memory leak check
- ✅ Wave progression
- ✅ Shop popup bug

---

## What Gets Tested

### ✅ Verified Automatically

1. **Console Errors**
   - No undefined property errors
   - No "is not a function" errors
   - No connection refused errors

2. **Game Loading**
   - All assets load successfully
   - No missing texture warnings
   - Canvas initializes properly

3. **Player Controls**
   - Arrow keys work
   - WASD keys work
   - Space bar shoots

4. **Performance**
   - No memory leaks
   - Game remains stable over time
   - Rapid input doesn't crash game

5. **Bug Regressions**
   - Shop doesn't reopen in loop
   - No physics undefined crashes
   - No texture undefined crashes

---

## Understanding Test Output

### ✅ Passing Test
```
✅ Game loaded without console errors
PASS tests/game-basic.spec.js
```

### ❌ Failing Test
```
❌ Critical error detected: Cannot read properties of undefined
FAIL tests/game-gameplay.spec.js
```

### Console Messages
Tests will log progress:
```
🎮 Game started, playing for 30 seconds...
📸 Screenshot taken at 0 seconds
📸 Screenshot taken at 10 seconds
✅ Played for 30 seconds without crashes
```

---

## Troubleshooting

### Tests Fail to Start

**Issue:** "baseURL is not available"

**Fix:** Make sure dev server is running:
```bash
npm run dev
```
Then in another terminal:
```bash
npm test
```

---

### Browser Not Found

**Issue:** "Browser not found"

**Fix:** Install Chromium:
```bash
npx playwright install chromium
```

Or specify your Chromium path in `playwright.config.js`:
```javascript
executablePath: '/path/to/your/chromium'
```

---

### Tests Timeout

**Issue:** Tests take too long and timeout

**Solution:** Increase timeout in test file:
```javascript
test.setTimeout(180000); // 3 minutes
```

---

### Can't See What's Happening

**Solution:** Run in headed mode:
```bash
npm run test:headed
```

Or use UI mode:
```bash
npm run test:ui
```

---

## CI/CD Integration

To run tests in CI/CD pipeline:

```bash
# Install dependencies
npm install

# Install browsers
npx playwright install --with-deps chromium

# Build the app
npm run build

# Run tests
npm test
```

---

## Test Coverage

### Currently Tested ✅
- Game initialization
- Asset loading
- Player controls
- Console error detection
- Memory stability
- Input handling
- Wave progression
- Shop popup bug

### Not Yet Tested ❌
- Specific enemy behavior
- Boss battle mechanics
- Collectible system
- Score accuracy
- Audio playback
- Upgrade system functionality

---

## Adding New Tests

Create a new test file in `tests/`:

```javascript
import { test, expect } from '@playwright/test';

test('Your test name', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3000);

  // Your test code here

  await page.screenshot({ path: 'test-results/my-test.png' });
});
```

Run your new test:
```bash
npx playwright test your-test-file.spec.js
```

---

## Best Practices

1. **Always check for console errors:**
   ```javascript
   const errors = [];
   page.on('console', msg => {
     if (msg.type() === 'error') errors.push(msg.text());
   });
   ```

2. **Take screenshots at key points:**
   ```javascript
   await page.screenshot({ path: 'test-results/checkpoint.png' });
   ```

3. **Use appropriate timeouts:**
   - Short tests: 30-60 seconds
   - Gameplay: 2-3 minutes
   - Long tests: 5-10 minutes

4. **Wait for game to load:**
   ```javascript
   await page.waitForTimeout(3000); // Wait 3 seconds
   ```

---

## Quick Commands Reference

```bash
# Basic tests (30 seconds)
npm run test:basic

# Gameplay tests (2 minutes)
npm run test:gameplay

# Advanced tests (10 minutes)
npm run test:advanced

# All tests (15 minutes)
npm test

# Watch tests run
npm run test:headed

# Interactive UI
npm run test:ui

# View report
npm run test:report
```

---

## Expected Results

After running all tests, you should see:

```
✅ 4/4 tests in game-basic.spec.js passed
✅ 4/4 tests in game-gameplay.spec.js passed
✅ 5/5 tests in game-advanced.spec.js passed

Total: 13 tests, 13 passed, 0 failed
```

If all tests pass, your game is production-ready! 🎮🚀

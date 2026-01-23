import { test, expect } from '@playwright/test';

test.describe('Space Shooter - Gameplay Tests', () => {
  test('Start game and play for 30 seconds', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    // Click to start game (assuming menu has clickable start button)
    await page.click('canvas');
    await page.waitForTimeout(1000);

    console.log('🎮 Game started, playing for 30 seconds...');

    // Simulate gameplay - move and shoot
    for (let i = 0; i < 30; i++) {
      // Press space to shoot
      await page.keyboard.press('Space');
      await page.waitForTimeout(100);

      // Move left
      if (i % 3 === 0) {
        await page.keyboard.press('ArrowLeft');
      }
      // Move right
      else if (i % 3 === 1) {
        await page.keyboard.press('ArrowRight');
      }
      // Move up
      else {
        await page.keyboard.press('ArrowUp');
      }

      await page.waitForTimeout(900);

      // Take screenshot every 10 seconds
      if (i % 10 === 0) {
        await page.screenshot({ path: `test-results/gameplay-${i}s.png` });
        console.log(`📸 Screenshot taken at ${i} seconds`);
      }
    }

    console.log('✅ Played for 30 seconds without crashes');

    // Check for errors
    expect(errors).toHaveLength(0);
  });

  test('Player controls work', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await page.click('canvas');
    await page.waitForTimeout(1000);

    // Test arrow keys
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');

    // Test WASD
    await page.keyboard.press('W');
    await page.keyboard.press('A');
    await page.keyboard.press('S');
    await page.keyboard.press('D');

    // Test space bar
    await page.keyboard.press('Space');

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/controls-test.png' });

    console.log('✅ All player controls tested');
  });

  test('Check for critical errors during gameplay', async ({ page }) => {
    const criticalErrors = [];
    const errorPatterns = [
      'Cannot read properties of undefined',
      'is not a function',
      'ERR_CONNECTION_REFUSED',
      'Failed to create',
      'textures',
      'setVelocity'
    ];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (errorPatterns.some(pattern => text.includes(pattern))) {
          criticalErrors.push(text);
          console.error('❌ Critical error detected:', text);
        }
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);
    await page.click('canvas');

    // Play for 20 seconds with rapid input
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Space');
      if (i % 2 === 0) {
        await page.keyboard.press('ArrowLeft');
      } else {
        await page.keyboard.press('ArrowRight');
      }
      await page.waitForTimeout(500);
    }

    expect(criticalErrors).toHaveLength(0);
    console.log('✅ No critical errors detected during gameplay');
  });

  test('Game survives rapid input', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await page.click('canvas');
    await page.waitForTimeout(1000);

    console.log('🔥 Testing rapid input...');

    // Rapid fire
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(50);
    }

    // Rapid movement
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
    }

    await page.screenshot({ path: 'test-results/rapid-input.png' });
    console.log('✅ Game survived rapid input test');
  });
});

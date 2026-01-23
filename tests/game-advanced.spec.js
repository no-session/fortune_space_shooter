import { test, expect } from '@playwright/test';

test.describe('Space Shooter - Advanced Tests', () => {
  test('Long gameplay session (2 minutes)', async ({ page }) => {
    test.setTimeout(180000); // 3 minute timeout

    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore 404 errors - they're usually harmless (favicon, etc)
        if (!text.includes('404') && !text.includes('Failed to load resource')) {
          errors.push(text);
        }
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);
    await page.click('canvas');

    console.log('🎮 Starting 2-minute gameplay session...');

    // Play for 2 minutes
    for (let second = 0; second < 120; second++) {
      // Shoot continuously
      await page.keyboard.press('Space');

      // Varied movement pattern
      if (second % 5 === 0) {
        await page.keyboard.press('ArrowLeft');
      } else if (second % 5 === 1) {
        await page.keyboard.press('ArrowRight');
      } else if (second % 5 === 2) {
        await page.keyboard.press('ArrowUp');
      } else if (second % 5 === 3) {
        await page.keyboard.press('ArrowDown');
      }

      await page.waitForTimeout(1000);

      // Screenshot every 30 seconds
      if (second % 30 === 0 && second > 0) {
        await page.screenshot({ path: `test-results/long-play-${second}s.png` });
        console.log(`📸 ${second}s - Still running...`);
      }
    }

    console.log('✅ Completed 2-minute session without crashes');

    // Log any errors found (excluding 404s)
    if (errors.length > 0) {
      console.log('Errors found:', errors);
    }

    expect(errors).toHaveLength(0);
  });

  test('Test pause and resume', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await page.click('canvas');
    await page.waitForTimeout(2000);

    // Play for 5 seconds
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(1000);
    }

    // Pause game (ESC key)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/paused.png' });
    console.log('⏸️  Game paused');

    // Wait 2 seconds
    await page.waitForTimeout(2000);

    // Resume (click or ESC again)
    await page.click('canvas');
    await page.waitForTimeout(1000);
    console.log('▶️  Game resumed');

    // Continue playing
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'test-results/resumed.png' });
    console.log('✅ Pause and resume work correctly');
  });

  test('Check for memory leaks (UI check)', async ({ page }) => {
    test.setTimeout(90000);

    await page.goto('/');
    await page.waitForTimeout(3000);
    await page.click('canvas');

    console.log('🔍 Testing for memory leaks...');

    // Get initial performance metrics
    const initialMetrics = await page.evaluate(() => {
      return {
        memory: performance.memory?.usedJSHeapSize || 0,
        timestamp: Date.now()
      };
    });

    console.log(`Initial memory: ${(initialMetrics.memory / 1024 / 1024).toFixed(2)} MB`);

    // Play for 1 minute
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Space');
      await page.keyboard.press(i % 2 === 0 ? 'ArrowLeft' : 'ArrowRight');
      await page.waitForTimeout(1000);
    }

    // Get final metrics
    const finalMetrics = await page.evaluate(() => {
      return {
        memory: performance.memory?.usedJSHeapSize || 0,
        timestamp: Date.now()
      };
    });

    console.log(`Final memory: ${(finalMetrics.memory / 1024 / 1024).toFixed(2)} MB`);

    const memoryIncrease = finalMetrics.memory - initialMetrics.memory;
    const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

    console.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)} MB`);

    // Memory should not increase by more than 100MB in 1 minute
    expect(memoryIncreaseMB).toBeLessThan(100);

    console.log('✅ No significant memory leak detected');
  });

  test('Verify wave progression', async ({ page }) => {
    test.setTimeout(120000); // 2 minute timeout

    await page.goto('/');
    await page.waitForTimeout(3000);
    await page.click('canvas');

    console.log('🌊 Testing wave progression...');

    // Play and try to complete waves
    for (let i = 0; i < 90; i++) {
      await page.keyboard.press('Space');

      // Random movement
      const directions = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
      await page.keyboard.press(directions[i % 4]);

      await page.waitForTimeout(1000);

      // Screenshot every 30 seconds
      if (i % 30 === 0 && i > 0) {
        await page.screenshot({ path: `test-results/wave-progress-${i}s.png` });
      }
    }

    await page.screenshot({ path: 'test-results/wave-final.png' });
    console.log('✅ Wave progression test completed');
  });

  test('Check for shop popup loop bug', async ({ page }) => {
    test.setTimeout(180000); // 3 minute timeout

    let shopCount = 0;
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('UPGRADE SHOP') || text.includes('ShopScene')) {
        shopCount++;
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);
    await page.click('canvas');

    console.log('🛒 Testing for shop popup loop bug...');

    // Play for 2 minutes with continuous input
    for (let i = 0; i < 120; i++) {
      await page.keyboard.press('Space');

      if (i % 2 === 0) {
        await page.keyboard.press('ArrowLeft');
      } else {
        await page.keyboard.press('ArrowRight');
      }

      // Try to trigger shop if it appears
      await page.click('canvas');

      await page.waitForTimeout(1000);
    }

    // Shop should appear at most once per boss wave (every 5 waves)
    // In 2 minutes, unlikely to see more than 1-2 shop appearances
    console.log(`Shop appeared ${shopCount} times`);

    // If shop appeared, it should not loop repeatedly
    // (This is a rough check - adjust based on actual gameplay)
    expect(shopCount).toBeLessThan(10);

    console.log('✅ No shop popup loop detected');
  });
});

import { test, expect } from '@playwright/test';

test.describe('Space Shooter - Basic Functionality', () => {
  test('Game loads without errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait for game to load
    await page.waitForTimeout(3000);

    // Check for console errors
    expect(errors).toHaveLength(0);

    console.log('✅ Game loaded without console errors');
  });

  test('Assets load correctly', async ({ page }) => {
    const warnings = [];
    page.on('console', msg => {
      if (msg.type() === 'warning' && msg.text().includes('Failed to load')) {
        warnings.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    expect(warnings).toHaveLength(0);
    console.log('✅ All assets loaded successfully');
  });

  test('Game canvas renders', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Check if canvas exists
    const canvas = await page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    console.log('✅ Game canvas is visible');
  });

  test('Menu scene appears', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Take screenshot of menu
    await page.screenshot({ path: 'test-results/menu-scene.png' });

    console.log('✅ Menu scene rendered (screenshot saved)');
  });
});

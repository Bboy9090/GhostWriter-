import { test, expect } from '@playwright/test';

test.describe('GhostWriter E2E Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load
    await expect(page).toHaveTitle(/GhostWriter/i);
  });

  test('app is accessible', async ({ page }) => {
    await page.goto('/');

    // Check for basic accessibility
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent.first()).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test('home loads and shows header', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header')).toBeVisible();
  await expect(page).toHaveTitle(/PC|Forge|React/i);
});

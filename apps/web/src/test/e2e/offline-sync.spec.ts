import { test, expect } from '@playwright/test';

test.describe('Offline ecommerce flow', () => {
  test('login and browse shop', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText('Discover something new')).toBeVisible();
  });

  test('add to cart while offline', async ({ page, context }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/dashboard/);

    await context.setOffline(true);
    await page.getByRole('button', { name: 'Go offline' }).click();
    await page.getByRole('button', { name: 'Add to cart' }).first().click();
    await expect(page.getByText('Added to cart')).toBeVisible({ timeout: 5000 });
  });
});

import { expect, test } from '@playwright/test';

test('home screen loads listings and starts checkout', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('home-selection')).toBeVisible();
  await expect(page.getByTestId('selection-screen')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Ed Sheeran/)).toBeVisible();

  await page.getByTestId('listing-card-listing_1').click();
  await page.getByTestId('listing-continue').click();

  await expect(page).toHaveURL(/\/checkout\//, { timeout: 15_000 });
});

import { expect, test } from '@playwright/test';

/**
 * Verifies that framework-themed demo pages expose the same core workflows.
 */
test.describe('framework demos', () => {
    test('runs bootstrap demo custom, alert, and confirm flows', async ({ page }) => {
        await page.goto('/demo/bootstrap.html');

        await page.getByRole('button', { name: 'Open custom modal' }).click();
        await expect(page.locator('.vm-overlay.vm-open')).toBeVisible();
        await page.locator('.vm-overlay.vm-open [data-button-id="save"]').click();
        await expect(page.locator('#result')).toContainText('Save action fired');
        await expect(page.locator('.vm-overlay.vm-open')).toHaveCount(0);

        await page.getByRole('button', { name: 'Open alert' }).click();
        await expect(page.locator('.vm-overlay.vm-open')).toBeVisible();
        await page.locator('.vm-overlay.vm-open [data-button-id="ok"]').click();
        await expect(page.locator('#result')).toContainText('Alert result: true');

        await page.getByRole('button', { name: 'Open confirm' }).click();
        await expect(page.locator('.vm-overlay.vm-open')).toBeVisible();
        await page.locator('.vm-overlay.vm-open [data-button-id="cancel"]').click();
        await expect(page.locator('#result')).toContainText('Confirm result: false');
    });

    test('runs mui demo custom, alert, and confirm flows', async ({ page }) => {
        await page.goto('/demo/mui.html');

        await page.getByRole('button', { name: 'Open custom modal' }).click();
        await expect(page.locator('.vm-overlay.vm-open')).toBeVisible();
        await page.locator('.vm-overlay.vm-open [data-button-id="save"]').click();
        await expect(page.locator('#result')).toContainText('Save action fired');
        await expect(page.locator('.vm-overlay.vm-open')).toHaveCount(0);

        await page.getByRole('button', { name: 'Open alert' }).click();
        await expect(page.locator('.vm-overlay.vm-open')).toBeVisible();
        await page.locator('.vm-overlay.vm-open [data-button-id="ok"]').click();
        await expect(page.locator('#result')).toContainText('Alert result: true');

        await page.getByRole('button', { name: 'Open confirm' }).click();
        await expect(page.locator('.vm-overlay.vm-open')).toBeVisible();
        await page.locator('.vm-overlay.vm-open [data-button-id="cancel"]').click();
        await expect(page.locator('#result')).toContainText('Confirm result: false');
    });
});

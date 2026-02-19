import { expect, test } from '@playwright/test';
import { openScenario } from './helpers.js';

/**
 * Verifies alert and confirm shortcut behavior in browser runtime.
 */
test.describe('shortcut dialogs', () => {
    test('handles alert shortcut', async ({ page }) => {
        await openScenario(page, 'basic');
        await page.getByRole('button', { name: 'Alert' }).click();
        await expect(page.locator('.vm-overlay.vm-open')).toBeVisible();
        await page.locator('.vm-overlay.vm-open [data-button-id="ok"]').click();
        await expect(page.locator('#result')).toContainText('alert:true');
    });

    test('handles confirm shortcut cancel path', async ({ page }) => {
        await openScenario(page, 'basic');
        await page.getByRole('button', { name: 'Confirm' }).click();
        await expect(page.locator('.vm-overlay.vm-open')).toBeVisible();
        await page.locator('.vm-overlay.vm-open [data-button-id="cancel"]').click();
        await expect(page.locator('#result')).toContainText('confirm:false');
    });
});

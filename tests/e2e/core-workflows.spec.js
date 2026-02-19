import { expect, test } from '@playwright/test';
import { openScenario, readEvents, readState } from './helpers.js';

/**
 * Verifies core open/close workflows in browser runtime.
 */
test.describe('core workflows', () => {
    test('opens and closes modal through fixture controls', async ({ page }) => {
        await openScenario(page, 'basic');

        await page.getByRole('button', { name: 'Open' }).click();
        await expect(page.locator('.vm-overlay.vm-open')).toBeVisible();

        await page.locator('#close').click({ force: true });
        await expect(page.locator('.vm-overlay.vm-open')).toHaveCount(0);

        const events = await readEvents(page);
        expect(events).toContain('show');
        expect(events).toContain('hidden');
    });

    test('reflects configured defaults scenario', async ({ page }) => {
        await openScenario(page, 'defaults');
        const state = await readState(page);
        expect(state.result).toContain('closable-default:false');
    });
});

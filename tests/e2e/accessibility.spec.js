import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Verifies baseline accessibility rules on fixture and demo pages.
 */
test.describe('accessibility', () => {
    test('has no serious accessibility violations in fixture modal flow', async ({ page }) => {
        await page.goto('/?scenario=basic');
        await page.waitForFunction(() => document.body.dataset.ready === 'true');
        await page.getByRole('button', { name: 'Open' }).click();
        await expect(page.locator('.vm-overlay.vm-open')).toBeVisible();

        const report = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
        const seriousViolations = report.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));

        expect(seriousViolations).toEqual([]);
    });

    test('has no serious accessibility violations in bootstrap demo', async ({ page }) => {
        await page.goto('/demo/bootstrap.html');
        await page.getByRole('button', { name: 'Open custom modal' }).click();
        await expect(page.locator('.vm-overlay.vm-open')).toBeVisible();

        const report = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
        const seriousViolations = report.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));

        expect(seriousViolations).toEqual([]);
    });
});

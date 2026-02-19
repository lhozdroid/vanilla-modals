import { expect } from '@playwright/test';

/**
 * Opens a fixture scenario and waits until runtime is ready.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} scenario
 * @returns {Promise<void>}
 */
export function openScenario(page, scenario) {
    return page
        .goto(`/?scenario=${scenario}`)
        .then(() => page.waitForFunction(() => document.body.dataset.ready === 'true'))
        .then(() => expect(page.locator('#scenario-label')).toContainText(`scenario: ${scenario}`));
}

/**
 * Returns tracked event names from runtime.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>}
 */
export function readEvents(page) {
    return page.evaluate(() => window.__e2e.getEvents());
}

/**
 * Returns current runtime state snapshot.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<Record<string, any>>}
 */
export function readState(page) {
    return page.evaluate(() => window.__e2e.getState());
}

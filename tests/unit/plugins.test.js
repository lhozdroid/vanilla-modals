import { afterEach, describe, expect, it } from 'vitest';
import { VanillaModal } from '../../src/core/vanilla-modal.js';
import { __unsafeResetManager } from '../../src/core/modal-manager.js';
import { bootstrapThemePlugin, bulmaThemePlugin, muiThemePlugin, tailwindThemePlugin, themePlugin } from '../../src/index.js';

/**
 * Resets manager and DOM between tests.
 */
afterEach(() => {
    document.body.innerHTML = '';
    __unsafeResetManager();
});

/**
 * Verifies theme plugin class mapping behavior.
 */
describe('plugins', () => {
    it('applies generic theme plugin classes', () => {
        const modal = new VanillaModal();
        modal.use(themePlugin({ dialog: 'custom-dialog', button: 'custom-button' }));
        modal.open();

        expect(modal.getElement().querySelector('.vm-dialog').className).toContain('custom-dialog');
        expect(modal.getElement().querySelector('.vm-button')).toBeNull();

        modal.setButtons([{ id: 'x', label: 'X' }]);
        expect(modal.getElement().querySelector('[data-button-id="x"]').className).toContain('custom-button');
    });

    it('applies bootstrap theme mapping', () => {
        const modal = new VanillaModal({ buttons: [{ id: 'ok', label: 'OK' }] });
        modal.use(bootstrapThemePlugin()).open();

        const dialog = modal.getElement().querySelector('.vm-dialog');
        const content = modal.getElement().querySelector('.vm-content');
        const button = modal.getElement().querySelector('[data-button-id="ok"]');
        const close = modal.getElement().querySelector('.vm-close');
        expect(dialog.className).toContain('modal-dialog');
        expect(content.className).toContain('modal-content');
        expect(button.className).toContain('btn');
        expect(close.className).toContain('btn-close');
        expect(close.textContent).toBe('');
        expect(close.getAttribute('aria-label')).toBe('Close');
    });

    it('applies bulma and tailwind mappings', () => {
        const bulmaModal = new VanillaModal();
        bulmaModal.use(bulmaThemePlugin()).open();
        expect(bulmaModal.getElement().className).toContain('modal');

        const tailwindModal = new VanillaModal();
        tailwindModal.use(tailwindThemePlugin()).open();
        expect(tailwindModal.getElement().className).toContain('fixed');
    });

    it('applies mui mapping', () => {
        const modal = new VanillaModal({ buttons: [{ id: 'ok', label: 'OK' }] });
        modal.use(muiThemePlugin()).open();
        const dialog = modal.getElement().querySelector('.vm-dialog');
        expect(dialog.className).toContain('MuiDialog-paper');
    });

    it('handles theme plugin with undefined classes', () => {
        const modal = new VanillaModal();
        expect(() => modal.use(themePlugin())).not.toThrow();
    });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { VanillaModal } from '../../src/core/vanilla-modal.js';
import { __unsafeResetManager, getOpenedModals } from '../../src/core/modal-manager.js';

/**
 * Resets document and manager state between tests.
 */
afterEach(() => {
    document.body.innerHTML = '';
    __unsafeResetManager();
});

describe('VanillaModal', () => {
    it('opens and closes with lifecycle events', () => {
        const onShow = vi.fn();
        const onHide = vi.fn();
        const modal = new VanillaModal({
            title: 'Lifecycle',
            message: 'Test',
            onShow,
            onHide
        });

        modal.open();
        expect(modal.isOpen()).toBe(true);
        expect(onShow).toHaveBeenCalledTimes(1);
        expect(getOpenedModals()).toHaveLength(1);

        modal.close('test');
        expect(modal.isOpen()).toBe(false);
        expect(onHide).toHaveBeenCalledTimes(1);
        expect(getOpenedModals()).toHaveLength(0);
    });

    it('triggers button action and closes by default', () => {
        const action = vi.fn();
        const modal = new VanillaModal({
            buttons: [{ id: 'ok', label: 'OK', action }]
        });

        modal.open();
        const button = modal.getElement().querySelector('[data-button-id="ok"]');
        button.click();

        expect(action).toHaveBeenCalledTimes(1);
        expect(modal.isOpen()).toBe(false);
    });

    it('supports focus trap fallback when no focusable children exist', () => {
        const modal = new VanillaModal({ buttons: [], closable: false });
        modal.open();

        const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
        document.dispatchEvent(event);

        expect(modal.isOpen()).toBe(true);
    });
});

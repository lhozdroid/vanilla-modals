import { afterEach, describe, expect, it, vi } from 'vitest';
import { __unsafeResetManager } from '../../src/core/modal-manager.js';
import { alert, bootstrapThemePlugin, confirm } from '../../src/index.js';

/**
 * Resets document and manager state between tests.
 */
afterEach(() => {
    document.body.innerHTML = '';
    __unsafeResetManager();
});

describe('shortcuts', () => {
    it('executes alert callback with true when OK is clicked', () => {
        const callback = vi.fn();
        const modal = alert('Saved', callback);

        const button = modal.getElement().querySelector('[data-button-id="ok"]');
        button.click();

        expect(callback).toHaveBeenCalledWith(true);
    });

    it('executes confirm callback with false when cancel is clicked', () => {
        const callback = vi.fn();
        const modal = confirm({ message: 'Are you sure?' }, callback);

        const button = modal.getElement().querySelector('[data-button-id="cancel"]');
        button.click();

        expect(callback).toHaveBeenCalledWith(false);
    });

    it('executes alert callback with false on non-button close', () => {
        const callback = vi.fn();
        const modal = alert({ message: 'Saved', callback, closable: true });

        modal.close('api');

        expect(callback).toHaveBeenCalledWith(false);
    });

    it('supports alert object callback precedence and custom onHidden', () => {
        const callback = vi.fn();
        const onHidden = vi.fn(() => false);
        const modal = alert({ message: 'X', callback, onHidden });

        modal.close('api');

        expect(callback).toHaveBeenCalledWith(false);
        expect(onHidden).toHaveBeenCalledTimes(1);
    });

    it('supports confirm reverse button ordering and object callback', () => {
        const callback = vi.fn();
        const modal = confirm({
            message: 'Reverse?',
            callback,
            reverseButtons: true,
            okLabel: 'Proceed'
        });

        const footerButtons = [...modal.getElement().querySelectorAll('footer button')];
        expect(footerButtons[0].dataset.buttonId).toBe('ok');

        footerButtons[0].click();
        expect(callback).toHaveBeenCalledWith(true);
    });

    it('supports confirm non-button close and custom onHidden', () => {
        const callback = vi.fn();
        const onHidden = vi.fn();
        const modal = confirm({ message: 'Close?', callback, onHidden, closable: true });

        modal.close('keyboard');

        expect(callback).toHaveBeenCalledWith(false);
        expect(onHidden).toHaveBeenCalledTimes(1);
    });

    it('handles missing callbacks without throwing', () => {
        const alertModal = alert('No callback');
        const confirmModal = confirm({ message: 'No callback' });

        expect(() => alertModal.close('api')).not.toThrow();
        expect(() => confirmModal.close('api')).not.toThrow();
    });

    it('supports empty object options fallback paths', () => {
        const alertModal = alert({});
        const confirmModal = confirm({});

        expect(alertModal.getElement().querySelector('.vm-body').textContent).toBe('');
        expect(confirmModal.getElement().querySelector('.vm-body').textContent).toBe('');
    });

    it('keeps alert visible when bootstrap theme is applied after opening', () => {
        const modal = alert('Styled');
        modal.use(bootstrapThemePlugin());

        expect(modal.isOpen()).toBe(true);
        expect(modal.getElement().hidden).toBe(false);
        expect(modal.getElement().className).toContain('vm-open');
        expect(modal.getElement().className).toContain('modal');
    });
});

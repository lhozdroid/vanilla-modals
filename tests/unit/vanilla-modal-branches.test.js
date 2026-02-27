import { afterEach, describe, expect, it, vi } from 'vitest';
import { VanillaModal } from '../../src/core/vanilla-modal.js';
import { __unsafeResetManager } from '../../src/core/modal-manager.js';

/**
 * Resets manager and DOM between tests.
 */
afterEach(() => {
    document.body.innerHTML = '';
    __unsafeResetManager();
});

/**
 * Covers branch-heavy lifecycle and guard scenarios.
 */
describe('VanillaModal branches', () => {
    it('blocks open when beforeOpen hook returns false', () => {
        const modal = new VanillaModal();
        modal.registerHook('beforeOpen', () => false);

        modal.open();

        expect(modal.isOpen()).toBe(false);
    });

    it('blocks close when onHide returns false', () => {
        const modal = new VanillaModal({ onHide: () => false });
        modal.open();
        modal.close('attempt');

        expect(modal.isOpen()).toBe(true);
    });

    it('closes by keyboard and backdrop when enabled', () => {
        const modal = new VanillaModal();
        modal.open();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(modal.isOpen()).toBe(false);

        modal.open();
        modal.getElement().dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(modal.isOpen()).toBe(false);
    });

    it('does not close by keyboard/backdrop when disabled', () => {
        const modal = new VanillaModal({ closeByKeyboard: false, closeByBackdrop: false });
        modal.open();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        modal.getElement().dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(modal.isOpen()).toBe(true);
    });

    it('supports html messages and theme classes before realize', () => {
        const modal = new VanillaModal({ message: '<strong>safe</strong>', allowHtml: true });
        modal.setThemeClasses({ dialog: 'dialog-x' });
        modal.open();

        expect(modal.getElement().querySelector('.vm-body').innerHTML).toContain('<strong>safe</strong>');
        expect(modal.getElement().querySelector('.vm-dialog').className).toContain('dialog-x');
    });

    it('applies aria description content to body region', () => {
        const modal = new VanillaModal({ ariaDescription: 'dialog details' });
        modal.open();
        expect(modal.getElement().querySelector('.vm-body').getAttribute('aria-description')).toBe('dialog details');
    });

    it('handles callback and hook errors through error events', () => {
        const onError = vi.fn();
        const modal = new VanillaModal({
            onShow: () => {
                throw new Error('bad callback');
            }
        });

        modal.on('error', onError);
        modal.registerHook('beforeClose', () => {
            throw new Error('bad hook');
        });

        modal.open();
        expect(modal.isOpen()).toBe(false);

        modal.registerHook('beforeOpen', () => true);
        modal.store.setOption('onShow', null);
        modal.open();
        modal.close('x');

        expect(onError).toHaveBeenCalled();
    });

    it('supports reopen flow and manual focus', () => {
        const modal = new VanillaModal();
        modal.open();
        modal.open();
        modal.focus();
        expect(modal.isOpen()).toBe(true);

        modal.close('done');
        return modal.focus().then((instance) => {
            expect(instance).toBe(modal);
        });
    });

    it('keeps modal open when button action returns false', () => {
        const modal = new VanillaModal({
            buttons: [{ id: 'stay', label: 'Stay', action: () => false }]
        });
        modal.open();

        modal.getElement().querySelector('[data-button-id="stay"]').click();
        expect(modal.isOpen()).toBe(true);
    });

    it('emits error when button action throws', () => {
        const onError = vi.fn();
        const modal = new VanillaModal({
            buttons: [
                {
                    id: 'bad',
                    label: 'Bad',
                    action: () => {
                        throw new Error('x');
                    }
                }
            ]
        });
        modal.on('error', onError);
        modal.open();

        modal.getElement().querySelector('[data-button-id="bad"]').click();
        expect(onError).toHaveBeenCalled();
    });

    it('respects button closeOnClick false', () => {
        const modal = new VanillaModal({
            buttons: [{ id: 'stay', label: 'Stay', closeOnClick: false }]
        });
        modal.open();

        modal.getElement().querySelector('[data-button-id="stay"]').click();
        expect(modal.isOpen()).toBe(true);
    });

    it('supports data storage and off() unsubscription', () => {
        const modal = new VanillaModal();
        const callback = vi.fn();

        modal.setData('x', 5);
        expect(modal.getData('x')).toBe(5);

        modal.on('show', callback);
        modal.off('show', callback);
        modal.open();

        expect(callback).not.toHaveBeenCalled();
    });

    it('auto-destroys when configured', () => {
        const modal = new VanillaModal({ autoDestroy: true });
        modal.open();
        modal.close('auto');

        expect(modal.isRealized()).toBe(false);
    });

    it('supports custom mount element', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);

        const modal = new VanillaModal({ mount: host });
        modal.open();

        expect(host.querySelector('.vm-overlay')).not.toBeNull();
    });

    it('updates title, message, and buttons after realize', () => {
        const modal = new VanillaModal({ buttons: [{ id: 'a', label: 'A' }] });
        modal.open();

        modal.setTitle('New title');
        modal.setMessage('new text', false);
        modal.setButtons([{ id: 'b', label: 'B' }]);
        modal.addButton({ id: 'c', label: 'C' });
        modal.setCloseButton({ text: 'Close now', ariaLabel: 'Close now' });

        expect(modal.getElement().querySelector('.vm-title').textContent).toBe('New title');
        expect(modal.getElement().querySelector('.vm-body').textContent).toBe('new text');
        expect(modal.getElement().querySelectorAll('footer button')).toHaveLength(2);
        expect(modal.getElement().querySelector('.vm-close').textContent).toBe('Close now');
    });

    it('runs debug event logging when enabled', () => {
        const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
        const modal = new VanillaModal({ events: { debug: true } });

        modal.open();

        expect(debugSpy).toHaveBeenCalled();
        debugSpy.mockRestore();
    });

    it('destroy is idempotent', () => {
        const modal = new VanillaModal();
        modal.open();
        modal.destroy();
        expect(() => modal.destroy()).not.toThrow();
    });

    it('supports setter calls before realize', () => {
        const modal = new VanillaModal();
        modal.setTitle('Pre title');
        modal.setMessage('Pre message', false);
        modal.setButtons([{ id: 'pre', label: 'Pre' }]);
        modal.setCloseButton({ text: '<span>close</span>', allowHtml: true, className: 'close-custom' });
        modal.open();

        expect(modal.getElement().querySelector('.vm-title').textContent).toBe('Pre title');
        expect(modal.getElement().querySelector('.vm-body').textContent).toBe('Pre message');
        expect(modal.getElement().querySelector('[data-button-id=\"pre\"]')).not.toBeNull();
        expect(modal.getElement().querySelector('.vm-close').innerHTML).toContain('close');
        expect(modal.getElement().querySelector('.vm-close').className).toContain('close-custom');
    });

    it('returns early for close on already-closed and open on destroyed modal', () => {
        const modal = new VanillaModal();
        expect(modal.close('none')).toBeInstanceOf(Promise);

        modal.destroy();
        expect(modal.open()).toBeInstanceOf(Promise);
    });

    it('ignores overlay clicks from dialog children', () => {
        const modal = new VanillaModal();
        modal.open();

        modal
            .getElement()
            .querySelector('.vm-dialog')
            .dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(modal.isOpen()).toBe(true);
    });

    it('hides close button when modal is not closable', () => {
        const modal = new VanillaModal({ closable: false });
        modal.open();
        expect(modal.getElement().querySelector('.vm-close').hidden).toBe(true);
    });

    it('supports configuring close button visibility at runtime', () => {
        const modal = new VanillaModal();
        modal.open();
        modal.setCloseButtonVisible(false);
        expect(modal.getElement().querySelector('.vm-close').hidden).toBe(true);

        modal.setCloseButtonVisible(true);
        expect(modal.getElement().querySelector('.vm-close').hidden).toBe(false);
    });

    it('supports configuring close-on-backdrop at runtime', () => {
        const modal = new VanillaModal({ closeByBackdrop: false });
        modal.open();

        modal.getElement().dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(modal.isOpen()).toBe(true);

        modal.setCloseByBackdrop(true);
        modal.getElement().dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(modal.isOpen()).toBe(false);
    });

    it('skips auto-focus branch when no auto-focus buttons are set', () => {
        const modal = new VanillaModal({
            buttons: [{ id: 'x', label: 'X', autoFocus: false }]
        });
        modal.open();
        expect(modal.isOpen()).toBe(true);
    });

    it('covers focus trap first/last branch navigation', () => {
        const modal = new VanillaModal({
            buttons: [
                { id: 'a', label: 'A' },
                { id: 'b', label: 'B' }
            ]
        });
        modal.open();

        const focusables = modal.getFocusableElements();
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        first.focus();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
        expect(document.activeElement).toBe(last);

        last.focus();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
        expect(document.activeElement).toBe(first);
    });

    it('handles keyboard close only on the top opened modal', () => {
        const first = new VanillaModal({ id: 'first' });
        const second = new VanillaModal({ id: 'second' });

        first.open();
        second.open();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(second.isOpen()).toBe(false);
        expect(first.isOpen()).toBe(true);
    });

    it('applies tab trapping only on the top opened modal', () => {
        const first = new VanillaModal({
            id: 'first',
            buttons: [
                { id: 'fa', label: 'FA' },
                { id: 'fb', label: 'FB' }
            ]
        });
        const second = new VanillaModal({
            id: 'second',
            buttons: [
                { id: 'sa', label: 'SA' },
                { id: 'sb', label: 'SB' }
            ]
        });

        first.open();
        second.open();

        const secondFocusables = second.getFocusableElements();
        const secondFirst = secondFocusables[0];
        const secondLast = secondFocusables[secondFocusables.length - 1];

        secondLast.focus();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
        expect(document.activeElement).toBe(secondFirst);
    });

    it('filters disabled focusable nodes', () => {
        const modal = new VanillaModal({
            buttons: [{ id: 'a', label: 'A' }]
        });
        modal.open();

        const button = modal.getElement().querySelector('[data-button-id=\"a\"]');
        button.setAttribute('disabled', 'disabled');

        expect(modal.getFocusableElements()).toHaveLength(1);
    });

    it('supports onShown callback branch and onHidden false return branch', () => {
        const onShown = vi.fn();
        const onHidden = vi.fn(() => false);
        const modal = new VanillaModal({ onShown, onHidden });
        modal.open();

        return Promise.resolve()
            .then(() => {
                expect(onShown).toHaveBeenCalledTimes(1);
                return modal.close('api');
            })
            .then(() => {
                expect(onHidden).toHaveBeenCalledTimes(1);
            });
    });

    it('supports realize guard for already realized and destroyed states', () => {
        const modal = new VanillaModal();
        modal.realize();
        expect(modal.realize()).toBeInstanceOf(Promise);

        modal.destroy();
        expect(modal.realize()).toBeInstanceOf(Promise);
    });

    it('exposes normalized close button state with defaults', () => {
        const modal = new VanillaModal();
        modal.setCloseButton(null);
        modal.open();

        const closeState = modal.store.getCloseButton();
        expect(closeState.text).toBe('x');
        expect(closeState.ariaLabel).toBe('Close dialog');
    });
});

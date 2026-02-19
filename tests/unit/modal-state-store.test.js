import { describe, expect, it } from 'vitest';
import { ModalStateStore } from '../../src/core/modal-state-store.js';

/**
 * Verifies modal state store normalization and mutators.
 */
describe('ModalStateStore', () => {
    it('normalizes defaults and close button configuration', () => {
        const store = new ModalStateStore({
            title: null,
            closeButton: {
                text: null,
                className: null,
                ariaLabel: '',
                allowHtml: 1
            }
        });

        const close = store.getCloseButton();
        expect(close.text).toBe('x');
        expect(close.ariaLabel).toBe('Close dialog');
        expect(close.className).toBe('');
        expect(close.allowHtml).toBe(true);
        expect(close.visible).toBe(true);
    });

    it('supports option/runtime mutators', () => {
        const store = new ModalStateStore({
            buttons: [{ label: 'A' }],
            data: { a: 1 },
            themeClasses: { dialog: 'x' }
        });

        store.setOption('title', 'Changed');
        expect(store.getOption('title')).toBe('Changed');

        store.setTitle('Next');
        store.setMessage('Body');
        store.setButtons([{ id: 'ok', label: 'OK', closeOnClick: false }]);
        store.addButton({ label: 'Second' });
        store.setCloseButton({ text: '<span>x</span>', ariaLabel: 'Dismiss', className: 'k', visible: false });
        store.setData('b', 2);
        store.mergeThemeClasses({ body: 'y' });

        expect(store.getButtons()).toHaveLength(2);
        expect(store.getData('b')).toBe(2);
        expect(store.getCloseButton().ariaLabel).toBe('Dismiss');
        expect(store.getCloseButton().visible).toBe(false);
        expect(store.getOptions().themeClasses.body).toBe('y');

        store.setOpened(true);
        store.setRealized(true);
        store.setDestroyed(false);
        expect(store.isOpened()).toBe(true);
        expect(store.isRealized()).toBe(true);
        expect(store.isDestroyed()).toBe(false);

        const element = document.createElement('button');
        store.setLastActiveElement(element);
        expect(store.getLastActiveElement()).toBe(element);
    });

    it('uses explicit mount element when provided', () => {
        const host = document.createElement('section');
        const store = new ModalStateStore({ mount: host });
        expect(store.getMount()).toBe(host);
    });
});

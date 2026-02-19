import { afterEach, describe, expect, it } from 'vitest';
import { VanillaModal } from '../../src/core/vanilla-modal.js';
import { __unsafeResetManager, bringToFront, closeAll, configDefaultOptions, getDefaultOptions, getLayerZIndex, getModal, getModals, getOpenedModals, openAll, setOpened } from '../../src/core/modal-manager.js';

/**
 * Resets manager and DOM between tests.
 */
afterEach(() => {
    document.body.innerHTML = '';
    __unsafeResetManager();
});

/**
 * Verifies modal manager registry and stack behavior.
 */
describe('modal-manager', () => {
    it('configures and reads default options', () => {
        configDefaultOptions({ closable: false, data: { source: 'test' } });
        const defaults = getDefaultOptions();

        expect(defaults.closable).toBe(false);
        expect(defaults.data.source).toBe('test');
    });

    it('tracks registry and opened stack', () => {
        const first = new VanillaModal({ id: 'm1' });
        const second = new VanillaModal({ id: 'm2' });

        expect(getModal('m1')).toBe(first);
        expect(getModals()).toHaveLength(2);

        first.open();
        second.open();

        expect(getOpenedModals()).toEqual([first, second]);

        const moved = bringToFront(first);
        expect(moved).toBe(1);
        expect(getOpenedModals()).toEqual([second, first]);

        closeAll('suite');
        expect(getOpenedModals()).toHaveLength(0);
    });

    it('opens all registered modals', () => {
        const one = new VanillaModal({ id: 'one' });
        const two = new VanillaModal({ id: 'two' });

        openAll();

        expect(one.isOpen()).toBe(true);
        expect(two.isOpen()).toBe(true);
    });

    it('returns null for unknown modal and handles empty closeAll', () => {
        expect(getModal('missing')).toBeNull();
        expect(() => closeAll('none')).not.toThrow();
    });

    it('returns fallback layer for unknown modal and supports explicit setOpened', () => {
        const modal = new VanillaModal({ id: 'layer-case' });
        const unknownResult = bringToFront(modal);
        expect(unknownResult).toBe(-1);

        const openedIndex = setOpened(modal, true);
        expect(openedIndex).toBe(0);

        const stableIndex = setOpened(modal, true);
        expect(stableIndex).toBe(0);

        const closedIndex = setOpened(modal, false);
        expect(closedIndex).toBe(-1);
    });

    it('handles missing window/document guards', () => {
        const originalWindow = globalThis.window;
        const originalDocument = globalThis.document;
        const modal = new VanillaModal({ id: 'guard-case' });
        try {
            Object.defineProperty(globalThis, 'window', { value: undefined, configurable: true });
            Object.defineProperty(globalThis, 'document', { value: undefined, configurable: true });
            expect(() => setOpened(modal, true)).not.toThrow();
        } finally {
            Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true });
            Object.defineProperty(globalThis, 'document', { value: originalDocument, configurable: true });
        }
    });

    it('computes z-index layers deterministically', () => {
        expect(getLayerZIndex(0)).toBe(1050);
        expect(getLayerZIndex(2)).toBe(1090);
        expect(getLayerZIndex(-5)).toBe(1050);
    });
});

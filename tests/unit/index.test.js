import { describe, expect, it } from 'vitest';
import * as lib from '../../src/index.js';

/**
 * Verifies package exports and factory shortcuts.
 */
describe('index exports', () => {
    it('exports core constructors and helpers', () => {
        expect(typeof lib.VanillaModal).toBe('function');
        expect(typeof lib.createVanillaModal).toBe('function');
        expect(typeof lib.show).toBe('function');
        expect(typeof lib.alert).toBe('function');
        expect(typeof lib.confirm).toBe('function');
        expect(typeof lib.getModal).toBe('function');
        expect(typeof lib.closeAll).toBe('function');
        expect(typeof lib.openAll).toBe('function');
        expect(typeof lib.themePlugin).toBe('function');
        expect(typeof lib.bootstrapThemePlugin).toBe('function');
        expect(typeof lib.bulmaThemePlugin).toBe('function');
        expect(typeof lib.muiThemePlugin).toBe('function');
        expect(typeof lib.tailwindThemePlugin).toBe('function');
    });

    it('creates and opens a modal', () => {
        const modal = lib.show({ title: 'Hello', message: 'World' });

        expect(modal).toBeInstanceOf(lib.VanillaModal);
        expect(modal.isOpen()).toBe(true);
        expect(document.querySelector('.vm-overlay')).not.toBeNull();

        modal.destroy();
    });
});

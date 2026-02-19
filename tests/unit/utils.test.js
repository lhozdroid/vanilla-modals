import { describe, expect, it, vi } from 'vitest';
import { deepMerge } from '../../src/utils/deep-merge.js';
import { EventEmitter } from '../../src/utils/event-emitter.js';

/**
 * Verifies utility modules and branch behavior.
 */
describe('utils', () => {
    it('deep-merges objects and arrays', () => {
        const base = { a: 1, nested: { keep: true }, list: [1, 2] };
        const patch = { b: 2, nested: { added: true }, list: [9] };

        const result = deepMerge(base, patch);

        expect(result).toEqual({
            a: 1,
            b: 2,
            nested: { keep: true, added: true },
            list: [9]
        });
    });

    it('returns cloned seed when patch is non-mergeable', () => {
        const result = deepMerge({ a: 1 }, null);
        expect(result).toEqual({ a: 1 });
    });

    it('handles array seed and null-prototype objects', () => {
        const base = [1, 2];
        const patch = { extra: Object.create(null) };
        patch.extra.value = 4;

        const result = deepMerge(base, patch);
        expect(Array.isArray(result)).toBe(true);
        expect(result.extra.value).toBe(4);
    });

    it('registers, emits, and unregisters listeners', () => {
        const emitter = new EventEmitter();
        const callback = vi.fn();
        const off = emitter.on('x', callback);

        emitter.emit('x', { a: 1 });
        expect(callback).toHaveBeenCalledWith({ a: 1 });

        off();
        emitter.emit('x', { b: 2 });
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('handles missing listener removal gracefully', () => {
        const emitter = new EventEmitter();
        expect(() => emitter.off('missing', () => {})).not.toThrow();
        expect(() => emitter.emit('missing', {})).not.toThrow();
    });
});

/**
 * Checks whether a value is a plain object.
 *
 * @param {any} value
 * @returns {boolean}
 */
function isPlainObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

/**
 * Deep-merges two values using object and array semantics.
 *
 * @param {Record<string, any> | any[]} base
 * @param {Record<string, any> | any[]} patch
 * @returns {Record<string, any> | any[]}
 */
export function deepMerge(base, patch) {
    const seed = Array.isArray(base) ? [...base] : { ...(base || {}) };
    if (!isPlainObject(patch) && !Array.isArray(patch)) return seed;

    const keys = Object.keys(patch || {});
    for (const key of keys) {
        const baseValue = seed[key];
        const patchValue = patch[key];

        if (Array.isArray(patchValue)) {
            seed[key] = [...patchValue];
            continue;
        }

        if (isPlainObject(patchValue)) {
            seed[key] = deepMerge(isPlainObject(baseValue) ? baseValue : {}, patchValue);
            continue;
        }

        seed[key] = patchValue;
    }

    return seed;
}

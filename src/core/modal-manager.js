import { defaultOptions } from './default-options.js';
import { deepMerge } from '../utils/deep-merge.js';

/** @type {Map<string, import('./vanilla-modal.js').VanillaModal>} */
const registry = new Map();
/** @type {import('./vanilla-modal.js').VanillaModal[]} */
const opened = [];
let configuredDefaults = deepMerge(defaultOptions, {});

const BASE_Z_INDEX = 1050;
const LAYER_STEP = 20;
const BODY_OPEN_CLASS = 'vm-body-open';

/**
 * Computes browser scrollbar width.
 *
 * @returns {number}
 */
function getScrollbarWidth() {
    if (typeof window === 'undefined') return 0;
    return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}

/**
 * Synchronizes body scroll lock according to opened modal count.
 *
 * @returns {void}
 */
function syncBodyLock() {
    if (typeof document === 'undefined') return;

    if (opened.length === 0) {
        document.body.classList.remove(BODY_OPEN_CLASS);
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
        return;
    }

    document.body.classList.add(BODY_OPEN_CLASS);
    document.body.style.overflow = 'hidden';

    const width = getScrollbarWidth();
    if (width > 0) {
        document.body.style.paddingRight = `${width}px`;
    }
}

/**
 * Applies global default option overrides.
 *
 * @param {Record<string, any>} options
 * @returns {Record<string, any>}
 */
export function configDefaultOptions(options) {
    configuredDefaults = deepMerge(configuredDefaults, options || {});
    return getDefaultOptions();
}

/**
 * Returns current global default options.
 *
 * @returns {Record<string, any>}
 */
export function getDefaultOptions() {
    return deepMerge(configuredDefaults, {});
}

/**
 * Registers one modal in the global registry.
 *
 * @param {import('./vanilla-modal.js').VanillaModal} modal
 * @returns {void}
 */
export function registerModal(modal) {
    registry.set(modal.getId(), modal);
}

/**
 * Unregisters one modal from the global registry.
 *
 * @param {import('./vanilla-modal.js').VanillaModal} modal
 * @returns {void}
 */
export function unregisterModal(modal) {
    registry.delete(modal.getId());
    setOpened(modal, false);
}

/**
 * Resolves a modal by identifier.
 *
 * @param {string} id
 * @returns {import('./vanilla-modal.js').VanillaModal | null}
 */
export function getModal(id) {
    return registry.get(id) || null;
}

/**
 * Returns all registered modals.
 *
 * @returns {import('./vanilla-modal.js').VanillaModal[]}
 */
export function getModals() {
    return [...registry.values()];
}

/**
 * Returns all opened modals ordered by stack depth.
 *
 * @returns {import('./vanilla-modal.js').VanillaModal[]}
 */
export function getOpenedModals() {
    return [...opened];
}

/**
 * Adds or removes a modal from the opened stack.
 *
 * @param {import('./vanilla-modal.js').VanillaModal} modal
 * @param {boolean} isOpen
 * @returns {number}
 */
export function setOpened(modal, isOpen) {
    const currentIndex = opened.indexOf(modal);

    if (isOpen && currentIndex < 0) {
        opened.push(modal);
        syncBodyLock();
        return opened.length - 1;
    }

    if (!isOpen && currentIndex >= 0) {
        opened.splice(currentIndex, 1);
        syncBodyLock();
        return -1;
    }

    return currentIndex;
}

/**
 * Moves one opened modal to the top layer.
 *
 * @param {import('./vanilla-modal.js').VanillaModal} modal
 * @returns {number}
 */
export function bringToFront(modal) {
    const index = opened.indexOf(modal);
    if (index < 0) return -1;
    opened.splice(index, 1);
    opened.push(modal);
    return opened.length - 1;
}

/**
 * Resolves z-index for one stack layer.
 *
 * @param {number} layerIndex
 * @returns {number}
 */
export function getLayerZIndex(layerIndex) {
    return BASE_Z_INDEX + Math.max(0, layerIndex) * LAYER_STEP;
}

/**
 * Opens all registered modals.
 *
 * @returns {void}
 */
export function openAll() {
    for (const modal of getModals()) {
        modal.open();
    }
}

/**
 * Closes all opened modals from top to bottom.
 *
 * @param {string} [reason]
 * @returns {void}
 */
export function closeAll(reason = 'global-close') {
    for (const modal of [...opened].reverse()) {
        modal.close(reason);
    }
}

/**
 * Resets manager state for tests.
 *
 * @returns {void}
 */
export function __unsafeResetManager() {
    registry.clear();
    opened.splice(0, opened.length);
    configuredDefaults = deepMerge(defaultOptions, {});
    syncBodyLock();
}

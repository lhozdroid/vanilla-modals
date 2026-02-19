import { defaultOptions } from './default-options.js';
import { getDefaultOptions } from './modal-manager.js';
import { deepMerge } from '../utils/deep-merge.js';

let idCounter = 1;

/**
 * Normalizes content values to strings.
 *
 * @param {any} content
 * @returns {string}
 */
function normalizeContent(content) {
    if (content == null) return '';
    return String(content);
}

/**
 * Normalizes button options into runtime-safe data.
 *
 * @param {Record<string, any>[]} buttons
 * @returns {Record<string, any>[]}
 */
function normalizeButtons(buttons) {
    if (!Array.isArray(buttons)) return [];

    return buttons.map((button, index) => ({
        id: button.id || `btn-${index + 1}`,
        label: normalizeContent(button.label || 'OK'),
        className: button.className || '',
        autoFocus: Boolean(button.autoFocus),
        closeOnClick: button.closeOnClick !== false,
        action: typeof button.action === 'function' ? button.action : null
    }));
}

/**
 * Normalizes close button configuration.
 *
 * @param {Record<string, any>} closeButton
 * @returns {{ text: string, ariaLabel: string, className: string, allowHtml: boolean, visible: boolean }}
 */
function normalizeCloseButton(closeButton) {
    const next = closeButton || {};
    return {
        text: normalizeContent(next.text ?? 'x'),
        ariaLabel: normalizeContent(next.ariaLabel || 'Close dialog'),
        className: normalizeContent(next.className || ''),
        allowHtml: Boolean(next.allowHtml),
        visible: next.visible !== false
    };
}

/**
 * Resolves the mount element for modal rendering.
 *
 * @param {HTMLElement | null} mount
 * @returns {HTMLElement}
 */
function getMountElement(mount) {
    if (mount instanceof HTMLElement) return mount;
    return document.body;
}

/**
 * Stores modal options and mutable runtime state.
 */
export class ModalStateStore {
    /**
     * Creates a modal state store instance.
     *
     * @param {Record<string, any>} [options]
     */
    constructor(options = {}) {
        const merged = deepMerge(getDefaultOptions(), deepMerge(defaultOptions, options));

        /** @type {Record<string, any>} */
        this.options = {
            ...merged,
            id: merged.id || `vm-${idCounter++}`,
            title: normalizeContent(merged.title),
            message: merged.message,
            buttons: normalizeButtons(merged.buttons),
            closeButton: normalizeCloseButton(merged.closeButton),
            data: { ...(merged.data || {}) },
            themeClasses: { ...(merged.themeClasses || {}) }
        };

        /** @type {{ opened: boolean, realized: boolean, destroyed: boolean, lastActiveElement: HTMLElement | null }} */
        this.runtime = {
            opened: false,
            realized: false,
            destroyed: false,
            lastActiveElement: null
        };

        /** @type {HTMLElement} */
        this.mount = getMountElement(this.options.mount);
    }

    /**
     * Returns modal identifier.
     *
     * @returns {string}
     */
    getId() {
        return this.options.id;
    }

    /**
     * Returns mount element.
     *
     * @returns {HTMLElement}
     */
    getMount() {
        return this.mount;
    }

    /**
     * Returns immutable options snapshot.
     *
     * @returns {Record<string, any>}
     */
    getOptions() {
        return this.options;
    }

    /**
     * Returns one option value.
     *
     * @param {string} key
     * @returns {any}
     */
    getOption(key) {
        return this.options[key];
    }

    /**
     * Sets one option value.
     *
     * @param {string} key
     * @param {any} value
     * @returns {void}
     */
    setOption(key, value) {
        this.options[key] = value;
    }

    /**
     * Sets dialog title value.
     *
     * @param {string} title
     * @returns {string}
     */
    setTitle(title) {
        this.options.title = normalizeContent(title);
        return this.options.title;
    }

    /**
     * Sets dialog message value.
     *
     * @param {any} message
     * @returns {any}
     */
    setMessage(message) {
        this.options.message = message;
        return this.options.message;
    }

    /**
     * Sets footer button configs.
     *
     * @param {Record<string, any>[]} buttons
     * @returns {Record<string, any>[]}
     */
    setButtons(buttons) {
        this.options.buttons = normalizeButtons(buttons);
        return this.options.buttons;
    }

    /**
     * Adds one footer button config.
     *
     * @param {Record<string, any>} button
     * @returns {Record<string, any>[]}
     */
    addButton(button) {
        this.options.buttons = normalizeButtons([...this.options.buttons, button]);
        return this.options.buttons;
    }

    /**
     * Sets close button configuration.
     *
     * @param {Record<string, any>} closeButton
     * @returns {{ text: string, ariaLabel: string, className: string, allowHtml: boolean, visible: boolean }}
     */
    setCloseButton(closeButton) {
        this.options.closeButton = normalizeCloseButton({
            ...this.options.closeButton,
            ...(closeButton || {})
        });
        return this.options.closeButton;
    }

    /**
     * Returns close button configuration.
     *
     * @returns {{ text: string, ariaLabel: string, className: string, allowHtml: boolean, visible: boolean }}
     */
    getCloseButton() {
        return this.options.closeButton;
    }

    /**
     * Sets one data payload entry.
     *
     * @param {string} key
     * @param {any} value
     * @returns {void}
     */
    setData(key, value) {
        this.options.data[key] = value;
    }

    /**
     * Returns one data payload entry.
     *
     * @param {string} key
     * @returns {any}
     */
    getData(key) {
        return this.options.data[key];
    }

    /**
     * Merges theme classes.
     *
     * @param {Record<string, string>} classes
     * @returns {Record<string, string>}
     */
    mergeThemeClasses(classes) {
        this.options.themeClasses = {
            ...this.options.themeClasses,
            ...(classes || {})
        };

        return this.options.themeClasses;
    }

    /**
     * Returns whether modal is opened.
     *
     * @returns {boolean}
     */
    isOpened() {
        return this.runtime.opened;
    }

    /**
     * Sets modal opened state.
     *
     * @param {boolean} opened
     * @returns {void}
     */
    setOpened(opened) {
        this.runtime.opened = Boolean(opened);
    }

    /**
     * Returns whether modal DOM is realized.
     *
     * @returns {boolean}
     */
    isRealized() {
        return this.runtime.realized;
    }

    /**
     * Sets modal realized state.
     *
     * @param {boolean} realized
     * @returns {void}
     */
    setRealized(realized) {
        this.runtime.realized = Boolean(realized);
    }

    /**
     * Returns whether modal is destroyed.
     *
     * @returns {boolean}
     */
    isDestroyed() {
        return this.runtime.destroyed;
    }

    /**
     * Sets modal destroyed state.
     *
     * @param {boolean} destroyed
     * @returns {void}
     */
    setDestroyed(destroyed) {
        this.runtime.destroyed = Boolean(destroyed);
    }

    /**
     * Returns last active element reference.
     *
     * @returns {HTMLElement | null}
     */
    getLastActiveElement() {
        return this.runtime.lastActiveElement;
    }

    /**
     * Sets last active element reference.
     *
     * @param {HTMLElement | null} element
     * @returns {void}
     */
    setLastActiveElement(element) {
        this.runtime.lastActiveElement = element;
    }

    /**
     * Returns normalized button configs.
     *
     * @returns {Record<string, any>[]}
     */
    getButtons() {
        return this.options.buttons;
    }
}

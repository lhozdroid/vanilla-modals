import { VanillaModal } from './core/vanilla-modal.js';
import { closeAll, configDefaultOptions, getDefaultOptions, getModal, getModals, openAll } from './core/modal-manager.js';
import { themePlugin } from './plugins/theme-plugin.js';
import { bootstrapThemePlugin } from './plugins/bootstrap-theme.js';
import { bulmaThemePlugin } from './plugins/bulma-theme.js';
import { muiThemePlugin } from './plugins/mui-theme.js';
import { tailwindThemePlugin } from './plugins/tailwind-theme.js';

/**
 * Normalizes shortcut inputs to option objects.
 *
 * @param {any} input
 * @param {(value: boolean) => void} callback
 * @returns {Record<string, any>}
 */
function normalizeDialogArgs(input, callback) {
    if (input && typeof input === 'object' && !Array.isArray(input)) {
        return {
            ...input,
            callback: typeof input.callback === 'function' ? input.callback : callback
        };
    }

    return {
        message: input,
        callback
    };
}

/**
 * Creates one modal instance.
 *
 * @param {Record<string, any>} [options]
 * @returns {VanillaModal}
 */
export function createVanillaModal(options = {}) {
    return new VanillaModal(options);
}

/**
 * Creates and opens one modal.
 *
 * @param {Record<string, any>} [options]
 * @returns {VanillaModal}
 */
export function show(options = {}) {
    const modal = createVanillaModal(options);
    modal.open().then(() => {});
    return modal;
}

/**
 * Creates and opens an alert-style modal.
 *
 * @param {string | Record<string, any>} input
 * @param {(value: boolean) => void} [callback]
 * @returns {VanillaModal}
 */
export function alert(input, callback) {
    const options = normalizeDialogArgs(input, callback);
    const done = typeof options.callback === 'function' ? options.callback : () => {};

    const modal = createVanillaModal({
        title: options.title || 'Alert',
        message: options.message || '',
        closable: options.closable === true,
        closeByBackdrop: options.closeByBackdrop === true,
        closeByKeyboard: options.closeByKeyboard === true,
        autoDestroy: options.autoDestroy !== false,
        allowHtml: Boolean(options.allowHtml),
        className: options.className || '',
        buttons: [
            {
                id: 'ok',
                label: options.buttonLabel || 'OK',
                className: options.buttonClassName || '',
                autoFocus: true,
                action: () => done(true)
            }
        ],
        onHidden: (payload) => {
            if (payload.reason !== 'button') {
                done(false);
            }

            if (typeof options.onHidden === 'function') {
                return options.onHidden(payload);
            }

            return true;
        }
    });

    modal.open().then(() => {});
    return modal;
}

/**
 * Creates and opens a confirm-style modal.
 *
 * @param {string | Record<string, any>} input
 * @param {(value: boolean) => void} [callback]
 * @returns {VanillaModal}
 */
export function confirm(input, callback) {
    const options = normalizeDialogArgs(input, callback);
    const done = typeof options.callback === 'function' ? options.callback : () => {};

    const buttons = [
        {
            id: 'cancel',
            label: options.cancelLabel || 'Cancel',
            className: options.cancelClassName || '',
            action: () => done(false)
        },
        {
            id: 'ok',
            label: options.okLabel || 'OK',
            className: options.okClassName || '',
            autoFocus: true,
            action: () => done(true)
        }
    ];

    const orderedButtons = options.reverseButtons ? buttons.reverse() : buttons;

    const modal = createVanillaModal({
        title: options.title || 'Confirm',
        message: options.message || '',
        closable: options.closable === true,
        closeByBackdrop: options.closeByBackdrop === true,
        closeByKeyboard: options.closeByKeyboard === true,
        autoDestroy: options.autoDestroy !== false,
        allowHtml: Boolean(options.allowHtml),
        className: options.className || '',
        buttons: orderedButtons,
        onHidden: (payload) => {
            if (payload.reason !== 'button') {
                done(false);
            }

            if (typeof options.onHidden === 'function') {
                return options.onHidden(payload);
            }

            return true;
        }
    });

    modal.open().then(() => {});
    return modal;
}

export { VanillaModal, configDefaultOptions, getDefaultOptions, getModal, getModals, openAll, closeAll, themePlugin, bootstrapThemePlugin, bulmaThemePlugin, muiThemePlugin, tailwindThemePlugin };

import { themePlugin } from './theme-plugin.js';

/**
 * Creates a Bulma-compatible theme plugin.
 *
 * @returns {(modal: import('../core/vanilla-modal.js').VanillaModal) => void}
 */
export function bulmaThemePlugin() {
    return themePlugin({
        root: 'modal is-active',
        dialog: 'modal-card',
        title: 'modal-card-title',
        body: 'modal-card-body',
        footer: 'modal-card-foot',
        close: 'delete',
        button: 'button'
    });
}

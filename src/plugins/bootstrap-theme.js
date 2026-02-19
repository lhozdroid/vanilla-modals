import { themePlugin } from './theme-plugin.js';

/**
 * Creates a Bootstrap-compatible theme plugin.
 *
 * @returns {(modal: import('../core/vanilla-modal.js').VanillaModal) => void}
 */
export function bootstrapThemePlugin() {
    const applyTheme = themePlugin({
        root: 'modal fade show',
        dialog: 'modal-dialog modal-dialog-centered',
        content: 'modal-content',
        title: 'modal-title fs-5',
        body: 'modal-body',
        footer: 'modal-footer',
        close: 'btn-close',
        button: 'btn'
    });

    return (modal) => {
        applyTheme(modal);
        modal.setCloseButton({
            text: '',
            ariaLabel: 'Close',
            className: '',
            allowHtml: false
        });
    };
}

import { themePlugin } from './theme-plugin.js';

/**
 * Creates a Material UI-compatible theme plugin.
 *
 * @returns {(modal: import('../core/vanilla-modal.js').VanillaModal) => void}
 */
export function muiThemePlugin() {
    return themePlugin({
        root: 'MuiModal-root',
        dialog: 'MuiPaper-root MuiDialog-paper MuiDialog-paperWidthSm',
        header: 'MuiDialogTitleBar-root',
        title: 'MuiDialogTitle-root',
        body: 'MuiDialogContent-root',
        footer: 'MuiDialogActions-root',
        close: 'MuiIconButton-root',
        button: 'MuiButton-root MuiButton-text MuiButton-textPrimary'
    });
}

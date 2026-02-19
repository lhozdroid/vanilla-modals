import { themePlugin } from './theme-plugin.js';

/**
 * Creates a Tailwind-compatible theme plugin.
 *
 * @returns {(modal: import('../core/vanilla-modal.js').VanillaModal) => void}
 */
export function tailwindThemePlugin() {
    return themePlugin({
        root: 'fixed inset-0 flex items-center justify-center',
        dialog: 'w-full max-w-lg rounded border bg-white shadow',
        title: 'text-lg font-semibold',
        body: 'mt-3',
        footer: 'mt-4 flex justify-end gap-2',
        close: 'inline-flex items-center justify-center',
        button: 'inline-flex items-center rounded border px-3 py-1.5 text-sm'
    });
}

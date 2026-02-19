/**
 * Creates a theme plugin that maps semantic keys to CSS classes.
 *
 * @param {Record<string, string>} classes
 * @returns {(modal: import('../core/vanilla-modal.js').VanillaModal) => void}
 */
export function themePlugin(classes) {
    return (modal) => {
        modal.setThemeClasses(classes || {});
    };
}

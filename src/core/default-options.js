/**
 * Defines baseline modal options.
 */
export const defaultOptions = {
    id: null,
    title: 'Dialog',
    message: '',
    closable: true,
    closeByBackdrop: true,
    closeByKeyboard: true,
    autoDestroy: false,
    closeButton: {
        text: 'x',
        ariaLabel: 'Close dialog',
        className: '',
        allowHtml: false,
        visible: true
    },
    className: '',
    ariaDescription: '',
    allowHtml: false,
    buttons: [],
    data: {},
    themeClasses: {},
    mount: null,
    onShow: null,
    onShown: null,
    onHide: null,
    onHidden: null,
    events: {
        debug: false
    }
};

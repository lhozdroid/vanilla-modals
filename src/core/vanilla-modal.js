import { bringToFront, getLayerZIndex, getOpenedModals, registerModal, setOpened, unregisterModal } from './modal-manager.js';
import { ModalRenderer } from './modal-renderer.js';
import { ModalStateStore } from './modal-state-store.js';
import { EventEmitter } from '../utils/event-emitter.js';

/**
 * Orchestrates modal lifecycle, rendering, and events.
 */
export class VanillaModal {
    /**
     * Creates a modal instance.
     *
     * @param {Record<string, any>} [options]
     */
    constructor(options = {}) {
        if (typeof document === 'undefined') {
            throw new Error('VanillaModal requires a DOM environment.');
        }

        /** @type {ModalStateStore} */
        this.store = new ModalStateStore(options);
        /** @type {EventEmitter} */
        this.events = new EventEmitter();
        /** @type {Record<string, Function>} */
        this.hooks = {};

        /**
         * Handles overlay click behavior.
         *
         * @param {MouseEvent} event
         * @returns {void}
         */
        this.boundOnOverlayClick = (event) => {
            if (event.target !== this.renderer.getRoot()) return;
            if (!this.store.getOption('closeByBackdrop') || !this.store.getOption('closable')) return;
            this.close('backdrop').then(() => {});
        };

        /**
         * Handles close button behavior.
         *
         * @returns {void}
         */
        this.boundOnCloseClick = () => {
            this.close('close-button').then(() => {});
        };

        /**
         * Handles footer button behavior.
         *
         * @param {Record<string, any>} config
         * @returns {void}
         */
        this.boundOnButtonClick = (config) => {
            const payload = { modal: this, buttonId: config.id };
            let actionResult = true;

            if (config.action) {
                try {
                    actionResult = config.action(this, payload);
                } catch (error) {
                    actionResult = false;
                    this.emitEvent('error', { error, buttonId: config.id });
                }
            }

            this.emitEvent('button:click', {
                modal: this,
                buttonId: config.id,
                result: actionResult
            });

            if (actionResult !== false && config.closeOnClick) {
                this.close('button').then(() => {});
            }
        };

        /** @type {ModalRenderer} */
        this.renderer = new ModalRenderer({
            onOverlayClick: this.boundOnOverlayClick,
            onCloseClick: this.boundOnCloseClick,
            onButtonClick: this.boundOnButtonClick
        });

        /**
         * Handles global keyboard behavior.
         *
         * @param {KeyboardEvent} event
         * @returns {void}
         */
        this.boundOnKeydown = (event) => {
            if (!this.store.isOpened()) return;
            if (!this.isTopOpenedModal()) return;

            if (event.key === 'Escape' && this.store.getOption('closeByKeyboard') && this.store.getOption('closable')) {
                event.preventDefault();
                this.close('keyboard').then(() => {});
                return;
            }

            if (event.key === 'Tab') {
                this.renderer.trapFocus(event);
            }
        };

        registerModal(this);
        this.emitEvent('init', { instance: this });
    }

    /**
     * Returns whether this modal is the top opened layer.
     *
     * @returns {boolean}
     */
    isTopOpenedModal() {
        const opened = getOpenedModals();
        return opened.length > 0 && opened[opened.length - 1] === this;
    }

    /**
     * Returns modal identifier.
     *
     * @returns {string}
     */
    getId() {
        return this.store.getId();
    }

    /**
     * Returns the root overlay element.
     *
     * @returns {HTMLElement | null}
     */
    getElement() {
        return this.renderer.getRoot();
    }

    /**
     * Returns current open state.
     *
     * @returns {boolean}
     */
    isOpen() {
        return this.store.isOpened();
    }

    /**
     * Returns current render state.
     *
     * @returns {boolean}
     */
    isRealized() {
        return this.store.isRealized();
    }

    /**
     * Opens the modal instance.
     *
     * @returns {Promise<VanillaModal>}
     */
    open() {
        if (this.store.isDestroyed()) return Promise.resolve(this);

        this.realize();

        const allowOpen = this.invokeGuard('onShow', { modal: this });
        if (!allowOpen) return Promise.resolve(this);

        const wasOpen = this.store.isOpened();
        const layer = wasOpen ? bringToFront(this) : setOpened(this, true);
        const zIndex = getLayerZIndex(layer);

        this.renderer.setVisible(true, zIndex);

        if (!wasOpen) {
            this.store.setLastActiveElement(document.activeElement);
        }

        this.store.setOpened(true);
        document.addEventListener('keydown', this.boundOnKeydown);

        this.renderer.focusDialog();
        this.emitEvent('show', { modal: this, reopened: wasOpen });

        Promise.resolve().then(() => {
            if (!this.store.isOpened()) return;
            this.renderer.focusFirst();
            this.invokeHook('afterOpen', { modal: this });
            this.invokeCallback('onShown', { modal: this });
            this.emitEvent('shown', { modal: this });
        });

        return Promise.resolve(this);
    }

    /**
     * Closes the modal instance.
     *
     * @param {string} [reason]
     * @returns {Promise<VanillaModal>}
     */
    close(reason = 'api') {
        if (!this.store.isOpened() || this.store.isDestroyed()) {
            return Promise.resolve(this);
        }

        const allowClose = this.invokeGuard('onHide', { modal: this, reason });
        if (!allowClose) return Promise.resolve(this);

        this.emitEvent('hide', { modal: this, reason });

        this.store.setOpened(false);
        setOpened(this, false);
        this.renderer.setVisible(false, getLayerZIndex(0));
        document.removeEventListener('keydown', this.boundOnKeydown);

        this.renderer.restoreFocus(this.store.getLastActiveElement());
        this.invokeHook('afterClose', { modal: this, reason });
        this.invokeCallback('onHidden', { modal: this, reason });
        this.emitEvent('hidden', { modal: this, reason });

        if (!this.store.getOption('autoDestroy')) return Promise.resolve(this);
        return this.destroy();
    }

    /**
     * Destroys the modal instance and DOM.
     *
     * @returns {Promise<VanillaModal>}
     */
    destroy() {
        if (this.store.isDestroyed()) return Promise.resolve(this);

        if (this.store.isOpened()) {
            return this.close('destroy').then(() => this);
        }

        this.renderer.destroy();
        document.removeEventListener('keydown', this.boundOnKeydown);
        unregisterModal(this);
        this.store.setDestroyed(true);
        this.store.setRealized(false);
        this.emitEvent('destroy', { modal: this });
        return Promise.resolve(this);
    }

    /**
     * Subscribes to modal events.
     *
     * @param {string} event
     * @param {(payload: any) => void} callback
     * @returns {() => void}
     */
    on(event, callback) {
        return this.events.on(event, callback);
    }

    /**
     * Unsubscribes from modal events.
     *
     * @param {string} event
     * @param {(payload: any) => void} callback
     * @returns {void}
     */
    off(event, callback) {
        this.events.off(event, callback);
    }

    /**
     * Applies one plugin function.
     *
     * @param {(modal: VanillaModal) => void} plugin
     * @returns {VanillaModal}
     */
    use(plugin) {
        plugin(this);
        return this;
    }

    /**
     * Registers one lifecycle hook callback.
     *
     * @param {string} name
     * @param {(context: any) => void} callback
     * @returns {VanillaModal}
     */
    registerHook(name, callback) {
        this.hooks[name] = callback;
        return this;
    }

    /**
     * Updates dialog title content.
     *
     * @param {string} title
     * @returns {Promise<VanillaModal>}
     */
    setTitle(title) {
        const nextTitle = this.store.setTitle(title);

        if (this.store.isRealized()) {
            this.renderer.renderStatic(this.store.getOptions());
            this.renderer.applyThemeClasses(this.store.getOptions());
        }

        this.emitEvent('title:change', { title: nextTitle });
        return Promise.resolve(this);
    }

    /**
     * Updates dialog body content.
     *
     * @param {string} message
     * @param {boolean} [allowHtml]
     * @returns {Promise<VanillaModal>}
     */
    setMessage(message, allowHtml = this.store.getOption('allowHtml')) {
        this.store.setMessage(message);

        if (this.store.isRealized()) {
            this.renderer.renderMessage(message, allowHtml);
        }

        this.emitEvent('message:change', { message });
        return Promise.resolve(this);
    }

    /**
     * Replaces footer buttons.
     *
     * @param {Record<string, any>[]} buttons
     * @returns {Promise<VanillaModal>}
     */
    setButtons(buttons) {
        const nextButtons = this.store.setButtons(buttons);

        if (this.store.isRealized()) {
            this.renderer.renderButtons(this.store);
            this.renderer.applyThemeClasses(this.store.getOptions());
        }

        this.emitEvent('buttons:change', { buttons: [...nextButtons] });
        return Promise.resolve(this);
    }

    /**
     * Appends one footer button.
     *
     * @param {Record<string, any>} button
     * @returns {Promise<VanillaModal>}
     */
    addButton(button) {
        const nextButtons = this.store.addButton(button);

        if (this.store.isRealized()) {
            this.renderer.renderButtons(this.store);
            this.renderer.applyThemeClasses(this.store.getOptions());
        }

        this.emitEvent('buttons:change', { buttons: [...nextButtons] });
        return Promise.resolve(this);
    }

    /**
     * Sets close button configuration.
     *
     * @param {Record<string, any>} closeButton
     * @returns {Promise<VanillaModal>}
     */
    setCloseButton(closeButton) {
        const nextCloseButton = this.store.setCloseButton(closeButton);

        if (this.store.isRealized()) {
            this.renderer.renderStatic(this.store.getOptions());
            this.renderer.applyThemeClasses(this.store.getOptions());
        }

        this.emitEvent('closebutton:change', { closeButton: { ...nextCloseButton } });
        return Promise.resolve(this);
    }

    /**
     * Sets close button visibility without changing other close button options.
     *
     * @param {boolean} visible
     * @returns {Promise<VanillaModal>}
     */
    setCloseButtonVisible(visible) {
        const nextCloseButton = this.store.setCloseButton({ visible: Boolean(visible) });

        if (this.store.isRealized()) {
            this.renderer.renderStatic(this.store.getOptions());
            this.renderer.applyThemeClasses(this.store.getOptions());
        }

        this.emitEvent('closebutton:change', { closeButton: { ...nextCloseButton } });
        return Promise.resolve(this);
    }

    /**
     * Sets whether overlay clicks close the modal.
     *
     * @param {boolean} closeByBackdrop
     * @returns {Promise<VanillaModal>}
     */
    setCloseByBackdrop(closeByBackdrop) {
        this.store.setOption('closeByBackdrop', Boolean(closeByBackdrop));
        this.emitEvent('closebybackdrop:change', {
            closeByBackdrop: this.store.getOption('closeByBackdrop')
        });
        return Promise.resolve(this);
    }

    /**
     * Sets one data payload entry.
     *
     * @param {string} key
     * @param {any} value
     * @returns {Promise<VanillaModal>}
     */
    setData(key, value) {
        this.store.setData(key, value);
        this.emitEvent('data:change', { key, value });
        return Promise.resolve(this);
    }

    /**
     * Returns one data payload entry.
     *
     * @param {string} key
     * @returns {any}
     */
    getData(key) {
        return this.store.getData(key);
    }

    /**
     * Merges additional theme classes.
     *
     * @param {Record<string, string>} classes
     * @returns {Promise<VanillaModal>}
     */
    setThemeClasses(classes) {
        this.store.mergeThemeClasses(classes);

        if (this.store.isRealized()) {
            this.renderer.applyThemeClasses(this.store.getOptions());
        }

        return Promise.resolve(this);
    }

    /**
     * Moves focus to dialog element.
     *
     * @returns {Promise<VanillaModal>}
     */
    focus() {
        if (!this.store.isOpened()) return Promise.resolve(this);
        this.renderer.focusDialog();
        return Promise.resolve(this);
    }

    /**
     * Realizes the modal DOM tree.
     *
     * @returns {Promise<VanillaModal>}
     */
    realize() {
        if (this.store.isRealized() || this.store.isDestroyed()) {
            return Promise.resolve(this);
        }

        this.renderer.realize(this.store);
        this.store.setRealized(true);
        this.invokeHook('afterRealize', { modal: this });
        return Promise.resolve(this);
    }

    /**
     * Applies focus trap behavior.
     *
     * @param {KeyboardEvent} event
     * @returns {void}
     */
    trapFocus(event) {
        this.renderer.trapFocus(event);
    }

    /**
     * Moves focus to the first focusable element.
     *
     * @returns {void}
     */
    focusFirst() {
        this.renderer.focusFirst();
    }

    /**
     * Collects focusable elements in dialog.
     *
     * @returns {HTMLElement[]}
     */
    getFocusableElements() {
        return this.renderer.getFocusableElements();
    }

    /**
     * Restores focus to the last active element.
     *
     * @returns {void}
     */
    restoreFocus() {
        this.renderer.restoreFocus(this.store.getLastActiveElement());
    }

    /**
     * Invokes one named hook callback.
     *
     * @param {string} name
     * @param {any} payload
     * @returns {void}
     */
    invokeHook(name, payload) {
        const hook = this.hooks[name];
        if (typeof hook !== 'function') return;

        try {
            hook(payload);
        } catch (error) {
            this.emitEvent('error', { error, hook: name });
        }
    }

    /**
     * Invokes one option callback.
     *
     * @param {string} name
     * @param {any} payload
     * @returns {boolean}
     */
    invokeCallback(name, payload) {
        const callback = this.store.getOption(name);
        if (typeof callback !== 'function') return true;

        try {
            return callback(payload) !== false;
        } catch (error) {
            this.emitEvent('error', { error, callback: name });
            return false;
        }
    }

    /**
     * Runs a guard chain with optional hook and callback.
     *
     * @param {'onShow' | 'onHide'} name
     * @param {any} payload
     * @returns {boolean}
     */
    invokeGuard(name, payload) {
        const hookName = name === 'onShow' ? 'beforeOpen' : 'beforeClose';
        const hook = this.hooks[hookName];

        if (typeof hook === 'function') {
            try {
                if (hook(payload) === false) return false;
            } catch (error) {
                this.emitEvent('error', { error, hook: hookName });
                return false;
            }
        }

        return this.invokeCallback(name, payload);
    }

    /**
     * Emits one modal event.
     *
     * @param {string} event
     * @param {any} payload
     * @returns {void}
     */
    emitEvent(event, payload) {
        this.events.emit(event, payload);

        if (this.store.getOption('events')?.debug && typeof console !== 'undefined') {
            console.debug(`[vanilla-modals] ${event}`, payload);
        }
    }
}

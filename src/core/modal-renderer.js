const FOCUSABLE_SELECTOR = ['a[href]', 'button:not([disabled])', 'textarea:not([disabled])', 'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])'].join(',');

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
 * Joins a list of class tokens.
 *
 * @param {...string} values
 * @returns {string}
 */
function withClass(...values) {
    return values
        .flatMap((value) => normalizeContent(value).split(/\s+/g))
        .map((token) => token.trim())
        .filter(Boolean)
        .join(' ');
}

/**
 * Renders modal DOM and updates visual state.
 */
export class ModalRenderer {
    /**
     * Creates a renderer instance.
     *
     * @param {{
     *   onOverlayClick: (event: MouseEvent) => void,
     *   onCloseClick: () => void,
     *   onButtonClick: (button: Record<string, any>) => void
     * }} callbacks
     */
    constructor(callbacks) {
        /** @type {{
         *   root: HTMLElement | null,
         *   dialog: HTMLElement | null,
         *   content: HTMLElement | null,
         *   header: HTMLElement | null,
         *   title: HTMLElement | null,
         *   body: HTMLElement | null,
         *   footer: HTMLElement | null,
         *   close: HTMLButtonElement | null
         * }} */
        this.refs = {
            root: null,
            dialog: null,
            content: null,
            header: null,
            title: null,
            body: null,
            footer: null,
            close: null
        };

        /** @type {{
         *   onOverlayClick: (event: MouseEvent) => void,
         *   onCloseClick: () => void,
         *   onButtonClick: (button: Record<string, any>) => void
         * }} */
        this.callbacks = callbacks;
    }

    /**
     * Returns current root element.
     *
     * @returns {HTMLElement | null}
     */
    getRoot() {
        return this.refs.root;
    }

    /**
     * Realizes DOM elements from state data.
     *
     * @param {import('./modal-state-store.js').ModalStateStore} state
     * @returns {void}
     */
    realize(state) {
        if (this.refs.root) return;

        const options = state.getOptions();
        const modalId = state.getId();

        const overlay = document.createElement('div');
        overlay.className = withClass('vm-overlay', options.className);
        overlay.hidden = true;
        overlay.dataset.vmId = modalId;

        const dialog = document.createElement('div');
        dialog.className = 'vm-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('tabindex', '-1');

        const titleId = `${modalId}-title`;
        const bodyId = `${modalId}-body`;
        dialog.setAttribute('aria-labelledby', titleId);
        dialog.setAttribute('aria-describedby', bodyId);

        const header = document.createElement('header');
        header.className = 'vm-header';

        const title = document.createElement('h2');
        title.className = 'vm-title';
        title.id = titleId;

        const content = document.createElement('div');
        content.className = 'vm-content';

        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'vm-close';
        close.setAttribute('aria-label', 'Close dialog');
        close.textContent = 'x';
        close.addEventListener('click', this.callbacks.onCloseClick);

        const body = document.createElement('div');
        body.className = 'vm-body';
        body.id = bodyId;

        const footer = document.createElement('footer');
        footer.className = 'vm-footer';

        header.append(title, close);
        content.append(header, body, footer);
        dialog.appendChild(content);
        overlay.appendChild(dialog);
        overlay.addEventListener('click', this.callbacks.onOverlayClick);

        this.refs = {
            root: overlay,
            dialog,
            content,
            header,
            title,
            body,
            footer,
            close
        };

        state.getMount().appendChild(overlay);

        this.renderStatic(options);
        this.renderButtons(state);
        this.applyThemeClasses(options);
    }

    /**
     * Renders static title/message/close content.
     *
     * @param {Record<string, any>} options
     * @returns {void}
     */
    renderStatic(options) {
        if (!this.refs.root) return;

        this.refs.title.textContent = normalizeContent(options.title);
        this.refs.close.hidden = !options.closable || options.closeButton?.visible === false;
        this.refs.close.setAttribute('aria-label', normalizeContent(options.closeButton?.ariaLabel || 'Close dialog'));

        if (options.closeButton?.allowHtml) {
            this.refs.close.innerHTML = normalizeContent(options.closeButton?.text ?? '');
        } else {
            this.refs.close.textContent = normalizeContent(options.closeButton?.text ?? '');
        }

        if (options.ariaDescription) {
            this.refs.body.setAttribute('aria-description', options.ariaDescription);
        } else {
            this.refs.body.removeAttribute('aria-description');
        }

        this.renderMessage(options.message, options.allowHtml);
    }

    /**
     * Renders message content.
     *
     * @param {any} message
     * @param {boolean} allowHtml
     * @returns {void}
     */
    renderMessage(message, allowHtml) {
        if (!this.refs.body) return;

        if (allowHtml) {
            this.refs.body.innerHTML = normalizeContent(message);
            return;
        }

        this.refs.body.textContent = normalizeContent(message);
    }

    /**
     * Renders footer button list.
     *
     * @param {import('./modal-state-store.js').ModalStateStore} state
     * @returns {void}
     */
    renderButtons(state) {
        if (!this.refs.footer) return;

        this.refs.footer.innerHTML = '';

        for (const config of state.getButtons()) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = withClass('vm-button', config.className);
            button.dataset.buttonId = config.id;
            button.dataset.vmAutofocus = String(config.autoFocus);
            button.textContent = config.label;
            button.addEventListener('click', () => this.callbacks.onButtonClick(config));
            this.refs.footer.appendChild(button);
        }
    }

    /**
     * Applies configured theme classes.
     *
     * @param {Record<string, any>} options
     * @returns {void}
     */
    applyThemeClasses(options) {
        if (!this.refs.root) return;

        const classes = options.themeClasses || {};
        const isOpen = this.refs.root.classList.contains('vm-open');
        this.refs.root.className = withClass('vm-overlay', options.className, classes.root);
        this.refs.root.classList.toggle('vm-open', isOpen);
        this.refs.dialog.className = withClass('vm-dialog', classes.dialog);
        this.refs.content.className = withClass('vm-content', classes.content);
        this.refs.header.className = withClass('vm-header', classes.header);
        this.refs.title.className = withClass('vm-title', classes.title);
        this.refs.body.className = withClass('vm-body', classes.body);
        this.refs.footer.className = withClass('vm-footer', classes.footer);
        this.refs.close.className = withClass('vm-close', classes.close, options.closeButton?.className || '');

        for (const button of this.refs.footer.querySelectorAll('button')) {
            const ownClass = normalizeContent(button.className).replace('vm-button', '').trim();
            button.className = withClass('vm-button', classes.button, ownClass);
        }
    }

    /**
     * Sets modal visibility and z-index layer.
     *
     * @param {boolean} visible
     * @param {number} baseZIndex
     * @returns {void}
     */
    setVisible(visible, baseZIndex) {
        if (!this.refs.root) return;

        this.refs.root.style.zIndex = String(baseZIndex);
        this.refs.dialog.style.zIndex = String(baseZIndex + 1);
        this.refs.root.hidden = !visible;
        this.refs.root.classList.toggle('vm-open', visible);
    }

    /**
     * Focuses dialog container.
     *
     * @returns {void}
     */
    focusDialog() {
        this.refs.dialog?.focus();
    }

    /**
     * Focuses the first available focus target.
     *
     * @returns {void}
     */
    focusFirst() {
        const autoFocus = this.refs.footer?.querySelector('[data-vm-autofocus="true"]');
        if (autoFocus instanceof HTMLElement) {
            autoFocus.focus();
            return;
        }

        const focusables = this.getFocusableElements();
        if (focusables.length) {
            focusables[0].focus();
            return;
        }

        this.focusDialog();
    }

    /**
     * Returns focusable elements in dialog.
     *
     * @returns {HTMLElement[]}
     */
    getFocusableElements() {
        if (!this.refs.dialog) return [];

        return [...this.refs.dialog.querySelectorAll(FOCUSABLE_SELECTOR)].filter((node) => {
            if (!(node instanceof HTMLElement)) return false;
            if (node.hasAttribute('disabled')) return false;
            if (node.hidden) return false;
            if (node.getAttribute('aria-hidden') === 'true') return false;
            return true;
        });
    }

    /**
     * Applies keyboard focus trap behavior.
     *
     * @param {KeyboardEvent} event
     * @returns {void}
     */
    trapFocus(event) {
        const focusables = this.getFocusableElements();

        if (!focusables.length) {
            event.preventDefault();
            this.focusDialog();
            return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
            return;
        }

        if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    /**
     * Restores focus to the previous active element.
     *
     * @param {HTMLElement | null} element
     * @returns {void}
     */
    restoreFocus(element) {
        if (element instanceof HTMLElement) {
            element.focus();
        }
    }

    /**
     * Removes rendered DOM and listeners.
     *
     * @returns {void}
     */
    destroy() {
        if (!this.refs.root) return;

        this.refs.close?.removeEventListener('click', this.callbacks.onCloseClick);
        this.refs.root.removeEventListener('click', this.callbacks.onOverlayClick);

        if (this.refs.root.parentNode) {
            this.refs.root.parentNode.removeChild(this.refs.root);
        }

        this.refs = {
            root: null,
            dialog: null,
            content: null,
            header: null,
            title: null,
            body: null,
            footer: null,
            close: null
        };
    }
}

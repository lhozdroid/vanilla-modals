// src/core/default-options.js
var defaultOptions = {
  id: null,
  title: "Dialog",
  message: "",
  closable: true,
  closeByBackdrop: true,
  closeByKeyboard: true,
  autoDestroy: false,
  closeButton: {
    text: "x",
    ariaLabel: "Close dialog",
    className: "",
    allowHtml: false,
    visible: true
  },
  className: "",
  ariaDescription: "",
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

// src/utils/deep-merge.js
function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function deepMerge(base, patch) {
  const seed = Array.isArray(base) ? [...base] : { ...base || {} };
  if (!isPlainObject(patch) && !Array.isArray(patch)) return seed;
  const keys = Object.keys(patch || {});
  for (const key of keys) {
    const baseValue = seed[key];
    const patchValue = patch[key];
    if (Array.isArray(patchValue)) {
      seed[key] = [...patchValue];
      continue;
    }
    if (isPlainObject(patchValue)) {
      seed[key] = deepMerge(isPlainObject(baseValue) ? baseValue : {}, patchValue);
      continue;
    }
    seed[key] = patchValue;
  }
  return seed;
}

// src/core/modal-manager.js
var registry = /* @__PURE__ */ new Map();
var opened = [];
var configuredDefaults = deepMerge(defaultOptions, {});
var BASE_Z_INDEX = 1050;
var LAYER_STEP = 20;
var BODY_OPEN_CLASS = "vm-body-open";
function getScrollbarWidth() {
  if (typeof window === "undefined") return 0;
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}
function syncBodyLock() {
  if (typeof document === "undefined") return;
  if (opened.length === 0) {
    document.body.classList.remove(BODY_OPEN_CLASS);
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");
    return;
  }
  document.body.classList.add(BODY_OPEN_CLASS);
  document.body.style.overflow = "hidden";
  const width = getScrollbarWidth();
  if (width > 0) {
    document.body.style.paddingRight = `${width}px`;
  }
}
function configDefaultOptions(options) {
  configuredDefaults = deepMerge(configuredDefaults, options || {});
  return getDefaultOptions();
}
function getDefaultOptions() {
  return deepMerge(configuredDefaults, {});
}
function registerModal(modal) {
  registry.set(modal.getId(), modal);
}
function unregisterModal(modal) {
  registry.delete(modal.getId());
  setOpened(modal, false);
}
function getModal(id) {
  return registry.get(id) || null;
}
function getModals() {
  return [...registry.values()];
}
function setOpened(modal, isOpen) {
  const currentIndex = opened.indexOf(modal);
  if (isOpen && currentIndex < 0) {
    opened.push(modal);
    syncBodyLock();
    return opened.length - 1;
  }
  if (!isOpen && currentIndex >= 0) {
    opened.splice(currentIndex, 1);
    syncBodyLock();
    return -1;
  }
  return currentIndex;
}
function bringToFront(modal) {
  const index = opened.indexOf(modal);
  if (index < 0) return -1;
  opened.splice(index, 1);
  opened.push(modal);
  return opened.length - 1;
}
function getLayerZIndex(layerIndex) {
  return BASE_Z_INDEX + Math.max(0, layerIndex) * LAYER_STEP;
}
function openAll() {
  for (const modal of getModals()) {
    modal.open();
  }
}
function closeAll(reason = "global-close") {
  for (const modal of [...opened].reverse()) {
    modal.close(reason);
  }
}

// src/core/modal-renderer.js
var FOCUSABLE_SELECTOR = ["a[href]", "button:not([disabled])", "textarea:not([disabled])", "input:not([disabled])", "select:not([disabled])", '[tabindex]:not([tabindex="-1"])'].join(",");
function normalizeContent(content) {
  if (content == null) return "";
  return String(content);
}
function withClass(...values) {
  return values.flatMap((value) => normalizeContent(value).split(/\s+/g)).map((token) => token.trim()).filter(Boolean).join(" ");
}
var ModalRenderer = class {
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
    const overlay = document.createElement("div");
    overlay.className = withClass("vm-overlay", options.className);
    overlay.hidden = true;
    overlay.dataset.vmId = modalId;
    const dialog = document.createElement("div");
    dialog.className = "vm-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("tabindex", "-1");
    const titleId = `${modalId}-title`;
    const bodyId = `${modalId}-body`;
    dialog.setAttribute("aria-labelledby", titleId);
    dialog.setAttribute("aria-describedby", bodyId);
    const header = document.createElement("header");
    header.className = "vm-header";
    const title = document.createElement("h2");
    title.className = "vm-title";
    title.id = titleId;
    const content = document.createElement("div");
    content.className = "vm-content";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "vm-close";
    close.setAttribute("aria-label", "Close dialog");
    close.textContent = "x";
    close.addEventListener("click", this.callbacks.onCloseClick);
    const body = document.createElement("div");
    body.className = "vm-body";
    body.id = bodyId;
    const footer = document.createElement("footer");
    footer.className = "vm-footer";
    header.append(title, close);
    content.append(header, body, footer);
    dialog.appendChild(content);
    overlay.appendChild(dialog);
    overlay.addEventListener("click", this.callbacks.onOverlayClick);
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
    this.refs.close.setAttribute("aria-label", normalizeContent(options.closeButton?.ariaLabel || "Close dialog"));
    if (options.closeButton?.allowHtml) {
      this.refs.close.innerHTML = normalizeContent(options.closeButton?.text ?? "");
    } else {
      this.refs.close.textContent = normalizeContent(options.closeButton?.text ?? "");
    }
    if (options.ariaDescription) {
      this.refs.body.setAttribute("aria-description", options.ariaDescription);
    } else {
      this.refs.body.removeAttribute("aria-description");
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
    this.refs.footer.innerHTML = "";
    for (const config of state.getButtons()) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = withClass("vm-button", config.className);
      button.dataset.buttonId = config.id;
      button.dataset.vmAutofocus = String(config.autoFocus);
      button.textContent = config.label;
      button.addEventListener("click", () => this.callbacks.onButtonClick(config));
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
    const isOpen = this.refs.root.classList.contains("vm-open");
    this.refs.root.className = withClass("vm-overlay", options.className, classes.root);
    this.refs.root.classList.toggle("vm-open", isOpen);
    this.refs.dialog.className = withClass("vm-dialog", classes.dialog);
    this.refs.content.className = withClass("vm-content", classes.content);
    this.refs.header.className = withClass("vm-header", classes.header);
    this.refs.title.className = withClass("vm-title", classes.title);
    this.refs.body.className = withClass("vm-body", classes.body);
    this.refs.footer.className = withClass("vm-footer", classes.footer);
    this.refs.close.className = withClass("vm-close", classes.close, options.closeButton?.className || "");
    for (const button of this.refs.footer.querySelectorAll("button")) {
      const ownClass = normalizeContent(button.className).replace("vm-button", "").trim();
      button.className = withClass("vm-button", classes.button, ownClass);
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
    this.refs.root.classList.toggle("vm-open", visible);
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
      if (node.hasAttribute("disabled")) return false;
      if (node.hidden) return false;
      if (node.getAttribute("aria-hidden") === "true") return false;
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
    this.refs.close?.removeEventListener("click", this.callbacks.onCloseClick);
    this.refs.root.removeEventListener("click", this.callbacks.onOverlayClick);
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
};

// src/core/modal-state-store.js
var idCounter = 1;
function normalizeContent2(content) {
  if (content == null) return "";
  return String(content);
}
function normalizeButtons(buttons) {
  if (!Array.isArray(buttons)) return [];
  return buttons.map((button, index) => ({
    id: button.id || `btn-${index + 1}`,
    label: normalizeContent2(button.label || "OK"),
    className: button.className || "",
    autoFocus: Boolean(button.autoFocus),
    closeOnClick: button.closeOnClick !== false,
    action: typeof button.action === "function" ? button.action : null
  }));
}
function normalizeCloseButton(closeButton) {
  const next = closeButton || {};
  return {
    text: normalizeContent2(next.text ?? "x"),
    ariaLabel: normalizeContent2(next.ariaLabel || "Close dialog"),
    className: normalizeContent2(next.className || ""),
    allowHtml: Boolean(next.allowHtml),
    visible: next.visible !== false
  };
}
function getMountElement(mount) {
  if (mount instanceof HTMLElement) return mount;
  return document.body;
}
var ModalStateStore = class {
  /**
   * Creates a modal state store instance.
   *
   * @param {Record<string, any>} [options]
   */
  constructor(options = {}) {
    const merged = deepMerge(getDefaultOptions(), deepMerge(defaultOptions, options));
    this.options = {
      ...merged,
      id: merged.id || `vm-${idCounter++}`,
      title: normalizeContent2(merged.title),
      message: merged.message,
      buttons: normalizeButtons(merged.buttons),
      closeButton: normalizeCloseButton(merged.closeButton),
      data: { ...merged.data || {} },
      themeClasses: { ...merged.themeClasses || {} }
    };
    this.runtime = {
      opened: false,
      realized: false,
      destroyed: false,
      lastActiveElement: null
    };
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
    this.options.title = normalizeContent2(title);
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
      ...closeButton || {}
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
      ...classes || {}
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
  setOpened(opened2) {
    this.runtime.opened = Boolean(opened2);
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
};

// src/utils/event-emitter.js
var EventEmitter = class {
  /**
   * Creates a new emitter instance.
   */
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
  }
  /**
   * Registers a callback for one event.
   *
   * @param {string} event
   * @param {(payload: any) => void} callback
   * @returns {() => void}
   */
  on(event, callback) {
    const list = this.listeners.get(event) || [];
    list.push(callback);
    this.listeners.set(event, list);
    return () => this.off(event, callback);
  }
  /**
   * Unregisters a callback for one event.
   *
   * @param {string} event
   * @param {(payload: any) => void} callback
   * @returns {void}
   */
  off(event, callback) {
    const list = this.listeners.get(event);
    if (!list) return;
    this.listeners.set(
      event,
      list.filter((item) => item !== callback)
    );
  }
  /**
   * Emits one event payload.
   *
   * @param {string} event
   * @param {any} payload
   * @returns {void}
   */
  emit(event, payload) {
    const list = this.listeners.get(event);
    if (!list) return;
    for (const callback of list) callback(payload);
  }
};

// src/core/vanilla-modal.js
var VanillaModal = class {
  /**
   * Creates a modal instance.
   *
   * @param {Record<string, any>} [options]
   */
  constructor(options = {}) {
    if (typeof document === "undefined") {
      throw new Error("VanillaModal requires a DOM environment.");
    }
    this.store = new ModalStateStore(options);
    this.events = new EventEmitter();
    this.hooks = {};
    this.boundOnOverlayClick = (event) => {
      if (event.target !== this.renderer.getRoot()) return;
      if (!this.store.getOption("closeByBackdrop") || !this.store.getOption("closable")) return;
      this.close("backdrop").then(() => {
      });
    };
    this.boundOnCloseClick = () => {
      this.close("close-button").then(() => {
      });
    };
    this.boundOnButtonClick = (config) => {
      const payload = { modal: this, buttonId: config.id };
      let actionResult = true;
      if (config.action) {
        try {
          actionResult = config.action(this, payload);
        } catch (error) {
          actionResult = false;
          this.emitEvent("error", { error, buttonId: config.id });
        }
      }
      this.emitEvent("button:click", {
        modal: this,
        buttonId: config.id,
        result: actionResult
      });
      if (actionResult !== false && config.closeOnClick) {
        this.close("button").then(() => {
        });
      }
    };
    this.renderer = new ModalRenderer({
      onOverlayClick: this.boundOnOverlayClick,
      onCloseClick: this.boundOnCloseClick,
      onButtonClick: this.boundOnButtonClick
    });
    this.boundOnKeydown = (event) => {
      if (!this.store.isOpened()) return;
      if (event.key === "Escape" && this.store.getOption("closeByKeyboard") && this.store.getOption("closable")) {
        event.preventDefault();
        this.close("keyboard").then(() => {
        });
        return;
      }
      if (event.key === "Tab") {
        this.renderer.trapFocus(event);
      }
    };
    registerModal(this);
    this.emitEvent("init", { instance: this });
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
    const allowOpen = this.invokeGuard("onShow", { modal: this });
    if (!allowOpen) return Promise.resolve(this);
    const wasOpen = this.store.isOpened();
    const layer = wasOpen ? bringToFront(this) : setOpened(this, true);
    const zIndex = getLayerZIndex(layer);
    this.renderer.setVisible(true, zIndex);
    if (!wasOpen) {
      this.store.setLastActiveElement(document.activeElement);
    }
    this.store.setOpened(true);
    document.addEventListener("keydown", this.boundOnKeydown);
    this.renderer.focusDialog();
    this.emitEvent("show", { modal: this, reopened: wasOpen });
    Promise.resolve().then(() => {
      if (!this.store.isOpened()) return;
      this.renderer.focusFirst();
      this.invokeHook("afterOpen", { modal: this });
      this.invokeCallback("onShown", { modal: this });
      this.emitEvent("shown", { modal: this });
    });
    return Promise.resolve(this);
  }
  /**
   * Closes the modal instance.
   *
   * @param {string} [reason]
   * @returns {Promise<VanillaModal>}
   */
  close(reason = "api") {
    if (!this.store.isOpened() || this.store.isDestroyed()) {
      return Promise.resolve(this);
    }
    const allowClose = this.invokeGuard("onHide", { modal: this, reason });
    if (!allowClose) return Promise.resolve(this);
    this.emitEvent("hide", { modal: this, reason });
    this.store.setOpened(false);
    setOpened(this, false);
    this.renderer.setVisible(false, getLayerZIndex(0));
    document.removeEventListener("keydown", this.boundOnKeydown);
    this.renderer.restoreFocus(this.store.getLastActiveElement());
    this.invokeHook("afterClose", { modal: this, reason });
    this.invokeCallback("onHidden", { modal: this, reason });
    this.emitEvent("hidden", { modal: this, reason });
    if (!this.store.getOption("autoDestroy")) return Promise.resolve(this);
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
      return this.close("destroy").then(() => this);
    }
    this.renderer.destroy();
    document.removeEventListener("keydown", this.boundOnKeydown);
    unregisterModal(this);
    this.store.setDestroyed(true);
    this.store.setRealized(false);
    this.emitEvent("destroy", { modal: this });
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
    this.emitEvent("title:change", { title: nextTitle });
    return Promise.resolve(this);
  }
  /**
   * Updates dialog body content.
   *
   * @param {string} message
   * @param {boolean} [allowHtml]
   * @returns {Promise<VanillaModal>}
   */
  setMessage(message, allowHtml = this.store.getOption("allowHtml")) {
    this.store.setMessage(message);
    if (this.store.isRealized()) {
      this.renderer.renderMessage(message, allowHtml);
    }
    this.emitEvent("message:change", { message });
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
    this.emitEvent("buttons:change", { buttons: [...nextButtons] });
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
    this.emitEvent("buttons:change", { buttons: [...nextButtons] });
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
    this.emitEvent("closebutton:change", { closeButton: { ...nextCloseButton } });
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
    this.emitEvent("closebutton:change", { closeButton: { ...nextCloseButton } });
    return Promise.resolve(this);
  }
  /**
   * Sets whether overlay clicks close the modal.
   *
   * @param {boolean} closeByBackdrop
   * @returns {Promise<VanillaModal>}
   */
  setCloseByBackdrop(closeByBackdrop) {
    this.store.setOption("closeByBackdrop", Boolean(closeByBackdrop));
    this.emitEvent("closebybackdrop:change", {
      closeByBackdrop: this.store.getOption("closeByBackdrop")
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
    this.emitEvent("data:change", { key, value });
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
    this.invokeHook("afterRealize", { modal: this });
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
    if (typeof hook !== "function") return;
    try {
      hook(payload);
    } catch (error) {
      this.emitEvent("error", { error, hook: name });
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
    if (typeof callback !== "function") return true;
    try {
      return callback(payload) !== false;
    } catch (error) {
      this.emitEvent("error", { error, callback: name });
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
    const hookName = name === "onShow" ? "beforeOpen" : "beforeClose";
    const hook = this.hooks[hookName];
    if (typeof hook === "function") {
      try {
        if (hook(payload) === false) return false;
      } catch (error) {
        this.emitEvent("error", { error, hook: hookName });
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
    if (this.store.getOption("events")?.debug && typeof console !== "undefined") {
      console.debug(`[vanilla-modals] ${event}`, payload);
    }
  }
};

// src/plugins/theme-plugin.js
function themePlugin(classes) {
  return (modal) => {
    modal.setThemeClasses(classes || {});
  };
}

// src/plugins/bootstrap-theme.js
function bootstrapThemePlugin() {
  const applyTheme = themePlugin({
    root: "modal fade show",
    dialog: "modal-dialog modal-dialog-centered",
    content: "modal-content",
    title: "modal-title fs-5",
    body: "modal-body",
    footer: "modal-footer",
    close: "btn-close",
    button: "btn"
  });
  return (modal) => {
    applyTheme(modal);
    modal.setCloseButton({
      text: "",
      ariaLabel: "Close",
      className: "",
      allowHtml: false
    });
  };
}

// src/plugins/bulma-theme.js
function bulmaThemePlugin() {
  return themePlugin({
    root: "modal is-active",
    dialog: "modal-card",
    title: "modal-card-title",
    body: "modal-card-body",
    footer: "modal-card-foot",
    close: "delete",
    button: "button"
  });
}

// src/plugins/mui-theme.js
function muiThemePlugin() {
  return themePlugin({
    root: "MuiModal-root",
    dialog: "MuiPaper-root MuiDialog-paper MuiDialog-paperWidthSm",
    header: "MuiDialogTitleBar-root",
    title: "MuiDialogTitle-root",
    body: "MuiDialogContent-root",
    footer: "MuiDialogActions-root",
    close: "MuiIconButton-root",
    button: "MuiButton-root MuiButton-text MuiButton-textPrimary"
  });
}

// src/plugins/tailwind-theme.js
function tailwindThemePlugin() {
  return themePlugin({
    root: "fixed inset-0 flex items-center justify-center",
    dialog: "w-full max-w-lg rounded border bg-white shadow",
    title: "text-lg font-semibold",
    body: "mt-3",
    footer: "mt-4 flex justify-end gap-2",
    close: "inline-flex items-center justify-center",
    button: "inline-flex items-center rounded border px-3 py-1.5 text-sm"
  });
}

// src/index.js
function normalizeDialogArgs(input, callback) {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return {
      ...input,
      callback: typeof input.callback === "function" ? input.callback : callback
    };
  }
  return {
    message: input,
    callback
  };
}
function createVanillaModal(options = {}) {
  return new VanillaModal(options);
}
function show(options = {}) {
  const modal = createVanillaModal(options);
  modal.open().then(() => {
  });
  return modal;
}
function alert(input, callback) {
  const options = normalizeDialogArgs(input, callback);
  const done = typeof options.callback === "function" ? options.callback : () => {
  };
  const modal = createVanillaModal({
    title: options.title || "Alert",
    message: options.message || "",
    closable: options.closable === true,
    closeByBackdrop: options.closeByBackdrop === true,
    closeByKeyboard: options.closeByKeyboard === true,
    autoDestroy: options.autoDestroy !== false,
    allowHtml: Boolean(options.allowHtml),
    className: options.className || "",
    buttons: [
      {
        id: "ok",
        label: options.buttonLabel || "OK",
        className: options.buttonClassName || "",
        autoFocus: true,
        action: () => done(true)
      }
    ],
    onHidden: (payload) => {
      if (payload.reason !== "button") {
        done(false);
      }
      if (typeof options.onHidden === "function") {
        return options.onHidden(payload);
      }
      return true;
    }
  });
  modal.open().then(() => {
  });
  return modal;
}
function confirm(input, callback) {
  const options = normalizeDialogArgs(input, callback);
  const done = typeof options.callback === "function" ? options.callback : () => {
  };
  const buttons = [
    {
      id: "cancel",
      label: options.cancelLabel || "Cancel",
      className: options.cancelClassName || "",
      action: () => done(false)
    },
    {
      id: "ok",
      label: options.okLabel || "OK",
      className: options.okClassName || "",
      autoFocus: true,
      action: () => done(true)
    }
  ];
  const orderedButtons = options.reverseButtons ? buttons.reverse() : buttons;
  const modal = createVanillaModal({
    title: options.title || "Confirm",
    message: options.message || "",
    closable: options.closable === true,
    closeByBackdrop: options.closeByBackdrop === true,
    closeByKeyboard: options.closeByKeyboard === true,
    autoDestroy: options.autoDestroy !== false,
    allowHtml: Boolean(options.allowHtml),
    className: options.className || "",
    buttons: orderedButtons,
    onHidden: (payload) => {
      if (payload.reason !== "button") {
        done(false);
      }
      if (typeof options.onHidden === "function") {
        return options.onHidden(payload);
      }
      return true;
    }
  });
  modal.open().then(() => {
  });
  return modal;
}
export {
  VanillaModal,
  alert,
  bootstrapThemePlugin,
  bulmaThemePlugin,
  closeAll,
  configDefaultOptions,
  confirm,
  createVanillaModal,
  getDefaultOptions,
  getModal,
  getModals,
  muiThemePlugin,
  openAll,
  show,
  tailwindThemePlugin,
  themePlugin
};
//# sourceMappingURL=vanilla-modals.js.map

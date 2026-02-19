export type ModalButtonConfig = {
    id?: string;
    label?: string;
    className?: string;
    autoFocus?: boolean;
    closeOnClick?: boolean;
    action?: (modal: VanillaModal, payload: { modal: VanillaModal; buttonId: string }) => boolean | void;
};

export type CloseButtonConfig = {
    text?: string;
    ariaLabel?: string;
    className?: string;
    allowHtml?: boolean;
    visible?: boolean;
};

export type ModalOptions = {
    id?: string;
    title?: string;
    message?: string;
    closable?: boolean;
    closeByBackdrop?: boolean;
    closeByKeyboard?: boolean;
    autoDestroy?: boolean;
    closeButton?: CloseButtonConfig;
    className?: string;
    ariaDescription?: string;
    allowHtml?: boolean;
    buttons?: ModalButtonConfig[];
    data?: Record<string, any>;
    themeClasses?: Record<string, string>;
    mount?: HTMLElement | null;
    onShow?: (payload: { modal: VanillaModal }) => boolean | void;
    onShown?: (payload: { modal: VanillaModal }) => boolean | void;
    onHide?: (payload: { modal: VanillaModal; reason: string }) => boolean | void;
    onHidden?: (payload: { modal: VanillaModal; reason: string }) => boolean | void;
    events?: {
        debug?: boolean;
    };
};

export type DialogInput = string | (ModalOptions & { callback?: (value: boolean) => void });
export type ModalPlugin = (modal: VanillaModal) => void;

export class VanillaModal {
    constructor(options?: ModalOptions);
    getId(): string;
    getElement(): HTMLElement | null;
    isOpen(): boolean;
    isRealized(): boolean;
    open(): Promise<VanillaModal>;
    close(reason?: string): Promise<VanillaModal>;
    destroy(): Promise<VanillaModal>;
    on(event: string, callback: (payload: any) => void): () => void;
    off(event: string, callback: (payload: any) => void): void;
    use(plugin: ModalPlugin): VanillaModal;
    registerHook(name: string, callback: (payload: any) => void): VanillaModal;
    setTitle(title: string): Promise<VanillaModal>;
    setMessage(message: string, allowHtml?: boolean): Promise<VanillaModal>;
    setButtons(buttons: ModalButtonConfig[]): Promise<VanillaModal>;
    addButton(button: ModalButtonConfig): Promise<VanillaModal>;
    setCloseButton(closeButton: CloseButtonConfig): Promise<VanillaModal>;
    setCloseButtonVisible(visible: boolean): Promise<VanillaModal>;
    setCloseByBackdrop(closeByBackdrop: boolean): Promise<VanillaModal>;
    setData(key: string, value: any): Promise<VanillaModal>;
    getData(key: string): any;
    setThemeClasses(classes: Record<string, string>): Promise<VanillaModal>;
    focus(): Promise<VanillaModal>;
}

export function createVanillaModal(options?: ModalOptions): VanillaModal;
export function show(options?: ModalOptions): VanillaModal;
export function alert(input: DialogInput, callback?: (value: boolean) => void): VanillaModal;
export function confirm(input: DialogInput, callback?: (value: boolean) => void): VanillaModal;
export function configDefaultOptions(options: ModalOptions): ModalOptions;
export function getDefaultOptions(): ModalOptions;
export function getModal(id: string): VanillaModal | null;
export function getModals(): VanillaModal[];
export function openAll(): void;
export function closeAll(reason?: string): void;

export function themePlugin(classes?: Record<string, string>): ModalPlugin;
export function bootstrapThemePlugin(): ModalPlugin;
export function bulmaThemePlugin(): ModalPlugin;
export function muiThemePlugin(): ModalPlugin;
export function tailwindThemePlugin(): ModalPlugin;

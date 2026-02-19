# Vanilla Modals

Framework-agnostic modal/dialog utility in pure JavaScript.

`vanilla-modals` keeps core behavior unstyled. Visual design belongs to framework integrations or custom CSS.
Core internals are split into `ModalStateStore`, `ModalRenderer`, and `VanillaModal` orchestration.
Lifecycle mutators are Promise-oriented and do not require `async/await`.

## Install

```bash
npm install vanilla-modals
```

## Quick Start (npm)

```js
import { show } from 'vanilla-modals';
import 'vanilla-modals/styles';

const modal = show({
    title: 'Delete item',
    message: 'This action cannot be undone.',
    buttons: [
        { id: 'cancel', label: 'Cancel' },
        {
            id: 'confirm',
            label: 'Delete',
            action: () => {
                console.log('deleted');
            }
        }
    ]
});
```

## Quick Start (CDN)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vanilla-modals/dist/vanilla-modals.css" />
<script src="https://cdn.jsdelivr.net/npm/vanilla-modals/dist/vanilla-modals.min.js"></script>
<script>
    VanillaModals.show({
        title: 'Hello',
        message: 'Modal opened from CDN.'
    });
</script>
```

## Core API

- `createVanillaModal(options)`
- `show(options)`
- `alert(messageOrOptions, callback)`
- `confirm(messageOrOptions, callback)`
- `configDefaultOptions(options)`
- `getDefaultOptions()`
- `getModal(id)`
- `getModals()`
- `openAll()`
- `closeAll(reason?)`

## Instance API

- `open() -> Promise<VanillaModal>`
- `close(reason?) -> Promise<VanillaModal>`
- `destroy() -> Promise<VanillaModal>`
- `on(event, callback)`
- `off(event, callback)`
- `use(plugin)`
- `registerHook(name, callback)`
- `setTitle(title) -> Promise<VanillaModal>`
- `setMessage(message, allowHtml?) -> Promise<VanillaModal>`
- `setButtons(buttons) -> Promise<VanillaModal>`
- `addButton(button) -> Promise<VanillaModal>`
- `setCloseButton(config) -> Promise<VanillaModal>`
- `setCloseButtonVisible(visible) -> Promise<VanillaModal>`
- `setCloseByBackdrop(enabled) -> Promise<VanillaModal>`
- `setData(key, value) -> Promise<VanillaModal>`
- `getData(key)`
- `setThemeClasses(classes) -> Promise<VanillaModal>`

## Events

- `init`
- `show`
- `shown`
- `hide`
- `hidden`
- `destroy`
- `button:click`
- `title:change`
- `message:change`
- `buttons:change`
- `data:change`
- `error`

## Framework Plugins

- `themePlugin(classes)`
- `bootstrapThemePlugin()`
- `bulmaThemePlugin()`
- `muiThemePlugin()`
- `tailwindThemePlugin()`

These plugins only map classes; they do not bundle framework CSS.

## React Wrapper Pattern

```jsx
import { useEffect, useRef } from 'react';
import { createVanillaModal } from 'vanilla-modals';

export function ModalBridge({ options, open }) {
    const instanceRef = useRef(null);

    useEffect(() => {
        instanceRef.current = createVanillaModal(options);
        return () => instanceRef.current?.destroy();
    }, []);

    useEffect(() => {
        if (!instanceRef.current) return;
        if (open) instanceRef.current.open();
        else instanceRef.current.close('controlled');
    }, [open]);

    return null;
}
```

## License

MIT

## Demos

- `demo/vanilla.html`
- `demo/bootstrap.html`
- `demo/mui.html`
- `demo/react-wrapper.html`
- `demo/vue-wrapper.html`

## Testing

- `npm run test`
- `npm run coverage`
- `npm run test:e2e`
- `npm run test:a11y`
- `npm run test:e2e:matrix`
- `npm run test:all`
- `npm run release:verify`

## Browser Support

- `Chromium` (CI + local)
- `Firefox` (local matrix)
- `WebKit` (local matrix)

Use `npm run test:e2e:matrix` to execute the cross-browser Playwright suite locally.

## Release Gate

`npm run release:verify` validates:

- dist artifacts existence
- ESM/CJS export smoke checks
- minified JS/CSS size budgets (raw + gzip)
- packed tarball contents from `npm pack`

`prepublishOnly` enforces the full release gate:

```bash
npm run build
npm run test
npm run test:e2e
npm run release:verify
```

## Production Notes

- Plugin order:
  Apply theme plugins before `open()` when possible. Runtime plugin application is supported.
- Nested modals:
  Multiple open modals are stacked and focus-trapped by layer order.
- Mount lifecycle:
  Use `destroy()` when modal instances are no longer needed, especially in framework wrappers.
- HTML safety:
  `allowHtml` defaults to `false`. Only enable it with trusted, sanitized content.

## Versioning Policy

- While `0.x`, minor versions may include non-breaking API growth and internal refactors.
- Breaking changes require explicit changelog notes.
- `1.0.0` is reserved for API freeze of core + plugin contracts.

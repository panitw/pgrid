# @panitw/pgrid

A virtualized, extensible JavaScript data grid with frozen panes, inline editing, copy/paste, column resizing, and a pluggable extension API.

**📖 [Documentation](https://panitw.github.io/pgrid/)** · **🎮 [Live samples](https://panitw.github.io/pgrid/samples/)** · **📦 [npm](https://www.npmjs.com/package/@panitw/pgrid)**

## Features

- **Virtualized rendering** — renders only visible cells; handles large datasets smoothly
- **Frozen panes** — freeze any number of leading rows/columns (6-pane layout: top-left/top/left/center/bottom-left/bottom) — [demo](https://panitw.github.io/pgrid/samples/freeze-panes.html)
- **Inline editing** with cancellable update hooks — [demo](https://panitw.github.io/pgrid/samples/inline-editing.html)
- **Copy / paste** across cell ranges, spreadsheet-compatible TSV — [demo](https://panitw.github.io/pgrid/samples/copy-paste.html)
- **Column resizing**, **text overflow**, **checkbox columns** — [demos](https://panitw.github.io/pgrid/samples/)
- **Custom editors** — dropdowns, date pickers, anything HTML — [demo](https://panitw.github.io/pgrid/samples/custom-editors.html)
- **Cell formatters** — pills, currency, progress bars, stars — [demo](https://panitw.github.io/pgrid/samples/formatters.html)
- **Themes** — toggle dark / compact / spreadsheet looks via a single CSS class — [demo](https://panitw.github.io/pgrid/samples/themes.html)
- **Extension API** — every built-in feature is itself an extension; add your own without touching core
- **Sort / filter / search** at the data layer (`DataTable`) without losing original row order

## Install

```bash
npm install @panitw/pgrid
```

## Quick start

```js
import { PGrid } from '@panitw/pgrid';
import '@panitw/pgrid/styles';

const grid = new PGrid({
  rowHeight: 28,
  columnWidth: 90,
  editing: true,
  autoUpdate: true,
  selection: { cssClass: 'cell-selection' },
  freezePane: { left: 1 },
  columns: [
    { id: 0, field: 'name',  title: 'Name' },
    { id: 1, field: 'qty',   title: 'Qty', editable: true },
    { id: 2, field: 'price', title: 'Price', editable: true }
  ],
  dataModel: {
    fields: ['name', 'qty', 'price'],
    format: 'array',
    data: [
      ['Apple',  10, 1.5],
      ['Banana', 20, 0.5],
      ['Cherry',  5, 3.0]
    ]
  }
});

grid.render(document.getElementById('gridDiv'));
```

Or load the UMD bundle directly:

```html
<link rel="stylesheet" href="https://unpkg.com/@panitw/pgrid/dist/pgrid.css">
<script src="https://unpkg.com/@panitw/pgrid/dist/pgrid.js"></script>
<script>
  const grid = new PGrid.PGrid({ /* config */ });
  grid.render(document.getElementById('gridDiv'));
</script>
```

## Documentation

Full documentation is published at **https://panitw.github.io/pgrid/** and includes:

- [Getting Started](https://panitw.github.io/pgrid/docs/getting-started.html) — install, your first grid, walkthrough
- [Configuration](https://panitw.github.io/pgrid/docs/configuration.html) — every config option, with examples
- [Working with Data](https://panitw.github.io/pgrid/docs/data.html) — formats, CRUD, search, events
- [Styling](https://panitw.github.io/pgrid/docs/styling.html) — CSS class reference, theming, recipes
- [Extensions](https://panitw.github.io/pgrid/docs/extensions.html) — hook reference, custom editors, formatters
- [API](https://panitw.github.io/pgrid/docs/api.html) — compact reference for `PGrid`, `DataTable`, `Model`, `View`

Every feature has a runnable demo — see the **[samples gallery](https://panitw.github.io/pgrid/samples/)**.

## Built-in extensions

Available as named exports alongside `PGrid`:

```js
import {
  PGrid,
  CheckboxColumnExtension,
  ColumnResizeExtension,
  TextOverflowExtension
} from '@panitw/pgrid';
```

## Writing an extension

An extension is a plain object with optional `init(grid, config)` and any of the named hooks:

`cellRender`, `cellAfterRender`, `cellUpdate`, `cellAfterUpdate`, `cellEditableCheck`, `cellAfterRecycled`, `keyDown`, `gridAfterRender`, `dataBeforeRender`, `dataBeforeUpdate`, `dataAfterUpdate`, `dataFinishUpdate`.

```js
const upperCaseExtension = {
  cellRender(e) {
    if (typeof e.data === 'string') e.cell.innerText = e.data.toUpperCase();
  }
};

new PGrid({ extensions: [upperCaseExtension], /* ... */ });
```

Cells are recycled during virtualization, so any DOM mutations made in `cellRender` should be reset in `cellAfterRecycled`. See the [Extensions guide](https://panitw.github.io/pgrid/docs/extensions.html) for more.

## Architecture

```
PGrid → DataTable (data) + Model (layout/config) + View (DOM/render) + Extension (plugin registry) + State
```

These pieces don't talk to each other directly — they're coordinated through `PGrid` and the extension registry. See [CLAUDE.md](CLAUDE.md) for a deeper tour.

## Development

```bash
npm install
npm run dev          # Vite dev server on http://localhost:8888, opens samples/index.html
npm test             # Mocha + jsdom
npm run build        # produces dist/pgrid.js (UMD) + dist/pgrid.css for npm publish
npm run build:site   # builds the docs + samples site into site/ for GitHub Pages
npm run preview:site # preview the built site locally on http://localhost:4173
```

Samples in [`samples/`](samples/) are the integration harness — they import `PGrid` directly from `/src/index.js` with HMR. Documentation pages live in [`docs/`](docs/). Both are bundled together by `npm run build:site` and deployed automatically by [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) on every push to `master`.

## License

MIT © Panit Wechasil

# @panitw/pgrid

A virtualized, extensible JavaScript data grid with frozen panes, inline editing, copy/paste, column resizing, and a pluggable extension API.

## Features

- **Virtualized rendering** — renders only visible cells; handles large datasets smoothly
- **Frozen panes** — freeze any number of leading rows/columns (6-pane layout: top-left/top/left/center/bottom-left/bottom)
- **Inline editing** with cancellable update hooks
- **Copy / paste** across cell ranges
- **Column resizing**, **text overflow**, **checkbox columns**
- **Extension API** — every built-in feature is itself an extension; add your own without touching core
- **Sort / filter / search** at the data layer (`DataTable`) without losing original row order

## Install

```bash
npm install @panitw/pgrid
```

## Usage

### As an ES module

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

### As a UMD global

```html
<link rel="stylesheet" href="node_modules/@panitw/pgrid/dist/pgrid.css" />
<script src="node_modules/@panitw/pgrid/dist/pgrid.js"></script>
<script>
  const grid = new PGrid.PGrid({ /* config */ });
  grid.render(document.getElementById('gridDiv'));
</script>
```

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

Cells are recycled during virtualization, so any DOM mutations made in `cellRender` should be reset in `cellAfterRecycled`.

## Architecture

```
PGrid → DataTable (data) + Model (layout/config) + View (DOM/render) + Extension (plugin registry) + State
```

These pieces don't talk to each other directly — they're coordinated through `PGrid` and the extension registry. See [CLAUDE.md](CLAUDE.md) for a deeper tour.

## Development

```bash
npm install
npm run dev      # Vite dev server on http://localhost:8888, opens samples/index.html
npm test         # Mocha + jsdom
npm run build    # produces dist/pgrid.js (UMD) + dist/pgrid.css
```

Samples in [`samples/`](samples/) are the integration harness — they import `PGrid` directly from `/src/index.js` with HMR.

## License

MIT © Panit Wechasil

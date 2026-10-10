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
- **Row grouping** — fold records under group rows by one or more fields; collapsed rows leave the DOM entirely, so virtualization keeps working. A label that starts in frozen columns reads across the full width — [demo](https://panitw.github.io/pgrid/samples/row-grouping.html), [with frozen columns](https://panitw.github.io/pgrid/samples/grouped-frozen.html)
- **Column span** — declare `colspan` on any cell or header cell to merge it across columns; `stickySpan` lets a frozen span read across the scrolling columns too — [demo](https://panitw.github.io/pgrid/samples/multi-row-headers.html)
- **Extension API** — every built-in feature is itself an extension; add your own without touching core
- **Sort / filter / search** at the data layer (`DataTable`) without losing original row order

## Install

```bash
npm install @panitw/pgrid
```

## What's new in 3.1

**Group labels in frozen columns read in full.** With `freezePane.left` and a `foldableRows` `labelColumn` inside the frozen block, a group label used to be clipped at the frozen boundary. It now starts at the label column (after the chevron gutter and indent), reads across the whole visible width of the grid, frozen and scrolling columns together, and holds still on horizontal scroll while following its row vertically. Ellipsis applies at the grid's right edge. This is on by default (`foldableRows.stickyLabel: true`). Labels in the scrolling columns, and grids with nothing frozen but the gutter, behave as before.

```js
freezePane: { left: 2 },
foldableRows: {
  groupBy: ['ProjectName'],
  labelColumn: 0          // label starts at the left edge and reads across the grid
}
```

It is built on a core feature you can use directly: a cell model with `colspan` and `stickySpan: true` that starts in the frozen block and reaches past `freezePane.left` is rendered across both panes the same way. Spans without the flag clamp at the frozen boundary exactly as before.

**Group rows take no cell selection.** No cell of a group row (gutter, label, or the empty cells beside the label) can be selected by mouse, keyboard or `selectCell`; the arrow keys step over group rows, and a selection whose record is folded away is cleared instead of moving to the group row. Set `foldableRows.selectableGroupRows: true` to get the 3.0 behaviour back, including folding with <kbd>Space</kbd>. Any row or cell model can opt out of selection the same way with `selectable: false`.

**`getCell` / `scrollToCell` reach the first scrolling column.** Once scrolled right, asking for the column right after the frozen block (its left edge equal to the frozen width) did not scroll back to it. That is fixed, along with the matching edges: scrolling a cell into view now measures against the scrolling pane itself, so it no longer under-scrolls at the right and bottom edges or scrolls for frozen top/bottom rows, and it no longer mistakes a recycled, hidden cell for a rendered one. Workarounds such as calling `view.setScrollX(0)` first can be removed.

## Upgrading to 3.0

Two long-standing bugs were fixed. Both change runtime behaviour, so this is a major release even though no API was removed.

**`config.rows[].i` is now a data row index everywhere.** It always meant a data row index — the docs said so, and `cssClass` and `editable` resolved it that way — but `getRowHeight` resolved it against the *view* row index, so a per-row height landed `headerRowCount` rows above where it belonged. Header row heights come from `headerRows[].height`.

```js
// headerRowCount: 1, rowHeight: 30
rows: [{ i: 0, height: 90 }]

// 2.x — the header row became 90px tall
// 3.0 — the first data row becomes 90px tall, as documented
```

If you compensated for the old behaviour by offsetting your `i` values, remove the offset. If you were sizing a header row this way, move it to `headerRows[].height`. Configs that set only `cssClass` or `editable` are unaffected.

**`DataTable.insertRow` now updates the visible row set before dispatching `dataChanged`.** It dispatched first, so every listener saw the row set as it was *before* the insert. Listeners that worked around this by deferring their own refresh can drop the workaround.

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
  TextOverflowExtension,
  FoldableRowsExtension
} from '@panitw/pgrid';
```

Most are loaded for you by a config toggle — `columnResize`, `textOverflow`,
`foldableRows` — and are reachable afterwards via
`grid.extension.getExtension('DEFAULT_EXT_FOLDABLE_ROWS')` and friends.
`CheckboxColumnExtension` is passed in `extensions: []` instead.

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

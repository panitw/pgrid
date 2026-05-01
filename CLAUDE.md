# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` (or `npm run serve`) — start the Vite dev server on `http://localhost:8888` and auto-open `samples/index.html`. Edits to `src/`, `styles/`, or any sample HTML hot-reload in the browser; no rebuild step.
- `npm run build` — Vite library build → `dist/pgrid.js` (UMD, exposes `window.PGrid`) + `dist/pgrid.css`. CSS is generated because `src/index.js` imports `styles/pgrid.less`.
- `npm test` — Mocha across all of `test/` with `@babel/register` and a jsdom setup.
- Run a single test file: `npx mocha test/data/table.test.js`
- Filter by name: append `--grep "<pattern>"`.

Test config lives in [.mocharc.js](.mocharc.js); it auto-requires [`@babel/register`](.babelrc) and [test/setup.js](test/setup.js). The setup bootstraps jsdom into Node globals (`window`, `document`, `HTMLElement`, `KeyboardEvent`, etc.), stubs `ResizeObserver`, installs a no-op `scrollIntoViewIfNeeded`, and patches `offsetWidth`/`offsetHeight` to return `2000` so virtualization-gated cell rendering produces inspectable DOM. Tests should NOT depend on layout numbers — only on DOM structure and event flow.

Build pipeline is Vite (config in [vite.config.mjs](vite.config.mjs)). Tests still run through Mocha + `@babel/register` + [.babelrc](.babelrc) — Babel is intentionally retained *only* for the test runner. Do not add `"type": "module"` to package.json; it would break the babel-register pipeline.

`src/index.js` is the single entry point — it imports `polyfills.js` (scrollIntoViewIfNeeded for Firefox), the LESS bundle, and re-exports `PGrid` + `CheckboxColumnExtension`. The Vite UMD build wraps these so consumers get either an ES module (`import { PGrid } from 'pgrid'`) or a global (`window.PGrid` via `<script src="pgrid.js">`).

## Architecture

PGrid is a virtualized data grid. The composition is wired in [src/grid/grid.js](src/grid/grid.js):

```
PGrid → DataTable (data) + Model (layout/config) + View (DOM/render) + Extension (plugin registry) + State
```

These pieces deliberately don't talk to each other directly — they are coordinated through `PGrid` and through the **Extension** registry.

### Extension system (the central abstraction)

[src/grid/extension.js](src/grid/extension.js) is a hookpoint registry. Built-in features (selection, editing, copy/paste, view-updater, formatter) are themselves extensions, loaded conditionally from config in [grid.js:40-54](src/grid/grid.js#L40-L54). Third-party extensions go through `config.extensions` and are loaded the same way.

An extension is an object with:
- optional `init(grid, config)`
- any of the named hooks listed in [extension.js:8-21](src/grid/extension.js#L8-L21): `cellRender`, `cellAfterRender`, `cellUpdate`, `cellAfterUpdate`, `cellEditableCheck`, `cellAfterRecycled`, `keyDown`, `gridAfterRender`, `dataBeforeRender`, `dataBeforeUpdate`, `dataAfterUpdate`, `dataFinishUpdate`.

When adding a feature, the default move is to write an extension rather than to edit `view.js`/`model.js`. The View calls `executeExtension('cellRender', ...)` etc. at the appropriate points; matching that hook is how new behavior is introduced without touching the core.

Named extensions (the second arg to `loadExtension`) are addressable later via `grid.extension.getExtension(name)` — used for inter-extension lookups (e.g. selection ↔ editor).

### Model

[src/grid/model.js](src/grid/model.js) is the schema/layout layer: column/row/cell metadata from `config.columns`, `config.rows`, `config.cells`, `config.headerRows`, `config.headerCells`. It indexes them by index/coordinates and computes total content size. It does NOT hold cell values.

### DataTable

[src/data/table.js](src/data/table.js) is the data layer. It maintains:
- `_rid` — original insertion order of row IDs (auto-generated via `_idRunner`)
- `_rowMap` — `rowId → row object`
- `_transformedRid` — the projection actually shown (after sort/filter/search)

`getRowCount()` and the `*At(rowIndex, ...)` accessors operate on `_transformedRid`, NOT on the original data. Always go through these accessors when you mean "what the grid is currently showing." When you mean the underlying record, look up by `rowId` and use `getRowData` / the original-rowId helpers. This split is load-bearing for sort, filter, and multi-value search.

### View

[src/grid/view.js](src/grid/view.js) renders into a 6-pane layout (top-left/top/left/center/bottom-left/bottom plus h/v scroll) and recycles cell DOM nodes for virtualization. The pane template is in the constructor. Cells are reused from `_recycledCells`; that is why the `cellAfterRecycled` extension hook exists — extensions that mutate cell DOM must reset state when a cell is repurposed for a different row/column.

### Events

`EventDispatcher` ([src/grid/event.js](src/grid/event.js)) is the shared base. `PGrid`, `Model`, `View`, and `DataTable` all extend it. Data mutations dispatch `dataChanged`; the `ViewUpdaterExtension` is what wires that back to a re-render when `config.autoUpdate` is on.

## Conventions worth knowing

- ES modules + Babel `preset-env`; tests run through `@babel/register` (no separate compile step for tests).
- Mocha + Chai + Sinon + Leche for tests. Currently only [test/data/table.test.js](test/data/table.test.js) exists — DataTable is the most thoroughly covered layer and the best reference for expected data semantics (insertion, sort, filter, search, freeze).
- LESS sources in [styles/](styles/) compile to a single `dist/pgrid.css` via Vite (the LESS root is `pgrid.less`, imported from `src/index.js`). Class names are `pgrid-*` for structure; sample-defined classes like `grid-header-row` come from user config, not the library.
- Samples in [samples/](samples/) are the de facto integration harness — after a UI-affecting change, run `npm run dev` and verify there before declaring done. Samples import `PGrid` directly from `/src/index.js` (live source, not `dist/`), so changes are reflected with HMR. Sample HTMLs that use `choices.js`/`numeral` reference them via `/node_modules/...` paths served by Vite.

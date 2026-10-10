# Changelog

## 3.1.0

### Added

- **Group labels span frozen and scrolling columns.** When `foldableRows.labelColumn` is inside the frozen block, a group row's label starts at the label column, after the chevron gutter and indent, and reads across the whole visible width of the grid. Ellipsis applies at the grid's right edge, not at the frozen boundary. The label holds still on horizontal scroll, follows its row on vertical scroll, and survives virtualization, recycling, folding and `setGroupBy`. It is on by default; set `foldableRows.stickyLabel: false` to clip at the frozen boundary as in 3.0. Labels in the scrolling columns, and grids with nothing frozen but the gutter, are unchanged.
- **`stickySpan` cell-model flag**, the core feature behind the label. A span that starts in the frozen block, declares `stickySpan: true` and reaches past `freezePane.left` is rendered into a new span layer laid over both panes (`.pgrid-span-layer`; the cell gets `.pgrid-cell-sticky-span`). `Model#isStickySpan(r, c)` reports it. `getColumnSpan` still reports the span clamped to the frozen block, and spans without the flag clamp exactly as before.
- **`selectable: false`** on a row or cell model keeps the selection extension off it. The arrow keys step over such rows.
- **`foldableRows.selectableGroupRows`** (default `false`). See Changed.
- Sample: `samples/grouped-frozen.html`.

### Changed

- **Group rows no longer take cell selection.** Mouse, arrow keys and `selectCell` all skip every cell of a group row, including the empty frozen cells beside the label, which used to show the selection outline. When a selected record is folded away, the selection is cleared instead of moving to its group row. `foldableRows.selectableGroupRows: true` restores the 3.0 behaviour, including folding with Space.
- **The group chevron is now an SVG icon.** The `▶`/`▼` text glyphs rendered at a different size and weight in every font, and some platforms drew `▶` as a colour emoji. The chevron is now a 12px stroked SVG chevron (down when expanded, right when collapsed) in `currentColor`, centred in a 20px click target with a hover background. It gains `aria-label` ("Expand group" / "Collapse group") and a `.pgrid-group-chevron-collapsed` class. If your CSS sized the chevron with `font-size`, size `.pgrid-group-chevron svg` instead; `color` still applies.

### Fixed

- **`getCell` / `scrollToCell` reach the first scrolling column.** When the grid was scrolled right, asking for the column whose left edge equals the frozen width did not scroll back to it, because the check was `x > freezeWidth`. Columns and rows are now classified by index. Scrolling a cell into view also measures against the scrolling pane, so it:
  - no longer under-scrolls at the right edge (by the vertical scrollbar width) or the bottom edge (by the horizontal scrollbar and bottom freeze);
  - no longer over-scrolls by the header height when scrolling up;
  - no longer scrolls vertically for header, frozen-top or frozen-bottom rows.
- `getCell` / `updateCell` no longer return a recycled, hidden cell node in place of a live one. A recycled cell also drops its `data-row-index` / `data-col-index` / `data-colspan` attributes, so DOM queries by coordinate only match live cells.

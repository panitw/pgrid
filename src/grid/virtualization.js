// Pure virtualization math for view.js. Nothing in here touches DOM — the
// only "view" inputs are scalar viewport values (scroll + size) passed in by
// the caller. Keep it that way so the math stays unit-testable.

// Column span is optional on the model: the virtualization math is also driven
// by minimal stand-in models (and by Model itself before a projection exists),
// so both helpers degrade to "one column, no span" when the accessor is absent.
function columnSpan(model, rowIndex, colIndex) {
    if (typeof model.getColumnSpan !== 'function') {
        return 1;
    }
    const span = model.getColumnSpan(rowIndex, colIndex);
    return (typeof span === 'number' && span > 1) ? Math.floor(span) : 1;
}

function spanAnchor(model, rowIndex, colIndex) {
    if (typeof model.getSpanAnchor !== 'function') {
        return colIndex;
    }
    return model.getSpanAnchor(rowIndex, colIndex);
}

function spannedWidth(model, rowIndex, colIndex, span) {
    let width = 0;
    for (let i = 0; i < span; i++) {
        width += model.getColumnWidth(colIndex + i);
    }
    return width;
}

export function getCellRect(model, rowIndex, colIndex) {
    //A covered coordinate has no rect of its own — the spanning cell's rect is
    //the one every caller (scroll-into-view above all) actually means.
    colIndex = spanAnchor(model, rowIndex, colIndex);
    let y = 0;
    for (let i = 0; i < rowIndex; i++) {
        y += model.getRowHeight(i);
    }
    let x = 0;
    for (let i = 0; i < colIndex; i++) {
        x += model.getColumnWidth(i);
    }
    return {
        x,
        y,
        width: spannedWidth(model, rowIndex, colIndex, columnSpan(model, rowIndex, colIndex)),
        height: model.getRowHeight(rowIndex)
    };
}

export function isCellVisible(viewport, rect) {
    if (rect.x + rect.width < viewport.scrollLeft) return false;
    if (rect.y + rect.height < viewport.scrollTop) return false;
    if (rect.x > viewport.scrollLeft + viewport.width) return false;
    if (rect.y > viewport.scrollTop + viewport.height) return false;
    return true;
}

export function getPaneRanges({ rowCount, columnCount, topFreeze, leftFreeze, bottomFreeze }) {
    const middleEnd = rowCount - bottomFreeze;
    return {
        topLeft:    { rowStart: 0,         rowEnd: topFreeze, colStart: 0,          colEnd: leftFreeze },
        top:        { rowStart: 0,         rowEnd: topFreeze, colStart: leftFreeze, colEnd: columnCount },
        left:       { rowStart: topFreeze, rowEnd: middleEnd, colStart: 0,          colEnd: leftFreeze },
        center:     { rowStart: topFreeze, rowEnd: middleEnd, colStart: leftFreeze, colEnd: columnCount },
        bottomLeft: { rowStart: middleEnd, rowEnd: rowCount,  colStart: 0,          colEnd: leftFreeze },
        bottom:     { rowStart: middleEnd, rowEnd: rowCount,  colStart: leftFreeze, colEnd: columnCount }
    };
}

// Given a model, a pane range, and the pane's viewport, walk the cells in
// the range and return one entry per cell with the rect (relative to the
// pane's own origin, not the grid) and whether it falls inside the viewport.
// Also returns the totals so the caller can size the inner element.
export function layoutPaneCells(model, range, viewport) {
    const { rowStart, rowEnd, colStart, colEnd } = range;
    const cells = [];
    let totalHeight = 0;
    let totalWidth = 0;
    for (let r = rowStart; r < rowEnd; r++) {
        const rowHeight = model.getRowHeight(r);
        let leftRunner = 0;
        let c = colStart;
        while (c < colEnd) {
            //One entry for the anchor, widened to the summed width of the
            //columns it covers, and NO entry for those covered columns. The
            //span never leaves this pane: whatever the model declared is
            //clamped at the pane's own last column.
            let span = columnSpan(model, r, c);
            if (c + span > colEnd) {
                span = colEnd - c;
            }
            const cellWidth = spannedWidth(model, r, c, span);
            const rect = { x: leftRunner, y: totalHeight, width: cellWidth, height: rowHeight };
            const entry = {
                rowIndex: r,
                colIndex: c,
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                //Judged against the WIDENED rect, so a span stays rendered
                //while any part of it overlaps the viewport.
                visible: isCellVisible(viewport, rect)
            };
            if (span > 1) {
                entry.colspan = span;
            }
            //A sticky span still lays out (and is judged visible) inside its
            //own pane; the view just hosts it in the span layer instead.
            if (typeof model.isStickySpan === 'function' && model.isStickySpan(r, c)) {
                entry.sticky = true;
            }
            cells.push(entry);
            leftRunner += cellWidth;
            c += span;
        }
        if (leftRunner > totalWidth) totalWidth = leftRunner;
        totalHeight += rowHeight;
    }
    return { cells, totalWidth, totalHeight };
}

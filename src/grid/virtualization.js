// Pure virtualization math for view.js. Nothing in here touches DOM — the
// only "view" inputs are scalar viewport values (scroll + size) passed in by
// the caller. Keep it that way so the math stays unit-testable.

export function getCellRect(model, rowIndex, colIndex) {
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
        width: model.getColumnWidth(colIndex),
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
        for (let c = colStart; c < colEnd; c++) {
            const colWidth = model.getColumnWidth(c);
            const rect = { x: leftRunner, y: totalHeight, width: colWidth, height: rowHeight };
            cells.push({
                rowIndex: r,
                colIndex: c,
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                visible: isCellVisible(viewport, rect)
            });
            leftRunner += colWidth;
        }
        if (leftRunner > totalWidth) totalWidth = leftRunner;
        totalHeight += rowHeight;
    }
    return { cells, totalWidth, totalHeight };
}

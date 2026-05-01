import { equal, deepEqual } from 'assert';
import { getCellRect, isCellVisible, getPaneRanges, layoutPaneCells } from '../../src/grid/virtualization';

// A minimal in-memory model that satisfies the virtualization API:
// only getRowHeight and getColumnWidth are needed.
const fakeModel = (rowHeights, colWidths) => ({
    getRowHeight: (i) => rowHeights[i],
    getColumnWidth: (i) => colWidths[i]
});

describe('virtualization', () => {

    describe('getCellRect', () => {

        it('should return (0, 0, w, h) for the top-left cell', () => {
            const m = fakeModel([30, 30, 30], [80, 80, 80]);
            deepEqual(getCellRect(m, 0, 0), { x: 0, y: 0, width: 80, height: 30 });
        });

        it('should sum preceding row heights into y and column widths into x', () => {
            const m = fakeModel([30, 40, 50], [80, 90, 100]);
            deepEqual(getCellRect(m, 2, 2), { x: 80 + 90, y: 30 + 40, width: 100, height: 50 });
        });

        it('should report each cell with its OWN width and height (not the previous one)', () => {
            // Regression for an off-by-one in the original _getCellRect that
            // used the *last summed* row/col height instead of the target's.
            const m = fakeModel([30, 90, 30], [80, 200, 80]);
            const rect = getCellRect(m, 1, 1);
            equal(rect.width, 200);
            equal(rect.height, 90);
        });

        it('should handle rowIndex 0 / colIndex 0 without iterating preceding cells', () => {
            const m = fakeModel([99], [99]);
            deepEqual(getCellRect(m, 0, 0), { x: 0, y: 0, width: 99, height: 99 });
        });
    });

    describe('isCellVisible', () => {

        const viewport = { scrollLeft: 100, scrollTop: 50, width: 400, height: 300 };

        it('should report a cell fully inside the viewport as visible', () => {
            equal(isCellVisible(viewport, { x: 200, y: 100, width: 50, height: 30 }), true);
        });

        it('should report a cell fully to the left of the viewport as not visible', () => {
            equal(isCellVisible(viewport, { x: 0, y: 100, width: 50, height: 30 }), false);
        });

        it('should report a cell fully above the viewport as not visible', () => {
            equal(isCellVisible(viewport, { x: 200, y: 0, width: 50, height: 30 }), false);
        });

        it('should report a cell fully to the right of the viewport as not visible', () => {
            equal(isCellVisible(viewport, { x: 600, y: 100, width: 50, height: 30 }), false);
        });

        it('should report a cell fully below the viewport as not visible', () => {
            equal(isCellVisible(viewport, { x: 200, y: 500, width: 50, height: 30 }), false);
        });

        it('should treat a cell that straddles the left edge as visible', () => {
            // x=80, x+width=130; viewport.scrollLeft=100 → straddles.
            equal(isCellVisible(viewport, { x: 80, y: 100, width: 50, height: 30 }), true);
        });

        it('should treat a cell that straddles the right edge as visible', () => {
            // viewport right edge = scrollLeft+width = 500; cell x=480, w=50 → straddles.
            equal(isCellVisible(viewport, { x: 480, y: 100, width: 50, height: 30 }), true);
        });

        it('should treat a cell that straddles the top edge as visible', () => {
            equal(isCellVisible(viewport, { x: 200, y: 30, width: 50, height: 30 }), true);
        });

        it('should treat a cell flush against the right edge as visible (inclusive)', () => {
            // Cell x equals scrollLeft+width exactly: existing rule uses `>` so equality is visible.
            equal(isCellVisible(viewport, { x: 500, y: 100, width: 1, height: 1 }), true);
        });

        it('should treat a cell whose right edge equals scrollLeft as visible (inclusive)', () => {
            // x+width == scrollLeft (50+50=100), check is `< scrollLeft` so this stays visible.
            equal(isCellVisible(viewport, { x: 50, y: 100, width: 50, height: 1 }), true);
        });
    });

    describe('getPaneRanges', () => {

        it('should split a 10x6 grid with 1 top-freeze, 2 left-freeze, 0 bottom-freeze', () => {
            const ranges = getPaneRanges({
                rowCount: 10, columnCount: 6,
                topFreeze: 1, leftFreeze: 2, bottomFreeze: 0
            });
            deepEqual(ranges.topLeft,    { rowStart: 0,  rowEnd: 1,  colStart: 0, colEnd: 2 });
            deepEqual(ranges.top,        { rowStart: 0,  rowEnd: 1,  colStart: 2, colEnd: 6 });
            deepEqual(ranges.left,       { rowStart: 1,  rowEnd: 10, colStart: 0, colEnd: 2 });
            deepEqual(ranges.center,     { rowStart: 1,  rowEnd: 10, colStart: 2, colEnd: 6 });
            deepEqual(ranges.bottomLeft, { rowStart: 10, rowEnd: 10, colStart: 0, colEnd: 2 });
            deepEqual(ranges.bottom,     { rowStart: 10, rowEnd: 10, colStart: 2, colEnd: 6 });
        });

        it('should produce empty top/topLeft ranges when topFreeze is 0', () => {
            const ranges = getPaneRanges({
                rowCount: 5, columnCount: 3,
                topFreeze: 0, leftFreeze: 0, bottomFreeze: 0
            });
            deepEqual(ranges.topLeft, { rowStart: 0, rowEnd: 0, colStart: 0, colEnd: 0 });
            deepEqual(ranges.top,     { rowStart: 0, rowEnd: 0, colStart: 0, colEnd: 3 });
            deepEqual(ranges.center,  { rowStart: 0, rowEnd: 5, colStart: 0, colEnd: 3 });
        });

        it('should produce empty left ranges when leftFreeze is 0', () => {
            const ranges = getPaneRanges({
                rowCount: 5, columnCount: 3,
                topFreeze: 1, leftFreeze: 0, bottomFreeze: 0
            });
            deepEqual(ranges.topLeft.colEnd, 0);
            deepEqual(ranges.left.colEnd,    0);
            deepEqual(ranges.center.colStart, 0);
            deepEqual(ranges.center.colEnd,   3);
        });

        it('should split off the bottom rows when bottomFreeze > 0', () => {
            const ranges = getPaneRanges({
                rowCount: 10, columnCount: 3,
                topFreeze: 1, leftFreeze: 0, bottomFreeze: 2
            });
            deepEqual(ranges.center.rowStart, 1);
            deepEqual(ranges.center.rowEnd,   8);
            deepEqual(ranges.bottom.rowStart, 8);
            deepEqual(ranges.bottom.rowEnd,   10);
        });

        it('should leave the middle range empty when topFreeze + bottomFreeze >= rowCount', () => {
            const ranges = getPaneRanges({
                rowCount: 4, columnCount: 2,
                topFreeze: 2, leftFreeze: 0, bottomFreeze: 2
            });
            // middleEnd = 4 - 2 = 2. Center range: [2, 2) — empty.
            equal(ranges.center.rowStart, 2);
            equal(ranges.center.rowEnd, 2);
        });

        it('should partition every (row, col) into exactly one pane', () => {
            const ranges = getPaneRanges({
                rowCount: 5, columnCount: 4,
                topFreeze: 1, leftFreeze: 1, bottomFreeze: 1
            });
            const allPanes = Object.values(ranges);
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 4; c++) {
                    const matches = allPanes.filter(p =>
                        r >= p.rowStart && r < p.rowEnd &&
                        c >= p.colStart && c < p.colEnd
                    );
                    equal(matches.length, 1, `(${r},${c}) hit ${matches.length} panes`);
                }
            }
        });
    });

    describe('layoutPaneCells', () => {

        const m = fakeModel([30, 30, 30, 30], [100, 100, 100]);
        const noScroll = { scrollLeft: 0, scrollTop: 0, width: 1000, height: 1000 };

        it('should return one entry per (row, col) in the range', () => {
            const range = { rowStart: 0, rowEnd: 4, colStart: 0, colEnd: 3 };
            const { cells } = layoutPaneCells(m, range, noScroll);
            equal(cells.length, 12);
        });

        it('should compute pane-relative coordinates starting at (0, 0)', () => {
            const range = { rowStart: 1, rowEnd: 3, colStart: 1, colEnd: 3 };
            const { cells } = layoutPaneCells(m, range, noScroll);
            // First cell of the range should be at the pane origin, not at (col*100, row*30).
            equal(cells[0].x, 0);
            equal(cells[0].y, 0);
            equal(cells[0].rowIndex, 1);
            equal(cells[0].colIndex, 1);
        });

        it('should accumulate x with column widths and y with row heights', () => {
            const range = { rowStart: 0, rowEnd: 4, colStart: 0, colEnd: 3 };
            const { cells } = layoutPaneCells(m, range, noScroll);
            const cell = cells.find(c => c.rowIndex === 2 && c.colIndex === 2);
            equal(cell.x, 200);
            equal(cell.y, 60);
        });

        it('should report totalWidth and totalHeight as the full range size', () => {
            const range = { rowStart: 0, rowEnd: 4, colStart: 0, colEnd: 3 };
            const { totalWidth, totalHeight } = layoutPaneCells(m, range, noScroll);
            equal(totalWidth, 300);
            equal(totalHeight, 120);
        });

        it('should return empty cells and zero totals when the range is empty', () => {
            const empty = { rowStart: 2, rowEnd: 2, colStart: 0, colEnd: 3 };
            const { cells, totalWidth, totalHeight } = layoutPaneCells(m, empty, noScroll);
            deepEqual(cells, []);
            equal(totalWidth, 0);
            equal(totalHeight, 0);
        });

        it('should mark cells inside the viewport as visible', () => {
            const viewport = { scrollLeft: 0, scrollTop: 0, width: 250, height: 80 };
            const range = { rowStart: 0, rowEnd: 4, colStart: 0, colEnd: 3 };
            const { cells } = layoutPaneCells(m, range, viewport);
            const visible = cells.filter(c => c.visible);
            // 250x80 viewport over 100x30 cells → cols 0,1,2 (col2 starts at 200<250), rows 0,1,2 (row2 starts at 60<80).
            equal(visible.length, 9);
        });

        it('should mark cells outside the viewport as not visible', () => {
            const viewport = { scrollLeft: 0, scrollTop: 0, width: 50, height: 25 };
            const range = { rowStart: 0, rowEnd: 4, colStart: 0, colEnd: 3 };
            const { cells } = layoutPaneCells(m, range, viewport);
            const visible = cells.filter(c => c.visible);
            // Only the top-left cell straddles, which counts as visible.
            equal(visible.length, 1);
            equal(visible[0].rowIndex, 0);
            equal(visible[0].colIndex, 0);
        });

        it('should account for scroll offsets when filtering visibility', () => {
            const viewport = { scrollLeft: 100, scrollTop: 30, width: 150, height: 50 };
            const range = { rowStart: 0, rowEnd: 4, colStart: 0, colEnd: 3 };
            const { cells } = layoutPaneCells(m, range, viewport);
            const visibleCoords = cells
                .filter(c => c.visible)
                .map(c => `${c.rowIndex},${c.colIndex}`);
            // Viewport spans x ∈ [100, 250], y ∈ [30, 80] in pane-local coords.
            // The visibility check is liberal (overscan): cells whose right
            // edge equals scrollLeft, or whose left edge equals scrollLeft+width,
            // are still considered visible. So row 0 and col 0 are kept too.
            // The only excluded row is row 3 (y=90 > 80).
            const expected = [];
            for (const r of [0, 1, 2]) for (const c of [0, 1, 2]) expected.push(`${r},${c}`);
            deepEqual(visibleCoords.sort(), expected.sort());
        });

        it('should handle non-uniform row heights and column widths', () => {
            const m2 = fakeModel([20, 50, 30], [60, 200, 40]);
            const range = { rowStart: 0, rowEnd: 3, colStart: 0, colEnd: 3 };
            const { cells, totalWidth, totalHeight } = layoutPaneCells(m2, range, noScroll);
            equal(totalWidth, 300);
            equal(totalHeight, 100);
            // Cell (1, 1) should sit at x=60, y=20 with width=200, height=50.
            const c11 = cells.find(c => c.rowIndex === 1 && c.colIndex === 1);
            deepEqual(
                { x: c11.x, y: c11.y, width: c11.width, height: c11.height },
                { x: 60, y: 20, width: 200, height: 50 }
            );
        });
    });

    describe('integration: getPaneRanges + layoutPaneCells', () => {

        it('should give every pane a coordinate space starting at its own (0, 0)', () => {
            const m = fakeModel([30, 30, 30, 30, 30], [80, 80, 80, 80]);
            const ranges = getPaneRanges({
                rowCount: 5, columnCount: 4,
                topFreeze: 1, leftFreeze: 1, bottomFreeze: 1
            });
            const noScroll = { scrollLeft: 0, scrollTop: 0, width: 9999, height: 9999 };

            // The first cell of each pane should be at (0, 0) in pane-local coords.
            for (const name of Object.keys(ranges)) {
                const { cells } = layoutPaneCells(m, ranges[name], noScroll);
                if (cells.length > 0) {
                    equal(cells[0].x, 0, `pane ${name} first cell x`);
                    equal(cells[0].y, 0, `pane ${name} first cell y`);
                }
            }
        });
    });
});

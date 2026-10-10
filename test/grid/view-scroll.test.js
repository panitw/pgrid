import { equal, notEqual } from 'assert';
import { PGrid } from '../../src/grid/grid';

// getCell / scrollToCell bring an off-screen cell into view. jsdom runs no
// layout, so the pane sizes are pinned per test with the _mockOffset* hooks
// from test/setup.js, and the left inner's clientHeight is pinned so setScrollY
// has room to scroll.

const COLUMN_COUNT = 6;
const ROW_COUNT = 10;

const config = (over = {}) => {
    const columns = [];
    const fields = [];
    for (let c = 0; c < COLUMN_COUNT; c++) {
        columns.push({ field: 'f' + c, title: 'F' + c });
        fields.push('f' + c);
    }
    const data = [];
    for (let r = 0; r < ROW_COUNT; r++) {
        const row = {};
        fields.forEach((f) => { row[f] = f + '-' + r; });
        data.push(row);
    }
    return Object.assign({
        rowHeight: 30,
        columnWidth: 80,
        headerRowCount: 1,
        columns,
        dataModel: { fields, data }
    }, over);
};

// A 160 x 60 scrolling viewport: two columns, two rows.
const renderSmall = (over) => {
    const grid = new PGrid(config(over));
    const host = document.createElement('div');
    document.body.appendChild(host);
    grid.render(host);
    for (const sel of ['.pgrid-center-pane', '.pgrid-left-pane', '.pgrid-top-pane']) {
        const pane = host.querySelector(sel);
        pane._mockOffsetWidth = 160;
        pane._mockOffsetHeight = 60;
    }
    Object.defineProperty(host.querySelector('.pgrid-left-inner'), 'clientHeight', { get: () => 1000 });
    // The first render saw the default 2000px panes; lay out again at 160 x 60.
    grid.view.reRender();
    return { grid, host, cleanup: () => document.body.removeChild(host) };
};

const scrollX = (host, x) => {
    const bar = host.querySelector('.pgrid-hscroll');
    bar.scrollLeft = x;
    bar.dispatchEvent(new window.Event('scroll'));
};

const scrollY = (host, y) => {
    const bar = host.querySelector('.pgrid-vscroll');
    bar.scrollTop = y;
    bar.dispatchEvent(new window.Event('scroll'));
};

describe('View scroll-into-view', () => {

    describe('horizontal, with frozen columns', () => {

        it('should scroll back to the first scrolling column (x === frozen width)', () => {
            const { grid, host, cleanup } = renderSmall({ freezePane: { left: 2 } });
            scrollX(host, 200);
            equal(grid.view.getScrollX(), 200);
            equal(grid.view.getCell(1, 2, false), null, 'precondition: scrolled out of view');

            const cell = grid.view.getCell(1, 2);

            notEqual(cell, null);
            equal(grid.view.getScrollX(), 0);
            cleanup();
        });

        it('should do the same through scrollToCell', () => {
            const { grid, host, cleanup } = renderSmall({ freezePane: { left: 2 } });
            scrollX(host, 200);
            grid.view.scrollToCell(1, 2);
            equal(grid.view.getScrollX(), 0);
            cleanup();
        });

        it('should align a cell past the right edge with the pane right edge', () => {
            const { grid, cleanup } = renderSmall({ freezePane: { left: 2 } });
            // Column 5 spans pane x 240..320; the pane is 160 wide.
            grid.view.getCell(1, 5);
            equal(grid.view.getScrollX(), 160);
            cleanup();
        });

        it('should not return a recycled (hidden) node for a scrolled-away cell', () => {
            const { grid, host, cleanup } = renderSmall({ freezePane: { left: 2 } });
            scrollX(host, 200);
            equal(host.querySelector('[data-row-index="1"][data-col-index="2"]'), null);
            const cell = grid.view.getCell(1, 2);
            notEqual(cell.style.display, 'none');
            equal(cell.dataset.colIndex, '2');
            cleanup();
        });

        it('should not scroll horizontally for a frozen column', () => {
            const { grid, host, cleanup } = renderSmall({ freezePane: { left: 2 } });
            scrollX(host, 200);
            grid.view.getCell(1, 1);
            equal(grid.view.getScrollX(), 200);
            cleanup();
        });

        it('should scroll back to column 0 when nothing is frozen', () => {
            const { grid, host, cleanup } = renderSmall();
            scrollX(host, 200);
            grid.view.getCell(1, 0);
            equal(grid.view.getScrollX(), 0);
            cleanup();
        });
    });

    describe('vertical', () => {

        it('should scroll back to the first body row', () => {
            const { grid, host, cleanup } = renderSmall();
            scrollY(host, 200);
            equal(grid.view.getScrollY(), 200);
            equal(grid.view.getCell(1, 0, false), null, 'precondition: scrolled out of view');

            notEqual(grid.view.getCell(1, 0), null);
            equal(grid.view.getScrollY(), 0);
            cleanup();
        });

        it('should align a row below the viewport with the pane bottom edge', () => {
            const { grid, cleanup } = renderSmall();
            // Row 5 spans pane y 120..150; the pane is 60 tall.
            grid.view.getCell(5, 0);
            equal(grid.view.getScrollY(), 90);
            cleanup();
        });

        it('should not scroll vertically for a header row', () => {
            const { grid, host, cleanup } = renderSmall();
            scrollY(host, 200);
            grid.view.getCell(0, 0);
            equal(grid.view.getScrollY(), 200);
            cleanup();
        });

        it('should not scroll vertically for a frozen top row', () => {
            const { grid, host, cleanup } = renderSmall({ freezePane: { top: 1 } });
            scrollY(host, 200);
            grid.view.getCell(1, 0);
            equal(grid.view.getScrollY(), 200);
            cleanup();
        });
    });
});

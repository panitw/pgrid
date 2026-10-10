import { equal, notEqual } from 'assert';
import { PGrid } from '../../src/grid/grid';

// Core sticky spans (Model#isStickySpan + the View's span layers), exercised
// through plain config.cells so nothing here depends on FoldableRowsExtension.

const COLUMNS = () => ([
    { field: 'a', title: 'A' },
    { field: 'b', title: 'B' },
    { field: 'c', title: 'C' },
    { field: 'd', title: 'D' },
    { field: 'e', title: 'E' }
]);

const baseConfig = (over = {}) => Object.assign({
    rowHeight: 30,
    columnWidth: 80,
    headerRowCount: 1,
    columns: COLUMNS(),
    dataModel: {
        fields: ['a', 'b', 'c', 'd', 'e'],
        data: [
            { a: 'a0', b: 'b0', c: 'c0', d: 'd0', e: 'e0' },
            { a: 'a1', b: 'b1', c: 'c1', d: 'd1', e: 'e1' },
            { a: 'a2', b: 'b2', c: 'c2', d: 'd2', e: 'e2' }
        ]
    }
}, over);

const renderInto = (config) => {
    const grid = new PGrid(config);
    const host = document.createElement('div');
    document.body.appendChild(host);
    grid.render(host);
    return { grid, host, cleanup: () => document.body.removeChild(host) };
};

const cellAt = (host, r, c) =>
    host.querySelector(`[data-row-index="${r}"][data-col-index="${c}"]`);

describe('Sticky span (core)', () => {

    describe('Model#isStickySpan', () => {

        it('should be true for a frozen-band span that reaches past the boundary', () => {
            const grid = new PGrid(baseConfig({
                freezePane: { left: 2 },
                cells: [{ r: 0, c: 0, colspan: 5, stickySpan: true }]
            }));
            equal(grid.model.isStickySpan(1, 0), true);
            // The model span itself still clamps at the frozen boundary.
            equal(grid.model.getColumnSpan(1, 0), 2);
        });

        it('should be false without the flag — ordinary spans keep clamping', () => {
            const grid = new PGrid(baseConfig({
                freezePane: { left: 2 },
                cells: [{ r: 0, c: 0, colspan: 5 }]
            }));
            equal(grid.model.isStickySpan(1, 0), false);
            equal(grid.model.getColumnSpan(1, 0), 2);
        });

        it('should be false without a frozen pane', () => {
            const grid = new PGrid(baseConfig({
                cells: [{ r: 0, c: 0, colspan: 5, stickySpan: true }]
            }));
            equal(grid.model.isStickySpan(1, 0), false);
            equal(grid.model.getColumnSpan(1, 0), 5);
        });

        it('should be false for a span that starts in the scrolling band', () => {
            const grid = new PGrid(baseConfig({
                freezePane: { left: 1 },
                cells: [{ r: 0, c: 1, colspan: 4, stickySpan: true }]
            }));
            equal(grid.model.isStickySpan(1, 1), false);
        });

        it('should be false for a span that ends inside the frozen band', () => {
            const grid = new PGrid(baseConfig({
                freezePane: { left: 3 },
                cells: [{ r: 0, c: 0, colspan: 2, stickySpan: true }]
            }));
            equal(grid.model.isStickySpan(1, 0), false);
        });

        it('should be false on rows and columns that declare nothing', () => {
            const grid = new PGrid(baseConfig({
                freezePane: { left: 2 },
                cells: [{ r: 0, c: 0, colspan: 5, stickySpan: true }]
            }));
            equal(grid.model.isStickySpan(2, 0), false);
            equal(grid.model.isStickySpan(1, 1), false);
            equal(grid.model.isStickySpan(0, 0), false);
        });
    });

    describe('rendering', () => {

        const stickyConfig = (over = {}) => baseConfig(Object.assign({
            freezePane: { left: 2 },
            cells: [{ r: 0, c: 0, colspan: 5, stickySpan: true }]
        }, over));

        it('should host a sticky span in the body span layer, not the frozen pane', () => {
            const { host, cleanup } = renderInto(stickyConfig());
            const cell = cellAt(host, 1, 0);
            notEqual(cell, null);
            equal(cell.parentElement.className, 'pgrid-body-span-inner');
            equal(host.querySelector('.pgrid-left-inner').contains(cell), false);
            equal(cell.classList.contains('pgrid-cell-sticky-span'), true);
            cleanup();
        });

        it('should run the span from its own x to the right edge of the layer', () => {
            const { host, cleanup } = renderInto(stickyConfig({
                cells: [{ r: 0, c: 1, colspan: 4, stickySpan: true }]
            }));
            const cell = cellAt(host, 1, 1);
            equal(cell.style.left, '80px');
            equal(cell.style.width, 'calc(100% - 80px)');
            cleanup();
        });

        it('should cap the span layer at the total column width', () => {
            const { host, cleanup } = renderInto(stickyConfig());
            const layer = host.querySelector('.pgrid-body-span-layer');
            equal(layer.style.maxWidth, '400px');
            equal(layer.style.left, '0px');
            cleanup();
        });

        it('should leave the span layer unscrolled when the grid scrolls horizontally', () => {
            const { grid, host, cleanup } = renderInto(stickyConfig());
            const cell = cellAt(host, 1, 0);
            const hScroll = host.querySelector('.pgrid-hscroll');
            hScroll.scrollLeft = 120;
            hScroll.dispatchEvent(new window.Event('scroll'));
            equal(grid.view.getScrollX(), 120);
            equal(host.querySelector('.pgrid-body-span-layer').scrollLeft, 0);
            equal(cellAt(host, 1, 0), cell);
            equal(cell.style.left, '0px');
            cleanup();
        });

        it('should still resolve the sticky cell through getCell', () => {
            const { grid, host, cleanup } = renderInto(stickyConfig());
            equal(grid.view.getCell(1, 0), cellAt(host, 1, 0));
            equal(grid.view.getCell(1, 1), cellAt(host, 1, 0));
            cleanup();
        });

        it('should render the frozen columns of other rows in the frozen pane as before', () => {
            const { host, cleanup } = renderInto(stickyConfig());
            const plain = cellAt(host, 2, 0);
            equal(plain.parentElement.className, 'pgrid-left-inner');
            equal(plain.style.width, '80px');
            equal(plain.style.pointerEvents, '');
            cleanup();
        });

        it('should clamp an ordinary span in the frozen pane exactly as before', () => {
            const { host, cleanup } = renderInto(stickyConfig({
                cells: [{ r: 0, c: 0, colspan: 5 }]
            }));
            const cell = cellAt(host, 1, 0);
            equal(cell.parentElement.className, 'pgrid-left-inner');
            equal(cell.dataset.colspan, '2');
            equal(cell.style.width, '160px');
            equal(host.querySelector('.pgrid-body-span-inner').children.length, 0);
            cleanup();
        });

        it('should hand a recycled sticky node back as an ordinary cell', () => {
            const { grid, host, cleanup } = renderInto(stickyConfig());
            const sticky = cellAt(host, 1, 0);
            grid.view._recycleCell(sticky);
            // Recycled nodes are reused LIFO: the next cell created gets it.
            const reused = grid.view._createCell(2, 3, 240, 30, 80, 30);
            equal(reused, sticky);
            equal(reused.style.width, '80px');
            equal(reused.style.pointerEvents, '');
            cleanup();
        });

        it('should host a sticky span in a frozen top row in the top span layer', () => {
            const { host, cleanup } = renderInto(stickyConfig({
                freezePane: { left: 2, top: 1 }
            }));
            equal(cellAt(host, 1, 0).parentElement.className, 'pgrid-top-span-inner');
            cleanup();
        });

        it('should keep the span layers empty on a grid without sticky spans', () => {
            const { host, cleanup } = renderInto(baseConfig({ freezePane: { left: 2 } }));
            for (const inner of host.querySelectorAll('.pgrid-span-layer > div')) {
                equal(inner.children.length, 0);
            }
            cleanup();
        });
    });
});

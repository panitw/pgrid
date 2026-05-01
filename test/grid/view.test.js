import { equal, notEqual, deepEqual } from 'assert';
import sinon from 'sinon';
import { PGrid } from '../../src/grid/grid';

const baseConfig = (over = {}) => Object.assign({
    rowHeight: 30,
    columnWidth: 80,
    headerRowCount: 1,
    columns: [
        { field: 'a', title: 'A' },
        { field: 'b', title: 'B' },
        { field: 'c', title: 'C' }
    ],
    dataModel: {
        fields: ['a', 'b', 'c'],
        data: [
            { a: 'a0', b: 'b0', c: 'c0' },
            { a: 'a1', b: 'b1', c: 'c1' }
        ]
    }
}, over);

const renderInto = (config = baseConfig()) => {
    const grid = new PGrid(config);
    const host = document.createElement('div');
    document.body.appendChild(host);
    grid.render(host);
    return { grid, host, cleanup: () => document.body.removeChild(host) };
};

describe('View (jsdom render)', () => {

    describe('render skeleton', () => {

        let ctx;
        beforeEach(() => { ctx = renderInto(); });
        afterEach(() => ctx.cleanup());

        it('should mark the host element with the pgrid class', () => {
            equal(ctx.host.className, 'pgrid');
        });

        it('should populate the host with all six pane elements', () => {
            const panes = [
                '.pgrid-top-left-pane', '.pgrid-top-pane',
                '.pgrid-left-pane', '.pgrid-center-pane',
                '.pgrid-bottom-left-pane', '.pgrid-bottom-pane'
            ];
            for (const sel of panes) {
                notEqual(ctx.host.querySelector(sel), null, `missing ${sel}`);
            }
        });

        it('should populate the host with horizontal + vertical scrollbars', () => {
            notEqual(ctx.host.querySelector('.pgrid-hscroll'), null);
            notEqual(ctx.host.querySelector('.pgrid-vscroll'), null);
        });

        it('should expose the host via getElement', () => {
            equal(ctx.grid.view.getElement(), ctx.host);
        });

        it('should make the host focusable via tabIndex', () => {
            equal(ctx.host.tabIndex, 1);
        });
    });

    describe('cell rendering', () => {

        it('should render one cell per (row, column) pair with the correct dataset', () => {
            const { host, cleanup } = renderInto();
            const cell = host.querySelector('[data-row-index="1"][data-col-index="0"]');
            notEqual(cell, null);
            equal(cell.dataset.rowIndex, '1');
            equal(cell.dataset.colIndex, '0');
            cleanup();
        });

        it('should render header row data as the column titles', () => {
            const { host, cleanup } = renderInto();
            const headerCell = host.querySelector('[data-row-index="0"][data-col-index="0"]');
            equal(headerCell.firstChild.innerHTML, 'A');
            cleanup();
        });

        it('should render data-row cells as the underlying field value', () => {
            const { host, cleanup } = renderInto();
            const cell = host.querySelector('[data-row-index="1"][data-col-index="1"]');
            equal(cell.firstChild.innerHTML, 'b0');
            cleanup();
        });

        it('should give every cell the base pgrid-cell class', () => {
            const { host, cleanup } = renderInto();
            const cell = host.querySelector('[data-row-index="1"][data-col-index="0"]');
            equal(cell.classList.contains('pgrid-cell'), true);
            cleanup();
        });

        it('should apply column-level cssClass to rendered cells', () => {
            const config = baseConfig({
                columns: [
                    { field: 'a', title: 'A', cssClass: 'col-a' },
                    { field: 'b', title: 'B' },
                    { field: 'c', title: 'C' }
                ]
            });
            const { host, cleanup } = renderInto(config);
            const cell = host.querySelector('[data-row-index="1"][data-col-index="0"]');
            equal(cell.classList.contains('col-a'), true);
            cleanup();
        });

        it('should wrap cell text in a .pgrid-cell-content child', () => {
            const { host, cleanup } = renderInto();
            const cell = host.querySelector('[data-row-index="1"][data-col-index="0"]');
            equal(cell.firstChild.classList.contains('pgrid-cell-content'), true);
            cleanup();
        });

        it('should render cells for all data rows and all columns', () => {
            const { host, cleanup } = renderInto();
            // 1 header row + 2 data rows = 3 rows; 3 columns; 9 cells total.
            equal(host.querySelectorAll('.pgrid-cell').length, 9);
            cleanup();
        });
    });

    describe('extension hooks during render', () => {

        it('should call gridAfterRender exactly once after render', () => {
            const hook = { gridAfterRender: sinon.spy() };
            const { cleanup } = renderInto(baseConfig({ extensions: [hook] }));
            equal(hook.gridAfterRender.calledOnce, true);
            cleanup();
        });

        it('should call cellRender once per visible cell with row/col context', () => {
            const hook = { cellRender: sinon.spy() };
            const { cleanup } = renderInto(baseConfig({ extensions: [hook] }));
            equal(hook.cellRender.callCount, 9);
            const sample = hook.cellRender.firstCall.args[0];
            notEqual(sample.cell, undefined);
            notEqual(sample.cellContent, undefined);
            equal(typeof sample.rowIndex, 'number');
            equal(typeof sample.colIndex, 'number');
            cleanup();
        });

        it('should call cellAfterRender after cellRender for the same cell', () => {
            const order = [];
            const hook = {
                cellRender: (e) => order.push(['render', e.rowIndex, e.colIndex]),
                cellAfterRender: (e) => order.push(['after', e.rowIndex, e.colIndex])
            };
            const { cleanup } = renderInto(baseConfig({ extensions: [hook] }));
            // For row 1 col 0, render should appear before after.
            const renderIdx = order.findIndex(o => o[0] === 'render' && o[1] === 1 && o[2] === 0);
            const afterIdx = order.findIndex(o => o[0] === 'after' && o[1] === 1 && o[2] === 0);
            notEqual(renderIdx, -1);
            notEqual(afterIdx, -1);
            equal(renderIdx < afterIdx, true);
            cleanup();
        });

        it('should let cellRender mark a cell as handled to suppress default text', () => {
            const hook = {
                cellRender: (e) => {
                    e.cellContent.textContent = 'CUSTOM';
                    e.handled = true;
                }
            };
            const { host, cleanup } = renderInto(baseConfig({ extensions: [hook] }));
            const cell = host.querySelector('[data-row-index="1"][data-col-index="0"]');
            equal(cell.firstChild.textContent, 'CUSTOM');
            cleanup();
        });

        it('should let dataBeforeRender transform data before it reaches the cell', () => {
            const hook = {
                dataBeforeRender: (arg) => { arg.data = '[' + arg.data + ']'; }
            };
            const { host, cleanup } = renderInto(baseConfig({ extensions: [hook] }));
            const cell = host.querySelector('[data-row-index="1"][data-col-index="0"]');
            equal(cell.firstChild.innerHTML, '[a0]');
            cleanup();
        });
    });

    describe('updateCell', () => {

        it('should update an existing cell with the latest model data', () => {
            const { grid, host, cleanup } = renderInto();
            grid.data.setDataAt(0, 'a', 'NEW');
            grid.view.updateCell(1, 0);
            const cell = host.querySelector('[data-row-index="1"][data-col-index="0"]');
            equal(cell.firstChild.innerHTML, 'NEW');
            cleanup();
        });

        it('should fire cellAfterUpdate after updating', () => {
            const hook = { cellAfterUpdate: sinon.spy() };
            const { grid, cleanup } = renderInto(baseConfig({ extensions: [hook] }));
            hook.cellAfterUpdate.resetHistory();
            grid.data.setDataAt(0, 'a', 'NEW');
            grid.view.updateCell(1, 0);
            equal(hook.cellAfterUpdate.calledOnce, true);
            equal(hook.cellAfterUpdate.firstCall.args[0].data, 'NEW');
            cleanup();
        });
    });

    describe('reRender', () => {

        it('should clear all cells and re-render from scratch', () => {
            const { host, grid, cleanup } = renderInto();
            const before = host.querySelectorAll('.pgrid-cell').length;
            grid.view.reRender();
            const after = host.querySelectorAll('.pgrid-cell').length;
            equal(after, before);
            cleanup();
        });

        it('should pick up new data rows added between renders', () => {
            const { grid, host, cleanup } = renderInto();
            grid.data.addRow({ a: 'a2', b: 'b2', c: 'c2' });
            grid.view.reRender();
            const cell = host.querySelector('[data-row-index="3"][data-col-index="0"]');
            notEqual(cell, null);
            equal(cell.firstChild.innerHTML, 'a2');
            cleanup();
        });
    });

    describe('keyDown extension dispatch', () => {

        it('should forward keydown events on the host to the keyDown extension hook', () => {
            const hook = { keyDown: sinon.spy() };
            const { host, cleanup } = renderInto(baseConfig({ extensions: [hook] }));
            const evt = new KeyboardEvent('keydown', { keyCode: 40, bubbles: true });
            host.dispatchEvent(evt);
            equal(hook.keyDown.calledOnce, true);
            equal(hook.keyDown.firstCall.args[0].keyCode, 40);
            cleanup();
        });
    });
});

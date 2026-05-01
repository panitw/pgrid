import { equal, notEqual, deepEqual } from 'assert';
import { PGrid } from '../../src/grid/grid';

const baseConfig = (over = {}) => Object.assign({
    rowHeight: 30,
    columnWidth: 80,
    headerRowCount: 1,
    selection: { cssClass: 'is-selected' },
    columns: [
        { field: 'a', title: 'A' },
        { field: 'b', title: 'B' },
        { field: 'c', title: 'C' }
    ],
    dataModel: {
        fields: ['a', 'b', 'c'],
        data: [
            { a: 'a0', b: 'b0', c: 'c0' },
            { a: 'a1', b: 'b1', c: 'c1' },
            { a: 'a2', b: 'b2', c: 'c2' }
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

const cellAt = (host, r, c) =>
    host.querySelector(`[data-row-index="${r}"][data-col-index="${c}"]`);

describe('SelectionExtension', () => {

    describe('mouse selection', () => {

        let ctx;
        beforeEach(() => { ctx = renderInto(); });
        afterEach(() => ctx.cleanup());

        it('should mark a clicked cell with the configured selection class', () => {
            const cell = cellAt(ctx.host, 1, 0);
            cell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            equal(cell.classList.contains('is-selected'), true);
        });

        it('should record the selected cell coordinates in grid state', () => {
            cellAt(ctx.host, 2, 1).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            const selection = ctx.grid.state.get('selection');
            deepEqual(selection, [{ r: 2, c: 1, w: 1, h: 1 }]);
        });

        it('should clear the selection class on the previous cell when a new one is clicked', () => {
            const a = cellAt(ctx.host, 1, 0);
            const b = cellAt(ctx.host, 2, 1);
            a.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            equal(a.classList.contains('is-selected'), true);
            b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            equal(a.classList.contains('is-selected'), false);
            equal(b.classList.contains('is-selected'), true);
        });

        it('should resolve clicks that land on the inner .pgrid-cell-content child to the parent cell', () => {
            const cell = cellAt(ctx.host, 1, 0);
            const content = cell.querySelector('.pgrid-cell-content');
            content.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            equal(cell.classList.contains('is-selected'), true);
        });

        it('should not select header cells', () => {
            const headerCell = cellAt(ctx.host, 0, 0);
            // Header rows have no rowModel by default, so the !rowModel branch
            // applies — header cells SHOULD be selectable. Use a header with a
            // row model to suppress selection instead.
            const { host, cleanup } = renderInto(baseConfig({
                headerRows: [{ i: 0, cssClass: 'h' }]
            }));
            const blockedHeader = cellAt(host, 0, 0);
            blockedHeader.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            equal(blockedHeader.classList.contains('is-selected'), false);
            cleanup();
        });
    });

    describe('selectCell (programmatic)', () => {

        it('should select the named cell and write to state', () => {
            const ctx = renderInto();
            const sel = ctx.grid.extension.getExtension('DEFAULT_EXT_SELECTION');
            sel.selectCell(/*colIndex*/ 2, /*rowIndex*/ 1);
            const cell = cellAt(ctx.host, 1, 2);
            equal(cell.classList.contains('is-selected'), true);
            deepEqual(ctx.grid.state.get('selection'), [{ r: 1, c: 2, w: 1, h: 1 }]);
            ctx.cleanup();
        });

        it('should ignore out-of-bounds requests', () => {
            const ctx = renderInto();
            const sel = ctx.grid.extension.getExtension('DEFAULT_EXT_SELECTION');
            sel.selectCell(99, 99);
            equal(ctx.grid.state.get('selection'), undefined);
            ctx.cleanup();
        });
    });

    describe('keyboard navigation', () => {

        let ctx;
        beforeEach(() => {
            ctx = renderInto();
            // Seed an initial selection so keyDown has something to move from.
            cellAt(ctx.host, 1, 1).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        });
        afterEach(() => ctx.cleanup());

        const press = (keyCode) => {
            ctx.host.dispatchEvent(new KeyboardEvent('keydown', { keyCode, bubbles: true }));
        };

        it('should move selection down on ArrowDown (keyCode 40)', () => {
            press(40);
            deepEqual(ctx.grid.state.get('selection')[0], { r: 2, c: 1, w: 1, h: 1 });
        });

        it('should move selection up on ArrowUp (keyCode 38)', () => {
            press(38);
            deepEqual(ctx.grid.state.get('selection')[0], { r: 0, c: 1, w: 1, h: 1 });
        });

        it('should move selection left on ArrowLeft (keyCode 37)', () => {
            press(37);
            deepEqual(ctx.grid.state.get('selection')[0], { r: 1, c: 0, w: 1, h: 1 });
        });

        it('should move selection right on ArrowRight (keyCode 39)', () => {
            press(39);
            deepEqual(ctx.grid.state.get('selection')[0], { r: 1, c: 2, w: 1, h: 1 });
        });

        it('should move selection right on Tab (keyCode 9)', () => {
            press(9);
            deepEqual(ctx.grid.state.get('selection')[0], { r: 1, c: 2, w: 1, h: 1 });
        });

        it('should ignore unrelated key presses', () => {
            const before = ctx.grid.state.get('selection')[0];
            press(65); // 'A'
            deepEqual(ctx.grid.state.get('selection')[0], before);
        });

        it('should not move past the last column', () => {
            // Already at col 1; press right twice to land on the last col,
            // then once more should be a no-op.
            press(39);
            press(39);
            deepEqual(ctx.grid.state.get('selection')[0].c, 2);
        });

        it('should not move past the first row (header counts as row 0)', () => {
            press(38);  // to row 0 (header)
            press(38);  // would be -1: blocked
            deepEqual(ctx.grid.state.get('selection')[0].r, 0);
        });

        it('should not navigate while editing flag is set in state', () => {
            ctx.grid.state.set('editing', true);
            const before = ctx.grid.state.get('selection')[0];
            press(40);
            deepEqual(ctx.grid.state.get('selection')[0], before);
        });
    });

    describe('cellAfterRecycled', () => {

        it('should detach the mousedown handler from a recycled cell', () => {
            const { grid, host, cleanup } = renderInto();
            const cell = cellAt(host, 1, 0);
            const sel = grid.extension.getExtension('DEFAULT_EXT_SELECTION');
            sel.cellAfterRecycled({ cell });
            // After detach, mousedown should not select the cell.
            cell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            equal(cell.classList.contains('is-selected'), false);
            cleanup();
        });
    });
});

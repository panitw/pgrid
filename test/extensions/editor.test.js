import { equal, notEqual, deepEqual } from 'assert';
import { PGrid } from '../../src/grid/grid';

const baseConfig = (over = {}) => Object.assign({
    rowHeight: 30,
    columnWidth: 80,
    headerRowCount: 1,
    selection: { cssClass: 'is-selected' },
    editing: true,
    columns: [
        { field: 'a', title: 'A', editable: true },
        { field: 'b', title: 'B', editable: true },
        { field: 'c', title: 'C', editable: true },
        { field: 'd', title: 'D', editable: true }
    ],
    dataModel: {
        fields: ['a', 'b', 'c', 'd'],
        data: [
            { a: 'a0', b: 'b0', c: 'c0', d: 'd0' },
            { a: 'a1', b: 'b1', c: 'c1', d: 'd1' }
        ]
    }
}, over);

const renderInto = (config = baseConfig()) => {
    const grid = new PGrid(config);
    const host = document.createElement('div');
    document.body.appendChild(host);
    grid.render(host);
    return {
        grid, host,
        cleanup: () => {
            document.body.removeChild(host);
            const stray = document.querySelector('.pgrid-cell-text-editor');
            if (stray && stray.parentElement && stray.parentElement.parentElement) {
                stray.parentElement.parentElement.removeChild(stray.parentElement);
            }
        }
    };
};

const cellAt = (host, r, c) =>
    host.querySelector(`[data-row-index="${r}"][data-col-index="${c}"]`);

const editorInput = () => document.querySelector('.pgrid-cell-text-editor');

const openEditor = (host, r, c) => {
    cellAt(host, r, c).dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    return editorInput();
};

const pressInEditor = (input, keyCode) =>
    input.dispatchEvent(new KeyboardEvent('keydown', { keyCode, bubbles: true }));

describe('EditorExtension', () => {

    describe('editing a plain cell', () => {

        let ctx;
        beforeEach(() => { ctx = renderInto(); });
        afterEach(() => ctx.cleanup());

        it('should open an editor on double click', () => {
            const input = openEditor(ctx.host, 1, 1);
            notEqual(input, null);
            equal(input.value, 'b0');
            equal(ctx.grid.state.get('editing'), true);
        });

        it('should write the edited value back on Enter', () => {
            const input = openEditor(ctx.host, 1, 1);
            input.value = 'edited';
            pressInEditor(input, 13);
            equal(ctx.grid.data.getDataAt(0, 'b'), 'edited');
            equal(editorInput(), null);
        });

        it('should advance one column on Tab', () => {
            const input = openEditor(ctx.host, 1, 0);
            pressInEditor(input, 9);
            deepEqual(ctx.grid.state.get('selection')[0], { r: 1, c: 1, w: 1, h: 1 });
        });
    });

    describe('editing a spanned cell', () => {

        // `cells[].r` is a DATA row index: data row 0 is view row 1. The span
        // anchored at column 1 covers columns 1 and 2.
        const spanCtx = () => renderInto(baseConfig({
            cells: [{ r: 0, c: 1, colspan: 2 }]
        }));

        let ctx;
        beforeEach(() => { ctx = spanCtx(); });
        afterEach(() => ctx.cleanup());

        it('should open an editor over the spanning cell', () => {
            const input = openEditor(ctx.host, 1, 1);
            notEqual(input, null);
            // The anchor column's field, not a covered column's.
            equal(input.value, 'b0');
        });

        it('should write the anchor column field on Enter', () => {
            const input = openEditor(ctx.host, 1, 1);
            input.value = 'merged';
            pressInEditor(input, 13);
            equal(ctx.grid.data.getDataAt(0, 'b'), 'merged');
            equal(ctx.grid.data.getDataAt(0, 'c'), 'c0');
        });

        it('should land Tab on the first column after the span', () => {
            const input = openEditor(ctx.host, 1, 1);
            pressInEditor(input, 9);
            // Column 2 is covered; the next cell is column 3.
            deepEqual(ctx.grid.state.get('selection')[0], { r: 1, c: 3, w: 1, h: 1 });
            equal(cellAt(ctx.host, 1, 3).classList.contains('is-selected'), true);
        });

        it('should still advance one column at a time on an unspanned row', () => {
            const input = openEditor(ctx.host, 2, 1);
            pressInEditor(input, 9);
            deepEqual(ctx.grid.state.get('selection')[0], { r: 2, c: 2, w: 1, h: 1 });
        });

        it('should repaint the spanning cell after the edit', () => {
            const input = openEditor(ctx.host, 1, 1);
            input.value = 'repainted';
            pressInEditor(input, 13);
            equal(cellAt(ctx.host, 1, 1).firstChild.innerHTML, 'repainted');
        });
    });
});

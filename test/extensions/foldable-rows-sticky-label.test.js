import { equal, notEqual, deepEqual, ok } from 'assert';
import { PGrid } from '../../src/grid/grid';

// A group label that starts in the frozen block (stickyLabel, on by default)
// reads across the whole visible width instead of clipping at the frozen
// boundary, and group rows take no selection unless selectableGroupRows.

const FIELDS = ['sel', 'line', 'status', 'doc', 'project', 'desc'];

// 30 records over 10 projects (3 each), project names long enough that the
// old clamp would have cut them at the 120px frozen boundary.
const RECORDS = () => {
    const out = [];
    for (let i = 0; i < 30; i++) {
        const p = i % 10;
        out.push({
            sel: '', line: String(i), status: 'OPEN', doc: 'PR-' + i,
            project: '18.6000' + p + ' - a fairly long project name ' + p,
            owner: 'owner' + (i % 2),
            desc: 'desc ' + i
        });
    }
    return out;
};

// Mirrors the consumer: select box + Line No. frozen, label at the left edge.
const consumerConfig = (over = {}) => {
    const foldableRows = Object.assign({
        groupBy: ['project'],
        collapsedByDefault: false,
        showCount: false,
        gutterWidth: 40,
        labelColumn: 0
    }, over.foldableRows || {});
    return Object.assign({
        rowHeight: 30,
        columnWidth: 100,
        headerRowCount: 1,
        freezePane: { left: 2 },
        columns: [
            { field: 'sel', title: '', width: 40 },
            { field: 'line', title: 'Line No.', width: 80 },
            { field: 'status', title: 'Status' },
            { field: 'doc', title: 'Document No.' },
            { field: 'project', title: 'Project' },
            { field: 'desc', title: 'Description' }
        ],
        dataModel: { fields: FIELDS.concat(['owner']), data: RECORDS() }
    }, over, { foldableRows });
};

const render = (config) => {
    const grid = new PGrid(config);
    const host = document.createElement('div');
    document.body.appendChild(host);
    grid.render(host);
    const ext = grid.extension.getExtension('DEFAULT_EXT_FOLDABLE_ROWS');
    return { grid, ext, host, cleanup: () => document.body.removeChild(host) };
};

// Pin the body panes to 90px (three rows) so vertical virtualization recycles.
const renderVirtualized = (config) => {
    const ctx = render(config);
    for (const sel of ['.pgrid-left-pane', '.pgrid-center-pane']) {
        ctx.host.querySelector(sel)._mockOffsetHeight = 90;
    }
    Object.defineProperty(ctx.host.querySelector('.pgrid-left-inner'), 'clientHeight', { get: () => 5000 });
    ctx.grid.view.reRender();
    return ctx;
};

const cellAt = (host, r, c) =>
    host.querySelector(`[data-row-index="${r}"][data-col-index="${c}"]`);

const groupRowIndex = (grid, path) => {
    const key = JSON.stringify(path);
    for (let i = 0; i < grid.model.getRowCount(); i++) {
        const meta = grid.model.getRowMeta(i);
        if (meta.kind === 'group' && JSON.stringify(meta.path) === key) {
            return i;
        }
    }
    return -1;
};

const projectName = (p) => '18.6000' + p + ' - a fairly long project name ' + p;

const liveLabels = (host) =>
    Array.prototype.filter.call(host.querySelectorAll('.pgrid-group-label'),
        (cell) => cell.style.display !== 'none');

const scrollY = (host, y) => {
    const bar = host.querySelector('.pgrid-vscroll');
    bar.scrollTop = y;
    bar.dispatchEvent(new window.Event('scroll'));
};

const scrollX = (host, x) => {
    const bar = host.querySelector('.pgrid-hscroll');
    bar.scrollLeft = x;
    bar.dispatchEvent(new window.Event('scroll'));
};

// Every live label must sit on a group row, carry that row's label, and be the
// only label for it; every live cell in the span layer must be such a label.
const assertLabelsConsistent = (ctx) => {
    const seen = {};
    for (const cell of liveLabels(ctx.host)) {
        const r = parseInt(cell.dataset.rowIndex, 10);
        const meta = ctx.grid.model.getRowMeta(r);
        equal(meta.kind, 'group', 'label on a non-group row ' + r);
        equal(cell.textContent, meta.label);
        equal(seen[r], undefined, 'duplicate label for row ' + r);
        seen[r] = true;
    }
    for (const cell of ctx.host.querySelectorAll('.pgrid-body-span-inner > .pgrid-cell')) {
        if (cell.style.display === 'none') {
            continue;
        }
        ok(cell.classList.contains('pgrid-group-label'), 'non-label cell in the span layer');
    }
    for (const cell of ctx.host.querySelectorAll('.pgrid-left-inner > .pgrid-cell, .pgrid-center-inner > .pgrid-cell')) {
        if (cell.style.display === 'none') {
            continue;
        }
        equal(cell.classList.contains('pgrid-cell-sticky-span'), false, 'sticky cell left in a pane');
        equal(cell.classList.contains('pgrid-group-label'), false, 'group label left in a pane');
    }
    return Object.keys(seen).length;
};

describe('FoldableRowsExtension — sticky group label', () => {

    describe('freezePane.left 2 + labelColumn 0', () => {

        let ctx;
        beforeEach(() => { ctx = render(consumerConfig()); });
        afterEach(() => ctx.cleanup());

        it('should show the full label, starting after the gutter', () => {
            const groupRow = groupRowIndex(ctx.grid, [projectName(0)]);
            // Gutter (col 0) + host label column 0 -> col 1.
            const label = cellAt(ctx.host, groupRow, 1);
            equal(label.textContent, projectName(0));
            equal(label.style.left, '40px');
            ok(label.classList.contains('pgrid-group-label'));
            ok(label.classList.contains('pgrid-group-row'));
            notEqual(label.querySelector('.pgrid-cell-content'), null);
        });

        it('should not clip the label at the frozen boundary', () => {
            const groupRow = groupRowIndex(ctx.grid, [projectName(0)]);
            const label = cellAt(ctx.host, groupRow, 1);
            // Not 80px (the two frozen host columns after the gutter): it runs
            // to the right edge of the span layer, which covers both panes.
            equal(label.style.width, 'calc(100% - 40px)');
            equal(label.parentElement.className, 'pgrid-body-span-inner');
            const layer = ctx.host.querySelector('.pgrid-body-span-layer');
            equal(layer.style.left, '0px');
            equal(layer.style.width, '100%');
            // ...capped at the grid's own columns: 40 + 40 + 80 + 4 x 100.
            equal(layer.style.maxWidth, '560px');
        });

        it('should keep the chevron in the frozen gutter and clickable', () => {
            const groupRow = groupRowIndex(ctx.grid, [projectName(0)]);
            const gutter = cellAt(ctx.host, groupRow, 0);
            equal(gutter.parentElement.className, 'pgrid-left-inner');
            gutter.querySelector('.pgrid-group-chevron')
                .dispatchEvent(new MouseEvent('click', { bubbles: true }));
            equal(ctx.ext.isCollapsed([projectName(0)]), true);
        });

        it('should hold still while the grid scrolls horizontally', () => {
            const groupRow = groupRowIndex(ctx.grid, [projectName(0)]);
            const label = cellAt(ctx.host, groupRow, 1);
            scrollX(ctx.host, 150);
            equal(ctx.grid.view.getScrollX(), 150);
            equal(ctx.host.querySelector('.pgrid-body-span-layer').scrollLeft, 0);
            equal(cellAt(ctx.host, groupRow, 1), label);
            equal(label.style.left, '40px');
            equal(label.style.width, 'calc(100% - 40px)');
        });

        it('should leave the record rows in their panes', () => {
            const recordRow = ctx.grid.model.getRowIndex(ctx.grid.data.getRowId(0));
            equal(cellAt(ctx.host, recordRow, 1).parentElement.className, 'pgrid-left-inner');
            equal(cellAt(ctx.host, recordRow, 3).parentElement.className, 'pgrid-center-inner');
            equal(cellAt(ctx.host, recordRow, 1).style.width, '40px');
        });

        it('should keep the model span clamped to the frozen block', () => {
            const groupRow = groupRowIndex(ctx.grid, [projectName(0)]);
            equal(ctx.grid.model.getColumnSpan(groupRow, 1), 2);
            equal(ctx.grid.model.isStickySpan(groupRow, 1), true);
        });
    });

    describe('label options are preserved', () => {

        it('should apply groupLabel, showCount, emptyLabel, per-level indent and groupRowHeight', () => {
            const ctx = render(consumerConfig({
                foldableRows: {
                    groupBy: ['project', 'owner'],
                    showCount: true,
                    indentSize: 20,
                    groupRowHeight: 36,
                    groupLabel: (value, path) => path.length === 1 ? 'P: ' + value : value
                }
            }));
            const outer = groupRowIndex(ctx.grid, [projectName(0)]);
            const inner = groupRowIndex(ctx.grid, [projectName(0), 'owner0']);
            const outerLabel = cellAt(ctx.host, outer, 1);
            const innerLabel = cellAt(ctx.host, inner, 1);
            equal(outerLabel.textContent, 'P: ' + projectName(0) + ' (3)');
            equal(innerLabel.textContent, 'owner0 (3)');
            equal(outerLabel.firstChild.style.paddingLeft, '5px');
            equal(innerLabel.firstChild.style.paddingLeft, '25px');
            equal(outerLabel.style.height, '36px');
            ok(innerLabel.classList.contains('pgrid-cell-sticky-span'));
            ctx.cleanup();
        });

        it('should render emptyLabel for an empty group value', () => {
            const config = consumerConfig({ foldableRows: { emptyLabel: '(no project)' } });
            config.dataModel.data[0].project = null;
            const ctx = render(config);
            const groupRow = groupRowIndex(ctx.grid, [null]);
            equal(cellAt(ctx.host, groupRow, 1).textContent, '(no project)');
            ctx.cleanup();
        });
    });

    describe('vertical scroll, recycling, fold and setGroupBy', () => {

        let ctx;
        beforeEach(() => { ctx = renderVirtualized(consumerConfig()); });
        afterEach(() => ctx.cleanup());

        it('should only render labels for the rows in view', () => {
            // Rows 1-3 in view: group, record, record.
            equal(assertLabelsConsistent(ctx), 1);
        });

        it('should scroll the span layer in lockstep with the frozen pane', () => {
            scrollY(ctx.host, 240);
            equal(ctx.grid.view.getScrollY(), 240);
            equal(ctx.host.querySelector('.pgrid-body-span-layer').scrollTop, 240);
            equal(ctx.host.querySelector('.pgrid-left-pane').scrollTop, 240);
            // The layer content is exactly as tall as the frozen pane content.
            equal(ctx.host.querySelector('.pgrid-body-span-inner').style.height,
                ctx.host.querySelector('.pgrid-left-inner').style.height);
        });

        it('should leave no stale or duplicated label after scrolling through', () => {
            for (let y = 0; y <= 1100; y += 30) {
                scrollY(ctx.host, y);
                assertLabelsConsistent(ctx);
            }
            for (let y = 1100; y >= 0; y -= 90) {
                scrollY(ctx.host, y);
                assertLabelsConsistent(ctx);
            }
        });

        it('should show the label of a group row scrolled into view', () => {
            // Group rows sit every 4th row: 1, 5, 9, ... Row 9 is pane y 240.
            scrollY(ctx.host, 240);
            const groupRow = groupRowIndex(ctx.grid, [projectName(2)]);
            equal(groupRow, 9);
            const label = cellAt(ctx.host, groupRow, 1);
            equal(label.textContent, projectName(2));
            equal(label.parentElement.className, 'pgrid-body-span-inner');
            equal(label.style.top, '240px');
        });

        it('should stay correct through fold and unfold', () => {
            scrollY(ctx.host, 120);
            ctx.ext.collapse([projectName(1)]);
            assertLabelsConsistent(ctx);
            ctx.ext.collapseAll();
            scrollY(ctx.host, 60);
            // Pane y 60..150 with inclusive edges: five collapsed group rows.
            equal(assertLabelsConsistent(ctx), 5);
            ctx.ext.expandAll();
            scrollY(ctx.host, 300);
            assertLabelsConsistent(ctx);
        });

        it('should stay correct through setGroupBy', () => {
            scrollY(ctx.host, 120);
            ctx.ext.setGroupBy(['owner']);
            scrollY(ctx.host, 0);
            equal(assertLabelsConsistent(ctx), 1);
            equal(cellAt(ctx.host, 1, 1).textContent, 'owner0');
            ctx.ext.setGroupBy([]);
            equal(assertLabelsConsistent(ctx), 0);
            equal(ctx.host.querySelectorAll('.pgrid-cell-sticky-span').length, 0);
            ctx.ext.setGroupBy(['project']);
            scrollY(ctx.host, 240);
            assertLabelsConsistent(ctx);
            equal(cellAt(ctx.host, 9, 1).textContent, projectName(2));
        });
    });

    describe('unchanged behaviour', () => {

        it('should clamp as before with stickyLabel: false', () => {
            const ctx = render(consumerConfig({ foldableRows: { stickyLabel: false } }));
            const groupRow = groupRowIndex(ctx.grid, [projectName(0)]);
            const label = cellAt(ctx.host, groupRow, 1);
            equal(label.parentElement.className, 'pgrid-left-inner');
            equal(label.style.width, '120px');
            equal(label.classList.contains('pgrid-cell-sticky-span'), false);
            ctx.cleanup();
        });

        it('should keep a label in the scrolling band in the scrolling pane', () => {
            const ctx = render(consumerConfig({ foldableRows: { labelColumn: 2 } }));
            const groupRow = groupRowIndex(ctx.grid, [projectName(0)]);
            const label = cellAt(ctx.host, groupRow, 3);
            equal(label.parentElement.className, 'pgrid-center-inner');
            equal(label.style.width, '400px');
            equal(ctx.grid.model.isStickySpan(groupRow, 3), false);
            ctx.cleanup();
        });

        it('should keep the label in the scrolling pane when the host froze nothing', () => {
            const ctx = render(consumerConfig({ freezePane: undefined }));
            const groupRow = groupRowIndex(ctx.grid, [projectName(0)]);
            const label = cellAt(ctx.host, groupRow, 1);
            equal(label.parentElement.className, 'pgrid-center-inner');
            equal(label.style.width, '520px');
            ctx.cleanup();
        });
    });
});

describe('FoldableRowsExtension — group rows take no selection', () => {

    const selectConfig = (over = {}) => consumerConfig(Object.assign({ selection: {} }, over));
    const mouseDown = (cell) => cell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    const press = (host, keyCode) =>
        host.dispatchEvent(new KeyboardEvent('keydown', { keyCode, bubbles: true }));
    const selection = (grid) => grid.state.get('selection');

    it('should not select any cell of a group row on mousedown', () => {
        // labelColumn 1: host column 0 stays an empty frozen cell beside the label.
        const ctx = render(selectConfig({ foldableRows: { labelColumn: 1 } }));
        const groupRow = groupRowIndex(ctx.grid, [projectName(0)]);
        for (const c of [0, 1, 2, 3, 4]) {
            const cell = cellAt(ctx.host, groupRow, c);
            notEqual(cell, null, 'col ' + c);
            mouseDown(cell);
        }
        const sel = selection(ctx.grid);
        ok(!sel || sel.length === 0);
        equal(ctx.host.querySelectorAll('.pgrid-cell-selection').length, 0);
        ctx.cleanup();
    });

    it('should still select a record cell', () => {
        const ctx = render(selectConfig());
        const recordRow = ctx.grid.model.getRowIndex(ctx.grid.data.getRowId(0));
        mouseDown(cellAt(ctx.host, recordRow, 2));
        deepEqual(selection(ctx.grid)[0], { r: recordRow, c: 2, w: 1, h: 1 });
        ctx.cleanup();
    });

    it('should step over group rows with the arrow keys', () => {
        const ctx = render(selectConfig());
        // Rows: 1 group, 2-4 records, 5 group, 6-8 records.
        mouseDown(cellAt(ctx.host, 4, 2));
        press(ctx.host, 40);
        equal(selection(ctx.grid)[0].r, 6);
        press(ctx.host, 38);
        equal(selection(ctx.grid)[0].r, 4);
        ctx.cleanup();
    });

    it('should never land on a group row moving up', () => {
        const ctx = render(selectConfig());
        mouseDown(cellAt(ctx.host, 2, 2));
        press(ctx.host, 38);
        // Row 1 is the group row; it is stepped over (to the header row,
        // which has always been selectable when it carries no row model).
        notEqual(selection(ctx.grid)[0].r, 1);
        equal(selection(ctx.grid)[0].r, 0);
        ctx.cleanup();
    });

    it('should ignore selectCell on a group row', () => {
        const ctx = render(selectConfig());
        const sel = ctx.grid.extension.getExtension('DEFAULT_EXT_SELECTION');
        sel.selectCell(2, 1);
        const state = selection(ctx.grid);
        ok(!state || state.length === 0);
        ctx.cleanup();
    });

    it('should drop the selection when its record is folded away', () => {
        const ctx = render(selectConfig());
        mouseDown(cellAt(ctx.host, 2, 2));
        ctx.ext.collapse([projectName(0)]);
        equal(selection(ctx.grid).length, 0);
        equal(ctx.host.querySelectorAll('.pgrid-cell-selection').length, 0);
        ctx.cleanup();
    });

    it('should let selectableGroupRows: true opt back in', () => {
        const ctx = render(selectConfig({ foldableRows: { selectableGroupRows: true } }));
        const groupRow = groupRowIndex(ctx.grid, [projectName(0)]);
        mouseDown(cellAt(ctx.host, groupRow, 1));
        equal(selection(ctx.grid)[0].r, groupRow);
        ctx.cleanup();
    });
});

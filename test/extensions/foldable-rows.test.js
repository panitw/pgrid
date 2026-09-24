import { equal, notEqual, deepEqual, ok, throws, doesNotThrow } from 'assert';
import sinon from 'sinon';
import { PGrid } from '../../src/grid/grid';
import { FoldableRowsExtension } from '../../src/extensions/foldable-rows';

const ROWS = () => ([
    { name: 'r0', department: 'Eng', location: 'SF' },
    { name: 'r1', department: 'Eng', location: 'Berlin' },
    { name: 'r2', department: 'Design', location: 'SF' },
    { name: 'r3', department: 'Eng', location: 'SF' },
    { name: 'r4', department: 'Design', location: 'Berlin' }
]);

const baseConfig = (over = {}) => Object.assign({
    rowHeight: 30,
    columnWidth: 80,
    headerRowCount: 1,
    columns: [
        { field: 'name', title: 'Name' },
        { field: 'department', title: 'Dept' },
        { field: 'location', title: 'Loc' }
    ],
    dataModel: {
        fields: ['name', 'department', 'location'],
        data: ROWS()
    }
}, over);

const build = (over = {}) => {
    const grid = new PGrid(baseConfig(over));
    return { grid, ext: grid.extension.getExtension('DEFAULT_EXT_FOLDABLE_ROWS') };
};

const render = (over = {}) => {
    const { grid, ext } = build(over);
    const host = document.createElement('div');
    document.body.appendChild(host);
    grid.render(host);
    return { grid, ext, host, cleanup: () => document.body.removeChild(host) };
};

const cellAt = (host, r, c) =>
    host.querySelector(`[data-row-index="${r}"][data-col-index="${c}"]`);

// The visible row index of a group, given its path.
const groupRowIndex = (grid, ext, path) => {
    const key = JSON.stringify(path);
    const count = grid.model.getRowCount();
    for (let i = 0; i < count; i++) {
        const meta = grid.model.getRowMeta(i);
        if (meta.kind === 'group' && JSON.stringify(meta.path) === key) {
            return i;
        }
    }
    return -1;
};

// Every record the grid is currently showing, in visible order.
const visibleRecords = (grid) => {
    const out = [];
    const count = grid.model.getRowCount();
    for (let i = 0; i < count; i++) {
        if (grid.model.getRowMeta(i).kind === 'data') {
            out.push(grid.model.getRowDataAt(i).name);
        }
    }
    return out;
};

describe('FoldableRowsExtension', () => {

    describe('loading', () => {

        it('should be reachable under DEFAULT_EXT_FOLDABLE_ROWS', () => {
            const { ext } = build({ foldableRows: { groupBy: 'department' } });
            ok(ext instanceof FoldableRowsExtension);
        });

        it('should install a row projection on the model', () => {
            const { grid } = build({ foldableRows: { groupBy: 'department' } });
            notEqual(grid.model.getRowProjection(), null);
        });

        it('should leave the model alone when the toggle is absent', () => {
            const grid = new PGrid(baseConfig());
            equal(grid.model.getRowProjection(), null);
            equal(grid.model.getColumnCount(), 3);
            equal(grid.model.getRowCount(), 1 + 5);
        });
    });

    //------------------------------------------------------------------
    // configure() must not disturb a grid it has nothing to do
    //------------------------------------------------------------------
    describe('inert configurations', () => {

        it('should inject nothing when there is no groupBy to act on', () => {
            const cells = [{ c: 0, r: 0, cssClass: 'authored' }];
            const grid = new PGrid(baseConfig({
                cells,
                freezePane: { left: 1 },
                foldableRows: true
            }));
            equal(grid.model.getColumnCount(), 3);
            equal(grid.model.getColumnField(0), 'name');
            equal(grid.model.getColumnIndex('name'), 0);
            // Nothing renumbered: the authored cell still addresses column 0.
            equal(grid.model.getCellModel(1, 0).cssClass, 'authored');
            equal(grid.model.getLeftFreezeRows(), 1);
            equal(grid.model.getRowCount(), 1 + 5);
        });

        it('should inject nothing for an explicitly empty groupBy', () => {
            const grid = new PGrid(baseConfig({ foldableRows: { groupBy: [] } }));
            equal(grid.model.getColumnCount(), 3);
            equal(grid.model.getLeftFreezeRows(), 0);
        });

        it('should inject nothing for a bare instance passed via config.extensions', () => {
            // No config.foldableRows at all — the instance has nothing to group by
            // and must not leave a dead gutter behind.
            const headerCells = [{ c: 2, r: 0, cssClass: 'authored-header' }];
            const grid = new PGrid(baseConfig({
                headerCells,
                extensions: [new FoldableRowsExtension()]
            }));
            equal(grid.model.getColumnCount(), 3);
            equal(grid.model.getCellModel(0, 2).cssClass, 'authored-header');
            equal(grid.model.getLeftFreezeRows(), 0);
        });

        it('should let the first instance own the gutter and the projection', () => {
            // config.foldableRows loads a built-in; a second hand-built instance
            // must not inject a second gutter or steal the row projection.
            const stray = new FoldableRowsExtension();
            const grid = new PGrid(baseConfig({
                foldableRows: { groupBy: 'department' },
                extensions: [stray]
            }));
            const owner = grid.extension.getExtension('DEFAULT_EXT_FOLDABLE_ROWS');

            // Exactly one gutter.
            equal(grid.model.getColumnCount(), 4);
            equal(grid.model.getColumnModel(0).cssClass, 'pgrid-group-gutter');
            notEqual(grid.model.getColumnModel(1).cssClass, 'pgrid-group-gutter');
            equal(grid.model.getLeftFreezeRows(), 1);

            // The Model holds the owner's projection, so the reachable extension
            // is the one that actually drives the grid.
            equal(grid.model.getRowCount(), 1 + 7);
            owner.collapse(['Eng']);
            equal(grid.model.getRowCount(), 1 + 4);

            // The duplicate never entered the registry.
            equal(stray.init, undefined);
            equal(stray.cellRender, undefined);
            equal(stray.keyDown, undefined);
        });
    });

    //------------------------------------------------------------------
    // CAP-8 — gutter injection and index compensation
    //------------------------------------------------------------------
    describe('gutter column injection', () => {

        it('should add one leading gutter column on top of every declared column', () => {
            const { grid } = build({ foldableRows: { groupBy: 'department' } });
            equal(grid.model.getColumnCount(), 4);
            const gutter = grid.model.getColumnModel(0);
            equal(gutter.cssClass, 'pgrid-group-gutter');
            equal(gutter.field, undefined);
            equal(gutter.editable, false);
            equal(gutter.resizable, false);
        });

        it('should give the gutter the configured width', () => {
            const { grid } = build({ foldableRows: { groupBy: 'department', gutterWidth: 44 } });
            equal(grid.model.getColumnWidth(0), 44);
        });

        it('should default the gutter width to 28', () => {
            const { grid } = build({ foldableRows: { groupBy: 'department' } });
            equal(grid.model.getColumnWidth(0), 28);
        });

        it('should shift every declared column by one', () => {
            const { grid } = build({ foldableRows: { groupBy: 'department' } });
            equal(grid.model.getColumnField(1), 'name');
            equal(grid.model.getColumnField(3), 'location');
            equal(grid.model.getColumnIndex('name'), 1);
            equal(grid.model.getColumnIndex('location'), 3);
        });

        it('should render nothing in the gutter for record rows', () => {
            const ctx = render({ foldableRows: { groupBy: 'department' } });
            const recordRow = ctx.grid.model.getRowIndex(ctx.grid.data.getRowId(0));
            equal(cellAt(ctx.host, recordRow, 0).textContent, '');
            ctx.cleanup();
        });

        it('should compensate explicit columns[].i', () => {
            const { grid } = build({
                columns: [
                    { i: 2, field: 'location', title: 'Loc' },
                    { i: 0, field: 'name', title: 'Name' },
                    { i: 1, field: 'department', title: 'Dept' }
                ],
                foldableRows: { groupBy: 'department' }
            });
            equal(grid.model.getColumnModel(0).cssClass, 'pgrid-group-gutter');
            equal(grid.model.getColumnModel(1).field, 'name');
            equal(grid.model.getColumnModel(2).field, 'department');
            equal(grid.model.getColumnModel(3).field, 'location');
        });

        it('should compensate cells[].c so it still addresses the authored column', () => {
            const { grid, ext } = build({
                cells: [{ c: 0, r: 0, cssClass: 'authored-for-name' }],
                foldableRows: { groupBy: 'department' }
            });
            // Data row 0 is r0; find where the projection put it.
            const viewRow = grid.model.getRowIndex(grid.data.getRowId(0));
            equal(grid.model.getCellModel(viewRow, 1).cssClass, 'authored-for-name');
            equal(grid.model.getCellModel(viewRow, 0), undefined);
        });

        it('should compensate headerCells[].c', () => {
            const { grid } = build({
                headerCells: [{ c: 1, r: 0, cssClass: 'authored-for-dept' }],
                foldableRows: { groupBy: 'department' }
            });
            equal(grid.model.getCellModel(0, 2).cssClass, 'authored-for-dept');
        });

        it('should freeze the gutter alongside whatever the host froze', () => {
            const { grid } = build({
                freezePane: { left: 1 },
                foldableRows: { groupBy: 'department', gutterWidth: 20 }
            });
            equal(grid.model.getLeftFreezeRows(), 2);
            equal(grid.model.getLeftFreezeSize(), 20 + 80);
        });

        it('should freeze the gutter even when the host froze nothing', () => {
            // Unfrozen, the gutter would live in the horizontally scrolling
            // centre pane and the chevrons would scroll out of reach.
            const { grid } = build({
                freezePane: { top: 1 },
                foldableRows: { groupBy: 'department', gutterWidth: 20 }
            });
            equal(grid.model.getLeftFreezeRows(), 1);
            equal(grid.model.getLeftFreezeSize(), 20);
            // The host's own freezePane.top survives.
            equal(grid.model.getTopFreezeRows(), 1 + 1);
        });

        it('should freeze the gutter when the host declared no freezePane at all', () => {
            const { grid } = build({ foldableRows: { groupBy: 'department' } });
            equal(grid.model.getLeftFreezeRows(), 1);
        });

        it('should keep labelColumn authored in host numbering', () => {
            const ctx = render({ foldableRows: { groupBy: 'department', labelColumn: 1 } });
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            // labelColumn 1 = the host's second column = index 2 post-injection.
            equal(cellAt(ctx.host, groupRow, 2).textContent, 'Eng (3)');
            equal(cellAt(ctx.host, groupRow, 1).textContent, '');
            ctx.cleanup();
        });

        it('should not mutate the caller\'s own config objects', () => {
            const cells = [{ c: 0, r: 0, cssClass: 'x' }];
            const headerCells = [{ c: 1, r: 0, cssClass: 'y' }];
            const columns = [
                { i: 0, field: 'name' },
                { i: 1, field: 'department' },
                { i: 2, field: 'location' }
            ];
            const freezePane = { left: 1 };
            new PGrid(baseConfig({ cells, headerCells, columns, freezePane, foldableRows: { groupBy: 'department' } }));
            equal(cells[0].c, 0);
            equal(headerCells[0].c, 1);
            equal(columns[0].i, 0);
            equal(freezePane.left, 1);
            equal(columns.length, 3);
        });
    });

    //------------------------------------------------------------------
    // CAP-1 — grouping
    //------------------------------------------------------------------
    describe('single-field grouping', () => {

        it('should produce one group row per distinct value, in first-encounter order', () => {
            const { ext } = build({ foldableRows: { groupBy: 'department' } });
            const groups = ext.getGroups();
            equal(groups.length, 2);
            deepEqual(groups[0].path, ['Eng']);
            deepEqual(groups[1].path, ['Design']);
            equal(groups[0].count, 3);
            equal(groups[1].count, 2);
            equal(groups[0].level, 0);
        });

        it('should accept a bare string for groupBy', () => {
            const { ext } = build({ foldableRows: { groupBy: 'location' } });
            deepEqual(ext.getGroups().map(g => g.path[0]), ['SF', 'Berlin']);
        });

        it('should gather records under their group', () => {
            const { grid } = build({ foldableRows: { groupBy: 'department' } });
            // header + 2 groups + 5 records
            equal(grid.model.getRowCount(), 1 + 7);
            deepEqual(visibleRecords(grid), ['r0', 'r1', 'r3', 'r2', 'r4']);
        });

        it('should default every group to expanded', () => {
            const { ext } = build({ foldableRows: { groupBy: 'department' } });
            equal(ext.isCollapsed(['Eng']), false);
            equal(ext.getGroups().every(g => !g.collapsed), true);
        });

        it('should honor collapsedByDefault', () => {
            const { grid, ext } = build({
                foldableRows: { groupBy: 'department', collapsedByDefault: true }
            });
            equal(ext.isCollapsed(['Eng']), true);
            equal(grid.model.getRowCount(), 1 + 2);
        });

        it('should render the label and count into the first host column', () => {
            const ctx = render({ foldableRows: { groupBy: 'department' } });
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            equal(cellAt(ctx.host, groupRow, 1).textContent, 'Eng (3)');
            ctx.cleanup();
        });

        it('should omit the count when showCount is false', () => {
            const ctx = render({ foldableRows: { groupBy: 'department', showCount: false } });
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            equal(cellAt(ctx.host, groupRow, 1).textContent, 'Eng');
            ctx.cleanup();
        });

        it('should route the label through groupLabel when supplied', () => {
            const ctx = render({
                foldableRows: {
                    groupBy: 'department',
                    showCount: false,
                    groupLabel: (value) => `Dept: ${value}`
                }
            });
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            equal(cellAt(ctx.host, groupRow, 1).textContent, 'Dept: Eng');
            ctx.cleanup();
        });

        it('should render no cell at all in the columns the label spans', () => {
            // The label cell spans to the end of the row, so there is nothing
            // left to blank: cols 2 and 3 are covered and render no node.
            const ctx = render({ foldableRows: { groupBy: 'department' } });
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            equal(cellAt(ctx.host, groupRow, 2), null);
            equal(cellAt(ctx.host, groupRow, 3), null);
            ctx.cleanup();
        });

        it('should span the label cell across the rest of the row', () => {
            const ctx = render({ foldableRows: { groupBy: 'department' } });
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            const label = cellAt(ctx.host, groupRow, 1);
            // 4 columns (gutter + 3 host columns); the label starts at 1.
            equal(ctx.grid.model.getColumnSpan(groupRow, 1), 3);
            equal(label.dataset.colspan, '3');
            // 3 host columns at the default columnWidth of 80.
            equal(label.style.width, '240px');
            // ...and a covered coordinate resolves back to it.
            equal(ctx.grid.view.getCell(groupRow, 3), label);
            ctx.cleanup();
        });

        it('should leave record rows one cell per column', () => {
            const ctx = render({ foldableRows: { groupBy: 'department' } });
            const recordRow = ctx.grid.model.getRowIndex(ctx.grid.data.getRowId(0));
            for (let c = 0; c < 4; c++) {
                equal(ctx.grid.model.getColumnSpan(recordRow, c), 1, `col ${c}`);
                notEqual(cellAt(ctx.host, recordRow, c), null, `col ${c}`);
            }
            ctx.cleanup();
        });

        it('should put the group cssClass on every cell of the group row', () => {
            const ctx = render({ foldableRows: { groupBy: 'department' } });
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            // The group row renders two cells: the gutter and the spanned label.
            for (const c of [0, 1]) {
                equal(cellAt(ctx.host, groupRow, c).classList.contains('pgrid-group-row'), true, `col ${c}`);
            }
            ctx.cleanup();
        });

        it('should not put the group cssClass on record rows', () => {
            const ctx = render({ foldableRows: { groupBy: 'department' } });
            const recordRow = ctx.grid.model.getRowIndex(ctx.grid.data.getRowId(0));
            equal(cellAt(ctx.host, recordRow, 1).classList.contains('pgrid-group-row'), false);
            ctx.cleanup();
        });
    });

    describe('nested grouping', () => {

        it('should build a depth-2 tree', () => {
            const { ext } = build({ foldableRows: { groupBy: ['department', 'location'] } });
            const groups = ext.getGroups();
            deepEqual(groups.map(g => g.path), [
                ['Eng'], ['Eng', 'SF'], ['Eng', 'Berlin'],
                ['Design'], ['Design', 'SF'], ['Design', 'Berlin']
            ]);
            deepEqual(groups.map(g => g.level), [0, 1, 1, 0, 1, 1]);
            deepEqual(groups.map(g => g.count), [3, 2, 1, 2, 1, 1]);
        });

        it('should show exactly the ungrouped record set as its leaves', () => {
            const grouped = build({ foldableRows: { groupBy: ['department', 'location'] } }).grid;
            const flat = new PGrid(baseConfig()).model;
            const flatNames = [];
            for (let i = 1; i < flat.getRowCount(); i++) {
                flatNames.push(flat.getRowDataAt(i).name);
            }
            deepEqual(visibleRecords(grouped).slice().sort(), flatNames.slice().sort());
        });

        it('should indent the label by nesting level', () => {
            const ctx = render({ foldableRows: { groupBy: ['department', 'location'], indentSize: 16 } });
            const outer = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            const inner = groupRowIndex(ctx.grid, ctx.ext, ['Eng', 'SF']);
            equal(cellAt(ctx.host, outer, 1).firstChild.style.paddingLeft, '5px');
            equal(cellAt(ctx.host, inner, 1).firstChild.style.paddingLeft, '21px');
            ctx.cleanup();
        });
    });

    describe('empty grouping values', () => {

        it('should bucket null / undefined / empty string under emptyLabel', () => {
            const ctx = render({
                dataModel: {
                    fields: ['name', 'department', 'location'],
                    data: [
                        { name: 'n0', department: null, location: 'SF' },
                        { name: 'n1', department: '', location: 'SF' },
                        { name: 'n2', location: 'SF' },
                        { name: 'n3', department: 'Eng', location: 'SF' }
                    ]
                },
                foldableRows: { groupBy: 'department' }
            });
            const groups = ctx.ext.getGroups();
            equal(groups.length, 2);
            deepEqual(groups[0].path, [null]);
            equal(groups[0].count, 3);
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, [null]);
            equal(cellAt(ctx.host, groupRow, 1).textContent, '(none) (3)');
            ctx.cleanup();
        });

        it('should keep values of different types in different groups', () => {
            // The key is built from the value, so it has to be injective:
            // the number 5 and the string '5' are not the same group.
            const { ext } = build({
                dataModel: {
                    fields: ['name', 'code'],
                    data: [
                        { name: 'n0', code: 5 },
                        { name: 'n1', code: '5' },
                        { name: 'n2', code: 5 }
                    ]
                },
                columns: [{ field: 'name', title: 'Name' }, { field: 'code', title: 'Code' }],
                foldableRows: { groupBy: 'code' }
            });
            const groups = ext.getGroups();
            equal(groups.length, 2);
            equal(groups[0].count, 2);
            equal(groups[1].count, 1);
            // ...and folding one leaves the other alone.
            ext.collapse([5]);
            equal(ext.isCollapsed([5]), true);
            equal(ext.isCollapsed(['5']), false);
        });

        it('should not let a value containing the key delimiter collide with a path', () => {
            const { ext } = build({
                dataModel: {
                    fields: ['name', 'a', 'b'],
                    data: [
                        { name: 'n0', a: 'x\u001Fstring:y', b: 'z' },
                        { name: 'n1', a: 'x', b: 'y' }
                    ]
                },
                columns: [
                    { field: 'name', title: 'Name' },
                    { field: 'a', title: 'A' },
                    { field: 'b', title: 'B' }
                ],
                foldableRows: { groupBy: ['a', 'b'] }
            });
            // Two distinct depth-1 groups, each with one record — not one merged group.
            const level0 = ext.getGroups().filter(g => g.level === 0);
            equal(level0.length, 2);
            deepEqual(level0.map(g => g.count), [1, 1]);
        });

        it('should use a custom emptyLabel', () => {
            const { ext } = build({
                dataModel: { fields: ['name', 'department'], data: [{ name: 'n0', department: '' }] },
                foldableRows: { groupBy: 'department', emptyLabel: 'Unassigned', showCount: false }
            });
            equal(ext.getGroups()[0].label, 'Unassigned');
        });
    });

    //------------------------------------------------------------------
    // CAP-2 — folding
    //------------------------------------------------------------------
    describe('folding', () => {

        let ctx;
        beforeEach(() => { ctx = render({ foldableRows: { groupBy: 'department' } }); });
        afterEach(() => ctx.cleanup());

        it('should remove a collapsed group\'s records from the projection', () => {
            equal(ctx.grid.model.getRowCount(), 1 + 7);
            ctx.ext.collapse(['Eng']);
            equal(ctx.grid.model.getRowCount(), 1 + 4);
            deepEqual(visibleRecords(ctx.grid), ['r2', 'r4']);
        });

        it('should remove a collapsed group\'s cells from the DOM entirely', () => {
            const before = ctx.host.querySelectorAll('.pgrid-cell').length;
            ctx.ext.collapse(['Eng']);
            const after = ctx.host.querySelectorAll('.pgrid-cell').length;
            // 3 records × 4 columns
            equal(before - after, 3 * 4);
            // Nothing in the DOM still renders those records.
            const texts = Array.from(ctx.host.querySelectorAll('.pgrid-cell')).map(c => c.textContent);
            equal(texts.indexOf('r0'), -1);
            equal(texts.indexOf('r1'), -1);
            equal(texts.indexOf('r3'), -1);
        });

        it('should give group rows their own height when groupRowHeight is set', () => {
            const local = build({
                rowHeight: 30,
                foldableRows: { groupBy: 'department', groupRowHeight: 48 }
            });
            const groupRow = groupRowIndex(local.grid, local.ext, ['Eng']);
            const recordRow = local.grid.model.getRowIndex(local.grid.data.getRowId(0));
            equal(local.grid.model.getRowHeight(groupRow), 48);
            equal(local.grid.model.getRowHeight(recordRow), 30);
            // header(30) + 2 group rows(48) + 5 records(30)
            equal(local.grid.model.getTotalHeight(), 30 + (2 * 48) + (5 * 30));
        });

        it('should default group rows to config.rowHeight', () => {
            const local = build({ rowHeight: 30, foldableRows: { groupBy: 'department' } });
            const groupRow = groupRowIndex(local.grid, local.ext, ['Eng']);
            equal(local.grid.model.getRowHeight(groupRow), 30);
            equal(local.grid.model.getTotalHeight(), 30 * (1 + 7));
        });

        it('should shrink the total content height by the collapsed rows', () => {
            const before = ctx.grid.model.getTotalHeight();
            ctx.ext.collapse(['Eng']);
            equal(ctx.grid.model.getTotalHeight(), before - (3 * 30));
        });

        it('should restore everything on expand', () => {
            const rows = ctx.grid.model.getRowCount();
            const height = ctx.grid.model.getTotalHeight();
            const cells = ctx.host.querySelectorAll('.pgrid-cell').length;
            ctx.ext.collapse(['Eng']);
            ctx.ext.expand(['Eng']);
            equal(ctx.grid.model.getRowCount(), rows);
            equal(ctx.grid.model.getTotalHeight(), height);
            equal(ctx.host.querySelectorAll('.pgrid-cell').length, cells);
        });

        it('should toggle back and forth', () => {
            equal(ctx.ext.isCollapsed(['Eng']), false);
            ctx.ext.toggle(['Eng']);
            equal(ctx.ext.isCollapsed(['Eng']), true);
            ctx.ext.toggle(['Eng']);
            equal(ctx.ext.isCollapsed(['Eng']), false);
        });

        it('should collapse and expand everything at once', () => {
            ctx.ext.collapseAll();
            equal(ctx.grid.model.getRowCount(), 1 + 2);
            ctx.ext.expandAll();
            equal(ctx.grid.model.getRowCount(), 1 + 7);
        });

        it('should expandAll back to a full tree from a fully collapsed nested one', () => {
            // Regression: groups buried inside a collapsed ancestor are not
            // materialised as rows, but they still have fold state — expandAll
            // has to reach them or the inner groups stay stuck shut.
            const nested = render({ foldableRows: { groupBy: ['department', 'location'] } });
            equal(nested.grid.model.getRowCount(), 1 + 11);
            nested.ext.collapseAll();
            equal(nested.grid.model.getRowCount(), 1 + 2);
            nested.ext.expandAll();
            equal(nested.grid.model.getRowCount(), 1 + 11);
            nested.cleanup();
        });

        it('should keep tracking groups hidden inside a collapsed ancestor', () => {
            const nested = render({ foldableRows: { groupBy: ['department', 'location'] } });
            nested.ext.collapse(['Eng', 'SF']);
            nested.ext.collapse(['Eng']);
            // The inner group has no row any more...
            equal(groupRowIndex(nested.grid, nested.ext, ['Eng', 'SF']), -1);
            // ...but it is still in the index, and still remembers it is collapsed.
            equal(nested.ext.isCollapsed(['Eng', 'SF']), true);
            deepEqual(nested.ext.getGroups().map(g => g.path), [
                ['Eng'], ['Eng', 'SF'], ['Eng', 'Berlin'],
                ['Design'], ['Design', 'SF'], ['Design', 'Berlin']
            ]);
            deepEqual(nested.ext.getState().collapsed, [['Eng'], ['Eng', 'SF']]);
            // Re-opening the ancestor leaves the inner one still folded.
            nested.ext.expand(['Eng']);
            deepEqual(visibleRecords(nested.grid), ['r1', 'r2', 'r4']);
            nested.cleanup();
        });

        it('should keep the group row itself visible when collapsed', () => {
            ctx.ext.collapse(['Eng']);
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            notEqual(groupRow, -1);
            equal(cellAt(ctx.host, groupRow, 1).textContent, 'Eng (3)');
        });

        it('should fold a nested group without touching its siblings', () => {
            const nested = render({ foldableRows: { groupBy: ['department', 'location'] } });
            nested.ext.collapse(['Eng', 'SF']);
            deepEqual(visibleRecords(nested.grid), ['r1', 'r2', 'r4']);
            // The outer group and the sibling inner group are still there.
            notEqual(groupRowIndex(nested.grid, nested.ext, ['Eng']), -1);
            notEqual(groupRowIndex(nested.grid, nested.ext, ['Eng', 'Berlin']), -1);
            nested.cleanup();
        });

        it('should drop descendant group rows when an outer group collapses', () => {
            const nested = render({ foldableRows: { groupBy: ['department', 'location'] } });
            nested.ext.collapse(['Eng']);
            equal(groupRowIndex(nested.grid, nested.ext, ['Eng', 'SF']), -1);
            equal(groupRowIndex(nested.grid, nested.ext, ['Eng', 'Berlin']), -1);
            nested.cleanup();
        });
    });

    describe('chevron', () => {

        let ctx;
        beforeEach(() => { ctx = render({ foldableRows: { groupBy: 'department' } }); });
        afterEach(() => ctx.cleanup());

        it('should render exactly one chevron in the gutter cell of a group row', () => {
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            const cell = cellAt(ctx.host, groupRow, 0);
            equal(cell.querySelectorAll('.pgrid-group-chevron').length, 1);
        });

        it('should render no chevron on record rows', () => {
            const recordRow = ctx.grid.model.getRowIndex(ctx.grid.data.getRowId(0));
            equal(cellAt(ctx.host, recordRow, 0).querySelectorAll('.pgrid-group-chevron').length, 0);
        });

        it('should toggle the group when clicked', () => {
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            const chevron = cellAt(ctx.host, groupRow, 0).querySelector('.pgrid-group-chevron');
            chevron.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            equal(ctx.ext.isCollapsed(['Eng']), true);
            equal(ctx.grid.model.getRowCount(), 1 + 4);
        });

        it('should flip its glyph with the fold state', () => {
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            equal(cellAt(ctx.host, groupRow, 0).querySelector('.pgrid-group-chevron').textContent, '▼');
            ctx.ext.collapse(['Eng']);
            equal(cellAt(ctx.host, groupRow, 0).querySelector('.pgrid-group-chevron').textContent, '▶');
        });

        it('should not accumulate listeners across ten collapse/expand cycles', () => {
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            const spy = sinon.spy(ctx.ext, 'toggle');
            for (let i = 0; i < 10; i++) {
                const cell = cellAt(ctx.host, groupRow, 0);
                equal(cell.querySelectorAll('.pgrid-group-chevron').length, 1, `cycle ${i}: duplicate chevron`);
                cell.querySelector('.pgrid-group-chevron')
                    .dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }
            equal(spy.callCount, 10);
            spy.restore();
            // Ten toggles from expanded leaves it expanded again.
            equal(ctx.ext.isCollapsed(['Eng']), false);
        });
    });

    //------------------------------------------------------------------
    // The label cell spans the rest of the row so group labels read in full
    //------------------------------------------------------------------
    describe('label column span', () => {

        it('should give the label the full width of the columns it covers', () => {
            const ctx = render({ foldableRows: { groupBy: 'department' } });
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            const label = cellAt(ctx.host, groupRow, 1);
            // The label would otherwise be clipped to one 80px column.
            equal(label.style.width, '240px');
            equal(label.textContent, 'Eng (3)');
            ctx.cleanup();
        });

        it('should span the label at every nesting level', () => {
            const ctx = render({ foldableRows: { groupBy: ['department', 'location'] } });
            const outer = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            const inner = groupRowIndex(ctx.grid, ctx.ext, ['Eng', 'SF']);
            equal(cellAt(ctx.host, outer, 1).dataset.colspan, '3');
            equal(cellAt(ctx.host, inner, 1).dataset.colspan, '3');
            equal(cellAt(ctx.host, inner, 1).textContent, 'SF (2)');
            ctx.cleanup();
        });

        it('should leave the gutter chevron untouched', () => {
            const ctx = render({ foldableRows: { groupBy: 'department' } });
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            const gutter = cellAt(ctx.host, groupRow, 0);
            equal(gutter.dataset.colspan, undefined);
            equal(gutter.style.width, '28px');
            const chevron = gutter.querySelector('.pgrid-group-chevron');
            notEqual(chevron, null);
            chevron.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            equal(ctx.ext.isCollapsed(['Eng']), true);
            ctx.cleanup();
        });

        it('should survive a fold and unfold', () => {
            const ctx = render({ foldableRows: { groupBy: 'department' } });
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            ctx.ext.collapse(['Eng']);
            ctx.ext.expand(['Eng']);
            const label = cellAt(ctx.host, groupRow, 1);
            equal(label.dataset.colspan, '3');
            equal(label.textContent, 'Eng (3)');
            ctx.cleanup();
        });

        it('should stop the span at the frozen pane boundary', () => {
            // The host froze 2 columns; the gutter makes it 3, so the label at
            // column 1 can only reach column 2 — column 3 is a different pane.
            const ctx = render({
                freezePane: { left: 2 },
                foldableRows: { groupBy: 'department' }
            });
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            equal(ctx.grid.model.getColumnSpan(groupRow, 1), 2);
            equal(cellAt(ctx.host, groupRow, 1).dataset.colspan, '2');
            equal(cellAt(ctx.host, groupRow, 2), null);
            // ...and the unfrozen column still renders its own (blank) cell.
            notEqual(cellAt(ctx.host, groupRow, 3), null);
            equal(cellAt(ctx.host, groupRow, 3).textContent, '');
            ctx.cleanup();
        });

        it('should declare no span when the label is the last column', () => {
            const ctx = render({
                columns: [{ field: 'name', title: 'Name' }],
                foldableRows: { groupBy: 'department' }
            });
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            equal(ctx.grid.model.getColumnSpan(groupRow, 1), 1);
            equal(cellAt(ctx.host, groupRow, 1).dataset.colspan, undefined);
            ctx.cleanup();
        });

        it('should leave record rows unspanned', () => {
            const ctx = render({ foldableRows: { groupBy: 'department' } });
            const recordRow = ctx.grid.model.getRowIndex(ctx.grid.data.getRowId(0));
            equal(ctx.grid.model.getColumnSpan(recordRow, 1), 1);
            equal(cellAt(ctx.host, recordRow, 3).textContent, 'SF');
            ctx.cleanup();
        });
    });

    //------------------------------------------------------------------
    // CAP-7 — pooled cells carry no stale decoration
    //------------------------------------------------------------------
    describe('cell recycling', () => {

        it('should strip the chevron, its listener and the label class on recycle', () => {
            const ctx = render({ foldableRows: { groupBy: 'department' } });
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            const cell = cellAt(ctx.host, groupRow, 0);
            const chevron = cell.querySelector('.pgrid-group-chevron');

            // This is exactly what View#_recycleCell fires.
            ctx.grid.extension.executeExtension('cellAfterRecycled', { cell });

            equal(cell.classList.contains('pgrid-group-label'), false);
            equal(cell.querySelector('.pgrid-group-chevron'), null);
            equal(cell._pgridGroupChevron, undefined);

            // The detached chevron no longer reaches the extension.
            const spy = sinon.spy(ctx.ext, 'toggle');
            chevron.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            equal(spy.callCount, 0);
            spy.restore();
            ctx.cleanup();
        });

        it('should carry the group class on the row model, not imperatively', () => {
            // The class rides on the group row's rowModel, so getCellClasses puts
            // it on every cell and View's className reassignment takes it back off
            // when a pooled cell is reused for a record row.
            const { grid, ext } = build({ foldableRows: { groupBy: 'department' } });
            const groupRow = groupRowIndex(grid, ext, ['Eng']);
            const recordRow = grid.model.getRowIndex(grid.data.getRowId(0));
            for (let c = 0; c < 4; c++) {
                ok(grid.model.getCellClasses(groupRow, c).indexOf('pgrid-group-row') !== -1, `group col ${c}`);
                equal(grid.model.getCellClasses(recordRow, c).indexOf('pgrid-group-row'), -1, `record col ${c}`);
            }
        });

        it('should never leave the group class on a cell that is not a group row', () => {
            const ctx = render({ foldableRows: { groupBy: ['department', 'location'] } });
            // Churn the cell pool.
            for (let i = 0; i < 3; i++) {
                ctx.ext.collapse(['Eng']);
                ctx.ext.expand(['Eng']);
            }
            const tagged = Array.from(ctx.host.querySelectorAll('.pgrid-group-row'));
            ok(tagged.length > 0);
            tagged.forEach((cell) => {
                const meta = ctx.grid.model.getRowMeta(parseInt(cell.dataset.rowIndex, 10));
                equal(meta.kind, 'group', `row ${cell.dataset.rowIndex} is not a group row`);
            });
            ctx.cleanup();
        });

        it('should clear the indent it applied to the cell content', () => {
            const ctx = render({ foldableRows: { groupBy: ['department', 'location'] } });
            const inner = groupRowIndex(ctx.grid, ctx.ext, ['Eng', 'SF']);
            const cell = cellAt(ctx.host, inner, 1);
            notEqual(cell.firstChild.style.paddingLeft, '');
            ctx.grid.extension.executeExtension('cellAfterRecycled', { cell });
            equal(cell.firstChild.style.paddingLeft, '');
            ctx.cleanup();
        });

        it('should tolerate being handed a cell it never decorated', () => {
            const ctx = render({ foldableRows: { groupBy: 'department' } });
            const recordRow = ctx.grid.model.getRowIndex(ctx.grid.data.getRowId(0));
            const cell = cellAt(ctx.host, recordRow, 1);
            doesNotThrow(() => ctx.grid.extension.executeExtension('cellAfterRecycled', { cell }));
            ctx.cleanup();
        });
    });

    //------------------------------------------------------------------
    // CAP-5 — group rows are inert to data-row semantics
    //------------------------------------------------------------------
    describe('group rows are not records', () => {

        it('should report canEdit false regardless of column, row or cell config', () => {
            const { grid, ext } = build({
                columns: [
                    { field: 'name', title: 'Name', editable: true },
                    { field: 'department', title: 'Dept', editable: true },
                    { field: 'location', title: 'Loc', editable: true }
                ],
                rows: [{ i: 0, editable: true }],
                cells: [{ c: 0, r: 0, editable: true }],
                foldableRows: { groupBy: 'department' }
            });
            const groupRow = groupRowIndex(grid, ext, ['Eng']);
            for (let c = 0; c < 4; c++) {
                equal(grid.model.canEdit(groupRow, c), false, `col ${c}`);
            }
        });

        it('should leave record rows editable', () => {
            const { grid } = build({
                columns: [
                    { field: 'name', title: 'Name', editable: true },
                    { field: 'department', title: 'Dept' },
                    { field: 'location', title: 'Loc' }
                ],
                foldableRows: { groupBy: 'department' }
            });
            const recordRow = grid.model.getRowIndex(grid.data.getRowId(0));
            equal(grid.model.canEdit(recordRow, 1), true);
        });

        it('should enforce ineditability through the cellEditableCheck hook', () => {
            const { grid, ext } = build({ foldableRows: { groupBy: 'department' } });
            const groupRow = groupRowIndex(grid, ext, ['Eng']);
            const e = { rowIndex: groupRow, colIndex: 1, canEdit: true };
            ext.cellEditableCheck(e);
            equal(e.canEdit, false);
            const recordEvent = { rowIndex: grid.model.getRowIndex(grid.data.getRowId(0)), colIndex: 1, canEdit: true };
            ext.cellEditableCheck(recordEvent);
            equal(recordEvent.canEdit, true);
        });

        it('should return no DataTable row id for a group row', () => {
            const { grid, ext } = build({ foldableRows: { groupBy: 'department' } });
            equal(grid.model.getRowId(groupRowIndex(grid, ext, ['Eng'])), null);
        });

        it('should write nothing to the DataTable through a group row', () => {
            const { grid, ext } = build({ foldableRows: { groupBy: 'department' } });
            const groupRow = groupRowIndex(grid, ext, ['Eng']);
            grid.model.setDataAt(groupRow, 1, 'clobbered');
            deepEqual(grid.data.getAllData().map(r => r.name), ['r0', 'r1', 'r2', 'r3', 'r4']);
        });

        it('should keep the DataTable flat — no synthetic rows anywhere', () => {
            const { grid } = build({ foldableRows: { groupBy: ['department', 'location'] } });
            equal(grid.data.getRowCount(), 5);
            equal(grid.data.getAllData().length, 5);
            equal(grid.data.getAllData().some(r => r.name === undefined), false);
        });
    });

    //------------------------------------------------------------------
    // CAP-2 — spacebar, in both directions
    //------------------------------------------------------------------
    describe('spacebar', () => {

        const spaceConfig = (over = {}) => Object.assign({
            selection: {},
            editing: true,
            columns: [
                { field: 'name', title: 'Name', editable: true },
                { field: 'department', title: 'Dept' },
                { field: 'location', title: 'Loc' }
            ],
            foldableRows: { groupBy: 'department' }
        }, over);

        let ctx;
        beforeEach(() => { ctx = render(spaceConfig()); });
        afterEach(() => {
            ctx.cleanup();
            const stray = document.querySelector('.pgrid-cell-text-editor');
            if (stray && stray.parentElement && stray.parentElement.parentElement) {
                stray.parentElement.parentElement.removeChild(stray.parentElement);
            }
        });

        const pressSpace = (host) =>
            host.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 32, bubbles: true }));

        it('should fold the selected group row and open no editor', () => {
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            cellAt(ctx.host, groupRow, 1).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            deepEqual(ctx.grid.state.get('selection')[0].r, groupRow);

            pressSpace(ctx.host);

            equal(ctx.ext.isCollapsed(['Eng']), true);
            equal(ctx.grid.model.getRowCount(), 1 + 4);
            equal(document.querySelector('.pgrid-cell-text-editor'), null);
        });

        it('should unfold on a second press', () => {
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            cellAt(ctx.host, groupRow, 1).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            pressSpace(ctx.host);
            pressSpace(ctx.host);
            equal(ctx.ext.isCollapsed(['Eng']), false);
            equal(document.querySelector('.pgrid-cell-text-editor'), null);
        });

        it('should still open the editor when a record cell is selected', () => {
            const recordRow = ctx.grid.model.getRowIndex(ctx.grid.data.getRowId(0));
            cellAt(ctx.host, recordRow, 1).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

            pressSpace(ctx.host);

            notEqual(document.querySelector('.pgrid-cell-text-editor'), null);
            equal(ctx.grid.state.get('editing'), true);
            // ...and nothing folded.
            equal(ctx.grid.model.getRowCount(), 1 + 7);
        });

        it('should open the editor on a record row exactly as an ungrouped grid does', () => {
            const plain = render(Object.assign(spaceConfig(), { foldableRows: undefined }));
            cellAt(plain.host, 1, 0).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            plain.host.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 32, bubbles: true }));
            notEqual(document.querySelector('.pgrid-cell-text-editor'), null);
            plain.cleanup();
        });

        it('should ignore space while an editor is open', () => {
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            cellAt(ctx.host, groupRow, 1).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            ctx.grid.state.set('editing', true);
            pressSpace(ctx.host);
            equal(ctx.ext.isCollapsed(['Eng']), false);
            ctx.grid.state.set('editing', false);
        });

        it('should ignore keys other than space', () => {
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            cellAt(ctx.host, groupRow, 1).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            ctx.ext.keyDown({ keyCode: 65 });
            equal(ctx.ext.isCollapsed(['Eng']), false);
        });
    });

    //------------------------------------------------------------------
    // CAP-4 — composes with the data projection
    //------------------------------------------------------------------
    describe('composition with search', () => {

        let ctx;
        beforeEach(() => { ctx = render({ foldableRows: { groupBy: 'department' } }); });
        afterEach(() => ctx.cleanup());

        it('should drop a group whose records are all filtered out', () => {
            ctx.grid.data.search('Design');
            deepEqual(ctx.ext.getGroups().map(g => g.path[0]), ['Design']);
            equal(groupRowIndex(ctx.grid, ctx.ext, ['Eng']), -1);
            deepEqual(visibleRecords(ctx.grid), ['r2', 'r4']);
            equal(ctx.grid.model.getRowCount(), 1 + 3);
        });

        it('should regroup only the surviving records', () => {
            ctx.grid.data.search('Berlin');
            deepEqual(ctx.ext.getGroups().map(g => [g.path[0], g.count]), [['Eng', 1], ['Design', 1]]);
        });

        it('should restore the full grouping when the search is cleared', () => {
            ctx.grid.data.search('Design');
            ctx.grid.data.clearSearch();
            deepEqual(ctx.ext.getGroups().map(g => g.path[0]), ['Eng', 'Design']);
            equal(ctx.grid.model.getRowCount(), 1 + 7);
        });

        it('should keep fold state across a search and back', () => {
            ctx.ext.collapse(['Design']);
            ctx.grid.data.search('Design');
            equal(ctx.ext.isCollapsed(['Design']), true);
            equal(ctx.grid.model.getRowCount(), 1 + 1);
            ctx.grid.data.clearSearch();
            equal(ctx.ext.isCollapsed(['Design']), true);
            equal(ctx.ext.isCollapsed(['Eng']), false);
            deepEqual(visibleRecords(ctx.grid), ['r0', 'r1', 'r3']);
        });

        it('should keep the row-id reverse lookup working after a rebuild', () => {
            const rowId = ctx.grid.data.getRowId(2);
            ctx.grid.data.search('Design');
            const rowIndex = ctx.grid.model.getRowIndex(rowId);
            notEqual(rowIndex, -1);
            equal(ctx.grid.model.getRowDataAt(rowIndex).name, 'r2');
        });

        it('should report -1 for a record the fold has hidden', () => {
            const rowId = ctx.grid.data.getRowId(0);
            ctx.ext.collapse(['Eng']);
            equal(ctx.grid.model.getRowIndex(rowId), -1);
        });
    });

    describe('composition with row insertion', () => {

        it('should absorb a row added at runtime into its group', () => {
            const ctx = render({ foldableRows: { groupBy: 'department' } });
            const before = ctx.grid.model.getRowCount();

            ctx.grid.data.addRow({ name: 'r5', department: 'Eng', location: 'SF' });

            equal(ctx.grid.model.getRowCount(), before + 1);
            equal(ctx.ext.getGroups().find(g => g.path[0] === 'Eng').count, 4);
            deepEqual(visibleRecords(ctx.grid), ['r0', 'r1', 'r3', 'r5', 'r2', 'r4']);

            // ...and its cells are really in the DOM.
            const rowIndex = ctx.grid.model.getRowIndex(ctx.grid.data.getRowId(5));
            notEqual(rowIndex, -1);
            const cell = cellAt(ctx.host, rowIndex, 1);
            notEqual(cell, null);
            equal(cell.textContent, 'r5');
            ctx.cleanup();
        });

        it('should open a brand new group for a row with an unseen value', () => {
            const ctx = render({ foldableRows: { groupBy: 'department' } });
            ctx.grid.data.addRow({ name: 'r5', department: 'Legal', location: 'SF' });
            deepEqual(ctx.ext.getGroups().map(g => g.path[0]), ['Eng', 'Design', 'Legal']);
            ctx.cleanup();
        });

        it('should drop a group when its last record is removed', () => {
            const ctx = render({ foldableRows: { groupBy: 'department' } });
            ctx.grid.data.removeRow(ctx.grid.data.getRowId(2)); // r2, Design
            ctx.grid.data.removeRow(ctx.grid.data.getRowId(3)); // r4, Design
            deepEqual(ctx.ext.getGroups().map(g => g.path[0]), ['Eng']);
            ctx.cleanup();
        });
    });

    describe('regroup on edit', () => {

        // DataTable.setData dispatches dataChanged behind a 100ms setTimeout.
        const SETTLE = 160;

        it('should move a record to its new group when a grouping field changes', function (done) {
            const ctx = render({ foldableRows: { groupBy: 'department' } });
            const recordRow = ctx.grid.model.getRowIndex(ctx.grid.data.getRowId(0)); // r0, Eng
            ctx.grid.model.setDataAt(recordRow, 2 /* department */, 'Design');

            setTimeout(() => {
                try {
                    deepEqual(ctx.ext.getGroups().map(g => [g.path[0], g.count]), [['Design', 3], ['Eng', 2]]);
                    deepEqual(visibleRecords(ctx.grid), ['r0', 'r2', 'r4', 'r1', 'r3']);
                    ctx.cleanup();
                    done();
                } catch (err) {
                    ctx.cleanup();
                    done(err);
                }
            }, SETTLE);
        });

        it('should not rebuild the grid when a non-grouping field changes', function (done) {
            const ctx = render({ foldableRows: { groupBy: 'department' } });
            const recordRow = ctx.grid.model.getRowIndex(ctx.grid.data.getRowId(0));
            const spy = sinon.spy(ctx.grid.view, 'reRender');

            ctx.grid.model.setDataAt(recordRow, 1 /* name */, 'renamed');

            setTimeout(() => {
                try {
                    // A full re-render here would tear down every cell in the grid
                    // for an edit that cannot move a record between groups.
                    equal(spy.callCount, 0);
                    deepEqual(visibleRecords(ctx.grid), ['renamed', 'r1', 'r3', 'r2', 'r4']);
                    spy.restore();
                    ctx.cleanup();
                    done();
                } catch (err) {
                    spy.restore();
                    ctx.cleanup();
                    done(err);
                }
            }, SETTLE);
        });
    });

    //------------------------------------------------------------------
    // CAP-9 — regroup at runtime
    //------------------------------------------------------------------
    describe('setGroupBy', () => {

        let ctx;
        beforeEach(() => { ctx = render({ foldableRows: { groupBy: ['department', 'location'] } }); });
        afterEach(() => ctx.cleanup());

        it('should rebuild the grouping and re-render', () => {
            ctx.ext.setGroupBy(['location']);
            deepEqual(ctx.ext.getGroups().map(g => g.path), [['SF'], ['Berlin']]);
            equal(ctx.grid.model.getRowCount(), 1 + 2 + 5);
            notEqual(ctx.host.querySelector('.pgrid-group-chevron'), null);
        });

        it('should keep the collapsed state of paths that survive', () => {
            ctx.ext.collapse(['Eng']);
            ctx.ext.setGroupBy(['department']);
            equal(ctx.ext.isCollapsed(['Eng']), true);
            deepEqual(visibleRecords(ctx.grid), ['r2', 'r4']);
        });

        it('should drop paths that no longer exist', () => {
            ctx.ext.collapse(['Eng']);
            ctx.ext.collapse(['Eng', 'SF']);
            ctx.ext.setGroupBy(['department']);
            deepEqual(ctx.ext.getState().collapsed, [['Eng']]);
        });

        it('should give brand new paths the collapsedByDefault value', () => {
            const collapsedCtx = render({
                foldableRows: { groupBy: 'department', collapsedByDefault: true }
            });
            collapsedCtx.ext.setGroupBy(['location']);
            equal(collapsedCtx.ext.isCollapsed(['SF']), true);
            equal(collapsedCtx.grid.model.getRowCount(), 1 + 2);
            collapsedCtx.cleanup();
        });

        it('should accept a bare string', () => {
            ctx.ext.setGroupBy('location');
            deepEqual(ctx.ext.getGroups().map(g => g.path[0]), ['SF', 'Berlin']);
        });

        it('should fall back to a flat row list when grouping is turned off', () => {
            ctx.ext.setGroupBy([]);
            deepEqual(ctx.ext.getGroups(), []);
            equal(ctx.grid.model.getRowCount(), 1 + 5);
            deepEqual(visibleRecords(ctx.grid), ['r0', 'r1', 'r2', 'r3', 'r4']);
        });
    });

    //------------------------------------------------------------------
    // CAP-3 — serializable state
    //------------------------------------------------------------------
    describe('getState / setState', () => {

        let ctx;
        beforeEach(() => { ctx = render({ foldableRows: { groupBy: ['department', 'location'] } }); });
        afterEach(() => ctx.cleanup());

        it('should report the collapsed paths', () => {
            ctx.ext.collapse(['Eng', 'SF']);
            deepEqual(ctx.ext.getState().collapsed, [['Eng', 'SF']]);
            deepEqual(ctx.ext.getState().groupBy, ['department', 'location']);
        });

        it('should survive a JSON round trip across a data rebuild', () => {
            ctx.ext.collapse(['Eng', 'SF']);
            ctx.ext.collapse(['Design']);
            const snapshot = JSON.parse(JSON.stringify(ctx.ext.getState()));

            ctx.ext.expandAll();
            equal(ctx.ext.isCollapsed(['Eng', 'SF']), false);

            // Rebuild the projection from a different data view and back again.
            ctx.grid.data.search('SF');
            ctx.grid.data.clearSearch();

            ctx.ext.setState(snapshot);
            equal(ctx.ext.isCollapsed(['Eng', 'SF']), true);
            equal(ctx.ext.isCollapsed(['Design']), true);
            equal(ctx.ext.isCollapsed(['Eng', 'Berlin']), false);
            deepEqual(visibleRecords(ctx.grid), ['r1']);
        });

        it('should round trip exactly even when collapsedByDefault is true', () => {
            const c = render({ foldableRows: { groupBy: 'department', collapsedByDefault: true } });
            c.ext.expand(['Eng']);
            const snapshot = c.ext.getState();
            deepEqual(snapshot.collapsed, [['Design']]);
            c.ext.collapseAll();
            c.ext.setState(snapshot);
            equal(c.ext.isCollapsed(['Eng']), false);
            equal(c.ext.isCollapsed(['Design']), true);
            c.cleanup();
        });

        it('should ignore unknown paths rather than erroring', () => {
            doesNotThrow(() => ctx.ext.setState({ collapsed: [['Nope'], ['Eng', 'Nowhere']] }));
            equal(ctx.grid.model.getRowCount(), 1 + 11);
        });

        it('should accept a bare array of paths', () => {
            ctx.ext.setState([['Eng']]);
            equal(ctx.ext.isCollapsed(['Eng']), true);
        });

        it('should restore the grouping a snapshot was taken under', () => {
            // getState reports groupBy, so setState has to honor it — otherwise a
            // snapshot taken under one grouping silently half-restores under another.
            ctx.ext.collapse(['Eng', 'SF']);
            const snapshot = JSON.parse(JSON.stringify(ctx.ext.getState()));
            deepEqual(snapshot.groupBy, ['department', 'location']);

            ctx.ext.setGroupBy(['location']);
            deepEqual(ctx.ext.getState().groupBy, ['location']);

            ctx.ext.setState(snapshot);

            deepEqual(ctx.ext.getState().groupBy, ['department', 'location']);
            equal(ctx.ext.isCollapsed(['Eng', 'SF']), true);
            deepEqual(visibleRecords(ctx.grid), ['r1', 'r2', 'r4']);
        });

        it('should leave the grouping alone when the snapshot carries none', () => {
            ctx.ext.setState({ collapsed: [['Eng']] });
            deepEqual(ctx.ext.getState().groupBy, ['department', 'location']);
            equal(ctx.ext.isCollapsed(['Eng']), true);
        });

        it('should treat an empty state as fully expanded', () => {
            ctx.ext.collapseAll();
            ctx.ext.setState({ collapsed: [] });
            equal(ctx.grid.model.getRowCount(), 1 + 11);
        });
    });

    //------------------------------------------------------------------
    // CAP-10 — selection stays anchored
    //------------------------------------------------------------------
    describe('selection anchoring', () => {

        let ctx;
        beforeEach(() => {
            ctx = render({ selection: {}, foldableRows: { groupBy: 'department' } });
        });
        afterEach(() => ctx.cleanup());

        const select = (r, c) => cellAt(ctx.host, r, c).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        const selectedRow = () => ctx.grid.state.get('selection')[0].r;

        it('should keep pointing at the same record when a group above it collapses', () => {
            const recordRow = ctx.grid.model.getRowIndex(ctx.grid.data.getRowId(2)); // r2, in Design
            select(recordRow, 1);
            equal(ctx.grid.model.getRowDataAt(selectedRow()).name, 'r2');

            ctx.ext.collapse(['Eng']);

            notEqual(selectedRow(), recordRow, 'the row index should have moved');
            equal(ctx.grid.model.getRowDataAt(selectedRow()).name, 'r2');
        });

        it('should re-apply the selection class to the record at its new index', () => {
            const recordRow = ctx.grid.model.getRowIndex(ctx.grid.data.getRowId(2));
            select(recordRow, 1);
            ctx.ext.collapse(['Eng']);
            const cell = cellAt(ctx.host, selectedRow(), 1);
            equal(cell.classList.contains('pgrid-cell-selection'), true);
        });

        it('should fall back to the nearest visible ancestor group row when the record is hidden', () => {
            const recordRow = ctx.grid.model.getRowIndex(ctx.grid.data.getRowId(0)); // r0, in Eng
            select(recordRow, 1);
            ctx.ext.collapse(['Eng']);
            const meta = ctx.grid.model.getRowMeta(selectedRow());
            equal(meta.kind, 'group');
            deepEqual(meta.path, ['Eng']);
        });

        it('should climb to the nearest surviving ancestor in a nested tree', () => {
            const nested = render({ selection: {}, foldableRows: { groupBy: ['department', 'location'] } });
            const recordRow = nested.grid.model.getRowIndex(nested.grid.data.getRowId(0)); // r0, Eng/SF
            cellAt(nested.host, recordRow, 1).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            nested.ext.collapse(['Eng', 'SF']);
            let meta = nested.grid.model.getRowMeta(nested.grid.state.get('selection')[0].r);
            deepEqual(meta.path, ['Eng', 'SF']);
            // Now the innermost anchor disappears too.
            nested.ext.collapse(['Eng']);
            meta = nested.grid.model.getRowMeta(nested.grid.state.get('selection')[0].r);
            deepEqual(meta.path, ['Eng']);
            nested.cleanup();
        });

        it('should keep a selected group row selected through its own fold cycle', () => {
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Design']);
            select(groupRow, 1);
            ctx.ext.collapse(['Eng']);
            let meta = ctx.grid.model.getRowMeta(selectedRow());
            equal(meta.kind, 'group');
            deepEqual(meta.path, ['Design']);
            ctx.ext.expand(['Eng']);
            meta = ctx.grid.model.getRowMeta(selectedRow());
            deepEqual(meta.path, ['Design']);
        });

        it('should leave the selection alone when nothing is selected', () => {
            doesNotThrow(() => ctx.ext.collapse(['Eng']));
            equal(ctx.grid.state.get('selection'), undefined);
        });

        it('should re-anchor the column when the selection lands on a group row', () => {
            // Column 2 is a normal cell on a record row but is covered by the
            // label span on a group row: without re-anchoring the selection
            // would point at a coordinate that renders no node at all.
            const recordRow = ctx.grid.model.getRowIndex(ctx.grid.data.getRowId(0)); // r0, in Eng
            select(recordRow, 2);
            deepEqual(ctx.grid.state.get('selection')[0], { r: recordRow, c: 2, w: 1, h: 1 });

            ctx.ext.collapse(['Eng']);

            const selection = ctx.grid.state.get('selection')[0];
            equal(ctx.grid.model.getRowMeta(selection.r).kind, 'group');
            equal(selection.c, 1);
            equal(selection.w, 3);
            const cell = cellAt(ctx.host, selection.r, 1);
            equal(cell.classList.contains('pgrid-cell-selection'), true);
            equal(ctx.host.querySelectorAll('.pgrid-cell-selection').length, 1);
        });

        it('should re-anchor back to the plain column when the record reappears', () => {
            const recordRow = ctx.grid.model.getRowIndex(ctx.grid.data.getRowId(0));
            select(recordRow, 2);
            ctx.ext.collapse(['Eng']);
            ctx.ext.expand(['Eng']);
            const selection = ctx.grid.state.get('selection')[0];
            equal(ctx.grid.model.getRowMeta(selection.r).kind, 'group');
            // The fallback anchored onto the group row and stays there; what
            // matters is that the stored column always renders a node.
            notEqual(cellAt(ctx.host, selection.r, selection.c), null);
        });
    });

    //------------------------------------------------------------------
    // Interop with the other built-ins
    //------------------------------------------------------------------
    describe('interop', () => {

        it('should coexist with every other built-in', () => {
            const ctx = render({
                selection: {},
                editing: true,
                copypaste: true,
                autoUpdate: true,
                columnFormatter: true,
                columnResize: {},
                textOverflow: 'ellipsis',
                foldableRows: { groupBy: ['department', 'location'] }
            });
            equal(ctx.grid.model.getRowCount(), 1 + 11);
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            equal(cellAt(ctx.host, groupRow, 1).textContent, 'Eng (3)');
            ctx.ext.collapse(['Eng']);
            // Eng hides 2 inner group rows + 3 records.
            equal(ctx.grid.model.getRowCount(), 1 + 6);
            ctx.cleanup();
        });

        it('should not let a column formatter write into a group row', () => {
            const ctx = render({
                columnFormatter: true,
                columns: [
                    { field: 'name', title: 'Name' },
                    { field: 'department', title: 'Dept', formatter: { render: (e) => { e.cellContent.innerHTML = 'FORMATTED'; } } },
                    { field: 'location', title: 'Loc' }
                ],
                foldableRows: { groupBy: 'department' }
            });
            const groupRow = groupRowIndex(ctx.grid, ctx.ext, ['Eng']);
            // Column 2 of a group row is covered by the label span, so the
            // formatter has no cell of its own to write into at all.
            equal(cellAt(ctx.host, groupRow, 2), null);
            equal(cellAt(ctx.host, groupRow, 1).textContent, 'Eng (3)');
            const recordRow = ctx.grid.model.getRowIndex(ctx.grid.data.getRowId(0));
            equal(cellAt(ctx.host, recordRow, 2).textContent, 'FORMATTED');
            ctx.cleanup();
        });
    });
});

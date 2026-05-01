import { equal, deepEqual } from 'assert';
import { Model } from '../../src/grid/model';
import { DataTable } from '../../src/data/table';
import { Extension } from '../../src/grid/extension';

const baseConfig = (over = {}) => Object.assign({
    headerRowCount: 1,
    rowHeight: 30,
    columnWidth: 100,
    columns: [
        { field: 'a', title: 'A' },
        { field: 'b', title: 'B' },
        { field: 'c', title: 'C' }
    ]
}, over);

const baseDataModel = (rows = [{ a: 1, b: 2, c: 3 }, { a: 4, b: 5, c: 6 }]) => ({
    fields: ['a', 'b', 'c'],
    data: rows
});

const buildModel = (configOverrides = {}, rows) => {
    const config = baseConfig(configOverrides);
    const ext = new Extension({}, config);
    const data = new DataTable(baseDataModel(rows), ext);
    return { model: new Model(config, data, ext), data, ext, config };
};

describe('Model', () => {

    describe('column model indexing', () => {

        it('should index columns positionally when no `i` is provided', () => {
            const { model } = buildModel();
            equal(model.getColumnModel(0).field, 'a');
            equal(model.getColumnModel(2).field, 'c');
        });

        it('should index columns by their `i` field when provided', () => {
            // Note: source assumes a dense layout when computing total width, so
            // `i` must cover indexes [0, n-1] without gaps. This test pins the
            // intended remap behavior: `i` becomes the column index, not the
            // declaration order.
            const { model } = buildModel({
                columns: [{ i: 2, field: 'x' }, { i: 0, field: 'y' }, { i: 1, field: 'z' }]
            });
            equal(model.getColumnModel(0).field, 'y');
            equal(model.getColumnModel(1).field, 'z');
            equal(model.getColumnModel(2).field, 'x');
        });
    });

    describe('row and cell model indexing', () => {

        it('should map row models by their `i` field', () => {
            const { model } = buildModel({
                rows: [{ i: 1, cssClass: 'highlighted' }]
            });
            equal(model.getRowModel(2 /* header(1) + dataRow(1) */).cssClass, 'highlighted');
        });

        it('should map header row models by their `i` field', () => {
            const { model } = buildModel({
                headerRowCount: 1,
                headerRows: [{ i: 0, cssClass: 'header' }]
            });
            equal(model.getRowModel(0).cssClass, 'header');
        });

        it('should map cells under model[c][r] keyed by column then row', () => {
            const { model } = buildModel({
                cells: [{ c: 1, r: 0, cssClass: 'cell-1-0' }]
            });
            equal(model.getCellModel(1 /* row 0 = header so use row 1 */, 1).cssClass, 'cell-1-0');
        });

        it('should look up header cells from a separate map when in header rows', () => {
            const { model } = buildModel({
                headerRowCount: 1,
                headerCells: [{ c: 2, r: 0, cssClass: 'hcell' }]
            });
            equal(model.getCellModel(0, 2).cssClass, 'hcell');
        });
    });

    describe('isHeaderRow', () => {

        it('should treat row indexes below headerRowCount as header rows', () => {
            const { model } = buildModel({ headerRowCount: 2 });
            equal(model.isHeaderRow(0), true);
            equal(model.isHeaderRow(1), true);
            equal(model.isHeaderRow(2), false);
        });
    });

    describe('getColumnWidth', () => {

        it('should fall back to the configured default width', () => {
            const { model } = buildModel({ columnWidth: 80 });
            equal(model.getColumnWidth(0), 80);
        });

        it('should use a column-specific width when set on the column model', () => {
            const { model } = buildModel({
                columnWidth: 80,
                columns: [{ field: 'a', width: 200 }, { field: 'b' }]
            });
            equal(model.getColumnWidth(0), 200);
            equal(model.getColumnWidth(1), 80);
        });
    });

    describe('getRowHeight', () => {

        it('should fall back to the configured default rowHeight', () => {
            const { model } = buildModel({ rowHeight: 40 });
            equal(model.getRowHeight(0), 40);
        });

        it('should honor a row-specific height when set', () => {
            const { model } = buildModel({
                rows: [{ i: 0, height: 90 }]
            });
            equal(model.getRowHeight(0), 90);
        });
    });

    describe('counts', () => {

        it('should count columns from the columns config', () => {
            const { model } = buildModel();
            equal(model.getColumnCount(), 3);
        });

        it('should count rows as headerRowCount + data rows', () => {
            const { model } = buildModel({ headerRowCount: 2 }, [{}, {}, {}]);
            equal(model.getRowCount(), 2 + 3);
        });
    });

    describe('freeze panes', () => {

        it('should report the header row count as the minimum top-freeze', () => {
            const { model } = buildModel({ headerRowCount: 1 });
            equal(model.getTopFreezeRows(), 1);
        });

        it('should add freezePane.top on top of the header row count', () => {
            const { model } = buildModel({
                headerRowCount: 1,
                freezePane: { top: 2 }
            });
            equal(model.getTopFreezeRows(), 3);
        });

        it('should sum row heights for the top-freeze size', () => {
            const { model } = buildModel({
                headerRowCount: 1,
                rowHeight: 30,
                freezePane: { top: 1 }
            });
            equal(model.getTopFreezeSize(), 30 + 30);
        });

        it('should report 0 left-freeze when none is configured', () => {
            const { model } = buildModel();
            equal(model.getLeftFreezeRows(), 0);
            equal(model.getLeftFreezeSize(), 0);
        });

        it('should report left-freeze rows and sum their column widths', () => {
            const { model } = buildModel({
                columnWidth: 50,
                columns: [{ field: 'a', width: 70 }, { field: 'b' }, { field: 'c' }],
                freezePane: { left: 2 }
            });
            equal(model.getLeftFreezeRows(), 2);
            equal(model.getLeftFreezeSize(), 70 + 50);
        });

        it('should report 0 bottom-freeze when none is configured', () => {
            const { model } = buildModel();
            equal(model.getBottomFreezeRows(), 0);
        });

        it('should report bottom-freeze row count when configured', () => {
            const { model } = buildModel({ freezePane: { bottom: 2 } });
            equal(model.getBottomFreezeRows(), 2);
        });
    });

    describe('canEdit', () => {

        it('should return false when nothing flags the cell as editable', () => {
            const { model } = buildModel();
            equal(model.canEdit(1, 0), false);
        });

        it('should return true when the column is marked editable', () => {
            const { model } = buildModel({
                columns: [{ field: 'a', editable: true }, { field: 'b' }, { field: 'c' }]
            });
            equal(model.canEdit(1, 0), true);
        });

        it('should return true when the row is marked editable', () => {
            const { model } = buildModel({
                rows: [{ i: 0, editable: true }]
            });
            equal(model.canEdit(1 /* row 0 of data */, 0), true);
        });

        it('should let an explicit cell.editable=false override a column editable=true', () => {
            const { model } = buildModel({
                columns: [{ field: 'a', editable: true }, { field: 'b' }, { field: 'c' }],
                cells: [{ c: 0, r: 0, editable: false }]
            });
            equal(model.canEdit(1, 0), false);
        });

        it('should let an explicit row.editable=false override a column editable=true', () => {
            const { model } = buildModel({
                columns: [{ field: 'a', editable: true }, { field: 'b' }, { field: 'c' }],
                rows: [{ i: 0, editable: false }]
            });
            equal(model.canEdit(1, 0), false);
        });

        it('should defer to the cellEditableCheck extension when registered', () => {
            const { config, data, ext } = buildModel();
            ext.loadExtension({
                cellEditableCheck(e) { e.canEdit = true; }
            });
            const model = new Model(config, data, ext);
            equal(model.canEdit(1, 0), true);
        });

        it('should pass row/column context to the cellEditableCheck extension', () => {
            const { config, data, ext } = buildModel();
            let captured;
            ext.loadExtension({
                cellEditableCheck(e) { captured = e; e.canEdit = false; }
            });
            const model = new Model(config, data, ext);
            model.canEdit(1, 2);
            equal(captured.rowIndex, 1);
            equal(captured.colIndex, 2);
            equal(captured.field, 'c');
        });
    });

    describe('getCascadedCellProp', () => {

        it('should pick the cell-level value when present', () => {
            const { model } = buildModel({
                columns: [{ field: 'a', cssClass: 'col' }, { field: 'b' }, { field: 'c' }],
                rows: [{ i: 0, cssClass: 'row' }],
                cells: [{ c: 0, r: 0, cssClass: 'cell' }]
            });
            equal(model.getCascadedCellProp(1, 0, 'cssClass'), 'cell');
        });

        it('should fall back to row-level value when cell does not set the prop', () => {
            const { model } = buildModel({
                columns: [{ field: 'a', cssClass: 'col' }, { field: 'b' }, { field: 'c' }],
                rows: [{ i: 0, cssClass: 'row' }]
            });
            equal(model.getCascadedCellProp(1, 0, 'cssClass'), 'row');
        });

        it('should fall back to column-level value when neither cell nor row set it', () => {
            const { model } = buildModel({
                columns: [{ field: 'a', cssClass: 'col' }, { field: 'b' }, { field: 'c' }]
            });
            equal(model.getCascadedCellProp(1, 0, 'cssClass'), 'col');
        });

        it('should return undefined when no level provides the prop', () => {
            const { model } = buildModel();
            equal(model.getCascadedCellProp(1, 0, 'cssClass'), undefined);
        });
    });

    describe('getCellClasses', () => {

        it('should return an empty array when nothing contributes a class', () => {
            const { model } = buildModel();
            deepEqual(model.getCellClasses(1, 0), []);
        });

        it('should include classes from column, row and cell models', () => {
            const { model } = buildModel({
                columns: [{ field: 'a', cssClass: 'col' }, { field: 'b' }, { field: 'c' }],
                rows: [{ i: 0, cssClass: 'row' }],
                cells: [{ c: 0, r: 0, cssClass: 'cell' }]
            });
            const classes = model.getCellClasses(1, 0);
            // Order is [cell, row, col] (cell added last via unshift).
            deepEqual(classes, ['cell', 'row', 'col']);
        });

        it('should add pgrid-row-header for header rows that have a row model', () => {
            const { model } = buildModel({
                headerRows: [{ i: 0, cssClass: 'header' }]
            });
            const classes = model.getCellClasses(0, 0);
            deepEqual(classes, ['header', 'pgrid-row-header']);
        });
    });

    describe('determineScrollbarState', () => {

        it('should report no scrollbars when content fits in the view', () => {
            const { model } = buildModel({
                rowHeight: 10, columnWidth: 10,
                columns: [{ field: 'a' }]
            }, [{ a: 1 }]);
            equal(model.determineScrollbarState(1000, 1000, 16), 'n');
        });

        it('should report horizontal-only when content overflows width but fits height', () => {
            const { model } = buildModel({
                rowHeight: 10,
                columns: [{ field: 'a', width: 600 }, { field: 'b', width: 600 }]
            }, [{ a: 1, b: 2 }]);
            equal(model.determineScrollbarState(800, 1000, 16), 'h');
        });

        it('should report vertical-only when content overflows height but fits width', () => {
            const rows = [];
            for (let i = 0; i < 200; i++) rows.push({ a: i });
            const { model } = buildModel({
                rowHeight: 30,
                columns: [{ field: 'a', width: 50 }]
            }, rows);
            equal(model.determineScrollbarState(800, 400, 16), 'v');
        });

        it('should report both when one overflow forces the other to also overflow', () => {
            const rows = [];
            for (let i = 0; i < 50; i++) rows.push({ a: i });
            const { model } = buildModel({
                rowHeight: 30,
                columns: [{ field: 'a', width: 600 }, { field: 'b', width: 600 }]
            }, rows);
            equal(model.determineScrollbarState(800, 800, 16), 'b');
        });
    });

    describe('getDataAt / getRowDataAt / setDataAt', () => {

        it('should return the column title when reading from a header row', () => {
            const { model } = buildModel();
            equal(model.getDataAt(0, 1), 'B');
        });

        it('should return undefined for header cells in columns without a title', () => {
            const { model } = buildModel({
                columns: [{ field: 'a' }, { field: 'b' }, { field: 'c' }]
            });
            equal(model.getDataAt(0, 0), undefined);
        });

        it('should delegate data-row reads to the underlying DataTable by field', () => {
            const { model } = buildModel();
            equal(model.getDataAt(1, 0), 1);
            equal(model.getDataAt(2, 2), 6);
        });

        it('should return undefined for header rowDataAt', () => {
            const { model } = buildModel();
            equal(model.getRowDataAt(0), undefined);
        });

        it('should return the underlying row object for data rows via getRowDataAt', () => {
            const { model } = buildModel();
            deepEqual(model.getRowDataAt(1), { a: 1, b: 2, c: 3 });
        });

        it('should delegate setDataAt to the DataTable by field name', () => {
            const { model, data } = buildModel();
            model.setDataAt(1, 0, 99);
            equal(data.getDataAt(0, 'a'), 99);
        });
    });

    describe('row / column id and index lookup', () => {

        it('should translate a data rowIndex to the underlying rowId via DataTable', () => {
            const { model, data } = buildModel();
            const rowId = data.getRowId(0);
            equal(model.getRowIndex(rowId), 1 /* shift by headerRowCount */);
        });

        it('should return null when asking for the rowId of a header row', () => {
            const { model } = buildModel();
            equal(model.getRowId(0), null);
        });

        it('should resolve column index by field name', () => {
            const { model } = buildModel();
            equal(model.getColumnIndex('b'), 1);
        });

        it('should return -1 for an unknown field', () => {
            const { model } = buildModel();
            equal(model.getColumnIndex('zzz'), -1);
        });

        it('should resolve column field by index', () => {
            const { model } = buildModel();
            equal(model.getColumnField(2), 'c');
        });
    });

    describe('total size calculation', () => {

        it('should sum default columnWidth across all columns when no per-column width', () => {
            const { model } = buildModel({ columnWidth: 100 });
            equal(model.getTotalWidth(), 300);
        });

        it('should mix per-column widths with the default', () => {
            const { model } = buildModel({
                columnWidth: 100,
                columns: [{ field: 'a', width: 200 }, { field: 'b' }, { field: 'c', width: 50 }]
            });
            equal(model.getTotalWidth(), 200 + 100 + 50);
        });

        it('should sum default rowHeight across header rows + data rows', () => {
            const { model } = buildModel({ rowHeight: 30, headerRowCount: 1 }, [{}, {}, {}]);
            // 1 header row + 3 data rows
            equal(model.getTotalHeight(), 30 * 4);
        });

        it('should honor per-row height overrides in totalHeight', () => {
            const { model } = buildModel({
                rowHeight: 30,
                headerRowCount: 1,
                rows: [{ i: 0, height: 50 }]
            }, [{}, {}]);
            // header (30) + row0 override (50) + row1 default (30)
            equal(model.getTotalHeight(), 30 + 50 + 30);
        });
    });
});

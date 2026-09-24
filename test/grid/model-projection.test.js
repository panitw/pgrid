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
        { field: 'b', title: 'B' }
    ]
}, over);

const buildModel = (configOverrides = {}, rows = [{ a: 'a0', b: 'b0' }, { a: 'a1', b: 'b1' }, { a: 'a2', b: 'b2' }]) => {
    const config = baseConfig(configOverrides);
    const ext = new Extension({}, config);
    const data = new DataTable({ fields: ['a', 'b'], data: rows }, ext);
    return { model: new Model(config, data, ext), data, ext, config };
};

// A deliberately dumb projection: one synthetic group row on top, then data
// rows 2 and 0 (out of order, with data row 1 hidden).
const stubProjection = () => {
    const groupRow = {
        kind: 'group',
        key: 'G',
        path: ['G'],
        label: 'Group G',
        level: 0,
        count: 2,
        collapsed: false,
        rowModel: { cssClass: 'stub-group', editable: false }
    };
    const rows = [
        groupRow,
        { kind: 'data', dataRowIndex: 2 },
        { kind: 'data', dataRowIndex: 0 }
    ];
    const visible = { 2: 1, 0: 2 };
    return {
        groupRow,
        rows,
        getRowCount: () => rows.length,
        resolve: (i) => rows[i],
        getRowHeight: (i) => (rows[i] && rows[i].kind === 'group') ? 44 : undefined,
        findDataRow: (dataRowIndex) => (visible[dataRowIndex] === undefined) ? -1 : visible[dataRowIndex]
    };
};

describe('Model row projection seam', () => {

    describe('identity default (no projection installed)', () => {

        it('should report no projection until one is installed', () => {
            const { model } = buildModel();
            equal(model.getRowProjection(), null);
        });

        it('should resolve header rows to kind "header"', () => {
            const { model } = buildModel({ headerRowCount: 2 });
            equal(model.getRowMeta(0).kind, 'header');
            equal(model.getRowMeta(1).kind, 'header');
        });

        it('should resolve data rows to rowIndex - headerRowCount', () => {
            const { model } = buildModel();
            deepEqual(model.getRowMeta(1), { kind: 'data', dataRowIndex: 0 });
            deepEqual(model.getRowMeta(3), { kind: 'data', dataRowIndex: 2 });
        });

        it('should count rows as headerRowCount + DataTable rows', () => {
            const { model } = buildModel();
            equal(model.getRowCount(), 1 + 3);
        });

        it('should keep every routed accessor on the identity mapping', () => {
            const { model, data } = buildModel();
            equal(model.getDataAt(1, 0), 'a0');
            deepEqual(model.getRowDataAt(3), { a: 'a2', b: 'b2' });
            equal(model.getRowId(1), data.getRowId(0));
            equal(model.getRowIndex(data.getRowId(2)), 3);
            equal(model.getRowHeight(1), 30);
        });
    });

    describe('with a projection installed', () => {

        let ctx;
        let projection;

        beforeEach(() => {
            ctx = buildModel();
            projection = stubProjection();
            ctx.model.setRowProjection(projection);
            ctx.model.calcTotalSize();
        });

        it('should expose the installed projection', () => {
            equal(ctx.model.getRowProjection(), projection);
        });

        it('should take the row count from the projection, not the DataTable', () => {
            equal(ctx.data.getRowCount(), 3);
            equal(ctx.model.getRowCount(), 1 + 3);
            // Prove it is really the projection talking: shrink it.
            projection.rows.pop();
            equal(ctx.model.getRowCount(), 1 + 2);
        });

        it('should route getDataAt through the projection ordering', () => {
            equal(ctx.model.getDataAt(2, 0), 'a2');
            equal(ctx.model.getDataAt(3, 0), 'a0');
        });

        it('should still return column titles for header rows', () => {
            equal(ctx.model.getDataAt(0, 1), 'B');
        });

        it('should route getRowDataAt through the projection ordering', () => {
            deepEqual(ctx.model.getRowDataAt(2), { a: 'a2', b: 'b2' });
            deepEqual(ctx.model.getRowDataAt(3), { a: 'a0', b: 'b0' });
        });

        it('should route setDataAt to the projected data row', () => {
            ctx.model.setDataAt(2, 0, 'written');
            equal(ctx.data.getDataAt(2, 'a'), 'written');
            equal(ctx.data.getDataAt(0, 'a'), 'a0');
        });

        it('should route getRowId through the projection ordering', () => {
            equal(ctx.model.getRowId(2), ctx.data.getRowId(2));
            equal(ctx.model.getRowId(3), ctx.data.getRowId(0));
        });

        it('should reverse-resolve getRowIndex through findDataRow', () => {
            equal(ctx.model.getRowIndex(ctx.data.getRowId(2)), 2);
            equal(ctx.model.getRowIndex(ctx.data.getRowId(0)), 3);
        });

        it('should return -1 from getRowIndex for a row the projection hides', () => {
            equal(ctx.model.getRowIndex(ctx.data.getRowId(1)), -1);
        });

        it('should let the projection override row height', () => {
            equal(ctx.model.getRowHeight(1 /* group row */), 44);
            equal(ctx.model.getRowHeight(2 /* data row */), 30);
        });

        it('should fall through to config.rows[].height when the projection declines', () => {
            const local = buildModel({ rows: [{ i: 2, height: 77 }] });
            local.model.setRowProjection(stubProjection());
            // Projected row 1 is data row 2, which carries the height override.
            equal(local.model.getRowHeight(2), 77);
        });

        it('should include projected rows in the total height', () => {
            // header(30) + group(44) + 2 data rows(30 each)
            equal(ctx.model.getTotalHeight(), 30 + 44 + 30 + 30);
        });
    });

    describe('virtual (group) row metadata', () => {

        let ctx;
        let projection;

        beforeEach(() => {
            ctx = buildModel();
            projection = stubProjection();
            ctx.model.setRowProjection(projection);
        });

        it('should surface the projection entry from getRowMeta', () => {
            const meta = ctx.model.getRowMeta(1);
            equal(meta.kind, 'group');
            equal(meta.label, 'Group G');
            equal(meta.level, 0);
            deepEqual(meta.path, ['G']);
        });

        it('should return the projection-supplied row model for a virtual row', () => {
            equal(ctx.model.getRowModel(1).cssClass, 'stub-group');
        });

        it('should push the virtual row cssClass onto every cell of that row', () => {
            deepEqual(ctx.model.getCellClasses(1, 0), ['stub-group']);
            deepEqual(ctx.model.getCellClasses(1, 1), ['stub-group']);
        });

        it('should return no DataTable row id for a virtual row', () => {
            equal(ctx.model.getRowId(1), null);
        });

        it('should return undefined data for a virtual row', () => {
            equal(ctx.model.getDataAt(1, 0), undefined);
            equal(ctx.model.getRowDataAt(1), undefined);
        });

        it('should write nothing to the DataTable through a virtual row', () => {
            ctx.model.setDataAt(1, 0, 'nope');
            equal(ctx.data.getDataAt(0, 'a'), 'a0');
            equal(ctx.data.getDataAt(2, 'a'), 'a2');
        });

        it('should return no cell model for a virtual row', () => {
            const local = buildModel({ cells: [{ c: 0, r: 0, cssClass: 'cell' }] });
            local.model.setRowProjection(stubProjection());
            equal(local.model.getCellModel(1 /* group row */, 0), undefined);
            // ...but the data row it points at still resolves normally.
            equal(local.model.getCellModel(3 /* data row 0 */, 0).cssClass, 'cell');
        });

        it('should resolve out-of-range projection rows to kind "none"', () => {
            equal(ctx.model.getRowMeta(99).kind, 'none');
            equal(ctx.model.getRowId(99), null);
            equal(ctx.model.getDataAt(99, 0), undefined);
        });
    });

    describe('clearing the projection', () => {

        it('should return to identity behavior when the projection is removed', () => {
            const { model, data } = buildModel();
            model.setRowProjection(stubProjection());
            equal(model.getDataAt(2, 0), 'a2');
            model.setRowProjection(null);
            model.calcTotalSize();
            equal(model.getRowProjection(), null);
            equal(model.getRowCount(), 1 + 3);
            equal(model.getDataAt(2, 0), 'a1');
            equal(model.getRowIndex(data.getRowId(1)), 2);
            equal(model.getTotalHeight(), 30 * 4);
        });
    });
});

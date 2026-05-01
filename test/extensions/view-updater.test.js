import { equal, deepEqual } from 'assert';
import sinon from 'sinon';
import { ViewUpdaterExtension } from '../../src/extensions/view-updater';

const buildGrid = (overrides = {}) => ({
    model: {
        getRowIndex: overrides.getRowIndex || (id => parseInt(id.replace('R', ''), 10)),
        getColumnIndex: overrides.getColumnIndex || (field => ({ a: 0, b: 1, c: 2 }[field] ?? -1))
    },
    view: {
        updateCell: sinon.spy()
    }
});

describe('ViewUpdaterExtension', () => {

    let ext;

    beforeEach(() => {
        ext = new ViewUpdaterExtension();
    });

    it('should call view.updateCell once for each entry in updates', () => {
        const grid = buildGrid();
        ext.init(grid, {});
        ext.dataFinishUpdate({ updates: [
            { rowId: 'R1', field: 'a' },
            { rowId: 'R2', field: 'b' }
        ]});
        equal(grid.view.updateCell.callCount, 2);
        deepEqual(grid.view.updateCell.firstCall.args, [1, 0]);
        deepEqual(grid.view.updateCell.secondCall.args, [2, 1]);
    });

    it('should skip updates whose field cannot be resolved to a column', () => {
        const grid = buildGrid();
        ext.init(grid, {});
        ext.dataFinishUpdate({ updates: [
            { rowId: 'R1', field: 'unknown-field' }
        ]});
        equal(grid.view.updateCell.called, false);
    });

    it('should resolve rowId only once per row across multiple updates', () => {
        const getRowIndex = sinon.stub();
        getRowIndex.withArgs('R1').returns(1);
        const grid = buildGrid({ getRowIndex });
        ext.init(grid, {});
        ext.dataFinishUpdate({ updates: [
            { rowId: 'R1', field: 'a' },
            { rowId: 'R1', field: 'b' }
        ]});
        equal(getRowIndex.callCount, 1);
        equal(grid.view.updateCell.callCount, 2);
    });

    it('should be a no-op when updates is empty', () => {
        const grid = buildGrid();
        ext.init(grid, {});
        ext.dataFinishUpdate({ updates: [] });
        equal(grid.view.updateCell.called, false);
    });
});

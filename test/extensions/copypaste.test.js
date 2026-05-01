import { equal, deepEqual } from 'assert';
import sinon from 'sinon';
import { CopyPasteExtension } from '../../src/extensions/copypaste';

const buildGrid = (overrides = {}) => {
    const stateMap = {};
    return {
        state: {
            get: (key) => stateMap[key],
            set: (key, value) => { stateMap[key] = value; }
        },
        model: {
            getDataAt: overrides.getDataAt || ((r, c) => `r${r}c${c}`),
            setDataAt: sinon.spy(),
            canEdit: overrides.canEdit || (() => true),
            getRowId: (r) => `RID${r}`,
            getColumnField: (c) => `F${c}`
        },
        view: { updateCell: sinon.spy() },
        dispatch: sinon.spy(),
        _state: stateMap
    };
};

describe('CopyPasteExtension', () => {

    let ext;
    let grid;

    beforeEach(() => {
        ext = new CopyPasteExtension();
        grid = buildGrid();
        ext.init(grid, {});
    });

    describe('_copy', () => {

        it('should return null when nothing is selected', () => {
            equal(ext._copy(), null);
        });

        it('should copy a single cell as its value', () => {
            grid.state.set('selection', [{ r: 1, c: 0, w: 1, h: 1 }]);
            equal(ext._copy(), 'r1c0');
        });

        it('should join multi-column selections with tabs', () => {
            grid.state.set('selection', [{ r: 1, c: 0, w: 3, h: 1 }]);
            equal(ext._copy(), 'r1c0\tr1c1\tr1c2');
        });

        it('should join multi-row selections with newlines', () => {
            grid.state.set('selection', [{ r: 0, c: 0, w: 2, h: 2 }]);
            equal(ext._copy(), 'r0c0\tr0c1\nr1c0\tr1c1');
        });

        it('should remember the source selection so paste can attribute it', () => {
            grid.state.set('selection', [{ r: 1, c: 0, w: 1, h: 1 }]);
            ext._copy();
            deepEqual(ext._srcSelection, { r: 1, c: 0, w: 1, h: 1 });
        });
    });

    describe('_paste', () => {

        it('should be a no-op when no selection exists', () => {
            ext._paste('hello');
            equal(grid.model.setDataAt.called, false);
        });

        it('should be a no-op when data is empty', () => {
            grid.state.set('selection', [{ r: 0, c: 0, w: 1, h: 1 }]);
            ext._paste('');
            equal(grid.model.setDataAt.called, false);
        });

        it('should write a single value at the selection origin', () => {
            grid.state.set('selection', [{ r: 1, c: 0, w: 1, h: 1 }]);
            ext._paste('hello');
            equal(grid.model.setDataAt.calledOnce, true);
            deepEqual(grid.model.setDataAt.firstCall.args, [1, 0, 'hello']);
            equal(grid.view.updateCell.calledOnce, true);
        });

        it('should expand tab/newline data into a rectangular block from the selection origin', () => {
            grid.state.set('selection', [{ r: 1, c: 1, w: 1, h: 1 }]);
            ext._paste('a\tb\nc\td');
            equal(grid.model.setDataAt.callCount, 4);
            deepEqual(grid.model.setDataAt.getCall(0).args, [1, 1, 'a']);
            deepEqual(grid.model.setDataAt.getCall(1).args, [1, 2, 'b']);
            deepEqual(grid.model.setDataAt.getCall(2).args, [2, 1, 'c']);
            deepEqual(grid.model.setDataAt.getCall(3).args, [2, 2, 'd']);
        });

        it('should skip cells that cannot be edited', () => {
            const canEdit = sinon.stub().returns(true);
            canEdit.withArgs(1, 1).returns(false);
            grid = buildGrid({ canEdit });
            ext.init(grid, {});
            grid.state.set('selection', [{ r: 0, c: 0, w: 1, h: 1 }]);
            ext._paste('a\tb\nc\td');
            // (1,1) is the bottom-right cell; the other three should still be set.
            equal(grid.model.setDataAt.callCount, 3);
        });

        it('should strip a single trailing newline from pasted data', () => {
            grid.state.set('selection', [{ r: 0, c: 0, w: 1, h: 1 }]);
            ext._paste('hello\n');
            equal(grid.model.setDataAt.callCount, 1);
            equal(grid.model.setDataAt.firstCall.args[2], 'hello');
        });

        it('should dispatch cellPasted with src + dest metadata', () => {
            grid.state.set('selection', [{ r: 1, c: 0, w: 1, h: 1 }]);
            // Simulate a prior internal copy so srcSelection is populated.
            grid.state.set('selection', [{ r: 0, c: 0, w: 1, h: 1 }]);
            ext._copy();
            grid.state.set('selection', [{ r: 1, c: 0, w: 1, h: 1 }]);
            ext._paste('x');
            equal(grid.dispatch.calledOnce, true);
            const [eventName, payload] = grid.dispatch.firstCall.args;
            equal(eventName, 'cellPasted');
            equal(payload.srcRowId, 'RID0');
            equal(payload.srcField, 'F0');
            equal(payload.destRowId, 'RID1');
            equal(payload.destField, 'F0');
            equal(payload.data, 'x');
        });

        it('should report srcRowId of -1 when paste was not preceded by an internal copy', () => {
            grid.state.set('selection', [{ r: 1, c: 0, w: 1, h: 1 }]);
            ext._paste('x');
            const payload = grid.dispatch.firstCall.args[1];
            equal(payload.srcRowId, -1);
            equal(payload.srcField, null);
        });
    });
});

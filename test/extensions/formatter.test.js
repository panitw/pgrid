import { equal, deepEqual } from 'assert';
import sinon from 'sinon';
import { FormatterExtension } from '../../src/extensions/formatter';

const buildGrid = (columnModel) => ({
    model: { getColumnModel: () => columnModel }
});

describe('FormatterExtension', () => {

    let ext;

    beforeEach(() => {
        ext = new FormatterExtension();
    });

    describe('cellRender', () => {

        it('should be a no-op when the column has no formatter', () => {
            ext.init(buildGrid({}), {});
            const e = { colIndex: 0, data: 'x', handled: false };
            ext.cellRender(e);
            equal(e.handled, false);
        });

        it('should call the formatter render with cell + colModel + grid context', () => {
            const formatter = { render: sinon.spy() };
            const colModel = { formatter };
            const grid = buildGrid(colModel);
            ext.init(grid, {});
            const e = { colIndex: 0, data: 42, cell: {}, cellContent: {}, handled: false };
            ext.cellRender(e);
            equal(formatter.render.calledOnce, true);
            const arg = formatter.render.firstCall.args[0];
            equal(arg.colIndex, 0);
            equal(arg.data, 42);
            equal(arg.colModel, colModel);
            equal(arg.grid, grid);
        });

        it('should mark the event handled after a render formatter runs', () => {
            const formatter = { render: () => {} };
            ext.init(buildGrid({ formatter }), {});
            const e = { colIndex: 0, handled: false };
            ext.cellRender(e);
            equal(e.handled, true);
        });

        it('should iterate through an array of formatters in order', () => {
            const calls = [];
            const formatter = [
                { render: () => calls.push('a') },
                { render: () => calls.push('b') },
                { render: () => calls.push('c') }
            ];
            ext.init(buildGrid({ formatter }), {});
            ext.cellRender({ colIndex: 0, handled: false });
            deepEqual(calls, ['a', 'b', 'c']);
        });

        it('should not call the render method if the formatter only has update', () => {
            const formatter = { update: sinon.spy() };
            ext.init(buildGrid({ formatter }), {});
            const e = { colIndex: 0, handled: false };
            ext.cellRender(e);
            equal(formatter.update.called, false);
            equal(e.handled, false);
        });
    });

    describe('cellUpdate', () => {

        it('should call the formatter update when one is defined', () => {
            const formatter = { update: sinon.spy() };
            ext.init(buildGrid({ formatter }), {});
            ext.cellUpdate({ colIndex: 0, handled: false });
            equal(formatter.update.calledOnce, true);
        });

        it('should fall back to render if no update method is defined', () => {
            const formatter = { render: sinon.spy() };
            ext.init(buildGrid({ formatter }), {});
            ext.cellUpdate({ colIndex: 0, handled: false });
            equal(formatter.render.calledOnce, true);
        });

        it('should leave the event unhandled when neither render nor update is defined', () => {
            const formatter = {};
            ext.init(buildGrid({ formatter }), {});
            const e = { colIndex: 0, handled: false };
            ext.cellUpdate(e);
            equal(e.handled, false);
        });

        it('should iterate through an array of formatters', () => {
            const calls = [];
            const formatter = [
                { update: () => calls.push('u1') },
                { render: () => calls.push('r2') }
            ];
            ext.init(buildGrid({ formatter }), {});
            ext.cellUpdate({ colIndex: 0, handled: false });
            deepEqual(calls, ['u1', 'r2']);
        });
    });
});

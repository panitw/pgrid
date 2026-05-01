import { equal } from 'assert';
import sinon from 'sinon';
import { CheckboxColumnExtension } from '../../src/extensions/checkbox-column';

const buildEvent = (data) => {
    const cellContent = document.createElement('div');
    return {
        rowIndex: 1,
        colIndex: 0,
        data,
        cellContent,
        handled: false
    };
};

describe('CheckboxColumnExtension', () => {

    let ext;
    let setDataAt;
    let canEdit;

    beforeEach(() => {
        setDataAt = sinon.spy();
        canEdit = sinon.stub().returns(false);
        ext = new CheckboxColumnExtension();
        ext.init({ model: { setDataAt, canEdit } }, {});
    });

    describe('cellRender', () => {

        it('should leave non-boolean cells untouched', () => {
            const e = buildEvent('hello');
            ext.cellRender(e);
            equal(e.cellContent.innerHTML, '');
            equal(e.handled, false);
        });

        it('should render an unchecked checkbox for false', () => {
            const e = buildEvent(false);
            ext.cellRender(e);
            const input = e.cellContent.querySelector('input[type="checkbox"]');
            equal(input !== null, true);
            equal(input.checked, false);
            equal(e.handled, true);
        });

        it('should render a checked checkbox for true', () => {
            const e = buildEvent(true);
            ext.cellRender(e);
            const input = e.cellContent.querySelector('input[type="checkbox"]');
            equal(input.checked, true);
        });

        it('should enable pointer events on the cell when the cell is editable', () => {
            canEdit.returns(true);
            const e = buildEvent(false);
            ext.cellRender(e);
            equal(e.cellContent.style.pointerEvents, 'all');
        });

        it('should not enable pointer events when the cell is not editable', () => {
            canEdit.returns(false);
            const e = buildEvent(false);
            ext.cellRender(e);
            equal(e.cellContent.style.pointerEvents, '');
        });

        it('should write back to the model when the checkbox toggles', () => {
            const e = buildEvent(false);
            ext.cellRender(e);
            const input = e.cellContent.querySelector('input[type="checkbox"]');
            input.checked = true;
            input.dispatchEvent(new Event('change'));
            equal(setDataAt.calledOnce, true);
            equal(setDataAt.firstCall.args[0], 1);
            equal(setDataAt.firstCall.args[1], 0);
            equal(setDataAt.firstCall.args[2], true);
        });
    });
});

import { equal, deepEqual, notEqual } from 'assert';
import sinon from 'sinon';
import { DataTable } from '../../src/data/table';

describe('DataTable', () => {

    let defaultModel = null;
    let mockExtension = null;
    let table = null;
    let eventSpy = null;

    beforeEach(function() {
        defaultModel = {
            format: 'rows',
            data: [
                {f1: 10, f2: 's1', f3: true, f4: new Date('2019-01-01'), f5: {x: 10, y: 20}},
                {f1: 20, f2: 's2', f3: false, f4: new Date('2019-01-02'), f5: {x: 11, y: 21}},
                {f1: 30, f2: 's3', f3: true, f4: new Date('2019-01-03'), f5: {x: 12, y: 22}},
                {f1: 40, f2: 's4', f3: false, f4: new Date('2019-01-04'), f5: {x: 13, y: 23}},
                {f1: 50, f2: 's5', f3: true, f4: new Date('2019-01-05'), f5: {x: 14, y: 24}}
            ]
        };

        mockExtension = {
            executeExtension: sinon.spy()
        }

        table = new DataTable(defaultModel, mockExtension);
        eventSpy = sinon.spy();
        table.listen('dataChanged', eventSpy);
    });

    it('should return correct row count after constructed with data', () => {
        equal(table.getRowCount(), 5);
    });

    it('should return correct data after constructed with data', () => {
        deepEqual(table.getAllData(), defaultModel.data);
    });

    it('should return right data at the specified index and field', () => {
        for (let i=0; i<defaultModel.data.length; i++) {
            for (let f in defaultModel.data[i]) {
                deepEqual(table.getDataAt(i, f), defaultModel.data[i][f]);
            }
        }
        equal(table.getDataAt(0, 'unknown_field'), undefined);
        equal(table.getDataAt(defaultModel.data.length, 'f1'), undefined);
    });

    it('should return right data at the specified rowId', () => {
        for (let i=0; i<defaultModel.data.length; i++) {
            for (let f in defaultModel.data[i]) {
                deepEqual(table.getData(table.getRowId(i), f), defaultModel.data[i][f]);
            }
        }
    });

    it('should return right row data at the specified index', () => {
        for (let i=0; i<defaultModel.data.length; i++) {
            deepEqual(table.getRowDataAt(i), defaultModel.data[i]);
        }
        equal(table.getRowDataAt(-1), undefined);
        equal(table.getRowDataAt(defaultModel.data.length), undefined);
    });

    it('should return right row data at the specified rowId', () => {
        for (let i=0; i<defaultModel.data.length; i++) {
            deepEqual(table.getRowData(table.getRowId(i)), defaultModel.data[i]);
        }
        equal(table.getRowData('INVALID_ROW_ID'), undefined);
    });

    it('should return undefined for rowId if the index is out of range', () => {
        equal(table.getRowId(-1), undefined);
        equal(table.getRowId(5), undefined);
        notEqual(table.getRowId(0), undefined);
    });

    it('should set the data by index correctly', () => {
        equal(table.getDataAt(0, 'f1'), 10);
        table.setDataAt(0, 'f1', 100);
        equal(table.getDataAt(0, 'f1'), 100);
    });

    it('should dispatch "dataChanged" event when the new data is set', () => {
        const rowId0 = table.getRowId(0);
        const clock = sinon.useFakeTimers();
        table.setDataAt(0, 'f1', 200);

        //Event is called after 100ms, so turn the clock forward 100ms
        clock.tick(100);

        equal(eventSpy.callCount, 1);
        deepEqual(eventSpy.getCall(0).args[0], {
            updates: [{
                changeType: 'fieldChange',
                rowId: rowId0,
                field: 'f1',
                data: 200,
                cancel: false
            }]
        });

        clock.restore();
    });

    it('should call extension correctly when setting data', () => {
        const rowId0 = table.getRowId(0);
        table.setDataAt(0, 'f1', 100);

        const testEventArg = {
            changeType: 'fieldChange',
			rowId: rowId0,
			field: 'f1',
			data: 100,
			cancel: false
        };

        equal(mockExtension.executeExtension.getCall(0).args[0], 'dataBeforeUpdate');
        deepEqual(mockExtension.executeExtension.getCall(0).args[1], testEventArg);

        equal(mockExtension.executeExtension.getCall(1).args[0], 'dataAfterUpdate');
        deepEqual(mockExtension.executeExtension.getCall(1).args[1], testEventArg);

        equal(mockExtension.executeExtension.getCall(2).args[0], 'dataFinishUpdate');
        deepEqual(mockExtension.executeExtension.getCall(2).args[1], {
            updates: [testEventArg]
        });
    });

    it('should not dispatch any event if the value does not change when setData', () => {
        const clock = sinon.useFakeTimers();
        table.setDataAt(0, 'f1', 10);

        //Event is called after 100ms, so turn the clock forward 100ms
        clock.tick(100);

        equal(eventSpy.callCount, 0);
        equal(mockExtension.executeExtension.callCount, 0);

        clock.restore();
    });

    it('should cancel the update if the dataBeforeUpdate set cancel flag to "true"', () => {
        const rowId0 = table.getRowId(0);
        mockExtension.executeExtension = (ext, extArg) => {
            if (ext === 'dataBeforeUpdate') {
                extArg.cancel = true;
            }
        };
        let spy = sinon.spy(mockExtension, 'executeExtension');
        table.setDataAt(0, 'f1', 100);
        equal(table.getDataAt(0, 'f1'), 10);
        equal(spy.callCount, 2);
        equal(spy.getCall(0).args[0], 'dataBeforeUpdate');
        equal(spy.getCall(1).args[0], 'dataFinishUpdate');
        deepEqual(spy.getCall(1).args[1], {
            updates: [{
                changeType: 'fieldChange',
                rowId: rowId0,
                field: 'f1',
                data: 100,
                cancel: true
            }]
        });
    });

    it('should not set the data at the invalid row index', () => {
        equal(table.getDataAt(100, 'f1'), undefined);
        table.setDataAt(100, 'f1', 100);
        equal(table.getDataAt(100, 'f1'), undefined);
    });

    it('should set the data by rowId correctly', () => {
        const i0RowId = table.getRowId(0);
        equal(table.getDataAt(0, 'f1'), 10);
        table.setData(i0RowId, 'f1', 100);
        equal(table.getData(i0RowId, 'f1'), 100);
        equal(table.getDataAt(0, 'f1'), 100);
    });

    it('should add row correctly', () => {
        const newRow = {f1: 60, f2: 's6', f3: false, f4: new Date('2019-01-06'), f5: {x: 15, y: 25}};
        const rowCountBefore = table.getRowCount();
        table.addRow(newRow);
        equal(table.getRowCount(), rowCountBefore + 1);
        for (let f in newRow) {
            deepEqual(table.getDataAt(table.getRowCount() - 1, f), newRow[f]);
        }
        deepEqual(table.getRowDataAt(table.getRowCount() - 1), newRow);

        //Event rowAdded is fired
        equal(eventSpy.callCount, 1);
        deepEqual(eventSpy.getCall(0).args[0], {
            updates: [{
                changeType: 'rowAdded',
                rowId: table.getRowId(table.getRowCount() - 1),
                data: newRow
            }]
        });
    });

    it('should insert row at index 0 correctly', () => {
        const newRow = {f1: 60, f2: 's6', f3: false, f4: new Date('2019-01-06'), f5: {x: 15, y: 25}};
        const rowCountBefore = table.getRowCount();
        table.insertRow(0, newRow);
        equal(table.getRowCount(), rowCountBefore + 1);
        for (let f in newRow) {
            deepEqual(table.getDataAt(0, f), newRow[f]);
        }
        deepEqual(table.getRowDataAt(0), newRow);

        //Event rowAdded is fired
        equal(eventSpy.callCount, 1);
        deepEqual(eventSpy.getCall(0).args[0], {
            updates: [{
                changeType: 'rowAdded',
                rowId: table.getRowId(0),
                data: newRow
            }]
        });
    });

    it('should remove row by rowId correctly', () => {
        let rowId0 = table.getRowId(0);
        const rowCountBefore = table.getRowCount();
        table.removeRow(rowId0);
        equal(table.getRowCount(), rowCountBefore - 1);
        equal(eventSpy.callCount, 1);
        deepEqual(eventSpy.getCall(0).args[0], {
            updates: [{
                changeType: 'rowRemoved',
                rowId: rowId0
            }]
        });
    });

    it('should remove row by index correctly', () => {
        let rowId0 = table.getRowId(0);
        const rowCountBefore = table.getRowCount();
        table.removeRowAt(0);
        equal(table.getRowCount(), rowCountBefore - 1);
        equal(eventSpy.callCount, 1);
        deepEqual(eventSpy.getCall(0).args[0], {
            updates: [{
                changeType: 'rowRemoved',
                rowId: rowId0
            }]
        });
    });

});
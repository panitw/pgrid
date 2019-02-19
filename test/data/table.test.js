import { withData } from 'leche';
import { equal, deepEqual, notEqual } from 'assert';
import { cloneDeep } from 'lodash';
import sinon from 'sinon';
import { DataTable } from '../../src/data/table';

const rowsData = [
    {f1: 10, f2: 's1', f3: true, f4: new Date('2019-01-01'), f5: {x: 10, y: 20}},
    {f1: 20, f2: 's2', f3: false, f4: new Date('2019-01-02'), f5: {x: 11, y: 21}},
    {f1: 30, f2: 's3', f3: true, f4: new Date('2019-01-03'), f5: {x: 12, y: 22}},
    {f1: 40, f2: 's4', f3: false, f4: new Date('2019-01-04'), f5: {x: 13, y: 23}},
    {f1: 50, f2: 's5', f3: true, f4: new Date('2019-01-05'), f5: {x: 14, y: 24}}
];

const arrayData = [
    [10, 's1', true, new Date('2019-01-01'), {x: 10, y: 20}],
    [20, 's2', false, new Date('2019-01-02'), {x: 11, y: 21}],
    [30, 's3', true, new Date('2019-01-03'), {x: 12, y: 22}],
    [40, 's4', false, new Date('2019-01-04'), {x: 13, y: 23}],
    [50, 's5', true, new Date('2019-01-05'), {x: 14, y: 24}],
];

describe('DataTable', () => {
    withData({
        'rows data type': [
            {
                format: 'rows',
                data: rowsData
            },
            {f1: 60, f2: 's6', f3: false, f4: new Date('2019-01-06'), f5: {x: 15, y: 25}},
            {f1: 60, f2: 's6', f3: false, f4: new Date('2019-01-06'), f5: {x: 15, y: 25}}
        ],
        'array data type': [
            {
                format: 'array',
                fields: ['f1', 'f2', 'f3', 'f4', 'f5'],
                data: arrayData,
            },
            [60, 's6', false, new Date('2019-01-06'), {x: 15, y: 25}],
            {f1: 60, f2: 's6', f3: false, f4: new Date('2019-01-06'), f5: {x: 15, y: 25}}
        ]
    }, (model, row, compareRow) => {

        let defaultModel = null;
        let newRow = null;
        let newRowToCompare = null;
        let mockExtension = null;
        let table = null;
        let eventSpy = null;

        beforeEach(() => {
            //Clone test data
            defaultModel = cloneDeep(model);
            newRow = cloneDeep(row);
            newRowToCompare = cloneDeep(compareRow);

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
            deepEqual(table.getAllData(), rowsData);
        });

        it('should generate unique rowIds', () => {
            const ids = [];
            const count = table.getRowCount();
            for (let i=0; i<count; i++) {
                let rowId = table.getRowId(i);
                equal(ids.indexOf(rowId), -1);
                ids.push(rowId);
            }
        });

        it('should return right data at the specified index and field', () => {
            for (let i=0; i<rowsData.length; i++) {
                for (let f in rowsData[i]) {
                    deepEqual(table.getDataAt(i, f), rowsData[i][f]);
                }
            }
            equal(table.getDataAt(0, 'unknown_field'), undefined);
            equal(table.getDataAt(rowsData.length, 'f1'), undefined);
        });

        it('should return right data at the specified rowId', () => {
            for (let i=0; i<rowsData.length; i++) {
                for (let f in rowsData[i]) {
                    deepEqual(table.getData(table.getRowId(i), f), rowsData[i][f]);
                }
            }
        });

        it('should return right row data at the specified index', () => {
            for (let i=0; i<rowsData.length; i++) {
                deepEqual(table.getRowDataAt(i), rowsData[i]);
            }
            equal(table.getRowDataAt(-1), undefined);
            equal(table.getRowDataAt(rowsData.length), undefined);
        });

        it('should return right row data at the specified rowId', () => {
            for (let i=0; i<rowsData.length; i++) {
                deepEqual(table.getRowData(table.getRowId(i)), rowsData[i]);
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
            const rowCountBefore = table.getRowCount();
            table.addRow(newRow);
            equal(table.getRowCount(), rowCountBefore + 1);
            for (let f in newRowToCompare) {
                deepEqual(table.getDataAt(table.getRowCount() - 1, f), newRowToCompare[f]);
            }
            deepEqual(table.getRowDataAt(table.getRowCount() - 1), newRowToCompare);

            //Event rowAdded is fired
            equal(eventSpy.callCount, 1);
            deepEqual(eventSpy.getCall(0).args[0], {
                updates: [{
                    changeType: 'rowAdded',
                    rowId: table.getRowId(table.getRowCount() - 1),
                    data: newRowToCompare
                }]
            });
        });

        it('should insert row at index 0 correctly', () => {
            const rowCountBefore = table.getRowCount();
            table.insertRow(0, newRow);
            equal(table.getRowCount(), rowCountBefore + 1);
            for (let f in newRowToCompare) {
                deepEqual(table.getDataAt(0, f), newRowToCompare[f]);
            }
            deepEqual(table.getRowDataAt(0), newRowToCompare);

            //Event rowAdded is fired
            equal(eventSpy.callCount, 1);
            deepEqual(eventSpy.getCall(0).args[0], {
                updates: [{
                    changeType: 'rowAdded',
                    rowId: table.getRowId(0),
                    data: newRowToCompare
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

        it('should remove all rows correctly', () => {
            const clock = sinon.useFakeTimers();
            notEqual(table.getRowCount(), 0);
            table.removeAllRows();

            equal(table.getRowCount(), 0);
            equal(table.getRowDataAt(0), undefined);
            equal(table.getRowId(0), undefined);
            equal(table.getDataAt(0, 'f1'), undefined);

            clock.tick(100);
            equal(eventSpy.callCount, 1);
            deepEqual(eventSpy.getCall(0).args[0], {
                updates: [{
                    changeType: 'global',
                }]
            });
            clock.restore();
        });

        it('should correctly search string data', () => {
            table.search('s2');
            equal(table.getRowCount(), 1);
            deepEqual(table.getRowDataAt(0), rowsData[1]);

            //Global event was dispatched
            equal(eventSpy.callCount, 1);
            deepEqual(eventSpy.getCall(0).args[0], {
                updates: [{
                    changeType: 'global',
                }]
            });

            //Clear search
            table.clearSearch();
            equal(table.getRowCount(), rowsData.length);
            for (let i=0; i<rowsData.length; i++) {
                deepEqual(table.getRowDataAt(i), rowsData[i]);
            }
        });

        it('should correctly search non-string data', () => {
            table.search('true');
            equal(table.getRowCount(), 3);
            deepEqual(table.getRowDataAt(0), rowsData[0]);
            deepEqual(table.getRowDataAt(1), rowsData[2]);
            deepEqual(table.getRowDataAt(2), rowsData[4]);
        });

        it('should be able to re-search again', () => {
            table.search('s2');
            equal(table.getRowCount(), 1);
            deepEqual(table.getRowDataAt(0), rowsData[1]);

            table.search('true');
            equal(table.getRowCount(), 3);
            deepEqual(table.getRowDataAt(0), rowsData[0]);
            deepEqual(table.getRowDataAt(1), rowsData[2]);
            deepEqual(table.getRowDataAt(2), rowsData[4]);
        });
    });

});
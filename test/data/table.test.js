import { equal, deepEqual, notEqual } from 'assert';
import sinon from 'sinon';
import { DataTable } from '../../src/data/table';

describe('DataTable', () => {

    let defaultModel = null;
    let mockExtension = null;
    let table = null;

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
    });

});
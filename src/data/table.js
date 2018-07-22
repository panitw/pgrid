import EventDispatcher from "../grid/event";

export class DataTable extends EventDispatcher {
    
    constructor (initialData) {
        super();

        this._idRunner = 0;
        this._rid = [];
        this._rowMap = {};

        if (Array.isArray(initialData)) {
            this._data = initialData;
            for (let i=0; i<this._data.length; i++) {
                let rid = this._generateRowId();
                this._rid.push(rid);
                this._rowMap[rid] = this._data[i];
            }
        } else {
            this._data = [];
        }
    }

    getData (rowId, field) {
        let row = this._rowMap[rowId];
        if (row) {
            return row[field];
        }
        return undefined;
    }

    getDataAt (rowIndex, field) {
        let row = this._data[rowIndex];
        if (row) {
            return row[field];
        }
        return undefined;
    }

    getRowData (rowId) {
        return this._rowMap[rowId];
    }

    getRowDataAt (rowIndex) {
        return this._data[rowIndex];
    }

    setData (rowId, field, value) {
        let row = this._rowMap[rowId];
        if (row) {
            row[field] = value;
        }
    }

    setDataAt (rowIndex, field, value) {
        let row = this._data[rowIndex];
        if (row) {
            row[field] = value;
        }
    }
    
    insertRow (rowIndex, rowData) {
        this._data.splice(rowIndex, 0, rowData);
        let newRowId = this._generateRowId();
        this._rowMap[newRowId] = rowData;
    }

    removeRow (rid) {
        let row = this._rowMap[rid];
        let index = this._data.indexOf(row);
        this._data.splice(index, 1);
        delete this._rowMap[rid];
    }

    removeRowAt (index) {
        let rid = Object.keys(this._rowMap).find(key => object[key] === value);
        delete this._rowMap[rid];
        this._data.splice(index, 1);
    }

    _generateRowId () {
        this._idRunner++;
        return '' + this._idRunner;
    }

}
import { EventDispatcher } from "../grid/event";

export class DataTable extends EventDispatcher {
    
    constructor (dataModel, extension) {
        super();

        this._extension = extension;
        this._idRunner = 0;
        this._rid = [];
        this._rowMap = {};
		this._blockEvent = false;

        let { format, data, fields } = dataModel;

        // Set default format at rows
        if (!format) {
            format = 'rows';
        }

        if (Array.isArray(data)) {
            if (format === 'rows') {
                this._data = data;
                for (let i=0; i<this._data.length; i++) {
                    let rid = this._generateRowId();
                    this._rid.push(rid);
                    this._rowMap[rid] = this._data[i];
                }
            } else
            if (format === 'array') {
                if (Array.isArray(fields)) {
                    this._data = [];
                    for (let i=0; i<data.length; i++) {
                        let rid = this._generateRowId();
                        this._rid.push(rid);
                        let newObj = this._createObject(data[i], fields);
                        this._rowMap[rid] = newObj;
                        this._data.push(newObj);
                    }
                }
            }
        } else {
            this._data = [];
        }
    }

    getRowCount () {
        return this._data.length;
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

    getRowIndex (rowId) {
        return this._rid.indexOf(rowId);
    }

    setData (rowId, field, value) {
        const beforeUpdateArg = {
			rowId: rowId,
			field: field,
			data: value,
			cancel: false
        };        
        if (!this._blockEvent) {
			this._blockEvent = true;
			this._extension.executeExtension('dataBeforeUpdate', beforeUpdateArg);
			this._blockEvent = false;
		}
		if (!beforeUpdateArg.cancel) {
            let row = this._rowMap[rowId];
            if (row) {
                row[field] = beforeUpdateArg.data;
                if (!this._blockEvent) {
                    this._blockEvent = true;
                    this._extension.executeExtension('dataAfterUpdate', beforeUpdateArg);
                    this._blockEvent = false;
                }
            }
		}
    }

    setDataAt (rowIndex, field, value) {
        const rowId = this._rid[rowIndex];
        if (rowId !== undefined) {
            this.setData(rowId, field, value);
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

    _createObject(arrayValues, fields) {
        let newObj = {};
        for (let i=0; i<fields.length; i++) {
            newObj[fields[i]] = arrayValues[i];
        }
        return newObj;
    }

}
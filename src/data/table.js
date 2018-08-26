import { EventDispatcher } from "../grid/event";

export class DataTable extends EventDispatcher {
    
    constructor (dataModel, extension) {
        super();

        this._extension = extension;
        this._idRunner = 0;
        this._rid = [];
        this._rowMap = {};
        this._data = [];
        this._blockEvent = false;
        this._processedEvent = [];

        let { format, data, fields } = dataModel;
        
        // Set default format at rows
        if (!format) {
            format = 'rows';
        }
        this._dataFormat = format;
        this._fields = fields;

        if (Array.isArray(data)) {
            for (let i=0; i<data.length; i++) {
                this.addRow(data[i]);
            }
        } else {
            this._data = [];
        }
    }

    getRowCount () {
        return this._data.length;
    }

    getAllData() {
        return this._data;
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

    getRowId (rowIndex) {
        return this._rid[rowIndex];
    }

    setData (rowId, field, value) {
        const beforeUpdateArg = {
			rowId: rowId,
			field: field,
			data: value,
			cancel: false
        };
        
        this._processedEvent.push(beforeUpdateArg);

        let blocked = false;
        
        if (!this._blockEvent) {
			this._blockEvent = true;
			this._extension.executeExtension('dataBeforeUpdate', beforeUpdateArg);
			this._blockEvent = false;
		} else {
            blocked = true;
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

        if (!blocked) {
            this._extension.executeExtension('dataFinishUpdate', {
                updates: this._processedEvent
            });
            //Clear processed event list            
            this._processedEvent.length = 0;
        }
    }

    setDataAt (rowIndex, field, value) {
        const rowId = this._rid[rowIndex];
        if (rowId !== undefined) {
            this.setData(rowId, field, value);
        }
    }

    addRow (rowData) {
        const count = this.getRowCount();
        this.insertRow(count, rowData);
    }
    
    insertRow (rowIndex, rowData) {
        if (this._dataFormat === 'rows') {
            let rid = this._generateRowId();
            this._rid.splice(rowIndex, 0, rid);
            this._rowMap[rid] = rowData;
            this._data.splice(rowIndex, 0, rowData);
        } else
        if (this._dataFormat === 'array') {
            if (Array.isArray(this._fields)) {
                let rid = this._generateRowId();
                this._rid.splice(rowIndex, 0, rid);
                let newObj = this._createObject(rowData, this._fields);
                this._rowMap[rid] = newObj;
                this._data.splice(rowIndex, 0, newObj);
            }
        }
    }

    removeRow (rid) { 
        let row = this._rowMap[rid];
        let index = this._data.indexOf(row);
        this._data.splice(index, 1);
        this._rid.splice(index, 1);
        delete this._rowMap[rid];
    }

    removeRowAt (index) {
        let rid = Object.keys(this._rowMap).find(key => object[key] === value);
        delete this._rowMap[rid];
        this._data.splice(index, 1);
        this._rid.splice(index, 1);
    }

    removeAllRows () {
        this._rid = [];
        this._rowMap = {};
        this._data = [];        
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
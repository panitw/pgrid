import { EventDispatcher } from "../grid/event";

const CHANGE_EVENT_NAME = 'dataChanged';

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
        this._transformedRid = [];
        this._searchQuery = null;
        this._searchFields = null;
        this._freezeCount = 0;

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
        return this._transformedRid.length;
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
        let rowId = this._transformedRid[rowIndex];
        if (rowId) {
            let row = this._rowMap[rowId];
            if (row) {
                return row[field];
            }
        }
        return undefined;
    }

    getRowData (rowId) {
        return this._rowMap[rowId];
    }

    getRowDataAt (rowIndex) {
        let rowId = this._transformedRid[rowIndex];
        if (rowId) {
            return this._rowMap[rowId];
        }
        return undefined;
    }

    getRowIndex (rowId) {
        return this._transformedRid.indexOf(rowId);
    }

    getRowId (rowIndex) {
        return this._transformedRid[rowIndex];
    }

    freeze () {
        this._freezeCount++;
    }

    unfreeze () {
        this._freezeCount--;
        if (this._freezeCount < 0) {
            this._freezeCount = 0;
        }
    }

    setData (rowId, field, value) {

        let row = this._rowMap[rowId];

        //Skip updating if the data is not changing
        if (row && row[field] === value) {
            return;
        }

        const beforeUpdateArg = {
            changeType: 'fieldChange',
			rowId: rowId,
            field: field,
            prevData: row[field],
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
            let eventArg = {
                updates: this._processedEvent
            };
            this._extension.executeExtension('dataFinishUpdate', eventArg);
            if (this._freezeCount === 0) {
                setTimeout(() => {
                    this.dispatch(CHANGE_EVENT_NAME, eventArg);
                }, 100);
            }
            this._processedEvent = [];
        }
    }

    setDataAt (rowIndex, field, value) {
        const rowId = this._transformedRid[rowIndex];
        if (rowId !== undefined) {
            this.setData(rowId, field, value);
        }
    }

    addRow (rowData) {
        const count = this.getRowCount();
        this.insertRow(count, rowData);
    }

    insertRow (rowIndex, rowData) {
        let rid = null;
        let inserted = false;
        if (this._dataFormat === 'rows') {
            rid = this._generateRowId();
            this._rid.splice(rowIndex, 0, rid);
            this._rowMap[rid] = rowData;
            this._data.splice(rowIndex, 0, rowData);
            inserted = true;
        } else
        if (this._dataFormat === 'array') {
            if (Array.isArray(this._fields)) {
                rid = this._generateRowId();
                this._rid.splice(rowIndex, 0, rid);
                let newObj = this._createObject(rowData, this._fields);
                this._rowMap[rid] = newObj;
                this._data.splice(rowIndex, 0, newObj);
                inserted = true;
            }
        }

        //Dispatch change event
        if (inserted) {
            if (this._freezeCount === 0) {
                const eventArg = {
                    updates: [{
                        changeType: 'rowAdded',
                        rowId: rid,
                        data: this.getRowData(rid)
                    }]
                };
                this.dispatch(CHANGE_EVENT_NAME, eventArg);
            }
        }

        //Re-apply transformation if it's already there
        if (this._searchQuery) {
            this.search(this._searchQuery, this._searchFields);
        } else {
            this._transformedRid = this._rid.slice();
        }
    }

    removeRow (rid) {
        let row = this._rowMap[rid];
        let index = this._data.indexOf(row);
        let tIndex = this._transformedRid.indexOf(rid);
        this._data.splice(index, 1);
        this._rid.splice(index, 1);
        this._transformedRid.splice(tIndex, 1);
        delete this._rowMap[rid];

        if (this._freezeCount === 0) {
            const eventArg = {
                updates: [{
                    changeType: 'rowRemoved',
                    rowId: rid
                }]
            };
            this.dispatch(CHANGE_EVENT_NAME, eventArg);
        }
    }

    removeRowAt (index) {
        let rid = this.getRowId(index);
        this.removeRow(rid);
    }

    removeAllRows () {
        this._rid = [];
        this._transformedRid = [];
        this._rowMap = {};
        this._data = [];

        if (this._freezeCount === 0) {
            const eventArg = {
                updates: [{
                    changeType: 'global'
                }]
            };
            setTimeout(() => {
                this.dispatch(CHANGE_EVENT_NAME, eventArg);
            }, 100);
        }
    }

    search (query, fields) {
        //Store for later use
        this._searchQuery = query;
        this._searchFields = fields;

        //Cache field map for faster field search
        let fieldMap = null;
        if (fields) {
            fieldMap = fields.reduce((acc, val) => {
                acc[val] = true;
            }, {});
        }

        //Create regex array
        let queryRegex = null;
        if (Array.isArray(query)) {
            queryRegex = query.map(q => new RegExp(q, 'i'));
        } else {
            queryRegex = [new RegExp(query, 'i')];
        }

        //Filter rows
        this._transformedRid = this._rid.filter((rid) => {
            const rowData = this._rowMap[rid];
            if (rowData) {
                for (var field in rowData) {
                    if ((!fieldMap || fieldMap[field]) && rowData[field]) {
                        for (let i=0; i<queryRegex.length; i++) {
                            const regex = queryRegex[i];
                            if (regex.test(rowData[field])) {
                                return true;
                            }
                        }
                    }
                }
            }
        });

        //Dispatch global change event
        if (this._freezeCount === 0) {
            const eventArg = {
                updates: [{
                    changeType: 'global'
                }]
            };
            this.dispatch(CHANGE_EVENT_NAME, eventArg);
        }
    }

    clearSearch () {
        this._transformedRid = this._rid.slice();
        this._searchQuery = null;
        this._searchFields = null;
        if (this._freezeCount === 0) {
            const eventArg = {
                updates: [{
                    changeType: 'global'
                }]
            };
            this.dispatch(CHANGE_EVENT_NAME, eventArg);
        }
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
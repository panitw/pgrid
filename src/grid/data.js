import EventDispatcher from './event';

class Data extends EventDispatcher {

	constructor (dataModel, extension) {
		super();
		this._dataModel = dataModel;
		this._extension = extension;
		this._blockEvent = false;
	}

	getDataAt (rowIndex, colIndex) {
		if (this._dataModel.data[rowIndex]) {
			return this._dataModel.data[rowIndex][colIndex];
		}
		return undefined;
	}

	setDataAt (rowIndex, colIndex, data) {
		const beforeUpdateArg = {
			rowIndex: rowIndex,
			colIndex: colIndex,
			data: data,
			cancel: false
		};
		if (!this._blockEvent) {
			this._blockEvent = true;
			this._extension.executeExtension('dataBeforeUpdate', beforeUpdateArg);
			this._blockEvent = false;
		}
		if (!beforeUpdateArg.cancel) {
			if (!this._dataModel.data[rowIndex]) {
				this._dataModel.data[rowIndex] = [];
			}
			this._dataModel.data[rowIndex][colIndex] = beforeUpdateArg.data;
			if (!this._blockEvent) {
				this._blockEvent = true;
				this._extension.executeExtension('dataAfterUpdate', beforeUpdateArg);
				this._blockEvent = false;
			}
		}
		this._updating = false;
	}

	getRowCount () {
		if (this._dataModel.data) {
			return this._dataModel.data.length;
		} else {
			return 0;
		}
	}

	getAllData () {
		return this._dataModel.data;
	}

	addRow (rowData) {
		this.insertRow(this.getRowCount(), rowData);
	}

	insertRow (atIndex, rowData) {
		this._dataModel.data.splice(atIndex, 0, rowData);
	}
}

export default Data;
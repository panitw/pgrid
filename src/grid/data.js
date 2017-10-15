import EventDispatcher from './event';

class Data extends EventDispatcher {

	constructor (dataModel, extension) {
		super();
		this._dataModel = dataModel;
		this._extension = extension;
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
		this._extension.executeExtension('dataBeforeUpdate', beforeUpdateArg);
		if (!beforeUpdateArg.cancel) {
			if (!this._dataModel.data[rowIndex]) {
				this._dataModel.data[rowIndex] = [];
			}
			this._dataModel.data[rowIndex][colIndex] = beforeUpdateArg.data;
			this._extension.executeExtension('dataAfterUpdate', beforeUpdateArg);
		}
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
}

module.exports = Data;
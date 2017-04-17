import EventDispatcher from './event';

class Data extends EventDispatcher {

	constructor (dataModel) {
		super();
		this._dataModel = dataModel;
	}

	getDataAt (rowIndex, colIndex) {
		if (this._dataModel.data[rowIndex]) {
			return this._dataModel.data[rowIndex][colIndex];
		}
		return undefined;
	}

	setDataAt (rowIndex, colIndex, data) {
		if (!this._dataModel.data[rowIndex]) {
			this._dataModel.data[rowIndex] = [];
		}
		this._dataModel.data[rowIndex][colIndex] = data;
	}
}

module.exports = Data;
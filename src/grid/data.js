import EventDispatcher from './event';

class Data extends EventDispatcher {

	constructor(dataModel) {
		super();
		this._dataModel = dataModel;
	}

	getRowCount () {
		return this._dataModel.length;
	}

	getContentRowCount () {
		let count = this._dataModel.length;
		if (this._dataModel.headerRows !== undefined) {
			count -= this._dataModel.headerRows;
		}
		if (this._dataModel.footerRows !== undefined) {
			count -= this._dataModel.footerRows;
		}
		return count;
	}

	getHeaderRowCount () {
		if (this._dataModel.headerRows !== undefined) {
			return this._dataModel.headerRows;
		}
		return 0;
	}

	getFooterRowCount () {
		if (this._dataModel.footerRows !== undefined) {
			return this._dataModel.footerRows;
		}
		return 0;
	}

}

module.exports = Data;
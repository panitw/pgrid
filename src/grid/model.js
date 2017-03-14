import EventDispatcher from './event';

class Model extends EventDispatcher {

	constructor (config, dataModel) {
		super();
		this._config = config;
		this._dataModel = dataModel;

		this._columnModel = {};
		this._rowModel = {};

		if (this._config.columns) {
			for (let i=0; i<this._config.columns.length; i++) {
				this._columnModel[this._config.columns[i].i] = this._config.columns[i];
			}			
		}
		if (this._config.rows) {
			for (let i=0; i<this._config.rows.length; i++) {
				this._rowModel[this._config.rows[i].i] = this._config.rows[i];
			}
		}

		this._calcTotalSize();
	}

	getTopFreezeSize () {
		if (this._config.freezePane && this._config.freezePane.top > 0) {
			let sum = 0;
			for (let i=0; i<this._config.freezePane.top; i++) {
				sum += this.getRowHeight(i);
			}
			return sum;
		}
		return 0;
	}

	getLeftFreezeSize () {
		if (this._config.freezePane && this._config.freezePane.left > 0) {
			let sum = 0;
			for (let i=0; i<this._config.freezePane.left; i++) {
				sum += this.getColumnWidth(i);
			}
			return sum;
		}
	}

	getBottomFreezeSize () {
		if (this._config.freezePane && this._config.freezePane.bottom > 0) {			
			let sum = 0;
			for (let i=0; i<this._config.freezePane.bottom; i++) {
				sum += this.getRowHeight((this._config.rowCount-1)-i);
			}
			return sum;
		}
		return 0;
	}

	getColumnWidth (index) {
		if (this._columnModel[index] && this._columnModel[index].width !== undefined) {
			return this._columnModel[index].width;
		}
		return this._config.columnWidth;
	}

	getRowHeight (index) {
		if (this._rowModel[index] && this._rowModel[index].height !== undefined) {
			return this._rowModel[index].height;
		}
		return this._config.rowHeight;
	}

	getTotalWidth () {
		return this._totalWidth;
	}

	getTotalHeight () {
		return this._totalHeight;
	}

	

	_calcTotalSize() {
		this._calcTotalWidth();
		this._calcTotalHeight();		
	}

	_calcTotalWidth () {
		let colModelCount = Object.keys(this._columnModel);
		this._totalWidth = this._config.columnWidth * (this._config.columnCount - colModelCount);
		foreach (let index in this._columnModel) {
			if (this._columnModel[index].width !== undefined) {
				this._totalWidth += this._columnModel[index].width;
			} else {
				this._totalWidth += this._config.columnWidth;
			}
		}

		let rowModelCount = Object.keys(this._rowModel);
		this._totalHeight = this._config.rowHeight * (this._config.rowCount - rowModelCount);
		foreach (let index in this._columnModel) {
			if (this._columnModel[index].height !== undefined) {
				this._totalHeight += this._columnModel[index].height;
			} else {
				this._totalHeight += this._config.rowHeight;
			}
		}
	}

	_calcTotalHeight () {
		let rowModelCount = Object.keys(this._rowModel);
		this._totalHeight = this._config.rowHeight * (this._config.rowCount - rowModelCount);
		foreach (let index in this._columnModel) {
			if (this._columnModel[index].height !== undefined) {
				this._totalHeight += this._columnModel[index].height;
			} else {
				this._totalHeight += this._config.rowHeight;
			}
		}
	}

}

module.exports = Model;
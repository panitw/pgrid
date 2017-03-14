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
}

module.exports = Model;
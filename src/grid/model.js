import EventDispatcher from './event';

class Model extends EventDispatcher {

	constructor (config, data) {
		super();
		this._config = config;
		this._data = data;

		this._columnModel = {};
		this._rowModel = {};
		this._cellModel = {};

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
		if (this._config.cells) {
			for (let i=0; i<this._config.cells.length; i++) {
				this._rowModel[this._config.rows[i].i] = this._config.rows[i];
			}
		}

		this._calcTotalSize();
	}

	getColumnWidth (colIndex) {
		let colModel = this._columnModel[colIndex];
		if (colModel && colModel.width !== undefined) {
			return colModel.width;
		} else {
			return this._config.columnWidth;
		}
	}

	getRowHeight (rowIndex) {
		let rowModel = this._rowModel[rowIndex];
		if (rowIndex && rowIndex.height !== undefined) {
			return rowModel.height;
		} else {
			return this._config.rowHeight;
		}
	}

	getColumnCount () {
		return this._config.columnCount;
	}

	getRowCount () {
		return this._config.rowCount;
	}

	getTopFreezeRows () {
		if (this._config.freezePane && this._config.freezePane.top > 0) {
			return this._config.freezePane.top;
		}
		return 0;
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

	getLeftFreezeRows () {
		if (this._config.freezePane && this._config.freezePane.left > 0) {
			return this._config.freezePane.left;
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
		return 0;
	}

	getBottomFreezeRows () {
		if (this._config.freezePane && this._config.freezePane.bottom > 0) {
			return this._config.freezePane.bottom;
		}
		return 0;
	}

	getBottomFreezeSize () {
		return this._bottomFreezeSize;
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

	getRowModel (rowIndex) {
		return this._rowModel[rowIndex];
	}

	getColumnModel (colIndex) {
		return this._columnModel[colIndex];		
	}

	getCellModel (rowIndex, colIndex) {

	}

	determineScrollbarState (viewWidth, viewHeight, scrollbarSize) {
		let needH = this._totalWidth > viewWidth;
		let needV = this._totalHeight > viewHeight;

		if (needH && !needV) {
			needV = this._totalHeight > (viewHeight - scrollbarSize);
		} else
		if (!needH && needV) {
			needH = this._totalWidth > (viewWidth - scrollbarSize);
		}

		if (needH && needV) {
			return 'b';
		} else
		if (!needH && needV) {
			return 'v';
		} else
		if (needH && !needV) {
			return 'h';
		}
		return 'n';
	}

	_calcTotalSize() {
		this._calcTotalWidth();
		this._calcTotalHeight();
		this._calcBottomFreezeSize();
	}

	_calcTotalWidth () {
		let colModelCount = Object.keys(this._columnModel);
		this._totalWidth = this._config.columnWidth * (this._config.columnCount - colModelCount.length);
		for (let index in this._columnModel) {
			if (this._columnModel[index].width !== undefined) {
				this._totalWidth += this._columnModel[index].width;
			} else {
				this._totalWidth += this._config.columnWidth;
			}
		}
	}

	_calcTotalHeight () {
		let rowModelCount = Object.keys(this._rowModel);
		this._totalHeight = this._config.rowHeight * (this._config.rowCount - rowModelCount.length);
		for (let index in this._rowModel) {
			if (this._rowModel[index].height !== undefined) {
				this._totalHeight += this._rowModel[index].height;
			} else {
				this._totalHeight += this._config.rowHeight;
			}
		}
	}

	_calcBottomFreezeSize () {
		if (this._config.freezePane && this._config.freezePane.bottom > 0) {			
			let sum = 0;
			for (let i=0; i<this._config.freezePane.bottom; i++) {
				sum += this.getRowHeight((this._config.rowCount-1)-i);
			}
			this._bottomFreezeSize = sum;
		} else {
			this._bottomFreezeSize = 0;
		}
	}
}

module.exports = Model;
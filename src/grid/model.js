import { EventDispatcher } from './event';

export class Model extends EventDispatcher {

	constructor (config, data) {
		super();
		this._config = config;
		this._data = data;

		this._columnModel = [];
		this._rowModel = {};
		this._headerRowModel = {};
		this._cellModel = {};
		this._headerCellModel = {};

		if (this._config.headerRows) {
			for (let i=0; i<this._config.headerRows.length; i++) {
				if (this._config.headerRows[i].i !== undefined) {
					this._headerRowModel[this._config.headerRows[i].i] = this._config.headerRows[i];
				}
			}
		}
		if (this._config.columns) {
			for (let i=0; i<this._config.columns.length; i++) {
				if (this._config.columns[i].i !== undefined) {
					this._columnModel[this._config.columns[i].i] = this._config.columns[i];
				} else {
					this._columnModel[i] = this._config.columns[i];
				}
			}
		}
		if (this._config.rows) {
			for (let i=0; i<this._config.rows.length; i++) {
				this._rowModel[this._config.rows[i].i] = this._config.rows[i];
			}
		}
		if (this._config.cells) {
			for (let i=0; i<this._config.cells.length; i++) {
				let model = this._config.cells[i];
				if (!this._cellModel[model.c]) {
					this._cellModel[model.c] = {};
				}
				this._cellModel[model.c][model.r] = model;
			}
		}
		if (this._config.headerCells) {
			for (let i=0; i<this._config.headerCells.length; i++) {
				let model = this._config.headerCells[i];
				if (!this._headerCellModel[model.c]) {
					this._headerCellModel[model.c] = {};
				}
				this._headerCellModel[model.c][model.r] = model;
			}
		}

		this._calcTotalSize();
	}

	canEdit (rowIndex, colIndex) {
		if (this._isHeaderRow(rowIndex)) {

		} else {
			const dataRowIndex = rowIndex - this._config.headerRowCount;
			let rowModel = this.getRowModel(dataRowIndex);
			let colModel = this.getColumnModel(colIndex);
			let cellModel = this.getCellModel(rowIndex, colIndex);
	
			if ((rowModel && rowModel.editable) ||
				(colModel && colModel.editable) ||
				(cellModel && cellModel.editable)) {
				if ((rowModel && rowModel.editable === false) ||
					(colModel && colModel.editable === false) ||
					(cellModel && cellModel.editable === false)) {
					return false;
				}
				return true;
			}
			return false;	
		}
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
		if (this._isHeaderRow(rowIndex)) {

		} else {
			const dataRowIndex = rowIndex - this._config.headerRowCount;
			let rowModel = this._rowModel[dataRowIndex];
			if (rowModel && rowModel.height !== undefined) {
				return rowModel.height;
			} else {
				return this._config.rowHeight;
			}	
		}
	}

	getColumnCount () {
		return this._config.columns.length;
	}

	getRowCount () {
		let headerRowCount = this._config.headerRowCount;
		return headerRowCount + this._data.getRowCount();
	}

	getTopFreezeRows () {
		let topFreeze = 0;
		if (this._config.headerRowCount !== undefined) {
			topFreeze += this._config.headerRowCount; 
		} else {
			topFreeze += 1;
		}
		if (this._config.freezePane && this._config.freezePane.top > 0) {
			topFreeze += this._config.freezePane.top;
		}
		return topFreeze;
	}

	getTopFreezeSize () {
		const topFreezeRow = this.getTopFreezeRows(); 
		let sum = 0;
		for (let i=0; i<topFreezeRow; i++) {
			sum += this.getRowHeight(i);
		}
		return sum;
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
		if (this._isHeaderRow(rowIndex)) {
			return this._headerRowModel[rowIndex];
		} else {
			const dataRowIndex = rowIndex - this._config.headerRowCount;
			return this._rowModel[dataRowIndex];
		}
	}

	getColumnModel (colIndex) {
		return this._columnModel[colIndex];
	}

	getCellModel (rowIndex, colIndex) {
		if (this._isHeaderRow(rowIndex)) {
			if (this._headerCellModel[colIndex]) {
				return this._headerCellModel[colIndex][rowIndex];
			}
		} else {
			const dataRowIndex = rowIndex - this._config.headerRowCount;
			if (this._cellModel[colIndex]) {
				return this._cellModel[colIndex][dataRowIndex];
			}	
		}
	}

	getCascadedCellProp (rowIndex, colIndex, propName) {
		const cellModel = this.getCellModel(rowIndex, cellIndex);
		if (cellModel && cellModel[propName]) {
			return cellModel[propName];
		}

		const rowModel = this.getRowModel(rowIndex);
		if (rowModel && rowModel[propName]) {
			return rowModel[propName];
		}

		const columnModel = this.getColumnModel(colIndex);
		if (columnModel && columnModel[propName]) {
			return columnModel[propName];
		}

		return undefined;
	}

	getCellClasses (rowIndex, colIndex) {
		let output = [];
		const colModel = this.getColumnModel(colIndex);
		if (colModel) {
			if (colModel.cssClass) {
				output.unshift(colModel.cssClass);
			}
		}

		const isHeader = this._isHeaderRow(rowIndex);
		const rowModel = this.getRowModel(rowIndex);
		if (rowModel) {
			if (isHeader) {
				output.unshift('pgrid-row-header');
			}
			if (rowModel.cssClass) {
				output.unshift(rowModel.cssClass);
			}
		}

		const cellModel = this.getCellModel(rowIndex, colIndex);
		if (cellModel) {
			if (cellModel.cssClass) {
				output.unshift(cellModel.cssClass);
			}
		}
		return output;
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

	getDataAt (rowIndex, colIndex) {
		if (this._isHeaderRow(rowIndex)) {
			const colModel = this.getColumnModel(colIndex);
			if (colModel && colModel.title) {
				return colModel.title;
			} else {
				return undefined;
			}
		} else {
			const dataRowIndex = rowIndex - this._config.headerRowCount;
			const colModel = this.getColumnModel(colIndex);
			if (colModel && colModel.field) {
				return this._data.getDataAt(dataRowIndex, colModel.field);
			} else {
				return undefined;
			}	
		}
	}

	setDataAt (rowIndex, colIndex, data) {
		const dataRowIndex = rowIndex - this._config.headerRowCount;
		const colModel = this.getColumnModel(colIndex);
		if (colModel && colModel.field) {
			this._data.getDataAt(dataRowIndex, colModel.field, data);
		}
	}

	_isHeaderRow(rowIndex) {
		return rowIndex < this._config.headerRowCount;
	}

	_calcTotalSize() {
		this._calcTotalWidth();
		this._calcTotalHeight();
		this._calcBottomFreezeSize();
	}

	_calcTotalWidth () {
		for (let i=0; i<this._columnModel.length; i++) {
			if (this._columnModel[i].width !== undefined) {
				this._totalWidth += this._columnModel[i].width;
			} else {
				this._totalWidth += this._config.columnWidth;
			}
		}
	}

	_calcTotalHeight () {
		let rowModelCount = Object.keys(this._rowModel);
		this._totalHeight = this._config.rowHeight * (this._data.getRowCount() - rowModelCount.length);
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
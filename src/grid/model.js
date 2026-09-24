import { EventDispatcher } from './event';

//Shared, immutable resolver results. `_toSource` hands these back for rows that
//carry no per-row payload, so the identity path allocates nothing extra.
const HEADER_META = Object.freeze({ kind: 'header' });
const NONE_META = Object.freeze({ kind: 'none' });

export class Model extends EventDispatcher {

	constructor (config, data, extension) {
		super();
		this._config = config;
		this._data = data;
		this._extension = extension;
		this._rowProjection = null;

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

		this.calcTotalSize();
	}

	canEdit (rowIndex, colIndex) {
		let rowModel = this.getRowModel(rowIndex);
		let colModel = this.getColumnModel(colIndex);
		let cellModel = this.getCellModel(rowIndex, colIndex);
		let result = false;

		if ((rowModel && rowModel.editable) ||
			(colModel && colModel.editable) ||
			(cellModel && cellModel.editable)) {
			if ((rowModel && rowModel.editable === false) ||
				(colModel && colModel.editable === false) ||
				(cellModel && cellModel.editable === false)) {
				result = false;
			} else {
				result = true;
			}
		}

		//Editibility can be overridden by extension
		if (this._extension.hasExtension('cellEditableCheck')) {
			
			//Can Edit Overriding
			const rowId = this.getRowId(rowIndex);
			const field = this.getColumnField(colIndex);
			const dataRow = this._data.getRowData(rowId);
			const e = {
				rowIndex: rowIndex,
				colIndex: colIndex,
				rowId: rowId,
				field: field,
				dataRow: dataRow,
				rowModel: rowModel,
				colModel: colModel,
				cellModel: cellModel,
				canEdit: result
			};
			this._extension.executeExtension('cellEditableCheck', e);
			result = e.canEdit;
		}

		return result;
	}

	isHeaderRow (rowIndex) {
		return rowIndex < this._config.headerRowCount;
	}

	//Install (or clear, by passing null) a row projection. A projection lets an
	//extension present a row order that is not the DataTable's own — synthetic
	//rows, reordered rows, or rows that are simply absent from the view.
	//
	//	{
	//		getRowCount (),              // number of visible non-header rows
	//		resolve (i),                 // {kind:'data', dataRowIndex} | {kind:'group', ...}
	//		getRowHeight (i),            // optional; undefined falls through to config
	//		findDataRow (dataRowIndex)   // reverse lookup, or -1 when not visible
	//	}
	//
	//With nothing installed every accessor resolves `rowIndex - headerRowCount`
	//exactly as it always has.
	setRowProjection (projection) {
		this._rowProjection = projection || null;
	}

	getRowProjection () {
		return this._rowProjection;
	}

	//What is row N? Answers 'header', 'data' (with dataRowIndex), or whatever
	//entry the installed projection resolved to (e.g. a 'group' row).
	getRowMeta (rowIndex) {
		return this._toSource(rowIndex);
	}

	//The single place the visible-row → source-row mapping lives.
	_toSource (rowIndex) {
		if (rowIndex < this._config.headerRowCount) {
			return HEADER_META;
		}
		const projectionIndex = rowIndex - this._config.headerRowCount;
		if (this._rowProjection) {
			return this._rowProjection.resolve(projectionIndex) || NONE_META;
		}
		return { kind: 'data', dataRowIndex: projectionIndex };
	}

	getColumnCount () {
		return this._config.columns.length;
	}

	getRowCount () {
		let headerRowCount = this._config.headerRowCount;
		if (this._rowProjection) {
			return headerRowCount + this._rowProjection.getRowCount();
		}
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

	getColumnWidth (colIndex) {
		if (this._columnModel[colIndex] && this._columnModel[colIndex].width !== undefined) {
			return this._columnModel[colIndex].width;
		}
		return this._config.columnWidth;
	}

	//`config.rows[].i` is a DATA row index, matching what the configuration docs
	//document; header row heights come from `config.headerRows[].height`.
	getRowHeight (rowIndex) {
		if (rowIndex < this._config.headerRowCount) {
			const headerRowModel = this._headerRowModel[rowIndex];
			if (headerRowModel && headerRowModel.height !== undefined) {
				return headerRowModel.height;
			}
			return this._config.rowHeight;
		}

		if (this._rowProjection && this._rowProjection.getRowHeight) {
			const projected = this._rowProjection.getRowHeight(rowIndex - this._config.headerRowCount);
			if (projected !== undefined && projected !== null) {
				return projected;
			}
		}

		const source = this._toSource(rowIndex);
		if (source.kind === 'data') {
			const rowModel = this._rowModel[source.dataRowIndex];
			if (rowModel && rowModel.height !== undefined) {
				return rowModel.height;
			}
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
		const source = this._toSource(rowIndex);
		if (source.kind === 'header') {
			return this._headerRowModel[rowIndex];
		}
		if (source.kind === 'data') {
			return this._rowModel[source.dataRowIndex];
		}
		//A projection-owned virtual row may carry its own row model (this is how
		//a group row gets a cssClass onto every one of its cells).
		return source.rowModel;
	}

	getColumnModel (colIndex) {
		return this._columnModel[colIndex];
	}

	getCellModel (rowIndex, colIndex) {
		const source = this._toSource(rowIndex);
		if (source.kind === 'header') {
			if (this._headerCellModel[colIndex]) {
				return this._headerCellModel[colIndex][rowIndex];
			}
		} else
		if (source.kind === 'data') {
			if (this._cellModel[colIndex]) {
				return this._cellModel[colIndex][source.dataRowIndex];
			}
		}
	}

	getCascadedCellProp (rowIndex, colIndex, propName) {
		const cellModel = this.getCellModel(rowIndex, colIndex);
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

		const isHeader = this.isHeaderRow(rowIndex);
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
		const source = this._toSource(rowIndex);
		if (source.kind === 'header') {
			const colModel = this.getColumnModel(colIndex);
			if (colModel && colModel.title) {
				return colModel.title;
			} else {
				return undefined;
			}
		} else
		if (source.kind === 'data') {
			const colModel = this.getColumnModel(colIndex);
			if (colModel && colModel.field) {
				return this._data.getDataAt(source.dataRowIndex, colModel.field);
			} else {
				return undefined;
			}
		}
		return undefined;
	}

    getRowDataAt (rowIndex) {
		const source = this._toSource(rowIndex);
		if (source.kind === 'data') {
			return this._data.getRowDataAt(source.dataRowIndex);
		}
		return undefined;
	}

	setDataAt (rowIndex, colIndex, data) {
		const source = this._toSource(rowIndex);
		if (source.kind !== 'data') {
			return;
		}
		const colModel = this.getColumnModel(colIndex);
		if (colModel && colModel.field) {
			this._data.setDataAt(source.dataRowIndex, colModel.field, data);
		}
	}

	getRowIndex (rowId) {
		const dataRowIndex = this._data.getRowIndex(rowId);
		if (this._rowProjection) {
			if (dataRowIndex < 0) {
				return -1;
			}
			const visibleIndex = this._rowProjection.findDataRow(dataRowIndex);
			if (visibleIndex === undefined || visibleIndex === null || visibleIndex < 0) {
				return -1;
			}
			return this._config.headerRowCount + visibleIndex;
		}
		return this._config.headerRowCount + dataRowIndex;
	}

	getRowId (rowIndex) {
		const source = this._toSource(rowIndex);
		if (source.kind === 'data') {
			return this._data.getRowId(source.dataRowIndex);
		}
		return null;
	}

	getColumnIndex (field) {
		for (let i=0; i<this._config.columns.length; i++) {
			if (this._config.columns[i].field === field) {
				return i;
			}
		}
		return -1;
	}

	getColumnField (colIndex) {
		if (this._config.columns[colIndex]) {
			return this._config.columns[colIndex].field;
		}
	}

	calcTotalSize() {
		this._calcTotalWidth();
		this._calcTotalHeight();
		this._calcBottomFreezeSize();
	}

	_calcTotalWidth () {
		this._totalWidth = 0;
		for (let i=0; i<this._columnModel.length; i++) {
			if (!this._columnModel[i]) {
				continue;
			}
			if (this._columnModel[i].width !== undefined) {
				this._totalWidth += this._columnModel[i].width;
			} else {
				this._totalWidth += this._config.columnWidth;
			}
		}
	}

	_calcTotalHeight () {
		let headerRowModelCount = Object.keys(this._headerRowModel);
		this._totalHeight = this._config.rowHeight * (this._config.headerRowCount - headerRowModelCount.length);
		for (let index in this._headerRowModel) {
			if (this._headerRowModel[index].height !== undefined) {
				this._totalHeight += this._headerRowModel[index].height;
			} else {
				this._totalHeight += this._config.rowHeight;
			}
		}

		if (this._rowProjection) {
			//A projection can hide, add or resize rows, so the shortcut below no
			//longer describes the visible row set — walk what is actually shown.
			const headerRowCount = this._config.headerRowCount;
			const visibleRowCount = this._rowProjection.getRowCount();
			for (let i=0; i<visibleRowCount; i++) {
				this._totalHeight += this.getRowHeight(headerRowCount + i);
			}
			return;
		}

		let rowModelCount = Object.keys(this._rowModel);
		this._totalHeight += this._config.rowHeight * (this._data.getRowCount() - rowModelCount.length);
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
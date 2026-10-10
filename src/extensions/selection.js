export class SelectionExtension {

	init (grid, config) {
		this._grid = grid;
		this._config = config;
		this._currentSelection = null;
        this._selectionClass = (this._config.selection && this._config.selection.cssClass)?this._config.selection.cssClass:'pgrid-cell-selection';
        this._mouseDownEventHandler = this._mouseDownEventHandler.bind(this);
	}

	keyDown (e) {
		let editing = this._grid.state.get('editing');
		if (editing) {
			return;
		}
		let selection = this._grid.state.get('selection');
		if (selection && selection.length > 0) {
			let rowIndex = selection[0].r;
			let colIndex = selection[0].c;
			let alignTop = true;
			switch (e.keyCode) {
				//Rows that take no selection (a group row, say) are stepped
				//over, not landed on; with nothing selectable that way the key
				//leaves the selection where it is.
				case 40: //Down
					rowIndex = this._stepRow(rowIndex, colIndex, 1);
					alignTop = false;
					break;
				case 38: //Up
					rowIndex = this._stepRow(rowIndex, colIndex, -1);
					break;
				case 37: //Left
					//A span is one cell to navigate: stepping left out of it
					//lands on the cell before the span, and stepping left INTO
					//one lands on its anchor — never on a covered column, which
					//has no node and would swallow the key.
					colIndex = this._stepLeft(rowIndex, colIndex);
					break;
				case 39: //Right
				case 9: //Tab
					colIndex = this._stepRight(rowIndex, colIndex);
					break;
				default:
					return;
			}
			if (this._isSelectable(rowIndex, colIndex)) {
				let cell = this._grid.view.getCell(rowIndex, colIndex);
				if (cell) {
					this._selectCell(cell, rowIndex, colIndex);
					this._grid.view.scrollToCell(rowIndex, colIndex, alignTop);
					e.preventDefault();
					e.stopPropagation();
				}
			}
		}
	}

	cellAfterRender (e) {
		e.cell.addEventListener('mousedown', this._mouseDownEventHandler);
		let selection = this._grid.state.get('selection');
		if (selection && selection.length > 0 && selection[0].r === e.rowIndex && selection[0].c === e.colIndex) {
			e.cell.classList.add(this._selectionClass);
			this._currentSelection = e.cell;
		}
    }

    cellAfterRecycled (e) {
        e.cell.removeEventListener('mousedown', this._mouseDownEventHandler, false);
	}
	
	selectCell (colIndex, rowIndex) {
		if (this._isSelectable(rowIndex, colIndex)) {
			let cell = this._grid.view.getCell(rowIndex, colIndex);
			if (cell) {
				this._selectCell(cell, rowIndex, colIndex);
				this._grid.view.scrollToCell(rowIndex, colIndex, false);
			}
		}
	}

	//Can (rowIndex, colIndex) take the selection? In range, not a header row
	//that carries a row model (the long-standing rule), and not opted out with
	//`selectable: false` on its row model or on the cell model that owns it.
	_isSelectable (rowIndex, colIndex) {
		const model = this._grid.model;
		if (!(rowIndex >= 0 && rowIndex < model.getRowCount() &&
			colIndex >= 0 && colIndex < model.getColumnCount())) {
			return false;
		}
		const rowModel = model.getRowModel(rowIndex);
		if (rowModel && model.isHeaderRow(rowIndex)) {
			return false;
		}
		if (rowModel && rowModel.selectable === false) {
			return false;
		}
		if (typeof model.getCellModel === 'function') {
			const cellModel = model.getCellModel(rowIndex, colIndex);
			if (cellModel && cellModel.selectable === false) {
				return false;
			}
		}
		return true;
	}

	//The next row in `direction` that can take the selection, or an
	//out-of-range index when there is none.
	_stepRow (rowIndex, colIndex, direction) {
		const rowCount = this._grid.model.getRowCount();
		let r = rowIndex + direction;
		while (r >= 0 && r < rowCount && !this._isSelectable(r, colIndex)) {
			r += direction;
		}
		return r;
	}

	//--- span-aware column stepping -------------------------------------
	//All three helpers degrade to plain ±1 / identity on a model without column
	//span support, so nothing here depends on spans existing.

	_spanAnchor (rowIndex, colIndex) {
		const model = this._grid.model;
		if (typeof model.getSpanAnchor !== 'function') {
			return colIndex;
		}
		return model.getSpanAnchor(rowIndex, colIndex);
	}

	_columnSpan (rowIndex, colIndex) {
		const model = this._grid.model;
		if (typeof model.getColumnSpan !== 'function') {
			return 1;
		}
		return model.getColumnSpan(rowIndex, colIndex);
	}

	_stepRight (rowIndex, colIndex) {
		const anchor = this._spanAnchor(rowIndex, colIndex);
		return anchor + this._columnSpan(rowIndex, anchor);
	}

	_stepLeft (rowIndex, colIndex) {
		const anchor = this._spanAnchor(rowIndex, colIndex);
		if (anchor - 1 < 0) {
			return -1;
		}
		return this._spanAnchor(rowIndex, anchor - 1);
	}

    _mouseDownEventHandler (e) {
        let actualCell = e.target;
        if (actualCell.classList.contains('pgrid-cell-content')) {
            actualCell = actualCell.parentElement;
        }
        const actualRow = parseInt(actualCell.dataset.rowIndex);
        const actualCol = parseInt(actualCell.dataset.colIndex);
        if (this._isSelectable(actualRow, actualCol)) {
            if (actualCell.classList.contains('pgrid-cell')) {
                this._selectCell(actualCell, actualRow, actualCol);
            }
        }
    }

	_selectCell (cell, rowIndex, colIndex) {
		//The selection is always stored at the spanning cell's own column, so
		//`selection[0].c` matches the colIndex the cell renders under and the
		//selection class survives a re-render.
		colIndex = this._spanAnchor(rowIndex, colIndex);

		//Clear old selection
		if (this._currentSelection && this._currentSelection !== cell) {
			this._currentSelection.classList.remove(this._selectionClass);
		}

		//Set selection
		this._currentSelection = cell;
		this._currentSelection.classList.add(this._selectionClass);
		this._grid.view.getElement().focus();

		//Store selection state
		let selection = this._grid.state.get('selection');
		if (!selection) {
			selection = [];
			this._grid.state.set('selection', selection);
		}
		selection.length = 0;
		selection.push({
			r: rowIndex,
			c: colIndex,
			//A spanned cell is as many columns wide as it covers — that is what
			//keeps a copy of it rectangular. Without a span this is 1, exactly
			//as it always was.
			w: this._columnSpan(rowIndex, colIndex),
			h: 1
		});

	}

}
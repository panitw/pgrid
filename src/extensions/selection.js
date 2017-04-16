class SelectionExtension {

	init (grid, config) {
		this._grid = grid;
		this._config = config;
		this._currentSelection = null;
		this._selectionClass = (this._config.selection.cssClass)?this._config.selection.cssClass:'pgrid-cell-selection';
	}

	keyDown (e) {
		let selection = this._grid.state.get('selection');
		if (selection && selection.length > 0) {
			let rowIndex = selection[0].r;
			let colIndex = selection[0].c;
			let alignTop = true;
			switch (e.keyCode) {
				case 40: //Down
					rowIndex++;
					alignTop = false;
					break;
				case 38: //Up
					rowIndex--;
					break;
				case 37: //Left
					colIndex--;
					break;
				case 39: //Right
					colIndex++;
					break;
			}
			if (rowIndex >= 0 && rowIndex < this._grid.model.getRowCount() &&
				colIndex >= 0 && colIndex < this._grid.model.getColumnCount()) {
				let rowModel = this._grid.model.getRowModel(rowIndex);
				let colModel = this._grid.model.getColumnModel(colIndex);
				if ((!rowModel || rowModel.type !== 'header') &&
					(!colModel || colModel.type !== 'header')) {

					let cell = this._grid.view.getCell(rowIndex, colIndex);
					if (cell) {
						this._selectCell(cell, rowIndex, colIndex);
						this._grid.view.scrollToCell(rowIndex, colIndex, alignTop);
					}
				}
			}
		}
	}

	cellAfterRender (cell, rowIndex, colIndex) {
		let rowModel = this._grid.model.getRowModel(rowIndex);

		if (!rowModel || rowModel.type !== 'header') {
			cell.children[0].style.pointerEvents = 'none';
			cell.addEventListener('mousedown', (e) => {
				if (e.target.classList.contains('pgrid-cell')) {
					this._selectCell(e.target, rowIndex, colIndex);
				}
			});
		}
	}

	_selectCell (cell, rowIndex, colIndex) {
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
			w: 1,
			h: 1
		});

	}

}

module.exports = SelectionExtension;
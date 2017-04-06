class SelectionExtension {

	constructor (config) {
		this._config = config;
		this._currentSelection = null;
	}

	init (grid) {
		this._grid = grid;
	}

	cellAfterRender (cell, rowIndex, colIndex) {
		let rowModel = this._grid.model.getRowModel(rowIndex);
		if (!rowModel || rowModel.type !== 'header') {
			cell.addEventListener('click', (e) => {
				if (e.target.classList.contains('pgrid-cell')) {
					if (this._currentSelection && this._currentSelection !== e.target) {
						this._currentSelection.classList.remove('pgrid-cell-selection');					
					}
					this._currentSelection = e.target;
					this._currentSelection.classList.add('pgrid-cell-selection');										
				}
			});
		}
	}

}

module.exports = SelectionExtension;
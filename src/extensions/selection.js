class SelectionExtension {

	constructor (config) {
		this._config = config;
		this._currentSelection = null;
		this._selectionClass = (this._config.cssClass)?this._config.cssClass:'pgrid-cell-selection';
	}

	init (grid) {
		this._grid = grid;
	}

	cellAfterRender (cell, rowIndex, colIndex) {
		let rowModel = this._grid.model.getRowModel(rowIndex);

		if (!rowModel || rowModel.type !== 'header') {
			cell.children[0].style.pointerEvents = 'none';
			cell.addEventListener('click', (e) => {
				if (e.target.classList.contains('pgrid-cell')) {
					if (this._currentSelection && this._currentSelection !== e.target) {
						this._currentSelection.classList.remove(this._selectionClass);
					}
					this._currentSelection = e.target;
					this._currentSelection.classList.add(this._selectionClass);										
				}
			});
		}
	}

}

module.exports = SelectionExtension;
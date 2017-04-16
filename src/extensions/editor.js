class EditorExtension {

	init (grid, config) {
		this._grid = grid;
		this._config = config;
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

}

module.exports = EditorExtension;
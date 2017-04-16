class EditorExtension {

	init (grid, config) {
		this._grid = grid;
		this._config = config;
	}

	cellAfterRender (cell) {
		cell.addEventListener('dblclick', (e) => {
			let actualCell = e.target;
			let actualRow = actualCell.dataset.rowIndex;
			let actualCol = actualCell.dataset.colIndex;
			if (this._canEdit(actualRow, actualCol)) {
				//Get data to be edited
				let data = this._grid.data.getDataAt(actualRow, actualCol);

				//If there's custom editor, use custom editor to attach the editor
				if (this._config.editing && this._config.editing.editor && this._config.editing.editor.attach) {
					this._config.editing.editor.attach(actualCell, data, this._done.bind(this));
				} else {
					this._attachEditor(actualCell, data, this._done.bind(this));
				}
			}
		});
	}

	_canEdit (rowIndex, colIndex) {
		let rowModel = this._grid.model.getRowModel(rowIndex);
		let colModel = this._grid.model.getColumnModel(colIndex);
		let cellModel = this._grid.model.getCellModel(rowIndex, colIndex);

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

	_attachEditor (cell, data, done) {
		let cellBound = cell.getBoundingClientRect();
		let inputElement = document.createElement('input');
		inputElement.type = 'text';
		inputElement.value = data;
		inputElement.style.width = cellBound.width + 'px';
		inputElement.style.height = cellBound.height + 'px';
		inputElement.className = 'pgrid-cell-text-editor';
		cell.innerHTML = '';
		cell.appendChild(inputElement);

		inputElement.focus();
		inputElement.select();

		inputElement.addEventListener('keydown', (e) => {
			switch (e.keyCode) {
				case 13: //Enter
					done(e.target.value);
					break;
				case 27: //ESC
					done();
					break;
			}
			e.stopPropagation();
		});
	}

	_detachEditor (cell) {

	}

	_done (result) {
		if (result !== undefined) {
			console.log(result);
		}
		this._detachEditor();
	}

}

module.exports = EditorExtension;
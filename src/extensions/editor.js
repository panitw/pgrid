class EditorExtension {

	init (grid, config) {
		this._grid = grid;
		this._config = config;
	}

	keyDown (e) {
		if (!e.ctrlKey) {
			let selection = this._grid.state.get('selection');
			if (selection && selection.length > 0) {
				let rowIndex = selection[0].r;
				let colIndex = selection[0].c;
				let edit = false;
				if (e.keyCode > 31 && !(e.keyCode >= 37 && e.keyCode <= 40)) {
					edit = true;
				}
				if (edit &&
					rowIndex >= 0 && rowIndex < this._grid.model.getRowCount() &&
					colIndex >= 0 && colIndex < this._grid.model.getColumnCount()) {
					let cell = this._grid.view.getCell(rowIndex, colIndex);
					if (cell) {
						this._editCell(cell);
					}
				}
			}
		}
	}

	cellAfterRender (e) {
		e.cell.addEventListener('dblclick', (e) => {
			let actualCell = e.target;
			if (actualCell) {
				this._editCell(actualCell);
			}
		});
	}

	_editCell (cell) {
		let actualCell = cell;
		let actualRow = parseInt(actualCell.dataset.rowIndex);
		let actualCol = parseInt(actualCell.dataset.colIndex);
		if (this._grid.model.canEdit(actualRow, actualCol)) {
			//Get data to be edited
			let data = this._grid.data.getDataAt(actualRow, actualCol);

			//If there's custom editor, use custom editor to attach the editor
			if (this._config.editing && this._config.editing.editor && this._config.editing.editor.attach) {
				this._config.editing.editor.attach(actualCell, data, this._done.bind(this));
			} else {
				this._attachEditor(actualCell, data, this._done.bind(this));
			}
			this._editingCol = actualCol;
			this._editingRow = actualRow;
		}
	}

	_attachEditor (cell, data, done) {
		if (!this._inputElement) {
			let cellBound = cell.getBoundingClientRect();
			this._inputElement = document.createElement('input');
			this._inputElement.type = 'text';
			this._inputElement.value = data;
			this._inputElement.style.width = (cellBound.width-3) + 'px';
			this._inputElement.style.height = (cellBound.height-3) + 'px';
			this._inputElement.className = 'pgrid-cell-text-editor';
			cell.innerHTML = '';
			cell.appendChild(this._inputElement);

			this._inputElement.focus();
			this._inputElement.select();

			this._arrowKeyLocked = false;

			this._keydownHandler = (e) => {
				switch (e.keyCode) {
					case 13: //Enter
						done(e.target.value);
						e.stopPropagation();
						e.preventDefault();
						break;
					case 27: //ESC
						done();
						e.preventDefault();
						e.stopPropagation();
						break;
					case 40: //Down
					case 38: //Up
					case 37: //Left
					case 39: //Right
						if (!this._arrowKeyLocked) {
							done(e.target.value);
						} else {
							e.preventDefault();
							e.stopPropagation();
						}
						break;
				}
			};
			this._keydownHandler = this._keydownHandler.bind(this);

			this._blurHandler = (e) => {
				done(e.target.value);
			};
			this._blurHandler = this._blurHandler.bind(this);

			this._clickHandler = (e) => {
				this._arrowKeyLocked = true;
			};

			this._inputElement.addEventListener('keydown', this._keydownHandler);
			this._inputElement.addEventListener('blur', this._blurHandler);
			this._inputElement.addEventListener('click', this._clickHandler);
		}
	}

	_detachEditor () {
		if (this._inputElement) {
			this._inputElement.removeEventListener('keydown', this._keydownHandler);
			this._inputElement.removeEventListener('blur', this._blurHandler);
			this._inputElement.removeEventListener('click', this._clickHandler);
			this._inputElement.parentElement.removeChild(this._inputElement);
			this._inputElement = null;
			this._keydownHandler = null;
			this._blurHandler = null;
			this._clickHandler = null;
		}
	}

	_done (result) {
		this._detachEditor();
		if (result !== undefined) {
			let okToUpdate = true;
			if (this._config.editing.transform) {
				result = this._config.editing.transform(result);
			}
			if (this._config.editing.beforeUpdateData) {
				okToUpdate = this._config.editing.beforeUpdateData({
					rowIndex: this._editingRow,
					colIndex: this._editingCol,
					inputValue: result,
					grid: this._grid
				});
			}
			if (okToUpdate === true || okToUpdate === undefined) {
				this._grid.data.setDataAt(this._editingRow, this._editingCol, result);

				if (this._config.editing.afterUpdateData) {
					this._config.editing.afterUpdateData({
						rowIndex: this._editingRow,
						colIndex: this._editingCol,
						inputValue: result,
						grid: this._grid
					});
				}
			}
		}
		this._grid.view.updateCell(this._editingRow, this._editingCol);
		this._editingRow = -1;
		this._editingCol = -1;

		//Re-focus at the grid
		this._grid.view.getElement().focus();
	}

}

module.exports = EditorExtension;
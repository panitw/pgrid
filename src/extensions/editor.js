export class EditorExtension {

	init (grid, config) {
		this._grid = grid;
		this._config = config;
		this._editorAttached = false;
		this.scrollHandler = this.scrollHandler.bind(this);
		this._grid.view.listen('vscroll', this.scrollHandler);
		this._grid.view.listen('hscroll', this.scrollHandler);
	}

	scrollHandler () {
		this._detachEditor();
	}

	keyDown (e) {
		if (!this._editorAttached) {
			if (!e.ctrlKey) {
				let selection = this._grid.state.get('selection');
				if (selection && selection.length > 0) {
					let rowIndex = selection[0].r;
					let colIndex = selection[0].c;
					let edit = false;
					if (e.keyCode === 13 || (e.keyCode > 31 && !(e.keyCode >= 37 && e.keyCode <= 40))) {
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
			//Check if there's any custom editor
			let customEditor = this._grid.model.getCascadedCellProp(actualCell.dataset.rowIndex, actualCell.dataset.colIndex, 'editor');

			//Customer Editor canEdit overriding
			if (customEditor && customEditor.canEdit) {
				const rowId = this._grid.model.getRowId(actualCell.dataset.rowIndex);
				const field = this._grid.model.getColumnField(actualCell.dataset.colIndex);
				const dataRow = this._grid.data.getRowData(rowId);
				const e = {
					rowIndex: actualCell.dataset.rowIndex,
					colIndex: actualCell.dataset.colIndex,
					rowId: rowId,
					field: field,
					dataRow: dataRow
				};
				if (customEditor.canEdit(e)) {
					return;
				}
			}

			//Get data to be edited
			let data = this._grid.model.getDataAt(actualRow, actualCol);

			//If there's custom editor, use custom editor to attach the editor
			this._grid.state.set('editing', true);

			//Create float editor container
			let cellBound = cell.getBoundingClientRect();
			const scrollingElement = document.scrollingElement || document.documentElement; 
			let scrollTop = scrollingElement.scrollTop;
			let scrollLeft = scrollingElement.scrollLeft;
			this._editorContainer = document.createElement('div');
			this._editorContainer.style.position = 'absolute';
			this._editorContainer.style.top = (cellBound.top + scrollTop) + 'px';
			this._editorContainer.style.left = (cellBound.left + scrollLeft) + 'px';
			this._editorContainer.style.width = cellBound.width + 'px';
			this._editorContainer.style.height = cellBound.height + 'px';
			document.body.appendChild(this._editorContainer);

			if (customEditor && customEditor.attach) {
				customEditor.attach(this._editorContainer, data, this._done.bind(this));
			} else {
				this._attachEditor(this._editorContainer, data, this._done.bind(this));
			}

			this._editorAttached = true;
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
			this._inputElement.style.width = (cellBound.width) + 'px';
			this._inputElement.style.height = (cellBound.height) + 'px';
			this._inputElement.className = 'pgrid-cell-text-editor';
			
			cell.appendChild(this._inputElement);

			this._inputElement.focus();
			this._inputElement.select();

			this._arrowKeyLocked = false;

			this._keydownHandler = (e) => {
				switch (e.keyCode) {
					case 13: //Enter
						//Prevent double done() call
						if (this._inputElement) {
							this._inputElement.removeEventListener('blur', this._blurHandler);
						}
						done(e.target.value);
						e.stopPropagation();
						e.preventDefault();
						break;
					case 27: //ESC
						//Prevent double done() call
						if (this._inputElement) {
							this._inputElement.removeEventListener('blur', this._blurHandler);
						}
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

			this._blurHandler = (e) => {
				done(e.target.value);
			};

			this._clickHandler = (e) => {
				this._arrowKeyLocked = true;
			};

			this._inputElement.addEventListener('keydown', this._keydownHandler);
			this._inputElement.addEventListener('blur', this._blurHandler);
			this._inputElement.addEventListener('click', this._clickHandler);
		}
	}

	_detachEditor () {
		if (this._editorContainer) {
			//Double checking to fix wiered bug
			this._editorContainer.parentElement.removeChild(this._editorContainer);
			this._editorContainer = null;
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
	}

	_done (result, multiFields) {
		this._detachEditor();
		if (result !== undefined) {
			if (!multiFields) {
				this._grid.model.setDataAt(this._editingRow, this._editingCol, result);
			} else {
				let rowId = this._grid.model.getRowId(this._editingRow);
				if (rowId) {
					for (let prop in result) {
						if (result.hasOwnProperty(prop)) {
							this._grid.data.setData(rowId, prop, result[prop]);
						}
					}
				}
			}
		}
		this._grid.view.updateCell(this._editingRow, this._editingCol);
		this._editingRow = -1;
		this._editingCol = -1;
		this._editorAttached = false;
		this._grid.state.set('editing', false);

		//Re-focus at the grid
		this._grid.view.getElement().focus();
	}

}
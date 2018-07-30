export class CheckboxColumnExtension {

    init (grid, config) {
		this._grid = grid;
		this._config = config;
	}

    cellRender (e) {
        if (typeof e.data === 'boolean') {
            if (e.data) {
                e.cellContent.innerHTML = '<input type="checkbox" checked>';
            } else {
                e.cellContent.innerHTML = '<input type="checkbox">';
            }
            if (this._grid.model.canEdit(e.rowIndex, e.colIndex)) {
                e.cellContent.style.pointerEvents = 'all';
            }

            let checkbox = e.cellContent.firstChild;
            checkbox.addEventListener('change', (checkboxEvent) => {
                this._grid.model.setDataAt(e.rowIndex, e.colIndex, checkboxEvent.target.checked);
            });
        } else {
            e.cellContent.innerHTML = e.data;
        }
    }

    cellUpdate (e) {
        if (e.cellContent.firstChild) {
            e.cellContent.firstChild.checked = e.data;
        }
    }

}
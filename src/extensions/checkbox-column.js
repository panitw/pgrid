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
        } else {
            e.cellContent.innerHTML = e.data;
        }
    }

}
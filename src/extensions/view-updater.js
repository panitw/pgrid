export class ViewUpdaterExtension {

    init (grid, config) {
		this._grid = grid;
		this._config = config;
	}

    dataFinishUpdate (e) {
        let rowIndexCache = {};
        let colIndexCache = {};
        for (let i=0; i<e.updates.length; i++) {
            let {rowId, field} = e.updates[i];
            let rowIndex = null;
            let colIndex = null;
            if (rowIndexCache[rowId]) {
                rowIndex = rowIndexCache[rowId];
            } else {
                rowIndex = this._grid.model.getRowIndex(rowId);
                rowIndexCache[rowId] = rowIndex;                
            }
            if (colIndexCache[field]) {
                colIndex = colIndexCache[field];
            } else {
                colIndex = this._grid.model.getColumnIndex(field);
                colIndexCache[rowId] = colIndex;                
            }            
            this._grid.view.updateCell(rowIndex, colIndex);
        }
    }

}
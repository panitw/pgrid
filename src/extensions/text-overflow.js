const MODE_CLASS = {
    wrap: 'pgrid-text-wrap',
    ellipsis: 'pgrid-text-ellipsis',
    clip: 'pgrid-text-clip'
};
const ALL_CLASSES = Object.values(MODE_CLASS);

export class TextOverflowExtension {

    init (grid, config) {
        this._grid = grid;
        this._config = config;
        const opt = config.textOverflow;
        this._defaultMode = (typeof opt === 'string') ? opt : (opt && opt.mode) || 'ellipsis';
    }

    cellAfterRender (e) {
        this._apply(e.cell, e.cellContent, e.rowIndex, e.colIndex);
    }

    cellAfterUpdate (e) {
        this._apply(e.cell, e.cellContent, e.rowIndex, e.colIndex);
    }

    _apply (cell, cellContent, rowIndex, colIndex) {
        if (!cellContent) {
            return;
        }
        const mode = this._resolveMode(rowIndex, colIndex);
        for (const cls of ALL_CLASSES) {
            cellContent.classList.remove(cls);
        }
        if (cell) {
            cell.classList.remove('pgrid-text-overflow-host');
        }
        const cls = MODE_CLASS[mode];
        if (cls) {
            cellContent.classList.add(cls);
            if (cell) {
                cell.classList.add('pgrid-text-overflow-host');
            }
        }
    }

    _resolveMode (rowIndex, colIndex) {
        const cellModel = this._grid.model.getCellModel(rowIndex, colIndex);
        if (cellModel && cellModel.textOverflow) {
            return cellModel.textOverflow;
        }
        const colModel = this._grid.model.getColumnModel(colIndex);
        if (colModel && colModel.textOverflow) {
            return colModel.textOverflow;
        }
        const rowModel = this._grid.model.getRowModel(rowIndex);
        if (rowModel && rowModel.textOverflow) {
            return rowModel.textOverflow;
        }
        return this._defaultMode;
    }

}

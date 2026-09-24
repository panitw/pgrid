export class CopyPasteExtension {

    constructor() {
        this._globalClipboard = false;
    }

	init (grid, config) {
		this._grid = grid;
        this._config = config;
        this._srcSelection = null;
	}

	keyDown (e) {
        if (this._globalClipboard && e.ctrlKey) {
            if (e.key === 'c') {
                let data = this._copy();
                if (data !== null) {
                    window.clipboardData.setData('text', data);
                }
            } else
            if (e.key === 'v') {
                this._paste(window.clipboardData.getData('text'));
            }
        }
    }

    gridAfterRender(e) {
        if (!window.clipboardData) {
            this._grid.view.getElement().addEventListener('paste', (pasteEvent) => {
                this._paste(pasteEvent.clipboardData.getData('text'));
            });
            this._grid.view.getElement().addEventListener('copy', (copyEvent) => {
                let data = this._copy();
                if (data !== null) {
                    copyEvent.clipboardData.setData('text/plain', data);
                    copyEvent.preventDefault();
                }
            });
            this._globalClipboard = false;
        } else {
            this._globalClipboard = true;
        }
    }

    //Is this coordinate covered by another cell's column span? False on a model
    //without column span support, so nothing here depends on spans existing.
    _isCovered(rowIndex, colIndex) {
        const model = this._grid.model;
        if (typeof model.getSpanAnchor !== 'function') {
            return false;
        }
        return model.getSpanAnchor(rowIndex, colIndex) !== colIndex;
    }

    _copy(clipboardData) {
        let selection = this._grid.state.get('selection');
        if (selection && selection.length > 0) {
            let s = selection[0];
            let rows = [];
            for (let i=0; i<s.h; i++) {
                let cols = [];
                for (let j=0; j<s.w; j++) {
                    const row = s.r + i;
                    const col = s.c + j;
                    if (this._isCovered(row, col)) {
                        //Excel's convention: a merged cell copies as its value
                        //followed by one empty field per column it covers, so
                        //the clipboard stays rectangular for a spreadsheet.
                        cols.push('');
                    } else {
                        cols.push(this._grid.model.getDataAt(row, col));
                    }
                }
                rows.push(cols.join('\t'));
            }
            this._srcSelection = s;
            return rows.join('\n');
        } else {
            return null;
        }
    }

    _paste(data) {
        if (data) {
            data = data.replace(/\n$/g, '');
            let selection = this._grid.state.get('selection');
            if (selection && selection.length > 0) {
                let s = selection[0];
                let rows = data.split('\n');
                for (let i=0; i<rows.length; i++) {
                    let cols = rows[i].split('\t');
                    for (let j=0; j<cols.length; j++) {
                        let pasteRow =  s.r + i;
                        let pasteCol = s.c + j;
                        if (cols[j] === '' && this._isCovered(pasteRow, pasteCol)) {
                            //The blank a merged cell contributed on copy is
                            //discarded rather than written, so a round trip
                            //inside the grid is lossless. Only an EMPTY field is
                            //dropped: clipboard text from an unmerged source
                            //carries real values in those columns, and silently
                            //losing them would be worse than writing them
                            //through to the cell that owns the coordinate.
                            continue;
                        }
                        if (this._grid.model.canEdit(pasteRow, pasteCol)) {
                            this._grid.model.setDataAt(pasteRow, pasteCol, cols[j]);
                            this._grid.view.updateCell(pasteRow, pasteCol);
                        }
                    }
                }

                let srcRowId = -1;
                let srcField = null;
                if (this._srcSelection) {
                    srcRowId = this._grid.model.getRowId(this._srcSelection.r);
                    srcField = this._grid.model.getColumnField(this._srcSelection.c);
                }
                this._grid.dispatch('cellPasted', {
                    srcRowId: srcRowId,
                    srcField: srcField,
                    srcSelection: this._srcSelection,
                    destRowId: this._grid.model.getRowId(s.r),
                    destField: this._grid.model.getColumnField(s.c),
                    destSelection: s,
                    data: data
                });
                this._srcSelection = null;
            }
        }
    }

}
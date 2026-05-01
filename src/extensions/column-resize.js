export class ColumnResizeExtension {

    init (grid, config) {
        this._grid = grid;
        this._config = config;
        const opts = config.columnResize || {};
        this._minWidth = (opts.minWidth !== undefined) ? opts.minWidth : 20;
        this._maxWidth = (opts.maxWidth !== undefined) ? opts.maxWidth : Infinity;
        this._handleClass = opts.cssClass || 'pgrid-col-resize-handle';
        this._handleWidth = (opts.handleWidth !== undefined) ? opts.handleWidth : 6;
    }

    cellAfterRender (e) {
        if (!this._grid.model.isHeaderRow(e.rowIndex)) {
            return;
        }
        const colModel = this._grid.model.getColumnModel(e.colIndex);
        if (colModel && colModel.resizable === false) {
            return;
        }

        const handle = document.createElement('div');
        handle.className = this._handleClass;
        handle.style.position = 'absolute';
        handle.style.top = '0';
        handle.style.right = '0';
        handle.style.width = this._handleWidth + 'px';
        handle.style.height = '100%';
        handle.style.cursor = 'col-resize';
        handle.style.userSelect = 'none';
        handle.style.zIndex = '2';

        const onMouseDown = (ev) => this._startResize(ev, e.colIndex);
        const onDblClick = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
        };
        handle.addEventListener('mousedown', onMouseDown);
        handle.addEventListener('dblclick', onDblClick);

        e.cell.appendChild(handle);
        e.cell._pgridResizeHandle = handle;
        e.cell._pgridResizeCleanup = () => {
            handle.removeEventListener('mousedown', onMouseDown);
            handle.removeEventListener('dblclick', onDblClick);
            if (handle.parentElement) {
                handle.parentElement.removeChild(handle);
            }
        };
    }

    cellAfterRecycled (e) {
        if (e.cell._pgridResizeCleanup) {
            e.cell._pgridResizeCleanup();
            delete e.cell._pgridResizeCleanup;
            delete e.cell._pgridResizeHandle;
        }
    }

    _startResize (ev, colIndex) {
        ev.preventDefault();
        ev.stopPropagation();

        const colModel = this._grid.model.getColumnModel(colIndex);
        if (!colModel) {
            return;
        }
        const startX = ev.clientX;
        const startWidth = this._grid.model.getColumnWidth(colIndex);
        const minWidth = this._minWidth;
        const maxWidth = this._maxWidth;

        const prevBodyCursor = document.body.style.cursor;
        const prevBodyUserSelect = document.body.style.userSelect;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const onMove = (moveEv) => {
            let newWidth = startWidth + (moveEv.clientX - startX);
            if (newWidth < minWidth) newWidth = minWidth;
            if (newWidth > maxWidth) newWidth = maxWidth;
            if (newWidth === colModel.width) {
                return;
            }
            colModel.width = newWidth;
            this._grid.view.reRender();
            this._grid.dispatch('columnResizing', {
                colIndex,
                field: colModel.field,
                width: newWidth
            });
        };

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = prevBodyCursor;
            document.body.style.userSelect = prevBodyUserSelect;
            this._grid.dispatch('columnResized', {
                colIndex,
                field: colModel.field,
                width: colModel.width !== undefined ? colModel.width : startWidth
            });
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

}

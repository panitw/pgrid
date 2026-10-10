//FoldableRowsExtension — group-by with expand/collapse.
//
//The DataTable stays flat: group rows are synthetic and owned entirely by this
//extension. The grid learns about them through the row projection installed on
//Model (see Model#setRowProjection), which is the only core seam this feature
//needs. Collapsed records are *absent from the projection* rather than
//zero-height, so the virtualizer never walks them and no DOM is allocated.

const PATH_DELIMITER = '\u001F';
const PATH_DELIMITER_RE = /\u001F/g;
const BACKSLASH_RE = /\\/g;
//Reserved: no `typeof` result can collide with it, so an empty segment can never
//be produced by a real value.
const EMPTY_SEGMENT = '~';
//Marks a config object this extension has already configured, so a second
//instance on the same grid does not inject a second gutter.
const CONFIGURED = '__pgridFoldableRowsConfigured';

const DEFAULTS = {
    gutterWidth: 28,
    labelColumn: 0,
    collapsedByDefault: false,
    indentSize: 16,
    cssClass: 'pgrid-group-row',
    showCount: true,
    emptyLabel: '(none)',
    //A label starting in the frozen block reads across the whole visible width
    //instead of being clipped at the frozen boundary (see Model#isStickySpan).
    stickyLabel: true,
    //Group rows take no cell selection or keyboard focus unless this is set;
    //it is also what makes Space-to-fold reachable.
    selectableGroupRows: false
};

const GUTTER_CLASS = 'pgrid-group-gutter';
const LABEL_CLASS = 'pgrid-group-label';
const CHEVRON_CLASS = 'pgrid-group-chevron';
const CHEVRON_COLLAPSED_CLASS = 'pgrid-group-chevron-collapsed';

//The chevron is a stroked SVG path, not a text glyph: ▶/▼ come out at a
//different size and weight in every font, and some platforms swap ▶ for a
//colour emoji. Drawn in currentColor on a 16-unit grid, so the theme colours
//still apply and it scales with the box the stylesheet gives it.
const SVG_NS = 'http://www.w3.org/2000/svg';
const CHEVRON_PATH = {
    expanded: 'M4 6l4 4 4-4',
    collapsed: 'M6 4l4 4-4 4'
};

function createChevronIcon (collapsed) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('width', '12');
    svg.setAttribute('height', '12');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', collapsed ? CHEVRON_PATH.collapsed : CHEVRON_PATH.expanded);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    return svg;
}

function toFieldList (groupBy) {
    if (Array.isArray(groupBy)) {
        return groupBy.filter((f) => typeof f === 'string' && f.length > 0);
    }
    if (typeof groupBy === 'string' && groupBy.length > 0) {
        return [groupBy];
    }
    return [];
}

//`null`, `undefined` and '' all collapse to one bucket so those records group
//together and render under `emptyLabel`.
function normalizeValue (value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    return value;
}

function toPath (path) {
    if (Array.isArray(path)) {
        return path;
    }
    return (path === undefined) ? [] : [path];
}

//Fold state is keyed by path, so the key has to be injective: two different
//paths must never collapse onto one. Each segment carries its value's type — so
//the number 5 and the string '5' stay apart — and escapes the delimiter out of
//the text, so a value containing it cannot fake a segment boundary.
function encodeSegment (value) {
    if (value === null) {
        return EMPTY_SEGMENT;
    }
    const text = String(value)
        .replace(BACKSLASH_RE, '\\\\')
        .replace(PATH_DELIMITER_RE, '\\d');
    return typeof value + ':' + text;
}

function pathKey (rawPath) {
    const path = toPath(rawPath);
    const segments = [];
    for (let i = 0; i < path.length; i++) {
        segments.push(encodeSegment(normalizeValue(path[i])));
    }
    return segments.join(PATH_DELIMITER);
}

export class FoldableRowsExtension {

    //--------------------------------------------------------------------
    // configure — runs before DataTable / Model / View are constructed
    //--------------------------------------------------------------------

    //Injects the chevron gutter column at index 0 and compensates every piece of
    //host config that addresses columns by index, so a config authored without
    //grouping keeps meaning the same thing once grouping is switched on.
    configure (config) {
        const source = (config.foldableRows && typeof config.foldableRows === 'object') ? config.foldableRows : {};
        if (source[CONFIGURED]) {
            //A second instance on the same grid — typically config.foldableRows
            //plus a hand-built one in config.extensions. The first instance owns
            //the gutter and the projection; take this one out of play before
            //loadExtension sees it, rather than fight over both.
            this._standDown();
            return;
        }

        const options = Object.assign({}, DEFAULTS, source);
        Object.defineProperty(options, CONFIGURED, { value: true });
        config.foldableRows = options;

        if (toFieldList(options.groupBy).length === 0) {
            //Nothing to group by. Inject no gutter and renumber nothing, so the
            //grid is exactly the grid it would have been without this extension.
            return;
        }

        //Rewrite index-bearing config. The arrays and their entries are copied so
        //the caller's own config object is never mutated.
        const shiftCell = (cell) => {
            if (cell && typeof cell.c === 'number') {
                return Object.assign({}, cell, { c: cell.c + 1 });
            }
            return cell;
        };
        if (Array.isArray(config.cells)) {
            config.cells = config.cells.map(shiftCell);
        }
        if (Array.isArray(config.headerCells)) {
            config.headerCells = config.headerCells.map(shiftCell);
        }

        //The gutter always joins the frozen block. Left unfrozen it would sit in
        //the horizontally scrolling centre pane and the chevrons would scroll
        //out of view on any grid wider than its viewport.
        const hostLeftFreeze = (config.freezePane && config.freezePane.left > 0) ? config.freezePane.left : 0;
        config.freezePane = Object.assign({}, config.freezePane, { left: hostLeftFreeze + 1 });

        const hostColumns = Array.isArray(config.columns) ? config.columns : [];
        const shifted = hostColumns.map((col) => {
            if (col && col.i !== undefined) {
                return Object.assign({}, col, { i: col.i + 1 });
            }
            return col;
        });

        const gutter = {
            width: options.gutterWidth,
            editable: false,
            resizable: false,
            cssClass: GUTTER_CLASS
        };
        config.columns = [gutter].concat(shifted);

        //labelColumn stays authored in host numbering; store the shifted one.
        options.labelColumn = options.labelColumn + 1;
    }

    //loadExtension registers hooks by method presence, and it has not run yet at
    //configure time — shadowing the methods here keeps this duplicate instance
    //out of the registry entirely.
    _standDown () {
        const hooks = ['init', 'cellRender', 'cellAfterRender', 'cellAfterRecycled',
            'cellEditableCheck', 'keyDown'];
        for (let i = 0; i < hooks.length; i++) {
            this[hooks[i]] = undefined;
        }
    }

    //--------------------------------------------------------------------
    // init
    //--------------------------------------------------------------------

    init (grid, config) {
        this._grid = grid;
        this._config = config;

        const options = config.foldableRows || Object.assign({}, DEFAULTS, { labelColumn: DEFAULTS.labelColumn + 1 });
        this._options = options;
        this._groupBy = toFieldList(options.groupBy);
        this._labelColumn = options.labelColumn;
        this._indentSize = options.indentSize;
        this._cssClass = options.cssClass;
        this._showCount = options.showCount !== false;
        this._emptyLabel = options.emptyLabel;
        this._collapsedByDefault = !!options.collapsedByDefault;
        this._groupLabel = (typeof options.groupLabel === 'function') ? options.groupLabel : null;
        this._groupRowHeight = (options.groupRowHeight !== undefined) ? options.groupRowHeight : config.rowHeight;
        this._selectableGroupRows = !!options.selectableGroupRows;

        //The label cell spans the rest of the row, so a group label is never
        //clipped to one column's width. Declared to the last column; Model
        //clamps it to the end of the label column's own pane. When the label
        //sits in the frozen block that clamp would clip it at the frozen
        //boundary, so it is also declared sticky: View then lifts it into a
        //span layer that runs to the grid's visible right edge and holds still
        //on horizontal scroll. In the scrolling band, or with nothing frozen
        //but the gutter, Model ignores the flag and the span clamps as before.
        //Shared and frozen: every group row hands back the same object.
        const columnCount = Array.isArray(config.columns) ? config.columns.length : 0;
        const labelSpan = columnCount - this._labelColumn;
        this._labelCellModel = null;
        if (labelSpan > 1) {
            const labelModel = { colspan: labelSpan };
            if (options.stickyLabel !== false) {
                labelModel.stickySpan = true;
            }
            const cellModel = {};
            cellModel[this._labelColumn] = Object.freeze(labelModel);
            this._labelCellModel = Object.freeze(cellModel);
        }

        //key -> {path, collapsed}
        this._foldState = {};

        this._rows = [];
        this._groups = [];
        this._groupRowByKey = {};
        this._visibleByDataRow = {};
        this._ancestorKeysByDataRow = {};

        this._projection = {
            getRowCount: () => this._rows.length,
            resolve: (i) => this._rows[i],
            getRowHeight: (i) => {
                const entry = this._rows[i];
                return (entry && entry.kind === 'group') ? this._groupRowHeight : undefined;
            },
            findDataRow: (dataRowIndex) => {
                const visible = this._visibleByDataRow[dataRowIndex];
                return (visible === undefined) ? -1 : visible;
            }
        };

        this._dataChangedHandler = (e) => {
            if (this._affectsGrouping(e)) {
                this._refresh();
            }
        };
        this._chevronClickHandler = this._chevronClickHandler.bind(this);
        grid.data.listen('dataChanged', this._dataChangedHandler);

        this._buildIndex();
        grid.model.setRowProjection(this._projection);
        grid.model.calcTotalSize();
    }

    //--------------------------------------------------------------------
    // Public API
    //--------------------------------------------------------------------

    expand (path) {
        this._setCollapsed(path, false);
    }

    collapse (path) {
        this._setCollapsed(path, true);
    }

    toggle (path) {
        this._setCollapsed(path, !this.isCollapsed(path));
    }

    expandAll () {
        this._setAll(false);
    }

    collapseAll () {
        this._setAll(true);
    }

    isCollapsed (path) {
        const entry = this._foldState[pathKey(path)];
        if (entry) {
            return entry.collapsed;
        }
        return this._collapsedByDefault;
    }

    //Serializable snapshot, keyed by group path rather than by row index, so it
    //survives any rebuild.
    getState () {
        const collapsed = [];
        for (let i = 0; i < this._groups.length; i++) {
            if (this._groups[i].collapsed) {
                collapsed.push(this._groups[i].path.slice());
            }
        }
        return { groupBy: this._groupBy.slice(), collapsed };
    }

    //Symmetric with getState: a snapshot carries the grouping it was taken under,
    //so restoring one restores the grouping too. Paths that are not part of the
    //resulting data are simply not applied.
    setState (state) {
        const snapshot = Array.isArray(state) ? { collapsed: state } : (state || {});
        if (Array.isArray(snapshot.groupBy)) {
            this._groupBy = toFieldList(snapshot.groupBy);
            if (this._options) {
                this._options.groupBy = this._groupBy.slice();
            }
            //Rebuild first so the "pin everything expanded" pass below sees the
            //groups of the restored grouping, not the outgoing one.
            this._buildIndex();
        }
        const paths = snapshot.collapsed || [];
        const next = {};
        //Pin every currently-known group to expanded first, so a snapshot round
        //trips exactly even when collapsedByDefault is true.
        for (let i = 0; i < this._groups.length; i++) {
            const group = this._groups[i];
            next[group.key] = { path: group.path.slice(), collapsed: false };
        }
        for (let i = 0; i < paths.length; i++) {
            const path = toPath(paths[i]);
            next[pathKey(path)] = { path: path.slice(), collapsed: true };
        }
        this._foldState = next;
        this._refresh();
    }

    getGroups () {
        return this._groups.map((group) => ({
            path: group.path.slice(),
            label: group.label,
            level: group.level,
            count: group.count,
            collapsed: group.collapsed
        }));
    }

    setGroupBy (fields) {
        this._groupBy = toFieldList(fields);
        if (this._options) {
            this._options.groupBy = this._groupBy.slice();
        }
        this._refresh(true);
    }

    //--------------------------------------------------------------------
    // Hooks
    //--------------------------------------------------------------------

    cellEditableCheck (e) {
        const meta = this._grid.model.getRowMeta(e.rowIndex);
        if (meta && meta.kind === 'group') {
            e.canEdit = false;
        }
    }

    cellRender (e) {
        const meta = this._grid.model.getRowMeta(e.rowIndex);
        if (!meta || meta.kind !== 'group') {
            return;
        }

        //Columns covered by the label's span render no cell at all, so the only
        //cells reaching here are the gutter, anything the host froze ahead of
        //the label, and the label itself. Those still have to come up blank.
        const content = e.cellContent;
        while (content.firstChild) {
            content.removeChild(content.firstChild);
        }
        content.style.paddingLeft = '';

        if (e.colIndex === this._labelColumn) {
            content.textContent = meta.label;
            content.style.paddingLeft = (5 + (meta.level * this._indentSize)) + 'px';
        }

        e.handled = true;
    }

    cellAfterRender (e) {
        const meta = this._grid.model.getRowMeta(e.rowIndex);
        if (!meta || meta.kind !== 'group') {
            return;
        }

        //The group cssClass is NOT added here: it rides on the group row's
        //rowModel, which Model#getCellClasses already folds into every cell of
        //the row, and View reassigns cell.className on every render.
        if (e.colIndex === this._labelColumn) {
            e.cell.classList.add(LABEL_CLASS);
        }
        if (e.colIndex !== 0) {
            return;
        }

        //The chevron hangs off the cell, not the cell content — `.pgrid-cell-content`
        //is `pointer-events: none`, so a chevron rendered inside it gets no clicks.
        const chevron = document.createElement('span');
        chevron.className = CHEVRON_CLASS + (meta.collapsed ? ' ' + CHEVRON_COLLAPSED_CLASS : '');
        chevron.appendChild(createChevronIcon(meta.collapsed));
        chevron.setAttribute('role', 'button');
        chevron.setAttribute('aria-expanded', meta.collapsed ? 'false' : 'true');
        chevron.setAttribute('aria-label', meta.collapsed ? 'Expand group' : 'Collapse group');
        chevron.style.position = 'absolute';
        chevron.style.left = (3 + (meta.level * this._indentSize)) + 'px';
        chevron.style.top = '50%';
        chevron.style.transform = 'translateY(-50%)';
        chevron.style.zIndex = '2';

        //Held as a property, not a data attribute: the group key is built from
        //raw field values joined by control characters, which have no business
        //being serialised into the DOM.
        chevron._pgridGroup = meta;
        chevron.addEventListener('click', this._chevronClickHandler);
        e.cell.appendChild(chevron);
        e.cell._pgridGroupChevron = chevron;
    }

    //Cells are pooled: everything this extension put on a cell has to come back
    //off when the view repurposes it, or a record row inherits group decoration.
    cellAfterRecycled (e) {
        const cell = e.cell;
        if (!cell) {
            return;
        }
        const chevron = cell._pgridGroupChevron;
        if (chevron) {
            chevron.removeEventListener('click', this._chevronClickHandler);
            if (chevron.parentElement) {
                chevron.parentElement.removeChild(chevron);
            }
            delete chevron._pgridGroup;
            delete cell._pgridGroupChevron;
        }
        cell.classList.remove(LABEL_CLASS);
        const content = cell.firstChild;
        if (content && content.style) {
            content.style.paddingLeft = '';
        }
    }

    //Space folds the selected group row — so it needs `selectableGroupRows`,
    //without which a group row is never selected. It is also only reachable
    //because group rows report canEdit === false: EditorExtension claims space
    //as a typing key and runs first, but backs off on canEdit.
    keyDown (e) {
        if (e.keyCode !== 32) {
            return;
        }
        if (this._grid.state.get('editing')) {
            return;
        }
        const selection = this._grid.state.get('selection');
        if (!selection || selection.length === 0) {
            return;
        }
        const meta = this._grid.model.getRowMeta(selection[0].r);
        if (!meta || meta.kind !== 'group') {
            return;
        }
        if (e.preventDefault) {
            e.preventDefault();
        }
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        this.toggle(meta.path);
    }

    //--------------------------------------------------------------------
    // Internals
    //--------------------------------------------------------------------

    //A rebuild tears down every cell in the grid, so only do it when the change
    //could actually move a record between groups or alter row membership. An
    //edit to a non-grouping field changes neither.
    _affectsGrouping (e) {
        const updates = e && e.updates;
        if (!Array.isArray(updates) || updates.length === 0) {
            //Unknown provenance — assume the worst.
            return true;
        }
        for (let i = 0; i < updates.length; i++) {
            const update = updates[i];
            if (update.changeType !== 'fieldChange') {
                //rowAdded / rowRemoved / global all change row membership.
                return true;
            }
            if (this._groupBy.indexOf(update.field) !== -1) {
                return true;
            }
        }
        return false;
    }

    _chevronClickHandler (domEvent) {
        domEvent.preventDefault();
        domEvent.stopPropagation();
        const group = domEvent.currentTarget._pgridGroup;
        if (group) {
            this.toggle(group.path);
        }
    }

    _setCollapsed (rawPath, collapsed) {
        const path = toPath(rawPath);
        this._foldState[pathKey(path)] = { path: path.slice(), collapsed: collapsed };
        this._refresh();
    }

    _setAll (collapsed) {
        for (let i = 0; i < this._groups.length; i++) {
            const group = this._groups[i];
            this._foldState[group.key] = { path: group.path.slice(), collapsed: collapsed };
        }
        this._refresh();
    }

    //Rebuild the projection, keep the selection pointing at what the user chose,
    //and repaint.
    _refresh (prune) {
        const anchor = this._captureSelection();
        this._buildIndex();
        if (prune) {
            const pruned = {};
            for (const key in this._foldState) {
                if (this._groupRowByKey[key]) {
                    pruned[key] = this._foldState[key];
                }
            }
            this._foldState = pruned;
        }
        this._grid.model.calcTotalSize();
        this._restoreSelection(anchor);
        if (this._grid.view.getElement()) {
            this._grid.view.reRender();
        }
    }

    _captureSelection () {
        const selection = this._grid.state.get('selection');
        if (!selection || selection.length === 0) {
            return null;
        }
        const meta = this._grid.model.getRowMeta(selection[0].r);
        if (!meta) {
            return null;
        }
        if (meta.kind === 'group') {
            //The group's own key last, so the fallback walk tries it first.
            const ancestorKeys = [];
            for (let i = 1; i <= meta.path.length; i++) {
                ancestorKeys.push(pathKey(meta.path.slice(0, i)));
            }
            return { kind: 'group', ancestorKeys };
        }
        if (meta.kind === 'data') {
            return {
                kind: 'data',
                rowId: this._grid.model.getRowId(selection[0].r),
                ancestorKeys: (this._ancestorKeysByDataRow[meta.dataRowIndex] || []).slice()
            };
        }
        return null;
    }

    //Prefer what the user actually pointed at; if the fold hid it, walk outwards
    //to the nearest visible ancestor group row so the selection never silently
    //lands on an unrelated row.
    _restoreSelection (anchor) {
        if (!anchor) {
            return;
        }
        const selection = this._grid.state.get('selection');
        if (!selection || selection.length === 0) {
            return;
        }
        const headerRowCount = this._config.headerRowCount;

        if (anchor.kind === 'data') {
            const rowIndex = this._grid.model.getRowIndex(anchor.rowId);
            if (rowIndex >= 0) {
                selection[0].r = rowIndex;
                this._reanchorSelection(selection);
                return;
            }
        }

        //Group rows cannot hold a selection unless the host opted in, so there
        //is nowhere to fall back to — drop it rather than land it on a row the
        //user cannot select.
        if (!this._selectableGroupRows) {
            selection.length = 0;
            return;
        }
        for (let i = anchor.ancestorKeys.length - 1; i >= 0; i--) {
            const group = this._groupRowByKey[anchor.ancestorKeys[i]];
            if (group && group.visibleIndex >= 0) {
                selection[0].r = headerRowCount + group.visibleIndex;
                this._reanchorSelection(selection);
                return;
            }
        }
        selection.length = 0;
    }

    //Moving the selection to another row can land its column inside a span that
    //row declares and the old one did not — a group row's label, above all. A
    //covered column renders no node, so the highlight would vanish and every
    //consumer keyed on the stored column would miss. Re-anchor after the move.
    _reanchorSelection (selection) {
        const model = this._grid.model;
        if (typeof model.getSpanAnchor !== 'function') {
            return;
        }
        const colIndex = model.getSpanAnchor(selection[0].r, selection[0].c);
        selection[0].c = colIndex;
        selection[0].w = model.getColumnSpan(selection[0].r, colIndex);
    }

    //Pass 1 gathers records into a tree keyed by value path (first-encounter
    //order within the current DataTable projection). Pass 2 flattens the tree
    //into the visible row list, skipping the descendants of collapsed groups.
    _buildIndex () {
        const data = this._grid.data;
        const dataRowCount = data.getRowCount();
        const fields = this._groupBy;

        this._rows = [];
        this._groups = [];
        this._groupRowByKey = {};
        this._visibleByDataRow = {};
        this._ancestorKeysByDataRow = {};

        if (fields.length === 0) {
            for (let i = 0; i < dataRowCount; i++) {
                this._visibleByDataRow[i] = this._rows.length;
                this._rows.push({ kind: 'data', dataRowIndex: i });
            }
            return;
        }

        const root = { children: [], childMap: {} };
        for (let i = 0; i < dataRowCount; i++) {
            const rowData = data.getRowDataAt(i);
            let node = root;
            const path = [];
            const ancestorKeys = [];
            for (let d = 0; d < fields.length; d++) {
                path.push(normalizeValue(rowData ? rowData[fields[d]] : undefined));
                const key = pathKey(path);
                ancestorKeys.push(key);
                let child = node.childMap[key];
                if (!child) {
                    child = {
                        key: key,
                        path: path.slice(),
                        value: path[path.length - 1],
                        level: d,
                        children: [],
                        childMap: {},
                        rows: [],
                        count: 0
                    };
                    node.childMap[key] = child;
                    node.children.push(child);
                }
                child.count++;
                node = child;
            }
            node.rows.push(i);
            this._ancestorKeysByDataRow[i] = ancestorKeys;
        }

        this._flatten(root.children, false);
    }

    //Walks the whole tree so every group is registered — including groups buried
    //inside a collapsed ancestor, which still have fold state and still answer to
    //expandAll/getState — but only emits rows for what is actually on screen.
    _flatten (nodes, hidden) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const entry = this._foldState[node.key];
            const collapsed = entry ? entry.collapsed : this._collapsedByDefault;

            const groupRow = {
                kind: 'group',
                key: node.key,
                path: node.path,
                value: node.value,
                label: this._formatLabel(node),
                level: node.level,
                count: node.count,
                collapsed: collapsed,
                visibleIndex: hidden ? -1 : this._rows.length,
                //Model#getRowModel hands this back for the row, which is how the
                //group class reaches every cell of the row via getCellClasses.
                //`selectable: false` keeps SelectionExtension off every cell of
                //the row — mouse, keyboard and selectCell alike.
                rowModel: { cssClass: this._cssClass, editable: false, selectable: this._selectableGroupRows },
                //...and Model#getCellModel hands this back per column, which is
                //how the label cell declares its span. Null when there is
                //nothing to span across.
                cellModel: this._labelCellModel
            };

            this._groups.push(groupRow);
            this._groupRowByKey[node.key] = groupRow;
            if (!hidden) {
                this._rows.push(groupRow);
            }

            const childrenHidden = hidden || collapsed;
            if (node.children.length > 0) {
                this._flatten(node.children, childrenHidden);
            } else if (!childrenHidden) {
                for (let r = 0; r < node.rows.length; r++) {
                    this._visibleByDataRow[node.rows[r]] = this._rows.length;
                    this._rows.push({ kind: 'data', dataRowIndex: node.rows[r] });
                }
            }
        }
    }

    _formatLabel (node) {
        let text;
        if (this._groupLabel) {
            text = this._groupLabel(node.value, node.path.slice(), node.count);
        } else if (node.value === null) {
            text = this._emptyLabel;
        } else {
            text = String(node.value);
        }
        if (text === null || text === undefined) {
            text = '';
        }
        if (this._showCount) {
            text = text + ' (' + node.count + ')';
        }
        return text;
    }

}

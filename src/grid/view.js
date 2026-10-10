import { EventDispatcher } from './event';
import ResizeObserver from 'resize-observer-polyfill';
import { getCellRect, isCellVisible, getPaneRanges, layoutPaneCells } from './virtualization';

export class View extends EventDispatcher {

	constructor (model, extensions) {
		super();
		this._model = model;
        this._extensions = extensions;
        this._recycledCells = [];
        this._cellReference = {};
		this._template = 	'<div class="pgrid-content-pane" style="position: relative;">' +
							'	<div class="pgrid-top-left-pane" style="position: absolute;">' +
							'		<div class="pgrid-top-left-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>' +
							'	</div>' +
							'	<div class="pgrid-top-pane" style="position: absolute;">' +
							'		<div class="pgrid-top-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>' +
							'	</div>' +
							'	<div class="pgrid-left-pane" style="position: absolute;">' +
							'		<div class="pgrid-left-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>' +
							'	</div>' +
							'	<div class="pgrid-center-pane" style="position: absolute;">' +
							'		<div class="pgrid-center-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>' +
							'	</div>' +
							'	<div class="pgrid-bottom-left-pane" style="position: absolute;">' +
							'		<div class="pgrid-bottom-left-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>' +
							'	</div>' +
							'	<div class="pgrid-bottom-pane" style="position: absolute;">' +
							'		<div class="pgrid-bottom-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>' +
							'	</div>' +
							//Span layers, one per row band, laid over that band's frozen AND
							//scrolling panes and never scrolled horizontally. They host sticky
							//spans (see Model#isStickySpan): cells that start in the frozen
							//block but read across the whole visible width. Click-through,
							//except on the cells they hold.
							'	<div class="pgrid-span-layer pgrid-top-span-layer" style="position: absolute; overflow: hidden; pointer-events: none;">' +
							'		<div class="pgrid-top-span-inner" style="width: 100%; height: 100%; position: relative;"></div>' +
							'	</div>' +
							'	<div class="pgrid-span-layer pgrid-body-span-layer" style="position: absolute; overflow: hidden; pointer-events: none;">' +
							'		<div class="pgrid-body-span-inner" style="width: 100%; height: 100%; position: relative;"></div>' +
							'	</div>' +
							'	<div class="pgrid-span-layer pgrid-bottom-span-layer" style="position: absolute; overflow: hidden; pointer-events: none;">' +
							'		<div class="pgrid-bottom-span-inner" style="width: 100%; height: 100%; position: relative;"></div>' +
							'	</div>' +
							'</div>' +
							'<div class="pgrid-hscroll" style="position: absolute; bottom: 0px; overflow-y: hidden; overflow-x: scroll;">' +
							'	<div class="pgrid-hscroll-thumb"></div>' +
							'</div>' +
							'<div class="pgrid-vscroll" style="position: absolute; right: 0px; top: 0px; overflow-y: scroll; overflow-x: hidden;">' +
							'	<div class="pgrid-vscroll-thumb"></div>' +
							'</div>';
	}

	render (element) {
		this._element = element;
		this._element.className = 'pgrid';
		this._element.innerHTML = this._template;
		this._element.style.position = 'relative';
		this._element.style.overflow = 'hidden';
		this._element.tabIndex = 1;

		this._contentPane = this._element.querySelector('.pgrid-content-pane');
		this._topLeftPane = this._element.querySelector('.pgrid-top-left-pane');
		this._topLeftInner = this._element.querySelector('.pgrid-top-left-inner');
		this._topPane = this._element.querySelector('.pgrid-top-pane');
		this._topInner = this._element.querySelector('.pgrid-top-inner');
		this._leftPane = this._element.querySelector('.pgrid-left-pane');
		this._leftInner = this._element.querySelector('.pgrid-left-inner');
		this._centerPane = this._element.querySelector('.pgrid-center-pane');
		this._centerInner = this._element.querySelector('.pgrid-center-inner');
		this._bottomPane = this._element.querySelector('.pgrid-bottom-pane');
		this._bottomInner = this._element.querySelector('.pgrid-bottom-inner');
		this._bottomLeftPane = this._element.querySelector('.pgrid-bottom-left-pane');
		this._bottomLeftInner = this._element.querySelector('.pgrid-bottom-left-inner');
		this._topSpanLayer = this._element.querySelector('.pgrid-top-span-layer');
		this._topSpanInner = this._element.querySelector('.pgrid-top-span-inner');
		this._bodySpanLayer = this._element.querySelector('.pgrid-body-span-layer');
		this._bodySpanInner = this._element.querySelector('.pgrid-body-span-inner');
		this._bottomSpanLayer = this._element.querySelector('.pgrid-bottom-span-layer');
		this._bottomSpanInner = this._element.querySelector('.pgrid-bottom-span-inner');

		this._scrollWidth = this._measureScrollbarWidth();

		this._hScroll = this._element.querySelector('.pgrid-hscroll');
		this._vScroll = this._element.querySelector('.pgrid-vscroll');
		this._hScrollThumb = this._element.querySelector('.pgrid-hscroll-thumb');
		this._vScrollThumb = this._element.querySelector('.pgrid-vscroll-thumb');
		this._hScroll.style.height = this._scrollWidth + 'px';
		this._vScroll.style.width = this._scrollWidth + 'px';
		this._hScrollThumb.style.height = this._scrollWidth + 'px';
		this._vScrollThumb.style.width = this._scrollWidth + 'px';

		this._observeSize();
		this._resturecture();
		this._attachHandlers();

		this._extensions.executeExtension('gridAfterRender', {
			grid: this
		});
	}

	reRender () {
		this._topLeftInner.innerHTML = '';
		this._topInner.innerHTML = '';
		this._leftInner.innerHTML = '';
		this._centerInner.innerHTML = '';
		this._bottomLeftInner.innerHTML = '';
        this._bottomInner.innerHTML = '';
        this._topSpanInner.innerHTML = '';
        this._bodySpanInner.innerHTML = '';
        this._bottomSpanInner.innerHTML = '';
        //Keyed by "row,col" — an object, matching the constructor. This was an
        //array literal, which worked only because arrays tolerate string keys.
        this._cellReference = {};

        this._model.calcTotalSize();
		this._resturecture();
	}

	getElement () {
		return this._element;
	}

	setScrollX (x, adjustScrollBar) {
		this._topPane.scrollLeft = x;
		this._centerPane.scrollLeft = x;
		this._bottomPane.scrollLeft = x;
		if (adjustScrollBar || adjustScrollBar === undefined) {
			this._hScroll.scrollLeft = x;
		}
	}

	getScrollX () {
		return this._centerPane.scrollLeft;
	}

	setScrollY (y, adjustScrollBar) {
        let maxScrollY = this._leftInner.clientHeight - this._leftPane.clientHeight;
        if (y > maxScrollY) {
            y = maxScrollY;
        }
		this._centerPane.scrollTop = y;
		this._leftPane.scrollTop = y;
		this._bodySpanLayer.scrollTop = y;
		if (adjustScrollBar || adjustScrollBar === undefined) {
			this._vScroll.scrollTop = y;
		}
	}

	getScrollY () {
		return this._centerPane.scrollTop;
	}

	scrollToCell (rowIndex, colIndex, alignTop) {
		let cell = this.getCell(rowIndex, colIndex);
		let origScrollTop = cell.parentElement.parentElement.scrollTop;
		let origScrollLeft = cell.parentElement.parentElement.scrollLeft;

		cell.scrollIntoViewIfNeeded(false);

		if (origScrollTop !== cell.parentElement.parentElement.scrollTop) {
			this.setScrollY(cell.parentElement.parentElement.scrollTop, true);
		}
		if (origScrollLeft !== cell.parentElement.parentElement.scrollLeft) {
			this.setScrollX(cell.parentElement.parentElement.scrollLeft, true);
		}
	}

	getCell (rowIndex, colIndex, createNewCell) {
        //A column covered by a span has no node of its own — the spanning cell
        //owns the coordinate. Resolving here is what keeps scrollToCell,
        //updateCell, selection, the editor and paste working over a span
        //without any of them having to know spans exist.
        colIndex = this._spanAnchor(rowIndex, colIndex);
        let cell = this._queryCell(rowIndex, colIndex);
        if (cell) {
            return cell;
        } else
        if (createNewCell === false) {
            return null;
        } else {
            //Scroll offsets are in the scrolling panes' own coordinates, which
            //start at the frozen boundary, so the grid rect is shifted by the
            //frozen size first and the band is decided by index, not by x/y.
            //Only a cell in a scrolling band scrolls that axis, and the first
            //scrolling column (x === frozen width) and first body row are in it.
            let leftFreezeSize = this._model.getLeftFreezeSize();
            let topFreezeSize = this._model.getTopFreezeSize();
            let cellRect = this._getCellRect(rowIndex, colIndex);
            if (colIndex >= this._model.getLeftFreezeRows()) {
                let scrollX = this.getScrollX();
                let paneX = cellRect.x - leftFreezeSize;
                let paneWidth = this._centerPane.offsetWidth;
                if (paneX < scrollX) {
                    this.setScrollX(paneX);
                } else
                if (paneX + cellRect.width > scrollX + paneWidth) {
                    this.setScrollX(Math.min(paneX, (paneX + cellRect.width) - paneWidth));
                }
            }
            if (rowIndex >= this._model.getTopFreezeRows() &&
                rowIndex < this._model.getRowCount() - this._model.getBottomFreezeRows()) {
                let scrollY = this.getScrollY();
                let paneY = cellRect.y - topFreezeSize;
                let paneHeight = this._centerPane.offsetHeight;
                if (paneY < scrollY) {
                    this.setScrollY(paneY);
                } else
                if (paneY + cellRect.height > scrollY + paneHeight) {
                    this.setScrollY(Math.min(paneY, (paneY + cellRect.height) - paneHeight));
                }
            }
            this._renderCells();
            return this._queryCell(rowIndex, colIndex);
        }
	}

    //Raw lookup by the coordinates a cell actually renders under. The caller is
    //responsible for having resolved a span anchor first.
    //Goes through the live registry rather than the DOM: a recycled cell stays
    //in the DOM, hidden, and a selector query could hand back that stale node
    //instead of reporting "not rendered" — which made getCell skip scrolling.
    _queryCell (rowIndex, colIndex) {
        return this._cellReference[rowIndex + ',' + colIndex] || null;
    }

	updateCell (rowIndex, colIndex) {
        //Everything below addresses the cell by (rowIndex, colIndex), so resolve
        //a covered coordinate to its anchor once, here — and then look the node
        //up directly rather than through getCell, which would resolve again.
        colIndex = this._spanAnchor(rowIndex, colIndex);

        //Ignore updating cell that's outside of the viewport
		let cell = this._queryCell(rowIndex, colIndex);
		if (cell) {
			//Create cell content wrapper if not any
			let cellContent = cell.firstChild;

			//Get data to be updated
			let data = this._model.getDataAt(rowIndex, colIndex);

			//Data can be transformed before rendering using dataBeforeRender extension
			let arg = {data: data};
			this._extensions.executeExtension('dataBeforeRender', arg);
			data = arg.data;

			//If there's cellUpdate extension, then execute it to update the cell data
			//Else use default way to put the data directly to the cell content
            let handledByExt = false;
            let rowId = this._model.getRowId(rowIndex);
            let field = this._model.getColumnField(colIndex);
			if (this._extensions.hasExtension('cellUpdate')) {
				arg = {
					data,
					cell,
					cellContent,
					rowIndex,
					colIndex,
					rowId,
					field,
					handled: false
				}
				this._extensions.executeExtension('cellUpdate', arg);
				handledByExt = arg.handled;
			}

			if (!handledByExt) {
				if (data !== undefined && data !== null) {
					cellContent.innerHTML = data;
				} else {
					cellContent.innerHTML = '';
				}
			}

			this._extensions.executeExtension('cellAfterUpdate', {
                data,
                cell,
                cellContent,
                rowIndex,
                colIndex,
                rowId,
                field,
            });
		}
	}

	_attachHandlers () {

		this._vScrollHandler = (e) => {
            this.setScrollY(e.target.scrollTop, false);
            this._renderCells();
			this.dispatch('vscroll', e);
		};

		this._hScrollHandler = (e) => {
			this.setScrollX(e.target.scrollLeft, false);
            this._renderCells();
			this.dispatch('hscroll', e);
		};

		this._wheelHandler = (e) => {
			let currentX = this.getScrollX();
			let currentY = this.getScrollY();
			this.setScrollX(currentX + e.deltaX);
			this.setScrollY(currentY + e.deltaY);
            this._renderCells();
			if (e.deltaX !== 0) {
				this.dispatch('hscroll', e);
			}
			if (e.deltaY !== 0) {
				this.dispatch('vscroll', e);
			}
		};

		this._keyDownHandler = (e) => {
			this._extensions.executeExtension('keyDown', e);
		};

		this._vScroll.addEventListener('scroll', this._vScrollHandler);
		this._hScroll.addEventListener('scroll', this._hScrollHandler);
		this._contentPane.addEventListener('wheel', this._wheelHandler);
		this._element.addEventListener('keydown', this._keyDownHandler);

	}

	_resturecture () {
		this._contentPane.style.width = 'calc(100% - ' + this._scrollWidth + 'px)';
		this._contentPane.style.height = 'calc(100% - ' + this._scrollWidth + 'px)';

		let topFreezeSize = this._model.getTopFreezeSize();
		let bottomFreezeSize = this._model.getBottomFreezeSize();
		let leftFreezeSize = this._model.getLeftFreezeSize();

		this._topLeftPane.style.left = '0px';
		this._topLeftPane.style.top = '0px';
		this._topLeftPane.style.width = leftFreezeSize + 'px';
		this._topLeftPane.style.height = topFreezeSize + 'px';
		this._topPane.style.left = leftFreezeSize + 'px';
		this._topPane.style.top = '0px';
		this._topPane.style.width = 'calc(100% - ' + leftFreezeSize + 'px)';
		this._topPane.style.height = topFreezeSize + 'px';
		this._leftPane.style.left = '0px';
		this._leftPane.style.top = topFreezeSize + 'px';
		this._leftPane.style.width = leftFreezeSize + 'px';
		this._leftPane.style.height = 'calc(100% - ' + (topFreezeSize + bottomFreezeSize) + 'px)';
		this._centerPane.style.left = leftFreezeSize + 'px';
		this._centerPane.style.top = topFreezeSize + 'px';
		this._centerPane.style.width = 'calc(100% - ' + leftFreezeSize + 'px)';
		this._centerPane.style.height = 'calc(100% - ' + (topFreezeSize + bottomFreezeSize) + 'px)';
		this._bottomLeftPane.style.left = '0px';
		this._bottomLeftPane.style.bottom = '0px';
		this._bottomLeftPane.style.width = leftFreezeSize + 'px';
		this._bottomLeftPane.style.height = bottomFreezeSize + 'px';
		this._bottomPane.style.left = leftFreezeSize + 'px';
		this._bottomPane.style.bottom = '0px';
		this._bottomPane.style.width = 'calc(100% - ' + leftFreezeSize + 'px)';
		this._bottomPane.style.height = bottomFreezeSize + 'px';

		//Each span layer covers its band's full width, but never more than the
		//columns actually reach, so a sticky span ends where the grid does.
		const spanLayerMaxWidth = this._model.getTotalWidth() + 'px';
		this._topSpanLayer.style.left = '0px';
		this._topSpanLayer.style.top = '0px';
		this._topSpanLayer.style.width = '100%';
		this._topSpanLayer.style.maxWidth = spanLayerMaxWidth;
		this._topSpanLayer.style.height = topFreezeSize + 'px';
		this._bodySpanLayer.style.left = '0px';
		this._bodySpanLayer.style.top = topFreezeSize + 'px';
		this._bodySpanLayer.style.width = '100%';
		this._bodySpanLayer.style.maxWidth = spanLayerMaxWidth;
		this._bodySpanLayer.style.height = 'calc(100% - ' + (topFreezeSize + bottomFreezeSize) + 'px)';
		this._bottomSpanLayer.style.left = '0px';
		this._bottomSpanLayer.style.bottom = '0px';
		this._bottomSpanLayer.style.width = '100%';
		this._bottomSpanLayer.style.maxWidth = spanLayerMaxWidth;
		this._bottomSpanLayer.style.height = bottomFreezeSize + 'px';

		this._renderCells();
		this._updateScrollBar();
	}

	_observeSize () {
		this._resizeObserver = new ResizeObserver((entries, observer) => {
			this._updateScrollBar();
		});
		this._resizeObserver.observe(this._element);
	}

	_updateScrollBar () {
		let totalWidth = this._model.getTotalWidth();
		let totalHeight = this._model.getTotalHeight();
		this._hScrollThumb.style.width = totalWidth + 'px';
		this._vScrollThumb.style.height = totalHeight + 'px';

		let gridRect = this._element.getBoundingClientRect();
		let scrollBarState = this._model.determineScrollbarState(gridRect.width, gridRect.height, this._scrollWidth);

		switch (scrollBarState) {
			case 'n':
				this._hScroll.style.display = 'none';
				this._vScroll.style.display = 'none';
				this._contentPane.style.width = '100%';
				this._contentPane.style.height = '100%';
				break;
			case 'h':
				this._hScroll.style.display = 'block';
				this._vScroll.style.display = 'none';
				this._hScroll.style.width = '100%';
				this._contentPane.style.width = '100%';
				this._contentPane.style.height = 'calc(100% - ' + this._scrollWidth + 'px)';
				break;
			case 'v':
				this._hScroll.style.display = 'none';
				this._vScroll.style.display = 'block';
				this._vScroll.style.height = '100%';
				this._contentPane.style.width = 'calc(100% - ' + this._scrollWidth + 'px)';
				this._contentPane.style.height = '100%';
				break;
			case 'b':
				this._hScroll.style.display = 'block';
				this._vScroll.style.display = 'block';
				this._hScroll.style.width = 'calc(100% - ' + this._scrollWidth + 'px)';
				this._vScroll.style.height = 'calc(100% - ' + this._scrollWidth + 'px)';
				this._contentPane.style.width = 'calc(100% - ' + this._scrollWidth + 'px)';
				this._contentPane.style.height = 'calc(100% - ' + this._scrollWidth + 'px)';
				break;
		}
    }

    _getCellRect (rowIndex, colIndex) {
        return getCellRect(this._model, rowIndex, colIndex);
    }

    _spanAnchor (rowIndex, colIndex) {
        if (typeof this._model.getSpanAnchor !== 'function') {
            return colIndex;
        }
        return this._model.getSpanAnchor(rowIndex, colIndex);
    }

	_renderCells () {
        const ranges = getPaneRanges({
            rowCount: this._model.getRowCount(),
            columnCount: this._model.getColumnCount(),
            topFreeze: this._model.getTopFreezeRows(),
            leftFreeze: this._model.getLeftFreezeRows(),
            bottomFreeze: this._model.getBottomFreezeRows()
        });

        const panes = {
            topLeft:    { host: this._topLeftPane,    inner: this._topLeftInner,    setWidth: false, setHeight: false, spanInner: this._topSpanInner },
            top:        { host: this._topPane,        inner: this._topInner,        setWidth: true,  setHeight: true  },
            left:       { host: this._leftPane,       inner: this._leftInner,       setWidth: false, setHeight: true,  spanInner: this._bodySpanInner },
            center:     { host: this._centerPane,     inner: this._centerInner,     setWidth: true,  setHeight: true  },
            bottomLeft: { host: this._bottomLeftPane, inner: this._bottomLeftInner, setWidth: false, setHeight: false, spanInner: this._bottomSpanInner },
            bottom:     { host: this._bottomPane,     inner: this._bottomInner,     setWidth: true,  setHeight: true  }
        };

        for (const name of Object.keys(panes)) {
            const { host, inner, setWidth, setHeight, spanInner } = panes[name];
            const viewport = {
                scrollLeft: host.scrollLeft,
                scrollTop:  host.scrollTop,
                width:      host.offsetWidth,
                height:     host.offsetHeight
            };
            const { cells, totalWidth, totalHeight } = layoutPaneCells(this._model, ranges[name], viewport);
            for (const cell of cells) {
                this._renderCell(cell, (cell.sticky && spanInner) ? spanInner : inner);
            }
            if (setWidth)  inner.style.width  = totalWidth  + 'px';
            if (setHeight) inner.style.height = totalHeight + 'px';
            //The body span layer scrolls vertically in lockstep with the left
            //pane, so its content has to be exactly as tall.
            if (setHeight && spanInner) spanInner.style.height = totalHeight + 'px';
        }
    }

    _isCellVisible (paneWidth, paneHeight, paneScrollLeft, paneScrollTop, cellX, cellY, cellWidth, cellHeight) {
        return isCellVisible(
            { scrollLeft: paneScrollLeft, scrollTop: paneScrollTop, width: paneWidth, height: paneHeight },
            { x: cellX, y: cellY, width: cellWidth, height: cellHeight }
        );
    }

    _createCell (rowIndex, colIndex, x, y, width, height, colspan) {
        let cell = null;
        let key = rowIndex + ',' + colIndex;
        if (this._recycledCells.length > 0) {
            cell = this._recycledCells.pop();
            cell.style.display = 'block';
        } else {
            cell = document.createElement('div');
        }
        if (!cell.firstChild) {
            let cellContent = document.createElement('div');
            cellContent.className = 'pgrid-cell-content';
            cell.appendChild(cellContent);
        }
		cell.style.left = x + 'px';
		cell.style.top = y + 'px';
		cell.style.width = width + 'px';
		cell.style.height = height + 'px';
        cell.style.pointerEvents = '';
        cell.dataset.rowIndex = rowIndex;
        cell.dataset.colIndex = colIndex;
        cell.dataset.key = key;
        //Cells are pooled, so a span has to be cleared as deliberately as it is
        //set — a recycled node must not claim a span it no longer has.
        if (colspan > 1) {
            cell.dataset.colspan = colspan;
        } else {
            delete cell.dataset.colspan;
        }

        //Only the anchor is keyed. Covered coordinates are deliberately absent:
        //they have no entry in the layout either, and getCell resolves them.
        this._cellReference[key] = cell;
        return cell;
    }

    _recycleCell (cell) {
        //Clear cell reference cache
        this._cellReference[cell.dataset.key] = null;

        //Clear cell content
        cell.title = '';
        let cellContent = cell.firstChild;
        if (cellContent) {
            while (cellContent.firstChild) {
                cellContent.removeChild(cellContent.firstChild);
            }
        }

        //Hide the cell instead of removing it from the DOM
        cell.style.display = 'none';

        //Push cell in the recycled list to be reused later
        this._recycledCells.push(cell);

        this._extensions.executeExtension('cellAfterRecycled', { cell });

        //Drop the coordinates last (hooks above may still read them), so a DOM
        //query by data-row-index / data-col-index only ever matches live cells.
        delete cell.dataset.rowIndex;
        delete cell.dataset.colIndex;
        delete cell.dataset.key;
        delete cell.dataset.colspan;
    }

	_renderCell (cellInfo, pane) {
        const { rowIndex, colIndex, x, y, width, height, visible, colspan, sticky } = cellInfo;
        let key = rowIndex + ',' + colIndex;

        //If the cell is outside of the viewport, then recycle the cell if it has already been created
        if (!visible) {
            let cell = this._cellReference[key];
            if (cell) {
                this._recycleCell(cell);
            }
            return false;
        }

        //If the cell already rendered, just skip the rendering
        let existingCell = this._cellReference[key];
        if (existingCell) {
            return true;
        }

		let data = this._model.getDataAt(rowIndex, colIndex);

        //Data can be transformed before rendering using dataBeforeRender extension
		let arg = {data: data};
		this._extensions.executeExtension('dataBeforeRender', arg);
		data = arg.data;

		let cell = this._createCell(rowIndex, colIndex, x, y, width, height, colspan);
		let cellClasses = this._model.getCellClasses(rowIndex, colIndex);
		cell.className = 'pgrid-cell ' + cellClasses.join(' ');
        if (sticky) {
            //Hosted in a span layer, which starts at x 0 like the frozen pane,
            //so the same x lands it where it would have been; the width runs
            //on to the layer's right edge. _createCell and the className line
            //above reset all three when the node is next handed out.
            cell.classList.add('pgrid-cell-sticky-span');
            cell.style.width = 'calc(100% - ' + x + 'px)';
            cell.style.pointerEvents = 'auto';
        }

		pane.appendChild(cell);
        let cellContent = cell.firstChild;
		let eventArg = {
			cell,
			cellContent,
			rowIndex,
			colIndex,
			data,
			rowId: this._model.getRowId(rowIndex),
			field: this._model.getColumnField(colIndex),
			handled: false
		};

		//If there's cellRender extension, use cellRender extension to render the cell
		//Else just set the data to the cellContent directly
		let handledByExt = false;
		if (this._extensions.hasExtension('cellRender')) {
			this._extensions.executeExtension('cellRender', eventArg);
			handledByExt = eventArg.handled;
		}

		if (!handledByExt) {
			if (data !== undefined) {
				cellContent.innerHTML = data;
			}
		}

		this._extensions.executeExtension('cellAfterRender', eventArg);
		this._extensions.executeExtension('cellAfterUpdate', eventArg);

        eventArg = null;

        return true;
	}

	_measureScrollbarWidth () {
		var inner = document.createElement('p');
		inner.style.width = '100%';
		inner.style.height = '200px';
		var outmost = document.createElement('div');
		outmost.className = 'pgrid';
		var outer = document.createElement('div');
		outer.style.position = 'absolute';
		outer.style.top = '0px';
		outer.style.left = '0px';
		outer.style.visibility = 'hidden';
		outer.style.width = '200px';
		outer.style.height = '150px';
		outer.style.overflow = 'hidden';
		outer.appendChild(inner);
		outmost.appendChild(outer);
		document.body.appendChild(outmost);
		var w1 = inner.offsetWidth;
		outer.style.overflow = 'scroll';
		var w2 = inner.offsetWidth;
		if (w1 == w2) w2 = outer.clientWidth;
		document.body.removeChild (outmost);
		return (w1 - w2) + (this._detectIE()?1:0);
	}


	_detectIE () {
	  var ua = window.navigator.userAgent;
	  var msie = ua.indexOf('MSIE ');
	  if (msie > 0) {
	    // IE 10 or older => return version number
	    return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
	  }

	  var trident = ua.indexOf('Trident/');
	  if (trident > 0) {
	    // IE 11 => return version number
	    var rv = ua.indexOf('rv:');
	    return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
	  }

	  var edge = ua.indexOf('Edge/');
	  if (edge > 0) {
	    // Edge (IE 12+) => return version number
	    return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
	  }
	  // other browser
	  return false;
	}
}
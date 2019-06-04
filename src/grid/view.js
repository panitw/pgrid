import { EventDispatcher } from './event';
import ResizeObserver from 'resize-observer-polyfill';

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
        this._cellReference = [];

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

	getCell (rowIndex, colIndex) {
        let cell = this._element.querySelector('[data-row-index="'+rowIndex+'"][data-col-index="'+colIndex+'"]');
        if (cell) {
            return cell;
        } else {
            let leftFreezeSize = this._model.getLeftFreezeSize();
            let topFreezeSize = this._model.getTopFreezeSize();
            let bottomFreezeSize = this._model.getBottomFreezeSize();
            let cellRect = this._getCellRect(rowIndex, colIndex);
            let scrollX = this.getScrollX();
            let scrollY = this.getScrollY();
            let gridRect = this._element.getBoundingClientRect();
            if (cellRect.x > leftFreezeSize) {
                if (cellRect.x < (scrollX + leftFreezeSize)) {
                    this.setScrollX(cellRect.x - leftFreezeSize);
                } else
                if (scrollX + gridRect.width < cellRect.x + cellRect.width) {
                    this.setScrollX((cellRect.x + cellRect.width) - gridRect.width);
                }
            }
            if (cellRect.y < (scrollY + topFreezeSize)) {
                this.setScrollY(cellRect.y);
            } else
            if ((scrollY + gridRect.height) - bottomFreezeSize < cellRect.y + cellRect.height) {
                this.setScrollY((cellRect.y + cellRect.height) - gridRect.height);
            }
            this._renderCells();
        }
	}

	updateCell (rowIndex, colIndex) {
		let cell = this.getCell(rowIndex, colIndex);
		if (cell) {
			//Create cell content wrapper if not any
			let cellContent = null;
			if (!cell.firstChild || !cell.firstChild.classList.contains('pgrid-cell-content')) {
				//Clear cell
				cell.innerHTML = '';

				//Add new cell content
				cellContent = document.createElement('div');
				cellContent.className = 'pgrid-cell-content';
				cell.appendChild(cellContent);
			} else {
				cellContent = cell.firstChild;
			}

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
		let topRunner = 0;
        let leftRunner = 0;
        let cellWidth = 0;
        let cellHeight = 0;
        for (let i=0; i<rowIndex; i++) {
            cellHeight = this._model.getRowHeight(i)
            topRunner += cellHeight;
        }
        for (let i=0; i<colIndex; i++) {
            cellWidth = this._model.getColumnWidth(i);
            leftRunner += cellWidth;
        }
        return {x: leftRunner, y: topRunner, width: cellWidth, height: cellHeight};
    }

	_renderCells () {
		let topFreeze = this._model.getTopFreezeRows();
		let leftFreeze = this._model.getLeftFreezeRows();
		let bottomFreeze = this._model.getBottomFreezeRows();
		let rowCount = this._model.getRowCount();
		let columnCount = this._model.getColumnCount();
		let topRunner = 0;
		let leftRunner = 0;
		let colWidth = [];
        let paneScrollLeft = 0;
        let paneScrollTop = 0;
        let paneWidth = 0;
        let paneHeight = 0;
        let paneScrollLeft2 = 0;
        let paneScrollTop2 = 0;
        let paneWidth2 = 0;
        let paneHeight2 = 0;

		//Render top rows
        paneScrollLeft = this._topLeftPane.scrollLeft;
        paneScrollTop = this._topLeftPane.scrollTop;
        paneWidth = this._topLeftPane.offsetWidth;
        paneHeight = this._topLeftPane.offsetHeight;
        paneScrollLeft2 = this._topPane.scrollLeft;
        paneScrollTop2 = this._topPane.scrollTop;
        paneWidth2 = this._topPane.offsetWidth;
        paneHeight2 = this._topPane.offsetHeight;
        topRunner = 0;
		for (let j=0; j<topFreeze; j++) {
			let rowHeight = this._model.getRowHeight(j);
			//Render top left cells
            leftRunner = 0;
			for (let i=0; i<leftFreeze; i++) {
				colWidth[i] = this._model.getColumnWidth(i);
                this._renderCell(j, i, this._topLeftInner, paneWidth, paneHeight, paneScrollLeft, paneScrollTop, leftRunner, topRunner, colWidth[i], rowHeight);
				leftRunner += colWidth[i];
            }

			//Render top cells
			leftRunner = 0;
			for (let i=leftFreeze; i<columnCount; i++) {
				colWidth[i] = this._model.getColumnWidth(i);
				this._renderCell(j, i, this._topInner, paneWidth2, paneHeight2, paneScrollLeft2, paneScrollTop2, leftRunner, topRunner, colWidth[i], rowHeight);
				leftRunner += colWidth[i];
			}
			topRunner += rowHeight;
        }
        this._topInner.style.width = leftRunner + 'px';
        this._topInner.style.height = topRunner + 'px';

		//Render middle rows
        paneScrollLeft = this._leftPane.scrollLeft;
        paneScrollTop = this._leftPane.scrollTop;
        paneWidth = this._leftPane.offsetWidth;
        paneHeight = this._leftPane.offsetHeight;
        paneScrollLeft2 = this._centerPane.scrollLeft;
        paneScrollTop2 = this._centerPane.scrollTop;
        paneWidth2 = this._centerPane.offsetWidth;
        paneHeight2 = this._centerPane.offsetHeight;
        topRunner = 0;
		for (let j=topFreeze; j<(rowCount-bottomFreeze); j++) {
			let rowHeight = this._model.getRowHeight(j);
			//Render left cells
			leftRunner = 0;
			for (let i=0; i<leftFreeze; i++) {
				this._renderCell(j, i, this._leftInner, paneWidth, paneHeight, paneScrollLeft, paneScrollTop, leftRunner, topRunner, colWidth[i], rowHeight);
				leftRunner += colWidth[i];
			}
			//Render center cells
			leftRunner = 0;
			for (let i=leftFreeze; i<columnCount; i++) {
				this._renderCell(j, i, this._centerInner, paneWidth2, paneHeight2, paneScrollLeft2, paneScrollTop2, leftRunner, topRunner, colWidth[i], rowHeight);
				leftRunner += colWidth[i];
			}
			topRunner += rowHeight;
		}
        this._leftInner.style.height = topRunner + 'px';
        this._centerInner.style.width = leftRunner + 'px';
        this._centerInner.style.height = topRunner + 'px';

		//Render bottom rows
        paneScrollLeft = this._bottomLeftPane.scrollLeft;
        paneScrollTop = this._bottomLeftPane.scrollTop;
        paneWidth = this._bottomLeftPane.offsetWidth;
        paneHeight = this._bottomLeftPane.offsetHeight;
        paneScrollLeft2 = this._bottomPane.scrollLeft;
        paneScrollTop2 = this._bottomPane.scrollTop;
        paneWidth2 = this._bottomPane.offsetWidth;
        paneHeight2 = this._bottomPane.offsetHeight;
        topRunner = 0;
		for (let j=(rowCount-bottomFreeze); j<rowCount; j++) {
			let rowHeight = this._model.getRowHeight(j);
			//Render left cells
			leftRunner = 0;
			for (let i=0; i<leftFreeze; i++) {
				this._renderCell(j, i, this._bottomLeftInner, paneWidth, paneHeight, paneScrollLeft, paneScrollTop, leftRunner, topRunner, colWidth[i], rowHeight);
				leftRunner += colWidth[i];
			}
			//Render center cells
			leftRunner = 0;
			for (let i=leftFreeze; i<columnCount; i++) {
				this._renderCell(j, i, this._bottomInner, paneWidth2, paneHeight2, paneScrollLeft2, paneScrollTop2, leftRunner, topRunner, colWidth[i], rowHeight);
				leftRunner += colWidth[i];
			}
			topRunner += rowHeight;
		}
        this._bottomInner.style.width = leftRunner + 'px';
        this._bottomInner.style.height = topRunner + 'px';
    }

    _isCellVisible (paneWidth, paneHeight, paneScrollLeft, paneScrollTop, cellX, cellY, cellWidth, cellHeight) {
        if (cellX + cellWidth < paneScrollLeft ||
            cellY + cellHeight < paneScrollTop ||
            cellX > paneScrollLeft + paneWidth ||
            cellY > paneScrollTop + paneHeight) {
            return false;
        } else {
            return true;
        }
    }

    _createCell (rowIndex, colIndex, x, y, width, height) {
        let cell = null;
        let key = rowIndex + ',' + colIndex;
        if (this._recycledCells.length > 0) {
            cell = this._recycledCells.pop();
            cell.style.visibility = 'visible';
        } else {
            cell = document.createElement('div');

            let cellContent = document.createElement('div');
            cellContent.className = 'pgrid-cell-content';
            cell.appendChild(cellContent);
        }
		cell.style.left = x + 'px';
		cell.style.top = y + 'px';
		cell.style.width = width + 'px';
		cell.style.height = height + 'px';
        cell.dataset.rowIndex = rowIndex;
        cell.dataset.colIndex = colIndex;
        cell.dataset.key = key;

        this._cellReference[key] = cell;
        return cell;
    }

    _recycleCell (cell) {
        this._cellReference[cell.dataset.key] = null;
        cell.style.visibility = 'hidden';
        this._recycledCells.push(cell);
    }

	_renderCell (rowIndex, colIndex, pane, paneWidth, paneHeight, paneScrollLeft, paneScrollTop, x, y, width, height) {
        let key = rowIndex + ',' + colIndex;

        //If the cell is outside of the viewport, then recycle the cell if it has already been created
        if (!this._isCellVisible(paneWidth, paneHeight, paneScrollLeft, paneScrollTop, x, y, width, height)) {
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

		let cell = this._createCell(rowIndex, colIndex, x, y, width, height);
		let cellClasses = this._model.getCellClasses(rowIndex, colIndex);
		cell.className = 'pgrid-cell ' + cellClasses.join(' ');

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
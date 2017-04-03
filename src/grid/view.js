import EventDispatcher from './event'

class View extends EventDispatcher {

	constructor (model, data) {
		super();
		this._model = model;
		this._data = data;
		this._template = 	'<div class="content-pane" style="position: relative;">' +
							'	<div class="top-left-pane" style="background-color: green; position: absolute;">' +
							'		<div class="top-left-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>' +
							'	</div>' +
							'	<div class="top-pane" style="background-color: red; position: absolute;">' +
							'		<div class="top-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>' +
							'	</div>' +
							'	<div class="left-pane" style="background-color: blue;position: absolute;">' +
							'		<div class="left-inner" style="width: 100px; height: 100%; overflow: hidden; position: relative;"></div>' +
							'	</div>' +
							'	<div class="center-pane" style="background-color: orange; position: absolute;">' +
							'		<div class="center-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>' +
							'	</div>' +
							'	<div class="bottom-left-pane" style="background-color: yellow; position: absolute;">' +
							'		<div class="bottom-left-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>' +
							'	</div>' +
							'	<div class="bottom-pane" style="background-color: magenta; position: absolute;">' +
							'		<div class="bottom-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>' +
							'	</div>' +
							'</div>' +
							'<div class="hscroll" style="position: absolute; bottom: 0px; background-color: lightblue; overflow-y: hidden; overflow-x: scroll;">' +
							'	<div class="hscroll-thumb" style="background-color: green;"></div>' +
							'</div>' +
							'<div class="vscroll" style="position: absolute; right: 0px; top: 0px; background-color: lightblue; overflow-y: scroll; overflow-x: hidden;">' +
							'	<div class="vscroll-thumb" style="background-color: green;"></div>' +
							'</div>';
	}

	render (element) {
		this._element = element;
		this._element.className = 'pgrid';
		this._element.innerHTML = this._template;
		this._element.style.position = 'relative';
		this._element.style.overflow = 'hidden';

		this._contentPane = this._element.querySelector('.content-pane');
		this._topLeftPane = this._element.querySelector('.top-left-pane');
		this._topLeftInner = this._element.querySelector('.top-left-inner');
		this._topPane = this._element.querySelector('.top-pane');
		this._topInner = this._element.querySelector('.top-inner');
		this._leftPane = this._element.querySelector('.left-pane');
		this._leftInner = this._element.querySelector('.left-inner');
		this._centerPane = this._element.querySelector('.center-pane');
		this._centerInner = this._element.querySelector('.center-inner');
		this._bottomPane = this._element.querySelector('.bottom-pane');
		this._bottomInner = this._element.querySelector('.bottom-inner');
		this._bottomLeftPane = this._element.querySelector('.bottom-left-pane');
		this._bottomLeftInner = this._element.querySelector('.bottom-left-inner');

		this._scrollWidth = this._measureScrollbarWidth();

		this._hScroll = this._element.querySelector('.hscroll');
		this._vScroll = this._element.querySelector('.vscroll');
		this._hScrollThumb = this._element.querySelector('.hscroll-thumb');
		this._vScrollThumb = this._element.querySelector('.vscroll-thumb');
		this._hScroll.style.height = this._scrollWidth + 'px';
		this._vScroll.style.width = this._scrollWidth + 'px';
		this._hScrollThumb.style.height = this._scrollWidth + 'px';
		this._vScrollThumb.style.width = this._scrollWidth + 'px';

		this._resturecture();
		this._attachHandlers();
	}

	setScrollX (x) {
		this._topInner.scrollLeft = x;
		this._centerInner.scrollLeft = x;
		this._bottomInner.scrollLeft = x;
	}

	setScrollY (y) {
		this._centerInner.scrollTop = y;
		this._leftInner.scrollTop = y;
	}

	_attachHandlers () {
		this._vScrollHandler = (e) => {
			this.setScrollY(e.target.scrollTop);
		};

		this._hScrollHandler = (e) => {
			this.setScrollX(e.target.scrollLeft);
		};

		this._vScroll.addEventListener('scroll', this._vScrollHandler);
		this._hScroll.addEventListener('scroll', this._hScrollHandler);
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
				this._vScroll.style.display = 'block';
				this._vScroll.style.display = 'block';
				this._hScroll.style.width = 'calc(100% - ' + this._scrollWidth + 'px)';
				this._vScroll.style.height = 'calc(100% - ' + this._scrollWidth + 'px)';
				this._contentPane.style.width = 'calc(100% - ' + this._scrollWidth + 'px)';
				this._contentPane.style.height = 'calc(100% - ' + this._scrollWidth + 'px)';
				break;
		}
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

		//Render top rows
		topRunner = 0;
		for (let j=0; j<topFreeze; j++) {
			let rowHeight = this._model.getRowHeight(j);
			//Render top left cells
			leftRunner = 0;
			for (let i=0; i<leftFreeze; i++) {
				colWidth[i] = this._model.getColumnWidth(i);
				this._renderCell(j, i, this._topLeftInner, leftRunner, topRunner, colWidth[i], rowHeight);
				leftRunner += colWidth[i];
			}
			//Render top cells
			leftRunner = 0;
			for (let i=leftFreeze; i<columnCount; i++) {
				colWidth[i] = this._model.getColumnWidth(i);
				this._renderCell(j, i, this._topInner, leftRunner, topRunner, colWidth[i], rowHeight);
				leftRunner += colWidth[i];
			}
			topRunner += rowHeight;
		}

		//Render middle rows
		topRunner = 0;
		for (let j=topFreeze; j<(rowCount-bottomFreeze); j++) {
			let rowHeight = this._model.getRowHeight(j);
			//Render left cells
			leftRunner = 0;
			for (let i=0; i<leftFreeze; i++) {
				this._renderCell(j, i, this._leftInner, leftRunner, topRunner, colWidth[i], rowHeight);
				leftRunner += colWidth[i];
			}
			//Render center cells
			leftRunner = 0;
			for (let i=leftFreeze; i<columnCount; i++) {
				this._renderCell(j, i, this._centerInner, leftRunner, topRunner, colWidth[i], rowHeight);
				leftRunner += colWidth[i];
			}
			topRunner += rowHeight;
		}

		//Render bottom rows
		topRunner = 0;
		for (let j=(rowCount-bottomFreeze); j<rowCount; j++) {
			let rowHeight = this._model.getRowHeight(j);
			//Render left cells
			leftRunner = 0;
			for (let i=0; i<leftFreeze; i++) {
				this._renderCell(j, i, this._bottomLeftInner, leftRunner, topRunner, colWidth[i], rowHeight);
				leftRunner += colWidth[i];
			}
			//Render center cells
			leftRunner = 0;
			for (let i=leftFreeze; i<columnCount; i++) {
				this._renderCell(j, i, this._bottomInner, leftRunner, topRunner, colWidth[i], rowHeight);
				leftRunner += colWidth[i];
			}
			topRunner += rowHeight;
		}
	}

	_renderCell (rowIndex, colIndex, pane, x, y, width, height) {
		let data = this._data.getDataAt(rowIndex, colIndex);
		let cell = document.createElement('div');
		cell.className = 'cell';
		cell.style.left = x + 'px';
		cell.style.top = y + 'px';
		cell.style.width = width + 'px';
		cell.style.height = height + 'px';

		let cellContent = document.createElement('div');
		cellContent.className = 'cell-content';
		if (data !== undefined) {
			cellContent.innerHTML = data;
		}
		cell.appendChild(cellContent);
		pane.appendChild(cell);
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
		return (w1 - w2);
	}
}

module.exports = View;
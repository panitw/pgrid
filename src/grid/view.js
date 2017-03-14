import EventDispatcher from './event'

class View extends EventDispatcher {

	constructor (model) {
		super();
		this._model = model;
		this._template = 	'<div class="content-pane" style="position: relative;">' +
							'	<div class="top-left-pane" style="background-color: green; width: 100px; height: 32px; position: absolute;">' +
							'		<div class="top-left-inner" style="width: 100%; height: 32px; overflow: hidden; position: relative;"></div>' +
							'	</div>' +
							'	<div class="top-pane" style="background-color: red; width: calc(100% - 100px); height: 32px; position: absolute; left: 100px;">' +
							'		<div class="top-inner" style="width: 100%; height: 32px; overflow: hidden; position: relative;"></div>' +
							'	</div>' +
							'	<div class="left-pane" style="background-color: blue; width: 100px; height: calc(100% - 64px); position: absolute; top: 32px; left: 0px;">' +
							'		<div class="left-inner" style="width: 100px; height: 100%; overflow: hidden; position: relative;"></div>' +
							'	</div>' +
							'	<div class="center-pane" style="background-color: orange; width: calc(100% - 100px); height: calc(100% - 64px); position: absolute; top: 32px; left: 100px;">' +
							'		<div class="center-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>' +
							'	</div>' +
							'	<div class="bottom-left-pane" style="background-color: yellow; width: 100px; height: 32px; position: absolute; bottom: 0px; left: 0px;">' +
							'		<div class="bottom-left-inner" style="width: 100%; height: 32px; overflow: hidden; position: relative;"></div>' +
							'	</div>' +
							'	<div class="bottom-pane" style="background-color: magenta; width: calc(100% - 100px); height: 32px; position: absolute; bottom: 0px; left: 100px;">' +
							'		<div class="bottom-inner" style="width: 100%; height: 32px; overflow: hidden; position: relative;"></div>' +
							'	</div>' +
							'</div>' +
							'<div class="hscroll" style="width: calc(100% - 8px); height: 8px; position: absolute; bottom: 0px; background-color: lightblue; overflow-y: hidden; overflow-x: scroll;">' +
							'	<div style="height: 8px; width: 900px; background-color: green;"></div>' +
							'</div>' +
							'<div class="vscroll" style="width: 8px; height: calc(100% - 8px); position: absolute; right: 0px; top: 0px; background-color: lightblue; overflow-y: scroll; overflow-x: hidden;">' +
							'	<div style="height: 320px; width: 8px; background-color: green;"></div>' +
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

		this._hScroll = this._element.querySelector('.hscroll');
		this._vScroll = this._element.querySelector('.vscroll');

		this.resturecture();
	}

	resturecture () {
		this._scrollWidth = this._measureScrollbarWidth();
		this._contentPane.style.width = 'calc(100% - ' + this._scrollWidth + 'px)';
		this._contentPane.style.height = 'calc(100% - ' + this._scrollWidth + 'px)';

		let topFreezeSize = this._model.getTopFreezeSize();
		let bottomFreezeSize = this._model.getBottomFreezeSize();
		let leftFreezeSize = this._model.getLeftFreezeSize();
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
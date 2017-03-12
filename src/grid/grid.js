class PGrid {

	constructor(options) {
		this._options = options;
	}

	render(element) {
		this._setContainer(element);

		//Create pane for top-left, top, left, bottom-left, bottom, center
		this._paneTopLeft = this._createPane()
	}

	_setContainer(element) {
		this._container = element;
	}

	_createPane(panePosition) {
		let pane = document.createElement('div');
	}

}

module.exports = PGrid;
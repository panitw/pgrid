import View from './view';
import Model from './model';
import Data from './data';
import EventDispatcher from './event';
import Utils from './utils';

class PGrid extends EventDispatcher {

	constructor(config) {
		super();

		let defaultConfig = {
			rowHeight: 32,
			columnWidth: 100
		};

		this._config = Utils.mixin(config, defaultConfig);
		this._data = new Data(this._config.dataModel);
		this._model = new Model(this._config, this._data);
		this._view = new View(this._model, this._data);
	}

	get view() {
		return this._view;
	}

	render(element) {
		this._view.render(element);
	}

}

module.exports = PGrid; 
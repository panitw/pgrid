import View from './view';
import Model from './model';
import Data from './data';
import Extension from './extension';
import EventDispatcher from './event';
import Utils from './utils';

import SelectionExtension from '../extensions/selection';

class PGrid extends EventDispatcher {

	constructor(config) {
		super();

		let defaultConfig = {
			rowCount: 0,
			columnCount: 0,
			rowHeight: 32,
			columnWidth: 100
		};

		//Extensions Store
		this._extensions = new Extension(this);

		this._config = Utils.mixin(config, defaultConfig);
		this._data = new Data(this._config.dataModel);
		this._model = new Model(this._config, this._data);
		this._view = new View(this._model, this._data, this._extensions);

		//Load default extensions
		if (this._config.selection) {
			this._extensions.loadExtension(new SelectionExtension(this._config.selection));
		}
	}

	get view() {
		return this._view;
	}

	get model() {
		return this._model;
	}

	get data() {
		return this._data;
	}

	get extension() {
		return this._extensions;
	}

	render(element) {
		this._view.render(element);
	}

}

module.exports = PGrid; 
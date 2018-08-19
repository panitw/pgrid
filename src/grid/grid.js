import { View } from './view';
import { Model } from './model';
import { DataTable } from '../data/table';
import { Extension } from './extension';
import { State } from './state';
import { EventDispatcher } from './event';
import { Utils } from './utils';

import { SelectionExtension } from '../extensions/selection';
import { EditorExtension } from '../extensions/editor';
import { CopyPasteExtension } from '../extensions/copypaste';
import { ViewUpdaterExtension } from '../extensions/view-updater';
import { FormatterExtension } from '../extensions/formatter';

export class PGrid extends EventDispatcher {

	constructor(config) {
		super();

		//Merge config with default config
		let defaultConfig = {
			rowCount: 0,
			headerRowCount: 1,
			footerRowCount: 0,
			columnCount: 0,
			rowHeight: 32,
			columnWidth: 100
		};
		this._config = Utils.mixin(config, defaultConfig);

		//Extensions Store
		this._extensions = new Extension(this, this._config);

		this._data = new DataTable(this._config.dataModel, this._extensions);
		this._model = new Model(this._config, this._data);
		this._view = new View(this._model, this._extensions);
		this._state = new State();

		//Load default extensions
		if (this._config.selection) {
			this._extensions.loadExtension(new SelectionExtension());
		}
		if (this._config.editing) {
			this._extensions.loadExtension(new EditorExtension());
		}
		if (this._config.copypaste) {
			this._extensions.loadExtension(new CopyPasteExtension());
		}
		if (this._config.autoUpdate) {
			this._extensions.loadExtension(new ViewUpdaterExtension());
		}
		if (this._config.columnFormatter) {
			this._extensions.loadExtension(new FormatterExtension());
		}

		//Load initial external extensions
		if (this._config.extensions && this._config.extensions.length > 0) {
			this._config.extensions.forEach((ext) => {
				this._extensions.loadExtension(ext);
			});
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

	get state () {
		return this._state;
	}

	render(element) {
		this._view.render(element);
	}

}
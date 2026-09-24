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
import { ColumnResizeExtension } from '../extensions/column-resize';
import { TextOverflowExtension } from '../extensions/text-overflow';
import { FoldableRowsExtension } from '../extensions/foldable-rows';

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

		//Instantiate extensions up front. They are not loaded yet — loading calls
		//init(), and EditorExtension.init() talks to the view, which does not
		//exist at this point.
		const pending = [];
		if (this._config.selection) {
			pending.push({ ext: new SelectionExtension(), name: 'DEFAULT_EXT_SELECTION' });
		}
		if (this._config.editing) {
			pending.push({ ext: new EditorExtension(), name: 'DEFAULT_EXT_EDITOR' });
		}
		if (this._config.copypaste) {
			pending.push({ ext: new CopyPasteExtension(), name: 'DEFAULT_EXT_COPYPASTE' });
		}
		if (this._config.autoUpdate) {
			pending.push({ ext: new ViewUpdaterExtension(), name: 'DEFAULT_EXT_VIEW_UPDATER' });
		}
		if (this._config.columnFormatter) {
			pending.push({ ext: new FormatterExtension(), name: 'DEFAULT_EXT_FORMATTER' });
		}
		if (this._config.columnResize) {
			pending.push({ ext: new ColumnResizeExtension(), name: 'DEFAULT_EXT_COLUMN_RESIZE' });
		}
		if (this._config.textOverflow) {
			pending.push({ ext: new TextOverflowExtension(), name: 'DEFAULT_EXT_TEXT_OVERFLOW' });
		}
		//Loaded last on purpose: hooks run in load order, and the space key must
		//reach EditorExtension (which backs off on canEdit === false) before
		//FoldableRowsExtension folds the row out from under it.
		if (this._config.foldableRows) {
			pending.push({ ext: new FoldableRowsExtension(), name: 'DEFAULT_EXT_FOLDABLE_ROWS' });
		}

		//Queue initial external extensions
		if (this._config.extensions && this._config.extensions.length > 0) {
			this._config.extensions.forEach((ext) => {
				pending.push({ ext });
			});
		}

		//Config pre-pass — the only hookpoint that runs before the Model reads
		//config.columns in its constructor.
		pending.forEach(({ ext }) => {
			if (ext.configure) {
				ext.configure(this._config);
			}
		});

		this._data = new DataTable(this._config.dataModel, this._extensions);
		this._model = new Model(this._config, this._data, this._extensions);
		this._view = new View(this._model, this._extensions);
		this._state = new State();

		//Load extensions (this is what calls init())
		pending.forEach(({ ext, name }) => {
			this._extensions.loadExtension(ext, name);
		});
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
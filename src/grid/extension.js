export class Extension {

	constructor (grid, config) {
		this._grid = grid;
		this._config = config;
		this._extensionTable = {};

		this._extensions = {
			cellRender: [],
			cellAfterRender: [],
			cellUpdate: [],
			cellAfterUpdate: [],
			cellEditableCheck: [],
			cellAfterRecycled: [],
			keyDown: [],
			gridAfterRender: [],
			dataBeforeRender: [],
			dataBeforeUpdate: [],
			dataAfterUpdate: [],
			dataFinishUpdate: []
		}
	}

	loadExtension (ext, name) {
		if (ext['init']) {
			ext['init'](this._grid, this._config);
		}
		for (let extPoint in this._extensions) {
			if (ext[extPoint]) {
				this._extensions[extPoint].push(ext);
			}
		}
		if (name) {
			if (!this._extensionTable[name]) {
				this._extensionTable[name] = ext;
			} else {
				throw new Error('Extension name \'' + name + '\' has already been loaded');
			}
		}
	}

	hasExtension (extPoint) {
		return (this._extensions[extPoint] && this._extensions[extPoint].length > 0)
	}

	getExtension (name) {
		return this._extensionTable[name];
	}

	queryExtension (extPoint) {
		if (this._extensions[extPoint]) {
			return this._extensions[extPoint];
		} else {
			return [];
		}
	}

	executeExtension (extPoint) {
		this.queryExtension(extPoint).forEach((ext) => {
			ext[extPoint].apply(ext, Array.prototype.slice.call(arguments, 1));
		});
	}

}
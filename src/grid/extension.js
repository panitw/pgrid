export class Extension {

	constructor (grid, config) {
		this._grid = grid;
		this._config = config;

		this._extensions = {
			cellRender: [],
			cellAfterRender: [],
			cellUpdate: [],
			cellAfterUpdate: [],
			keyDown: [],
			gridAfterRender: [],
			dataBeforeRender: [],
			dataBeforeUpdate: [],
			dataAfterUpdate: [],
			dataFinishUpdate: []
		}
	}

	loadExtension (ext) {
		if (ext['init']) {
			ext['init'](this._grid, this._config);
		}
		for (let extPoint in this._extensions) {
			if (ext[extPoint]) {
				this._extensions[extPoint].push(ext);
			}
		}
	}

	hasExtension (extPoint) {
		return (this._extensions[extPoint] && this._extensions[extPoint].length > 0)
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
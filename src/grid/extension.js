class Extension {

	constructor (grid) {
		this._grid = grid;

		this._extensions = {
			cellAfterRender: []
		}
	}

	loadExtension (ext) {
		if (ext['init']) {
			ext['init'](this._grid);
		}
		for (let extPoint in this._extensions) {
			if (ext[extPoint]) {
				this._extensions[extPoint].push(ext);
			}
		}
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

module.exports = Extension;
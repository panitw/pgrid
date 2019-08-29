export class FormatterExtension {

    init (grid, config) {
		this._grid = grid;
		this._config = config;
    }

    render (e, model, formatter) {
        if (formatter.render) {
            let newEvent = Object.assign({}, e);
            newEvent.colModel = model;
            newEvent.grid = this._grid;
            formatter.render(newEvent);
            e.handled = true;
        }
    }

    update (e, model, formatter) {
        let newEvent = Object.assign({}, e);
        newEvent.colModel = model;
        newEvent.grid = this._grid;
        if (formatter.update) {
            formatter.update(newEvent);
            e.handled = true;
        } else
        if (formatter.render) {
            formatter.render(newEvent);
            e.handled = true;
        }
    }

    cellRender (e) {
        const model = this._grid.model.getColumnModel(e.colIndex);
        if (model && model.formatter) {
            if (Array.isArray(model.formatter)) {
                for (let i=0; i<model.formatter.length; i++) {
                    this.render(e, model, model.formatter[i]);
                }
            } else {
                this.render(e, model, model.formatter);
            }
        }
    }

    cellUpdate (e) {
        const model = this._grid.model.getColumnModel(e.colIndex);
        if (model && model.formatter) {
            if (Array.isArray(model.formatter)) {
                for (let i=0; i<model.formatter.length; i++) {
                    this.update(e, model, model.formatter[i]);
                }
            } else {
                this.update(e, model, model.formatter);
            }
        }
    }

}
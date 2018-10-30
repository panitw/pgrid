export class FormatterExtension {

    init (grid, config) {
		this._grid = grid;
		this._config = config;
    }
    
    cellRender (e) {
        const model = this._grid.model.getColumnModel(e.colIndex);
        if (model && model.formatter && model.formatter.render) {
            let newEvent = Object.assign({}, e);
            newEvent.colModel = model;
            newEvent.grid = this._grid;
            model.formatter.render(newEvent);
            e.handled = true;
        }
    }

    cellUpdate (e) {
        const model = this._grid.model.getColumnModel(e.colIndex);
        if (model && model.formatter && model.formatter.update) {
            let newEvent = Object.assign({}, e);
            newEvent.colModel = model;
            newEvent.grid = this._grid;
            model.formatter.update(newEvent);
            e.handled = true;
        }
    }

}
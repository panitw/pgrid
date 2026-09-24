import { equal, notEqual, deepEqual } from 'assert';
import sinon from 'sinon';
import { PGrid } from '../../src/grid/grid';

const baseConfig = (over = {}) => Object.assign({
    rowHeight: 32,
    columnWidth: 100,
    headerRowCount: 1,
    columns: [{ field: 'a' }, { field: 'b' }],
    dataModel: { fields: ['a', 'b'], data: [{ a: 1, b: 2 }] }
}, over);

describe('PGrid (composition)', () => {

    describe('component wiring', () => {

        it('should expose model, view, data, extension and state on the instance', () => {
            const grid = new PGrid(baseConfig());
            notEqual(grid.model, undefined);
            notEqual(grid.view, undefined);
            notEqual(grid.data, undefined);
            notEqual(grid.extension, undefined);
            notEqual(grid.state, undefined);
        });

        it('should populate the data table from dataModel.data', () => {
            const grid = new PGrid(baseConfig());
            equal(grid.data.getRowCount(), 1);
        });

        it('should reflect data rows in the model row count (header + data)', () => {
            const grid = new PGrid(baseConfig({
                dataModel: { fields: ['a', 'b'], data: [{ a: 1, b: 2 }, { a: 3, b: 4 }] }
            }));
            equal(grid.model.getRowCount(), 1 /* header */ + 2);
        });
    });

    describe('default extension loading', () => {

        it('should not load any default extension when none of the flags are set', () => {
            const grid = new PGrid(baseConfig());
            equal(grid.extension.getExtension('DEFAULT_EXT_SELECTION'), undefined);
            equal(grid.extension.getExtension('DEFAULT_EXT_EDITOR'), undefined);
            equal(grid.extension.getExtension('DEFAULT_EXT_COPYPASTE'), undefined);
            equal(grid.extension.getExtension('DEFAULT_EXT_VIEW_UPDATER'), undefined);
            equal(grid.extension.getExtension('DEFAULT_EXT_FORMATTER'), undefined);
        });

        it('should load the selection extension when config.selection is set', () => {
            const grid = new PGrid(baseConfig({ selection: {} }));
            notEqual(grid.extension.getExtension('DEFAULT_EXT_SELECTION'), undefined);
        });

        it('should load the editor extension when config.editing is true', () => {
            const grid = new PGrid(baseConfig({ editing: true }));
            notEqual(grid.extension.getExtension('DEFAULT_EXT_EDITOR'), undefined);
        });

        it('should load the copy/paste extension when config.copypaste is true', () => {
            const grid = new PGrid(baseConfig({ copypaste: true }));
            notEqual(grid.extension.getExtension('DEFAULT_EXT_COPYPASTE'), undefined);
        });

        it('should load the view-updater extension when config.autoUpdate is true', () => {
            const grid = new PGrid(baseConfig({ autoUpdate: true }));
            notEqual(grid.extension.getExtension('DEFAULT_EXT_VIEW_UPDATER'), undefined);
        });

        it('should load the formatter extension when config.columnFormatter is true', () => {
            const grid = new PGrid(baseConfig({ columnFormatter: true }));
            notEqual(grid.extension.getExtension('DEFAULT_EXT_FORMATTER'), undefined);
        });

        it('should load the column-resize extension when config.columnResize is set', () => {
            const grid = new PGrid(baseConfig({ columnResize: {} }));
            notEqual(grid.extension.getExtension('DEFAULT_EXT_COLUMN_RESIZE'), undefined);
        });

        it('should load the text-overflow extension when config.textOverflow is set', () => {
            const grid = new PGrid(baseConfig({ textOverflow: 'ellipsis' }));
            notEqual(grid.extension.getExtension('DEFAULT_EXT_TEXT_OVERFLOW'), undefined);
        });

        it('should load the foldable-rows extension when config.foldableRows is set', () => {
            const grid = new PGrid(baseConfig({ foldableRows: { groupBy: 'a' } }));
            notEqual(grid.extension.getExtension('DEFAULT_EXT_FOLDABLE_ROWS'), undefined);
        });

        it('should not load the foldable-rows extension by default', () => {
            const grid = new PGrid(baseConfig());
            equal(grid.extension.getExtension('DEFAULT_EXT_FOLDABLE_ROWS'), undefined);
            equal(grid.extension.getExtension('DEFAULT_EXT_COLUMN_RESIZE'), undefined);
            equal(grid.extension.getExtension('DEFAULT_EXT_TEXT_OVERFLOW'), undefined);
        });

        it('should still init every built-in when all seven toggles are on together', () => {
            const grid = new PGrid(baseConfig({
                selection: {},
                editing: true,
                copypaste: true,
                autoUpdate: true,
                columnFormatter: true,
                columnResize: {},
                textOverflow: 'ellipsis'
            }));
            const host = document.createElement('div');
            document.body.appendChild(host);
            grid.render(host);
            const names = [
                'DEFAULT_EXT_SELECTION', 'DEFAULT_EXT_EDITOR', 'DEFAULT_EXT_COPYPASTE',
                'DEFAULT_EXT_VIEW_UPDATER', 'DEFAULT_EXT_FORMATTER',
                'DEFAULT_EXT_COLUMN_RESIZE', 'DEFAULT_EXT_TEXT_OVERFLOW'
            ];
            for (const name of names) {
                notEqual(grid.extension.getExtension(name), undefined, `missing ${name}`);
            }
            // The row set is untouched: no projection is installed by any built-in.
            equal(grid.model.getRowProjection(), null);
            equal(grid.model.getRowCount(), 1 + 1);
            document.body.removeChild(host);
        });
    });

    describe('configure pre-pass', () => {

        it('should call configure before the Model is constructed', () => {
            let modelExisted = null;
            const grid = new PGrid(baseConfig({
                extensions: [{
                    configure() { modelExisted = false; },
                    init(g) { modelExisted = (modelExisted === false) && !!g.model; }
                }]
            }));
            equal(modelExisted, true);
            notEqual(grid.model, undefined);
        });

        it('should let configure mutate the config the Model then reads', () => {
            const grid = new PGrid(baseConfig({
                extensions: [{
                    configure(config) {
                        config.columns = [{ field: 'z', title: 'Z', width: 42 }].concat(config.columns);
                    }
                }]
            }));
            equal(grid.model.getColumnCount(), 3);
            equal(grid.model.getColumnField(0), 'z');
            equal(grid.model.getColumnWidth(0), 42);
            equal(grid.model.getColumnIndex('a'), 1);
        });

        it('should receive the merged config (defaults applied) in configure', () => {
            let received;
            new PGrid(baseConfig({
                extensions: [{ configure(config) { received = config; } }]
            }));
            equal(received.headerRowCount, 1);
            equal(received.rowHeight, 32);
        });

        it('should run built-in configure hooks before user extension ones', () => {
            // The gutter injection depends on this order: a user extension that
            // renumbers columns must see the layout the built-ins produced.
            let columnsSeen = null;
            new PGrid(baseConfig({
                foldableRows: { groupBy: 'a' },
                extensions: [{
                    configure(config) { columnsSeen = config.columns.slice(); }
                }]
            }));
            notEqual(columnsSeen, null);
            equal(columnsSeen.length, 3);
            equal(columnsSeen[0].cssClass, 'pgrid-group-gutter');
            equal(columnsSeen[1].field, 'a');
            equal(columnsSeen[2].field, 'b');
        });

        it('should not require configure — extensions without it still load', () => {
            const grid = new PGrid(baseConfig({
                extensions: [{ cellRender() {} }]
            }));
            equal(grid.extension.hasExtension('cellRender'), true);
            equal(grid.extension.hasExtension('configure'), false);
        });

        it('should keep configure construction-only, not a registry hookpoint', () => {
            // PGrid calls configure directly during construction. Registering it
            // would silently record it for extensions loaded later at runtime
            // via loadExtension, where it could never be run.
            const grid = new PGrid(baseConfig({
                extensions: [{ configure() {} }]
            }));
            equal(grid.extension.hasExtension('configure'), false);
            deepEqual(grid.extension.queryExtension('configure'), []);
        });

        it('should not run configure for an extension loaded after construction', () => {
            const grid = new PGrid(baseConfig());
            let ran = false;
            grid.extension.loadExtension({ configure() { ran = true; } });
            equal(ran, false);
            equal(grid.model.getColumnCount(), 2);
        });
    });

    describe('user-provided extensions', () => {

        it('should call init on each extension provided in config.extensions', () => {
            const init1 = sinon.spy();
            const init2 = sinon.spy();
            new PGrid(baseConfig({
                extensions: [{ init: init1 }, { init: init2 }]
            }));
            equal(init1.calledOnce, true);
            equal(init2.calledOnce, true);
        });

        it('should pass the grid and config to each extension init', () => {
            let receivedGrid;
            let receivedConfig;
            const grid = new PGrid(baseConfig({
                extensions: [{
                    init(g, cfg) { receivedGrid = g; receivedConfig = cfg; }
                }]
            }));
            equal(receivedGrid, grid);
            // The config the extension receives is the merged config object.
            equal(receivedConfig.rowHeight, 32);
            equal(receivedConfig.columnWidth, 100);
        });

        it('should register hooks declared by user extensions in the registry', () => {
            const grid = new PGrid(baseConfig({
                extensions: [{ cellRender: () => {} }]
            }));
            equal(grid.extension.hasExtension('cellRender'), true);
        });
    });

    describe('config defaults', () => {

        it('should not override user-provided values with the defaults', () => {
            const grid = new PGrid(baseConfig({ rowHeight: 50, columnWidth: 200 }));
            equal(grid.model.getRowHeight(0), 50);
            equal(grid.model.getColumnWidth(0), 200);
        });
    });
});

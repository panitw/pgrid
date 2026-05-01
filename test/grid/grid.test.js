import { equal, notEqual } from 'assert';
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

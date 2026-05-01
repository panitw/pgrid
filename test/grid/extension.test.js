import { equal, deepEqual, throws } from 'assert';
import sinon from 'sinon';
import { Extension } from '../../src/grid/extension';

describe('Extension', () => {

    let registry;
    let fakeGrid;
    let fakeConfig;

    beforeEach(() => {
        fakeGrid = { id: 'grid' };
        fakeConfig = { id: 'config' };
        registry = new Extension(fakeGrid, fakeConfig);
    });

    describe('loadExtension', () => {

        it('should call init on the extension with the grid and config', () => {
            const init = sinon.spy();
            registry.loadExtension({ init });
            equal(init.calledOnce, true);
            equal(init.firstCall.args[0], fakeGrid);
            equal(init.firstCall.args[1], fakeConfig);
        });

        it('should not throw when the extension has no init method', () => {
            registry.loadExtension({ cellRender: () => {} });
        });

        it('should register the extension under each known hookpoint it implements', () => {
            const ext = {
                cellRender: () => {},
                keyDown: () => {}
            };
            registry.loadExtension(ext);
            deepEqual(registry.queryExtension('cellRender'), [ext]);
            deepEqual(registry.queryExtension('keyDown'), [ext]);
            deepEqual(registry.queryExtension('cellAfterRender'), []);
        });

        it('should ignore methods on the extension that are not known hookpoints', () => {
            const ext = { somethingMadeUp: () => {} };
            registry.loadExtension(ext);
            deepEqual(registry.queryExtension('somethingMadeUp'), []);
        });

        it('should make a named extension retrievable by name', () => {
            const ext = { id: 'a' };
            registry.loadExtension(ext, 'NAMED');
            equal(registry.getExtension('NAMED'), ext);
        });

        it('should throw when registering two extensions under the same name', () => {
            registry.loadExtension({}, 'DUP');
            throws(() => registry.loadExtension({}, 'DUP'), /already been loaded/);
        });

        it('should not require a name and not register one for unnamed extensions', () => {
            registry.loadExtension({ cellRender: () => {} });
            equal(registry.getExtension('anything'), undefined);
        });
    });

    describe('hasExtension', () => {

        it('should return false for a hookpoint with no registered extensions', () => {
            equal(!!registry.hasExtension('cellRender'), false);
        });

        it('should return true once at least one extension implements the hook', () => {
            registry.loadExtension({ cellRender: () => {} });
            equal(registry.hasExtension('cellRender'), true);
        });

        it('should return false for an unknown hookpoint name', () => {
            equal(!!registry.hasExtension('notARealHook'), false);
        });
    });

    describe('queryExtension', () => {

        it('should return an empty array for an unknown hookpoint', () => {
            deepEqual(registry.queryExtension('notARealHook'), []);
        });

        it('should return all extensions registered for a hook in load order', () => {
            const a = { cellRender: () => {} };
            const b = { cellRender: () => {} };
            registry.loadExtension(a);
            registry.loadExtension(b);
            deepEqual(registry.queryExtension('cellRender'), [a, b]);
        });
    });

    describe('executeExtension', () => {

        it('should invoke the named hook on every registered extension', () => {
            const a = { cellRender: sinon.spy() };
            const b = { cellRender: sinon.spy() };
            registry.loadExtension(a);
            registry.loadExtension(b);
            registry.executeExtension('cellRender');
            equal(a.cellRender.calledOnce, true);
            equal(b.cellRender.calledOnce, true);
        });

        it('should pass through additional arguments to each extension', () => {
            const ext = { cellRender: sinon.spy() };
            registry.loadExtension(ext);
            registry.executeExtension('cellRender', { rowIndex: 2 }, 'extra');
            deepEqual(ext.cellRender.firstCall.args, [{ rowIndex: 2 }, 'extra']);
        });

        it('should be a no-op when no extension is registered for the hook', () => {
            registry.executeExtension('cellRender', { foo: 1 });
        });

        it('should invoke the hook with the extension as the receiver (this)', () => {
            const ext = {
                state: 'self',
                cellRender(arg) {
                    arg.captured = this.state;
                }
            };
            registry.loadExtension(ext);
            const e = {};
            registry.executeExtension('cellRender', e);
            equal(e.captured, 'self');
        });
    });
});

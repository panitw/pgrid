import { equal, deepEqual } from 'assert';
import { Utils } from '../../src/grid/utils';

describe('Utils', () => {

    describe('mixin', () => {

        it('should copy own enumerable properties from source to target', () => {
            const target = { a: 1, b: 2 };
            const source = { c: 3, d: 4 };
            const result = Utils.mixin(source, target);
            deepEqual(result, { a: 1, b: 2, c: 3, d: 4 });
        });

        it('should overwrite target properties when source has the same key', () => {
            const target = { a: 1, b: 2 };
            const source = { b: 99 };
            Utils.mixin(source, target);
            equal(target.b, 99);
        });

        it('should return the (mutated) target reference', () => {
            const target = {};
            const result = Utils.mixin({ x: 1 }, target);
            equal(result, target);
        });

        it('should not copy inherited properties', () => {
            class Parent { }
            Parent.prototype.inherited = 'no';
            const source = new Parent();
            source.own = 'yes';
            const target = {};
            Utils.mixin(source, target);
            equal(target.own, 'yes');
            equal(target.inherited, undefined);
        });
    });
});

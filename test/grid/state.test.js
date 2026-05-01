import { equal } from 'assert';
import { State } from '../../src/grid/state';

describe('State', () => {

    let state;

    beforeEach(() => {
        state = new State();
    });

    it('should report a missing key as not existing', () => {
        equal(state.exists('missing'), false);
    });

    it('should return undefined for an unset key', () => {
        equal(state.get('missing'), undefined);
    });

    it('should store and retrieve a value', () => {
        state.set('foo', 42);
        equal(state.get('foo'), 42);
        equal(state.exists('foo'), true);
    });

    it('should overwrite an existing value', () => {
        state.set('foo', 1);
        state.set('foo', 2);
        equal(state.get('foo'), 2);
    });

    it('should treat a falsy-but-defined value as existing', () => {
        state.set('zero', 0);
        state.set('empty', '');
        state.set('falseVal', false);
        equal(state.exists('zero'), true);
        equal(state.exists('empty'), true);
        equal(state.exists('falseVal'), true);
    });

    it('should treat a value explicitly set to undefined as not existing', () => {
        state.set('u', undefined);
        equal(state.exists('u'), false);
    });
});

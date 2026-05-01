import { equal, deepEqual } from 'assert';
import sinon from 'sinon';
import { EventDispatcher } from '../../src/grid/event';

describe('EventDispatcher', () => {

    let dispatcher;

    beforeEach(() => {
        dispatcher = new EventDispatcher();
    });

    describe('hasListener', () => {

        it('should report false for an event with no listeners', () => {
            equal(dispatcher.hasListener('foo'), false);
        });

        it('should report true once a listener is registered', () => {
            dispatcher.listen('foo', () => {});
            equal(dispatcher.hasListener('foo'), true);
        });

        it('should return a strict boolean false for an unknown event (not undefined)', () => {
            // Regression: a `&&` short-circuit used to leak `undefined` here,
            // forcing callers to coerce. The contract is a boolean.
            equal(dispatcher.hasListener('never-touched'), false);
        });

        it('should report false after the last listener is removed', () => {
            const handler = () => {};
            dispatcher.listen('foo', handler);
            dispatcher.unlisten('foo', handler);
            equal(dispatcher.hasListener('foo'), false);
        });
    });

    describe('dispatch', () => {

        it('should not throw when dispatching an event with no listeners', () => {
            dispatcher.dispatch('foo', { x: 1 });
        });

        it('should call a registered handler with the event argument', () => {
            const spy = sinon.spy();
            dispatcher.listen('foo', spy);
            dispatcher.dispatch('foo', { x: 1 });
            equal(spy.calledOnce, true);
            deepEqual(spy.firstCall.args[0], { x: 1 });
        });

        it('should call all listeners for an event in registration order', () => {
            const calls = [];
            dispatcher.listen('foo', () => calls.push('a'));
            dispatcher.listen('foo', () => calls.push('b'));
            dispatcher.listen('foo', () => calls.push('c'));
            dispatcher.dispatch('foo');
            deepEqual(calls, ['a', 'b', 'c']);
        });

        it('should not call listeners registered for a different event', () => {
            const spy = sinon.spy();
            dispatcher.listen('other', spy);
            dispatcher.dispatch('foo');
            equal(spy.called, false);
        });
    });

    describe('unlisten', () => {

        it('should remove only the specified handler', () => {
            const spyA = sinon.spy();
            const spyB = sinon.spy();
            dispatcher.listen('foo', spyA);
            dispatcher.listen('foo', spyB);
            dispatcher.unlisten('foo', spyA);
            dispatcher.dispatch('foo');
            equal(spyA.called, false);
            equal(spyB.calledOnce, true);
        });

        it('should be a no-op when removing an unregistered handler', () => {
            dispatcher.unlisten('foo', () => {});
            equal(dispatcher.hasListener('foo'), false);
        });

        it('should be a no-op when removing from an unknown event', () => {
            dispatcher.unlisten('never-registered', () => {});
            equal(dispatcher.hasListener('never-registered'), false);
        });
    });
});

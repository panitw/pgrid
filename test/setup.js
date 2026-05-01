import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    pretendToBeVisual: true,
    url: 'http://localhost/'
});

const { window } = dom;

global.window = window;
global.document = window.document;
// Node 24 exposes its own read-only `navigator`; skip rather than reassign.
global.HTMLElement = window.HTMLElement;
global.HTMLInputElement = window.HTMLInputElement;
global.Element = window.Element;
global.Node = window.Node;
global.Event = window.Event;
global.MouseEvent = window.MouseEvent;
global.KeyboardEvent = window.KeyboardEvent;
global.getComputedStyle = window.getComputedStyle;

// resize-observer-polyfill probes for `window.ResizeObserver`; provide a no-op
// stub so it doesn't try to attach DOM mutation observers we don't need.
class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}
window.ResizeObserver = ResizeObserverStub;
global.ResizeObserver = ResizeObserverStub;

// jsdom doesn't implement scrollIntoViewIfNeeded. view.js calls it via
// scrollToCell; install a no-op (we don't test scroll positioning under jsdom).
if (!window.Element.prototype.scrollIntoViewIfNeeded) {
    window.Element.prototype.scrollIntoViewIfNeeded = function () {};
}

// jsdom doesn't run layout, so offsetWidth/offsetHeight default to 0 — which
// makes view.js skip every cell as "out of viewport". Patch the prototype with
// a generous fake size so render tests can actually inspect the produced DOM.
// Tests should NOT rely on these numbers being meaningful — only on the fact
// that cells are deemed visible.
Object.defineProperty(window.HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get() { return this._mockOffsetWidth ?? 2000; }
});
Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get() { return this._mockOffsetHeight ?? 2000; }
});

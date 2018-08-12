(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.ResizeObserver = factory());
}(this, (function () { 'use strict';

/**
 * A collection of shims that provide minimal functionality of the ES6 collections.
 *
 * These implementations are not meant to be used outside of the ResizeObserver
 * modules as they cover only a limited range of use cases.
 */
/* eslint-disable require-jsdoc, valid-jsdoc */
var MapShim = (function () {
    if (typeof Map !== 'undefined') {
        return Map;
    }

    /**
     * Returns index in provided array that matches the specified key.
     *
     * @param {Array<Array>} arr
     * @param {*} key
     * @returns {number}
     */
    function getIndex(arr, key) {
        var result = -1;

        arr.some(function (entry, index) {
            if (entry[0] === key) {
                result = index;

                return true;
            }

            return false;
        });

        return result;
    }

    return (function () {
        function anonymous() {
            this.__entries__ = [];
        }

        var prototypeAccessors = { size: { configurable: true } };

        /**
         * @returns {boolean}
         */
        prototypeAccessors.size.get = function () {
            return this.__entries__.length;
        };

        /**
         * @param {*} key
         * @returns {*}
         */
        anonymous.prototype.get = function (key) {
            var index = getIndex(this.__entries__, key);
            var entry = this.__entries__[index];

            return entry && entry[1];
        };

        /**
         * @param {*} key
         * @param {*} value
         * @returns {void}
         */
        anonymous.prototype.set = function (key, value) {
            var index = getIndex(this.__entries__, key);

            if (~index) {
                this.__entries__[index][1] = value;
            } else {
                this.__entries__.push([key, value]);
            }
        };

        /**
         * @param {*} key
         * @returns {void}
         */
        anonymous.prototype.delete = function (key) {
            var entries = this.__entries__;
            var index = getIndex(entries, key);

            if (~index) {
                entries.splice(index, 1);
            }
        };

        /**
         * @param {*} key
         * @returns {void}
         */
        anonymous.prototype.has = function (key) {
            return !!~getIndex(this.__entries__, key);
        };

        /**
         * @returns {void}
         */
        anonymous.prototype.clear = function () {
            this.__entries__.splice(0);
        };

        /**
         * @param {Function} callback
         * @param {*} [ctx=null]
         * @returns {void}
         */
        anonymous.prototype.forEach = function (callback, ctx) {
            var this$1 = this;
            if ( ctx === void 0 ) ctx = null;

            for (var i = 0, list = this$1.__entries__; i < list.length; i += 1) {
                var entry = list[i];

                callback.call(ctx, entry[1], entry[0]);
            }
        };

        Object.defineProperties( anonymous.prototype, prototypeAccessors );

        return anonymous;
    }());
})();

/**
 * Detects whether window and document objects are available in current environment.
 */
var isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined' && window.document === document;

// Returns global object of a current environment.
var global$1 = (function () {
    if (typeof global !== 'undefined' && global.Math === Math) {
        return global;
    }

    if (typeof self !== 'undefined' && self.Math === Math) {
        return self;
    }

    if (typeof window !== 'undefined' && window.Math === Math) {
        return window;
    }

    // eslint-disable-next-line no-new-func
    return Function('return this')();
})();

/**
 * A shim for the requestAnimationFrame which falls back to the setTimeout if
 * first one is not supported.
 *
 * @returns {number} Requests' identifier.
 */
var requestAnimationFrame$1 = (function () {
    if (typeof requestAnimationFrame === 'function') {
        // It's required to use a bounded function because IE sometimes throws
        // an "Invalid calling object" error if rAF is invoked without the global
        // object on the left hand side.
        return requestAnimationFrame.bind(global$1);
    }

    return function (callback) { return setTimeout(function () { return callback(Date.now()); }, 1000 / 60); };
})();

// Defines minimum timeout before adding a trailing call.
var trailingTimeout = 2;

/**
 * Creates a wrapper function which ensures that provided callback will be
 * invoked only once during the specified delay period.
 *
 * @param {Function} callback - Function to be invoked after the delay period.
 * @param {number} delay - Delay after which to invoke callback.
 * @returns {Function}
 */
var throttle = function (callback, delay) {
    var leadingCall = false,
        trailingCall = false,
        lastCallTime = 0;

    /**
     * Invokes the original callback function and schedules new invocation if
     * the "proxy" was called during current request.
     *
     * @returns {void}
     */
    function resolvePending() {
        if (leadingCall) {
            leadingCall = false;

            callback();
        }

        if (trailingCall) {
            proxy();
        }
    }

    /**
     * Callback invoked after the specified delay. It will further postpone
     * invocation of the original function delegating it to the
     * requestAnimationFrame.
     *
     * @returns {void}
     */
    function timeoutCallback() {
        requestAnimationFrame$1(resolvePending);
    }

    /**
     * Schedules invocation of the original function.
     *
     * @returns {void}
     */
    function proxy() {
        var timeStamp = Date.now();

        if (leadingCall) {
            // Reject immediately following calls.
            if (timeStamp - lastCallTime < trailingTimeout) {
                return;
            }

            // Schedule new call to be in invoked when the pending one is resolved.
            // This is important for "transitions" which never actually start
            // immediately so there is a chance that we might miss one if change
            // happens amids the pending invocation.
            trailingCall = true;
        } else {
            leadingCall = true;
            trailingCall = false;

            setTimeout(timeoutCallback, delay);
        }

        lastCallTime = timeStamp;
    }

    return proxy;
};

// Minimum delay before invoking the update of observers.
var REFRESH_DELAY = 20;

// A list of substrings of CSS properties used to find transition events that
// might affect dimensions of observed elements.
var transitionKeys = ['top', 'right', 'bottom', 'left', 'width', 'height', 'size', 'weight'];

// Check if MutationObserver is available.
var mutationObserverSupported = typeof MutationObserver !== 'undefined';

/**
 * Singleton controller class which handles updates of ResizeObserver instances.
 */
var ResizeObserverController = function() {
    this.connected_ = false;
    this.mutationEventsAdded_ = false;
    this.mutationsObserver_ = null;
    this.observers_ = [];

    this.onTransitionEnd_ = this.onTransitionEnd_.bind(this);
    this.refresh = throttle(this.refresh.bind(this), REFRESH_DELAY);
};

/**
 * Adds observer to observers list.
 *
 * @param {ResizeObserverSPI} observer - Observer to be added.
 * @returns {void}
 */


/**
 * Holds reference to the controller's instance.
 *
 * @private {ResizeObserverController}
 */


/**
 * Keeps reference to the instance of MutationObserver.
 *
 * @private {MutationObserver}
 */

/**
 * Indicates whether DOM listeners have been added.
 *
 * @private {boolean}
 */
ResizeObserverController.prototype.addObserver = function (observer) {
    if (!~this.observers_.indexOf(observer)) {
        this.observers_.push(observer);
    }

    // Add listeners if they haven't been added yet.
    if (!this.connected_) {
        this.connect_();
    }
};

/**
 * Removes observer from observers list.
 *
 * @param {ResizeObserverSPI} observer - Observer to be removed.
 * @returns {void}
 */
ResizeObserverController.prototype.removeObserver = function (observer) {
    var observers = this.observers_;
    var index = observers.indexOf(observer);

    // Remove observer if it's present in registry.
    if (~index) {
        observers.splice(index, 1);
    }

    // Remove listeners if controller has no connected observers.
    if (!observers.length && this.connected_) {
        this.disconnect_();
    }
};

/**
 * Invokes the update of observers. It will continue running updates insofar
 * it detects changes.
 *
 * @returns {void}
 */
ResizeObserverController.prototype.refresh = function () {
    var changesDetected = this.updateObservers_();

    // Continue running updates if changes have been detected as there might
    // be future ones caused by CSS transitions.
    if (changesDetected) {
        this.refresh();
    }
};

/**
 * Updates every observer from observers list and notifies them of queued
 * entries.
 *
 * @private
 * @returns {boolean} Returns "true" if any observer has detected changes in
 *  dimensions of it's elements.
 */
ResizeObserverController.prototype.updateObservers_ = function () {
    // Collect observers that have active observations.
    var activeObservers = this.observers_.filter(function (observer) {
        return observer.gatherActive(), observer.hasActive();
    });

    // Deliver notifications in a separate cycle in order to avoid any
    // collisions between observers, e.g. when multiple instances of
    // ResizeObserver are tracking the same element and the callback of one
    // of them changes content dimensions of the observed target. Sometimes
    // this may result in notifications being blocked for the rest of observers.
    activeObservers.forEach(function (observer) { return observer.broadcastActive(); });

    return activeObservers.length > 0;
};

/**
 * Initializes DOM listeners.
 *
 * @private
 * @returns {void}
 */
ResizeObserverController.prototype.connect_ = function () {
    // Do nothing if running in a non-browser environment or if listeners
    // have been already added.
    if (!isBrowser || this.connected_) {
        return;
    }

    // Subscription to the "Transitionend" event is used as a workaround for
    // delayed transitions. This way it's possible to capture at least the
    // final state of an element.
    document.addEventListener('transitionend', this.onTransitionEnd_);

    window.addEventListener('resize', this.refresh);

    if (mutationObserverSupported) {
        this.mutationsObserver_ = new MutationObserver(this.refresh);

        this.mutationsObserver_.observe(document, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
        });
    } else {
        document.addEventListener('DOMSubtreeModified', this.refresh);

        this.mutationEventsAdded_ = true;
    }

    this.connected_ = true;
};

/**
 * Removes DOM listeners.
 *
 * @private
 * @returns {void}
 */
ResizeObserverController.prototype.disconnect_ = function () {
    // Do nothing if running in a non-browser environment or if listeners
    // have been already removed.
    if (!isBrowser || !this.connected_) {
        return;
    }

    document.removeEventListener('transitionend', this.onTransitionEnd_);
    window.removeEventListener('resize', this.refresh);

    if (this.mutationsObserver_) {
        this.mutationsObserver_.disconnect();
    }

    if (this.mutationEventsAdded_) {
        document.removeEventListener('DOMSubtreeModified', this.refresh);
    }

    this.mutationsObserver_ = null;
    this.mutationEventsAdded_ = false;
    this.connected_ = false;
};

/**
 * "Transitionend" event handler.
 *
 * @private
 * @param {TransitionEvent} event
 * @returns {void}
 */
ResizeObserverController.prototype.onTransitionEnd_ = function (ref) {
        var propertyName = ref.propertyName; if ( propertyName === void 0 ) propertyName = '';

    // Detect whether transition may affect dimensions of an element.
    var isReflowProperty = transitionKeys.some(function (key) {
        return !!~propertyName.indexOf(key);
    });

    if (isReflowProperty) {
        this.refresh();
    }
};

/**
 * Returns instance of the ResizeObserverController.
 *
 * @returns {ResizeObserverController}
 */
ResizeObserverController.getInstance = function () {
    if (!this.instance_) {
        this.instance_ = new ResizeObserverController();
    }

    return this.instance_;
};

ResizeObserverController.instance_ = null;

/**
 * Defines non-writable/enumerable properties of the provided target object.
 *
 * @param {Object} target - Object for which to define properties.
 * @param {Object} props - Properties to be defined.
 * @returns {Object} Target object.
 */
var defineConfigurable = (function (target, props) {
    for (var i = 0, list = Object.keys(props); i < list.length; i += 1) {
        var key = list[i];

        Object.defineProperty(target, key, {
            value: props[key],
            enumerable: false,
            writable: false,
            configurable: true
        });
    }

    return target;
});

/**
 * Returns the global object associated with provided element.
 *
 * @param {Object} target
 * @returns {Object}
 */
var getWindowOf = (function (target) {
    // Assume that the element is an instance of Node, which means that it
    // has the "ownerDocument" property from which we can retrieve a
    // corresponding global object.
    var ownerGlobal = target && target.ownerDocument && target.ownerDocument.defaultView;

    // Return the local global object if it's not possible extract one from
    // provided element.
    return ownerGlobal || global$1;
});

// Placeholder of an empty content rectangle.
var emptyRect = createRectInit(0, 0, 0, 0);

/**
 * Converts provided string to a number.
 *
 * @param {number|string} value
 * @returns {number}
 */
function toFloat(value) {
    return parseFloat(value) || 0;
}

/**
 * Extracts borders size from provided styles.
 *
 * @param {CSSStyleDeclaration} styles
 * @param {...string} positions - Borders positions (top, right, ...)
 * @returns {number}
 */
function getBordersSize(styles) {
    var positions = [], len = arguments.length - 1;
    while ( len-- > 0 ) positions[ len ] = arguments[ len + 1 ];

    return positions.reduce(function (size, position) {
        var value = styles['border-' + position + '-width'];

        return size + toFloat(value);
    }, 0);
}

/**
 * Extracts paddings sizes from provided styles.
 *
 * @param {CSSStyleDeclaration} styles
 * @returns {Object} Paddings box.
 */
function getPaddings(styles) {
    var positions = ['top', 'right', 'bottom', 'left'];
    var paddings = {};

    for (var i = 0, list = positions; i < list.length; i += 1) {
        var position = list[i];

        var value = styles['padding-' + position];

        paddings[position] = toFloat(value);
    }

    return paddings;
}

/**
 * Calculates content rectangle of provided SVG element.
 *
 * @param {SVGGraphicsElement} target - Element content rectangle of which needs
 *      to be calculated.
 * @returns {DOMRectInit}
 */
function getSVGContentRect(target) {
    var bbox = target.getBBox();

    return createRectInit(0, 0, bbox.width, bbox.height);
}

/**
 * Calculates content rectangle of provided HTMLElement.
 *
 * @param {HTMLElement} target - Element for which to calculate the content rectangle.
 * @returns {DOMRectInit}
 */
function getHTMLElementContentRect(target) {
    // Client width & height properties can't be
    // used exclusively as they provide rounded values.
    var clientWidth = target.clientWidth;
    var clientHeight = target.clientHeight;

    // By this condition we can catch all non-replaced inline, hidden and
    // detached elements. Though elements with width & height properties less
    // than 0.5 will be discarded as well.
    //
    // Without it we would need to implement separate methods for each of
    // those cases and it's not possible to perform a precise and performance
    // effective test for hidden elements. E.g. even jQuery's ':visible' filter
    // gives wrong results for elements with width & height less than 0.5.
    if (!clientWidth && !clientHeight) {
        return emptyRect;
    }

    var styles = getWindowOf(target).getComputedStyle(target);
    var paddings = getPaddings(styles);
    var horizPad = paddings.left + paddings.right;
    var vertPad = paddings.top + paddings.bottom;

    // Computed styles of width & height are being used because they are the
    // only dimensions available to JS that contain non-rounded values. It could
    // be possible to utilize the getBoundingClientRect if only it's data wasn't
    // affected by CSS transformations let alone paddings, borders and scroll bars.
    var width = toFloat(styles.width),
        height = toFloat(styles.height);

    // Width & height include paddings and borders when the 'border-box' box
    // model is applied (except for IE).
    if (styles.boxSizing === 'border-box') {
        // Following conditions are required to handle Internet Explorer which
        // doesn't include paddings and borders to computed CSS dimensions.
        //
        // We can say that if CSS dimensions + paddings are equal to the "client"
        // properties then it's either IE, and thus we don't need to subtract
        // anything, or an element merely doesn't have paddings/borders styles.
        if (Math.round(width + horizPad) !== clientWidth) {
            width -= getBordersSize(styles, 'left', 'right') + horizPad;
        }

        if (Math.round(height + vertPad) !== clientHeight) {
            height -= getBordersSize(styles, 'top', 'bottom') + vertPad;
        }
    }

    // Following steps can't be applied to the document's root element as its
    // client[Width/Height] properties represent viewport area of the window.
    // Besides, it's as well not necessary as the <html> itself neither has
    // rendered scroll bars nor it can be clipped.
    if (!isDocumentElement(target)) {
        // In some browsers (only in Firefox, actually) CSS width & height
        // include scroll bars size which can be removed at this step as scroll
        // bars are the only difference between rounded dimensions + paddings
        // and "client" properties, though that is not always true in Chrome.
        var vertScrollbar = Math.round(width + horizPad) - clientWidth;
        var horizScrollbar = Math.round(height + vertPad) - clientHeight;

        // Chrome has a rather weird rounding of "client" properties.
        // E.g. for an element with content width of 314.2px it sometimes gives
        // the client width of 315px and for the width of 314.7px it may give
        // 314px. And it doesn't happen all the time. So just ignore this delta
        // as a non-relevant.
        if (Math.abs(vertScrollbar) !== 1) {
            width -= vertScrollbar;
        }

        if (Math.abs(horizScrollbar) !== 1) {
            height -= horizScrollbar;
        }
    }

    return createRectInit(paddings.left, paddings.top, width, height);
}

/**
 * Checks whether provided element is an instance of the SVGGraphicsElement.
 *
 * @param {Element} target - Element to be checked.
 * @returns {boolean}
 */
var isSVGGraphicsElement = (function () {
    // Some browsers, namely IE and Edge, don't have the SVGGraphicsElement
    // interface.
    if (typeof SVGGraphicsElement !== 'undefined') {
        return function (target) { return target instanceof getWindowOf(target).SVGGraphicsElement; };
    }

    // If it's so, then check that element is at least an instance of the
    // SVGElement and that it has the "getBBox" method.
    // eslint-disable-next-line no-extra-parens
    return function (target) { return target instanceof getWindowOf(target).SVGElement && typeof target.getBBox === 'function'; };
})();

/**
 * Checks whether provided element is a document element (<html>).
 *
 * @param {Element} target - Element to be checked.
 * @returns {boolean}
 */
function isDocumentElement(target) {
    return target === getWindowOf(target).document.documentElement;
}

/**
 * Calculates an appropriate content rectangle for provided html or svg element.
 *
 * @param {Element} target - Element content rectangle of which needs to be calculated.
 * @returns {DOMRectInit}
 */
function getContentRect(target) {
    if (!isBrowser) {
        return emptyRect;
    }

    if (isSVGGraphicsElement(target)) {
        return getSVGContentRect(target);
    }

    return getHTMLElementContentRect(target);
}

/**
 * Creates rectangle with an interface of the DOMRectReadOnly.
 * Spec: https://drafts.fxtf.org/geometry/#domrectreadonly
 *
 * @param {DOMRectInit} rectInit - Object with rectangle's x/y coordinates and dimensions.
 * @returns {DOMRectReadOnly}
 */
function createReadOnlyRect(ref) {
    var x = ref.x;
    var y = ref.y;
    var width = ref.width;
    var height = ref.height;

    // If DOMRectReadOnly is available use it as a prototype for the rectangle.
    var Constr = typeof DOMRectReadOnly !== 'undefined' ? DOMRectReadOnly : Object;
    var rect = Object.create(Constr.prototype);

    // Rectangle's properties are not writable and non-enumerable.
    defineConfigurable(rect, {
        x: x, y: y, width: width, height: height,
        top: y,
        right: x + width,
        bottom: height + y,
        left: x
    });

    return rect;
}

/**
 * Creates DOMRectInit object based on the provided dimensions and the x/y coordinates.
 * Spec: https://drafts.fxtf.org/geometry/#dictdef-domrectinit
 *
 * @param {number} x - X coordinate.
 * @param {number} y - Y coordinate.
 * @param {number} width - Rectangle's width.
 * @param {number} height - Rectangle's height.
 * @returns {DOMRectInit}
 */
function createRectInit(x, y, width, height) {
    return { x: x, y: y, width: width, height: height };
}

/**
 * Class that is responsible for computations of the content rectangle of
 * provided DOM element and for keeping track of it's changes.
 */
var ResizeObservation = function(target) {
    this.broadcastWidth = 0;
    this.broadcastHeight = 0;
    this.contentRect_ = createRectInit(0, 0, 0, 0);

    this.target = target;
};

/**
 * Updates content rectangle and tells whether it's width or height properties
 * have changed since the last broadcast.
 *
 * @returns {boolean}
 */


/**
 * Reference to the last observed content rectangle.
 *
 * @private {DOMRectInit}
 */


/**
 * Broadcasted width of content rectangle.
 *
 * @type {number}
 */
ResizeObservation.prototype.isActive = function () {
    var rect = getContentRect(this.target);

    this.contentRect_ = rect;

    return rect.width !== this.broadcastWidth || rect.height !== this.broadcastHeight;
};

/**
 * Updates 'broadcastWidth' and 'broadcastHeight' properties with a data
 * from the corresponding properties of the last observed content rectangle.
 *
 * @returns {DOMRectInit} Last observed content rectangle.
 */
ResizeObservation.prototype.broadcastRect = function () {
    var rect = this.contentRect_;

    this.broadcastWidth = rect.width;
    this.broadcastHeight = rect.height;

    return rect;
};

var ResizeObserverEntry = function(target, rectInit) {
    var contentRect = createReadOnlyRect(rectInit);

    // According to the specification following properties are not writable
    // and are also not enumerable in the native implementation.
    //
    // Property accessors are not being used as they'd require to define a
    // private WeakMap storage which may cause memory leaks in browsers that
    // don't support this type of collections.
    defineConfigurable(this, { target: target, contentRect: contentRect });
};

var ResizeObserverSPI = function(callback, controller, callbackCtx) {
    this.activeObservations_ = [];
    this.observations_ = new MapShim();

    if (typeof callback !== 'function') {
        throw new TypeError('The callback provided as parameter 1 is not a function.');
    }

    this.callback_ = callback;
    this.controller_ = controller;
    this.callbackCtx_ = callbackCtx;
};

/**
 * Starts observing provided element.
 *
 * @param {Element} target - Element to be observed.
 * @returns {void}
 */


/**
 * Registry of the ResizeObservation instances.
 *
 * @private {Map<Element, ResizeObservation>}
 */


/**
 * Public ResizeObserver instance which will be passed to the callback
 * function and used as a value of it's "this" binding.
 *
 * @private {ResizeObserver}
 */

/**
 * Collection of resize observations that have detected changes in dimensions
 * of elements.
 *
 * @private {Array<ResizeObservation>}
 */
ResizeObserverSPI.prototype.observe = function (target) {
    if (!arguments.length) {
        throw new TypeError('1 argument required, but only 0 present.');
    }

    // Do nothing if current environment doesn't have the Element interface.
    if (typeof Element === 'undefined' || !(Element instanceof Object)) {
        return;
    }

    if (!(target instanceof getWindowOf(target).Element)) {
        throw new TypeError('parameter 1 is not of type "Element".');
    }

    var observations = this.observations_;

    // Do nothing if element is already being observed.
    if (observations.has(target)) {
        return;
    }

    observations.set(target, new ResizeObservation(target));

    this.controller_.addObserver(this);

    // Force the update of observations.
    this.controller_.refresh();
};

/**
 * Stops observing provided element.
 *
 * @param {Element} target - Element to stop observing.
 * @returns {void}
 */
ResizeObserverSPI.prototype.unobserve = function (target) {
    if (!arguments.length) {
        throw new TypeError('1 argument required, but only 0 present.');
    }

    // Do nothing if current environment doesn't have the Element interface.
    if (typeof Element === 'undefined' || !(Element instanceof Object)) {
        return;
    }

    if (!(target instanceof getWindowOf(target).Element)) {
        throw new TypeError('parameter 1 is not of type "Element".');
    }

    var observations = this.observations_;

    // Do nothing if element is not being observed.
    if (!observations.has(target)) {
        return;
    }

    observations.delete(target);

    if (!observations.size) {
        this.controller_.removeObserver(this);
    }
};

/**
 * Stops observing all elements.
 *
 * @returns {void}
 */
ResizeObserverSPI.prototype.disconnect = function () {
    this.clearActive();
    this.observations_.clear();
    this.controller_.removeObserver(this);
};

/**
 * Collects observation instances the associated element of which has changed
 * it's content rectangle.
 *
 * @returns {void}
 */
ResizeObserverSPI.prototype.gatherActive = function () {
        var this$1 = this;

    this.clearActive();

    this.observations_.forEach(function (observation) {
        if (observation.isActive()) {
            this$1.activeObservations_.push(observation);
        }
    });
};

/**
 * Invokes initial callback function with a list of ResizeObserverEntry
 * instances collected from active resize observations.
 *
 * @returns {void}
 */
ResizeObserverSPI.prototype.broadcastActive = function () {
    // Do nothing if observer doesn't have active observations.
    if (!this.hasActive()) {
        return;
    }

    var ctx = this.callbackCtx_;

    // Create ResizeObserverEntry instance for every active observation.
    var entries = this.activeObservations_.map(function (observation) {
        return new ResizeObserverEntry(observation.target, observation.broadcastRect());
    });

    this.callback_.call(ctx, entries, ctx);
    this.clearActive();
};

/**
 * Clears the collection of active observations.
 *
 * @returns {void}
 */
ResizeObserverSPI.prototype.clearActive = function () {
    this.activeObservations_.splice(0);
};

/**
 * Tells whether observer has active observations.
 *
 * @returns {boolean}
 */
ResizeObserverSPI.prototype.hasActive = function () {
    return this.activeObservations_.length > 0;
};

// Registry of internal observers. If WeakMap is not available use current shim
// for the Map collection as it has all required methods and because WeakMap
// can't be fully polyfilled anyway.
var observers = typeof WeakMap !== 'undefined' ? new WeakMap() : new MapShim();

/**
 * ResizeObserver API. Encapsulates the ResizeObserver SPI implementation
 * exposing only those methods and properties that are defined in the spec.
 */
var ResizeObserver = function(callback) {
    if (!(this instanceof ResizeObserver)) {
        throw new TypeError('Cannot call a class as a function.');
    }
    if (!arguments.length) {
        throw new TypeError('1 argument required, but only 0 present.');
    }

    var controller = ResizeObserverController.getInstance();
    var observer = new ResizeObserverSPI(callback, controller, this);

    observers.set(this, observer);
};

// Expose public methods of ResizeObserver.
['observe', 'unobserve', 'disconnect'].forEach(function (method) {
    ResizeObserver.prototype[method] = function () {
        return (ref = observers.get(this))[method].apply(ref, arguments);
        var ref;
    };
});

var index = (function () {
    // Export existing implementation if available.
    if (typeof global$1.ResizeObserver !== 'undefined') {
        return global$1.ResizeObserver;
    }

    return ResizeObserver;
})();

return index;

})));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DataTable = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _event = require('../grid/event');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DataTable = exports.DataTable = function (_EventDispatcher) {
    _inherits(DataTable, _EventDispatcher);

    function DataTable(dataModel, extension) {
        _classCallCheck(this, DataTable);

        var _this = _possibleConstructorReturn(this, (DataTable.__proto__ || Object.getPrototypeOf(DataTable)).call(this));

        _this._extension = extension;
        _this._idRunner = 0;
        _this._rid = [];
        _this._rowMap = {};
        _this._data = [];
        _this._blockEvent = false;
        _this._processedEvent = [];

        var format = dataModel.format,
            data = dataModel.data,
            fields = dataModel.fields;

        // Set default format at rows

        if (!format) {
            format = 'rows';
        }
        _this._dataFormat = format;
        _this._fields = fields;

        if (Array.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                _this.addRow(data[i]);
            }
        } else {
            _this._data = [];
        }
        return _this;
    }

    _createClass(DataTable, [{
        key: 'getRowCount',
        value: function getRowCount() {
            return this._data.length;
        }
    }, {
        key: 'getData',
        value: function getData(rowId, field) {
            var row = this._rowMap[rowId];
            if (row) {
                return row[field];
            }
            return undefined;
        }
    }, {
        key: 'getDataAt',
        value: function getDataAt(rowIndex, field) {
            var row = this._data[rowIndex];
            if (row) {
                return row[field];
            }
            return undefined;
        }
    }, {
        key: 'getRowData',
        value: function getRowData(rowId) {
            return this._rowMap[rowId];
        }
    }, {
        key: 'getRowDataAt',
        value: function getRowDataAt(rowIndex) {
            return this._data[rowIndex];
        }
    }, {
        key: 'getRowIndex',
        value: function getRowIndex(rowId) {
            return this._rid.indexOf(rowId);
        }
    }, {
        key: 'getRowId',
        value: function getRowId(rowIndex) {
            return this._rid[rowIndex];
        }
    }, {
        key: 'setData',
        value: function setData(rowId, field, value) {
            var beforeUpdateArg = {
                rowId: rowId,
                field: field,
                data: value,
                cancel: false
            };

            this._processedEvent.push(beforeUpdateArg);

            var blocked = false;

            if (!this._blockEvent) {
                this._blockEvent = true;
                this._extension.executeExtension('dataBeforeUpdate', beforeUpdateArg);
                this._blockEvent = false;
            } else {
                blocked = true;
            }

            if (!beforeUpdateArg.cancel) {
                var row = this._rowMap[rowId];
                if (row) {
                    row[field] = beforeUpdateArg.data;
                    if (!this._blockEvent) {
                        this._blockEvent = true;
                        this._extension.executeExtension('dataAfterUpdate', beforeUpdateArg);
                        this._blockEvent = false;
                    }
                }
            }

            if (!blocked) {
                this._extension.executeExtension('dataFinishUpdate', {
                    updates: this._processedEvent
                });
                //Clear processed event list            
                this._processedEvent.length = 0;
            }
        }
    }, {
        key: 'setDataAt',
        value: function setDataAt(rowIndex, field, value) {
            var rowId = this._rid[rowIndex];
            if (rowId !== undefined) {
                this.setData(rowId, field, value);
            }
        }
    }, {
        key: 'addRow',
        value: function addRow(rowData) {
            var count = this.getRowCount();
            this.insertRow(count, rowData);
        }
    }, {
        key: 'insertRow',
        value: function insertRow(rowIndex, rowData) {
            if (this._dataFormat === 'rows') {
                var rid = this._generateRowId();
                this._rid.splice(rowIndex, 0, rid);
                this._rowMap[rid] = rowData;
                this._data.splice(rowIndex, 0, rowData);
            } else if (this._dataFormat === 'array') {
                if (Array.isArray(this._fields)) {
                    var _rid = this._generateRowId();
                    this._rid.splice(rowIndex, 0, _rid);
                    var newObj = this._createObject(rowData, this._fields);
                    this._rowMap[_rid] = newObj;
                    this._data.splice(rowIndex, 0, newObj);
                }
            }
        }
    }, {
        key: 'removeRow',
        value: function removeRow(rid) {
            var row = this._rowMap[rid];
            var index = this._data.indexOf(row);
            this._data.splice(index, 1);
            delete this._rowMap[rid];
        }
    }, {
        key: 'removeRowAt',
        value: function removeRowAt(index) {
            var rid = Object.keys(this._rowMap).find(function (key) {
                return object[key] === value;
            });
            delete this._rowMap[rid];
            this._data.splice(index, 1);
        }
    }, {
        key: '_generateRowId',
        value: function _generateRowId() {
            this._idRunner++;
            return '' + this._idRunner;
        }
    }, {
        key: '_createObject',
        value: function _createObject(arrayValues, fields) {
            var newObj = {};
            for (var i = 0; i < fields.length; i++) {
                newObj[fields[i]] = arrayValues[i];
            }
            return newObj;
        }
    }]);

    return DataTable;
}(_event.EventDispatcher);

},{"../grid/event":7}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CopyPasteExtension = exports.CopyPasteExtension = function () {
    function CopyPasteExtension() {
        _classCallCheck(this, CopyPasteExtension);

        this._globalClipboard = false;
    }

    _createClass(CopyPasteExtension, [{
        key: 'init',
        value: function init(grid, config) {
            this._grid = grid;
            this._config = config;
        }
    }, {
        key: 'keyDown',
        value: function keyDown(e) {
            if (this._globalClipboard && e.ctrlKey) {
                if (e.key === 'c') {
                    var data = this._copy();
                    if (data !== null) {
                        window.clipboardData.setData('text', data);
                    }
                } else if (e.key === 'v') {
                    this._paste(window.clipboardData.getData('text'));
                }
            }
        }
    }, {
        key: 'gridAfterRender',
        value: function gridAfterRender(e) {
            var _this = this;

            if (!window.clipboardData) {
                this._grid.view.getElement().addEventListener('paste', function (pasteEvent) {
                    _this._paste(pasteEvent.clipboardData.getData('text'));
                });
                this._grid.view.getElement().addEventListener('copy', function (copyEvent) {
                    var data = _this._copy();
                    if (data !== null) {
                        copyEvent.clipboardData.setData('text/plain', data);
                        copyEvent.preventDefault();
                    }
                });
                this._globalClipboard = false;
            } else {
                this._globalClipboard = true;
            }
        }
    }, {
        key: '_copy',
        value: function _copy(clipboardData) {
            var selection = this._grid.state.get('selection');
            if (selection && selection.length > 0) {
                var s = selection[0];
                var rows = [];
                for (var i = 0; i < s.h; i++) {
                    var cols = [];
                    for (var j = 0; j < s.w; j++) {
                        cols.push(this._grid.data.getDataAt(s.r + i, s.c + j));
                    }
                    rows.push(cols.join('\t'));
                }
                return rows.join('\n');
            } else {
                return null;
            }
        }
    }, {
        key: '_paste',
        value: function _paste(data) {
            if (data) {
                data = data.replace(/\n$/g, '');
                var selection = this._grid.state.get('selection');
                if (selection && selection.length > 0) {
                    var s = selection[0];
                    var rows = data.split('\n');
                    for (var i = 0; i < rows.length; i++) {
                        var cols = rows[i].split('\t');
                        for (var j = 0; j < cols.length; j++) {
                            var pasteRow = s.r + i;
                            var pasteCol = s.c + j;
                            if (this._grid.model.canEdit(pasteRow, pasteCol)) {
                                this._grid.data.setDataAt(pasteRow, pasteCol, cols[j]);
                                this._grid.view.updateCell(pasteRow, pasteCol);
                            }
                        }
                    }
                }
            }
        }
    }]);

    return CopyPasteExtension;
}();

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EditorExtension = exports.EditorExtension = function () {
	function EditorExtension() {
		_classCallCheck(this, EditorExtension);
	}

	_createClass(EditorExtension, [{
		key: 'init',
		value: function init(grid, config) {
			this._grid = grid;
			this._config = config;
			this._editorAttached = false;
		}
	}, {
		key: 'keyDown',
		value: function keyDown(e) {
			if (!this._editorAttached) {
				if (!e.ctrlKey) {
					var selection = this._grid.state.get('selection');
					if (selection && selection.length > 0) {
						var rowIndex = selection[0].r;
						var colIndex = selection[0].c;
						var edit = false;
						if (e.keyCode === 13 || e.keyCode > 31 && !(e.keyCode >= 37 && e.keyCode <= 40)) {
							edit = true;
						}
						if (edit && rowIndex >= 0 && rowIndex < this._grid.model.getRowCount() && colIndex >= 0 && colIndex < this._grid.model.getColumnCount()) {
							var cell = this._grid.view.getCell(rowIndex, colIndex);
							if (cell) {
								this._editCell(cell);
							}
						}
					}
				}
			}
		}
	}, {
		key: 'cellAfterRender',
		value: function cellAfterRender(e) {
			var _this = this;

			e.cell.addEventListener('dblclick', function (e) {
				var actualCell = e.target;
				if (actualCell) {
					_this._editCell(actualCell);
				}
			});
		}
	}, {
		key: '_editCell',
		value: function _editCell(cell) {
			var actualCell = cell;
			var actualRow = parseInt(actualCell.dataset.rowIndex);
			var actualCol = parseInt(actualCell.dataset.colIndex);
			if (this._grid.model.canEdit(actualRow, actualCol)) {
				//Get data to be edited
				var data = this._grid.model.getDataAt(actualRow, actualCol);

				//If there's custom editor, use custom editor to attach the editor
				this._grid.state.set('editing', true);
				var customEditor = this._grid.model.getCascadedCellProp(actualCell.dataset.rowIndex, actualCell.dataset.colIndex, 'editor');
				if (customEditor && customEditor.attach) {
					customEditor.attach(actualCell, data, this._done.bind(this));
				} else {
					this._attachEditor(actualCell, data, this._done.bind(this));
				}
				this._editorAttached = true;
				this._editingCol = actualCol;
				this._editingRow = actualRow;
			}
		}
	}, {
		key: '_attachEditor',
		value: function _attachEditor(cell, data, done) {
			var _this2 = this;

			if (!this._inputElement) {
				var cellBound = cell.getBoundingClientRect();
				this._inputElement = document.createElement('input');
				this._inputElement.type = 'text';
				this._inputElement.value = data;
				this._inputElement.style.width = cellBound.width - 6 + 'px';
				this._inputElement.style.height = cellBound.height - 3 + 'px';
				this._inputElement.className = 'pgrid-cell-text-editor';
				cell.innerHTML = '';
				cell.appendChild(this._inputElement);

				this._inputElement.focus();
				this._inputElement.select();

				this._arrowKeyLocked = false;

				this._keydownHandler = function (e) {
					switch (e.keyCode) {
						case 13:
							//Enter
							done(e.target.value);
							e.stopPropagation();
							e.preventDefault();
							break;
						case 27:
							//ESC
							done();
							e.preventDefault();
							e.stopPropagation();
							break;
						case 40: //Down
						case 38: //Up
						case 37: //Left
						case 39:
							//Right
							if (!_this2._arrowKeyLocked) {
								done(e.target.value);
							} else {
								e.preventDefault();
								e.stopPropagation();
							}
							break;
					}
				};
				this._keydownHandler = this._keydownHandler.bind(this);

				this._blurHandler = function (e) {
					done(e.target.value);
				};
				this._blurHandler = this._blurHandler.bind(this);

				this._clickHandler = function (e) {
					_this2._arrowKeyLocked = true;
				};

				this._inputElement.addEventListener('keydown', this._keydownHandler);
				this._inputElement.addEventListener('blur', this._blurHandler);
				this._inputElement.addEventListener('click', this._clickHandler);
			}
		}
	}, {
		key: '_detachEditor',
		value: function _detachEditor() {
			if (this._inputElement) {
				this._inputElement.removeEventListener('keydown', this._keydownHandler);
				this._inputElement.removeEventListener('blur', this._blurHandler);
				this._inputElement.removeEventListener('click', this._clickHandler);
				this._inputElement.parentElement.removeChild(this._inputElement);
				this._inputElement = null;
				this._keydownHandler = null;
				this._blurHandler = null;
				this._clickHandler = null;
			}
		}
	}, {
		key: '_done',
		value: function _done(result) {
			this._detachEditor();
			if (result !== undefined) {
				this._grid.model.setDataAt(this._editingRow, this._editingCol, result);
			}
			this._grid.view.updateCell(this._editingRow, this._editingCol);
			this._editingRow = -1;
			this._editingCol = -1;
			this._editorAttached = false;
			this._grid.state.set('editing', false);

			//Re-focus at the grid
			this._grid.view.getElement().focus();
		}
	}]);

	return EditorExtension;
}();

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SelectionExtension = exports.SelectionExtension = function () {
	function SelectionExtension() {
		_classCallCheck(this, SelectionExtension);
	}

	_createClass(SelectionExtension, [{
		key: 'init',
		value: function init(grid, config) {
			this._grid = grid;
			this._config = config;
			this._currentSelection = null;
			this._selectionClass = this._config.selection && this._config.selection.cssClass ? this._config.selection.cssClass : 'pgrid-cell-selection';
		}
	}, {
		key: 'keyDown',
		value: function keyDown(e) {
			var editing = this._grid.state.get('editing');
			if (editing) {
				return;
			}
			var selection = this._grid.state.get('selection');
			if (selection && selection.length > 0) {
				var rowIndex = selection[0].r;
				var colIndex = selection[0].c;
				var alignTop = true;
				switch (e.keyCode) {
					case 40:
						//Down
						rowIndex++;
						alignTop = false;
						break;
					case 38:
						//Up
						rowIndex--;
						break;
					case 37:
						//Left
						colIndex--;
						break;
					case 39: //Right
					case 9:
						//Tab
						colIndex++;
						break;
					default:
						return;
				}
				if (rowIndex >= 0 && rowIndex < this._grid.model.getRowCount() && colIndex >= 0 && colIndex < this._grid.model.getColumnCount()) {
					var isHeader = this._grid.model.isHeaderRow(rowIndex);
					var rowModel = this._grid.model.getRowModel(rowIndex);
					if (!rowModel || !isHeader) {
						var cell = this._grid.view.getCell(rowIndex, colIndex);
						if (cell) {
							this._selectCell(cell, rowIndex, colIndex);
							this._grid.view.scrollToCell(rowIndex, colIndex, alignTop);
							e.preventDefault();
							e.stopPropagation();
						}
					}
				}
			}
		}
	}, {
		key: 'cellAfterRender',
		value: function cellAfterRender(e) {
			var _this = this;

			e.cell.addEventListener('mousedown', function (e) {
				var actualCell = e.target;
				var actualRow = parseInt(actualCell.dataset.rowIndex);
				var actualCol = parseInt(actualCell.dataset.colIndex);
				var rowModel = _this._grid.model.getRowModel(actualRow);
				var isHeader = _this._grid.model.isHeaderRow(actualRow);
				if (!rowModel || !isHeader) {
					if (actualCell.classList.contains('pgrid-cell')) {
						_this._selectCell(actualCell, actualRow, actualCol);
					}
				}
			});
		}
	}, {
		key: '_selectCell',
		value: function _selectCell(cell, rowIndex, colIndex) {
			//Clear old selection
			if (this._currentSelection && this._currentSelection !== cell) {
				this._currentSelection.classList.remove(this._selectionClass);
			}

			//Set selection
			this._currentSelection = cell;
			this._currentSelection.classList.add(this._selectionClass);
			this._grid.view.getElement().focus();

			//Store selection state
			var selection = this._grid.state.get('selection');
			if (!selection) {
				selection = [];
				this._grid.state.set('selection', selection);
			}
			selection.length = 0;
			selection.push({
				r: rowIndex,
				c: colIndex,
				w: 1,
				h: 1
			});
		}
	}]);

	return SelectionExtension;
}();

},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ViewUpdaterExtension = exports.ViewUpdaterExtension = function () {
    function ViewUpdaterExtension() {
        _classCallCheck(this, ViewUpdaterExtension);
    }

    _createClass(ViewUpdaterExtension, [{
        key: "init",
        value: function init(grid, config) {
            this._grid = grid;
            this._config = config;
        }
    }, {
        key: "dataFinishUpdate",
        value: function dataFinishUpdate(e) {
            var rowIndexCache = {};
            var colIndexCache = {};
            for (var i = 0; i < e.updates.length; i++) {
                var _e$updates$i = e.updates[i],
                    rowId = _e$updates$i.rowId,
                    field = _e$updates$i.field;

                var rowIndex = null;
                var colIndex = null;
                if (rowIndexCache[rowId]) {
                    rowIndex = rowIndexCache[rowId];
                } else {
                    rowIndex = this._grid.model.getRowIndex(rowId);
                    rowIndexCache[rowId] = rowIndex;
                }
                if (colIndexCache[field]) {
                    colIndex = colIndexCache[field];
                } else {
                    colIndex = this._grid.model.getColumnIndex(field);
                    colIndexCache[rowId] = colIndex;
                }
                this._grid.view.updateCell(rowIndex, colIndex);
            }
        }
    }]);

    return ViewUpdaterExtension;
}();

},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EventDispatcher = exports.EventDispatcher = function () {
	function EventDispatcher() {
		_classCallCheck(this, EventDispatcher);

		this._handlers = {};
	}

	_createClass(EventDispatcher, [{
		key: "listen",
		value: function listen(eventName, handler) {
			if (!this._handlers[eventName]) {
				this._handlers[eventName] = [];
			}
			this._handlers[eventName].push(hadnler);
		}
	}, {
		key: "unlisten",
		value: function unlisten(eventName, handler) {
			if (this._handlers[eventName]) {
				var index = this._handlers[eventName].indexOf(handler);
				if (index > -1) {
					this._handlers[eventName].splice(index, 1);
				}
			}
		}
	}, {
		key: "hasListener",
		value: function hasListener(eventName) {
			return this._handlers[eventName] && this._handlers[eventName].length > 0;
		}
	}, {
		key: "dispatch",
		value: function dispatch(eventName, eventArg) {
			if (this.hasListener(eventName)) {
				var listeners = this._handlers[eventName];
				for (var i = 0; i < listeners.length; i++) {
					listeners[i](eventArg);
				}
			}
		}
	}]);

	return EventDispatcher;
}();

},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Extension = exports.Extension = function () {
	function Extension(grid, config) {
		_classCallCheck(this, Extension);

		this._grid = grid;
		this._config = config;

		this._extensions = {
			cellRender: [],
			cellAfterRender: [],
			cellUpdate: [],
			cellAfterUpdate: [],
			keyDown: [],
			gridAfterRender: [],
			dataBeforeRender: [],
			dataBeforeUpdate: [],
			dataAfterUpdate: [],
			dataFinishUpdate: []
		};
	}

	_createClass(Extension, [{
		key: 'loadExtension',
		value: function loadExtension(ext) {
			if (ext['init']) {
				ext['init'](this._grid, this._config);
			}
			for (var extPoint in this._extensions) {
				if (ext[extPoint]) {
					this._extensions[extPoint].push(ext);
				}
			}
		}
	}, {
		key: 'hasExtension',
		value: function hasExtension(extPoint) {
			return this._extensions[extPoint] && this._extensions[extPoint].length > 0;
		}
	}, {
		key: 'queryExtension',
		value: function queryExtension(extPoint) {
			if (this._extensions[extPoint]) {
				return this._extensions[extPoint];
			} else {
				return [];
			}
		}
	}, {
		key: 'executeExtension',
		value: function executeExtension(extPoint) {
			var _arguments = arguments;

			this.queryExtension(extPoint).forEach(function (ext) {
				ext[extPoint].apply(ext, Array.prototype.slice.call(_arguments, 1));
			});
		}
	}]);

	return Extension;
}();

},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.PGrid = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _view = require('./view');

var _model = require('./model');

var _table = require('../data/table');

var _extension = require('./extension');

var _state = require('./state');

var _event = require('./event');

var _utils = require('./utils');

var _selection = require('../extensions/selection');

var _editor = require('../extensions/editor');

var _copypaste = require('../extensions/copypaste');

var _viewUpdater = require('../extensions/view-updater');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PGrid = exports.PGrid = function (_EventDispatcher) {
	_inherits(PGrid, _EventDispatcher);

	function PGrid(config) {
		_classCallCheck(this, PGrid);

		//Merge config with default config
		var _this = _possibleConstructorReturn(this, (PGrid.__proto__ || Object.getPrototypeOf(PGrid)).call(this));

		var defaultConfig = {
			rowCount: 0,
			headerRowCount: 1,
			footerRowCount: 0,
			columnCount: 0,
			rowHeight: 32,
			columnWidth: 100
		};
		_this._config = _utils.Utils.mixin(config, defaultConfig);

		//Extensions Store
		_this._extensions = new _extension.Extension(_this, _this._config);

		_this._data = new _table.DataTable(_this._config.dataModel, _this._extensions);
		_this._model = new _model.Model(_this._config, _this._data);
		_this._view = new _view.View(_this._model, _this._extensions);
		_this._state = new _state.State();

		//Load default extensions
		if (_this._config.selection) {
			_this._extensions.loadExtension(new _selection.SelectionExtension());
		}
		if (_this._config.editing) {
			_this._extensions.loadExtension(new _editor.EditorExtension());
		}
		if (_this._config.copypaste) {
			_this._extensions.loadExtension(new _copypaste.CopyPasteExtension());
		}
		if (_this._config.autoUpdate) {
			_this._extensions.loadExtension(new _viewUpdater.ViewUpdaterExtension());
		}

		//Load initial external extensions
		if (_this._config.extensions && _this._config.extensions.length > 0) {
			_this._config.extensions.forEach(function (ext) {
				_this._extensions.loadExtension(ext);
			});
		}
		return _this;
	}

	_createClass(PGrid, [{
		key: 'render',
		value: function render(element) {
			this._view.render(element);
		}
	}, {
		key: 'view',
		get: function get() {
			return this._view;
		}
	}, {
		key: 'model',
		get: function get() {
			return this._model;
		}
	}, {
		key: 'data',
		get: function get() {
			return this._data;
		}
	}, {
		key: 'extension',
		get: function get() {
			return this._extensions;
		}
	}, {
		key: 'state',
		get: function get() {
			return this._state;
		}
	}]);

	return PGrid;
}(_event.EventDispatcher);

},{"../data/table":2,"../extensions/copypaste":3,"../extensions/editor":4,"../extensions/selection":5,"../extensions/view-updater":6,"./event":7,"./extension":8,"./model":10,"./state":11,"./utils":12,"./view":13}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Model = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _event = require('./event');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Model = exports.Model = function (_EventDispatcher) {
	_inherits(Model, _EventDispatcher);

	function Model(config, data) {
		_classCallCheck(this, Model);

		var _this = _possibleConstructorReturn(this, (Model.__proto__ || Object.getPrototypeOf(Model)).call(this));

		_this._config = config;
		_this._data = data;

		_this._columnModel = [];
		_this._rowModel = {};
		_this._headerRowModel = {};
		_this._cellModel = {};
		_this._headerCellModel = {};

		if (_this._config.headerRows) {
			for (var i = 0; i < _this._config.headerRows.length; i++) {
				if (_this._config.headerRows[i].i !== undefined) {
					_this._headerRowModel[_this._config.headerRows[i].i] = _this._config.headerRows[i];
				}
			}
		}
		if (_this._config.columns) {
			for (var _i = 0; _i < _this._config.columns.length; _i++) {
				if (_this._config.columns[_i].i !== undefined) {
					_this._columnModel[_this._config.columns[_i].i] = _this._config.columns[_i];
				} else {
					_this._columnModel[_i] = _this._config.columns[_i];
				}
			}
		}
		if (_this._config.rows) {
			for (var _i2 = 0; _i2 < _this._config.rows.length; _i2++) {
				_this._rowModel[_this._config.rows[_i2].i] = _this._config.rows[_i2];
			}
		}
		if (_this._config.cells) {
			for (var _i3 = 0; _i3 < _this._config.cells.length; _i3++) {
				var model = _this._config.cells[_i3];
				if (!_this._cellModel[model.c]) {
					_this._cellModel[model.c] = {};
				}
				_this._cellModel[model.c][model.r] = model;
			}
		}
		if (_this._config.headerCells) {
			for (var _i4 = 0; _i4 < _this._config.headerCells.length; _i4++) {
				var _model = _this._config.headerCells[_i4];
				if (!_this._headerCellModel[_model.c]) {
					_this._headerCellModel[_model.c] = {};
				}
				_this._headerCellModel[_model.c][_model.r] = _model;
			}
		}

		_this._calcTotalSize();
		return _this;
	}

	_createClass(Model, [{
		key: 'canEdit',
		value: function canEdit(rowIndex, colIndex) {
			var rowModel = this.getRowModel(rowIndex);
			var colModel = this.getColumnModel(colIndex);
			var cellModel = this.getCellModel(rowIndex, colIndex);

			if (rowModel && rowModel.editable || colModel && colModel.editable || cellModel && cellModel.editable) {
				if (rowModel && rowModel.editable === false || colModel && colModel.editable === false || cellModel && cellModel.editable === false) {
					return false;
				}
				return true;
			}
			return false;
		}
	}, {
		key: 'isHeaderRow',
		value: function isHeaderRow(rowIndex) {
			return rowIndex < this._config.headerRowCount;
		}
	}, {
		key: 'getColumnWidth',
		value: function getColumnWidth(colIndex) {
			var colModel = this._columnModel[colIndex];
			if (colModel && colModel.width !== undefined) {
				return colModel.width;
			} else {
				return this._config.columnWidth;
			}
		}
	}, {
		key: 'getRowHeight',
		value: function getRowHeight(rowIndex) {
			if (this.isHeaderRow(rowIndex)) {} else {
				var dataRowIndex = rowIndex - this._config.headerRowCount;
				var rowModel = this._rowModel[dataRowIndex];
				if (rowModel && rowModel.height !== undefined) {
					return rowModel.height;
				} else {
					return this._config.rowHeight;
				}
			}
		}
	}, {
		key: 'getColumnCount',
		value: function getColumnCount() {
			return this._config.columns.length;
		}
	}, {
		key: 'getRowCount',
		value: function getRowCount() {
			var headerRowCount = this._config.headerRowCount;
			return headerRowCount + this._data.getRowCount();
		}
	}, {
		key: 'getTopFreezeRows',
		value: function getTopFreezeRows() {
			var topFreeze = 0;
			if (this._config.headerRowCount !== undefined) {
				topFreeze += this._config.headerRowCount;
			} else {
				topFreeze += 1;
			}
			if (this._config.freezePane && this._config.freezePane.top > 0) {
				topFreeze += this._config.freezePane.top;
			}
			return topFreeze;
		}
	}, {
		key: 'getTopFreezeSize',
		value: function getTopFreezeSize() {
			var topFreezeRow = this.getTopFreezeRows();
			var sum = 0;
			for (var i = 0; i < topFreezeRow; i++) {
				sum += this.getRowHeight(i);
			}
			return sum;
		}
	}, {
		key: 'getLeftFreezeRows',
		value: function getLeftFreezeRows() {
			if (this._config.freezePane && this._config.freezePane.left > 0) {
				return this._config.freezePane.left;
			}
			return 0;
		}
	}, {
		key: 'getLeftFreezeSize',
		value: function getLeftFreezeSize() {
			if (this._config.freezePane && this._config.freezePane.left > 0) {
				var sum = 0;
				for (var i = 0; i < this._config.freezePane.left; i++) {
					sum += this.getColumnWidth(i);
				}
				return sum;
			}
			return 0;
		}
	}, {
		key: 'getBottomFreezeRows',
		value: function getBottomFreezeRows() {
			if (this._config.freezePane && this._config.freezePane.bottom > 0) {
				return this._config.freezePane.bottom;
			}
			return 0;
		}
	}, {
		key: 'getBottomFreezeSize',
		value: function getBottomFreezeSize() {
			return this._bottomFreezeSize;
		}
	}, {
		key: 'getColumnWidth',
		value: function getColumnWidth(index) {
			if (this._columnModel[index] && this._columnModel[index].width !== undefined) {
				return this._columnModel[index].width;
			}
			return this._config.columnWidth;
		}
	}, {
		key: 'getRowHeight',
		value: function getRowHeight(index) {
			if (this._rowModel[index] && this._rowModel[index].height !== undefined) {
				return this._rowModel[index].height;
			}
			return this._config.rowHeight;
		}
	}, {
		key: 'getTotalWidth',
		value: function getTotalWidth() {
			return this._totalWidth;
		}
	}, {
		key: 'getTotalHeight',
		value: function getTotalHeight() {
			return this._totalHeight;
		}
	}, {
		key: 'getRowModel',
		value: function getRowModel(rowIndex) {
			if (this.isHeaderRow(rowIndex)) {
				return this._headerRowModel[rowIndex];
			} else {
				var dataRowIndex = rowIndex - this._config.headerRowCount;
				return this._rowModel[dataRowIndex];
			}
		}
	}, {
		key: 'getColumnModel',
		value: function getColumnModel(colIndex) {
			return this._columnModel[colIndex];
		}
	}, {
		key: 'getCellModel',
		value: function getCellModel(rowIndex, colIndex) {
			if (this.isHeaderRow(rowIndex)) {
				if (this._headerCellModel[colIndex]) {
					return this._headerCellModel[colIndex][rowIndex];
				}
			} else {
				var dataRowIndex = rowIndex - this._config.headerRowCount;
				if (this._cellModel[colIndex]) {
					return this._cellModel[colIndex][dataRowIndex];
				}
			}
		}
	}, {
		key: 'getCascadedCellProp',
		value: function getCascadedCellProp(rowIndex, colIndex, propName) {
			var cellModel = this.getCellModel(rowIndex, colIndex);
			if (cellModel && cellModel[propName]) {
				return cellModel[propName];
			}

			var rowModel = this.getRowModel(rowIndex);
			if (rowModel && rowModel[propName]) {
				return rowModel[propName];
			}

			var columnModel = this.getColumnModel(colIndex);
			if (columnModel && columnModel[propName]) {
				return columnModel[propName];
			}

			return undefined;
		}
	}, {
		key: 'getCellClasses',
		value: function getCellClasses(rowIndex, colIndex) {
			var output = [];
			var colModel = this.getColumnModel(colIndex);
			if (colModel) {
				if (colModel.cssClass) {
					output.unshift(colModel.cssClass);
				}
			}

			var isHeader = this.isHeaderRow(rowIndex);
			var rowModel = this.getRowModel(rowIndex);
			if (rowModel) {
				if (isHeader) {
					output.unshift('pgrid-row-header');
				}
				if (rowModel.cssClass) {
					output.unshift(rowModel.cssClass);
				}
			}

			var cellModel = this.getCellModel(rowIndex, colIndex);
			if (cellModel) {
				if (cellModel.cssClass) {
					output.unshift(cellModel.cssClass);
				}
			}
			return output;
		}
	}, {
		key: 'determineScrollbarState',
		value: function determineScrollbarState(viewWidth, viewHeight, scrollbarSize) {
			var needH = this._totalWidth > viewWidth;
			var needV = this._totalHeight > viewHeight;

			if (needH && !needV) {
				needV = this._totalHeight > viewHeight - scrollbarSize;
			} else if (!needH && needV) {
				needH = this._totalWidth > viewWidth - scrollbarSize;
			}

			if (needH && needV) {
				return 'b';
			} else if (!needH && needV) {
				return 'v';
			} else if (needH && !needV) {
				return 'h';
			}
			return 'n';
		}
	}, {
		key: 'getDataAt',
		value: function getDataAt(rowIndex, colIndex) {
			if (this.isHeaderRow(rowIndex)) {
				var colModel = this.getColumnModel(colIndex);
				if (colModel && colModel.title) {
					return colModel.title;
				} else {
					return undefined;
				}
			} else {
				var dataRowIndex = rowIndex - this._config.headerRowCount;
				var _colModel = this.getColumnModel(colIndex);
				if (_colModel && _colModel.field) {
					return this._data.getDataAt(dataRowIndex, _colModel.field);
				} else {
					return undefined;
				}
			}
		}
	}, {
		key: 'setDataAt',
		value: function setDataAt(rowIndex, colIndex, data) {
			var dataRowIndex = rowIndex - this._config.headerRowCount;
			var colModel = this.getColumnModel(colIndex);
			if (colModel && colModel.field) {
				this._data.setDataAt(dataRowIndex, colModel.field, data);
			}
		}
	}, {
		key: 'getRowIndex',
		value: function getRowIndex(rowId) {
			return this._config.headerRowCount + this._data.getRowIndex(rowId);
		}
	}, {
		key: 'getRowId',
		value: function getRowId(rowIndex) {
			if (rowIndex >= this._config.headerRowCount) {
				this._data.getRowId(rowIndex - this._config.headerRowCount);
			} else {
				return null;
			}
		}
	}, {
		key: 'getColumnIndex',
		value: function getColumnIndex(field) {
			for (var i = 0; i < this._config.columns.length; i++) {
				if (this._config.columns[i].field === field) {
					return i;
				}
			}
			return -1;
		}
	}, {
		key: 'getColumnField',
		value: function getColumnField(colIndex) {
			if (this._config.columns[colIndex]) {
				return this._config.columns[colIndex].field;
			}
		}
	}, {
		key: '_calcTotalSize',
		value: function _calcTotalSize() {
			this._calcTotalWidth();
			this._calcTotalHeight();
			this._calcBottomFreezeSize();
		}
	}, {
		key: '_calcTotalWidth',
		value: function _calcTotalWidth() {
			this._totalWidth = 0;
			for (var i = 0; i < this._columnModel.length; i++) {
				if (this._columnModel[i].width !== undefined) {
					this._totalWidth += this._columnModel[i].width;
				} else {
					this._totalWidth += this._config.columnWidth;
				}
			}
		}
	}, {
		key: '_calcTotalHeight',
		value: function _calcTotalHeight() {
			var headerRowModelCount = Object.keys(this._headerRowModel);
			this._totalHeight = this._config.rowHeight * (this._config.headerRowCount - headerRowModelCount.length);
			for (var index in this._headerRowModel) {
				if (this._headerRowModel[index].height !== undefined) {
					this._totalHeight += this._headerRowModel[index].height;
				} else {
					this._totalHeight += this._config.rowHeight;
				}
			}

			var rowModelCount = Object.keys(this._rowModel);
			this._totalHeight += this._config.rowHeight * (this._data.getRowCount() - rowModelCount.length);
			for (var _index in this._rowModel) {
				if (this._rowModel[_index].height !== undefined) {
					this._totalHeight += this._rowModel[_index].height;
				} else {
					this._totalHeight += this._config.rowHeight;
				}
			}
		}
	}, {
		key: '_calcBottomFreezeSize',
		value: function _calcBottomFreezeSize() {
			if (this._config.freezePane && this._config.freezePane.bottom > 0) {
				var sum = 0;
				for (var i = 0; i < this._config.freezePane.bottom; i++) {
					sum += this.getRowHeight(this._config.rowCount - 1 - i);
				}
				this._bottomFreezeSize = sum;
			} else {
				this._bottomFreezeSize = 0;
			}
		}
	}]);

	return Model;
}(_event.EventDispatcher);

},{"./event":7}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var State = exports.State = function () {
	function State() {
		_classCallCheck(this, State);

		this._state = {};
	}

	_createClass(State, [{
		key: "exists",
		value: function exists(key) {
			return this._state[key] !== undefined;
		}
	}, {
		key: "get",
		value: function get(key) {
			return this._state[key];
		}
	}, {
		key: "set",
		value: function set(key, value) {
			this._state[key] = value;
		}
	}]);

	return State;
}();

},{}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Utils = exports.Utils = function () {
	function Utils() {
		_classCallCheck(this, Utils);
	}

	_createClass(Utils, null, [{
		key: "mixin",
		value: function mixin(source, target) {
			for (var prop in source) {
				if (source.hasOwnProperty(prop)) {
					target[prop] = source[prop];
				}
			}
			return target;
		}
	}]);

	return Utils;
}();

},{}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.View = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _event = require('./event');

var _resizeObserverPolyfill = require('resize-observer-polyfill');

var _resizeObserverPolyfill2 = _interopRequireDefault(_resizeObserverPolyfill);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var View = exports.View = function (_EventDispatcher) {
	_inherits(View, _EventDispatcher);

	function View(model, extensions) {
		_classCallCheck(this, View);

		var _this = _possibleConstructorReturn(this, (View.__proto__ || Object.getPrototypeOf(View)).call(this));

		_this._model = model;
		_this._extensions = extensions;
		_this._template = '<div class="pgrid-content-pane" style="position: relative;">' + '	<div class="pgrid-top-left-pane" style="position: absolute;">' + '		<div class="pgrid-top-left-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>' + '	</div>' + '	<div class="pgrid-top-pane" style="position: absolute;">' + '		<div class="pgrid-top-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>' + '	</div>' + '	<div class="pgrid-left-pane" style="position: absolute;">' + '		<div class="pgrid-left-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>' + '	</div>' + '	<div class="pgrid-center-pane" style="position: absolute;">' + '		<div class="pgrid-center-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>' + '	</div>' + '	<div class="pgrid-bottom-left-pane" style="position: absolute;">' + '		<div class="pgrid-bottom-left-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>' + '	</div>' + '	<div class="pgrid-bottom-pane" style="position: absolute;">' + '		<div class="pgrid-bottom-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>' + '	</div>' + '</div>' + '<div class="pgrid-hscroll" style="position: absolute; bottom: 0px; overflow-y: hidden; overflow-x: scroll;">' + '	<div class="pgrid-hscroll-thumb"></div>' + '</div>' + '<div class="pgrid-vscroll" style="position: absolute; right: 0px; top: 0px; overflow-y: scroll; overflow-x: hidden;">' + '	<div class="pgrid-vscroll-thumb"></div>' + '</div>';
		return _this;
	}

	_createClass(View, [{
		key: 'render',
		value: function render(element) {
			this._element = element;
			this._element.className = 'pgrid';
			this._element.innerHTML = this._template;
			this._element.style.position = 'relative';
			this._element.style.overflow = 'hidden';
			this._element.tabIndex = 1;

			this._contentPane = this._element.querySelector('.pgrid-content-pane');
			this._topLeftPane = this._element.querySelector('.pgrid-top-left-pane');
			this._topLeftInner = this._element.querySelector('.pgrid-top-left-inner');
			this._topPane = this._element.querySelector('.pgrid-top-pane');
			this._topInner = this._element.querySelector('.pgrid-top-inner');
			this._leftPane = this._element.querySelector('.pgrid-left-pane');
			this._leftInner = this._element.querySelector('.pgrid-left-inner');
			this._centerPane = this._element.querySelector('.pgrid-center-pane');
			this._centerInner = this._element.querySelector('.pgrid-center-inner');
			this._bottomPane = this._element.querySelector('.pgrid-bottom-pane');
			this._bottomInner = this._element.querySelector('.pgrid-bottom-inner');
			this._bottomLeftPane = this._element.querySelector('.pgrid-bottom-left-pane');
			this._bottomLeftInner = this._element.querySelector('.pgrid-bottom-left-inner');

			this._scrollWidth = this._measureScrollbarWidth();

			this._hScroll = this._element.querySelector('.pgrid-hscroll');
			this._vScroll = this._element.querySelector('.pgrid-vscroll');
			this._hScrollThumb = this._element.querySelector('.pgrid-hscroll-thumb');
			this._vScrollThumb = this._element.querySelector('.pgrid-vscroll-thumb');
			this._hScroll.style.height = this._scrollWidth + 'px';
			this._vScroll.style.width = this._scrollWidth + 'px';
			this._hScrollThumb.style.height = this._scrollWidth + 'px';
			this._vScrollThumb.style.width = this._scrollWidth + 'px';

			this._observeSize();
			this._resturecture();
			this._attachHandlers();

			this._extensions.executeExtension('gridAfterRender', {
				grid: this
			});
		}
	}, {
		key: 'reRender',
		value: function reRender() {
			this._topLeftInner.innerHTML = '';
			this._topInner.innerHTML = '';
			this._leftInner.innerHTML = '';
			this._centerInner.innerHTML = '';
			this._bottomLeftInner.innerHTML = '';
			this._bottomInner.innerHTML = '';

			this._resturecture();
		}
	}, {
		key: 'getElement',
		value: function getElement() {
			return this._element;
		}
	}, {
		key: 'setScrollX',
		value: function setScrollX(x, adjustScrollBar) {
			this._topInner.scrollLeft = x;
			this._centerInner.scrollLeft = x;
			this._bottomInner.scrollLeft = x;
			if (adjustScrollBar || adjustScrollBar === undefined) {
				this._hScroll.scrollLeft = x;
			}
		}
	}, {
		key: 'getScrollX',
		value: function getScrollX() {
			return this._centerInner.scrollLeft;
		}
	}, {
		key: 'setScrollY',
		value: function setScrollY(y, adjustScrollBar) {
			this._centerInner.scrollTop = y;
			this._leftInner.scrollTop = y;
			if (adjustScrollBar || adjustScrollBar === undefined) {
				this._vScroll.scrollTop = y;
			}
		}
	}, {
		key: 'getScrollY',
		value: function getScrollY() {
			return this._centerInner.scrollTop;
		}
	}, {
		key: 'scrollToCell',
		value: function scrollToCell(rowIndex, colIndex, alignTop) {
			var cell = this.getCell(rowIndex, colIndex);
			var origScrollTop = cell.parentElement.scrollTop;
			var origScrollLeft = cell.parentElement.scrollLeft;

			cell.scrollIntoViewIfNeeded(false);

			if (origScrollTop !== cell.parentElement.scrollTop) {
				this.setScrollY(cell.parentElement.scrollTop, true);
			}
			if (origScrollLeft !== cell.parentElement.scrollLeft) {
				this.setScrollX(cell.parentElement.scrollLeft, true);
			}
		}
	}, {
		key: 'getCell',
		value: function getCell(rowIndex, colIndex) {
			var cell = this._element.querySelector('[data-row-index="' + rowIndex + '"][data-col-index="' + colIndex + '"]');
			return cell;
		}
	}, {
		key: 'updateCell',
		value: function updateCell(rowIndex, colIndex) {
			var cell = this.getCell(rowIndex, colIndex);
			if (cell) {
				//Create cell content wrapper if not any
				var cellContent = null;
				if (!cell.firstChild || !cell.firstChild.classList.contains('pgrid-cell-content')) {
					//Clear cell
					cell.innerHTML = '';

					//Add new cell content
					cellContent = document.createElement('div');
					cellContent.className = 'pgrid-cell-content';
					cell.appendChild(cellContent);
				} else {
					cellContent = cell.firstChild;
				}

				//Get data to be updated
				var data = this._model.getDataAt(rowIndex, colIndex);

				//Data can be transformed before rendering using dataBeforeRender extension
				var arg = { data: data };
				this._extensions.executeExtension('dataBeforeRender', arg);
				data = arg.data;

				//If there's cellUpdate extension, then execute it to update the cell data
				//Else use default way to put the data directly to the cell content
				var handledByExt = false;
				if (this._extensions.hasExtension('cellUpdate')) {
					arg = {
						data: data,
						cell: cell,
						cellContent: cellContent,
						rowIndex: rowIndex,
						colIndex: colIndex,
						rowId: this._model.getRowId(rowIndex),
						field: this._model.getColumnField(colIndex),
						handled: false
					};
					this._extensions.executeExtension('cellUpdate', arg);
					handledByExt = arg.handled;
				}

				if (!handledByExt) {
					if (data !== undefined && data !== null) {
						cellContent.innerHTML = data;
					} else {
						cellContent.innerHTML = '';
					}
				}

				this._extensions.executeExtension('cellAfterUpdate', {
					cell: cell,
					rowIndex: rowIndex,
					colIndex: colIndex,
					data: data
				});
			}
		}
	}, {
		key: '_attachHandlers',
		value: function _attachHandlers() {
			var _this2 = this;

			this._vScrollHandler = function (e) {
				_this2.setScrollY(e.target.scrollTop, false);
			};

			this._hScrollHandler = function (e) {
				_this2.setScrollX(e.target.scrollLeft, false);
			};

			this._wheelHandler = function (e) {
				var currentX = _this2.getScrollX();
				var currentY = _this2.getScrollY();
				_this2.setScrollX(currentX + e.deltaX);
				_this2.setScrollY(currentY + e.deltaY);
			};

			this._keyDownHandler = function (e) {
				_this2._extensions.executeExtension('keyDown', e);
			};

			this._vScroll.addEventListener('scroll', this._vScrollHandler);
			this._hScroll.addEventListener('scroll', this._hScrollHandler);
			this._contentPane.addEventListener('wheel', this._wheelHandler);
			this._element.addEventListener('keydown', this._keyDownHandler);
		}
	}, {
		key: '_resturecture',
		value: function _resturecture() {
			this._contentPane.style.width = 'calc(100% - ' + this._scrollWidth + 'px)';
			this._contentPane.style.height = 'calc(100% - ' + this._scrollWidth + 'px)';

			var topFreezeSize = this._model.getTopFreezeSize();
			var bottomFreezeSize = this._model.getBottomFreezeSize();
			var leftFreezeSize = this._model.getLeftFreezeSize();

			this._topLeftPane.style.left = '0px';
			this._topLeftPane.style.top = '0px';
			this._topLeftPane.style.width = leftFreezeSize + 'px';
			this._topLeftPane.style.height = topFreezeSize + 'px';
			this._topPane.style.left = leftFreezeSize + 'px';
			this._topPane.style.top = '0px';
			this._topPane.style.width = 'calc(100% - ' + leftFreezeSize + 'px)';
			this._topPane.style.height = topFreezeSize + 'px';
			this._leftPane.style.left = '0px';
			this._leftPane.style.top = topFreezeSize + 'px';
			this._leftPane.style.width = leftFreezeSize + 'px';
			this._leftPane.style.height = 'calc(100% - ' + (topFreezeSize + bottomFreezeSize) + 'px)';
			this._centerPane.style.left = leftFreezeSize + 'px';
			this._centerPane.style.top = topFreezeSize + 'px';
			this._centerPane.style.width = 'calc(100% - ' + leftFreezeSize + 'px)';
			this._centerPane.style.height = 'calc(100% - ' + (topFreezeSize + bottomFreezeSize) + 'px)';
			this._bottomLeftPane.style.left = '0px';
			this._bottomLeftPane.style.bottom = '0px';
			this._bottomLeftPane.style.width = leftFreezeSize + 'px';
			this._bottomLeftPane.style.height = bottomFreezeSize + 'px';
			this._bottomPane.style.left = leftFreezeSize + 'px';
			this._bottomPane.style.bottom = '0px';
			this._bottomPane.style.width = 'calc(100% - ' + leftFreezeSize + 'px)';
			this._bottomPane.style.height = bottomFreezeSize + 'px';

			this._renderCells();
			this._updateScrollBar();
		}
	}, {
		key: '_observeSize',
		value: function _observeSize() {
			var _this3 = this;

			this._resizeObserver = new _resizeObserverPolyfill2.default(function (entries, observer) {
				_this3._updateScrollBar();
			});
			this._resizeObserver.observe(this._element);
		}
	}, {
		key: '_updateScrollBar',
		value: function _updateScrollBar() {
			var totalWidth = this._model.getTotalWidth();
			var totalHeight = this._model.getTotalHeight();
			this._hScrollThumb.style.width = totalWidth + 'px';
			this._vScrollThumb.style.height = totalHeight + 'px';

			var gridRect = this._element.getBoundingClientRect();
			var scrollBarState = this._model.determineScrollbarState(gridRect.width, gridRect.height, this._scrollWidth);

			switch (scrollBarState) {
				case 'n':
					this._hScroll.style.display = 'none';
					this._vScroll.style.display = 'none';
					this._contentPane.style.width = '100%';
					this._contentPane.style.height = '100%';
					break;
				case 'h':
					this._hScroll.style.display = 'block';
					this._vScroll.style.display = 'none';
					this._hScroll.style.width = '100%';
					this._contentPane.style.width = '100%';
					this._contentPane.style.height = 'calc(100% - ' + this._scrollWidth + 'px)';
					break;
				case 'v':
					this._hScroll.style.display = 'none';
					this._vScroll.style.display = 'block';
					this._vScroll.style.height = '100%';
					this._contentPane.style.width = 'calc(100% - ' + this._scrollWidth + 'px)';
					this._contentPane.style.height = '100%';
					break;
				case 'b':
					this._hScroll.style.display = 'block';
					this._vScroll.style.display = 'block';
					this._hScroll.style.width = 'calc(100% - ' + this._scrollWidth + 'px)';
					this._vScroll.style.height = 'calc(100% - ' + this._scrollWidth + 'px)';
					this._contentPane.style.width = 'calc(100% - ' + this._scrollWidth + 'px)';
					this._contentPane.style.height = 'calc(100% - ' + this._scrollWidth + 'px)';
					break;
			}
		}
	}, {
		key: '_renderCells',
		value: function _renderCells() {
			var topFreeze = this._model.getTopFreezeRows();
			var leftFreeze = this._model.getLeftFreezeRows();
			var bottomFreeze = this._model.getBottomFreezeRows();
			var rowCount = this._model.getRowCount();
			var columnCount = this._model.getColumnCount();
			var topRunner = 0;
			var leftRunner = 0;
			var colWidth = [];

			//Render top rows
			topRunner = 0;
			for (var j = 0; j < topFreeze; j++) {
				var rowHeight = this._model.getRowHeight(j);
				//Render top left cells
				leftRunner = 0;
				for (var i = 0; i < leftFreeze; i++) {
					colWidth[i] = this._model.getColumnWidth(i);
					this._renderCell(j, i, this._topLeftInner, leftRunner, topRunner, colWidth[i], rowHeight);
					leftRunner += colWidth[i];
				}
				//Render top cells
				leftRunner = 0;
				for (var _i = leftFreeze; _i < columnCount; _i++) {
					colWidth[_i] = this._model.getColumnWidth(_i);
					this._renderCell(j, _i, this._topInner, leftRunner, topRunner, colWidth[_i], rowHeight);
					leftRunner += colWidth[_i];
				}
				topRunner += rowHeight;
			}

			//Render middle rows
			topRunner = 0;
			for (var _j = topFreeze; _j < rowCount - bottomFreeze; _j++) {
				var _rowHeight = this._model.getRowHeight(_j);
				//Render left cells
				leftRunner = 0;
				for (var _i2 = 0; _i2 < leftFreeze; _i2++) {
					this._renderCell(_j, _i2, this._leftInner, leftRunner, topRunner, colWidth[_i2], _rowHeight);
					leftRunner += colWidth[_i2];
				}
				//Render center cells
				leftRunner = 0;
				for (var _i3 = leftFreeze; _i3 < columnCount; _i3++) {
					this._renderCell(_j, _i3, this._centerInner, leftRunner, topRunner, colWidth[_i3], _rowHeight);
					leftRunner += colWidth[_i3];
				}
				topRunner += _rowHeight;
			}

			//Render bottom rows
			topRunner = 0;
			for (var _j2 = rowCount - bottomFreeze; _j2 < rowCount; _j2++) {
				var _rowHeight2 = this._model.getRowHeight(_j2);
				//Render left cells
				leftRunner = 0;
				for (var _i4 = 0; _i4 < leftFreeze; _i4++) {
					this._renderCell(_j2, _i4, this._bottomLeftInner, leftRunner, topRunner, colWidth[_i4], _rowHeight2);
					leftRunner += colWidth[_i4];
				}
				//Render center cells
				leftRunner = 0;
				for (var _i5 = leftFreeze; _i5 < columnCount; _i5++) {
					this._renderCell(_j2, _i5, this._bottomInner, leftRunner, topRunner, colWidth[_i5], _rowHeight2);
					leftRunner += colWidth[_i5];
				}
				topRunner += _rowHeight2;
			}
		}
	}, {
		key: '_renderCell',
		value: function _renderCell(rowIndex, colIndex, pane, x, y, width, height) {
			var data = this._model.getDataAt(rowIndex, colIndex);

			//Data can be transformed before rendering using dataBeforeRender extension
			var arg = { data: data };
			this._extensions.executeExtension('dataBeforeRender', arg);
			data = arg.data;

			var cell = document.createElement('div');
			var cellClasses = this._model.getCellClasses(rowIndex, colIndex);
			cell.className = 'pgrid-cell ' + cellClasses.join(' ');
			cell.style.left = x + 'px';
			cell.style.top = y + 'px';
			cell.style.width = width + 'px';
			cell.style.height = height + 'px';
			cell.dataset.rowIndex = rowIndex;
			cell.dataset.colIndex = colIndex;

			var cellContent = document.createElement('div');
			cellContent.className = 'pgrid-cell-content';
			cell.appendChild(cellContent);
			pane.appendChild(cell);

			var eventArg = {
				cell: cell,
				cellContent: cellContent,
				rowIndex: rowIndex,
				colIndex: colIndex,
				data: data,
				rowId: this._model.getRowId(rowIndex),
				field: this._model.getColumnField(colIndex),
				handled: false
			};

			//If there's cellRender extension, use cellRender extension to render the cell
			//Else just set the data to the cellContent directly
			var handledByExt = false;
			if (this._extensions.hasExtension('cellRender')) {
				this._extensions.executeExtension('cellRender', eventArg);
				handledByExt = eventArg.handled;
			}

			if (!handledByExt) {
				if (data !== undefined) {
					cellContent.innerHTML = data;
				}
			}

			this._extensions.executeExtension('cellAfterRender', eventArg);
			this._extensions.executeExtension('cellAfterUpdate', eventArg);

			eventArg = null;
		}
	}, {
		key: '_measureScrollbarWidth',
		value: function _measureScrollbarWidth() {
			var inner = document.createElement('p');
			inner.style.width = '100%';
			inner.style.height = '200px';
			var outmost = document.createElement('div');
			outmost.className = 'pgrid';
			var outer = document.createElement('div');
			outer.style.position = 'absolute';
			outer.style.top = '0px';
			outer.style.left = '0px';
			outer.style.visibility = 'hidden';
			outer.style.width = '200px';
			outer.style.height = '150px';
			outer.style.overflow = 'hidden';
			outer.appendChild(inner);
			outmost.appendChild(outer);
			document.body.appendChild(outmost);
			var w1 = inner.offsetWidth;
			outer.style.overflow = 'scroll';
			var w2 = inner.offsetWidth;
			if (w1 == w2) w2 = outer.clientWidth;
			document.body.removeChild(outmost);
			return w1 - w2 + (this._detectIE() ? 1 : 0);
		}
	}, {
		key: '_detectIE',
		value: function _detectIE() {
			var ua = window.navigator.userAgent;
			var msie = ua.indexOf('MSIE ');
			if (msie > 0) {
				// IE 10 or older => return version number
				return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
			}

			var trident = ua.indexOf('Trident/');
			if (trident > 0) {
				// IE 11 => return version number
				var rv = ua.indexOf('rv:');
				return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
			}

			var edge = ua.indexOf('Edge/');
			if (edge > 0) {
				// Edge (IE 12+) => return version number
				return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
			}
			// other browser
			return false;
		}
	}]);

	return View;
}(_event.EventDispatcher);

},{"./event":7,"resize-observer-polyfill":1}],14:[function(require,module,exports){
'use strict';

var _grid = require('./grid/grid');

window.PGrid = _grid.PGrid;

// Polyfill - Element.scrollIntoViewIfNeeded

if (!Element.prototype.scrollIntoViewIfNeeded) {
    Element.prototype.scrollIntoViewIfNeeded = function (centerIfNeeded) {
        centerIfNeeded = arguments.length === 0 ? true : !!centerIfNeeded;

        var parent = this.parentNode,
            parentComputedStyle = window.getComputedStyle(parent, null),
            parentBorderTopWidth = parseInt(parentComputedStyle.getPropertyValue('border-top-width')),
            parentBorderLeftWidth = parseInt(parentComputedStyle.getPropertyValue('border-left-width')),
            overTop = this.offsetTop - parent.offsetTop < parent.scrollTop,
            overBottom = this.offsetTop - parent.offsetTop + this.clientHeight - parentBorderTopWidth > parent.scrollTop + parent.clientHeight,
            overLeft = this.offsetLeft - parent.offsetLeft < parent.scrollLeft,
            overRight = this.offsetLeft - parent.offsetLeft + this.clientWidth - parentBorderLeftWidth > parent.scrollLeft + parent.clientWidth,
            alignWithTop = overTop && !overBottom;

        if ((overTop || overBottom) && centerIfNeeded) {
            parent.scrollTop = this.offsetTop - parent.offsetTop - parent.clientHeight / 2 - parentBorderTopWidth + this.clientHeight / 2;
        }

        if ((overLeft || overRight) && centerIfNeeded) {
            parent.scrollLeft = this.offsetLeft - parent.offsetLeft - parent.clientWidth / 2 - parentBorderLeftWidth + this.clientWidth / 2;
        }

        if ((overTop || overBottom || overLeft || overRight) && !centerIfNeeded) {
            this.scrollIntoView(alignWithTop);
        }
    };
}

},{"./grid/grid":9}]},{},[14])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcmVzaXplLW9ic2VydmVyLXBvbHlmaWxsL2Rpc3QvUmVzaXplT2JzZXJ2ZXIuanMiLCJzcmNcXGRhdGFcXHRhYmxlLmpzIiwic3JjXFxleHRlbnNpb25zXFxjb3B5cGFzdGUuanMiLCJzcmNcXGV4dGVuc2lvbnNcXGVkaXRvci5qcyIsInNyY1xcZXh0ZW5zaW9uc1xcc2VsZWN0aW9uLmpzIiwic3JjXFxleHRlbnNpb25zXFx2aWV3LXVwZGF0ZXIuanMiLCJzcmNcXGdyaWRcXGV2ZW50LmpzIiwic3JjXFxncmlkXFxleHRlbnNpb24uanMiLCJzcmNcXGdyaWRcXGdyaWQuanMiLCJzcmNcXGdyaWRcXG1vZGVsLmpzIiwic3JjXFxncmlkXFxzdGF0ZS5qcyIsInNyY1xcZ3JpZFxcdXRpbHMuanMiLCJzcmNcXGdyaWRcXHZpZXcuanMiLCJzcmNcXG1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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LFdBQVcsVUFBWixLQUEyQixjQUEvQixFQUErQztBQUMzQyxtQkFBTyxTQUFQLEdBQW1CLEtBQUssU0FBTCxHQUFpQixPQUFPLFNBQXhCLEdBQW9DLE9BQU8sWUFBUCxHQUFzQixDQUExRCxHQUE4RCxvQkFBOUQsR0FBcUYsS0FBSyxZQUFMLEdBQW9CLENBQTVIO0FBQ0g7O0FBRUQsWUFBSSxDQUFDLFlBQVksU0FBYixLQUEyQixjQUEvQixFQUErQztBQUMzQyxtQkFBTyxVQUFQLEdBQW9CLEtBQUssVUFBTCxHQUFrQixPQUFPLFVBQXpCLEdBQXNDLE9BQU8sV0FBUCxHQUFxQixDQUEzRCxHQUErRCxxQkFBL0QsR0FBdUYsS0FBSyxXQUFMLEdBQW1CLENBQTlIO0FBQ0g7O0FBRUQsWUFBSSxDQUFDLFdBQVcsVUFBWCxJQUF5QixRQUF6QixJQUFxQyxTQUF0QyxLQUFvRCxDQUFDLGNBQXpELEVBQXlFO0FBQ3JFLGlCQUFLLGNBQUwsQ0FBb0IsWUFBcEI7QUFDSDtBQUNKLEtBeEJEO0FBeUJIIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG5cdHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpIDpcblx0dHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKGZhY3RvcnkpIDpcblx0KGdsb2JhbC5SZXNpemVPYnNlcnZlciA9IGZhY3RvcnkoKSk7XG59KHRoaXMsIChmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0JztcblxuLyoqXHJcbiAqIEEgY29sbGVjdGlvbiBvZiBzaGltcyB0aGF0IHByb3ZpZGUgbWluaW1hbCBmdW5jdGlvbmFsaXR5IG9mIHRoZSBFUzYgY29sbGVjdGlvbnMuXHJcbiAqXHJcbiAqIFRoZXNlIGltcGxlbWVudGF0aW9ucyBhcmUgbm90IG1lYW50IHRvIGJlIHVzZWQgb3V0c2lkZSBvZiB0aGUgUmVzaXplT2JzZXJ2ZXJcclxuICogbW9kdWxlcyBhcyB0aGV5IGNvdmVyIG9ubHkgYSBsaW1pdGVkIHJhbmdlIG9mIHVzZSBjYXNlcy5cclxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSByZXF1aXJlLWpzZG9jLCB2YWxpZC1qc2RvYyAqL1xudmFyIE1hcFNoaW0gPSAoZnVuY3Rpb24gKCkge1xuICAgIGlmICh0eXBlb2YgTWFwICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gTWFwO1xuICAgIH1cblxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBpbmRleCBpbiBwcm92aWRlZCBhcnJheSB0aGF0IG1hdGNoZXMgdGhlIHNwZWNpZmllZCBrZXkuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtBcnJheTxBcnJheT59IGFyclxyXG4gICAgICogQHBhcmFtIHsqfSBrZXlcclxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRJbmRleChhcnIsIGtleSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gLTE7XG5cbiAgICAgICAgYXJyLnNvbWUoZnVuY3Rpb24gKGVudHJ5LCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKGVudHJ5WzBdID09PSBrZXkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBpbmRleDtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIGFub255bW91cygpIHtcbiAgICAgICAgICAgIHRoaXMuX19lbnRyaWVzX18gPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcm90b3R5cGVBY2Nlc3NvcnMgPSB7IHNpemU6IHsgY29uZmlndXJhYmxlOiB0cnVlIH0gfTtcblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAgICAgKi9cbiAgICAgICAgcHJvdG90eXBlQWNjZXNzb3JzLnNpemUuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX19lbnRyaWVzX18ubGVuZ3RoO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7Kn0ga2V5XHJcbiAgICAgICAgICogQHJldHVybnMgeyp9XHJcbiAgICAgICAgICovXG4gICAgICAgIGFub255bW91cy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gZ2V0SW5kZXgodGhpcy5fX2VudHJpZXNfXywga2V5KTtcbiAgICAgICAgICAgIHZhciBlbnRyeSA9IHRoaXMuX19lbnRyaWVzX19baW5kZXhdO1xuXG4gICAgICAgICAgICByZXR1cm4gZW50cnkgJiYgZW50cnlbMV07XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHsqfSBrZXlcclxuICAgICAgICAgKiBAcGFyYW0geyp9IHZhbHVlXHJcbiAgICAgICAgICogQHJldHVybnMge3ZvaWR9XHJcbiAgICAgICAgICovXG4gICAgICAgIGFub255bW91cy5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGdldEluZGV4KHRoaXMuX19lbnRyaWVzX18sIGtleSk7XG5cbiAgICAgICAgICAgIGlmICh+aW5kZXgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9fZW50cmllc19fW2luZGV4XVsxXSA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9fZW50cmllc19fLnB1c2goW2tleSwgdmFsdWVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0geyp9IGtleVxyXG4gICAgICAgICAqIEByZXR1cm5zIHt2b2lkfVxyXG4gICAgICAgICAqL1xuICAgICAgICBhbm9ueW1vdXMucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHZhciBlbnRyaWVzID0gdGhpcy5fX2VudHJpZXNfXztcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGdldEluZGV4KGVudHJpZXMsIGtleSk7XG5cbiAgICAgICAgICAgIGlmICh+aW5kZXgpIHtcbiAgICAgICAgICAgICAgICBlbnRyaWVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHsqfSBrZXlcclxuICAgICAgICAgKiBAcmV0dXJucyB7dm9pZH1cclxuICAgICAgICAgKi9cbiAgICAgICAgYW5vbnltb3VzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gISF+Z2V0SW5kZXgodGhpcy5fX2VudHJpZXNfXywga2V5KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcmV0dXJucyB7dm9pZH1cclxuICAgICAgICAgKi9cbiAgICAgICAgYW5vbnltb3VzLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX19lbnRyaWVzX18uc3BsaWNlKDApO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXHJcbiAgICAgICAgICogQHBhcmFtIHsqfSBbY3R4PW51bGxdXHJcbiAgICAgICAgICogQHJldHVybnMge3ZvaWR9XHJcbiAgICAgICAgICovXG4gICAgICAgIGFub255bW91cy5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChjYWxsYmFjaywgY3R4KSB7XG4gICAgICAgICAgICB2YXIgdGhpcyQxID0gdGhpcztcbiAgICAgICAgICAgIGlmICggY3R4ID09PSB2b2lkIDAgKSBjdHggPSBudWxsO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGlzdCA9IHRoaXMkMS5fX2VudHJpZXNfXzsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICB2YXIgZW50cnkgPSBsaXN0W2ldO1xuXG4gICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjdHgsIGVudHJ5WzFdLCBlbnRyeVswXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoIGFub255bW91cy5wcm90b3R5cGUsIHByb3RvdHlwZUFjY2Vzc29ycyApO1xuXG4gICAgICAgIHJldHVybiBhbm9ueW1vdXM7XG4gICAgfSgpKTtcbn0pKCk7XG5cbi8qKlxyXG4gKiBEZXRlY3RzIHdoZXRoZXIgd2luZG93IGFuZCBkb2N1bWVudCBvYmplY3RzIGFyZSBhdmFpbGFibGUgaW4gY3VycmVudCBlbnZpcm9ubWVudC5cclxuICovXG52YXIgaXNCcm93c2VyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuZG9jdW1lbnQgPT09IGRvY3VtZW50O1xuXG4vLyBSZXR1cm5zIGdsb2JhbCBvYmplY3Qgb2YgYSBjdXJyZW50IGVudmlyb25tZW50LlxudmFyIGdsb2JhbCQxID0gKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgJiYgZ2xvYmFsLk1hdGggPT09IE1hdGgpIHtcbiAgICAgICAgcmV0dXJuIGdsb2JhbDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnICYmIHNlbGYuTWF0aCA9PT0gTWF0aCkge1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lk1hdGggPT09IE1hdGgpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdztcbiAgICB9XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmV3LWZ1bmNcbiAgICByZXR1cm4gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbn0pKCk7XG5cbi8qKlxyXG4gKiBBIHNoaW0gZm9yIHRoZSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgd2hpY2ggZmFsbHMgYmFjayB0byB0aGUgc2V0VGltZW91dCBpZlxyXG4gKiBmaXJzdCBvbmUgaXMgbm90IHN1cHBvcnRlZC5cclxuICpcclxuICogQHJldHVybnMge251bWJlcn0gUmVxdWVzdHMnIGlkZW50aWZpZXIuXHJcbiAqL1xudmFyIHJlcXVlc3RBbmltYXRpb25GcmFtZSQxID0gKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBJdCdzIHJlcXVpcmVkIHRvIHVzZSBhIGJvdW5kZWQgZnVuY3Rpb24gYmVjYXVzZSBJRSBzb21ldGltZXMgdGhyb3dzXG4gICAgICAgIC8vIGFuIFwiSW52YWxpZCBjYWxsaW5nIG9iamVjdFwiIGVycm9yIGlmIHJBRiBpcyBpbnZva2VkIHdpdGhvdXQgdGhlIGdsb2JhbFxuICAgICAgICAvLyBvYmplY3Qgb24gdGhlIGxlZnQgaGFuZCBzaWRlLlxuICAgICAgICByZXR1cm4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lLmJpbmQoZ2xvYmFsJDEpO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAoY2FsbGJhY2spIHsgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyByZXR1cm4gY2FsbGJhY2soRGF0ZS5ub3coKSk7IH0sIDEwMDAgLyA2MCk7IH07XG59KSgpO1xuXG4vLyBEZWZpbmVzIG1pbmltdW0gdGltZW91dCBiZWZvcmUgYWRkaW5nIGEgdHJhaWxpbmcgY2FsbC5cbnZhciB0cmFpbGluZ1RpbWVvdXQgPSAyO1xuXG4vKipcclxuICogQ3JlYXRlcyBhIHdyYXBwZXIgZnVuY3Rpb24gd2hpY2ggZW5zdXJlcyB0aGF0IHByb3ZpZGVkIGNhbGxiYWNrIHdpbGwgYmVcclxuICogaW52b2tlZCBvbmx5IG9uY2UgZHVyaW5nIHRoZSBzcGVjaWZpZWQgZGVsYXkgcGVyaW9kLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIGJlIGludm9rZWQgYWZ0ZXIgdGhlIGRlbGF5IHBlcmlvZC5cclxuICogQHBhcmFtIHtudW1iZXJ9IGRlbGF5IC0gRGVsYXkgYWZ0ZXIgd2hpY2ggdG8gaW52b2tlIGNhbGxiYWNrLlxyXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259XHJcbiAqL1xudmFyIHRocm90dGxlID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBkZWxheSkge1xuICAgIHZhciBsZWFkaW5nQ2FsbCA9IGZhbHNlLFxuICAgICAgICB0cmFpbGluZ0NhbGwgPSBmYWxzZSxcbiAgICAgICAgbGFzdENhbGxUaW1lID0gMDtcblxuICAgIC8qKlxyXG4gICAgICogSW52b2tlcyB0aGUgb3JpZ2luYWwgY2FsbGJhY2sgZnVuY3Rpb24gYW5kIHNjaGVkdWxlcyBuZXcgaW52b2NhdGlvbiBpZlxyXG4gICAgICogdGhlIFwicHJveHlcIiB3YXMgY2FsbGVkIGR1cmluZyBjdXJyZW50IHJlcXVlc3QuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge3ZvaWR9XHJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZXNvbHZlUGVuZGluZygpIHtcbiAgICAgICAgaWYgKGxlYWRpbmdDYWxsKSB7XG4gICAgICAgICAgICBsZWFkaW5nQ2FsbCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRyYWlsaW5nQ2FsbCkge1xuICAgICAgICAgICAgcHJveHkoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxyXG4gICAgICogQ2FsbGJhY2sgaW52b2tlZCBhZnRlciB0aGUgc3BlY2lmaWVkIGRlbGF5LiBJdCB3aWxsIGZ1cnRoZXIgcG9zdHBvbmVcclxuICAgICAqIGludm9jYXRpb24gb2YgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGRlbGVnYXRpbmcgaXQgdG8gdGhlXHJcbiAgICAgKiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge3ZvaWR9XHJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0aW1lb3V0Q2FsbGJhY2soKSB7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSQxKHJlc29sdmVQZW5kaW5nKTtcbiAgICB9XG5cbiAgICAvKipcclxuICAgICAqIFNjaGVkdWxlcyBpbnZvY2F0aW9uIG9mIHRoZSBvcmlnaW5hbCBmdW5jdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7dm9pZH1cclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHByb3h5KCkge1xuICAgICAgICB2YXIgdGltZVN0YW1wID0gRGF0ZS5ub3coKTtcblxuICAgICAgICBpZiAobGVhZGluZ0NhbGwpIHtcbiAgICAgICAgICAgIC8vIFJlamVjdCBpbW1lZGlhdGVseSBmb2xsb3dpbmcgY2FsbHMuXG4gICAgICAgICAgICBpZiAodGltZVN0YW1wIC0gbGFzdENhbGxUaW1lIDwgdHJhaWxpbmdUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTY2hlZHVsZSBuZXcgY2FsbCB0byBiZSBpbiBpbnZva2VkIHdoZW4gdGhlIHBlbmRpbmcgb25lIGlzIHJlc29sdmVkLlxuICAgICAgICAgICAgLy8gVGhpcyBpcyBpbXBvcnRhbnQgZm9yIFwidHJhbnNpdGlvbnNcIiB3aGljaCBuZXZlciBhY3R1YWxseSBzdGFydFxuICAgICAgICAgICAgLy8gaW1tZWRpYXRlbHkgc28gdGhlcmUgaXMgYSBjaGFuY2UgdGhhdCB3ZSBtaWdodCBtaXNzIG9uZSBpZiBjaGFuZ2VcbiAgICAgICAgICAgIC8vIGhhcHBlbnMgYW1pZHMgdGhlIHBlbmRpbmcgaW52b2NhdGlvbi5cbiAgICAgICAgICAgIHRyYWlsaW5nQ2FsbCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZWFkaW5nQ2FsbCA9IHRydWU7XG4gICAgICAgICAgICB0cmFpbGluZ0NhbGwgPSBmYWxzZTtcblxuICAgICAgICAgICAgc2V0VGltZW91dCh0aW1lb3V0Q2FsbGJhY2ssIGRlbGF5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxhc3RDYWxsVGltZSA9IHRpbWVTdGFtcDtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJveHk7XG59O1xuXG4vLyBNaW5pbXVtIGRlbGF5IGJlZm9yZSBpbnZva2luZyB0aGUgdXBkYXRlIG9mIG9ic2VydmVycy5cbnZhciBSRUZSRVNIX0RFTEFZID0gMjA7XG5cbi8vIEEgbGlzdCBvZiBzdWJzdHJpbmdzIG9mIENTUyBwcm9wZXJ0aWVzIHVzZWQgdG8gZmluZCB0cmFuc2l0aW9uIGV2ZW50cyB0aGF0XG4vLyBtaWdodCBhZmZlY3QgZGltZW5zaW9ucyBvZiBvYnNlcnZlZCBlbGVtZW50cy5cbnZhciB0cmFuc2l0aW9uS2V5cyA9IFsndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbScsICdsZWZ0JywgJ3dpZHRoJywgJ2hlaWdodCcsICdzaXplJywgJ3dlaWdodCddO1xuXG4vLyBDaGVjayBpZiBNdXRhdGlvbk9ic2VydmVyIGlzIGF2YWlsYWJsZS5cbnZhciBtdXRhdGlvbk9ic2VydmVyU3VwcG9ydGVkID0gdHlwZW9mIE11dGF0aW9uT2JzZXJ2ZXIgIT09ICd1bmRlZmluZWQnO1xuXG4vKipcclxuICogU2luZ2xldG9uIGNvbnRyb2xsZXIgY2xhc3Mgd2hpY2ggaGFuZGxlcyB1cGRhdGVzIG9mIFJlc2l6ZU9ic2VydmVyIGluc3RhbmNlcy5cclxuICovXG52YXIgUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jb25uZWN0ZWRfID0gZmFsc2U7XG4gICAgdGhpcy5tdXRhdGlvbkV2ZW50c0FkZGVkXyA9IGZhbHNlO1xuICAgIHRoaXMubXV0YXRpb25zT2JzZXJ2ZXJfID0gbnVsbDtcbiAgICB0aGlzLm9ic2VydmVyc18gPSBbXTtcblxuICAgIHRoaXMub25UcmFuc2l0aW9uRW5kXyA9IHRoaXMub25UcmFuc2l0aW9uRW5kXy5iaW5kKHRoaXMpO1xuICAgIHRoaXMucmVmcmVzaCA9IHRocm90dGxlKHRoaXMucmVmcmVzaC5iaW5kKHRoaXMpLCBSRUZSRVNIX0RFTEFZKTtcbn07XG5cbi8qKlxyXG4gKiBBZGRzIG9ic2VydmVyIHRvIG9ic2VydmVycyBsaXN0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge1Jlc2l6ZU9ic2VydmVyU1BJfSBvYnNlcnZlciAtIE9ic2VydmVyIHRvIGJlIGFkZGVkLlxyXG4gKiBAcmV0dXJucyB7dm9pZH1cclxuICovXG5cblxuLyoqXHJcbiAqIEhvbGRzIHJlZmVyZW5jZSB0byB0aGUgY29udHJvbGxlcidzIGluc3RhbmNlLlxyXG4gKlxyXG4gKiBAcHJpdmF0ZSB7UmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyfVxyXG4gKi9cblxuXG4vKipcclxuICogS2VlcHMgcmVmZXJlbmNlIHRvIHRoZSBpbnN0YW5jZSBvZiBNdXRhdGlvbk9ic2VydmVyLlxyXG4gKlxyXG4gKiBAcHJpdmF0ZSB7TXV0YXRpb25PYnNlcnZlcn1cclxuICovXG5cbi8qKlxyXG4gKiBJbmRpY2F0ZXMgd2hldGhlciBET00gbGlzdGVuZXJzIGhhdmUgYmVlbiBhZGRlZC5cclxuICpcclxuICogQHByaXZhdGUge2Jvb2xlYW59XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLnByb3RvdHlwZS5hZGRPYnNlcnZlciA9IGZ1bmN0aW9uIChvYnNlcnZlcikge1xuICAgIGlmICghfnRoaXMub2JzZXJ2ZXJzXy5pbmRleE9mKG9ic2VydmVyKSkge1xuICAgICAgICB0aGlzLm9ic2VydmVyc18ucHVzaChvYnNlcnZlcik7XG4gICAgfVxuXG4gICAgLy8gQWRkIGxpc3RlbmVycyBpZiB0aGV5IGhhdmVuJ3QgYmVlbiBhZGRlZCB5ZXQuXG4gICAgaWYgKCF0aGlzLmNvbm5lY3RlZF8pIHtcbiAgICAgICAgdGhpcy5jb25uZWN0XygpO1xuICAgIH1cbn07XG5cbi8qKlxyXG4gKiBSZW1vdmVzIG9ic2VydmVyIGZyb20gb2JzZXJ2ZXJzIGxpc3QuXHJcbiAqXHJcbiAqIEBwYXJhbSB7UmVzaXplT2JzZXJ2ZXJTUEl9IG9ic2VydmVyIC0gT2JzZXJ2ZXIgdG8gYmUgcmVtb3ZlZC5cclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLnByb3RvdHlwZS5yZW1vdmVPYnNlcnZlciA9IGZ1bmN0aW9uIChvYnNlcnZlcikge1xuICAgIHZhciBvYnNlcnZlcnMgPSB0aGlzLm9ic2VydmVyc187XG4gICAgdmFyIGluZGV4ID0gb2JzZXJ2ZXJzLmluZGV4T2Yob2JzZXJ2ZXIpO1xuXG4gICAgLy8gUmVtb3ZlIG9ic2VydmVyIGlmIGl0J3MgcHJlc2VudCBpbiByZWdpc3RyeS5cbiAgICBpZiAofmluZGV4KSB7XG4gICAgICAgIG9ic2VydmVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZSBsaXN0ZW5lcnMgaWYgY29udHJvbGxlciBoYXMgbm8gY29ubmVjdGVkIG9ic2VydmVycy5cbiAgICBpZiAoIW9ic2VydmVycy5sZW5ndGggJiYgdGhpcy5jb25uZWN0ZWRfKSB7XG4gICAgICAgIHRoaXMuZGlzY29ubmVjdF8oKTtcbiAgICB9XG59O1xuXG4vKipcclxuICogSW52b2tlcyB0aGUgdXBkYXRlIG9mIG9ic2VydmVycy4gSXQgd2lsbCBjb250aW51ZSBydW5uaW5nIHVwZGF0ZXMgaW5zb2ZhclxyXG4gKiBpdCBkZXRlY3RzIGNoYW5nZXMuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHt2b2lkfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5wcm90b3R5cGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2hhbmdlc0RldGVjdGVkID0gdGhpcy51cGRhdGVPYnNlcnZlcnNfKCk7XG5cbiAgICAvLyBDb250aW51ZSBydW5uaW5nIHVwZGF0ZXMgaWYgY2hhbmdlcyBoYXZlIGJlZW4gZGV0ZWN0ZWQgYXMgdGhlcmUgbWlnaHRcbiAgICAvLyBiZSBmdXR1cmUgb25lcyBjYXVzZWQgYnkgQ1NTIHRyYW5zaXRpb25zLlxuICAgIGlmIChjaGFuZ2VzRGV0ZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgfVxufTtcblxuLyoqXHJcbiAqIFVwZGF0ZXMgZXZlcnkgb2JzZXJ2ZXIgZnJvbSBvYnNlcnZlcnMgbGlzdCBhbmQgbm90aWZpZXMgdGhlbSBvZiBxdWV1ZWRcclxuICogZW50cmllcy5cclxuICpcclxuICogQHByaXZhdGVcclxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgXCJ0cnVlXCIgaWYgYW55IG9ic2VydmVyIGhhcyBkZXRlY3RlZCBjaGFuZ2VzIGluXHJcbiAqICBkaW1lbnNpb25zIG9mIGl0J3MgZWxlbWVudHMuXHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVPYnNlcnZlcnNfID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIENvbGxlY3Qgb2JzZXJ2ZXJzIHRoYXQgaGF2ZSBhY3RpdmUgb2JzZXJ2YXRpb25zLlxuICAgIHZhciBhY3RpdmVPYnNlcnZlcnMgPSB0aGlzLm9ic2VydmVyc18uZmlsdGVyKGZ1bmN0aW9uIChvYnNlcnZlcikge1xuICAgICAgICByZXR1cm4gb2JzZXJ2ZXIuZ2F0aGVyQWN0aXZlKCksIG9ic2VydmVyLmhhc0FjdGl2ZSgpO1xuICAgIH0pO1xuXG4gICAgLy8gRGVsaXZlciBub3RpZmljYXRpb25zIGluIGEgc2VwYXJhdGUgY3ljbGUgaW4gb3JkZXIgdG8gYXZvaWQgYW55XG4gICAgLy8gY29sbGlzaW9ucyBiZXR3ZWVuIG9ic2VydmVycywgZS5nLiB3aGVuIG11bHRpcGxlIGluc3RhbmNlcyBvZlxuICAgIC8vIFJlc2l6ZU9ic2VydmVyIGFyZSB0cmFja2luZyB0aGUgc2FtZSBlbGVtZW50IGFuZCB0aGUgY2FsbGJhY2sgb2Ygb25lXG4gICAgLy8gb2YgdGhlbSBjaGFuZ2VzIGNvbnRlbnQgZGltZW5zaW9ucyBvZiB0aGUgb2JzZXJ2ZWQgdGFyZ2V0LiBTb21ldGltZXNcbiAgICAvLyB0aGlzIG1heSByZXN1bHQgaW4gbm90aWZpY2F0aW9ucyBiZWluZyBibG9ja2VkIGZvciB0aGUgcmVzdCBvZiBvYnNlcnZlcnMuXG4gICAgYWN0aXZlT2JzZXJ2ZXJzLmZvckVhY2goZnVuY3Rpb24gKG9ic2VydmVyKSB7IHJldHVybiBvYnNlcnZlci5icm9hZGNhc3RBY3RpdmUoKTsgfSk7XG5cbiAgICByZXR1cm4gYWN0aXZlT2JzZXJ2ZXJzLmxlbmd0aCA+IDA7XG59O1xuXG4vKipcclxuICogSW5pdGlhbGl6ZXMgRE9NIGxpc3RlbmVycy5cclxuICpcclxuICogQHByaXZhdGVcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLnByb3RvdHlwZS5jb25uZWN0XyA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBEbyBub3RoaW5nIGlmIHJ1bm5pbmcgaW4gYSBub24tYnJvd3NlciBlbnZpcm9ubWVudCBvciBpZiBsaXN0ZW5lcnNcbiAgICAvLyBoYXZlIGJlZW4gYWxyZWFkeSBhZGRlZC5cbiAgICBpZiAoIWlzQnJvd3NlciB8fCB0aGlzLmNvbm5lY3RlZF8pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmlwdGlvbiB0byB0aGUgXCJUcmFuc2l0aW9uZW5kXCIgZXZlbnQgaXMgdXNlZCBhcyBhIHdvcmthcm91bmQgZm9yXG4gICAgLy8gZGVsYXllZCB0cmFuc2l0aW9ucy4gVGhpcyB3YXkgaXQncyBwb3NzaWJsZSB0byBjYXB0dXJlIGF0IGxlYXN0IHRoZVxuICAgIC8vIGZpbmFsIHN0YXRlIG9mIGFuIGVsZW1lbnQuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIHRoaXMub25UcmFuc2l0aW9uRW5kXyk7XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5yZWZyZXNoKTtcblxuICAgIGlmIChtdXRhdGlvbk9ic2VydmVyU3VwcG9ydGVkKSB7XG4gICAgICAgIHRoaXMubXV0YXRpb25zT2JzZXJ2ZXJfID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIodGhpcy5yZWZyZXNoKTtcblxuICAgICAgICB0aGlzLm11dGF0aW9uc09ic2VydmVyXy5vYnNlcnZlKGRvY3VtZW50LCB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgICAgY2hhcmFjdGVyRGF0YTogdHJ1ZSxcbiAgICAgICAgICAgIHN1YnRyZWU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NU3VidHJlZU1vZGlmaWVkJywgdGhpcy5yZWZyZXNoKTtcblxuICAgICAgICB0aGlzLm11dGF0aW9uRXZlbnRzQWRkZWRfID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbm5lY3RlZF8gPSB0cnVlO1xufTtcblxuLyoqXHJcbiAqIFJlbW92ZXMgRE9NIGxpc3RlbmVycy5cclxuICpcclxuICogQHByaXZhdGVcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLnByb3RvdHlwZS5kaXNjb25uZWN0XyA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBEbyBub3RoaW5nIGlmIHJ1bm5pbmcgaW4gYSBub24tYnJvd3NlciBlbnZpcm9ubWVudCBvciBpZiBsaXN0ZW5lcnNcbiAgICAvLyBoYXZlIGJlZW4gYWxyZWFkeSByZW1vdmVkLlxuICAgIGlmICghaXNCcm93c2VyIHx8ICF0aGlzLmNvbm5lY3RlZF8pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCB0aGlzLm9uVHJhbnNpdGlvbkVuZF8pO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLnJlZnJlc2gpO1xuXG4gICAgaWYgKHRoaXMubXV0YXRpb25zT2JzZXJ2ZXJfKSB7XG4gICAgICAgIHRoaXMubXV0YXRpb25zT2JzZXJ2ZXJfLmRpc2Nvbm5lY3QoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5tdXRhdGlvbkV2ZW50c0FkZGVkXykge1xuICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdET01TdWJ0cmVlTW9kaWZpZWQnLCB0aGlzLnJlZnJlc2gpO1xuICAgIH1cblxuICAgIHRoaXMubXV0YXRpb25zT2JzZXJ2ZXJfID0gbnVsbDtcbiAgICB0aGlzLm11dGF0aW9uRXZlbnRzQWRkZWRfID0gZmFsc2U7XG4gICAgdGhpcy5jb25uZWN0ZWRfID0gZmFsc2U7XG59O1xuXG4vKipcclxuICogXCJUcmFuc2l0aW9uZW5kXCIgZXZlbnQgaGFuZGxlci5cclxuICpcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtIHtUcmFuc2l0aW9uRXZlbnR9IGV2ZW50XHJcbiAqIEByZXR1cm5zIHt2b2lkfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5wcm90b3R5cGUub25UcmFuc2l0aW9uRW5kXyA9IGZ1bmN0aW9uIChyZWYpIHtcbiAgICAgICAgdmFyIHByb3BlcnR5TmFtZSA9IHJlZi5wcm9wZXJ0eU5hbWU7IGlmICggcHJvcGVydHlOYW1lID09PSB2b2lkIDAgKSBwcm9wZXJ0eU5hbWUgPSAnJztcblxuICAgIC8vIERldGVjdCB3aGV0aGVyIHRyYW5zaXRpb24gbWF5IGFmZmVjdCBkaW1lbnNpb25zIG9mIGFuIGVsZW1lbnQuXG4gICAgdmFyIGlzUmVmbG93UHJvcGVydHkgPSB0cmFuc2l0aW9uS2V5cy5zb21lKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgcmV0dXJuICEhfnByb3BlcnR5TmFtZS5pbmRleE9mKGtleSk7XG4gICAgfSk7XG5cbiAgICBpZiAoaXNSZWZsb3dQcm9wZXJ0eSkge1xuICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICB9XG59O1xuXG4vKipcclxuICogUmV0dXJucyBpbnN0YW5jZSBvZiB0aGUgUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7UmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5nZXRJbnN0YW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuaW5zdGFuY2VfKSB7XG4gICAgICAgIHRoaXMuaW5zdGFuY2VfID0gbmV3IFJlc2l6ZU9ic2VydmVyQ29udHJvbGxlcigpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmluc3RhbmNlXztcbn07XG5cblJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5pbnN0YW5jZV8gPSBudWxsO1xuXG4vKipcclxuICogRGVmaW5lcyBub24td3JpdGFibGUvZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIHRoZSBwcm92aWRlZCB0YXJnZXQgb2JqZWN0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0IC0gT2JqZWN0IGZvciB3aGljaCB0byBkZWZpbmUgcHJvcGVydGllcy5cclxuICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gUHJvcGVydGllcyB0byBiZSBkZWZpbmVkLlxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBUYXJnZXQgb2JqZWN0LlxyXG4gKi9cbnZhciBkZWZpbmVDb25maWd1cmFibGUgPSAoZnVuY3Rpb24gKHRhcmdldCwgcHJvcHMpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGlzdCA9IE9iamVjdC5rZXlzKHByb3BzKTsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIGtleSA9IGxpc3RbaV07XG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCB7XG4gICAgICAgICAgICB2YWx1ZTogcHJvcHNba2V5XSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB0YXJnZXQ7XG59KTtcblxuLyoqXHJcbiAqIFJldHVybnMgdGhlIGdsb2JhbCBvYmplY3QgYXNzb2NpYXRlZCB3aXRoIHByb3ZpZGVkIGVsZW1lbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXRcclxuICogQHJldHVybnMge09iamVjdH1cclxuICovXG52YXIgZ2V0V2luZG93T2YgPSAoZnVuY3Rpb24gKHRhcmdldCkge1xuICAgIC8vIEFzc3VtZSB0aGF0IHRoZSBlbGVtZW50IGlzIGFuIGluc3RhbmNlIG9mIE5vZGUsIHdoaWNoIG1lYW5zIHRoYXQgaXRcbiAgICAvLyBoYXMgdGhlIFwib3duZXJEb2N1bWVudFwiIHByb3BlcnR5IGZyb20gd2hpY2ggd2UgY2FuIHJldHJpZXZlIGFcbiAgICAvLyBjb3JyZXNwb25kaW5nIGdsb2JhbCBvYmplY3QuXG4gICAgdmFyIG93bmVyR2xvYmFsID0gdGFyZ2V0ICYmIHRhcmdldC5vd25lckRvY3VtZW50ICYmIHRhcmdldC5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3O1xuXG4gICAgLy8gUmV0dXJuIHRoZSBsb2NhbCBnbG9iYWwgb2JqZWN0IGlmIGl0J3Mgbm90IHBvc3NpYmxlIGV4dHJhY3Qgb25lIGZyb21cbiAgICAvLyBwcm92aWRlZCBlbGVtZW50LlxuICAgIHJldHVybiBvd25lckdsb2JhbCB8fCBnbG9iYWwkMTtcbn0pO1xuXG4vLyBQbGFjZWhvbGRlciBvZiBhbiBlbXB0eSBjb250ZW50IHJlY3RhbmdsZS5cbnZhciBlbXB0eVJlY3QgPSBjcmVhdGVSZWN0SW5pdCgwLCAwLCAwLCAwKTtcblxuLyoqXHJcbiAqIENvbnZlcnRzIHByb3ZpZGVkIHN0cmluZyB0byBhIG51bWJlci5cclxuICpcclxuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSB2YWx1ZVxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gKi9cbmZ1bmN0aW9uIHRvRmxvYXQodmFsdWUpIHtcbiAgICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZSkgfHwgMDtcbn1cblxuLyoqXHJcbiAqIEV4dHJhY3RzIGJvcmRlcnMgc2l6ZSBmcm9tIHByb3ZpZGVkIHN0eWxlcy5cclxuICpcclxuICogQHBhcmFtIHtDU1NTdHlsZURlY2xhcmF0aW9ufSBzdHlsZXNcclxuICogQHBhcmFtIHsuLi5zdHJpbmd9IHBvc2l0aW9ucyAtIEJvcmRlcnMgcG9zaXRpb25zICh0b3AsIHJpZ2h0LCAuLi4pXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAqL1xuZnVuY3Rpb24gZ2V0Qm9yZGVyc1NpemUoc3R5bGVzKSB7XG4gICAgdmFyIHBvc2l0aW9ucyA9IFtdLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoIC0gMTtcbiAgICB3aGlsZSAoIGxlbi0tID4gMCApIHBvc2l0aW9uc1sgbGVuIF0gPSBhcmd1bWVudHNbIGxlbiArIDEgXTtcblxuICAgIHJldHVybiBwb3NpdGlvbnMucmVkdWNlKGZ1bmN0aW9uIChzaXplLCBwb3NpdGlvbikge1xuICAgICAgICB2YXIgdmFsdWUgPSBzdHlsZXNbJ2JvcmRlci0nICsgcG9zaXRpb24gKyAnLXdpZHRoJ107XG5cbiAgICAgICAgcmV0dXJuIHNpemUgKyB0b0Zsb2F0KHZhbHVlKTtcbiAgICB9LCAwKTtcbn1cblxuLyoqXHJcbiAqIEV4dHJhY3RzIHBhZGRpbmdzIHNpemVzIGZyb20gcHJvdmlkZWQgc3R5bGVzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0NTU1N0eWxlRGVjbGFyYXRpb259IHN0eWxlc1xyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBQYWRkaW5ncyBib3guXHJcbiAqL1xuZnVuY3Rpb24gZ2V0UGFkZGluZ3Moc3R5bGVzKSB7XG4gICAgdmFyIHBvc2l0aW9ucyA9IFsndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbScsICdsZWZ0J107XG4gICAgdmFyIHBhZGRpbmdzID0ge307XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbGlzdCA9IHBvc2l0aW9uczsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIHBvc2l0aW9uID0gbGlzdFtpXTtcblxuICAgICAgICB2YXIgdmFsdWUgPSBzdHlsZXNbJ3BhZGRpbmctJyArIHBvc2l0aW9uXTtcblxuICAgICAgICBwYWRkaW5nc1twb3NpdGlvbl0gPSB0b0Zsb2F0KHZhbHVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFkZGluZ3M7XG59XG5cbi8qKlxyXG4gKiBDYWxjdWxhdGVzIGNvbnRlbnQgcmVjdGFuZ2xlIG9mIHByb3ZpZGVkIFNWRyBlbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge1NWR0dyYXBoaWNzRWxlbWVudH0gdGFyZ2V0IC0gRWxlbWVudCBjb250ZW50IHJlY3RhbmdsZSBvZiB3aGljaCBuZWVkc1xyXG4gKiAgICAgIHRvIGJlIGNhbGN1bGF0ZWQuXHJcbiAqIEByZXR1cm5zIHtET01SZWN0SW5pdH1cclxuICovXG5mdW5jdGlvbiBnZXRTVkdDb250ZW50UmVjdCh0YXJnZXQpIHtcbiAgICB2YXIgYmJveCA9IHRhcmdldC5nZXRCQm94KCk7XG5cbiAgICByZXR1cm4gY3JlYXRlUmVjdEluaXQoMCwgMCwgYmJveC53aWR0aCwgYmJveC5oZWlnaHQpO1xufVxuXG4vKipcclxuICogQ2FsY3VsYXRlcyBjb250ZW50IHJlY3RhbmdsZSBvZiBwcm92aWRlZCBIVE1MRWxlbWVudC5cclxuICpcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IC0gRWxlbWVudCBmb3Igd2hpY2ggdG8gY2FsY3VsYXRlIHRoZSBjb250ZW50IHJlY3RhbmdsZS5cclxuICogQHJldHVybnMge0RPTVJlY3RJbml0fVxyXG4gKi9cbmZ1bmN0aW9uIGdldEhUTUxFbGVtZW50Q29udGVudFJlY3QodGFyZ2V0KSB7XG4gICAgLy8gQ2xpZW50IHdpZHRoICYgaGVpZ2h0IHByb3BlcnRpZXMgY2FuJ3QgYmVcbiAgICAvLyB1c2VkIGV4Y2x1c2l2ZWx5IGFzIHRoZXkgcHJvdmlkZSByb3VuZGVkIHZhbHVlcy5cbiAgICB2YXIgY2xpZW50V2lkdGggPSB0YXJnZXQuY2xpZW50V2lkdGg7XG4gICAgdmFyIGNsaWVudEhlaWdodCA9IHRhcmdldC5jbGllbnRIZWlnaHQ7XG5cbiAgICAvLyBCeSB0aGlzIGNvbmRpdGlvbiB3ZSBjYW4gY2F0Y2ggYWxsIG5vbi1yZXBsYWNlZCBpbmxpbmUsIGhpZGRlbiBhbmRcbiAgICAvLyBkZXRhY2hlZCBlbGVtZW50cy4gVGhvdWdoIGVsZW1lbnRzIHdpdGggd2lkdGggJiBoZWlnaHQgcHJvcGVydGllcyBsZXNzXG4gICAgLy8gdGhhbiAwLjUgd2lsbCBiZSBkaXNjYXJkZWQgYXMgd2VsbC5cbiAgICAvL1xuICAgIC8vIFdpdGhvdXQgaXQgd2Ugd291bGQgbmVlZCB0byBpbXBsZW1lbnQgc2VwYXJhdGUgbWV0aG9kcyBmb3IgZWFjaCBvZlxuICAgIC8vIHRob3NlIGNhc2VzIGFuZCBpdCdzIG5vdCBwb3NzaWJsZSB0byBwZXJmb3JtIGEgcHJlY2lzZSBhbmQgcGVyZm9ybWFuY2VcbiAgICAvLyBlZmZlY3RpdmUgdGVzdCBmb3IgaGlkZGVuIGVsZW1lbnRzLiBFLmcuIGV2ZW4galF1ZXJ5J3MgJzp2aXNpYmxlJyBmaWx0ZXJcbiAgICAvLyBnaXZlcyB3cm9uZyByZXN1bHRzIGZvciBlbGVtZW50cyB3aXRoIHdpZHRoICYgaGVpZ2h0IGxlc3MgdGhhbiAwLjUuXG4gICAgaWYgKCFjbGllbnRXaWR0aCAmJiAhY2xpZW50SGVpZ2h0KSB7XG4gICAgICAgIHJldHVybiBlbXB0eVJlY3Q7XG4gICAgfVxuXG4gICAgdmFyIHN0eWxlcyA9IGdldFdpbmRvd09mKHRhcmdldCkuZ2V0Q29tcHV0ZWRTdHlsZSh0YXJnZXQpO1xuICAgIHZhciBwYWRkaW5ncyA9IGdldFBhZGRpbmdzKHN0eWxlcyk7XG4gICAgdmFyIGhvcml6UGFkID0gcGFkZGluZ3MubGVmdCArIHBhZGRpbmdzLnJpZ2h0O1xuICAgIHZhciB2ZXJ0UGFkID0gcGFkZGluZ3MudG9wICsgcGFkZGluZ3MuYm90dG9tO1xuXG4gICAgLy8gQ29tcHV0ZWQgc3R5bGVzIG9mIHdpZHRoICYgaGVpZ2h0IGFyZSBiZWluZyB1c2VkIGJlY2F1c2UgdGhleSBhcmUgdGhlXG4gICAgLy8gb25seSBkaW1lbnNpb25zIGF2YWlsYWJsZSB0byBKUyB0aGF0IGNvbnRhaW4gbm9uLXJvdW5kZWQgdmFsdWVzLiBJdCBjb3VsZFxuICAgIC8vIGJlIHBvc3NpYmxlIHRvIHV0aWxpemUgdGhlIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBpZiBvbmx5IGl0J3MgZGF0YSB3YXNuJ3RcbiAgICAvLyBhZmZlY3RlZCBieSBDU1MgdHJhbnNmb3JtYXRpb25zIGxldCBhbG9uZSBwYWRkaW5ncywgYm9yZGVycyBhbmQgc2Nyb2xsIGJhcnMuXG4gICAgdmFyIHdpZHRoID0gdG9GbG9hdChzdHlsZXMud2lkdGgpLFxuICAgICAgICBoZWlnaHQgPSB0b0Zsb2F0KHN0eWxlcy5oZWlnaHQpO1xuXG4gICAgLy8gV2lkdGggJiBoZWlnaHQgaW5jbHVkZSBwYWRkaW5ncyBhbmQgYm9yZGVycyB3aGVuIHRoZSAnYm9yZGVyLWJveCcgYm94XG4gICAgLy8gbW9kZWwgaXMgYXBwbGllZCAoZXhjZXB0IGZvciBJRSkuXG4gICAgaWYgKHN0eWxlcy5ib3hTaXppbmcgPT09ICdib3JkZXItYm94Jykge1xuICAgICAgICAvLyBGb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgcmVxdWlyZWQgdG8gaGFuZGxlIEludGVybmV0IEV4cGxvcmVyIHdoaWNoXG4gICAgICAgIC8vIGRvZXNuJ3QgaW5jbHVkZSBwYWRkaW5ncyBhbmQgYm9yZGVycyB0byBjb21wdXRlZCBDU1MgZGltZW5zaW9ucy5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gV2UgY2FuIHNheSB0aGF0IGlmIENTUyBkaW1lbnNpb25zICsgcGFkZGluZ3MgYXJlIGVxdWFsIHRvIHRoZSBcImNsaWVudFwiXG4gICAgICAgIC8vIHByb3BlcnRpZXMgdGhlbiBpdCdzIGVpdGhlciBJRSwgYW5kIHRodXMgd2UgZG9uJ3QgbmVlZCB0byBzdWJ0cmFjdFxuICAgICAgICAvLyBhbnl0aGluZywgb3IgYW4gZWxlbWVudCBtZXJlbHkgZG9lc24ndCBoYXZlIHBhZGRpbmdzL2JvcmRlcnMgc3R5bGVzLlxuICAgICAgICBpZiAoTWF0aC5yb3VuZCh3aWR0aCArIGhvcml6UGFkKSAhPT0gY2xpZW50V2lkdGgpIHtcbiAgICAgICAgICAgIHdpZHRoIC09IGdldEJvcmRlcnNTaXplKHN0eWxlcywgJ2xlZnQnLCAncmlnaHQnKSArIGhvcml6UGFkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKE1hdGgucm91bmQoaGVpZ2h0ICsgdmVydFBhZCkgIT09IGNsaWVudEhlaWdodCkge1xuICAgICAgICAgICAgaGVpZ2h0IC09IGdldEJvcmRlcnNTaXplKHN0eWxlcywgJ3RvcCcsICdib3R0b20nKSArIHZlcnRQYWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGb2xsb3dpbmcgc3RlcHMgY2FuJ3QgYmUgYXBwbGllZCB0byB0aGUgZG9jdW1lbnQncyByb290IGVsZW1lbnQgYXMgaXRzXG4gICAgLy8gY2xpZW50W1dpZHRoL0hlaWdodF0gcHJvcGVydGllcyByZXByZXNlbnQgdmlld3BvcnQgYXJlYSBvZiB0aGUgd2luZG93LlxuICAgIC8vIEJlc2lkZXMsIGl0J3MgYXMgd2VsbCBub3QgbmVjZXNzYXJ5IGFzIHRoZSA8aHRtbD4gaXRzZWxmIG5laXRoZXIgaGFzXG4gICAgLy8gcmVuZGVyZWQgc2Nyb2xsIGJhcnMgbm9yIGl0IGNhbiBiZSBjbGlwcGVkLlxuICAgIGlmICghaXNEb2N1bWVudEVsZW1lbnQodGFyZ2V0KSkge1xuICAgICAgICAvLyBJbiBzb21lIGJyb3dzZXJzIChvbmx5IGluIEZpcmVmb3gsIGFjdHVhbGx5KSBDU1Mgd2lkdGggJiBoZWlnaHRcbiAgICAgICAgLy8gaW5jbHVkZSBzY3JvbGwgYmFycyBzaXplIHdoaWNoIGNhbiBiZSByZW1vdmVkIGF0IHRoaXMgc3RlcCBhcyBzY3JvbGxcbiAgICAgICAgLy8gYmFycyBhcmUgdGhlIG9ubHkgZGlmZmVyZW5jZSBiZXR3ZWVuIHJvdW5kZWQgZGltZW5zaW9ucyArIHBhZGRpbmdzXG4gICAgICAgIC8vIGFuZCBcImNsaWVudFwiIHByb3BlcnRpZXMsIHRob3VnaCB0aGF0IGlzIG5vdCBhbHdheXMgdHJ1ZSBpbiBDaHJvbWUuXG4gICAgICAgIHZhciB2ZXJ0U2Nyb2xsYmFyID0gTWF0aC5yb3VuZCh3aWR0aCArIGhvcml6UGFkKSAtIGNsaWVudFdpZHRoO1xuICAgICAgICB2YXIgaG9yaXpTY3JvbGxiYXIgPSBNYXRoLnJvdW5kKGhlaWdodCArIHZlcnRQYWQpIC0gY2xpZW50SGVpZ2h0O1xuXG4gICAgICAgIC8vIENocm9tZSBoYXMgYSByYXRoZXIgd2VpcmQgcm91bmRpbmcgb2YgXCJjbGllbnRcIiBwcm9wZXJ0aWVzLlxuICAgICAgICAvLyBFLmcuIGZvciBhbiBlbGVtZW50IHdpdGggY29udGVudCB3aWR0aCBvZiAzMTQuMnB4IGl0IHNvbWV0aW1lcyBnaXZlc1xuICAgICAgICAvLyB0aGUgY2xpZW50IHdpZHRoIG9mIDMxNXB4IGFuZCBmb3IgdGhlIHdpZHRoIG9mIDMxNC43cHggaXQgbWF5IGdpdmVcbiAgICAgICAgLy8gMzE0cHguIEFuZCBpdCBkb2Vzbid0IGhhcHBlbiBhbGwgdGhlIHRpbWUuIFNvIGp1c3QgaWdub3JlIHRoaXMgZGVsdGFcbiAgICAgICAgLy8gYXMgYSBub24tcmVsZXZhbnQuXG4gICAgICAgIGlmIChNYXRoLmFicyh2ZXJ0U2Nyb2xsYmFyKSAhPT0gMSkge1xuICAgICAgICAgICAgd2lkdGggLT0gdmVydFNjcm9sbGJhcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChNYXRoLmFicyhob3JpelNjcm9sbGJhcikgIT09IDEpIHtcbiAgICAgICAgICAgIGhlaWdodCAtPSBob3JpelNjcm9sbGJhcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjcmVhdGVSZWN0SW5pdChwYWRkaW5ncy5sZWZ0LCBwYWRkaW5ncy50b3AsIHdpZHRoLCBoZWlnaHQpO1xufVxuXG4vKipcclxuICogQ2hlY2tzIHdoZXRoZXIgcHJvdmlkZWQgZWxlbWVudCBpcyBhbiBpbnN0YW5jZSBvZiB0aGUgU1ZHR3JhcGhpY3NFbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCAtIEVsZW1lbnQgdG8gYmUgY2hlY2tlZC5cclxuICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAqL1xudmFyIGlzU1ZHR3JhcGhpY3NFbGVtZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICAvLyBTb21lIGJyb3dzZXJzLCBuYW1lbHkgSUUgYW5kIEVkZ2UsIGRvbid0IGhhdmUgdGhlIFNWR0dyYXBoaWNzRWxlbWVudFxuICAgIC8vIGludGVyZmFjZS5cbiAgICBpZiAodHlwZW9mIFNWR0dyYXBoaWNzRWxlbWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQpIHsgcmV0dXJuIHRhcmdldCBpbnN0YW5jZW9mIGdldFdpbmRvd09mKHRhcmdldCkuU1ZHR3JhcGhpY3NFbGVtZW50OyB9O1xuICAgIH1cblxuICAgIC8vIElmIGl0J3Mgc28sIHRoZW4gY2hlY2sgdGhhdCBlbGVtZW50IGlzIGF0IGxlYXN0IGFuIGluc3RhbmNlIG9mIHRoZVxuICAgIC8vIFNWR0VsZW1lbnQgYW5kIHRoYXQgaXQgaGFzIHRoZSBcImdldEJCb3hcIiBtZXRob2QuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWV4dHJhLXBhcmVuc1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0KSB7IHJldHVybiB0YXJnZXQgaW5zdGFuY2VvZiBnZXRXaW5kb3dPZih0YXJnZXQpLlNWR0VsZW1lbnQgJiYgdHlwZW9mIHRhcmdldC5nZXRCQm94ID09PSAnZnVuY3Rpb24nOyB9O1xufSkoKTtcblxuLyoqXHJcbiAqIENoZWNrcyB3aGV0aGVyIHByb3ZpZGVkIGVsZW1lbnQgaXMgYSBkb2N1bWVudCBlbGVtZW50ICg8aHRtbD4pLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCAtIEVsZW1lbnQgdG8gYmUgY2hlY2tlZC5cclxuICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAqL1xuZnVuY3Rpb24gaXNEb2N1bWVudEVsZW1lbnQodGFyZ2V0KSB7XG4gICAgcmV0dXJuIHRhcmdldCA9PT0gZ2V0V2luZG93T2YodGFyZ2V0KS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG59XG5cbi8qKlxyXG4gKiBDYWxjdWxhdGVzIGFuIGFwcHJvcHJpYXRlIGNvbnRlbnQgcmVjdGFuZ2xlIGZvciBwcm92aWRlZCBodG1sIG9yIHN2ZyBlbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCAtIEVsZW1lbnQgY29udGVudCByZWN0YW5nbGUgb2Ygd2hpY2ggbmVlZHMgdG8gYmUgY2FsY3VsYXRlZC5cclxuICogQHJldHVybnMge0RPTVJlY3RJbml0fVxyXG4gKi9cbmZ1bmN0aW9uIGdldENvbnRlbnRSZWN0KHRhcmdldCkge1xuICAgIGlmICghaXNCcm93c2VyKSB7XG4gICAgICAgIHJldHVybiBlbXB0eVJlY3Q7XG4gICAgfVxuXG4gICAgaWYgKGlzU1ZHR3JhcGhpY3NFbGVtZW50KHRhcmdldCkpIHtcbiAgICAgICAgcmV0dXJuIGdldFNWR0NvbnRlbnRSZWN0KHRhcmdldCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGdldEhUTUxFbGVtZW50Q29udGVudFJlY3QodGFyZ2V0KTtcbn1cblxuLyoqXHJcbiAqIENyZWF0ZXMgcmVjdGFuZ2xlIHdpdGggYW4gaW50ZXJmYWNlIG9mIHRoZSBET01SZWN0UmVhZE9ubHkuXHJcbiAqIFNwZWM6IGh0dHBzOi8vZHJhZnRzLmZ4dGYub3JnL2dlb21ldHJ5LyNkb21yZWN0cmVhZG9ubHlcclxuICpcclxuICogQHBhcmFtIHtET01SZWN0SW5pdH0gcmVjdEluaXQgLSBPYmplY3Qgd2l0aCByZWN0YW5nbGUncyB4L3kgY29vcmRpbmF0ZXMgYW5kIGRpbWVuc2lvbnMuXHJcbiAqIEByZXR1cm5zIHtET01SZWN0UmVhZE9ubHl9XHJcbiAqL1xuZnVuY3Rpb24gY3JlYXRlUmVhZE9ubHlSZWN0KHJlZikge1xuICAgIHZhciB4ID0gcmVmLng7XG4gICAgdmFyIHkgPSByZWYueTtcbiAgICB2YXIgd2lkdGggPSByZWYud2lkdGg7XG4gICAgdmFyIGhlaWdodCA9IHJlZi5oZWlnaHQ7XG5cbiAgICAvLyBJZiBET01SZWN0UmVhZE9ubHkgaXMgYXZhaWxhYmxlIHVzZSBpdCBhcyBhIHByb3RvdHlwZSBmb3IgdGhlIHJlY3RhbmdsZS5cbiAgICB2YXIgQ29uc3RyID0gdHlwZW9mIERPTVJlY3RSZWFkT25seSAhPT0gJ3VuZGVmaW5lZCcgPyBET01SZWN0UmVhZE9ubHkgOiBPYmplY3Q7XG4gICAgdmFyIHJlY3QgPSBPYmplY3QuY3JlYXRlKENvbnN0ci5wcm90b3R5cGUpO1xuXG4gICAgLy8gUmVjdGFuZ2xlJ3MgcHJvcGVydGllcyBhcmUgbm90IHdyaXRhYmxlIGFuZCBub24tZW51bWVyYWJsZS5cbiAgICBkZWZpbmVDb25maWd1cmFibGUocmVjdCwge1xuICAgICAgICB4OiB4LCB5OiB5LCB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICB0b3A6IHksXG4gICAgICAgIHJpZ2h0OiB4ICsgd2lkdGgsXG4gICAgICAgIGJvdHRvbTogaGVpZ2h0ICsgeSxcbiAgICAgICAgbGVmdDogeFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlY3Q7XG59XG5cbi8qKlxyXG4gKiBDcmVhdGVzIERPTVJlY3RJbml0IG9iamVjdCBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgZGltZW5zaW9ucyBhbmQgdGhlIHgveSBjb29yZGluYXRlcy5cclxuICogU3BlYzogaHR0cHM6Ly9kcmFmdHMuZnh0Zi5vcmcvZ2VvbWV0cnkvI2RpY3RkZWYtZG9tcmVjdGluaXRcclxuICpcclxuICogQHBhcmFtIHtudW1iZXJ9IHggLSBYIGNvb3JkaW5hdGUuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gWSBjb29yZGluYXRlLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gd2lkdGggLSBSZWN0YW5nbGUncyB3aWR0aC5cclxuICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIFJlY3RhbmdsZSdzIGhlaWdodC5cclxuICogQHJldHVybnMge0RPTVJlY3RJbml0fVxyXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVJlY3RJbml0KHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcbiAgICByZXR1cm4geyB4OiB4LCB5OiB5LCB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0IH07XG59XG5cbi8qKlxyXG4gKiBDbGFzcyB0aGF0IGlzIHJlc3BvbnNpYmxlIGZvciBjb21wdXRhdGlvbnMgb2YgdGhlIGNvbnRlbnQgcmVjdGFuZ2xlIG9mXHJcbiAqIHByb3ZpZGVkIERPTSBlbGVtZW50IGFuZCBmb3Iga2VlcGluZyB0cmFjayBvZiBpdCdzIGNoYW5nZXMuXHJcbiAqL1xudmFyIFJlc2l6ZU9ic2VydmF0aW9uID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgdGhpcy5icm9hZGNhc3RXaWR0aCA9IDA7XG4gICAgdGhpcy5icm9hZGNhc3RIZWlnaHQgPSAwO1xuICAgIHRoaXMuY29udGVudFJlY3RfID0gY3JlYXRlUmVjdEluaXQoMCwgMCwgMCwgMCk7XG5cbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbn07XG5cbi8qKlxyXG4gKiBVcGRhdGVzIGNvbnRlbnQgcmVjdGFuZ2xlIGFuZCB0ZWxscyB3aGV0aGVyIGl0J3Mgd2lkdGggb3IgaGVpZ2h0IHByb3BlcnRpZXNcclxuICogaGF2ZSBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IGJyb2FkY2FzdC5cclxuICpcclxuICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAqL1xuXG5cbi8qKlxyXG4gKiBSZWZlcmVuY2UgdG8gdGhlIGxhc3Qgb2JzZXJ2ZWQgY29udGVudCByZWN0YW5nbGUuXHJcbiAqXHJcbiAqIEBwcml2YXRlIHtET01SZWN0SW5pdH1cclxuICovXG5cblxuLyoqXHJcbiAqIEJyb2FkY2FzdGVkIHdpZHRoIG9mIGNvbnRlbnQgcmVjdGFuZ2xlLlxyXG4gKlxyXG4gKiBAdHlwZSB7bnVtYmVyfVxyXG4gKi9cblJlc2l6ZU9ic2VydmF0aW9uLnByb3RvdHlwZS5pc0FjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVjdCA9IGdldENvbnRlbnRSZWN0KHRoaXMudGFyZ2V0KTtcblxuICAgIHRoaXMuY29udGVudFJlY3RfID0gcmVjdDtcblxuICAgIHJldHVybiByZWN0LndpZHRoICE9PSB0aGlzLmJyb2FkY2FzdFdpZHRoIHx8IHJlY3QuaGVpZ2h0ICE9PSB0aGlzLmJyb2FkY2FzdEhlaWdodDtcbn07XG5cbi8qKlxyXG4gKiBVcGRhdGVzICdicm9hZGNhc3RXaWR0aCcgYW5kICdicm9hZGNhc3RIZWlnaHQnIHByb3BlcnRpZXMgd2l0aCBhIGRhdGFcclxuICogZnJvbSB0aGUgY29ycmVzcG9uZGluZyBwcm9wZXJ0aWVzIG9mIHRoZSBsYXN0IG9ic2VydmVkIGNvbnRlbnQgcmVjdGFuZ2xlLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7RE9NUmVjdEluaXR9IExhc3Qgb2JzZXJ2ZWQgY29udGVudCByZWN0YW5nbGUuXHJcbiAqL1xuUmVzaXplT2JzZXJ2YXRpb24ucHJvdG90eXBlLmJyb2FkY2FzdFJlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlY3QgPSB0aGlzLmNvbnRlbnRSZWN0XztcblxuICAgIHRoaXMuYnJvYWRjYXN0V2lkdGggPSByZWN0LndpZHRoO1xuICAgIHRoaXMuYnJvYWRjYXN0SGVpZ2h0ID0gcmVjdC5oZWlnaHQ7XG5cbiAgICByZXR1cm4gcmVjdDtcbn07XG5cbnZhciBSZXNpemVPYnNlcnZlckVudHJ5ID0gZnVuY3Rpb24odGFyZ2V0LCByZWN0SW5pdCkge1xuICAgIHZhciBjb250ZW50UmVjdCA9IGNyZWF0ZVJlYWRPbmx5UmVjdChyZWN0SW5pdCk7XG5cbiAgICAvLyBBY2NvcmRpbmcgdG8gdGhlIHNwZWNpZmljYXRpb24gZm9sbG93aW5nIHByb3BlcnRpZXMgYXJlIG5vdCB3cml0YWJsZVxuICAgIC8vIGFuZCBhcmUgYWxzbyBub3QgZW51bWVyYWJsZSBpbiB0aGUgbmF0aXZlIGltcGxlbWVudGF0aW9uLlxuICAgIC8vXG4gICAgLy8gUHJvcGVydHkgYWNjZXNzb3JzIGFyZSBub3QgYmVpbmcgdXNlZCBhcyB0aGV5J2QgcmVxdWlyZSB0byBkZWZpbmUgYVxuICAgIC8vIHByaXZhdGUgV2Vha01hcCBzdG9yYWdlIHdoaWNoIG1heSBjYXVzZSBtZW1vcnkgbGVha3MgaW4gYnJvd3NlcnMgdGhhdFxuICAgIC8vIGRvbid0IHN1cHBvcnQgdGhpcyB0eXBlIG9mIGNvbGxlY3Rpb25zLlxuICAgIGRlZmluZUNvbmZpZ3VyYWJsZSh0aGlzLCB7IHRhcmdldDogdGFyZ2V0LCBjb250ZW50UmVjdDogY29udGVudFJlY3QgfSk7XG59O1xuXG52YXIgUmVzaXplT2JzZXJ2ZXJTUEkgPSBmdW5jdGlvbihjYWxsYmFjaywgY29udHJvbGxlciwgY2FsbGJhY2tDdHgpIHtcbiAgICB0aGlzLmFjdGl2ZU9ic2VydmF0aW9uc18gPSBbXTtcbiAgICB0aGlzLm9ic2VydmF0aW9uc18gPSBuZXcgTWFwU2hpbSgpO1xuXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgY2FsbGJhY2sgcHJvdmlkZWQgYXMgcGFyYW1ldGVyIDEgaXMgbm90IGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuXG4gICAgdGhpcy5jYWxsYmFja18gPSBjYWxsYmFjaztcbiAgICB0aGlzLmNvbnRyb2xsZXJfID0gY29udHJvbGxlcjtcbiAgICB0aGlzLmNhbGxiYWNrQ3R4XyA9IGNhbGxiYWNrQ3R4O1xufTtcblxuLyoqXHJcbiAqIFN0YXJ0cyBvYnNlcnZpbmcgcHJvdmlkZWQgZWxlbWVudC5cclxuICpcclxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXQgLSBFbGVtZW50IHRvIGJlIG9ic2VydmVkLlxyXG4gKiBAcmV0dXJucyB7dm9pZH1cclxuICovXG5cblxuLyoqXHJcbiAqIFJlZ2lzdHJ5IG9mIHRoZSBSZXNpemVPYnNlcnZhdGlvbiBpbnN0YW5jZXMuXHJcbiAqXHJcbiAqIEBwcml2YXRlIHtNYXA8RWxlbWVudCwgUmVzaXplT2JzZXJ2YXRpb24+fVxyXG4gKi9cblxuXG4vKipcclxuICogUHVibGljIFJlc2l6ZU9ic2VydmVyIGluc3RhbmNlIHdoaWNoIHdpbGwgYmUgcGFzc2VkIHRvIHRoZSBjYWxsYmFja1xyXG4gKiBmdW5jdGlvbiBhbmQgdXNlZCBhcyBhIHZhbHVlIG9mIGl0J3MgXCJ0aGlzXCIgYmluZGluZy5cclxuICpcclxuICogQHByaXZhdGUge1Jlc2l6ZU9ic2VydmVyfVxyXG4gKi9cblxuLyoqXHJcbiAqIENvbGxlY3Rpb24gb2YgcmVzaXplIG9ic2VydmF0aW9ucyB0aGF0IGhhdmUgZGV0ZWN0ZWQgY2hhbmdlcyBpbiBkaW1lbnNpb25zXHJcbiAqIG9mIGVsZW1lbnRzLlxyXG4gKlxyXG4gKiBAcHJpdmF0ZSB7QXJyYXk8UmVzaXplT2JzZXJ2YXRpb24+fVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyU1BJLnByb3RvdHlwZS5vYnNlcnZlID0gZnVuY3Rpb24gKHRhcmdldCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCcxIGFyZ3VtZW50IHJlcXVpcmVkLCBidXQgb25seSAwIHByZXNlbnQuJyk7XG4gICAgfVxuXG4gICAgLy8gRG8gbm90aGluZyBpZiBjdXJyZW50IGVudmlyb25tZW50IGRvZXNuJ3QgaGF2ZSB0aGUgRWxlbWVudCBpbnRlcmZhY2UuXG4gICAgaWYgKHR5cGVvZiBFbGVtZW50ID09PSAndW5kZWZpbmVkJyB8fCAhKEVsZW1lbnQgaW5zdGFuY2VvZiBPYmplY3QpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoISh0YXJnZXQgaW5zdGFuY2VvZiBnZXRXaW5kb3dPZih0YXJnZXQpLkVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3BhcmFtZXRlciAxIGlzIG5vdCBvZiB0eXBlIFwiRWxlbWVudFwiLicpO1xuICAgIH1cblxuICAgIHZhciBvYnNlcnZhdGlvbnMgPSB0aGlzLm9ic2VydmF0aW9uc187XG5cbiAgICAvLyBEbyBub3RoaW5nIGlmIGVsZW1lbnQgaXMgYWxyZWFkeSBiZWluZyBvYnNlcnZlZC5cbiAgICBpZiAob2JzZXJ2YXRpb25zLmhhcyh0YXJnZXQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBvYnNlcnZhdGlvbnMuc2V0KHRhcmdldCwgbmV3IFJlc2l6ZU9ic2VydmF0aW9uKHRhcmdldCkpO1xuXG4gICAgdGhpcy5jb250cm9sbGVyXy5hZGRPYnNlcnZlcih0aGlzKTtcblxuICAgIC8vIEZvcmNlIHRoZSB1cGRhdGUgb2Ygb2JzZXJ2YXRpb25zLlxuICAgIHRoaXMuY29udHJvbGxlcl8ucmVmcmVzaCgpO1xufTtcblxuLyoqXHJcbiAqIFN0b3BzIG9ic2VydmluZyBwcm92aWRlZCBlbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCAtIEVsZW1lbnQgdG8gc3RvcCBvYnNlcnZpbmcuXHJcbiAqIEByZXR1cm5zIHt2b2lkfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyU1BJLnByb3RvdHlwZS51bm9ic2VydmUgPSBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJzEgYXJndW1lbnQgcmVxdWlyZWQsIGJ1dCBvbmx5IDAgcHJlc2VudC4nKTtcbiAgICB9XG5cbiAgICAvLyBEbyBub3RoaW5nIGlmIGN1cnJlbnQgZW52aXJvbm1lbnQgZG9lc24ndCBoYXZlIHRoZSBFbGVtZW50IGludGVyZmFjZS5cbiAgICBpZiAodHlwZW9mIEVsZW1lbnQgPT09ICd1bmRlZmluZWQnIHx8ICEoRWxlbWVudCBpbnN0YW5jZW9mIE9iamVjdCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghKHRhcmdldCBpbnN0YW5jZW9mIGdldFdpbmRvd09mKHRhcmdldCkuRWxlbWVudCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigncGFyYW1ldGVyIDEgaXMgbm90IG9mIHR5cGUgXCJFbGVtZW50XCIuJyk7XG4gICAgfVxuXG4gICAgdmFyIG9ic2VydmF0aW9ucyA9IHRoaXMub2JzZXJ2YXRpb25zXztcblxuICAgIC8vIERvIG5vdGhpbmcgaWYgZWxlbWVudCBpcyBub3QgYmVpbmcgb2JzZXJ2ZWQuXG4gICAgaWYgKCFvYnNlcnZhdGlvbnMuaGFzKHRhcmdldCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG9ic2VydmF0aW9ucy5kZWxldGUodGFyZ2V0KTtcblxuICAgIGlmICghb2JzZXJ2YXRpb25zLnNpemUpIHtcbiAgICAgICAgdGhpcy5jb250cm9sbGVyXy5yZW1vdmVPYnNlcnZlcih0aGlzKTtcbiAgICB9XG59O1xuXG4vKipcclxuICogU3RvcHMgb2JzZXJ2aW5nIGFsbCBlbGVtZW50cy5cclxuICpcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJTUEkucHJvdG90eXBlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5jbGVhckFjdGl2ZSgpO1xuICAgIHRoaXMub2JzZXJ2YXRpb25zXy5jbGVhcigpO1xuICAgIHRoaXMuY29udHJvbGxlcl8ucmVtb3ZlT2JzZXJ2ZXIodGhpcyk7XG59O1xuXG4vKipcclxuICogQ29sbGVjdHMgb2JzZXJ2YXRpb24gaW5zdGFuY2VzIHRoZSBhc3NvY2lhdGVkIGVsZW1lbnQgb2Ygd2hpY2ggaGFzIGNoYW5nZWRcclxuICogaXQncyBjb250ZW50IHJlY3RhbmdsZS5cclxuICpcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJTUEkucHJvdG90eXBlLmdhdGhlckFjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRoaXMkMSA9IHRoaXM7XG5cbiAgICB0aGlzLmNsZWFyQWN0aXZlKCk7XG5cbiAgICB0aGlzLm9ic2VydmF0aW9uc18uZm9yRWFjaChmdW5jdGlvbiAob2JzZXJ2YXRpb24pIHtcbiAgICAgICAgaWYgKG9ic2VydmF0aW9uLmlzQWN0aXZlKCkpIHtcbiAgICAgICAgICAgIHRoaXMkMS5hY3RpdmVPYnNlcnZhdGlvbnNfLnB1c2gob2JzZXJ2YXRpb24pO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vKipcclxuICogSW52b2tlcyBpbml0aWFsIGNhbGxiYWNrIGZ1bmN0aW9uIHdpdGggYSBsaXN0IG9mIFJlc2l6ZU9ic2VydmVyRW50cnlcclxuICogaW5zdGFuY2VzIGNvbGxlY3RlZCBmcm9tIGFjdGl2ZSByZXNpemUgb2JzZXJ2YXRpb25zLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7dm9pZH1cclxuICovXG5SZXNpemVPYnNlcnZlclNQSS5wcm90b3R5cGUuYnJvYWRjYXN0QWN0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIERvIG5vdGhpbmcgaWYgb2JzZXJ2ZXIgZG9lc24ndCBoYXZlIGFjdGl2ZSBvYnNlcnZhdGlvbnMuXG4gICAgaWYgKCF0aGlzLmhhc0FjdGl2ZSgpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgY3R4ID0gdGhpcy5jYWxsYmFja0N0eF87XG5cbiAgICAvLyBDcmVhdGUgUmVzaXplT2JzZXJ2ZXJFbnRyeSBpbnN0YW5jZSBmb3IgZXZlcnkgYWN0aXZlIG9ic2VydmF0aW9uLlxuICAgIHZhciBlbnRyaWVzID0gdGhpcy5hY3RpdmVPYnNlcnZhdGlvbnNfLm1hcChmdW5jdGlvbiAob2JzZXJ2YXRpb24pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNpemVPYnNlcnZlckVudHJ5KG9ic2VydmF0aW9uLnRhcmdldCwgb2JzZXJ2YXRpb24uYnJvYWRjYXN0UmVjdCgpKTtcbiAgICB9KTtcblxuICAgIHRoaXMuY2FsbGJhY2tfLmNhbGwoY3R4LCBlbnRyaWVzLCBjdHgpO1xuICAgIHRoaXMuY2xlYXJBY3RpdmUoKTtcbn07XG5cbi8qKlxyXG4gKiBDbGVhcnMgdGhlIGNvbGxlY3Rpb24gb2YgYWN0aXZlIG9ic2VydmF0aW9ucy5cclxuICpcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJTUEkucHJvdG90eXBlLmNsZWFyQWN0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuYWN0aXZlT2JzZXJ2YXRpb25zXy5zcGxpY2UoMCk7XG59O1xuXG4vKipcclxuICogVGVsbHMgd2hldGhlciBvYnNlcnZlciBoYXMgYWN0aXZlIG9ic2VydmF0aW9ucy5cclxuICpcclxuICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJTUEkucHJvdG90eXBlLmhhc0FjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5hY3RpdmVPYnNlcnZhdGlvbnNfLmxlbmd0aCA+IDA7XG59O1xuXG4vLyBSZWdpc3RyeSBvZiBpbnRlcm5hbCBvYnNlcnZlcnMuIElmIFdlYWtNYXAgaXMgbm90IGF2YWlsYWJsZSB1c2UgY3VycmVudCBzaGltXG4vLyBmb3IgdGhlIE1hcCBjb2xsZWN0aW9uIGFzIGl0IGhhcyBhbGwgcmVxdWlyZWQgbWV0aG9kcyBhbmQgYmVjYXVzZSBXZWFrTWFwXG4vLyBjYW4ndCBiZSBmdWxseSBwb2x5ZmlsbGVkIGFueXdheS5cbnZhciBvYnNlcnZlcnMgPSB0eXBlb2YgV2Vha01hcCAhPT0gJ3VuZGVmaW5lZCcgPyBuZXcgV2Vha01hcCgpIDogbmV3IE1hcFNoaW0oKTtcblxuLyoqXHJcbiAqIFJlc2l6ZU9ic2VydmVyIEFQSS4gRW5jYXBzdWxhdGVzIHRoZSBSZXNpemVPYnNlcnZlciBTUEkgaW1wbGVtZW50YXRpb25cclxuICogZXhwb3Npbmcgb25seSB0aG9zZSBtZXRob2RzIGFuZCBwcm9wZXJ0aWVzIHRoYXQgYXJlIGRlZmluZWQgaW4gdGhlIHNwZWMuXHJcbiAqL1xudmFyIFJlc2l6ZU9ic2VydmVyID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUmVzaXplT2JzZXJ2ZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbi4nKTtcbiAgICB9XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJzEgYXJndW1lbnQgcmVxdWlyZWQsIGJ1dCBvbmx5IDAgcHJlc2VudC4nKTtcbiAgICB9XG5cbiAgICB2YXIgY29udHJvbGxlciA9IFJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5nZXRJbnN0YW5jZSgpO1xuICAgIHZhciBvYnNlcnZlciA9IG5ldyBSZXNpemVPYnNlcnZlclNQSShjYWxsYmFjaywgY29udHJvbGxlciwgdGhpcyk7XG5cbiAgICBvYnNlcnZlcnMuc2V0KHRoaXMsIG9ic2VydmVyKTtcbn07XG5cbi8vIEV4cG9zZSBwdWJsaWMgbWV0aG9kcyBvZiBSZXNpemVPYnNlcnZlci5cblsnb2JzZXJ2ZScsICd1bm9ic2VydmUnLCAnZGlzY29ubmVjdCddLmZvckVhY2goZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgIFJlc2l6ZU9ic2VydmVyLnByb3RvdHlwZVttZXRob2RdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKHJlZiA9IG9ic2VydmVycy5nZXQodGhpcykpW21ldGhvZF0uYXBwbHkocmVmLCBhcmd1bWVudHMpO1xuICAgICAgICB2YXIgcmVmO1xuICAgIH07XG59KTtcblxudmFyIGluZGV4ID0gKGZ1bmN0aW9uICgpIHtcbiAgICAvLyBFeHBvcnQgZXhpc3RpbmcgaW1wbGVtZW50YXRpb24gaWYgYXZhaWxhYmxlLlxuICAgIGlmICh0eXBlb2YgZ2xvYmFsJDEuUmVzaXplT2JzZXJ2ZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBnbG9iYWwkMS5SZXNpemVPYnNlcnZlcjtcbiAgICB9XG5cbiAgICByZXR1cm4gUmVzaXplT2JzZXJ2ZXI7XG59KSgpO1xuXG5yZXR1cm4gaW5kZXg7XG5cbn0pKSk7XG4iLCJpbXBvcnQgeyBFdmVudERpc3BhdGNoZXIgfSBmcm9tIFwiLi4vZ3JpZC9ldmVudFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIERhdGFUYWJsZSBleHRlbmRzIEV2ZW50RGlzcGF0Y2hlciB7XHJcbiAgICBcclxuICAgIGNvbnN0cnVjdG9yIChkYXRhTW9kZWwsIGV4dGVuc2lvbikge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX2V4dGVuc2lvbiA9IGV4dGVuc2lvbjtcclxuICAgICAgICB0aGlzLl9pZFJ1bm5lciA9IDA7XHJcbiAgICAgICAgdGhpcy5fcmlkID0gW107XHJcbiAgICAgICAgdGhpcy5fcm93TWFwID0ge307XHJcbiAgICAgICAgdGhpcy5fZGF0YSA9IFtdO1xyXG4gICAgICAgIHRoaXMuX2Jsb2NrRXZlbnQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl9wcm9jZXNzZWRFdmVudCA9IFtdO1xyXG5cclxuICAgICAgICBsZXQgeyBmb3JtYXQsIGRhdGEsIGZpZWxkcyB9ID0gZGF0YU1vZGVsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFNldCBkZWZhdWx0IGZvcm1hdCBhdCByb3dzXHJcbiAgICAgICAgaWYgKCFmb3JtYXQpIHtcclxuICAgICAgICAgICAgZm9ybWF0ID0gJ3Jvd3MnO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9kYXRhRm9ybWF0ID0gZm9ybWF0O1xyXG4gICAgICAgIHRoaXMuX2ZpZWxkcyA9IGZpZWxkcztcclxuXHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaT0wOyBpPGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRkUm93KGRhdGFbaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fZGF0YSA9IFtdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRSb3dDb3VudCAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIGdldERhdGEgKHJvd0lkLCBmaWVsZCkge1xyXG4gICAgICAgIGxldCByb3cgPSB0aGlzLl9yb3dNYXBbcm93SWRdO1xyXG4gICAgICAgIGlmIChyb3cpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJvd1tmaWVsZF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RGF0YUF0IChyb3dJbmRleCwgZmllbGQpIHtcclxuICAgICAgICBsZXQgcm93ID0gdGhpcy5fZGF0YVtyb3dJbmRleF07XHJcbiAgICAgICAgaWYgKHJvdykge1xyXG4gICAgICAgICAgICByZXR1cm4gcm93W2ZpZWxkXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRSb3dEYXRhIChyb3dJZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9yb3dNYXBbcm93SWRdO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFJvd0RhdGFBdCAocm93SW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YVtyb3dJbmRleF07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Um93SW5kZXggKHJvd0lkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JpZC5pbmRleE9mKHJvd0lkKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRSb3dJZCAocm93SW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcmlkW3Jvd0luZGV4XTtcclxuICAgIH1cclxuXHJcbiAgICBzZXREYXRhIChyb3dJZCwgZmllbGQsIHZhbHVlKSB7XHJcbiAgICAgICAgY29uc3QgYmVmb3JlVXBkYXRlQXJnID0ge1xyXG5cdFx0XHRyb3dJZDogcm93SWQsXHJcblx0XHRcdGZpZWxkOiBmaWVsZCxcclxuXHRcdFx0ZGF0YTogdmFsdWUsXHJcblx0XHRcdGNhbmNlbDogZmFsc2VcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuX3Byb2Nlc3NlZEV2ZW50LnB1c2goYmVmb3JlVXBkYXRlQXJnKTtcclxuXHJcbiAgICAgICAgbGV0IGJsb2NrZWQgPSBmYWxzZTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoIXRoaXMuX2Jsb2NrRXZlbnQpIHtcclxuXHRcdFx0dGhpcy5fYmxvY2tFdmVudCA9IHRydWU7XHJcblx0XHRcdHRoaXMuX2V4dGVuc2lvbi5leGVjdXRlRXh0ZW5zaW9uKCdkYXRhQmVmb3JlVXBkYXRlJywgYmVmb3JlVXBkYXRlQXJnKTtcclxuXHRcdFx0dGhpcy5fYmxvY2tFdmVudCA9IGZhbHNlO1xyXG5cdFx0fSBlbHNlIHtcclxuICAgICAgICAgICAgYmxvY2tlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuXHRcdGlmICghYmVmb3JlVXBkYXRlQXJnLmNhbmNlbCkge1xyXG4gICAgICAgICAgICBsZXQgcm93ID0gdGhpcy5fcm93TWFwW3Jvd0lkXTtcclxuICAgICAgICAgICAgaWYgKHJvdykge1xyXG4gICAgICAgICAgICAgICAgcm93W2ZpZWxkXSA9IGJlZm9yZVVwZGF0ZUFyZy5kYXRhO1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9ibG9ja0V2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYmxvY2tFdmVudCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXh0ZW5zaW9uLmV4ZWN1dGVFeHRlbnNpb24oJ2RhdGFBZnRlclVwZGF0ZScsIGJlZm9yZVVwZGF0ZUFyZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYmxvY2tFdmVudCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWJsb2NrZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5fZXh0ZW5zaW9uLmV4ZWN1dGVFeHRlbnNpb24oJ2RhdGFGaW5pc2hVcGRhdGUnLCB7XHJcbiAgICAgICAgICAgICAgICB1cGRhdGVzOiB0aGlzLl9wcm9jZXNzZWRFdmVudFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy9DbGVhciBwcm9jZXNzZWQgZXZlbnQgbGlzdCAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLl9wcm9jZXNzZWRFdmVudC5sZW5ndGggPSAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXREYXRhQXQgKHJvd0luZGV4LCBmaWVsZCwgdmFsdWUpIHtcclxuICAgICAgICBjb25zdCByb3dJZCA9IHRoaXMuX3JpZFtyb3dJbmRleF07XHJcbiAgICAgICAgaWYgKHJvd0lkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXREYXRhKHJvd0lkLCBmaWVsZCwgdmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhZGRSb3cgKHJvd0RhdGEpIHtcclxuICAgICAgICBjb25zdCBjb3VudCA9IHRoaXMuZ2V0Um93Q291bnQoKTtcclxuICAgICAgICB0aGlzLmluc2VydFJvdyhjb3VudCwgcm93RGF0YSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGluc2VydFJvdyAocm93SW5kZXgsIHJvd0RhdGEpIHtcclxuICAgICAgICBpZiAodGhpcy5fZGF0YUZvcm1hdCA9PT0gJ3Jvd3MnKSB7XHJcbiAgICAgICAgICAgIGxldCByaWQgPSB0aGlzLl9nZW5lcmF0ZVJvd0lkKCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3JpZC5zcGxpY2Uocm93SW5kZXgsIDAsIHJpZCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3Jvd01hcFtyaWRdID0gcm93RGF0YTtcclxuICAgICAgICAgICAgdGhpcy5fZGF0YS5zcGxpY2Uocm93SW5kZXgsIDAsIHJvd0RhdGEpO1xyXG4gICAgICAgIH0gZWxzZVxyXG4gICAgICAgIGlmICh0aGlzLl9kYXRhRm9ybWF0ID09PSAnYXJyYXknKSB7XHJcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMuX2ZpZWxkcykpIHtcclxuICAgICAgICAgICAgICAgIGxldCByaWQgPSB0aGlzLl9nZW5lcmF0ZVJvd0lkKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yaWQuc3BsaWNlKHJvd0luZGV4LCAwLCByaWQpO1xyXG4gICAgICAgICAgICAgICAgbGV0IG5ld09iaiA9IHRoaXMuX2NyZWF0ZU9iamVjdChyb3dEYXRhLCB0aGlzLl9maWVsZHMpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcm93TWFwW3JpZF0gPSBuZXdPYmo7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9kYXRhLnNwbGljZShyb3dJbmRleCwgMCwgbmV3T2JqKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVSb3cgKHJpZCkgeyBcclxuICAgICAgICBsZXQgcm93ID0gdGhpcy5fcm93TWFwW3JpZF07XHJcbiAgICAgICAgbGV0IGluZGV4ID0gdGhpcy5fZGF0YS5pbmRleE9mKHJvdyk7XHJcbiAgICAgICAgdGhpcy5fZGF0YS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgIGRlbGV0ZSB0aGlzLl9yb3dNYXBbcmlkXTtcclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVSb3dBdCAoaW5kZXgpIHtcclxuICAgICAgICBsZXQgcmlkID0gT2JqZWN0LmtleXModGhpcy5fcm93TWFwKS5maW5kKGtleSA9PiBvYmplY3Rba2V5XSA9PT0gdmFsdWUpO1xyXG4gICAgICAgIGRlbGV0ZSB0aGlzLl9yb3dNYXBbcmlkXTtcclxuICAgICAgICB0aGlzLl9kYXRhLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgX2dlbmVyYXRlUm93SWQgKCkge1xyXG4gICAgICAgIHRoaXMuX2lkUnVubmVyKys7XHJcbiAgICAgICAgcmV0dXJuICcnICsgdGhpcy5faWRSdW5uZXI7XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZU9iamVjdChhcnJheVZhbHVlcywgZmllbGRzKSB7XHJcbiAgICAgICAgbGV0IG5ld09iaiA9IHt9O1xyXG4gICAgICAgIGZvciAobGV0IGk9MDsgaTxmaWVsZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbmV3T2JqW2ZpZWxkc1tpXV0gPSBhcnJheVZhbHVlc1tpXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5ld09iajtcclxuICAgIH1cclxuXHJcbn0iLCJleHBvcnQgY2xhc3MgQ29weVBhc3RlRXh0ZW5zaW9uIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLl9nbG9iYWxDbGlwYm9hcmQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcblx0aW5pdCAoZ3JpZCwgY29uZmlnKSB7XHJcblx0XHR0aGlzLl9ncmlkID0gZ3JpZDtcclxuXHRcdHRoaXMuX2NvbmZpZyA9IGNvbmZpZztcclxuXHR9XHJcblxyXG5cdGtleURvd24gKGUpIHtcclxuICAgICAgICBpZiAodGhpcy5fZ2xvYmFsQ2xpcGJvYXJkICYmIGUuY3RybEtleSkge1xyXG4gICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdjJykge1xyXG4gICAgICAgICAgICAgICAgbGV0IGRhdGEgPSB0aGlzLl9jb3B5KCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGlwYm9hcmREYXRhLnNldERhdGEoJ3RleHQnLCBkYXRhKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ3YnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXN0ZSh3aW5kb3cuY2xpcGJvYXJkRGF0YS5nZXREYXRhKCd0ZXh0JykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdyaWRBZnRlclJlbmRlcihlKSB7XHJcbiAgICAgICAgaWYgKCF3aW5kb3cuY2xpcGJvYXJkRGF0YSkge1xyXG4gICAgICAgICAgICB0aGlzLl9ncmlkLnZpZXcuZ2V0RWxlbWVudCgpLmFkZEV2ZW50TGlzdGVuZXIoJ3Bhc3RlJywgKHBhc3RlRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Bhc3RlKHBhc3RlRXZlbnQuY2xpcGJvYXJkRGF0YS5nZXREYXRhKCd0ZXh0JykpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5fZ3JpZC52aWV3LmdldEVsZW1lbnQoKS5hZGRFdmVudExpc3RlbmVyKCdjb3B5JywgKGNvcHlFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGRhdGEgPSB0aGlzLl9jb3B5KCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvcHlFdmVudC5jbGlwYm9hcmREYXRhLnNldERhdGEoJ3RleHQvcGxhaW4nLCBkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICBjb3B5RXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuX2dsb2JhbENsaXBib2FyZCA9IGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2dsb2JhbENsaXBib2FyZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jb3B5KGNsaXBib2FyZERhdGEpIHtcclxuICAgICAgICBsZXQgc2VsZWN0aW9uID0gdGhpcy5fZ3JpZC5zdGF0ZS5nZXQoJ3NlbGVjdGlvbicpO1xyXG4gICAgICAgIGlmIChzZWxlY3Rpb24gJiYgc2VsZWN0aW9uLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgbGV0IHMgPSBzZWxlY3Rpb25bMF07XHJcbiAgICAgICAgICAgIGxldCByb3dzID0gW107XHJcbiAgICAgICAgICAgIGZvciAobGV0IGk9MDsgaTxzLmg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbHMgPSBbXTtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGo9MDsgajxzLnc7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbHMucHVzaCh0aGlzLl9ncmlkLmRhdGEuZ2V0RGF0YUF0KHMuciArIGksIHMuYyArIGopKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJvd3MucHVzaChjb2xzLmpvaW4oJ1xcdCcpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcm93cy5qb2luKCdcXG4nKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX3Bhc3RlKGRhdGEpIHtcclxuICAgICAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgICAgICBkYXRhID0gZGF0YS5yZXBsYWNlKC9cXG4kL2csICcnKTtcclxuICAgICAgICAgICAgbGV0IHNlbGVjdGlvbiA9IHRoaXMuX2dyaWQuc3RhdGUuZ2V0KCdzZWxlY3Rpb24nKTtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdGlvbiAmJiBzZWxlY3Rpb24ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHMgPSBzZWxlY3Rpb25bMF07XHJcbiAgICAgICAgICAgICAgICBsZXQgcm93cyA9IGRhdGEuc3BsaXQoJ1xcbicpO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaT0wOyBpPHJvd3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgY29scyA9IHJvd3NbaV0uc3BsaXQoJ1xcdCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGo9MDsgajxjb2xzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwYXN0ZVJvdyA9ICBzLnIgKyBpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcGFzdGVDb2wgPSBzLmMgKyBqO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fZ3JpZC5tb2RlbC5jYW5FZGl0KHBhc3RlUm93LCBwYXN0ZUNvbCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dyaWQuZGF0YS5zZXREYXRhQXQocGFzdGVSb3csIHBhc3RlQ29sLCBjb2xzW2pdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dyaWQudmlldy51cGRhdGVDZWxsKHBhc3RlUm93LCBwYXN0ZUNvbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59IiwiZXhwb3J0IGNsYXNzIEVkaXRvckV4dGVuc2lvbiB7XHJcblxyXG5cdGluaXQgKGdyaWQsIGNvbmZpZykge1xyXG5cdFx0dGhpcy5fZ3JpZCA9IGdyaWQ7XHJcblx0XHR0aGlzLl9jb25maWcgPSBjb25maWc7XHJcblx0XHR0aGlzLl9lZGl0b3JBdHRhY2hlZCA9IGZhbHNlO1xyXG5cdH1cclxuXHJcblx0a2V5RG93biAoZSkge1xyXG5cdFx0aWYgKCF0aGlzLl9lZGl0b3JBdHRhY2hlZCkge1xyXG5cdFx0XHRpZiAoIWUuY3RybEtleSkge1xyXG5cdFx0XHRcdGxldCBzZWxlY3Rpb24gPSB0aGlzLl9ncmlkLnN0YXRlLmdldCgnc2VsZWN0aW9uJyk7XHJcblx0XHRcdFx0aWYgKHNlbGVjdGlvbiAmJiBzZWxlY3Rpb24ubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRcdFx0bGV0IHJvd0luZGV4ID0gc2VsZWN0aW9uWzBdLnI7XHJcblx0XHRcdFx0XHRsZXQgY29sSW5kZXggPSBzZWxlY3Rpb25bMF0uYztcclxuXHRcdFx0XHRcdGxldCBlZGl0ID0gZmFsc2U7XHJcblx0XHRcdFx0XHRpZiAoZS5rZXlDb2RlID09PSAxMyB8fCAoZS5rZXlDb2RlID4gMzEgJiYgIShlLmtleUNvZGUgPj0gMzcgJiYgZS5rZXlDb2RlIDw9IDQwKSkpIHtcclxuXHRcdFx0XHRcdFx0ZWRpdCA9IHRydWU7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZiAoZWRpdCAmJlxyXG5cdFx0XHRcdFx0XHRyb3dJbmRleCA+PSAwICYmIHJvd0luZGV4IDwgdGhpcy5fZ3JpZC5tb2RlbC5nZXRSb3dDb3VudCgpICYmXHJcblx0XHRcdFx0XHRcdGNvbEluZGV4ID49IDAgJiYgY29sSW5kZXggPCB0aGlzLl9ncmlkLm1vZGVsLmdldENvbHVtbkNvdW50KCkpIHtcclxuXHRcdFx0XHRcdFx0bGV0IGNlbGwgPSB0aGlzLl9ncmlkLnZpZXcuZ2V0Q2VsbChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cdFx0XHRcdFx0XHRpZiAoY2VsbCkge1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuX2VkaXRDZWxsKGNlbGwpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHRcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGNlbGxBZnRlclJlbmRlciAoZSkge1xyXG5cdFx0ZS5jZWxsLmFkZEV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgKGUpID0+IHtcclxuXHRcdFx0bGV0IGFjdHVhbENlbGwgPSBlLnRhcmdldDtcclxuXHRcdFx0aWYgKGFjdHVhbENlbGwpIHtcclxuXHRcdFx0XHR0aGlzLl9lZGl0Q2VsbChhY3R1YWxDZWxsKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRfZWRpdENlbGwgKGNlbGwpIHtcclxuXHRcdGxldCBhY3R1YWxDZWxsID0gY2VsbDtcclxuXHRcdGxldCBhY3R1YWxSb3cgPSBwYXJzZUludChhY3R1YWxDZWxsLmRhdGFzZXQucm93SW5kZXgpO1xyXG5cdFx0bGV0IGFjdHVhbENvbCA9IHBhcnNlSW50KGFjdHVhbENlbGwuZGF0YXNldC5jb2xJbmRleCk7XHJcblx0XHRpZiAodGhpcy5fZ3JpZC5tb2RlbC5jYW5FZGl0KGFjdHVhbFJvdywgYWN0dWFsQ29sKSkge1xyXG5cdFx0XHQvL0dldCBkYXRhIHRvIGJlIGVkaXRlZFxyXG5cdFx0XHRsZXQgZGF0YSA9IHRoaXMuX2dyaWQubW9kZWwuZ2V0RGF0YUF0KGFjdHVhbFJvdywgYWN0dWFsQ29sKTtcclxuXHJcblx0XHRcdC8vSWYgdGhlcmUncyBjdXN0b20gZWRpdG9yLCB1c2UgY3VzdG9tIGVkaXRvciB0byBhdHRhY2ggdGhlIGVkaXRvclxyXG5cdFx0XHR0aGlzLl9ncmlkLnN0YXRlLnNldCgnZWRpdGluZycsIHRydWUpO1xyXG5cdFx0XHRsZXQgY3VzdG9tRWRpdG9yID0gdGhpcy5fZ3JpZC5tb2RlbC5nZXRDYXNjYWRlZENlbGxQcm9wKGFjdHVhbENlbGwuZGF0YXNldC5yb3dJbmRleCwgYWN0dWFsQ2VsbC5kYXRhc2V0LmNvbEluZGV4LCAnZWRpdG9yJyk7XHJcblx0XHRcdGlmIChjdXN0b21FZGl0b3IgJiYgY3VzdG9tRWRpdG9yLmF0dGFjaCkge1xyXG5cdFx0XHRcdGN1c3RvbUVkaXRvci5hdHRhY2goYWN0dWFsQ2VsbCwgZGF0YSwgdGhpcy5fZG9uZS5iaW5kKHRoaXMpKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLl9hdHRhY2hFZGl0b3IoYWN0dWFsQ2VsbCwgZGF0YSwgdGhpcy5fZG9uZS5iaW5kKHRoaXMpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLl9lZGl0b3JBdHRhY2hlZCA9IHRydWU7XHJcblx0XHRcdHRoaXMuX2VkaXRpbmdDb2wgPSBhY3R1YWxDb2w7XHJcblx0XHRcdHRoaXMuX2VkaXRpbmdSb3cgPSBhY3R1YWxSb3c7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRfYXR0YWNoRWRpdG9yIChjZWxsLCBkYXRhLCBkb25lKSB7XHJcblx0XHRpZiAoIXRoaXMuX2lucHV0RWxlbWVudCkge1xyXG5cdFx0XHRsZXQgY2VsbEJvdW5kID0gY2VsbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LnR5cGUgPSAndGV4dCc7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC52YWx1ZSA9IGRhdGE7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5zdHlsZS53aWR0aCA9IChjZWxsQm91bmQud2lkdGgtNikgKyAncHgnO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gKGNlbGxCb3VuZC5oZWlnaHQtMykgKyAncHgnO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQuY2xhc3NOYW1lID0gJ3BncmlkLWNlbGwtdGV4dC1lZGl0b3InO1xyXG5cdFx0XHRjZWxsLmlubmVySFRNTCA9ICcnO1xyXG5cdFx0XHRjZWxsLmFwcGVuZENoaWxkKHRoaXMuX2lucHV0RWxlbWVudCk7XHJcblxyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQuZm9jdXMoKTtcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LnNlbGVjdCgpO1xyXG5cclxuXHRcdFx0dGhpcy5fYXJyb3dLZXlMb2NrZWQgPSBmYWxzZTtcclxuXHJcblx0XHRcdHRoaXMuX2tleWRvd25IYW5kbGVyID0gKGUpID0+IHtcclxuXHRcdFx0XHRzd2l0Y2ggKGUua2V5Q29kZSkge1xyXG5cdFx0XHRcdFx0Y2FzZSAxMzogLy9FbnRlclxyXG5cdFx0XHRcdFx0XHRkb25lKGUudGFyZ2V0LnZhbHVlKTtcclxuXHRcdFx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRcdGNhc2UgMjc6IC8vRVNDXHJcblx0XHRcdFx0XHRcdGRvbmUoKTtcclxuXHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cdFx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRcdGNhc2UgNDA6IC8vRG93blxyXG5cdFx0XHRcdFx0Y2FzZSAzODogLy9VcFxyXG5cdFx0XHRcdFx0Y2FzZSAzNzogLy9MZWZ0XHJcblx0XHRcdFx0XHRjYXNlIDM5OiAvL1JpZ2h0XHJcblx0XHRcdFx0XHRcdGlmICghdGhpcy5fYXJyb3dLZXlMb2NrZWQpIHtcclxuXHRcdFx0XHRcdFx0XHRkb25lKGUudGFyZ2V0LnZhbHVlKTtcclxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHR9XHJcblx0XHRcdH07XHJcblx0XHRcdHRoaXMuX2tleWRvd25IYW5kbGVyID0gdGhpcy5fa2V5ZG93bkhhbmRsZXIuYmluZCh0aGlzKTtcclxuXHJcblx0XHRcdHRoaXMuX2JsdXJIYW5kbGVyID0gKGUpID0+IHtcclxuXHRcdFx0XHRkb25lKGUudGFyZ2V0LnZhbHVlKTtcclxuXHRcdFx0fTtcclxuXHRcdFx0dGhpcy5fYmx1ckhhbmRsZXIgPSB0aGlzLl9ibHVySGFuZGxlci5iaW5kKHRoaXMpO1xyXG5cclxuXHRcdFx0dGhpcy5fY2xpY2tIYW5kbGVyID0gKGUpID0+IHtcclxuXHRcdFx0XHR0aGlzLl9hcnJvd0tleUxvY2tlZCA9IHRydWU7XHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2tleWRvd25IYW5kbGVyKTtcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLl9ibHVySGFuZGxlcik7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX2NsaWNrSGFuZGxlcik7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRfZGV0YWNoRWRpdG9yICgpIHtcclxuXHRcdGlmICh0aGlzLl9pbnB1dEVsZW1lbnQpIHtcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9rZXlkb3duSGFuZGxlcik7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5fYmx1ckhhbmRsZXIpO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9jbGlja0hhbmRsZXIpO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLl9pbnB1dEVsZW1lbnQpO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQgPSBudWxsO1xyXG5cdFx0XHR0aGlzLl9rZXlkb3duSGFuZGxlciA9IG51bGw7XHJcblx0XHRcdHRoaXMuX2JsdXJIYW5kbGVyID0gbnVsbDtcclxuXHRcdFx0dGhpcy5fY2xpY2tIYW5kbGVyID0gbnVsbDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdF9kb25lIChyZXN1bHQpIHtcclxuXHRcdHRoaXMuX2RldGFjaEVkaXRvcigpO1xyXG5cdFx0aWYgKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdHRoaXMuX2dyaWQubW9kZWwuc2V0RGF0YUF0KHRoaXMuX2VkaXRpbmdSb3csIHRoaXMuX2VkaXRpbmdDb2wsIHJlc3VsdCk7XHJcblx0XHR9XHJcblx0XHR0aGlzLl9ncmlkLnZpZXcudXBkYXRlQ2VsbCh0aGlzLl9lZGl0aW5nUm93LCB0aGlzLl9lZGl0aW5nQ29sKTtcclxuXHRcdHRoaXMuX2VkaXRpbmdSb3cgPSAtMTtcclxuXHRcdHRoaXMuX2VkaXRpbmdDb2wgPSAtMTtcclxuXHRcdHRoaXMuX2VkaXRvckF0dGFjaGVkID0gZmFsc2U7XHJcblx0XHR0aGlzLl9ncmlkLnN0YXRlLnNldCgnZWRpdGluZycsIGZhbHNlKTtcclxuXHJcblx0XHQvL1JlLWZvY3VzIGF0IHRoZSBncmlkXHJcblx0XHR0aGlzLl9ncmlkLnZpZXcuZ2V0RWxlbWVudCgpLmZvY3VzKCk7XHJcblx0fVxyXG5cclxufSIsImV4cG9ydCBjbGFzcyBTZWxlY3Rpb25FeHRlbnNpb24ge1xyXG5cclxuXHRpbml0IChncmlkLCBjb25maWcpIHtcclxuXHRcdHRoaXMuX2dyaWQgPSBncmlkO1xyXG5cdFx0dGhpcy5fY29uZmlnID0gY29uZmlnO1xyXG5cdFx0dGhpcy5fY3VycmVudFNlbGVjdGlvbiA9IG51bGw7XHJcblx0XHR0aGlzLl9zZWxlY3Rpb25DbGFzcyA9ICh0aGlzLl9jb25maWcuc2VsZWN0aW9uICYmIHRoaXMuX2NvbmZpZy5zZWxlY3Rpb24uY3NzQ2xhc3MpP3RoaXMuX2NvbmZpZy5zZWxlY3Rpb24uY3NzQ2xhc3M6J3BncmlkLWNlbGwtc2VsZWN0aW9uJztcclxuXHR9XHJcblxyXG5cdGtleURvd24gKGUpIHtcclxuXHRcdGxldCBlZGl0aW5nID0gdGhpcy5fZ3JpZC5zdGF0ZS5nZXQoJ2VkaXRpbmcnKTtcclxuXHRcdGlmIChlZGl0aW5nKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdGxldCBzZWxlY3Rpb24gPSB0aGlzLl9ncmlkLnN0YXRlLmdldCgnc2VsZWN0aW9uJyk7XHJcblx0XHRpZiAoc2VsZWN0aW9uICYmIHNlbGVjdGlvbi5sZW5ndGggPiAwKSB7XHJcblx0XHRcdGxldCByb3dJbmRleCA9IHNlbGVjdGlvblswXS5yO1xyXG5cdFx0XHRsZXQgY29sSW5kZXggPSBzZWxlY3Rpb25bMF0uYztcclxuXHRcdFx0bGV0IGFsaWduVG9wID0gdHJ1ZTtcclxuXHRcdFx0c3dpdGNoIChlLmtleUNvZGUpIHtcclxuXHRcdFx0XHRjYXNlIDQwOiAvL0Rvd25cclxuXHRcdFx0XHRcdHJvd0luZGV4Kys7XHJcblx0XHRcdFx0XHRhbGlnblRvcCA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0Y2FzZSAzODogLy9VcFxyXG5cdFx0XHRcdFx0cm93SW5kZXgtLTtcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdGNhc2UgMzc6IC8vTGVmdFxyXG5cdFx0XHRcdFx0Y29sSW5kZXgtLTtcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdGNhc2UgMzk6IC8vUmlnaHRcclxuXHRcdFx0XHRjYXNlIDk6IC8vVGFiXHJcblx0XHRcdFx0XHRjb2xJbmRleCsrO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAocm93SW5kZXggPj0gMCAmJiByb3dJbmRleCA8IHRoaXMuX2dyaWQubW9kZWwuZ2V0Um93Q291bnQoKSAmJlxyXG5cdFx0XHRcdGNvbEluZGV4ID49IDAgJiYgY29sSW5kZXggPCB0aGlzLl9ncmlkLm1vZGVsLmdldENvbHVtbkNvdW50KCkpIHtcclxuXHRcdFx0XHRjb25zdCBpc0hlYWRlciA9IHRoaXMuX2dyaWQubW9kZWwuaXNIZWFkZXJSb3cocm93SW5kZXgpO1xyXG5cdFx0XHRcdGNvbnN0IHJvd01vZGVsID0gdGhpcy5fZ3JpZC5tb2RlbC5nZXRSb3dNb2RlbChyb3dJbmRleCk7XHJcblx0XHRcdFx0aWYgKCFyb3dNb2RlbCB8fCAhaXNIZWFkZXIpIHtcclxuXHRcdFx0XHRcdGxldCBjZWxsID0gdGhpcy5fZ3JpZC52aWV3LmdldENlbGwocm93SW5kZXgsIGNvbEluZGV4KTtcclxuXHRcdFx0XHRcdGlmIChjZWxsKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMuX3NlbGVjdENlbGwoY2VsbCwgcm93SW5kZXgsIGNvbEluZGV4KTtcclxuXHRcdFx0XHRcdFx0dGhpcy5fZ3JpZC52aWV3LnNjcm9sbFRvQ2VsbChyb3dJbmRleCwgY29sSW5kZXgsIGFsaWduVG9wKTtcclxuXHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Y2VsbEFmdGVyUmVuZGVyIChlKSB7XHJcblx0XHRlLmNlbGwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGUpID0+IHtcclxuXHRcdFx0Y29uc3QgYWN0dWFsQ2VsbCA9IGUudGFyZ2V0O1xyXG5cdFx0XHRjb25zdCBhY3R1YWxSb3cgPSBwYXJzZUludChhY3R1YWxDZWxsLmRhdGFzZXQucm93SW5kZXgpO1xyXG5cdFx0XHRjb25zdCBhY3R1YWxDb2wgPSBwYXJzZUludChhY3R1YWxDZWxsLmRhdGFzZXQuY29sSW5kZXgpO1xyXG5cdFx0XHRjb25zdCByb3dNb2RlbCA9IHRoaXMuX2dyaWQubW9kZWwuZ2V0Um93TW9kZWwoYWN0dWFsUm93KTtcclxuXHRcdFx0Y29uc3QgaXNIZWFkZXIgPSB0aGlzLl9ncmlkLm1vZGVsLmlzSGVhZGVyUm93KGFjdHVhbFJvdyk7XHJcblx0XHRcdGlmICghcm93TW9kZWwgfHwgIWlzSGVhZGVyKSB7XHJcblx0XHRcdFx0aWYgKGFjdHVhbENlbGwuY2xhc3NMaXN0LmNvbnRhaW5zKCdwZ3JpZC1jZWxsJykpIHtcclxuXHRcdFx0XHRcdHRoaXMuX3NlbGVjdENlbGwoYWN0dWFsQ2VsbCwgYWN0dWFsUm93LCBhY3R1YWxDb2wpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRfc2VsZWN0Q2VsbCAoY2VsbCwgcm93SW5kZXgsIGNvbEluZGV4KSB7XHJcblx0XHQvL0NsZWFyIG9sZCBzZWxlY3Rpb25cclxuXHRcdGlmICh0aGlzLl9jdXJyZW50U2VsZWN0aW9uICYmIHRoaXMuX2N1cnJlbnRTZWxlY3Rpb24gIT09IGNlbGwpIHtcclxuXHRcdFx0dGhpcy5fY3VycmVudFNlbGVjdGlvbi5jbGFzc0xpc3QucmVtb3ZlKHRoaXMuX3NlbGVjdGlvbkNsYXNzKTtcclxuXHRcdH1cclxuXHJcblx0XHQvL1NldCBzZWxlY3Rpb25cclxuXHRcdHRoaXMuX2N1cnJlbnRTZWxlY3Rpb24gPSBjZWxsO1xyXG5cdFx0dGhpcy5fY3VycmVudFNlbGVjdGlvbi5jbGFzc0xpc3QuYWRkKHRoaXMuX3NlbGVjdGlvbkNsYXNzKTtcclxuXHRcdHRoaXMuX2dyaWQudmlldy5nZXRFbGVtZW50KCkuZm9jdXMoKTtcclxuXHJcblx0XHQvL1N0b3JlIHNlbGVjdGlvbiBzdGF0ZVxyXG5cdFx0bGV0IHNlbGVjdGlvbiA9IHRoaXMuX2dyaWQuc3RhdGUuZ2V0KCdzZWxlY3Rpb24nKTtcclxuXHRcdGlmICghc2VsZWN0aW9uKSB7XHJcblx0XHRcdHNlbGVjdGlvbiA9IFtdO1xyXG5cdFx0XHR0aGlzLl9ncmlkLnN0YXRlLnNldCgnc2VsZWN0aW9uJywgc2VsZWN0aW9uKTtcclxuXHRcdH1cclxuXHRcdHNlbGVjdGlvbi5sZW5ndGggPSAwO1xyXG5cdFx0c2VsZWN0aW9uLnB1c2goe1xyXG5cdFx0XHRyOiByb3dJbmRleCxcclxuXHRcdFx0YzogY29sSW5kZXgsXHJcblx0XHRcdHc6IDEsXHJcblx0XHRcdGg6IDFcclxuXHRcdH0pO1xyXG5cclxuXHR9XHJcblxyXG59IiwiZXhwb3J0IGNsYXNzIFZpZXdVcGRhdGVyRXh0ZW5zaW9uIHtcclxuXHJcbiAgICBpbml0IChncmlkLCBjb25maWcpIHtcclxuXHRcdHRoaXMuX2dyaWQgPSBncmlkO1xyXG5cdFx0dGhpcy5fY29uZmlnID0gY29uZmlnO1xyXG5cdH1cclxuXHJcbiAgICBkYXRhRmluaXNoVXBkYXRlIChlKSB7XHJcbiAgICAgICAgbGV0IHJvd0luZGV4Q2FjaGUgPSB7fTtcclxuICAgICAgICBsZXQgY29sSW5kZXhDYWNoZSA9IHt9O1xyXG4gICAgICAgIGZvciAobGV0IGk9MDsgaTxlLnVwZGF0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IHtyb3dJZCwgZmllbGR9ID0gZS51cGRhdGVzW2ldO1xyXG4gICAgICAgICAgICBsZXQgcm93SW5kZXggPSBudWxsO1xyXG4gICAgICAgICAgICBsZXQgY29sSW5kZXggPSBudWxsO1xyXG4gICAgICAgICAgICBpZiAocm93SW5kZXhDYWNoZVtyb3dJZF0pIHtcclxuICAgICAgICAgICAgICAgIHJvd0luZGV4ID0gcm93SW5kZXhDYWNoZVtyb3dJZF07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByb3dJbmRleCA9IHRoaXMuX2dyaWQubW9kZWwuZ2V0Um93SW5kZXgocm93SWQpO1xyXG4gICAgICAgICAgICAgICAgcm93SW5kZXhDYWNoZVtyb3dJZF0gPSByb3dJbmRleDsgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGNvbEluZGV4Q2FjaGVbZmllbGRdKSB7XHJcbiAgICAgICAgICAgICAgICBjb2xJbmRleCA9IGNvbEluZGV4Q2FjaGVbZmllbGRdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29sSW5kZXggPSB0aGlzLl9ncmlkLm1vZGVsLmdldENvbHVtbkluZGV4KGZpZWxkKTtcclxuICAgICAgICAgICAgICAgIGNvbEluZGV4Q2FjaGVbcm93SWRdID0gY29sSW5kZXg7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9ICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuX2dyaWQudmlldy51cGRhdGVDZWxsKHJvd0luZGV4LCBjb2xJbmRleCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufSIsImV4cG9ydCBjbGFzcyBFdmVudERpc3BhdGNoZXIge1xyXG5cclxuXHRjb25zdHJ1Y3RvcigpIHtcclxuXHRcdHRoaXMuX2hhbmRsZXJzID0ge307XHJcblx0fVxyXG5cclxuXHRsaXN0ZW4oZXZlbnROYW1lLCBoYW5kbGVyKSB7XHJcblx0XHRpZiAoIXRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0pIHtcclxuXHRcdFx0dGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXSA9IFtdO1xyXG5cdFx0fVxyXG5cdFx0dGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXS5wdXNoKGhhZG5sZXIpO1xyXG5cdH1cclxuXHJcblx0dW5saXN0ZW4oZXZlbnROYW1lLCBoYW5kbGVyKSB7XHJcblx0XHRpZiAodGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXSkge1xyXG5cdFx0XHRsZXQgaW5kZXggPSB0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdLmluZGV4T2YoaGFuZGxlcik7XHJcblx0XHRcdGlmIChpbmRleCA+IC0xKSB7XHJcblx0XHRcdFx0dGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRoYXNMaXN0ZW5lcihldmVudE5hbWUpIHtcclxuXHRcdHJldHVybiB0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdICYmIHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0ubGVuZ3RoID4gMDtcclxuXHR9XHJcblxyXG5cdGRpc3BhdGNoKGV2ZW50TmFtZSwgZXZlbnRBcmcpIHtcclxuXHRcdGlmICh0aGlzLmhhc0xpc3RlbmVyKGV2ZW50TmFtZSkpIHtcclxuXHRcdFx0bGV0IGxpc3RlbmVycyA9IHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV07XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTxsaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRsaXN0ZW5lcnNbaV0oZXZlbnRBcmcpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxufSIsImV4cG9ydCBjbGFzcyBFeHRlbnNpb24ge1xyXG5cclxuXHRjb25zdHJ1Y3RvciAoZ3JpZCwgY29uZmlnKSB7XHJcblx0XHR0aGlzLl9ncmlkID0gZ3JpZDtcclxuXHRcdHRoaXMuX2NvbmZpZyA9IGNvbmZpZztcclxuXHJcblx0XHR0aGlzLl9leHRlbnNpb25zID0ge1xyXG5cdFx0XHRjZWxsUmVuZGVyOiBbXSxcclxuXHRcdFx0Y2VsbEFmdGVyUmVuZGVyOiBbXSxcclxuXHRcdFx0Y2VsbFVwZGF0ZTogW10sXHJcblx0XHRcdGNlbGxBZnRlclVwZGF0ZTogW10sXHJcblx0XHRcdGtleURvd246IFtdLFxyXG5cdFx0XHRncmlkQWZ0ZXJSZW5kZXI6IFtdLFxyXG5cdFx0XHRkYXRhQmVmb3JlUmVuZGVyOiBbXSxcclxuXHRcdFx0ZGF0YUJlZm9yZVVwZGF0ZTogW10sXHJcblx0XHRcdGRhdGFBZnRlclVwZGF0ZTogW10sXHJcblx0XHRcdGRhdGFGaW5pc2hVcGRhdGU6IFtdXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRsb2FkRXh0ZW5zaW9uIChleHQpIHtcclxuXHRcdGlmIChleHRbJ2luaXQnXSkge1xyXG5cdFx0XHRleHRbJ2luaXQnXSh0aGlzLl9ncmlkLCB0aGlzLl9jb25maWcpO1xyXG5cdFx0fVxyXG5cdFx0Zm9yIChsZXQgZXh0UG9pbnQgaW4gdGhpcy5fZXh0ZW5zaW9ucykge1xyXG5cdFx0XHRpZiAoZXh0W2V4dFBvaW50XSkge1xyXG5cdFx0XHRcdHRoaXMuX2V4dGVuc2lvbnNbZXh0UG9pbnRdLnB1c2goZXh0KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0aGFzRXh0ZW5zaW9uIChleHRQb2ludCkge1xyXG5cdFx0cmV0dXJuICh0aGlzLl9leHRlbnNpb25zW2V4dFBvaW50XSAmJiB0aGlzLl9leHRlbnNpb25zW2V4dFBvaW50XS5sZW5ndGggPiAwKVxyXG5cdH1cclxuXHJcblx0cXVlcnlFeHRlbnNpb24gKGV4dFBvaW50KSB7XHJcblx0XHRpZiAodGhpcy5fZXh0ZW5zaW9uc1tleHRQb2ludF0pIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2V4dGVuc2lvbnNbZXh0UG9pbnRdO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIFtdO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZXhlY3V0ZUV4dGVuc2lvbiAoZXh0UG9pbnQpIHtcclxuXHRcdHRoaXMucXVlcnlFeHRlbnNpb24oZXh0UG9pbnQpLmZvckVhY2goKGV4dCkgPT4ge1xyXG5cdFx0XHRleHRbZXh0UG9pbnRdLmFwcGx5KGV4dCwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG59IiwiaW1wb3J0IHsgVmlldyB9IGZyb20gJy4vdmlldyc7XHJcbmltcG9ydCB7IE1vZGVsIH0gZnJvbSAnLi9tb2RlbCc7XHJcbmltcG9ydCB7IERhdGFUYWJsZSB9IGZyb20gJy4uL2RhdGEvdGFibGUnO1xyXG5pbXBvcnQgeyBFeHRlbnNpb24gfSBmcm9tICcuL2V4dGVuc2lvbic7XHJcbmltcG9ydCB7IFN0YXRlIH0gZnJvbSAnLi9zdGF0ZSc7XHJcbmltcG9ydCB7IEV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJy4vZXZlbnQnO1xyXG5pbXBvcnQgeyBVdGlscyB9IGZyb20gJy4vdXRpbHMnO1xyXG5cclxuaW1wb3J0IHsgU2VsZWN0aW9uRXh0ZW5zaW9uIH0gZnJvbSAnLi4vZXh0ZW5zaW9ucy9zZWxlY3Rpb24nO1xyXG5pbXBvcnQgeyBFZGl0b3JFeHRlbnNpb24gfSBmcm9tICcuLi9leHRlbnNpb25zL2VkaXRvcic7XHJcbmltcG9ydCB7IENvcHlQYXN0ZUV4dGVuc2lvbiB9IGZyb20gJy4uL2V4dGVuc2lvbnMvY29weXBhc3RlJztcclxuaW1wb3J0IHsgVmlld1VwZGF0ZXJFeHRlbnNpb24gfSBmcm9tICcuLi9leHRlbnNpb25zL3ZpZXctdXBkYXRlcic7XHJcblxyXG5leHBvcnQgY2xhc3MgUEdyaWQgZXh0ZW5kcyBFdmVudERpc3BhdGNoZXIge1xyXG5cclxuXHRjb25zdHJ1Y3Rvcihjb25maWcpIHtcclxuXHRcdHN1cGVyKCk7XHJcblxyXG5cdFx0Ly9NZXJnZSBjb25maWcgd2l0aCBkZWZhdWx0IGNvbmZpZ1xyXG5cdFx0bGV0IGRlZmF1bHRDb25maWcgPSB7XHJcblx0XHRcdHJvd0NvdW50OiAwLFxyXG5cdFx0XHRoZWFkZXJSb3dDb3VudDogMSxcclxuXHRcdFx0Zm9vdGVyUm93Q291bnQ6IDAsXHJcblx0XHRcdGNvbHVtbkNvdW50OiAwLFxyXG5cdFx0XHRyb3dIZWlnaHQ6IDMyLFxyXG5cdFx0XHRjb2x1bW5XaWR0aDogMTAwXHJcblx0XHR9O1xyXG5cdFx0dGhpcy5fY29uZmlnID0gVXRpbHMubWl4aW4oY29uZmlnLCBkZWZhdWx0Q29uZmlnKTtcclxuXHJcblx0XHQvL0V4dGVuc2lvbnMgU3RvcmVcclxuXHRcdHRoaXMuX2V4dGVuc2lvbnMgPSBuZXcgRXh0ZW5zaW9uKHRoaXMsIHRoaXMuX2NvbmZpZyk7XHJcblxyXG5cdFx0dGhpcy5fZGF0YSA9IG5ldyBEYXRhVGFibGUodGhpcy5fY29uZmlnLmRhdGFNb2RlbCwgdGhpcy5fZXh0ZW5zaW9ucyk7XHJcblx0XHR0aGlzLl9tb2RlbCA9IG5ldyBNb2RlbCh0aGlzLl9jb25maWcsIHRoaXMuX2RhdGEpO1xyXG5cdFx0dGhpcy5fdmlldyA9IG5ldyBWaWV3KHRoaXMuX21vZGVsLCB0aGlzLl9leHRlbnNpb25zKTtcclxuXHRcdHRoaXMuX3N0YXRlID0gbmV3IFN0YXRlKCk7XHJcblxyXG5cdFx0Ly9Mb2FkIGRlZmF1bHQgZXh0ZW5zaW9uc1xyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5zZWxlY3Rpb24pIHtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5sb2FkRXh0ZW5zaW9uKG5ldyBTZWxlY3Rpb25FeHRlbnNpb24oKSk7XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmVkaXRpbmcpIHtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5sb2FkRXh0ZW5zaW9uKG5ldyBFZGl0b3JFeHRlbnNpb24oKSk7XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmNvcHlwYXN0ZSkge1xyXG5cdFx0XHR0aGlzLl9leHRlbnNpb25zLmxvYWRFeHRlbnNpb24obmV3IENvcHlQYXN0ZUV4dGVuc2lvbigpKTtcclxuXHRcdH1cclxuXHRcdGlmICh0aGlzLl9jb25maWcuYXV0b1VwZGF0ZSkge1xyXG5cdFx0XHR0aGlzLl9leHRlbnNpb25zLmxvYWRFeHRlbnNpb24obmV3IFZpZXdVcGRhdGVyRXh0ZW5zaW9uKCkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vTG9hZCBpbml0aWFsIGV4dGVybmFsIGV4dGVuc2lvbnNcclxuXHRcdGlmICh0aGlzLl9jb25maWcuZXh0ZW5zaW9ucyAmJiB0aGlzLl9jb25maWcuZXh0ZW5zaW9ucy5sZW5ndGggPiAwKSB7XHJcblx0XHRcdHRoaXMuX2NvbmZpZy5leHRlbnNpb25zLmZvckVhY2goKGV4dCkgPT4ge1xyXG5cdFx0XHRcdHRoaXMuX2V4dGVuc2lvbnMubG9hZEV4dGVuc2lvbihleHQpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldCB2aWV3KCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX3ZpZXc7XHJcblx0fVxyXG5cclxuXHRnZXQgbW9kZWwoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fbW9kZWw7XHJcblx0fVxyXG5cclxuXHRnZXQgZGF0YSgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9kYXRhO1xyXG5cdH1cclxuXHJcblx0Z2V0IGV4dGVuc2lvbigpIHtcclxuXHRcdHJldHVybiB0aGlzLl9leHRlbnNpb25zO1xyXG5cdH1cclxuXHJcblx0Z2V0IHN0YXRlICgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9zdGF0ZTtcclxuXHR9XHJcblxyXG5cdHJlbmRlcihlbGVtZW50KSB7XHJcblx0XHR0aGlzLl92aWV3LnJlbmRlcihlbGVtZW50KTtcclxuXHR9XHJcblxyXG59IiwiaW1wb3J0IHsgRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnLi9ldmVudCc7XHJcblxyXG5leHBvcnQgY2xhc3MgTW9kZWwgZXh0ZW5kcyBFdmVudERpc3BhdGNoZXIge1xyXG5cclxuXHRjb25zdHJ1Y3RvciAoY29uZmlnLCBkYXRhKSB7XHJcblx0XHRzdXBlcigpO1xyXG5cdFx0dGhpcy5fY29uZmlnID0gY29uZmlnO1xyXG5cdFx0dGhpcy5fZGF0YSA9IGRhdGE7XHJcblxyXG5cdFx0dGhpcy5fY29sdW1uTW9kZWwgPSBbXTtcclxuXHRcdHRoaXMuX3Jvd01vZGVsID0ge307XHJcblx0XHR0aGlzLl9oZWFkZXJSb3dNb2RlbCA9IHt9O1xyXG5cdFx0dGhpcy5fY2VsbE1vZGVsID0ge307XHJcblx0XHR0aGlzLl9oZWFkZXJDZWxsTW9kZWwgPSB7fTtcclxuXHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmhlYWRlclJvd3MpIHtcclxuXHRcdFx0Zm9yIChsZXQgaT0wOyBpPHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dzW2ldLmkgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0dGhpcy5faGVhZGVyUm93TW9kZWxbdGhpcy5fY29uZmlnLmhlYWRlclJvd3NbaV0uaV0gPSB0aGlzLl9jb25maWcuaGVhZGVyUm93c1tpXTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmICh0aGlzLl9jb25maWcuY29sdW1ucykge1xyXG5cdFx0XHRmb3IgKGxldCBpPTA7IGk8dGhpcy5fY29uZmlnLmNvbHVtbnMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRpZiAodGhpcy5fY29uZmlnLmNvbHVtbnNbaV0uaSAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHR0aGlzLl9jb2x1bW5Nb2RlbFt0aGlzLl9jb25maWcuY29sdW1uc1tpXS5pXSA9IHRoaXMuX2NvbmZpZy5jb2x1bW5zW2ldO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR0aGlzLl9jb2x1bW5Nb2RlbFtpXSA9IHRoaXMuX2NvbmZpZy5jb2x1bW5zW2ldO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5yb3dzKSB7XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTx0aGlzLl9jb25maWcucm93cy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdHRoaXMuX3Jvd01vZGVsW3RoaXMuX2NvbmZpZy5yb3dzW2ldLmldID0gdGhpcy5fY29uZmlnLnJvd3NbaV07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmICh0aGlzLl9jb25maWcuY2VsbHMpIHtcclxuXHRcdFx0Zm9yIChsZXQgaT0wOyBpPHRoaXMuX2NvbmZpZy5jZWxscy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdGxldCBtb2RlbCA9IHRoaXMuX2NvbmZpZy5jZWxsc1tpXTtcclxuXHRcdFx0XHRpZiAoIXRoaXMuX2NlbGxNb2RlbFttb2RlbC5jXSkge1xyXG5cdFx0XHRcdFx0dGhpcy5fY2VsbE1vZGVsW21vZGVsLmNdID0ge307XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMuX2NlbGxNb2RlbFttb2RlbC5jXVttb2RlbC5yXSA9IG1vZGVsO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmhlYWRlckNlbGxzKSB7XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTx0aGlzLl9jb25maWcuaGVhZGVyQ2VsbHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRsZXQgbW9kZWwgPSB0aGlzLl9jb25maWcuaGVhZGVyQ2VsbHNbaV07XHJcblx0XHRcdFx0aWYgKCF0aGlzLl9oZWFkZXJDZWxsTW9kZWxbbW9kZWwuY10pIHtcclxuXHRcdFx0XHRcdHRoaXMuX2hlYWRlckNlbGxNb2RlbFttb2RlbC5jXSA9IHt9O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLl9oZWFkZXJDZWxsTW9kZWxbbW9kZWwuY11bbW9kZWwucl0gPSBtb2RlbDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX2NhbGNUb3RhbFNpemUoKTtcclxuXHR9XHJcblxyXG5cdGNhbkVkaXQgKHJvd0luZGV4LCBjb2xJbmRleCkge1xyXG5cdFx0bGV0IHJvd01vZGVsID0gdGhpcy5nZXRSb3dNb2RlbChyb3dJbmRleCk7XHJcblx0XHRsZXQgY29sTW9kZWwgPSB0aGlzLmdldENvbHVtbk1vZGVsKGNvbEluZGV4KTtcclxuXHRcdGxldCBjZWxsTW9kZWwgPSB0aGlzLmdldENlbGxNb2RlbChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cclxuXHRcdGlmICgocm93TW9kZWwgJiYgcm93TW9kZWwuZWRpdGFibGUpIHx8XHJcblx0XHRcdChjb2xNb2RlbCAmJiBjb2xNb2RlbC5lZGl0YWJsZSkgfHxcclxuXHRcdFx0KGNlbGxNb2RlbCAmJiBjZWxsTW9kZWwuZWRpdGFibGUpKSB7XHJcblx0XHRcdGlmICgocm93TW9kZWwgJiYgcm93TW9kZWwuZWRpdGFibGUgPT09IGZhbHNlKSB8fFxyXG5cdFx0XHRcdChjb2xNb2RlbCAmJiBjb2xNb2RlbC5lZGl0YWJsZSA9PT0gZmFsc2UpIHx8XHJcblx0XHRcdFx0KGNlbGxNb2RlbCAmJiBjZWxsTW9kZWwuZWRpdGFibGUgPT09IGZhbHNlKSkge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBmYWxzZTtcdFxyXG59XHJcblxyXG5cdGlzSGVhZGVyUm93IChyb3dJbmRleCkge1xyXG5cdFx0cmV0dXJuIHJvd0luZGV4IDwgdGhpcy5fY29uZmlnLmhlYWRlclJvd0NvdW50O1xyXG5cdH1cclxuXHJcblx0Z2V0Q29sdW1uV2lkdGggKGNvbEluZGV4KSB7XHJcblx0XHRsZXQgY29sTW9kZWwgPSB0aGlzLl9jb2x1bW5Nb2RlbFtjb2xJbmRleF07XHJcblx0XHRpZiAoY29sTW9kZWwgJiYgY29sTW9kZWwud2lkdGggIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRyZXR1cm4gY29sTW9kZWwud2lkdGg7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLmNvbHVtbldpZHRoO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Z2V0Um93SGVpZ2h0IChyb3dJbmRleCkge1xyXG5cdFx0aWYgKHRoaXMuaXNIZWFkZXJSb3cocm93SW5kZXgpKSB7XHJcblxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Y29uc3QgZGF0YVJvd0luZGV4ID0gcm93SW5kZXggLSB0aGlzLl9jb25maWcuaGVhZGVyUm93Q291bnQ7XHJcblx0XHRcdGxldCByb3dNb2RlbCA9IHRoaXMuX3Jvd01vZGVsW2RhdGFSb3dJbmRleF07XHJcblx0XHRcdGlmIChyb3dNb2RlbCAmJiByb3dNb2RlbC5oZWlnaHQgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdHJldHVybiByb3dNb2RlbC5oZWlnaHQ7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX2NvbmZpZy5yb3dIZWlnaHQ7XHJcblx0XHRcdH1cdFxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Z2V0Q29sdW1uQ291bnQgKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2NvbmZpZy5jb2x1bW5zLmxlbmd0aDtcclxuXHR9XHJcblxyXG5cdGdldFJvd0NvdW50ICgpIHtcclxuXHRcdGxldCBoZWFkZXJSb3dDb3VudCA9IHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudDtcclxuXHRcdHJldHVybiBoZWFkZXJSb3dDb3VudCArIHRoaXMuX2RhdGEuZ2V0Um93Q291bnQoKTtcclxuXHR9XHJcblxyXG5cdGdldFRvcEZyZWV6ZVJvd3MgKCkge1xyXG5cdFx0bGV0IHRvcEZyZWV6ZSA9IDA7XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmhlYWRlclJvd0NvdW50ICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0dG9wRnJlZXplICs9IHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudDsgXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0b3BGcmVlemUgKz0gMTtcclxuXHRcdH1cclxuXHRcdGlmICh0aGlzLl9jb25maWcuZnJlZXplUGFuZSAmJiB0aGlzLl9jb25maWcuZnJlZXplUGFuZS50b3AgPiAwKSB7XHJcblx0XHRcdHRvcEZyZWV6ZSArPSB0aGlzLl9jb25maWcuZnJlZXplUGFuZS50b3A7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdG9wRnJlZXplO1xyXG5cdH1cclxuXHJcblx0Z2V0VG9wRnJlZXplU2l6ZSAoKSB7XHJcblx0XHRjb25zdCB0b3BGcmVlemVSb3cgPSB0aGlzLmdldFRvcEZyZWV6ZVJvd3MoKTsgXHJcblx0XHRsZXQgc3VtID0gMDtcclxuXHRcdGZvciAobGV0IGk9MDsgaTx0b3BGcmVlemVSb3c7IGkrKykge1xyXG5cdFx0XHRzdW0gKz0gdGhpcy5nZXRSb3dIZWlnaHQoaSk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gc3VtO1xyXG5cdH1cclxuXHJcblx0Z2V0TGVmdEZyZWV6ZVJvd3MgKCkge1xyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lICYmIHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lLmxlZnQgPiAwKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLl9jb25maWcuZnJlZXplUGFuZS5sZWZ0O1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIDA7XHJcblx0fVxyXG5cclxuXHRnZXRMZWZ0RnJlZXplU2l6ZSAoKSB7XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUgJiYgdGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUubGVmdCA+IDApIHtcclxuXHRcdFx0bGV0IHN1bSA9IDA7XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTx0aGlzLl9jb25maWcuZnJlZXplUGFuZS5sZWZ0OyBpKyspIHtcclxuXHRcdFx0XHRzdW0gKz0gdGhpcy5nZXRDb2x1bW5XaWR0aChpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gc3VtO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIDA7XHJcblx0fVxyXG5cclxuXHRnZXRCb3R0b21GcmVlemVSb3dzICgpIHtcclxuXHRcdGlmICh0aGlzLl9jb25maWcuZnJlZXplUGFuZSAmJiB0aGlzLl9jb25maWcuZnJlZXplUGFuZS5ib3R0b20gPiAwKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLl9jb25maWcuZnJlZXplUGFuZS5ib3R0b207XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gMDtcclxuXHR9XHJcblxyXG5cdGdldEJvdHRvbUZyZWV6ZVNpemUgKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2JvdHRvbUZyZWV6ZVNpemU7XHJcblx0fVxyXG5cclxuXHRnZXRDb2x1bW5XaWR0aCAoaW5kZXgpIHtcclxuXHRcdGlmICh0aGlzLl9jb2x1bW5Nb2RlbFtpbmRleF0gJiYgdGhpcy5fY29sdW1uTW9kZWxbaW5kZXhdLndpZHRoICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2NvbHVtbk1vZGVsW2luZGV4XS53aWR0aDtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzLl9jb25maWcuY29sdW1uV2lkdGg7XHJcblx0fVxyXG5cclxuXHRnZXRSb3dIZWlnaHQgKGluZGV4KSB7XHJcblx0XHRpZiAodGhpcy5fcm93TW9kZWxbaW5kZXhdICYmIHRoaXMuX3Jvd01vZGVsW2luZGV4XS5oZWlnaHQgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fcm93TW9kZWxbaW5kZXhdLmhlaWdodDtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzLl9jb25maWcucm93SGVpZ2h0O1xyXG5cdH1cclxuXHJcblx0Z2V0VG90YWxXaWR0aCAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fdG90YWxXaWR0aDtcclxuXHR9XHJcblxyXG5cdGdldFRvdGFsSGVpZ2h0ICgpIHtcclxuXHRcdHJldHVybiB0aGlzLl90b3RhbEhlaWdodDtcclxuXHR9XHJcblxyXG5cdGdldFJvd01vZGVsIChyb3dJbmRleCkge1xyXG5cdFx0aWYgKHRoaXMuaXNIZWFkZXJSb3cocm93SW5kZXgpKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLl9oZWFkZXJSb3dNb2RlbFtyb3dJbmRleF07XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjb25zdCBkYXRhUm93SW5kZXggPSByb3dJbmRleCAtIHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudDtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX3Jvd01vZGVsW2RhdGFSb3dJbmRleF07XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRnZXRDb2x1bW5Nb2RlbCAoY29sSW5kZXgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9jb2x1bW5Nb2RlbFtjb2xJbmRleF07XHJcblx0fVxyXG5cclxuXHRnZXRDZWxsTW9kZWwgKHJvd0luZGV4LCBjb2xJbmRleCkge1xyXG5cdFx0aWYgKHRoaXMuaXNIZWFkZXJSb3cocm93SW5kZXgpKSB7XHJcblx0XHRcdGlmICh0aGlzLl9oZWFkZXJDZWxsTW9kZWxbY29sSW5kZXhdKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX2hlYWRlckNlbGxNb2RlbFtjb2xJbmRleF1bcm93SW5kZXhdO1xyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjb25zdCBkYXRhUm93SW5kZXggPSByb3dJbmRleCAtIHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudDtcclxuXHRcdFx0aWYgKHRoaXMuX2NlbGxNb2RlbFtjb2xJbmRleF0pIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fY2VsbE1vZGVsW2NvbEluZGV4XVtkYXRhUm93SW5kZXhdO1xyXG5cdFx0XHR9XHRcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldENhc2NhZGVkQ2VsbFByb3AgKHJvd0luZGV4LCBjb2xJbmRleCwgcHJvcE5hbWUpIHtcclxuXHRcdGNvbnN0IGNlbGxNb2RlbCA9IHRoaXMuZ2V0Q2VsbE1vZGVsKHJvd0luZGV4LCBjb2xJbmRleCk7XHJcblx0XHRpZiAoY2VsbE1vZGVsICYmIGNlbGxNb2RlbFtwcm9wTmFtZV0pIHtcclxuXHRcdFx0cmV0dXJuIGNlbGxNb2RlbFtwcm9wTmFtZV07XHJcblx0XHR9XHJcblxyXG5cdFx0Y29uc3Qgcm93TW9kZWwgPSB0aGlzLmdldFJvd01vZGVsKHJvd0luZGV4KTtcclxuXHRcdGlmIChyb3dNb2RlbCAmJiByb3dNb2RlbFtwcm9wTmFtZV0pIHtcclxuXHRcdFx0cmV0dXJuIHJvd01vZGVsW3Byb3BOYW1lXTtcclxuXHRcdH1cclxuXHJcblx0XHRjb25zdCBjb2x1bW5Nb2RlbCA9IHRoaXMuZ2V0Q29sdW1uTW9kZWwoY29sSW5kZXgpO1xyXG5cdFx0aWYgKGNvbHVtbk1vZGVsICYmIGNvbHVtbk1vZGVsW3Byb3BOYW1lXSkge1xyXG5cdFx0XHRyZXR1cm4gY29sdW1uTW9kZWxbcHJvcE5hbWVdO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB1bmRlZmluZWQ7XHJcblx0fVxyXG5cclxuXHRnZXRDZWxsQ2xhc3NlcyAocm93SW5kZXgsIGNvbEluZGV4KSB7XHJcblx0XHRsZXQgb3V0cHV0ID0gW107XHJcblx0XHRjb25zdCBjb2xNb2RlbCA9IHRoaXMuZ2V0Q29sdW1uTW9kZWwoY29sSW5kZXgpO1xyXG5cdFx0aWYgKGNvbE1vZGVsKSB7XHJcblx0XHRcdGlmIChjb2xNb2RlbC5jc3NDbGFzcykge1xyXG5cdFx0XHRcdG91dHB1dC51bnNoaWZ0KGNvbE1vZGVsLmNzc0NsYXNzKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGNvbnN0IGlzSGVhZGVyID0gdGhpcy5pc0hlYWRlclJvdyhyb3dJbmRleCk7XHJcblx0XHRjb25zdCByb3dNb2RlbCA9IHRoaXMuZ2V0Um93TW9kZWwocm93SW5kZXgpO1xyXG5cdFx0aWYgKHJvd01vZGVsKSB7XHJcblx0XHRcdGlmIChpc0hlYWRlcikge1xyXG5cdFx0XHRcdG91dHB1dC51bnNoaWZ0KCdwZ3JpZC1yb3ctaGVhZGVyJyk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHJvd01vZGVsLmNzc0NsYXNzKSB7XHJcblx0XHRcdFx0b3V0cHV0LnVuc2hpZnQocm93TW9kZWwuY3NzQ2xhc3MpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0Y29uc3QgY2VsbE1vZGVsID0gdGhpcy5nZXRDZWxsTW9kZWwocm93SW5kZXgsIGNvbEluZGV4KTtcclxuXHRcdGlmIChjZWxsTW9kZWwpIHtcclxuXHRcdFx0aWYgKGNlbGxNb2RlbC5jc3NDbGFzcykge1xyXG5cdFx0XHRcdG91dHB1dC51bnNoaWZ0KGNlbGxNb2RlbC5jc3NDbGFzcyk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiBvdXRwdXQ7XHJcblx0fVxyXG5cclxuXHRkZXRlcm1pbmVTY3JvbGxiYXJTdGF0ZSAodmlld1dpZHRoLCB2aWV3SGVpZ2h0LCBzY3JvbGxiYXJTaXplKSB7XHJcblx0XHRsZXQgbmVlZEggPSB0aGlzLl90b3RhbFdpZHRoID4gdmlld1dpZHRoO1xyXG5cdFx0bGV0IG5lZWRWID0gdGhpcy5fdG90YWxIZWlnaHQgPiB2aWV3SGVpZ2h0O1xyXG5cclxuXHRcdGlmIChuZWVkSCAmJiAhbmVlZFYpIHtcclxuXHRcdFx0bmVlZFYgPSB0aGlzLl90b3RhbEhlaWdodCA+ICh2aWV3SGVpZ2h0IC0gc2Nyb2xsYmFyU2l6ZSk7XHJcblx0XHR9IGVsc2VcclxuXHRcdGlmICghbmVlZEggJiYgbmVlZFYpIHtcclxuXHRcdFx0bmVlZEggPSB0aGlzLl90b3RhbFdpZHRoID4gKHZpZXdXaWR0aCAtIHNjcm9sbGJhclNpemUpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChuZWVkSCAmJiBuZWVkVikge1xyXG5cdFx0XHRyZXR1cm4gJ2InO1xyXG5cdFx0fSBlbHNlXHJcblx0XHRpZiAoIW5lZWRIICYmIG5lZWRWKSB7XHJcblx0XHRcdHJldHVybiAndic7XHJcblx0XHR9IGVsc2VcclxuXHRcdGlmIChuZWVkSCAmJiAhbmVlZFYpIHtcclxuXHRcdFx0cmV0dXJuICdoJztcclxuXHRcdH1cclxuXHRcdHJldHVybiAnbic7XHJcblx0fVxyXG5cclxuXHRnZXREYXRhQXQgKHJvd0luZGV4LCBjb2xJbmRleCkge1xyXG5cdFx0aWYgKHRoaXMuaXNIZWFkZXJSb3cocm93SW5kZXgpKSB7XHJcblx0XHRcdGNvbnN0IGNvbE1vZGVsID0gdGhpcy5nZXRDb2x1bW5Nb2RlbChjb2xJbmRleCk7XHJcblx0XHRcdGlmIChjb2xNb2RlbCAmJiBjb2xNb2RlbC50aXRsZSkge1xyXG5cdFx0XHRcdHJldHVybiBjb2xNb2RlbC50aXRsZTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjb25zdCBkYXRhUm93SW5kZXggPSByb3dJbmRleCAtIHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudDtcclxuXHRcdFx0Y29uc3QgY29sTW9kZWwgPSB0aGlzLmdldENvbHVtbk1vZGVsKGNvbEluZGV4KTtcclxuXHRcdFx0aWYgKGNvbE1vZGVsICYmIGNvbE1vZGVsLmZpZWxkKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX2RhdGEuZ2V0RGF0YUF0KGRhdGFSb3dJbmRleCwgY29sTW9kZWwuZmllbGQpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XHJcblx0XHRcdH1cdFxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0c2V0RGF0YUF0IChyb3dJbmRleCwgY29sSW5kZXgsIGRhdGEpIHtcclxuXHRcdGNvbnN0IGRhdGFSb3dJbmRleCA9IHJvd0luZGV4IC0gdGhpcy5fY29uZmlnLmhlYWRlclJvd0NvdW50O1xyXG5cdFx0Y29uc3QgY29sTW9kZWwgPSB0aGlzLmdldENvbHVtbk1vZGVsKGNvbEluZGV4KTtcclxuXHRcdGlmIChjb2xNb2RlbCAmJiBjb2xNb2RlbC5maWVsZCkge1xyXG5cdFx0XHR0aGlzLl9kYXRhLnNldERhdGFBdChkYXRhUm93SW5kZXgsIGNvbE1vZGVsLmZpZWxkLCBkYXRhKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldFJvd0luZGV4IChyb3dJZCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudCArIHRoaXMuX2RhdGEuZ2V0Um93SW5kZXgocm93SWQpO1xyXG5cdH1cclxuXHJcblx0Z2V0Um93SWQgKHJvd0luZGV4KSB7XHJcblx0XHRpZiAocm93SW5kZXggPj0gdGhpcy5fY29uZmlnLmhlYWRlclJvd0NvdW50KSB7XHJcblx0XHRcdHRoaXMuX2RhdGEuZ2V0Um93SWQocm93SW5kZXggLSB0aGlzLl9jb25maWcuaGVhZGVyUm93Q291bnQpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRnZXRDb2x1bW5JbmRleCAoZmllbGQpIHtcclxuXHRcdGZvciAobGV0IGk9MDsgaTx0aGlzLl9jb25maWcuY29sdW1ucy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRpZiAodGhpcy5fY29uZmlnLmNvbHVtbnNbaV0uZmllbGQgPT09IGZpZWxkKSB7XHJcblx0XHRcdFx0cmV0dXJuIGk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiAtMTtcclxuXHR9XHJcblxyXG5cdGdldENvbHVtbkZpZWxkIChjb2xJbmRleCkge1xyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5jb2x1bW5zW2NvbEluZGV4XSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLmNvbHVtbnNbY29sSW5kZXhdLmZpZWxkO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0X2NhbGNUb3RhbFNpemUoKSB7XHJcblx0XHR0aGlzLl9jYWxjVG90YWxXaWR0aCgpO1xyXG5cdFx0dGhpcy5fY2FsY1RvdGFsSGVpZ2h0KCk7XHJcblx0XHR0aGlzLl9jYWxjQm90dG9tRnJlZXplU2l6ZSgpO1xyXG5cdH1cclxuXHJcblx0X2NhbGNUb3RhbFdpZHRoICgpIHtcclxuXHRcdHRoaXMuX3RvdGFsV2lkdGggPSAwO1xyXG5cdFx0Zm9yIChsZXQgaT0wOyBpPHRoaXMuX2NvbHVtbk1vZGVsLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdGlmICh0aGlzLl9jb2x1bW5Nb2RlbFtpXS53aWR0aCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0dGhpcy5fdG90YWxXaWR0aCArPSB0aGlzLl9jb2x1bW5Nb2RlbFtpXS53aWR0aDtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLl90b3RhbFdpZHRoICs9IHRoaXMuX2NvbmZpZy5jb2x1bW5XaWR0aDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0X2NhbGNUb3RhbEhlaWdodCAoKSB7XHJcblx0XHRsZXQgaGVhZGVyUm93TW9kZWxDb3VudCA9IE9iamVjdC5rZXlzKHRoaXMuX2hlYWRlclJvd01vZGVsKTtcclxuXHRcdHRoaXMuX3RvdGFsSGVpZ2h0ID0gdGhpcy5fY29uZmlnLnJvd0hlaWdodCAqICh0aGlzLl9jb25maWcuaGVhZGVyUm93Q291bnQgLSBoZWFkZXJSb3dNb2RlbENvdW50Lmxlbmd0aCk7XHJcblx0XHRmb3IgKGxldCBpbmRleCBpbiB0aGlzLl9oZWFkZXJSb3dNb2RlbCkge1xyXG5cdFx0XHRpZiAodGhpcy5faGVhZGVyUm93TW9kZWxbaW5kZXhdLmhlaWdodCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0dGhpcy5fdG90YWxIZWlnaHQgKz0gdGhpcy5faGVhZGVyUm93TW9kZWxbaW5kZXhdLmhlaWdodDtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLl90b3RhbEhlaWdodCArPSB0aGlzLl9jb25maWcucm93SGVpZ2h0O1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IHJvd01vZGVsQ291bnQgPSBPYmplY3Qua2V5cyh0aGlzLl9yb3dNb2RlbCk7XHJcblx0XHR0aGlzLl90b3RhbEhlaWdodCArPSB0aGlzLl9jb25maWcucm93SGVpZ2h0ICogKHRoaXMuX2RhdGEuZ2V0Um93Q291bnQoKSAtIHJvd01vZGVsQ291bnQubGVuZ3RoKTtcclxuXHRcdGZvciAobGV0IGluZGV4IGluIHRoaXMuX3Jvd01vZGVsKSB7XHJcblx0XHRcdGlmICh0aGlzLl9yb3dNb2RlbFtpbmRleF0uaGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHR0aGlzLl90b3RhbEhlaWdodCArPSB0aGlzLl9yb3dNb2RlbFtpbmRleF0uaGVpZ2h0O1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMuX3RvdGFsSGVpZ2h0ICs9IHRoaXMuX2NvbmZpZy5yb3dIZWlnaHQ7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdF9jYWxjQm90dG9tRnJlZXplU2l6ZSAoKSB7XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUgJiYgdGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUuYm90dG9tID4gMCkge1xyXG5cdFx0XHRsZXQgc3VtID0gMDtcclxuXHRcdFx0Zm9yIChsZXQgaT0wOyBpPHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lLmJvdHRvbTsgaSsrKSB7XHJcblx0XHRcdFx0c3VtICs9IHRoaXMuZ2V0Um93SGVpZ2h0KCh0aGlzLl9jb25maWcucm93Q291bnQtMSktaSk7XHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy5fYm90dG9tRnJlZXplU2l6ZSA9IHN1bTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMuX2JvdHRvbUZyZWV6ZVNpemUgPSAwO1xyXG5cdFx0fVxyXG5cdH1cclxufSIsImV4cG9ydCBjbGFzcyBTdGF0ZSB7XHJcblxyXG5cdGNvbnN0cnVjdG9yICgpIHtcclxuXHRcdHRoaXMuX3N0YXRlID0ge307XHJcblx0fVxyXG5cclxuXHRleGlzdHMgKGtleSkge1xyXG5cdFx0cmV0dXJuICh0aGlzLl9zdGF0ZVtrZXldICE9PSB1bmRlZmluZWQpO1xyXG5cdH1cclxuXHJcblx0Z2V0IChrZXkpIHtcclxuXHRcdHJldHVybiB0aGlzLl9zdGF0ZVtrZXldO1xyXG5cdH1cclxuXHJcblx0c2V0IChrZXksIHZhbHVlKSB7XHJcblx0XHR0aGlzLl9zdGF0ZVtrZXldID0gdmFsdWU7XHJcblx0fVxyXG5cdFxyXG59IiwiZXhwb3J0IGNsYXNzIFV0aWxzIHtcclxuXHJcblx0c3RhdGljIG1peGluKHNvdXJjZSwgdGFyZ2V0KSB7XHJcblx0XHRmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xyXG5cdFx0XHRpZiAoc291cmNlLmhhc093blByb3BlcnR5KHByb3ApKSB7XHJcblx0XHRcdFx0dGFyZ2V0W3Byb3BdID0gc291cmNlW3Byb3BdO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGFyZ2V0O1xyXG5cdH1cclxufSIsImltcG9ydCB7IEV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJy4vZXZlbnQnO1xyXG5pbXBvcnQgUmVzaXplT2JzZXJ2ZXIgZnJvbSAncmVzaXplLW9ic2VydmVyLXBvbHlmaWxsJztcclxuXHJcbmV4cG9ydCBjbGFzcyBWaWV3IGV4dGVuZHMgRXZlbnREaXNwYXRjaGVyIHtcclxuXHJcblx0Y29uc3RydWN0b3IgKG1vZGVsLCBleHRlbnNpb25zKSB7XHJcblx0XHRzdXBlcigpO1xyXG5cdFx0dGhpcy5fbW9kZWwgPSBtb2RlbDtcclxuXHRcdHRoaXMuX2V4dGVuc2lvbnMgPSBleHRlbnNpb25zO1xyXG5cdFx0dGhpcy5fdGVtcGxhdGUgPSBcdCc8ZGl2IGNsYXNzPVwicGdyaWQtY29udGVudC1wYW5lXCIgc3R5bGU9XCJwb3NpdGlvbjogcmVsYXRpdmU7XCI+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PGRpdiBjbGFzcz1cInBncmlkLXRvcC1sZWZ0LXBhbmVcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcIj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHRcdDxkaXYgY2xhc3M9XCJwZ3JpZC10b3AtbGVmdC1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgb3ZlcmZsb3c6IGhpZGRlbjsgcG9zaXRpb246IHJlbGF0aXZlO1wiPjwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDxkaXYgY2xhc3M9XCJwZ3JpZC10b3AtcGFuZVwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1wiPicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdFx0PGRpdiBjbGFzcz1cInBncmlkLXRvcC1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgb3ZlcmZsb3c6IGhpZGRlbjsgcG9zaXRpb246IHJlbGF0aXZlO1wiPjwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDxkaXYgY2xhc3M9XCJwZ3JpZC1sZWZ0LXBhbmVcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcIj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHRcdDxkaXYgY2xhc3M9XCJwZ3JpZC1sZWZ0LWlubmVyXCIgc3R5bGU9XCJ3aWR0aDogMTAwJTsgaGVpZ2h0OiAxMDAlOyBvdmVyZmxvdzogaGlkZGVuOyBwb3NpdGlvbjogcmVsYXRpdmU7XCI+PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PGRpdiBjbGFzcz1cInBncmlkLWNlbnRlci1wYW5lXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XCI+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0XHQ8ZGl2IGNsYXNzPVwicGdyaWQtY2VudGVyLWlubmVyXCIgc3R5bGU9XCJ3aWR0aDogMTAwJTsgaGVpZ2h0OiAxMDAlOyBvdmVyZmxvdzogaGlkZGVuOyBwb3NpdGlvbjogcmVsYXRpdmU7XCI+PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PGRpdiBjbGFzcz1cInBncmlkLWJvdHRvbS1sZWZ0LXBhbmVcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcIj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHRcdDxkaXYgY2xhc3M9XCJwZ3JpZC1ib3R0b20tbGVmdC1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgb3ZlcmZsb3c6IGhpZGRlbjsgcG9zaXRpb246IHJlbGF0aXZlO1wiPjwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDxkaXYgY2xhc3M9XCJwZ3JpZC1ib3R0b20tcGFuZVwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1wiPicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdFx0PGRpdiBjbGFzcz1cInBncmlkLWJvdHRvbS1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgb3ZlcmZsb3c6IGhpZGRlbjsgcG9zaXRpb246IHJlbGF0aXZlO1wiPjwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCc8L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cInBncmlkLWhzY3JvbGxcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTsgYm90dG9tOiAwcHg7IG92ZXJmbG93LXk6IGhpZGRlbjsgb3ZlcmZsb3cteDogc2Nyb2xsO1wiPicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDxkaXYgY2xhc3M9XCJwZ3JpZC1oc2Nyb2xsLXRodW1iXCI+PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0JzwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwicGdyaWQtdnNjcm9sbFwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlOyByaWdodDogMHB4OyB0b3A6IDBweDsgb3ZlcmZsb3cteTogc2Nyb2xsOyBvdmVyZmxvdy14OiBoaWRkZW47XCI+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PGRpdiBjbGFzcz1cInBncmlkLXZzY3JvbGwtdGh1bWJcIj48L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnPC9kaXY+JztcclxuXHR9XHJcblxyXG5cdHJlbmRlciAoZWxlbWVudCkge1xyXG5cdFx0dGhpcy5fZWxlbWVudCA9IGVsZW1lbnQ7XHJcblx0XHR0aGlzLl9lbGVtZW50LmNsYXNzTmFtZSA9ICdwZ3JpZCc7XHJcblx0XHR0aGlzLl9lbGVtZW50LmlubmVySFRNTCA9IHRoaXMuX3RlbXBsYXRlO1xyXG5cdFx0dGhpcy5fZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XHJcblx0XHR0aGlzLl9lbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XHJcblx0XHR0aGlzLl9lbGVtZW50LnRhYkluZGV4ID0gMTtcclxuXHJcblx0XHR0aGlzLl9jb250ZW50UGFuZSA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLWNvbnRlbnQtcGFuZScpO1xyXG5cdFx0dGhpcy5fdG9wTGVmdFBhbmUgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC10b3AtbGVmdC1wYW5lJyk7XHJcblx0XHR0aGlzLl90b3BMZWZ0SW5uZXIgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC10b3AtbGVmdC1pbm5lcicpO1xyXG5cdFx0dGhpcy5fdG9wUGFuZSA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLXRvcC1wYW5lJyk7XHJcblx0XHR0aGlzLl90b3BJbm5lciA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLXRvcC1pbm5lcicpO1xyXG5cdFx0dGhpcy5fbGVmdFBhbmUgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1sZWZ0LXBhbmUnKTtcclxuXHRcdHRoaXMuX2xlZnRJbm5lciA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLWxlZnQtaW5uZXInKTtcclxuXHRcdHRoaXMuX2NlbnRlclBhbmUgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1jZW50ZXItcGFuZScpO1xyXG5cdFx0dGhpcy5fY2VudGVySW5uZXIgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1jZW50ZXItaW5uZXInKTtcclxuXHRcdHRoaXMuX2JvdHRvbVBhbmUgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1ib3R0b20tcGFuZScpO1xyXG5cdFx0dGhpcy5fYm90dG9tSW5uZXIgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1ib3R0b20taW5uZXInKTtcclxuXHRcdHRoaXMuX2JvdHRvbUxlZnRQYW5lID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtYm90dG9tLWxlZnQtcGFuZScpO1xyXG5cdFx0dGhpcy5fYm90dG9tTGVmdElubmVyID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtYm90dG9tLWxlZnQtaW5uZXInKTtcclxuXHJcblx0XHR0aGlzLl9zY3JvbGxXaWR0aCA9IHRoaXMuX21lYXN1cmVTY3JvbGxiYXJXaWR0aCgpO1xyXG5cclxuXHRcdHRoaXMuX2hTY3JvbGwgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1oc2Nyb2xsJyk7XHJcblx0XHR0aGlzLl92U2Nyb2xsID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtdnNjcm9sbCcpO1xyXG5cdFx0dGhpcy5faFNjcm9sbFRodW1iID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtaHNjcm9sbC10aHVtYicpO1xyXG5cdFx0dGhpcy5fdlNjcm9sbFRodW1iID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtdnNjcm9sbC10aHVtYicpO1xyXG5cdFx0dGhpcy5faFNjcm9sbC5zdHlsZS5oZWlnaHQgPSB0aGlzLl9zY3JvbGxXaWR0aCArICdweCc7XHJcblx0XHR0aGlzLl92U2Nyb2xsLnN0eWxlLndpZHRoID0gdGhpcy5fc2Nyb2xsV2lkdGggKyAncHgnO1xyXG5cdFx0dGhpcy5faFNjcm9sbFRodW1iLnN0eWxlLmhlaWdodCA9IHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4JztcclxuXHRcdHRoaXMuX3ZTY3JvbGxUaHVtYi5zdHlsZS53aWR0aCA9IHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4JztcclxuXHJcblx0XHR0aGlzLl9vYnNlcnZlU2l6ZSgpO1xyXG5cdFx0dGhpcy5fcmVzdHVyZWN0dXJlKCk7XHJcblx0XHR0aGlzLl9hdHRhY2hIYW5kbGVycygpO1xyXG5cclxuXHRcdHRoaXMuX2V4dGVuc2lvbnMuZXhlY3V0ZUV4dGVuc2lvbignZ3JpZEFmdGVyUmVuZGVyJywge1xyXG5cdFx0XHRncmlkOiB0aGlzXHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdHJlUmVuZGVyICgpIHtcclxuXHRcdHRoaXMuX3RvcExlZnRJbm5lci5pbm5lckhUTUwgPSAnJztcclxuXHRcdHRoaXMuX3RvcElubmVyLmlubmVySFRNTCA9ICcnO1xyXG5cdFx0dGhpcy5fbGVmdElubmVyLmlubmVySFRNTCA9ICcnO1xyXG5cdFx0dGhpcy5fY2VudGVySW5uZXIuaW5uZXJIVE1MID0gJyc7XHJcblx0XHR0aGlzLl9ib3R0b21MZWZ0SW5uZXIuaW5uZXJIVE1MID0gJyc7XHJcblx0XHR0aGlzLl9ib3R0b21Jbm5lci5pbm5lckhUTUwgPSAnJztcclxuXHJcblx0XHR0aGlzLl9yZXN0dXJlY3R1cmUoKTtcclxuXHR9XHJcblxyXG5cdGdldEVsZW1lbnQgKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2VsZW1lbnQ7XHJcblx0fVxyXG5cclxuXHRzZXRTY3JvbGxYICh4LCBhZGp1c3RTY3JvbGxCYXIpIHtcclxuXHRcdHRoaXMuX3RvcElubmVyLnNjcm9sbExlZnQgPSB4O1xyXG5cdFx0dGhpcy5fY2VudGVySW5uZXIuc2Nyb2xsTGVmdCA9IHg7XHJcblx0XHR0aGlzLl9ib3R0b21Jbm5lci5zY3JvbGxMZWZ0ID0geDtcclxuXHRcdGlmIChhZGp1c3RTY3JvbGxCYXIgfHwgYWRqdXN0U2Nyb2xsQmFyID09PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0dGhpcy5faFNjcm9sbC5zY3JvbGxMZWZ0ID0geDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldFNjcm9sbFggKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2NlbnRlcklubmVyLnNjcm9sbExlZnQ7XHJcblx0fVxyXG5cclxuXHRzZXRTY3JvbGxZICh5LCBhZGp1c3RTY3JvbGxCYXIpIHtcclxuXHRcdHRoaXMuX2NlbnRlcklubmVyLnNjcm9sbFRvcCA9IHk7XHJcblx0XHR0aGlzLl9sZWZ0SW5uZXIuc2Nyb2xsVG9wID0geTtcclxuXHRcdGlmIChhZGp1c3RTY3JvbGxCYXIgfHwgYWRqdXN0U2Nyb2xsQmFyID09PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0dGhpcy5fdlNjcm9sbC5zY3JvbGxUb3AgPSB5O1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Z2V0U2Nyb2xsWSAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fY2VudGVySW5uZXIuc2Nyb2xsVG9wO1xyXG5cdH1cclxuXHJcblx0c2Nyb2xsVG9DZWxsIChyb3dJbmRleCwgY29sSW5kZXgsIGFsaWduVG9wKSB7XHJcblx0XHRsZXQgY2VsbCA9IHRoaXMuZ2V0Q2VsbChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cdFx0bGV0IG9yaWdTY3JvbGxUb3AgPSBjZWxsLnBhcmVudEVsZW1lbnQuc2Nyb2xsVG9wO1xyXG5cdFx0bGV0IG9yaWdTY3JvbGxMZWZ0ID0gY2VsbC5wYXJlbnRFbGVtZW50LnNjcm9sbExlZnQ7XHJcblxyXG5cdFx0Y2VsbC5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKGZhbHNlKTtcclxuXHJcblx0XHRpZiAob3JpZ1Njcm9sbFRvcCAhPT0gY2VsbC5wYXJlbnRFbGVtZW50LnNjcm9sbFRvcCkge1xyXG5cdFx0XHR0aGlzLnNldFNjcm9sbFkoY2VsbC5wYXJlbnRFbGVtZW50LnNjcm9sbFRvcCwgdHJ1ZSk7XHJcblx0XHR9XHJcblx0XHRpZiAob3JpZ1Njcm9sbExlZnQgIT09IGNlbGwucGFyZW50RWxlbWVudC5zY3JvbGxMZWZ0KSB7XHJcblx0XHRcdHRoaXMuc2V0U2Nyb2xsWChjZWxsLnBhcmVudEVsZW1lbnQuc2Nyb2xsTGVmdCwgdHJ1ZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRnZXRDZWxsIChyb3dJbmRleCwgY29sSW5kZXgpIHtcclxuXHRcdGxldCBjZWxsID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1yb3ctaW5kZXg9XCInK3Jvd0luZGV4KydcIl1bZGF0YS1jb2wtaW5kZXg9XCInK2NvbEluZGV4KydcIl0nKTtcclxuXHRcdHJldHVybiBjZWxsO1xyXG5cdH1cclxuXHJcblx0dXBkYXRlQ2VsbCAocm93SW5kZXgsIGNvbEluZGV4KSB7XHJcblx0XHRsZXQgY2VsbCA9IHRoaXMuZ2V0Q2VsbChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cdFx0aWYgKGNlbGwpIHtcclxuXHRcdFx0Ly9DcmVhdGUgY2VsbCBjb250ZW50IHdyYXBwZXIgaWYgbm90IGFueVxyXG5cdFx0XHRsZXQgY2VsbENvbnRlbnQgPSBudWxsO1xyXG5cdFx0XHRpZiAoIWNlbGwuZmlyc3RDaGlsZCB8fCAhY2VsbC5maXJzdENoaWxkLmNsYXNzTGlzdC5jb250YWlucygncGdyaWQtY2VsbC1jb250ZW50JykpIHtcclxuXHRcdFx0XHQvL0NsZWFyIGNlbGxcclxuXHRcdFx0XHRjZWxsLmlubmVySFRNTCA9ICcnO1xyXG5cclxuXHRcdFx0XHQvL0FkZCBuZXcgY2VsbCBjb250ZW50XHJcblx0XHRcdFx0Y2VsbENvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHRcdFx0XHRjZWxsQ29udGVudC5jbGFzc05hbWUgPSAncGdyaWQtY2VsbC1jb250ZW50JztcclxuXHRcdFx0XHRjZWxsLmFwcGVuZENoaWxkKGNlbGxDb250ZW50KTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRjZWxsQ29udGVudCA9IGNlbGwuZmlyc3RDaGlsZDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly9HZXQgZGF0YSB0byBiZSB1cGRhdGVkXHJcblx0XHRcdGxldCBkYXRhID0gdGhpcy5fbW9kZWwuZ2V0RGF0YUF0KHJvd0luZGV4LCBjb2xJbmRleCk7XHJcblxyXG5cdFx0XHQvL0RhdGEgY2FuIGJlIHRyYW5zZm9ybWVkIGJlZm9yZSByZW5kZXJpbmcgdXNpbmcgZGF0YUJlZm9yZVJlbmRlciBleHRlbnNpb25cclxuXHRcdFx0bGV0IGFyZyA9IHtkYXRhOiBkYXRhfTtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5leGVjdXRlRXh0ZW5zaW9uKCdkYXRhQmVmb3JlUmVuZGVyJywgYXJnKTtcclxuXHRcdFx0ZGF0YSA9IGFyZy5kYXRhO1xyXG5cclxuXHRcdFx0Ly9JZiB0aGVyZSdzIGNlbGxVcGRhdGUgZXh0ZW5zaW9uLCB0aGVuIGV4ZWN1dGUgaXQgdG8gdXBkYXRlIHRoZSBjZWxsIGRhdGFcclxuXHRcdFx0Ly9FbHNlIHVzZSBkZWZhdWx0IHdheSB0byBwdXQgdGhlIGRhdGEgZGlyZWN0bHkgdG8gdGhlIGNlbGwgY29udGVudFxyXG5cdFx0XHRsZXQgaGFuZGxlZEJ5RXh0ID0gZmFsc2U7XHJcblx0XHRcdGlmICh0aGlzLl9leHRlbnNpb25zLmhhc0V4dGVuc2lvbignY2VsbFVwZGF0ZScpKSB7XHJcblx0XHRcdFx0YXJnID0ge1xyXG5cdFx0XHRcdFx0ZGF0YSxcclxuXHRcdFx0XHRcdGNlbGwsXHJcblx0XHRcdFx0XHRjZWxsQ29udGVudCxcclxuXHRcdFx0XHRcdHJvd0luZGV4LFxyXG5cdFx0XHRcdFx0Y29sSW5kZXgsXHJcblx0XHRcdFx0XHRyb3dJZDogdGhpcy5fbW9kZWwuZ2V0Um93SWQocm93SW5kZXgpLFxyXG5cdFx0XHRcdFx0ZmllbGQ6IHRoaXMuX21vZGVsLmdldENvbHVtbkZpZWxkKGNvbEluZGV4KSxcclxuXHRcdFx0XHRcdGhhbmRsZWQ6IGZhbHNlXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMuX2V4dGVuc2lvbnMuZXhlY3V0ZUV4dGVuc2lvbignY2VsbFVwZGF0ZScsIGFyZyk7XHJcblx0XHRcdFx0aGFuZGxlZEJ5RXh0ID0gYXJnLmhhbmRsZWQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmICghaGFuZGxlZEJ5RXh0KSB7XHJcblx0XHRcdFx0aWYgKGRhdGEgIT09IHVuZGVmaW5lZCAmJiBkYXRhICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRjZWxsQ29udGVudC5pbm5lckhUTUwgPSBkYXRhO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRjZWxsQ29udGVudC5pbm5lckhUTUwgPSAnJztcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMuX2V4dGVuc2lvbnMuZXhlY3V0ZUV4dGVuc2lvbignY2VsbEFmdGVyVXBkYXRlJywge1xyXG5cdFx0XHRcdGNlbGw6IGNlbGwsXHJcblx0XHRcdFx0cm93SW5kZXg6IHJvd0luZGV4LFxyXG5cdFx0XHRcdGNvbEluZGV4OiBjb2xJbmRleCxcclxuXHRcdFx0XHRkYXRhOiBkYXRhXHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0X2F0dGFjaEhhbmRsZXJzICgpIHtcclxuXHJcblx0XHR0aGlzLl92U2Nyb2xsSGFuZGxlciA9IChlKSA9PiB7XHJcblx0XHRcdHRoaXMuc2V0U2Nyb2xsWShlLnRhcmdldC5zY3JvbGxUb3AsIGZhbHNlKTtcclxuXHRcdH07XHJcblxyXG5cdFx0dGhpcy5faFNjcm9sbEhhbmRsZXIgPSAoZSkgPT4ge1xyXG5cdFx0XHR0aGlzLnNldFNjcm9sbFgoZS50YXJnZXQuc2Nyb2xsTGVmdCwgZmFsc2UpO1xyXG5cdFx0fTtcclxuXHJcblx0XHR0aGlzLl93aGVlbEhhbmRsZXIgPSAoZSkgPT4ge1xyXG5cdFx0XHRsZXQgY3VycmVudFggPSB0aGlzLmdldFNjcm9sbFgoKTtcclxuXHRcdFx0bGV0IGN1cnJlbnRZID0gdGhpcy5nZXRTY3JvbGxZKCk7XHJcblx0XHRcdHRoaXMuc2V0U2Nyb2xsWChjdXJyZW50WCArIGUuZGVsdGFYKTtcclxuXHRcdFx0dGhpcy5zZXRTY3JvbGxZKGN1cnJlbnRZICsgZS5kZWx0YVkpO1xyXG5cdFx0fTtcclxuXHJcblx0XHR0aGlzLl9rZXlEb3duSGFuZGxlciA9IChlKSA9PiB7XHJcblx0XHRcdHRoaXMuX2V4dGVuc2lvbnMuZXhlY3V0ZUV4dGVuc2lvbigna2V5RG93bicsIGUpO1xyXG5cdFx0fTtcclxuXHJcblx0XHR0aGlzLl92U2Nyb2xsLmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMuX3ZTY3JvbGxIYW5kbGVyKTtcclxuXHRcdHRoaXMuX2hTY3JvbGwuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcy5faFNjcm9sbEhhbmRsZXIpO1xyXG5cdFx0dGhpcy5fY29udGVudFBhbmUuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLl93aGVlbEhhbmRsZXIpO1xyXG5cdFx0dGhpcy5fZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fa2V5RG93bkhhbmRsZXIpO1xyXG5cclxuXHR9XHJcblxyXG5cdF9yZXN0dXJlY3R1cmUgKCkge1xyXG5cdFx0dGhpcy5fY29udGVudFBhbmUuc3R5bGUud2lkdGggPSAnY2FsYygxMDAlIC0gJyArIHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4KSc7XHJcblx0XHR0aGlzLl9jb250ZW50UGFuZS5zdHlsZS5oZWlnaHQgPSAnY2FsYygxMDAlIC0gJyArIHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4KSc7XHJcblxyXG5cdFx0bGV0IHRvcEZyZWV6ZVNpemUgPSB0aGlzLl9tb2RlbC5nZXRUb3BGcmVlemVTaXplKCk7XHJcblx0XHRsZXQgYm90dG9tRnJlZXplU2l6ZSA9IHRoaXMuX21vZGVsLmdldEJvdHRvbUZyZWV6ZVNpemUoKTtcclxuXHRcdGxldCBsZWZ0RnJlZXplU2l6ZSA9IHRoaXMuX21vZGVsLmdldExlZnRGcmVlemVTaXplKCk7XHJcblxyXG5cdFx0dGhpcy5fdG9wTGVmdFBhbmUuc3R5bGUubGVmdCA9ICcwcHgnO1xyXG5cdFx0dGhpcy5fdG9wTGVmdFBhbmUuc3R5bGUudG9wID0gJzBweCc7XHJcblx0XHR0aGlzLl90b3BMZWZ0UGFuZS5zdHlsZS53aWR0aCA9IGxlZnRGcmVlemVTaXplICsgJ3B4JztcclxuXHRcdHRoaXMuX3RvcExlZnRQYW5lLnN0eWxlLmhlaWdodCA9IHRvcEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fdG9wUGFuZS5zdHlsZS5sZWZ0ID0gbGVmdEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fdG9wUGFuZS5zdHlsZS50b3AgPSAnMHB4JztcclxuXHRcdHRoaXMuX3RvcFBhbmUuc3R5bGUud2lkdGggPSAnY2FsYygxMDAlIC0gJyArIGxlZnRGcmVlemVTaXplICsgJ3B4KSc7XHJcblx0XHR0aGlzLl90b3BQYW5lLnN0eWxlLmhlaWdodCA9IHRvcEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fbGVmdFBhbmUuc3R5bGUubGVmdCA9ICcwcHgnO1xyXG5cdFx0dGhpcy5fbGVmdFBhbmUuc3R5bGUudG9wID0gdG9wRnJlZXplU2l6ZSArICdweCc7XHJcblx0XHR0aGlzLl9sZWZ0UGFuZS5zdHlsZS53aWR0aCA9IGxlZnRGcmVlemVTaXplICsgJ3B4JztcclxuXHRcdHRoaXMuX2xlZnRQYW5lLnN0eWxlLmhlaWdodCA9ICdjYWxjKDEwMCUgLSAnICsgKHRvcEZyZWV6ZVNpemUgKyBib3R0b21GcmVlemVTaXplKSArICdweCknO1xyXG5cdFx0dGhpcy5fY2VudGVyUGFuZS5zdHlsZS5sZWZ0ID0gbGVmdEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fY2VudGVyUGFuZS5zdHlsZS50b3AgPSB0b3BGcmVlemVTaXplICsgJ3B4JztcclxuXHRcdHRoaXMuX2NlbnRlclBhbmUuc3R5bGUud2lkdGggPSAnY2FsYygxMDAlIC0gJyArIGxlZnRGcmVlemVTaXplICsgJ3B4KSc7XHJcblx0XHR0aGlzLl9jZW50ZXJQYW5lLnN0eWxlLmhlaWdodCA9ICdjYWxjKDEwMCUgLSAnICsgKHRvcEZyZWV6ZVNpemUgKyBib3R0b21GcmVlemVTaXplKSArICdweCknO1xyXG5cdFx0dGhpcy5fYm90dG9tTGVmdFBhbmUuc3R5bGUubGVmdCA9ICcwcHgnO1xyXG5cdFx0dGhpcy5fYm90dG9tTGVmdFBhbmUuc3R5bGUuYm90dG9tID0gJzBweCc7XHJcblx0XHR0aGlzLl9ib3R0b21MZWZ0UGFuZS5zdHlsZS53aWR0aCA9IGxlZnRGcmVlemVTaXplICsgJ3B4JztcclxuXHRcdHRoaXMuX2JvdHRvbUxlZnRQYW5lLnN0eWxlLmhlaWdodCA9IGJvdHRvbUZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fYm90dG9tUGFuZS5zdHlsZS5sZWZ0ID0gbGVmdEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fYm90dG9tUGFuZS5zdHlsZS5ib3R0b20gPSAnMHB4JztcclxuXHRcdHRoaXMuX2JvdHRvbVBhbmUuc3R5bGUud2lkdGggPSAnY2FsYygxMDAlIC0gJyArIGxlZnRGcmVlemVTaXplICsgJ3B4KSc7XHJcblx0XHR0aGlzLl9ib3R0b21QYW5lLnN0eWxlLmhlaWdodCA9IGJvdHRvbUZyZWV6ZVNpemUgKyAncHgnO1xyXG5cclxuXHRcdHRoaXMuX3JlbmRlckNlbGxzKCk7XHJcblx0XHR0aGlzLl91cGRhdGVTY3JvbGxCYXIoKTtcclxuXHR9XHJcblxyXG5cdF9vYnNlcnZlU2l6ZSAoKSB7XHJcblx0XHR0aGlzLl9yZXNpemVPYnNlcnZlciA9IG5ldyBSZXNpemVPYnNlcnZlcigoZW50cmllcywgb2JzZXJ2ZXIpID0+IHtcclxuXHRcdFx0dGhpcy5fdXBkYXRlU2Nyb2xsQmFyKCk7XHJcblx0XHR9KTtcclxuXHRcdHRoaXMuX3Jlc2l6ZU9ic2VydmVyLm9ic2VydmUodGhpcy5fZWxlbWVudCk7XHJcblx0fVxyXG5cclxuXHRfdXBkYXRlU2Nyb2xsQmFyICgpIHtcclxuXHRcdGxldCB0b3RhbFdpZHRoID0gdGhpcy5fbW9kZWwuZ2V0VG90YWxXaWR0aCgpO1xyXG5cdFx0bGV0IHRvdGFsSGVpZ2h0ID0gdGhpcy5fbW9kZWwuZ2V0VG90YWxIZWlnaHQoKTtcclxuXHRcdHRoaXMuX2hTY3JvbGxUaHVtYi5zdHlsZS53aWR0aCA9IHRvdGFsV2lkdGggKyAncHgnO1xyXG5cdFx0dGhpcy5fdlNjcm9sbFRodW1iLnN0eWxlLmhlaWdodCA9IHRvdGFsSGVpZ2h0ICsgJ3B4JztcclxuXHJcblx0XHRsZXQgZ3JpZFJlY3QgPSB0aGlzLl9lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG5cdFx0bGV0IHNjcm9sbEJhclN0YXRlID0gdGhpcy5fbW9kZWwuZGV0ZXJtaW5lU2Nyb2xsYmFyU3RhdGUoZ3JpZFJlY3Qud2lkdGgsIGdyaWRSZWN0LmhlaWdodCwgdGhpcy5fc2Nyb2xsV2lkdGgpO1xyXG5cclxuXHRcdHN3aXRjaCAoc2Nyb2xsQmFyU3RhdGUpIHtcclxuXHRcdFx0Y2FzZSAnbic6XHJcblx0XHRcdFx0dGhpcy5faFNjcm9sbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cdFx0XHRcdHRoaXMuX3ZTY3JvbGwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHRcdFx0XHR0aGlzLl9jb250ZW50UGFuZS5zdHlsZS53aWR0aCA9ICcxMDAlJztcclxuXHRcdFx0XHR0aGlzLl9jb250ZW50UGFuZS5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGNhc2UgJ2gnOlxyXG5cdFx0XHRcdHRoaXMuX2hTY3JvbGwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcblx0XHRcdFx0dGhpcy5fdlNjcm9sbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cdFx0XHRcdHRoaXMuX2hTY3JvbGwuc3R5bGUud2lkdGggPSAnMTAwJSc7XHJcblx0XHRcdFx0dGhpcy5fY29udGVudFBhbmUuc3R5bGUud2lkdGggPSAnMTAwJSc7XHJcblx0XHRcdFx0dGhpcy5fY29udGVudFBhbmUuc3R5bGUuaGVpZ2h0ID0gJ2NhbGMoMTAwJSAtICcgKyB0aGlzLl9zY3JvbGxXaWR0aCArICdweCknO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICd2JzpcclxuXHRcdFx0XHR0aGlzLl9oU2Nyb2xsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0XHRcdFx0dGhpcy5fdlNjcm9sbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuXHRcdFx0XHR0aGlzLl92U2Nyb2xsLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcclxuXHRcdFx0XHR0aGlzLl9jb250ZW50UGFuZS5zdHlsZS53aWR0aCA9ICdjYWxjKDEwMCUgLSAnICsgdGhpcy5fc2Nyb2xsV2lkdGggKyAncHgpJztcclxuXHRcdFx0XHR0aGlzLl9jb250ZW50UGFuZS5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGNhc2UgJ2InOlxyXG5cdFx0XHRcdHRoaXMuX2hTY3JvbGwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcblx0XHRcdFx0dGhpcy5fdlNjcm9sbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuXHRcdFx0XHR0aGlzLl9oU2Nyb2xsLnN0eWxlLndpZHRoID0gJ2NhbGMoMTAwJSAtICcgKyB0aGlzLl9zY3JvbGxXaWR0aCArICdweCknO1xyXG5cdFx0XHRcdHRoaXMuX3ZTY3JvbGwuc3R5bGUuaGVpZ2h0ID0gJ2NhbGMoMTAwJSAtICcgKyB0aGlzLl9zY3JvbGxXaWR0aCArICdweCknO1xyXG5cdFx0XHRcdHRoaXMuX2NvbnRlbnRQYW5lLnN0eWxlLndpZHRoID0gJ2NhbGMoMTAwJSAtICcgKyB0aGlzLl9zY3JvbGxXaWR0aCArICdweCknO1xyXG5cdFx0XHRcdHRoaXMuX2NvbnRlbnRQYW5lLnN0eWxlLmhlaWdodCA9ICdjYWxjKDEwMCUgLSAnICsgdGhpcy5fc2Nyb2xsV2lkdGggKyAncHgpJztcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdF9yZW5kZXJDZWxscyAoKSB7XHJcblx0XHRsZXQgdG9wRnJlZXplID0gdGhpcy5fbW9kZWwuZ2V0VG9wRnJlZXplUm93cygpO1xyXG5cdFx0bGV0IGxlZnRGcmVlemUgPSB0aGlzLl9tb2RlbC5nZXRMZWZ0RnJlZXplUm93cygpO1xyXG5cdFx0bGV0IGJvdHRvbUZyZWV6ZSA9IHRoaXMuX21vZGVsLmdldEJvdHRvbUZyZWV6ZVJvd3MoKTtcclxuXHRcdGxldCByb3dDb3VudCA9IHRoaXMuX21vZGVsLmdldFJvd0NvdW50KCk7XHJcblx0XHRsZXQgY29sdW1uQ291bnQgPSB0aGlzLl9tb2RlbC5nZXRDb2x1bW5Db3VudCgpO1xyXG5cdFx0bGV0IHRvcFJ1bm5lciA9IDA7XHJcblx0XHRsZXQgbGVmdFJ1bm5lciA9IDA7XHJcblx0XHRsZXQgY29sV2lkdGggPSBbXTtcclxuXHJcblx0XHQvL1JlbmRlciB0b3Agcm93c1xyXG5cdFx0dG9wUnVubmVyID0gMDtcclxuXHRcdGZvciAobGV0IGo9MDsgajx0b3BGcmVlemU7IGorKykge1xyXG5cdFx0XHRsZXQgcm93SGVpZ2h0ID0gdGhpcy5fbW9kZWwuZ2V0Um93SGVpZ2h0KGopO1xyXG5cdFx0XHQvL1JlbmRlciB0b3AgbGVmdCBjZWxsc1xyXG5cdFx0XHRsZWZ0UnVubmVyID0gMDtcclxuXHRcdFx0Zm9yIChsZXQgaT0wOyBpPGxlZnRGcmVlemU7IGkrKykge1xyXG5cdFx0XHRcdGNvbFdpZHRoW2ldID0gdGhpcy5fbW9kZWwuZ2V0Q29sdW1uV2lkdGgoaSk7XHJcblx0XHRcdFx0dGhpcy5fcmVuZGVyQ2VsbChqLCBpLCB0aGlzLl90b3BMZWZ0SW5uZXIsIGxlZnRSdW5uZXIsIHRvcFJ1bm5lciwgY29sV2lkdGhbaV0sIHJvd0hlaWdodCk7XHJcblx0XHRcdFx0bGVmdFJ1bm5lciArPSBjb2xXaWR0aFtpXTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvL1JlbmRlciB0b3AgY2VsbHNcclxuXHRcdFx0bGVmdFJ1bm5lciA9IDA7XHJcblx0XHRcdGZvciAobGV0IGk9bGVmdEZyZWV6ZTsgaTxjb2x1bW5Db3VudDsgaSsrKSB7XHJcblx0XHRcdFx0Y29sV2lkdGhbaV0gPSB0aGlzLl9tb2RlbC5nZXRDb2x1bW5XaWR0aChpKTtcclxuXHRcdFx0XHR0aGlzLl9yZW5kZXJDZWxsKGosIGksIHRoaXMuX3RvcElubmVyLCBsZWZ0UnVubmVyLCB0b3BSdW5uZXIsIGNvbFdpZHRoW2ldLCByb3dIZWlnaHQpO1xyXG5cdFx0XHRcdGxlZnRSdW5uZXIgKz0gY29sV2lkdGhbaV07XHJcblx0XHRcdH1cclxuXHRcdFx0dG9wUnVubmVyICs9IHJvd0hlaWdodDtcclxuXHRcdH1cclxuXHJcblx0XHQvL1JlbmRlciBtaWRkbGUgcm93c1xyXG5cdFx0dG9wUnVubmVyID0gMDtcclxuXHRcdGZvciAobGV0IGo9dG9wRnJlZXplOyBqPChyb3dDb3VudC1ib3R0b21GcmVlemUpOyBqKyspIHtcclxuXHRcdFx0bGV0IHJvd0hlaWdodCA9IHRoaXMuX21vZGVsLmdldFJvd0hlaWdodChqKTtcclxuXHRcdFx0Ly9SZW5kZXIgbGVmdCBjZWxsc1xyXG5cdFx0XHRsZWZ0UnVubmVyID0gMDtcclxuXHRcdFx0Zm9yIChsZXQgaT0wOyBpPGxlZnRGcmVlemU7IGkrKykge1xyXG5cdFx0XHRcdHRoaXMuX3JlbmRlckNlbGwoaiwgaSwgdGhpcy5fbGVmdElubmVyLCBsZWZ0UnVubmVyLCB0b3BSdW5uZXIsIGNvbFdpZHRoW2ldLCByb3dIZWlnaHQpO1xyXG5cdFx0XHRcdGxlZnRSdW5uZXIgKz0gY29sV2lkdGhbaV07XHJcblx0XHRcdH1cclxuXHRcdFx0Ly9SZW5kZXIgY2VudGVyIGNlbGxzXHJcblx0XHRcdGxlZnRSdW5uZXIgPSAwO1xyXG5cdFx0XHRmb3IgKGxldCBpPWxlZnRGcmVlemU7IGk8Y29sdW1uQ291bnQ7IGkrKykge1xyXG5cdFx0XHRcdHRoaXMuX3JlbmRlckNlbGwoaiwgaSwgdGhpcy5fY2VudGVySW5uZXIsIGxlZnRSdW5uZXIsIHRvcFJ1bm5lciwgY29sV2lkdGhbaV0sIHJvd0hlaWdodCk7XHJcblx0XHRcdFx0bGVmdFJ1bm5lciArPSBjb2xXaWR0aFtpXTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0b3BSdW5uZXIgKz0gcm93SGVpZ2h0O1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vUmVuZGVyIGJvdHRvbSByb3dzXHJcblx0XHR0b3BSdW5uZXIgPSAwO1xyXG5cdFx0Zm9yIChsZXQgaj0ocm93Q291bnQtYm90dG9tRnJlZXplKTsgajxyb3dDb3VudDsgaisrKSB7XHJcblx0XHRcdGxldCByb3dIZWlnaHQgPSB0aGlzLl9tb2RlbC5nZXRSb3dIZWlnaHQoaik7XHJcblx0XHRcdC8vUmVuZGVyIGxlZnQgY2VsbHNcclxuXHRcdFx0bGVmdFJ1bm5lciA9IDA7XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTxsZWZ0RnJlZXplOyBpKyspIHtcclxuXHRcdFx0XHR0aGlzLl9yZW5kZXJDZWxsKGosIGksIHRoaXMuX2JvdHRvbUxlZnRJbm5lciwgbGVmdFJ1bm5lciwgdG9wUnVubmVyLCBjb2xXaWR0aFtpXSwgcm93SGVpZ2h0KTtcclxuXHRcdFx0XHRsZWZ0UnVubmVyICs9IGNvbFdpZHRoW2ldO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vUmVuZGVyIGNlbnRlciBjZWxsc1xyXG5cdFx0XHRsZWZ0UnVubmVyID0gMDtcclxuXHRcdFx0Zm9yIChsZXQgaT1sZWZ0RnJlZXplOyBpPGNvbHVtbkNvdW50OyBpKyspIHtcclxuXHRcdFx0XHR0aGlzLl9yZW5kZXJDZWxsKGosIGksIHRoaXMuX2JvdHRvbUlubmVyLCBsZWZ0UnVubmVyLCB0b3BSdW5uZXIsIGNvbFdpZHRoW2ldLCByb3dIZWlnaHQpO1xyXG5cdFx0XHRcdGxlZnRSdW5uZXIgKz0gY29sV2lkdGhbaV07XHJcblx0XHRcdH1cclxuXHRcdFx0dG9wUnVubmVyICs9IHJvd0hlaWdodDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdF9yZW5kZXJDZWxsIChyb3dJbmRleCwgY29sSW5kZXgsIHBhbmUsIHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcclxuXHRcdGxldCBkYXRhID0gdGhpcy5fbW9kZWwuZ2V0RGF0YUF0KHJvd0luZGV4LCBjb2xJbmRleCk7XHJcblxyXG5cdFx0Ly9EYXRhIGNhbiBiZSB0cmFuc2Zvcm1lZCBiZWZvcmUgcmVuZGVyaW5nIHVzaW5nIGRhdGFCZWZvcmVSZW5kZXIgZXh0ZW5zaW9uXHJcblx0XHRsZXQgYXJnID0ge2RhdGE6IGRhdGF9O1xyXG5cdFx0dGhpcy5fZXh0ZW5zaW9ucy5leGVjdXRlRXh0ZW5zaW9uKCdkYXRhQmVmb3JlUmVuZGVyJywgYXJnKTtcclxuXHRcdGRhdGEgPSBhcmcuZGF0YTtcclxuXHJcblx0XHRsZXQgY2VsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cdFx0bGV0IGNlbGxDbGFzc2VzID0gdGhpcy5fbW9kZWwuZ2V0Q2VsbENsYXNzZXMocm93SW5kZXgsIGNvbEluZGV4KTtcclxuXHRcdGNlbGwuY2xhc3NOYW1lID0gJ3BncmlkLWNlbGwgJyArIGNlbGxDbGFzc2VzLmpvaW4oJyAnKTtcclxuXHRcdGNlbGwuc3R5bGUubGVmdCA9IHggKyAncHgnO1xyXG5cdFx0Y2VsbC5zdHlsZS50b3AgPSB5ICsgJ3B4JztcclxuXHRcdGNlbGwuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XHJcblx0XHRjZWxsLnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XHJcblx0XHRjZWxsLmRhdGFzZXQucm93SW5kZXggPSByb3dJbmRleDtcclxuXHRcdGNlbGwuZGF0YXNldC5jb2xJbmRleCA9IGNvbEluZGV4O1xyXG5cclxuXHRcdGxldCBjZWxsQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cdFx0Y2VsbENvbnRlbnQuY2xhc3NOYW1lID0gJ3BncmlkLWNlbGwtY29udGVudCc7XHJcblx0XHRjZWxsLmFwcGVuZENoaWxkKGNlbGxDb250ZW50KTtcclxuXHRcdHBhbmUuYXBwZW5kQ2hpbGQoY2VsbCk7XHJcblxyXG5cdFx0bGV0IGV2ZW50QXJnID0ge1xyXG5cdFx0XHRjZWxsLFxyXG5cdFx0XHRjZWxsQ29udGVudCxcclxuXHRcdFx0cm93SW5kZXgsXHJcblx0XHRcdGNvbEluZGV4LFxyXG5cdFx0XHRkYXRhLFxyXG5cdFx0XHRyb3dJZDogdGhpcy5fbW9kZWwuZ2V0Um93SWQocm93SW5kZXgpLFxyXG5cdFx0XHRmaWVsZDogdGhpcy5fbW9kZWwuZ2V0Q29sdW1uRmllbGQoY29sSW5kZXgpLFxyXG5cdFx0XHRoYW5kbGVkOiBmYWxzZVxyXG5cdFx0fTtcclxuXHJcblx0XHQvL0lmIHRoZXJlJ3MgY2VsbFJlbmRlciBleHRlbnNpb24sIHVzZSBjZWxsUmVuZGVyIGV4dGVuc2lvbiB0byByZW5kZXIgdGhlIGNlbGxcclxuXHRcdC8vRWxzZSBqdXN0IHNldCB0aGUgZGF0YSB0byB0aGUgY2VsbENvbnRlbnQgZGlyZWN0bHlcclxuXHRcdGxldCBoYW5kbGVkQnlFeHQgPSBmYWxzZTtcclxuXHRcdGlmICh0aGlzLl9leHRlbnNpb25zLmhhc0V4dGVuc2lvbignY2VsbFJlbmRlcicpKSB7XHJcblx0XHRcdHRoaXMuX2V4dGVuc2lvbnMuZXhlY3V0ZUV4dGVuc2lvbignY2VsbFJlbmRlcicsIGV2ZW50QXJnKTtcclxuXHRcdFx0aGFuZGxlZEJ5RXh0ID0gZXZlbnRBcmcuaGFuZGxlZDtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIWhhbmRsZWRCeUV4dCkge1xyXG5cdFx0XHRpZiAoZGF0YSAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0Y2VsbENvbnRlbnQuaW5uZXJIVE1MID0gZGF0YTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX2V4dGVuc2lvbnMuZXhlY3V0ZUV4dGVuc2lvbignY2VsbEFmdGVyUmVuZGVyJywgZXZlbnRBcmcpO1xyXG5cdFx0dGhpcy5fZXh0ZW5zaW9ucy5leGVjdXRlRXh0ZW5zaW9uKCdjZWxsQWZ0ZXJVcGRhdGUnLCBldmVudEFyZyk7XHJcblxyXG5cdFx0ZXZlbnRBcmcgPSBudWxsO1xyXG5cdH1cclxuXHJcblx0X21lYXN1cmVTY3JvbGxiYXJXaWR0aCAoKSB7XHJcblx0XHR2YXIgaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcblx0XHRpbm5lci5zdHlsZS53aWR0aCA9ICcxMDAlJztcclxuXHRcdGlubmVyLnN0eWxlLmhlaWdodCA9ICcyMDBweCc7XHJcblx0XHR2YXIgb3V0bW9zdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cdFx0b3V0bW9zdC5jbGFzc05hbWUgPSAncGdyaWQnO1xyXG5cdFx0dmFyIG91dGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRvdXRlci5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcblx0XHRvdXRlci5zdHlsZS50b3AgPSAnMHB4JztcclxuXHRcdG91dGVyLnN0eWxlLmxlZnQgPSAnMHB4JztcclxuXHRcdG91dGVyLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcclxuXHRcdG91dGVyLnN0eWxlLndpZHRoID0gJzIwMHB4JztcclxuXHRcdG91dGVyLnN0eWxlLmhlaWdodCA9ICcxNTBweCc7XHJcblx0XHRvdXRlci5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xyXG5cdFx0b3V0ZXIuYXBwZW5kQ2hpbGQoaW5uZXIpO1xyXG5cdFx0b3V0bW9zdC5hcHBlbmRDaGlsZChvdXRlcik7XHJcblx0XHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG91dG1vc3QpO1xyXG5cdFx0dmFyIHcxID0gaW5uZXIub2Zmc2V0V2lkdGg7XHJcblx0XHRvdXRlci5zdHlsZS5vdmVyZmxvdyA9ICdzY3JvbGwnO1xyXG5cdFx0dmFyIHcyID0gaW5uZXIub2Zmc2V0V2lkdGg7XHJcblx0XHRpZiAodzEgPT0gdzIpIHcyID0gb3V0ZXIuY2xpZW50V2lkdGg7XHJcblx0XHRkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkIChvdXRtb3N0KTtcclxuXHRcdHJldHVybiAodzEgLSB3MikgKyAodGhpcy5fZGV0ZWN0SUUoKT8xOjApO1xyXG5cdH1cclxuXHJcblxyXG5cdF9kZXRlY3RJRSAoKSB7XHJcblx0ICB2YXIgdWEgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudDtcclxuXHQgIHZhciBtc2llID0gdWEuaW5kZXhPZignTVNJRSAnKTtcclxuXHQgIGlmIChtc2llID4gMCkge1xyXG5cdCAgICAvLyBJRSAxMCBvciBvbGRlciA9PiByZXR1cm4gdmVyc2lvbiBudW1iZXJcclxuXHQgICAgcmV0dXJuIHBhcnNlSW50KHVhLnN1YnN0cmluZyhtc2llICsgNSwgdWEuaW5kZXhPZignLicsIG1zaWUpKSwgMTApO1xyXG5cdCAgfVxyXG5cclxuXHQgIHZhciB0cmlkZW50ID0gdWEuaW5kZXhPZignVHJpZGVudC8nKTtcclxuXHQgIGlmICh0cmlkZW50ID4gMCkge1xyXG5cdCAgICAvLyBJRSAxMSA9PiByZXR1cm4gdmVyc2lvbiBudW1iZXJcclxuXHQgICAgdmFyIHJ2ID0gdWEuaW5kZXhPZigncnY6Jyk7XHJcblx0ICAgIHJldHVybiBwYXJzZUludCh1YS5zdWJzdHJpbmcocnYgKyAzLCB1YS5pbmRleE9mKCcuJywgcnYpKSwgMTApO1xyXG5cdCAgfVxyXG5cclxuXHQgIHZhciBlZGdlID0gdWEuaW5kZXhPZignRWRnZS8nKTtcclxuXHQgIGlmIChlZGdlID4gMCkge1xyXG5cdCAgICAvLyBFZGdlIChJRSAxMispID0+IHJldHVybiB2ZXJzaW9uIG51bWJlclxyXG5cdCAgICByZXR1cm4gcGFyc2VJbnQodWEuc3Vic3RyaW5nKGVkZ2UgKyA1LCB1YS5pbmRleE9mKCcuJywgZWRnZSkpLCAxMCk7XHJcblx0ICB9XHJcblx0ICAvLyBvdGhlciBicm93c2VyXHJcblx0ICByZXR1cm4gZmFsc2U7XHJcblx0fVxyXG59IiwiaW1wb3J0IHsgUEdyaWQgfSBmcm9tICcuL2dyaWQvZ3JpZCc7XHJcblxyXG53aW5kb3cuUEdyaWQgPSBQR3JpZDtcclxuXHJcbi8vIFBvbHlmaWxsIC0gRWxlbWVudC5zY3JvbGxJbnRvVmlld0lmTmVlZGVkXHJcblxyXG5pZiAoIUVsZW1lbnQucHJvdG90eXBlLnNjcm9sbEludG9WaWV3SWZOZWVkZWQpIHtcclxuICAgIEVsZW1lbnQucHJvdG90eXBlLnNjcm9sbEludG9WaWV3SWZOZWVkZWQgPSBmdW5jdGlvbiAoY2VudGVySWZOZWVkZWQpIHtcclxuICAgICAgICBjZW50ZXJJZk5lZWRlZCA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDAgPyB0cnVlIDogISFjZW50ZXJJZk5lZWRlZDtcclxuXHJcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50Tm9kZSxcclxuICAgICAgICAgICAgcGFyZW50Q29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHBhcmVudCwgbnVsbCksXHJcbiAgICAgICAgICAgIHBhcmVudEJvcmRlclRvcFdpZHRoID0gcGFyc2VJbnQocGFyZW50Q29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdib3JkZXItdG9wLXdpZHRoJykpLFxyXG4gICAgICAgICAgICBwYXJlbnRCb3JkZXJMZWZ0V2lkdGggPSBwYXJzZUludChwYXJlbnRDb21wdXRlZFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2JvcmRlci1sZWZ0LXdpZHRoJykpLFxyXG4gICAgICAgICAgICBvdmVyVG9wID0gdGhpcy5vZmZzZXRUb3AgLSBwYXJlbnQub2Zmc2V0VG9wIDwgcGFyZW50LnNjcm9sbFRvcCxcclxuICAgICAgICAgICAgb3ZlckJvdHRvbSA9ICh0aGlzLm9mZnNldFRvcCAtIHBhcmVudC5vZmZzZXRUb3AgKyB0aGlzLmNsaWVudEhlaWdodCAtIHBhcmVudEJvcmRlclRvcFdpZHRoKSA+IChwYXJlbnQuc2Nyb2xsVG9wICsgcGFyZW50LmNsaWVudEhlaWdodCksXHJcbiAgICAgICAgICAgIG92ZXJMZWZ0ID0gdGhpcy5vZmZzZXRMZWZ0IC0gcGFyZW50Lm9mZnNldExlZnQgPCBwYXJlbnQuc2Nyb2xsTGVmdCxcclxuICAgICAgICAgICAgb3ZlclJpZ2h0ID0gKHRoaXMub2Zmc2V0TGVmdCAtIHBhcmVudC5vZmZzZXRMZWZ0ICsgdGhpcy5jbGllbnRXaWR0aCAtIHBhcmVudEJvcmRlckxlZnRXaWR0aCkgPiAocGFyZW50LnNjcm9sbExlZnQgKyBwYXJlbnQuY2xpZW50V2lkdGgpLFxyXG4gICAgICAgICAgICBhbGlnbldpdGhUb3AgPSBvdmVyVG9wICYmICFvdmVyQm90dG9tO1xyXG5cclxuICAgICAgICBpZiAoKG92ZXJUb3AgfHwgb3ZlckJvdHRvbSkgJiYgY2VudGVySWZOZWVkZWQpIHtcclxuICAgICAgICAgICAgcGFyZW50LnNjcm9sbFRvcCA9IHRoaXMub2Zmc2V0VG9wIC0gcGFyZW50Lm9mZnNldFRvcCAtIHBhcmVudC5jbGllbnRIZWlnaHQgLyAyIC0gcGFyZW50Qm9yZGVyVG9wV2lkdGggKyB0aGlzLmNsaWVudEhlaWdodCAvIDI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoKG92ZXJMZWZ0IHx8IG92ZXJSaWdodCkgJiYgY2VudGVySWZOZWVkZWQpIHtcclxuICAgICAgICAgICAgcGFyZW50LnNjcm9sbExlZnQgPSB0aGlzLm9mZnNldExlZnQgLSBwYXJlbnQub2Zmc2V0TGVmdCAtIHBhcmVudC5jbGllbnRXaWR0aCAvIDIgLSBwYXJlbnRCb3JkZXJMZWZ0V2lkdGggKyB0aGlzLmNsaWVudFdpZHRoIC8gMjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICgob3ZlclRvcCB8fCBvdmVyQm90dG9tIHx8IG92ZXJMZWZ0IHx8IG92ZXJSaWdodCkgJiYgIWNlbnRlcklmTmVlZGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsSW50b1ZpZXcoYWxpZ25XaXRoVG9wKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59Il19

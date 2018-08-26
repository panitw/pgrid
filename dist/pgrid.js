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
        key: 'getAllData',
        value: function getAllData() {
            return this._data;
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
            this._rid.splice(index, 1);
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
            this._rid.splice(index, 1);
        }
    }, {
        key: 'removeAllRows',
        value: function removeAllRows() {
            this._rid = [];
            this._rowMap = {};
            this._data = [];
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

},{"../grid/event":8}],3:[function(require,module,exports){
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
			this.scrollHandler = this.scrollHandler.bind(this);
			this._grid.view.listen('vscroll', this.scrollHandler);
			this._grid.view.listen('hscroll', this.scrollHandler);
		}
	}, {
		key: 'scrollHandler',
		value: function scrollHandler() {
			this._detachEditor();
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

				//Create float editor container
				var cellBound = cell.getBoundingClientRect();
				var scrollingElement = document.scrollingElement || document.documentElement;
				var scrollTop = scrollingElement.scrollTop;
				var scrollLeft = scrollingElement.scrollLeft;
				this._editorContainer = document.createElement('div');
				this._editorContainer.style.position = 'absolute';
				this._editorContainer.style.top = cellBound.top + scrollTop + 'px';
				this._editorContainer.style.left = cellBound.left + scrollLeft + 'px';
				this._editorContainer.style.width = cellBound.width + 'px';
				this._editorContainer.style.height = cellBound.height + 'px';
				document.body.appendChild(this._editorContainer);

				//Check if there's any custom editor
				var customEditor = this._grid.model.getCascadedCellProp(actualCell.dataset.rowIndex, actualCell.dataset.colIndex, 'editor');
				if (customEditor && customEditor.attach) {
					customEditor.attach(this._editorContainer, data, this._done.bind(this));
				} else {
					this._attachEditor(this._editorContainer, data, this._done.bind(this));
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
				this._inputElement.style.width = cellBound.width + 'px';
				this._inputElement.style.height = cellBound.height + 'px';
				this._inputElement.className = 'pgrid-cell-text-editor';

				cell.appendChild(this._inputElement);

				this._inputElement.focus();
				this._inputElement.select();

				this._arrowKeyLocked = false;

				this._keydownHandler = function (e) {
					switch (e.keyCode) {
						case 13:
							//Enter
							//Prevent double done() call
							if (_this2._inputElement) {
								_this2._inputElement.removeEventListener('blur', _this2._blurHandler);
							}
							done(e.target.value);
							e.stopPropagation();
							e.preventDefault();
							break;
						case 27:
							//ESC
							//Prevent double done() call
							if (_this2._inputElement) {
								_this2._inputElement.removeEventListener('blur', _this2._blurHandler);
							}
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

				this._blurHandler = function (e) {
					done(e.target.value);
				};

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
			if (this._editorContainer) {
				//Double checking to fix wiered bug
				this._editorContainer.parentElement.removeChild(this._editorContainer);
				this._editorContainer = null;
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
		}
	}, {
		key: '_done',
		value: function _done(result, multiFields) {
			this._detachEditor();
			if (result !== undefined) {
				if (!multiFields) {
					this._grid.model.setDataAt(this._editingRow, this._editingCol, result);
				} else {
					var rowId = this._grid.model.getRowId(this._editingRow);
					if (rowId) {
						for (var prop in result) {
							if (result.hasOwnProperty(prop)) {
								this._grid.data.setData(rowId, prop, result[prop]);
							}
						}
					}
				}
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
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FormatterExtension = exports.FormatterExtension = function () {
    function FormatterExtension() {
        _classCallCheck(this, FormatterExtension);
    }

    _createClass(FormatterExtension, [{
        key: "init",
        value: function init(grid, config) {
            this._grid = grid;
            this._config = config;
        }
    }, {
        key: "cellRender",
        value: function cellRender(e) {
            var model = this._grid.model.getColumnModel(e.colIndex);
            if (model && model.formatter && model.formatter.render) {
                var newEvent = Object.assign({}, e);
                newEvent.colModel = model;
                model.formatter.render(newEvent);
                e.handled = true;
            }
        }
    }, {
        key: "cellUpdate",
        value: function cellUpdate(e) {
            var model = this._grid.model.getColumnModel(e.colIndex);
            if (model && model.formatter && model.formatter.update) {
                var newEvent = Object.assign({}, e);
                newEvent.colModel = model;
                model.formatter.update(newEvent);
                e.handled = true;
            }
        }
    }]);

    return FormatterExtension;
}();

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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
			this._handlers[eventName].push(handler);
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

},{}],9:[function(require,module,exports){
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
			cellEditableCheck: [],
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

},{}],10:[function(require,module,exports){
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

var _formatter = require('../extensions/formatter');

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
		_this._model = new _model.Model(_this._config, _this._data, _this._extensions);
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
		if (_this._config.columnFormatter) {
			_this._extensions.loadExtension(new _formatter.FormatterExtension());
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

},{"../data/table":2,"../extensions/copypaste":3,"../extensions/editor":4,"../extensions/formatter":5,"../extensions/selection":6,"../extensions/view-updater":7,"./event":8,"./extension":9,"./model":11,"./state":12,"./utils":13,"./view":14}],11:[function(require,module,exports){
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

	function Model(config, data, extension) {
		_classCallCheck(this, Model);

		var _this = _possibleConstructorReturn(this, (Model.__proto__ || Object.getPrototypeOf(Model)).call(this));

		_this._config = config;
		_this._data = data;
		_this._extension = extension;

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
			var result = false;

			if (rowModel && rowModel.editable || colModel && colModel.editable || cellModel && cellModel.editable) {
				if (rowModel && rowModel.editable === false || colModel && colModel.editable === false || cellModel && cellModel.editable === false) {
					result = false;
				} else {
					result = true;
				}
			}

			//Editibility can be overridden by extension
			if (this._extension.hasExtension('cellEditableCheck')) {

				//Can Edit Overriding
				var rowId = this.getRowId(rowIndex);
				var field = this.getColumnField(colIndex);
				var dataRow = this._data.getRowData(rowId);
				var e = {
					rowIndex: rowIndex,
					colIndex: colIndex,
					rowId: rowId,
					field: field,
					dataRow: dataRow,
					rowModel: rowModel,
					colModel: colModel,
					cellModel: cellModel,
					canEdit: result
				};
				this._extension.executeExtension('cellEditableCheck', e);
				result = e.canEdit;
			}

			return result;
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
				return this._data.getRowId(rowIndex - this._config.headerRowCount);
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

},{"./event":8}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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
				_this2.dispatch('vscroll', e);
			};

			this._hScrollHandler = function (e) {
				_this2.setScrollX(e.target.scrollLeft, false);
				_this2.dispatch('hscroll', e);
			};

			this._wheelHandler = function (e) {
				var currentX = _this2.getScrollX();
				var currentY = _this2.getScrollY();
				_this2.setScrollX(currentX + e.deltaX);
				_this2.setScrollY(currentY + e.deltaY);
				if (e.deltaX !== 0) {
					_this2.dispatch('hscroll', e);
				}
				if (e.deltaY !== 0) {
					_this2.dispatch('vscroll', e);
				}
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

},{"./event":8,"resize-observer-polyfill":1}],15:[function(require,module,exports){
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

},{"./grid/grid":10}]},{},[15])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcmVzaXplLW9ic2VydmVyLXBvbHlmaWxsL2Rpc3QvUmVzaXplT2JzZXJ2ZXIuanMiLCJzcmNcXGRhdGFcXHRhYmxlLmpzIiwic3JjXFxleHRlbnNpb25zXFxjb3B5cGFzdGUuanMiLCJzcmNcXGV4dGVuc2lvbnNcXGVkaXRvci5qcyIsInNyY1xcZXh0ZW5zaW9uc1xcZm9ybWF0dGVyLmpzIiwic3JjXFxleHRlbnNpb25zXFxzZWxlY3Rpb24uanMiLCJzcmNcXGV4dGVuc2lvbnNcXHZpZXctdXBkYXRlci5qcyIsInNyY1xcZ3JpZFxcZXZlbnQuanMiLCJzcmNcXGdyaWRcXGV4dGVuc2lvbi5qcyIsInNyY1xcZ3JpZFxcZ3JpZC5qcyIsInNyY1xcZ3JpZFxcbW9kZWwuanMiLCJzcmNcXGdyaWRcXHN0YXRlLmpzIiwic3JjXFxncmlkXFx1dGlscy5qcyIsInNyY1xcZ3JpZFxcdmlldy5qcyIsInNyY1xcbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7OztBQ3hnQ0E7Ozs7Ozs7O0lBRWEsUyxXQUFBLFM7OztBQUVULHVCQUFhLFNBQWIsRUFBd0IsU0FBeEIsRUFBbUM7QUFBQTs7QUFBQTs7QUFHL0IsY0FBSyxVQUFMLEdBQWtCLFNBQWxCO0FBQ0EsY0FBSyxTQUFMLEdBQWlCLENBQWpCO0FBQ0EsY0FBSyxJQUFMLEdBQVksRUFBWjtBQUNBLGNBQUssT0FBTCxHQUFlLEVBQWY7QUFDQSxjQUFLLEtBQUwsR0FBYSxFQUFiO0FBQ0EsY0FBSyxXQUFMLEdBQW1CLEtBQW5CO0FBQ0EsY0FBSyxlQUFMLEdBQXVCLEVBQXZCOztBQVQrQixZQVd6QixNQVh5QixHQVdBLFNBWEEsQ0FXekIsTUFYeUI7QUFBQSxZQVdqQixJQVhpQixHQVdBLFNBWEEsQ0FXakIsSUFYaUI7QUFBQSxZQVdYLE1BWFcsR0FXQSxTQVhBLENBV1gsTUFYVzs7QUFhL0I7O0FBQ0EsWUFBSSxDQUFDLE1BQUwsRUFBYTtBQUNULHFCQUFTLE1BQVQ7QUFDSDtBQUNELGNBQUssV0FBTCxHQUFtQixNQUFuQjtBQUNBLGNBQUssT0FBTCxHQUFlLE1BQWY7O0FBRUEsWUFBSSxNQUFNLE9BQU4sQ0FBYyxJQUFkLENBQUosRUFBeUI7QUFDckIsaUJBQUssSUFBSSxJQUFFLENBQVgsRUFBYyxJQUFFLEtBQUssTUFBckIsRUFBNkIsR0FBN0IsRUFBa0M7QUFDOUIsc0JBQUssTUFBTCxDQUFZLEtBQUssQ0FBTCxDQUFaO0FBQ0g7QUFDSixTQUpELE1BSU87QUFDSCxrQkFBSyxLQUFMLEdBQWEsRUFBYjtBQUNIO0FBMUI4QjtBQTJCbEM7Ozs7c0NBRWM7QUFDWCxtQkFBTyxLQUFLLEtBQUwsQ0FBVyxNQUFsQjtBQUNIOzs7cUNBRVk7QUFDVCxtQkFBTyxLQUFLLEtBQVo7QUFDSDs7O2dDQUVRLEssRUFBTyxLLEVBQU87QUFDbkIsZ0JBQUksTUFBTSxLQUFLLE9BQUwsQ0FBYSxLQUFiLENBQVY7QUFDQSxnQkFBSSxHQUFKLEVBQVM7QUFDTCx1QkFBTyxJQUFJLEtBQUosQ0FBUDtBQUNIO0FBQ0QsbUJBQU8sU0FBUDtBQUNIOzs7a0NBRVUsUSxFQUFVLEssRUFBTztBQUN4QixnQkFBSSxNQUFNLEtBQUssS0FBTCxDQUFXLFFBQVgsQ0FBVjtBQUNBLGdCQUFJLEdBQUosRUFBUztBQUNMLHVCQUFPLElBQUksS0FBSixDQUFQO0FBQ0g7QUFDRCxtQkFBTyxTQUFQO0FBQ0g7OzttQ0FFVyxLLEVBQU87QUFDZixtQkFBTyxLQUFLLE9BQUwsQ0FBYSxLQUFiLENBQVA7QUFDSDs7O3FDQUVhLFEsRUFBVTtBQUNwQixtQkFBTyxLQUFLLEtBQUwsQ0FBVyxRQUFYLENBQVA7QUFDSDs7O29DQUVZLEssRUFBTztBQUNoQixtQkFBTyxLQUFLLElBQUwsQ0FBVSxPQUFWLENBQWtCLEtBQWxCLENBQVA7QUFDSDs7O2lDQUVTLFEsRUFBVTtBQUNoQixtQkFBTyxLQUFLLElBQUwsQ0FBVSxRQUFWLENBQVA7QUFDSDs7O2dDQUVRLEssRUFBTyxLLEVBQU8sSyxFQUFPO0FBQzFCLGdCQUFNLGtCQUFrQjtBQUM3Qix1QkFBTyxLQURzQjtBQUU3Qix1QkFBTyxLQUZzQjtBQUc3QixzQkFBTSxLQUh1QjtBQUk3Qix3QkFBUTtBQUpxQixhQUF4Qjs7QUFPQSxpQkFBSyxlQUFMLENBQXFCLElBQXJCLENBQTBCLGVBQTFCOztBQUVBLGdCQUFJLFVBQVUsS0FBZDs7QUFFQSxnQkFBSSxDQUFDLEtBQUssV0FBVixFQUF1QjtBQUM1QixxQkFBSyxXQUFMLEdBQW1CLElBQW5CO0FBQ0EscUJBQUssVUFBTCxDQUFnQixnQkFBaEIsQ0FBaUMsa0JBQWpDLEVBQXFELGVBQXJEO0FBQ0EscUJBQUssV0FBTCxHQUFtQixLQUFuQjtBQUNBLGFBSkssTUFJQztBQUNHLDBCQUFVLElBQVY7QUFDSDs7QUFFUCxnQkFBSSxDQUFDLGdCQUFnQixNQUFyQixFQUE2QjtBQUNuQixvQkFBSSxNQUFNLEtBQUssT0FBTCxDQUFhLEtBQWIsQ0FBVjtBQUNBLG9CQUFJLEdBQUosRUFBUztBQUNMLHdCQUFJLEtBQUosSUFBYSxnQkFBZ0IsSUFBN0I7QUFDQSx3QkFBSSxDQUFDLEtBQUssV0FBVixFQUF1QjtBQUNuQiw2QkFBSyxXQUFMLEdBQW1CLElBQW5CO0FBQ0EsNkJBQUssVUFBTCxDQUFnQixnQkFBaEIsQ0FBaUMsaUJBQWpDLEVBQW9ELGVBQXBEO0FBQ0EsNkJBQUssV0FBTCxHQUFtQixLQUFuQjtBQUNIO0FBQ0o7QUFDSjs7QUFFRCxnQkFBSSxDQUFDLE9BQUwsRUFBYztBQUNWLHFCQUFLLFVBQUwsQ0FBZ0IsZ0JBQWhCLENBQWlDLGtCQUFqQyxFQUFxRDtBQUNqRCw2QkFBUyxLQUFLO0FBRG1DLGlCQUFyRDtBQUdBO0FBQ0EscUJBQUssZUFBTCxDQUFxQixNQUFyQixHQUE4QixDQUE5QjtBQUNIO0FBQ0o7OztrQ0FFVSxRLEVBQVUsSyxFQUFPLEssRUFBTztBQUMvQixnQkFBTSxRQUFRLEtBQUssSUFBTCxDQUFVLFFBQVYsQ0FBZDtBQUNBLGdCQUFJLFVBQVUsU0FBZCxFQUF5QjtBQUNyQixxQkFBSyxPQUFMLENBQWEsS0FBYixFQUFvQixLQUFwQixFQUEyQixLQUEzQjtBQUNIO0FBQ0o7OzsrQkFFTyxPLEVBQVM7QUFDYixnQkFBTSxRQUFRLEtBQUssV0FBTCxFQUFkO0FBQ0EsaUJBQUssU0FBTCxDQUFlLEtBQWYsRUFBc0IsT0FBdEI7QUFDSDs7O2tDQUVVLFEsRUFBVSxPLEVBQVM7QUFDMUIsZ0JBQUksS0FBSyxXQUFMLEtBQXFCLE1BQXpCLEVBQWlDO0FBQzdCLG9CQUFJLE1BQU0sS0FBSyxjQUFMLEVBQVY7QUFDQSxxQkFBSyxJQUFMLENBQVUsTUFBVixDQUFpQixRQUFqQixFQUEyQixDQUEzQixFQUE4QixHQUE5QjtBQUNBLHFCQUFLLE9BQUwsQ0FBYSxHQUFiLElBQW9CLE9BQXBCO0FBQ0EscUJBQUssS0FBTCxDQUFXLE1BQVgsQ0FBa0IsUUFBbEIsRUFBNEIsQ0FBNUIsRUFBK0IsT0FBL0I7QUFDSCxhQUxELE1BTUEsSUFBSSxLQUFLLFdBQUwsS0FBcUIsT0FBekIsRUFBa0M7QUFDOUIsb0JBQUksTUFBTSxPQUFOLENBQWMsS0FBSyxPQUFuQixDQUFKLEVBQWlDO0FBQzdCLHdCQUFJLE9BQU0sS0FBSyxjQUFMLEVBQVY7QUFDQSx5QkFBSyxJQUFMLENBQVUsTUFBVixDQUFpQixRQUFqQixFQUEyQixDQUEzQixFQUE4QixJQUE5QjtBQUNBLHdCQUFJLFNBQVMsS0FBSyxhQUFMLENBQW1CLE9BQW5CLEVBQTRCLEtBQUssT0FBakMsQ0FBYjtBQUNBLHlCQUFLLE9BQUwsQ0FBYSxJQUFiLElBQW9CLE1BQXBCO0FBQ0EseUJBQUssS0FBTCxDQUFXLE1BQVgsQ0FBa0IsUUFBbEIsRUFBNEIsQ0FBNUIsRUFBK0IsTUFBL0I7QUFDSDtBQUNKO0FBQ0o7OztrQ0FFVSxHLEVBQUs7QUFDWixnQkFBSSxNQUFNLEtBQUssT0FBTCxDQUFhLEdBQWIsQ0FBVjtBQUNBLGdCQUFJLFFBQVEsS0FBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixHQUFuQixDQUFaO0FBQ0EsaUJBQUssS0FBTCxDQUFXLE1BQVgsQ0FBa0IsS0FBbEIsRUFBeUIsQ0FBekI7QUFDQSxpQkFBSyxJQUFMLENBQVUsTUFBVixDQUFpQixLQUFqQixFQUF3QixDQUF4QjtBQUNBLG1CQUFPLEtBQUssT0FBTCxDQUFhLEdBQWIsQ0FBUDtBQUNIOzs7b0NBRVksSyxFQUFPO0FBQ2hCLGdCQUFJLE1BQU0sT0FBTyxJQUFQLENBQVksS0FBSyxPQUFqQixFQUEwQixJQUExQixDQUErQjtBQUFBLHVCQUFPLE9BQU8sR0FBUCxNQUFnQixLQUF2QjtBQUFBLGFBQS9CLENBQVY7QUFDQSxtQkFBTyxLQUFLLE9BQUwsQ0FBYSxHQUFiLENBQVA7QUFDQSxpQkFBSyxLQUFMLENBQVcsTUFBWCxDQUFrQixLQUFsQixFQUF5QixDQUF6QjtBQUNBLGlCQUFLLElBQUwsQ0FBVSxNQUFWLENBQWlCLEtBQWpCLEVBQXdCLENBQXhCO0FBQ0g7Ozt3Q0FFZ0I7QUFDYixpQkFBSyxJQUFMLEdBQVksRUFBWjtBQUNBLGlCQUFLLE9BQUwsR0FBZSxFQUFmO0FBQ0EsaUJBQUssS0FBTCxHQUFhLEVBQWI7QUFDSDs7O3lDQUVpQjtBQUNkLGlCQUFLLFNBQUw7QUFDQSxtQkFBTyxLQUFLLEtBQUssU0FBakI7QUFDSDs7O3NDQUVhLFcsRUFBYSxNLEVBQVE7QUFDL0IsZ0JBQUksU0FBUyxFQUFiO0FBQ0EsaUJBQUssSUFBSSxJQUFFLENBQVgsRUFBYyxJQUFFLE9BQU8sTUFBdkIsRUFBK0IsR0FBL0IsRUFBb0M7QUFDaEMsdUJBQU8sT0FBTyxDQUFQLENBQVAsSUFBb0IsWUFBWSxDQUFaLENBQXBCO0FBQ0g7QUFDRCxtQkFBTyxNQUFQO0FBQ0g7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDaExRLGtCLFdBQUEsa0I7QUFFVCxrQ0FBYztBQUFBOztBQUNWLGFBQUssZ0JBQUwsR0FBd0IsS0FBeEI7QUFDSDs7Ozs2QkFFRSxJLEVBQU0sTSxFQUFRO0FBQ25CLGlCQUFLLEtBQUwsR0FBYSxJQUFiO0FBQ0EsaUJBQUssT0FBTCxHQUFlLE1BQWY7QUFDQTs7O2dDQUVRLEMsRUFBRztBQUNMLGdCQUFJLEtBQUssZ0JBQUwsSUFBeUIsRUFBRSxPQUEvQixFQUF3QztBQUNwQyxvQkFBSSxFQUFFLEdBQUYsS0FBVSxHQUFkLEVBQW1CO0FBQ2Ysd0JBQUksT0FBTyxLQUFLLEtBQUwsRUFBWDtBQUNBLHdCQUFJLFNBQVMsSUFBYixFQUFtQjtBQUNmLCtCQUFPLGFBQVAsQ0FBcUIsT0FBckIsQ0FBNkIsTUFBN0IsRUFBcUMsSUFBckM7QUFDSDtBQUNKLGlCQUxELE1BTUEsSUFBSSxFQUFFLEdBQUYsS0FBVSxHQUFkLEVBQW1CO0FBQ2YseUJBQUssTUFBTCxDQUFZLE9BQU8sYUFBUCxDQUFxQixPQUFyQixDQUE2QixNQUE3QixDQUFaO0FBQ0g7QUFDSjtBQUNKOzs7d0NBRWUsQyxFQUFHO0FBQUE7O0FBQ2YsZ0JBQUksQ0FBQyxPQUFPLGFBQVosRUFBMkI7QUFDdkIscUJBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsVUFBaEIsR0FBNkIsZ0JBQTdCLENBQThDLE9BQTlDLEVBQXVELFVBQUMsVUFBRCxFQUFnQjtBQUNuRSwwQkFBSyxNQUFMLENBQVksV0FBVyxhQUFYLENBQXlCLE9BQXpCLENBQWlDLE1BQWpDLENBQVo7QUFDSCxpQkFGRDtBQUdBLHFCQUFLLEtBQUwsQ0FBVyxJQUFYLENBQWdCLFVBQWhCLEdBQTZCLGdCQUE3QixDQUE4QyxNQUE5QyxFQUFzRCxVQUFDLFNBQUQsRUFBZTtBQUNqRSx3QkFBSSxPQUFPLE1BQUssS0FBTCxFQUFYO0FBQ0Esd0JBQUksU0FBUyxJQUFiLEVBQW1CO0FBQ2Ysa0NBQVUsYUFBVixDQUF3QixPQUF4QixDQUFnQyxZQUFoQyxFQUE4QyxJQUE5QztBQUNBLGtDQUFVLGNBQVY7QUFDSDtBQUNKLGlCQU5EO0FBT0EscUJBQUssZ0JBQUwsR0FBd0IsS0FBeEI7QUFDSCxhQVpELE1BWU87QUFDSCxxQkFBSyxnQkFBTCxHQUF3QixJQUF4QjtBQUNIO0FBQ0o7Ozs4QkFFSyxhLEVBQWU7QUFDakIsZ0JBQUksWUFBWSxLQUFLLEtBQUwsQ0FBVyxLQUFYLENBQWlCLEdBQWpCLENBQXFCLFdBQXJCLENBQWhCO0FBQ0EsZ0JBQUksYUFBYSxVQUFVLE1BQVYsR0FBbUIsQ0FBcEMsRUFBdUM7QUFDbkMsb0JBQUksSUFBSSxVQUFVLENBQVYsQ0FBUjtBQUNBLG9CQUFJLE9BQU8sRUFBWDtBQUNBLHFCQUFLLElBQUksSUFBRSxDQUFYLEVBQWMsSUFBRSxFQUFFLENBQWxCLEVBQXFCLEdBQXJCLEVBQTBCO0FBQ3RCLHdCQUFJLE9BQU8sRUFBWDtBQUNBLHlCQUFLLElBQUksSUFBRSxDQUFYLEVBQWMsSUFBRSxFQUFFLENBQWxCLEVBQXFCLEdBQXJCLEVBQTBCO0FBQ3RCLDZCQUFLLElBQUwsQ0FBVSxLQUFLLEtBQUwsQ0FBVyxJQUFYLENBQWdCLFNBQWhCLENBQTBCLEVBQUUsQ0FBRixHQUFNLENBQWhDLEVBQW1DLEVBQUUsQ0FBRixHQUFNLENBQXpDLENBQVY7QUFDSDtBQUNELHlCQUFLLElBQUwsQ0FBVSxLQUFLLElBQUwsQ0FBVSxJQUFWLENBQVY7QUFDSDtBQUNELHVCQUFPLEtBQUssSUFBTCxDQUFVLElBQVYsQ0FBUDtBQUNILGFBWEQsTUFXTztBQUNILHVCQUFPLElBQVA7QUFDSDtBQUNKOzs7K0JBRU0sSSxFQUFNO0FBQ1QsZ0JBQUksSUFBSixFQUFVO0FBQ04sdUJBQU8sS0FBSyxPQUFMLENBQWEsTUFBYixFQUFxQixFQUFyQixDQUFQO0FBQ0Esb0JBQUksWUFBWSxLQUFLLEtBQUwsQ0FBVyxLQUFYLENBQWlCLEdBQWpCLENBQXFCLFdBQXJCLENBQWhCO0FBQ0Esb0JBQUksYUFBYSxVQUFVLE1BQVYsR0FBbUIsQ0FBcEMsRUFBdUM7QUFDbkMsd0JBQUksSUFBSSxVQUFVLENBQVYsQ0FBUjtBQUNBLHdCQUFJLE9BQU8sS0FBSyxLQUFMLENBQVcsSUFBWCxDQUFYO0FBQ0EseUJBQUssSUFBSSxJQUFFLENBQVgsRUFBYyxJQUFFLEtBQUssTUFBckIsRUFBNkIsR0FBN0IsRUFBa0M7QUFDOUIsNEJBQUksT0FBTyxLQUFLLENBQUwsRUFBUSxLQUFSLENBQWMsSUFBZCxDQUFYO0FBQ0EsNkJBQUssSUFBSSxJQUFFLENBQVgsRUFBYyxJQUFFLEtBQUssTUFBckIsRUFBNkIsR0FBN0IsRUFBa0M7QUFDOUIsZ0NBQUksV0FBWSxFQUFFLENBQUYsR0FBTSxDQUF0QjtBQUNBLGdDQUFJLFdBQVcsRUFBRSxDQUFGLEdBQU0sQ0FBckI7QUFDQSxnQ0FBSSxLQUFLLEtBQUwsQ0FBVyxLQUFYLENBQWlCLE9BQWpCLENBQXlCLFFBQXpCLEVBQW1DLFFBQW5DLENBQUosRUFBa0Q7QUFDOUMscUNBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsU0FBaEIsQ0FBMEIsUUFBMUIsRUFBb0MsUUFBcEMsRUFBOEMsS0FBSyxDQUFMLENBQTlDO0FBQ0EscUNBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsVUFBaEIsQ0FBMkIsUUFBM0IsRUFBcUMsUUFBckM7QUFDSDtBQUNKO0FBQ0o7QUFDSjtBQUNKO0FBQ0o7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDakZRLGUsV0FBQSxlOzs7Ozs7O3VCQUVOLEksRUFBTSxNLEVBQVE7QUFDbkIsUUFBSyxLQUFMLEdBQWEsSUFBYjtBQUNBLFFBQUssT0FBTCxHQUFlLE1BQWY7QUFDQSxRQUFLLGVBQUwsR0FBdUIsS0FBdkI7QUFDQSxRQUFLLGFBQUwsR0FBcUIsS0FBSyxhQUFMLENBQW1CLElBQW5CLENBQXdCLElBQXhCLENBQXJCO0FBQ0EsUUFBSyxLQUFMLENBQVcsSUFBWCxDQUFnQixNQUFoQixDQUF1QixTQUF2QixFQUFrQyxLQUFLLGFBQXZDO0FBQ0EsUUFBSyxLQUFMLENBQVcsSUFBWCxDQUFnQixNQUFoQixDQUF1QixTQUF2QixFQUFrQyxLQUFLLGFBQXZDO0FBQ0E7OztrQ0FFZ0I7QUFDaEIsUUFBSyxhQUFMO0FBQ0E7OzswQkFFUSxDLEVBQUc7QUFDWCxPQUFJLENBQUMsS0FBSyxlQUFWLEVBQTJCO0FBQzFCLFFBQUksQ0FBQyxFQUFFLE9BQVAsRUFBZ0I7QUFDZixTQUFJLFlBQVksS0FBSyxLQUFMLENBQVcsS0FBWCxDQUFpQixHQUFqQixDQUFxQixXQUFyQixDQUFoQjtBQUNBLFNBQUksYUFBYSxVQUFVLE1BQVYsR0FBbUIsQ0FBcEMsRUFBdUM7QUFDdEMsVUFBSSxXQUFXLFVBQVUsQ0FBVixFQUFhLENBQTVCO0FBQ0EsVUFBSSxXQUFXLFVBQVUsQ0FBVixFQUFhLENBQTVCO0FBQ0EsVUFBSSxPQUFPLEtBQVg7QUFDQSxVQUFJLEVBQUUsT0FBRixLQUFjLEVBQWQsSUFBcUIsRUFBRSxPQUFGLEdBQVksRUFBWixJQUFrQixFQUFFLEVBQUUsT0FBRixJQUFhLEVBQWIsSUFBbUIsRUFBRSxPQUFGLElBQWEsRUFBbEMsQ0FBM0MsRUFBbUY7QUFDbEYsY0FBTyxJQUFQO0FBQ0E7QUFDRCxVQUFJLFFBQ0gsWUFBWSxDQURULElBQ2MsV0FBVyxLQUFLLEtBQUwsQ0FBVyxLQUFYLENBQWlCLFdBQWpCLEVBRHpCLElBRUgsWUFBWSxDQUZULElBRWMsV0FBVyxLQUFLLEtBQUwsQ0FBVyxLQUFYLENBQWlCLGNBQWpCLEVBRjdCLEVBRWdFO0FBQy9ELFdBQUksT0FBTyxLQUFLLEtBQUwsQ0FBVyxJQUFYLENBQWdCLE9BQWhCLENBQXdCLFFBQXhCLEVBQWtDLFFBQWxDLENBQVg7QUFDQSxXQUFJLElBQUosRUFBVTtBQUNULGFBQUssU0FBTCxDQUFlLElBQWY7QUFDQTtBQUNEO0FBQ0Q7QUFDRDtBQUNEO0FBQ0Q7OztrQ0FFZ0IsQyxFQUFHO0FBQUE7O0FBQ25CLEtBQUUsSUFBRixDQUFPLGdCQUFQLENBQXdCLFVBQXhCLEVBQW9DLFVBQUMsQ0FBRCxFQUFPO0FBQzFDLFFBQUksYUFBYSxFQUFFLE1BQW5CO0FBQ0EsUUFBSSxVQUFKLEVBQWdCO0FBQ2YsV0FBSyxTQUFMLENBQWUsVUFBZjtBQUNBO0FBQ0QsSUFMRDtBQU1BOzs7NEJBRVUsSSxFQUFNO0FBQ2hCLE9BQUksYUFBYSxJQUFqQjtBQUNBLE9BQUksWUFBWSxTQUFTLFdBQVcsT0FBWCxDQUFtQixRQUE1QixDQUFoQjtBQUNBLE9BQUksWUFBWSxTQUFTLFdBQVcsT0FBWCxDQUFtQixRQUE1QixDQUFoQjtBQUNBLE9BQUksS0FBSyxLQUFMLENBQVcsS0FBWCxDQUFpQixPQUFqQixDQUF5QixTQUF6QixFQUFvQyxTQUFwQyxDQUFKLEVBQW9EOztBQUVuRDtBQUNBLFFBQUksT0FBTyxLQUFLLEtBQUwsQ0FBVyxLQUFYLENBQWlCLFNBQWpCLENBQTJCLFNBQTNCLEVBQXNDLFNBQXRDLENBQVg7O0FBRUE7QUFDQSxTQUFLLEtBQUwsQ0FBVyxLQUFYLENBQWlCLEdBQWpCLENBQXFCLFNBQXJCLEVBQWdDLElBQWhDOztBQUVBO0FBQ0EsUUFBSSxZQUFZLEtBQUsscUJBQUwsRUFBaEI7QUFDQSxRQUFNLG1CQUFtQixTQUFTLGdCQUFULElBQTZCLFNBQVMsZUFBL0Q7QUFDQSxRQUFJLFlBQVksaUJBQWlCLFNBQWpDO0FBQ0EsUUFBSSxhQUFhLGlCQUFpQixVQUFsQztBQUNBLFNBQUssZ0JBQUwsR0FBd0IsU0FBUyxhQUFULENBQXVCLEtBQXZCLENBQXhCO0FBQ0EsU0FBSyxnQkFBTCxDQUFzQixLQUF0QixDQUE0QixRQUE1QixHQUF1QyxVQUF2QztBQUNBLFNBQUssZ0JBQUwsQ0FBc0IsS0FBdEIsQ0FBNEIsR0FBNUIsR0FBbUMsVUFBVSxHQUFWLEdBQWdCLFNBQWpCLEdBQThCLElBQWhFO0FBQ0EsU0FBSyxnQkFBTCxDQUFzQixLQUF0QixDQUE0QixJQUE1QixHQUFvQyxVQUFVLElBQVYsR0FBaUIsVUFBbEIsR0FBZ0MsSUFBbkU7QUFDQSxTQUFLLGdCQUFMLENBQXNCLEtBQXRCLENBQTRCLEtBQTVCLEdBQW9DLFVBQVUsS0FBVixHQUFrQixJQUF0RDtBQUNBLFNBQUssZ0JBQUwsQ0FBc0IsS0FBdEIsQ0FBNEIsTUFBNUIsR0FBcUMsVUFBVSxNQUFWLEdBQW1CLElBQXhEO0FBQ0EsYUFBUyxJQUFULENBQWMsV0FBZCxDQUEwQixLQUFLLGdCQUEvQjs7QUFFQTtBQUNBLFFBQUksZUFBZSxLQUFLLEtBQUwsQ0FBVyxLQUFYLENBQWlCLG1CQUFqQixDQUFxQyxXQUFXLE9BQVgsQ0FBbUIsUUFBeEQsRUFBa0UsV0FBVyxPQUFYLENBQW1CLFFBQXJGLEVBQStGLFFBQS9GLENBQW5CO0FBQ0EsUUFBSSxnQkFBZ0IsYUFBYSxNQUFqQyxFQUF5QztBQUN4QyxrQkFBYSxNQUFiLENBQW9CLEtBQUssZ0JBQXpCLEVBQTJDLElBQTNDLEVBQWlELEtBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsSUFBaEIsQ0FBakQ7QUFDQSxLQUZELE1BRU87QUFDTixVQUFLLGFBQUwsQ0FBbUIsS0FBSyxnQkFBeEIsRUFBMEMsSUFBMUMsRUFBZ0QsS0FBSyxLQUFMLENBQVcsSUFBWCxDQUFnQixJQUFoQixDQUFoRDtBQUNBOztBQUVELFNBQUssZUFBTCxHQUF1QixJQUF2QjtBQUNBLFNBQUssV0FBTCxHQUFtQixTQUFuQjtBQUNBLFNBQUssV0FBTCxHQUFtQixTQUFuQjtBQUNBO0FBQ0Q7OztnQ0FFYyxJLEVBQU0sSSxFQUFNLEksRUFBTTtBQUFBOztBQUNoQyxPQUFJLENBQUMsS0FBSyxhQUFWLEVBQXlCO0FBQ3hCLFFBQUksWUFBWSxLQUFLLHFCQUFMLEVBQWhCO0FBQ0EsU0FBSyxhQUFMLEdBQXFCLFNBQVMsYUFBVCxDQUF1QixPQUF2QixDQUFyQjtBQUNBLFNBQUssYUFBTCxDQUFtQixJQUFuQixHQUEwQixNQUExQjtBQUNBLFNBQUssYUFBTCxDQUFtQixLQUFuQixHQUEyQixJQUEzQjtBQUNBLFNBQUssYUFBTCxDQUFtQixLQUFuQixDQUF5QixLQUF6QixHQUFrQyxVQUFVLEtBQVgsR0FBb0IsSUFBckQ7QUFDQSxTQUFLLGFBQUwsQ0FBbUIsS0FBbkIsQ0FBeUIsTUFBekIsR0FBbUMsVUFBVSxNQUFYLEdBQXFCLElBQXZEO0FBQ0EsU0FBSyxhQUFMLENBQW1CLFNBQW5CLEdBQStCLHdCQUEvQjs7QUFFQSxTQUFLLFdBQUwsQ0FBaUIsS0FBSyxhQUF0Qjs7QUFFQSxTQUFLLGFBQUwsQ0FBbUIsS0FBbkI7QUFDQSxTQUFLLGFBQUwsQ0FBbUIsTUFBbkI7O0FBRUEsU0FBSyxlQUFMLEdBQXVCLEtBQXZCOztBQUVBLFNBQUssZUFBTCxHQUF1QixVQUFDLENBQUQsRUFBTztBQUM3QixhQUFRLEVBQUUsT0FBVjtBQUNDLFdBQUssRUFBTDtBQUFTO0FBQ1I7QUFDQSxXQUFJLE9BQUssYUFBVCxFQUF3QjtBQUN2QixlQUFLLGFBQUwsQ0FBbUIsbUJBQW5CLENBQXVDLE1BQXZDLEVBQStDLE9BQUssWUFBcEQ7QUFDQTtBQUNELFlBQUssRUFBRSxNQUFGLENBQVMsS0FBZDtBQUNBLFNBQUUsZUFBRjtBQUNBLFNBQUUsY0FBRjtBQUNBO0FBQ0QsV0FBSyxFQUFMO0FBQVM7QUFDUjtBQUNBLFdBQUksT0FBSyxhQUFULEVBQXdCO0FBQ3ZCLGVBQUssYUFBTCxDQUFtQixtQkFBbkIsQ0FBdUMsTUFBdkMsRUFBK0MsT0FBSyxZQUFwRDtBQUNBO0FBQ0Q7QUFDQSxTQUFFLGNBQUY7QUFDQSxTQUFFLGVBQUY7QUFDQTtBQUNELFdBQUssRUFBTCxDQW5CRCxDQW1CVTtBQUNULFdBQUssRUFBTCxDQXBCRCxDQW9CVTtBQUNULFdBQUssRUFBTCxDQXJCRCxDQXFCVTtBQUNULFdBQUssRUFBTDtBQUFTO0FBQ1IsV0FBSSxDQUFDLE9BQUssZUFBVixFQUEyQjtBQUMxQixhQUFLLEVBQUUsTUFBRixDQUFTLEtBQWQ7QUFDQSxRQUZELE1BRU87QUFDTixVQUFFLGNBQUY7QUFDQSxVQUFFLGVBQUY7QUFDQTtBQUNEO0FBN0JGO0FBK0JBLEtBaENEOztBQWtDQSxTQUFLLFlBQUwsR0FBb0IsVUFBQyxDQUFELEVBQU87QUFDMUIsVUFBSyxFQUFFLE1BQUYsQ0FBUyxLQUFkO0FBQ0EsS0FGRDs7QUFJQSxTQUFLLGFBQUwsR0FBcUIsVUFBQyxDQUFELEVBQU87QUFDM0IsWUFBSyxlQUFMLEdBQXVCLElBQXZCO0FBQ0EsS0FGRDs7QUFJQSxTQUFLLGFBQUwsQ0FBbUIsZ0JBQW5CLENBQW9DLFNBQXBDLEVBQStDLEtBQUssZUFBcEQ7QUFDQSxTQUFLLGFBQUwsQ0FBbUIsZ0JBQW5CLENBQW9DLE1BQXBDLEVBQTRDLEtBQUssWUFBakQ7QUFDQSxTQUFLLGFBQUwsQ0FBbUIsZ0JBQW5CLENBQW9DLE9BQXBDLEVBQTZDLEtBQUssYUFBbEQ7QUFDQTtBQUNEOzs7a0NBRWdCO0FBQ2hCLE9BQUksS0FBSyxnQkFBVCxFQUEyQjtBQUMxQjtBQUNBLFNBQUssZ0JBQUwsQ0FBc0IsYUFBdEIsQ0FBb0MsV0FBcEMsQ0FBZ0QsS0FBSyxnQkFBckQ7QUFDQSxTQUFLLGdCQUFMLEdBQXdCLElBQXhCO0FBQ0EsUUFBSSxLQUFLLGFBQVQsRUFBd0I7QUFDdkIsVUFBSyxhQUFMLENBQW1CLG1CQUFuQixDQUF1QyxTQUF2QyxFQUFrRCxLQUFLLGVBQXZEO0FBQ0EsVUFBSyxhQUFMLENBQW1CLG1CQUFuQixDQUF1QyxNQUF2QyxFQUErQyxLQUFLLFlBQXBEO0FBQ0EsVUFBSyxhQUFMLENBQW1CLG1CQUFuQixDQUF1QyxPQUF2QyxFQUFnRCxLQUFLLGFBQXJEO0FBQ0EsVUFBSyxhQUFMLENBQW1CLGFBQW5CLENBQWlDLFdBQWpDLENBQTZDLEtBQUssYUFBbEQ7QUFDQSxVQUFLLGFBQUwsR0FBcUIsSUFBckI7QUFDQSxVQUFLLGVBQUwsR0FBdUIsSUFBdkI7QUFDQSxVQUFLLFlBQUwsR0FBb0IsSUFBcEI7QUFDQSxVQUFLLGFBQUwsR0FBcUIsSUFBckI7QUFDQTtBQUNEO0FBQ0Q7Ozt3QkFFTSxNLEVBQVEsVyxFQUFhO0FBQzNCLFFBQUssYUFBTDtBQUNBLE9BQUksV0FBVyxTQUFmLEVBQTBCO0FBQ3pCLFFBQUksQ0FBQyxXQUFMLEVBQWtCO0FBQ2pCLFVBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsU0FBakIsQ0FBMkIsS0FBSyxXQUFoQyxFQUE2QyxLQUFLLFdBQWxELEVBQStELE1BQS9EO0FBQ0EsS0FGRCxNQUVPO0FBQ04sU0FBSSxRQUFRLEtBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsUUFBakIsQ0FBMEIsS0FBSyxXQUEvQixDQUFaO0FBQ0EsU0FBSSxLQUFKLEVBQVc7QUFDVixXQUFLLElBQUksSUFBVCxJQUFpQixNQUFqQixFQUF5QjtBQUN4QixXQUFJLE9BQU8sY0FBUCxDQUFzQixJQUF0QixDQUFKLEVBQWlDO0FBQ2hDLGFBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsT0FBaEIsQ0FBd0IsS0FBeEIsRUFBK0IsSUFBL0IsRUFBcUMsT0FBTyxJQUFQLENBQXJDO0FBQ0E7QUFDRDtBQUNEO0FBQ0Q7QUFDRDtBQUNELFFBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsVUFBaEIsQ0FBMkIsS0FBSyxXQUFoQyxFQUE2QyxLQUFLLFdBQWxEO0FBQ0EsUUFBSyxXQUFMLEdBQW1CLENBQUMsQ0FBcEI7QUFDQSxRQUFLLFdBQUwsR0FBbUIsQ0FBQyxDQUFwQjtBQUNBLFFBQUssZUFBTCxHQUF1QixLQUF2QjtBQUNBLFFBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsR0FBakIsQ0FBcUIsU0FBckIsRUFBZ0MsS0FBaEM7O0FBRUE7QUFDQSxRQUFLLEtBQUwsQ0FBVyxJQUFYLENBQWdCLFVBQWhCLEdBQTZCLEtBQTdCO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDbE1XLGtCLFdBQUEsa0I7Ozs7Ozs7NkJBRUgsSSxFQUFNLE0sRUFBUTtBQUN0QixpQkFBSyxLQUFMLEdBQWEsSUFBYjtBQUNBLGlCQUFLLE9BQUwsR0FBZSxNQUFmO0FBQ0c7OzttQ0FFVyxDLEVBQUc7QUFDWCxnQkFBTSxRQUFRLEtBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsY0FBakIsQ0FBZ0MsRUFBRSxRQUFsQyxDQUFkO0FBQ0EsZ0JBQUksU0FBUyxNQUFNLFNBQWYsSUFBNEIsTUFBTSxTQUFOLENBQWdCLE1BQWhELEVBQXdEO0FBQ3BELG9CQUFJLFdBQVcsT0FBTyxNQUFQLENBQWMsRUFBZCxFQUFrQixDQUFsQixDQUFmO0FBQ0EseUJBQVMsUUFBVCxHQUFvQixLQUFwQjtBQUNBLHNCQUFNLFNBQU4sQ0FBZ0IsTUFBaEIsQ0FBdUIsUUFBdkI7QUFDQSxrQkFBRSxPQUFGLEdBQVksSUFBWjtBQUNIO0FBQ0o7OzttQ0FFVyxDLEVBQUc7QUFDWCxnQkFBTSxRQUFRLEtBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsY0FBakIsQ0FBZ0MsRUFBRSxRQUFsQyxDQUFkO0FBQ0EsZ0JBQUksU0FBUyxNQUFNLFNBQWYsSUFBNEIsTUFBTSxTQUFOLENBQWdCLE1BQWhELEVBQXdEO0FBQ3BELG9CQUFJLFdBQVcsT0FBTyxNQUFQLENBQWMsRUFBZCxFQUFrQixDQUFsQixDQUFmO0FBQ0EseUJBQVMsUUFBVCxHQUFvQixLQUFwQjtBQUNBLHNCQUFNLFNBQU4sQ0FBZ0IsTUFBaEIsQ0FBdUIsUUFBdkI7QUFDQSxrQkFBRSxPQUFGLEdBQVksSUFBWjtBQUNIO0FBQ0o7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDekJRLGtCLFdBQUEsa0I7Ozs7Ozs7dUJBRU4sSSxFQUFNLE0sRUFBUTtBQUNuQixRQUFLLEtBQUwsR0FBYSxJQUFiO0FBQ0EsUUFBSyxPQUFMLEdBQWUsTUFBZjtBQUNBLFFBQUssaUJBQUwsR0FBeUIsSUFBekI7QUFDQSxRQUFLLGVBQUwsR0FBd0IsS0FBSyxPQUFMLENBQWEsU0FBYixJQUEwQixLQUFLLE9BQUwsQ0FBYSxTQUFiLENBQXVCLFFBQWxELEdBQTRELEtBQUssT0FBTCxDQUFhLFNBQWIsQ0FBdUIsUUFBbkYsR0FBNEYsc0JBQW5IO0FBQ0E7OzswQkFFUSxDLEVBQUc7QUFDWCxPQUFJLFVBQVUsS0FBSyxLQUFMLENBQVcsS0FBWCxDQUFpQixHQUFqQixDQUFxQixTQUFyQixDQUFkO0FBQ0EsT0FBSSxPQUFKLEVBQWE7QUFDWjtBQUNBO0FBQ0QsT0FBSSxZQUFZLEtBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsR0FBakIsQ0FBcUIsV0FBckIsQ0FBaEI7QUFDQSxPQUFJLGFBQWEsVUFBVSxNQUFWLEdBQW1CLENBQXBDLEVBQXVDO0FBQ3RDLFFBQUksV0FBVyxVQUFVLENBQVYsRUFBYSxDQUE1QjtBQUNBLFFBQUksV0FBVyxVQUFVLENBQVYsRUFBYSxDQUE1QjtBQUNBLFFBQUksV0FBVyxJQUFmO0FBQ0EsWUFBUSxFQUFFLE9BQVY7QUFDQyxVQUFLLEVBQUw7QUFBUztBQUNSO0FBQ0EsaUJBQVcsS0FBWDtBQUNBO0FBQ0QsVUFBSyxFQUFMO0FBQVM7QUFDUjtBQUNBO0FBQ0QsVUFBSyxFQUFMO0FBQVM7QUFDUjtBQUNBO0FBQ0QsVUFBSyxFQUFMLENBWEQsQ0FXVTtBQUNULFVBQUssQ0FBTDtBQUFRO0FBQ1A7QUFDQTtBQUNEO0FBQ0M7QUFoQkY7QUFrQkEsUUFBSSxZQUFZLENBQVosSUFBaUIsV0FBVyxLQUFLLEtBQUwsQ0FBVyxLQUFYLENBQWlCLFdBQWpCLEVBQTVCLElBQ0gsWUFBWSxDQURULElBQ2MsV0FBVyxLQUFLLEtBQUwsQ0FBVyxLQUFYLENBQWlCLGNBQWpCLEVBRDdCLEVBQ2dFO0FBQy9ELFNBQU0sV0FBVyxLQUFLLEtBQUwsQ0FBVyxLQUFYLENBQWlCLFdBQWpCLENBQTZCLFFBQTdCLENBQWpCO0FBQ0EsU0FBTSxXQUFXLEtBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsV0FBakIsQ0FBNkIsUUFBN0IsQ0FBakI7QUFDQSxTQUFJLENBQUMsUUFBRCxJQUFhLENBQUMsUUFBbEIsRUFBNEI7QUFDM0IsVUFBSSxPQUFPLEtBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsT0FBaEIsQ0FBd0IsUUFBeEIsRUFBa0MsUUFBbEMsQ0FBWDtBQUNBLFVBQUksSUFBSixFQUFVO0FBQ1QsWUFBSyxXQUFMLENBQWlCLElBQWpCLEVBQXVCLFFBQXZCLEVBQWlDLFFBQWpDO0FBQ0EsWUFBSyxLQUFMLENBQVcsSUFBWCxDQUFnQixZQUFoQixDQUE2QixRQUE3QixFQUF1QyxRQUF2QyxFQUFpRCxRQUFqRDtBQUNBLFNBQUUsY0FBRjtBQUNBLFNBQUUsZUFBRjtBQUNBO0FBQ0Q7QUFDRDtBQUNEO0FBQ0Q7OztrQ0FFZ0IsQyxFQUFHO0FBQUE7O0FBQ25CLEtBQUUsSUFBRixDQUFPLGdCQUFQLENBQXdCLFdBQXhCLEVBQXFDLFVBQUMsQ0FBRCxFQUFPO0FBQzNDLFFBQU0sYUFBYSxFQUFFLE1BQXJCO0FBQ0EsUUFBTSxZQUFZLFNBQVMsV0FBVyxPQUFYLENBQW1CLFFBQTVCLENBQWxCO0FBQ0EsUUFBTSxZQUFZLFNBQVMsV0FBVyxPQUFYLENBQW1CLFFBQTVCLENBQWxCO0FBQ0EsUUFBTSxXQUFXLE1BQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsV0FBakIsQ0FBNkIsU0FBN0IsQ0FBakI7QUFDQSxRQUFNLFdBQVcsTUFBSyxLQUFMLENBQVcsS0FBWCxDQUFpQixXQUFqQixDQUE2QixTQUE3QixDQUFqQjtBQUNBLFFBQUksQ0FBQyxRQUFELElBQWEsQ0FBQyxRQUFsQixFQUE0QjtBQUMzQixTQUFJLFdBQVcsU0FBWCxDQUFxQixRQUFyQixDQUE4QixZQUE5QixDQUFKLEVBQWlEO0FBQ2hELFlBQUssV0FBTCxDQUFpQixVQUFqQixFQUE2QixTQUE3QixFQUF3QyxTQUF4QztBQUNBO0FBQ0Q7QUFDRCxJQVhEO0FBWUE7Ozs4QkFFWSxJLEVBQU0sUSxFQUFVLFEsRUFBVTtBQUN0QztBQUNBLE9BQUksS0FBSyxpQkFBTCxJQUEwQixLQUFLLGlCQUFMLEtBQTJCLElBQXpELEVBQStEO0FBQzlELFNBQUssaUJBQUwsQ0FBdUIsU0FBdkIsQ0FBaUMsTUFBakMsQ0FBd0MsS0FBSyxlQUE3QztBQUNBOztBQUVEO0FBQ0EsUUFBSyxpQkFBTCxHQUF5QixJQUF6QjtBQUNBLFFBQUssaUJBQUwsQ0FBdUIsU0FBdkIsQ0FBaUMsR0FBakMsQ0FBcUMsS0FBSyxlQUExQztBQUNBLFFBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsVUFBaEIsR0FBNkIsS0FBN0I7O0FBRUE7QUFDQSxPQUFJLFlBQVksS0FBSyxLQUFMLENBQVcsS0FBWCxDQUFpQixHQUFqQixDQUFxQixXQUFyQixDQUFoQjtBQUNBLE9BQUksQ0FBQyxTQUFMLEVBQWdCO0FBQ2YsZ0JBQVksRUFBWjtBQUNBLFNBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsR0FBakIsQ0FBcUIsV0FBckIsRUFBa0MsU0FBbEM7QUFDQTtBQUNELGFBQVUsTUFBVixHQUFtQixDQUFuQjtBQUNBLGFBQVUsSUFBVixDQUFlO0FBQ2QsT0FBRyxRQURXO0FBRWQsT0FBRyxRQUZXO0FBR2QsT0FBRyxDQUhXO0FBSWQsT0FBRztBQUpXLElBQWY7QUFPQTs7Ozs7Ozs7Ozs7Ozs7Ozs7SUM5Rlcsb0IsV0FBQSxvQjs7Ozs7Ozs2QkFFSCxJLEVBQU0sTSxFQUFRO0FBQ3RCLGlCQUFLLEtBQUwsR0FBYSxJQUFiO0FBQ0EsaUJBQUssT0FBTCxHQUFlLE1BQWY7QUFDQTs7O3lDQUVvQixDLEVBQUc7QUFDakIsZ0JBQUksZ0JBQWdCLEVBQXBCO0FBQ0EsZ0JBQUksZ0JBQWdCLEVBQXBCO0FBQ0EsaUJBQUssSUFBSSxJQUFFLENBQVgsRUFBYyxJQUFFLEVBQUUsT0FBRixDQUFVLE1BQTFCLEVBQWtDLEdBQWxDLEVBQXVDO0FBQUEsbUNBQ2QsRUFBRSxPQUFGLENBQVUsQ0FBVixDQURjO0FBQUEsb0JBQzlCLEtBRDhCLGdCQUM5QixLQUQ4QjtBQUFBLG9CQUN2QixLQUR1QixnQkFDdkIsS0FEdUI7O0FBRW5DLG9CQUFJLFdBQVcsSUFBZjtBQUNBLG9CQUFJLFdBQVcsSUFBZjtBQUNBLG9CQUFJLGNBQWMsS0FBZCxDQUFKLEVBQTBCO0FBQ3RCLCtCQUFXLGNBQWMsS0FBZCxDQUFYO0FBQ0gsaUJBRkQsTUFFTztBQUNILCtCQUFXLEtBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsV0FBakIsQ0FBNkIsS0FBN0IsQ0FBWDtBQUNBLGtDQUFjLEtBQWQsSUFBdUIsUUFBdkI7QUFDSDtBQUNELG9CQUFJLGNBQWMsS0FBZCxDQUFKLEVBQTBCO0FBQ3RCLCtCQUFXLGNBQWMsS0FBZCxDQUFYO0FBQ0gsaUJBRkQsTUFFTztBQUNILCtCQUFXLEtBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsY0FBakIsQ0FBZ0MsS0FBaEMsQ0FBWDtBQUNBLGtDQUFjLEtBQWQsSUFBdUIsUUFBdkI7QUFDSDtBQUNELHFCQUFLLEtBQUwsQ0FBVyxJQUFYLENBQWdCLFVBQWhCLENBQTJCLFFBQTNCLEVBQXFDLFFBQXJDO0FBQ0g7QUFDSjs7Ozs7Ozs7Ozs7Ozs7Ozs7SUM1QlEsZSxXQUFBLGU7QUFFWiw0QkFBYztBQUFBOztBQUNiLE9BQUssU0FBTCxHQUFpQixFQUFqQjtBQUNBOzs7O3lCQUVNLFMsRUFBVyxPLEVBQVM7QUFDMUIsT0FBSSxDQUFDLEtBQUssU0FBTCxDQUFlLFNBQWYsQ0FBTCxFQUFnQztBQUMvQixTQUFLLFNBQUwsQ0FBZSxTQUFmLElBQTRCLEVBQTVCO0FBQ0E7QUFDRCxRQUFLLFNBQUwsQ0FBZSxTQUFmLEVBQTBCLElBQTFCLENBQStCLE9BQS9CO0FBQ0E7OzsyQkFFUSxTLEVBQVcsTyxFQUFTO0FBQzVCLE9BQUksS0FBSyxTQUFMLENBQWUsU0FBZixDQUFKLEVBQStCO0FBQzlCLFFBQUksUUFBUSxLQUFLLFNBQUwsQ0FBZSxTQUFmLEVBQTBCLE9BQTFCLENBQWtDLE9BQWxDLENBQVo7QUFDQSxRQUFJLFFBQVEsQ0FBQyxDQUFiLEVBQWdCO0FBQ2YsVUFBSyxTQUFMLENBQWUsU0FBZixFQUEwQixNQUExQixDQUFpQyxLQUFqQyxFQUF3QyxDQUF4QztBQUNBO0FBQ0Q7QUFDRDs7OzhCQUVXLFMsRUFBVztBQUN0QixVQUFPLEtBQUssU0FBTCxDQUFlLFNBQWYsS0FBNkIsS0FBSyxTQUFMLENBQWUsU0FBZixFQUEwQixNQUExQixHQUFtQyxDQUF2RTtBQUNBOzs7MkJBRVEsUyxFQUFXLFEsRUFBVTtBQUM3QixPQUFJLEtBQUssV0FBTCxDQUFpQixTQUFqQixDQUFKLEVBQWlDO0FBQ2hDLFFBQUksWUFBWSxLQUFLLFNBQUwsQ0FBZSxTQUFmLENBQWhCO0FBQ0EsU0FBSyxJQUFJLElBQUUsQ0FBWCxFQUFjLElBQUUsVUFBVSxNQUExQixFQUFrQyxHQUFsQyxFQUF1QztBQUN0QyxlQUFVLENBQVYsRUFBYSxRQUFiO0FBQ0E7QUFDRDtBQUNEOzs7Ozs7Ozs7Ozs7Ozs7OztJQ2pDVyxTLFdBQUEsUztBQUVaLG9CQUFhLElBQWIsRUFBbUIsTUFBbkIsRUFBMkI7QUFBQTs7QUFDMUIsT0FBSyxLQUFMLEdBQWEsSUFBYjtBQUNBLE9BQUssT0FBTCxHQUFlLE1BQWY7O0FBRUEsT0FBSyxXQUFMLEdBQW1CO0FBQ2xCLGVBQVksRUFETTtBQUVsQixvQkFBaUIsRUFGQztBQUdsQixlQUFZLEVBSE07QUFJbEIsb0JBQWlCLEVBSkM7QUFLbEIsc0JBQW1CLEVBTEQ7QUFNbEIsWUFBUyxFQU5TO0FBT2xCLG9CQUFpQixFQVBDO0FBUWxCLHFCQUFrQixFQVJBO0FBU2xCLHFCQUFrQixFQVRBO0FBVWxCLG9CQUFpQixFQVZDO0FBV2xCLHFCQUFrQjtBQVhBLEdBQW5CO0FBYUE7Ozs7Z0NBRWMsRyxFQUFLO0FBQ25CLE9BQUksSUFBSSxNQUFKLENBQUosRUFBaUI7QUFDaEIsUUFBSSxNQUFKLEVBQVksS0FBSyxLQUFqQixFQUF3QixLQUFLLE9BQTdCO0FBQ0E7QUFDRCxRQUFLLElBQUksUUFBVCxJQUFxQixLQUFLLFdBQTFCLEVBQXVDO0FBQ3RDLFFBQUksSUFBSSxRQUFKLENBQUosRUFBbUI7QUFDbEIsVUFBSyxXQUFMLENBQWlCLFFBQWpCLEVBQTJCLElBQTNCLENBQWdDLEdBQWhDO0FBQ0E7QUFDRDtBQUNEOzs7K0JBRWEsUSxFQUFVO0FBQ3ZCLFVBQVEsS0FBSyxXQUFMLENBQWlCLFFBQWpCLEtBQThCLEtBQUssV0FBTCxDQUFpQixRQUFqQixFQUEyQixNQUEzQixHQUFvQyxDQUExRTtBQUNBOzs7aUNBRWUsUSxFQUFVO0FBQ3pCLE9BQUksS0FBSyxXQUFMLENBQWlCLFFBQWpCLENBQUosRUFBZ0M7QUFDL0IsV0FBTyxLQUFLLFdBQUwsQ0FBaUIsUUFBakIsQ0FBUDtBQUNBLElBRkQsTUFFTztBQUNOLFdBQU8sRUFBUDtBQUNBO0FBQ0Q7OzttQ0FFaUIsUSxFQUFVO0FBQUE7O0FBQzNCLFFBQUssY0FBTCxDQUFvQixRQUFwQixFQUE4QixPQUE5QixDQUFzQyxVQUFDLEdBQUQsRUFBUztBQUM5QyxRQUFJLFFBQUosRUFBYyxLQUFkLENBQW9CLEdBQXBCLEVBQXlCLE1BQU0sU0FBTixDQUFnQixLQUFoQixDQUFzQixJQUF0QixhQUFzQyxDQUF0QyxDQUF6QjtBQUNBLElBRkQ7QUFHQTs7Ozs7Ozs7Ozs7Ozs7OztBQ2hERjs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7SUFFYSxLLFdBQUEsSzs7O0FBRVosZ0JBQVksTUFBWixFQUFvQjtBQUFBOztBQUduQjtBQUhtQjs7QUFJbkIsTUFBSSxnQkFBZ0I7QUFDbkIsYUFBVSxDQURTO0FBRW5CLG1CQUFnQixDQUZHO0FBR25CLG1CQUFnQixDQUhHO0FBSW5CLGdCQUFhLENBSk07QUFLbkIsY0FBVyxFQUxRO0FBTW5CLGdCQUFhO0FBTk0sR0FBcEI7QUFRQSxRQUFLLE9BQUwsR0FBZSxhQUFNLEtBQU4sQ0FBWSxNQUFaLEVBQW9CLGFBQXBCLENBQWY7O0FBRUE7QUFDQSxRQUFLLFdBQUwsR0FBbUIsZ0NBQW9CLE1BQUssT0FBekIsQ0FBbkI7O0FBRUEsUUFBSyxLQUFMLEdBQWEscUJBQWMsTUFBSyxPQUFMLENBQWEsU0FBM0IsRUFBc0MsTUFBSyxXQUEzQyxDQUFiO0FBQ0EsUUFBSyxNQUFMLEdBQWMsaUJBQVUsTUFBSyxPQUFmLEVBQXdCLE1BQUssS0FBN0IsRUFBb0MsTUFBSyxXQUF6QyxDQUFkO0FBQ0EsUUFBSyxLQUFMLEdBQWEsZUFBUyxNQUFLLE1BQWQsRUFBc0IsTUFBSyxXQUEzQixDQUFiO0FBQ0EsUUFBSyxNQUFMLEdBQWMsa0JBQWQ7O0FBRUE7QUFDQSxNQUFJLE1BQUssT0FBTCxDQUFhLFNBQWpCLEVBQTRCO0FBQzNCLFNBQUssV0FBTCxDQUFpQixhQUFqQixDQUErQixtQ0FBL0I7QUFDQTtBQUNELE1BQUksTUFBSyxPQUFMLENBQWEsT0FBakIsRUFBMEI7QUFDekIsU0FBSyxXQUFMLENBQWlCLGFBQWpCLENBQStCLDZCQUEvQjtBQUNBO0FBQ0QsTUFBSSxNQUFLLE9BQUwsQ0FBYSxTQUFqQixFQUE0QjtBQUMzQixTQUFLLFdBQUwsQ0FBaUIsYUFBakIsQ0FBK0IsbUNBQS9CO0FBQ0E7QUFDRCxNQUFJLE1BQUssT0FBTCxDQUFhLFVBQWpCLEVBQTZCO0FBQzVCLFNBQUssV0FBTCxDQUFpQixhQUFqQixDQUErQix1Q0FBL0I7QUFDQTtBQUNELE1BQUksTUFBSyxPQUFMLENBQWEsZUFBakIsRUFBa0M7QUFDakMsU0FBSyxXQUFMLENBQWlCLGFBQWpCLENBQStCLG1DQUEvQjtBQUNBOztBQUVEO0FBQ0EsTUFBSSxNQUFLLE9BQUwsQ0FBYSxVQUFiLElBQTJCLE1BQUssT0FBTCxDQUFhLFVBQWIsQ0FBd0IsTUFBeEIsR0FBaUMsQ0FBaEUsRUFBbUU7QUFDbEUsU0FBSyxPQUFMLENBQWEsVUFBYixDQUF3QixPQUF4QixDQUFnQyxVQUFDLEdBQUQsRUFBUztBQUN4QyxVQUFLLFdBQUwsQ0FBaUIsYUFBakIsQ0FBK0IsR0FBL0I7QUFDQSxJQUZEO0FBR0E7QUE1Q2tCO0FBNkNuQjs7Ozt5QkFzQk0sTyxFQUFTO0FBQ2YsUUFBSyxLQUFMLENBQVcsTUFBWCxDQUFrQixPQUFsQjtBQUNBOzs7c0JBdEJVO0FBQ1YsVUFBTyxLQUFLLEtBQVo7QUFDQTs7O3NCQUVXO0FBQ1gsVUFBTyxLQUFLLE1BQVo7QUFDQTs7O3NCQUVVO0FBQ1YsVUFBTyxLQUFLLEtBQVo7QUFDQTs7O3NCQUVlO0FBQ2YsVUFBTyxLQUFLLFdBQVo7QUFDQTs7O3NCQUVZO0FBQ1osVUFBTyxLQUFLLE1BQVo7QUFDQTs7Ozs7Ozs7Ozs7Ozs7OztBQ2pGRjs7Ozs7Ozs7SUFFYSxLLFdBQUEsSzs7O0FBRVosZ0JBQWEsTUFBYixFQUFxQixJQUFyQixFQUEyQixTQUEzQixFQUFzQztBQUFBOztBQUFBOztBQUVyQyxRQUFLLE9BQUwsR0FBZSxNQUFmO0FBQ0EsUUFBSyxLQUFMLEdBQWEsSUFBYjtBQUNBLFFBQUssVUFBTCxHQUFrQixTQUFsQjs7QUFFQSxRQUFLLFlBQUwsR0FBb0IsRUFBcEI7QUFDQSxRQUFLLFNBQUwsR0FBaUIsRUFBakI7QUFDQSxRQUFLLGVBQUwsR0FBdUIsRUFBdkI7QUFDQSxRQUFLLFVBQUwsR0FBa0IsRUFBbEI7QUFDQSxRQUFLLGdCQUFMLEdBQXdCLEVBQXhCOztBQUVBLE1BQUksTUFBSyxPQUFMLENBQWEsVUFBakIsRUFBNkI7QUFDNUIsUUFBSyxJQUFJLElBQUUsQ0FBWCxFQUFjLElBQUUsTUFBSyxPQUFMLENBQWEsVUFBYixDQUF3QixNQUF4QyxFQUFnRCxHQUFoRCxFQUFxRDtBQUNwRCxRQUFJLE1BQUssT0FBTCxDQUFhLFVBQWIsQ0FBd0IsQ0FBeEIsRUFBMkIsQ0FBM0IsS0FBaUMsU0FBckMsRUFBZ0Q7QUFDL0MsV0FBSyxlQUFMLENBQXFCLE1BQUssT0FBTCxDQUFhLFVBQWIsQ0FBd0IsQ0FBeEIsRUFBMkIsQ0FBaEQsSUFBcUQsTUFBSyxPQUFMLENBQWEsVUFBYixDQUF3QixDQUF4QixDQUFyRDtBQUNBO0FBQ0Q7QUFDRDtBQUNELE1BQUksTUFBSyxPQUFMLENBQWEsT0FBakIsRUFBMEI7QUFDekIsUUFBSyxJQUFJLEtBQUUsQ0FBWCxFQUFjLEtBQUUsTUFBSyxPQUFMLENBQWEsT0FBYixDQUFxQixNQUFyQyxFQUE2QyxJQUE3QyxFQUFrRDtBQUNqRCxRQUFJLE1BQUssT0FBTCxDQUFhLE9BQWIsQ0FBcUIsRUFBckIsRUFBd0IsQ0FBeEIsS0FBOEIsU0FBbEMsRUFBNkM7QUFDNUMsV0FBSyxZQUFMLENBQWtCLE1BQUssT0FBTCxDQUFhLE9BQWIsQ0FBcUIsRUFBckIsRUFBd0IsQ0FBMUMsSUFBK0MsTUFBSyxPQUFMLENBQWEsT0FBYixDQUFxQixFQUFyQixDQUEvQztBQUNBLEtBRkQsTUFFTztBQUNOLFdBQUssWUFBTCxDQUFrQixFQUFsQixJQUF1QixNQUFLLE9BQUwsQ0FBYSxPQUFiLENBQXFCLEVBQXJCLENBQXZCO0FBQ0E7QUFDRDtBQUNEO0FBQ0QsTUFBSSxNQUFLLE9BQUwsQ0FBYSxJQUFqQixFQUF1QjtBQUN0QixRQUFLLElBQUksTUFBRSxDQUFYLEVBQWMsTUFBRSxNQUFLLE9BQUwsQ0FBYSxJQUFiLENBQWtCLE1BQWxDLEVBQTBDLEtBQTFDLEVBQStDO0FBQzlDLFVBQUssU0FBTCxDQUFlLE1BQUssT0FBTCxDQUFhLElBQWIsQ0FBa0IsR0FBbEIsRUFBcUIsQ0FBcEMsSUFBeUMsTUFBSyxPQUFMLENBQWEsSUFBYixDQUFrQixHQUFsQixDQUF6QztBQUNBO0FBQ0Q7QUFDRCxNQUFJLE1BQUssT0FBTCxDQUFhLEtBQWpCLEVBQXdCO0FBQ3ZCLFFBQUssSUFBSSxNQUFFLENBQVgsRUFBYyxNQUFFLE1BQUssT0FBTCxDQUFhLEtBQWIsQ0FBbUIsTUFBbkMsRUFBMkMsS0FBM0MsRUFBZ0Q7QUFDL0MsUUFBSSxRQUFRLE1BQUssT0FBTCxDQUFhLEtBQWIsQ0FBbUIsR0FBbkIsQ0FBWjtBQUNBLFFBQUksQ0FBQyxNQUFLLFVBQUwsQ0FBZ0IsTUFBTSxDQUF0QixDQUFMLEVBQStCO0FBQzlCLFdBQUssVUFBTCxDQUFnQixNQUFNLENBQXRCLElBQTJCLEVBQTNCO0FBQ0E7QUFDRCxVQUFLLFVBQUwsQ0FBZ0IsTUFBTSxDQUF0QixFQUF5QixNQUFNLENBQS9CLElBQW9DLEtBQXBDO0FBQ0E7QUFDRDtBQUNELE1BQUksTUFBSyxPQUFMLENBQWEsV0FBakIsRUFBOEI7QUFDN0IsUUFBSyxJQUFJLE1BQUUsQ0FBWCxFQUFjLE1BQUUsTUFBSyxPQUFMLENBQWEsV0FBYixDQUF5QixNQUF6QyxFQUFpRCxLQUFqRCxFQUFzRDtBQUNyRCxRQUFJLFNBQVEsTUFBSyxPQUFMLENBQWEsV0FBYixDQUF5QixHQUF6QixDQUFaO0FBQ0EsUUFBSSxDQUFDLE1BQUssZ0JBQUwsQ0FBc0IsT0FBTSxDQUE1QixDQUFMLEVBQXFDO0FBQ3BDLFdBQUssZ0JBQUwsQ0FBc0IsT0FBTSxDQUE1QixJQUFpQyxFQUFqQztBQUNBO0FBQ0QsVUFBSyxnQkFBTCxDQUFzQixPQUFNLENBQTVCLEVBQStCLE9BQU0sQ0FBckMsSUFBMEMsTUFBMUM7QUFDQTtBQUNEOztBQUVELFFBQUssY0FBTDtBQXBEcUM7QUFxRHJDOzs7OzBCQUVRLFEsRUFBVSxRLEVBQVU7QUFDNUIsT0FBSSxXQUFXLEtBQUssV0FBTCxDQUFpQixRQUFqQixDQUFmO0FBQ0EsT0FBSSxXQUFXLEtBQUssY0FBTCxDQUFvQixRQUFwQixDQUFmO0FBQ0EsT0FBSSxZQUFZLEtBQUssWUFBTCxDQUFrQixRQUFsQixFQUE0QixRQUE1QixDQUFoQjtBQUNBLE9BQUksU0FBUyxLQUFiOztBQUVBLE9BQUssWUFBWSxTQUFTLFFBQXRCLElBQ0YsWUFBWSxTQUFTLFFBRG5CLElBRUYsYUFBYSxVQUFVLFFBRnpCLEVBRW9DO0FBQ25DLFFBQUssWUFBWSxTQUFTLFFBQVQsS0FBc0IsS0FBbkMsSUFDRixZQUFZLFNBQVMsUUFBVCxLQUFzQixLQURoQyxJQUVGLGFBQWEsVUFBVSxRQUFWLEtBQXVCLEtBRnRDLEVBRThDO0FBQzdDLGNBQVMsS0FBVDtBQUNBLEtBSkQsTUFJTztBQUNOLGNBQVMsSUFBVDtBQUNBO0FBQ0Q7O0FBRUQ7QUFDQSxPQUFJLEtBQUssVUFBTCxDQUFnQixZQUFoQixDQUE2QixtQkFBN0IsQ0FBSixFQUF1RDs7QUFFdEQ7QUFDQSxRQUFNLFFBQVEsS0FBSyxRQUFMLENBQWMsUUFBZCxDQUFkO0FBQ0EsUUFBTSxRQUFRLEtBQUssY0FBTCxDQUFvQixRQUFwQixDQUFkO0FBQ0EsUUFBTSxVQUFVLEtBQUssS0FBTCxDQUFXLFVBQVgsQ0FBc0IsS0FBdEIsQ0FBaEI7QUFDQSxRQUFNLElBQUk7QUFDVCxlQUFVLFFBREQ7QUFFVCxlQUFVLFFBRkQ7QUFHVCxZQUFPLEtBSEU7QUFJVCxZQUFPLEtBSkU7QUFLVCxjQUFTLE9BTEE7QUFNVCxlQUFVLFFBTkQ7QUFPVCxlQUFVLFFBUEQ7QUFRVCxnQkFBVyxTQVJGO0FBU1QsY0FBUztBQVRBLEtBQVY7QUFXQSxTQUFLLFVBQUwsQ0FBZ0IsZ0JBQWhCLENBQWlDLG1CQUFqQyxFQUFzRCxDQUF0RDtBQUNBLGFBQVMsRUFBRSxPQUFYO0FBQ0E7O0FBRUQsVUFBTyxNQUFQO0FBQ0E7Ozs4QkFFWSxRLEVBQVU7QUFDdEIsVUFBTyxXQUFXLEtBQUssT0FBTCxDQUFhLGNBQS9CO0FBQ0E7OztpQ0FFZSxRLEVBQVU7QUFDekIsT0FBSSxXQUFXLEtBQUssWUFBTCxDQUFrQixRQUFsQixDQUFmO0FBQ0EsT0FBSSxZQUFZLFNBQVMsS0FBVCxLQUFtQixTQUFuQyxFQUE4QztBQUM3QyxXQUFPLFNBQVMsS0FBaEI7QUFDQSxJQUZELE1BRU87QUFDTixXQUFPLEtBQUssT0FBTCxDQUFhLFdBQXBCO0FBQ0E7QUFDRDs7OytCQUVhLFEsRUFBVTtBQUN2QixPQUFJLEtBQUssV0FBTCxDQUFpQixRQUFqQixDQUFKLEVBQWdDLENBRS9CLENBRkQsTUFFTztBQUNOLFFBQU0sZUFBZSxXQUFXLEtBQUssT0FBTCxDQUFhLGNBQTdDO0FBQ0EsUUFBSSxXQUFXLEtBQUssU0FBTCxDQUFlLFlBQWYsQ0FBZjtBQUNBLFFBQUksWUFBWSxTQUFTLE1BQVQsS0FBb0IsU0FBcEMsRUFBK0M7QUFDOUMsWUFBTyxTQUFTLE1BQWhCO0FBQ0EsS0FGRCxNQUVPO0FBQ04sWUFBTyxLQUFLLE9BQUwsQ0FBYSxTQUFwQjtBQUNBO0FBQ0Q7QUFDRDs7O21DQUVpQjtBQUNqQixVQUFPLEtBQUssT0FBTCxDQUFhLE9BQWIsQ0FBcUIsTUFBNUI7QUFDQTs7O2dDQUVjO0FBQ2QsT0FBSSxpQkFBaUIsS0FBSyxPQUFMLENBQWEsY0FBbEM7QUFDQSxVQUFPLGlCQUFpQixLQUFLLEtBQUwsQ0FBVyxXQUFYLEVBQXhCO0FBQ0E7OztxQ0FFbUI7QUFDbkIsT0FBSSxZQUFZLENBQWhCO0FBQ0EsT0FBSSxLQUFLLE9BQUwsQ0FBYSxjQUFiLEtBQWdDLFNBQXBDLEVBQStDO0FBQzlDLGlCQUFhLEtBQUssT0FBTCxDQUFhLGNBQTFCO0FBQ0EsSUFGRCxNQUVPO0FBQ04saUJBQWEsQ0FBYjtBQUNBO0FBQ0QsT0FBSSxLQUFLLE9BQUwsQ0FBYSxVQUFiLElBQTJCLEtBQUssT0FBTCxDQUFhLFVBQWIsQ0FBd0IsR0FBeEIsR0FBOEIsQ0FBN0QsRUFBZ0U7QUFDL0QsaUJBQWEsS0FBSyxPQUFMLENBQWEsVUFBYixDQUF3QixHQUFyQztBQUNBO0FBQ0QsVUFBTyxTQUFQO0FBQ0E7OztxQ0FFbUI7QUFDbkIsT0FBTSxlQUFlLEtBQUssZ0JBQUwsRUFBckI7QUFDQSxPQUFJLE1BQU0sQ0FBVjtBQUNBLFFBQUssSUFBSSxJQUFFLENBQVgsRUFBYyxJQUFFLFlBQWhCLEVBQThCLEdBQTlCLEVBQW1DO0FBQ2xDLFdBQU8sS0FBSyxZQUFMLENBQWtCLENBQWxCLENBQVA7QUFDQTtBQUNELFVBQU8sR0FBUDtBQUNBOzs7c0NBRW9CO0FBQ3BCLE9BQUksS0FBSyxPQUFMLENBQWEsVUFBYixJQUEyQixLQUFLLE9BQUwsQ0FBYSxVQUFiLENBQXdCLElBQXhCLEdBQStCLENBQTlELEVBQWlFO0FBQ2hFLFdBQU8sS0FBSyxPQUFMLENBQWEsVUFBYixDQUF3QixJQUEvQjtBQUNBO0FBQ0QsVUFBTyxDQUFQO0FBQ0E7OztzQ0FFb0I7QUFDcEIsT0FBSSxLQUFLLE9BQUwsQ0FBYSxVQUFiLElBQTJCLEtBQUssT0FBTCxDQUFhLFVBQWIsQ0FBd0IsSUFBeEIsR0FBK0IsQ0FBOUQsRUFBaUU7QUFDaEUsUUFBSSxNQUFNLENBQVY7QUFDQSxTQUFLLElBQUksSUFBRSxDQUFYLEVBQWMsSUFBRSxLQUFLLE9BQUwsQ0FBYSxVQUFiLENBQXdCLElBQXhDLEVBQThDLEdBQTlDLEVBQW1EO0FBQ2xELFlBQU8sS0FBSyxjQUFMLENBQW9CLENBQXBCLENBQVA7QUFDQTtBQUNELFdBQU8sR0FBUDtBQUNBO0FBQ0QsVUFBTyxDQUFQO0FBQ0E7Ozt3Q0FFc0I7QUFDdEIsT0FBSSxLQUFLLE9BQUwsQ0FBYSxVQUFiLElBQTJCLEtBQUssT0FBTCxDQUFhLFVBQWIsQ0FBd0IsTUFBeEIsR0FBaUMsQ0FBaEUsRUFBbUU7QUFDbEUsV0FBTyxLQUFLLE9BQUwsQ0FBYSxVQUFiLENBQXdCLE1BQS9CO0FBQ0E7QUFDRCxVQUFPLENBQVA7QUFDQTs7O3dDQUVzQjtBQUN0QixVQUFPLEtBQUssaUJBQVo7QUFDQTs7O2lDQUVlLEssRUFBTztBQUN0QixPQUFJLEtBQUssWUFBTCxDQUFrQixLQUFsQixLQUE0QixLQUFLLFlBQUwsQ0FBa0IsS0FBbEIsRUFBeUIsS0FBekIsS0FBbUMsU0FBbkUsRUFBOEU7QUFDN0UsV0FBTyxLQUFLLFlBQUwsQ0FBa0IsS0FBbEIsRUFBeUIsS0FBaEM7QUFDQTtBQUNELFVBQU8sS0FBSyxPQUFMLENBQWEsV0FBcEI7QUFDQTs7OytCQUVhLEssRUFBTztBQUNwQixPQUFJLEtBQUssU0FBTCxDQUFlLEtBQWYsS0FBeUIsS0FBSyxTQUFMLENBQWUsS0FBZixFQUFzQixNQUF0QixLQUFpQyxTQUE5RCxFQUF5RTtBQUN4RSxXQUFPLEtBQUssU0FBTCxDQUFlLEtBQWYsRUFBc0IsTUFBN0I7QUFDQTtBQUNELFVBQU8sS0FBSyxPQUFMLENBQWEsU0FBcEI7QUFDQTs7O2tDQUVnQjtBQUNoQixVQUFPLEtBQUssV0FBWjtBQUNBOzs7bUNBRWlCO0FBQ2pCLFVBQU8sS0FBSyxZQUFaO0FBQ0E7Ozs4QkFFWSxRLEVBQVU7QUFDdEIsT0FBSSxLQUFLLFdBQUwsQ0FBaUIsUUFBakIsQ0FBSixFQUFnQztBQUMvQixXQUFPLEtBQUssZUFBTCxDQUFxQixRQUFyQixDQUFQO0FBQ0EsSUFGRCxNQUVPO0FBQ04sUUFBTSxlQUFlLFdBQVcsS0FBSyxPQUFMLENBQWEsY0FBN0M7QUFDQSxXQUFPLEtBQUssU0FBTCxDQUFlLFlBQWYsQ0FBUDtBQUNBO0FBQ0Q7OztpQ0FFZSxRLEVBQVU7QUFDekIsVUFBTyxLQUFLLFlBQUwsQ0FBa0IsUUFBbEIsQ0FBUDtBQUNBOzs7K0JBRWEsUSxFQUFVLFEsRUFBVTtBQUNqQyxPQUFJLEtBQUssV0FBTCxDQUFpQixRQUFqQixDQUFKLEVBQWdDO0FBQy9CLFFBQUksS0FBSyxnQkFBTCxDQUFzQixRQUF0QixDQUFKLEVBQXFDO0FBQ3BDLFlBQU8sS0FBSyxnQkFBTCxDQUFzQixRQUF0QixFQUFnQyxRQUFoQyxDQUFQO0FBQ0E7QUFDRCxJQUpELE1BSU87QUFDTixRQUFNLGVBQWUsV0FBVyxLQUFLLE9BQUwsQ0FBYSxjQUE3QztBQUNBLFFBQUksS0FBSyxVQUFMLENBQWdCLFFBQWhCLENBQUosRUFBK0I7QUFDOUIsWUFBTyxLQUFLLFVBQUwsQ0FBZ0IsUUFBaEIsRUFBMEIsWUFBMUIsQ0FBUDtBQUNBO0FBQ0Q7QUFDRDs7O3NDQUVvQixRLEVBQVUsUSxFQUFVLFEsRUFBVTtBQUNsRCxPQUFNLFlBQVksS0FBSyxZQUFMLENBQWtCLFFBQWxCLEVBQTRCLFFBQTVCLENBQWxCO0FBQ0EsT0FBSSxhQUFhLFVBQVUsUUFBVixDQUFqQixFQUFzQztBQUNyQyxXQUFPLFVBQVUsUUFBVixDQUFQO0FBQ0E7O0FBRUQsT0FBTSxXQUFXLEtBQUssV0FBTCxDQUFpQixRQUFqQixDQUFqQjtBQUNBLE9BQUksWUFBWSxTQUFTLFFBQVQsQ0FBaEIsRUFBb0M7QUFDbkMsV0FBTyxTQUFTLFFBQVQsQ0FBUDtBQUNBOztBQUVELE9BQU0sY0FBYyxLQUFLLGNBQUwsQ0FBb0IsUUFBcEIsQ0FBcEI7QUFDQSxPQUFJLGVBQWUsWUFBWSxRQUFaLENBQW5CLEVBQTBDO0FBQ3pDLFdBQU8sWUFBWSxRQUFaLENBQVA7QUFDQTs7QUFFRCxVQUFPLFNBQVA7QUFDQTs7O2lDQUVlLFEsRUFBVSxRLEVBQVU7QUFDbkMsT0FBSSxTQUFTLEVBQWI7QUFDQSxPQUFNLFdBQVcsS0FBSyxjQUFMLENBQW9CLFFBQXBCLENBQWpCO0FBQ0EsT0FBSSxRQUFKLEVBQWM7QUFDYixRQUFJLFNBQVMsUUFBYixFQUF1QjtBQUN0QixZQUFPLE9BQVAsQ0FBZSxTQUFTLFFBQXhCO0FBQ0E7QUFDRDs7QUFFRCxPQUFNLFdBQVcsS0FBSyxXQUFMLENBQWlCLFFBQWpCLENBQWpCO0FBQ0EsT0FBTSxXQUFXLEtBQUssV0FBTCxDQUFpQixRQUFqQixDQUFqQjtBQUNBLE9BQUksUUFBSixFQUFjO0FBQ2IsUUFBSSxRQUFKLEVBQWM7QUFDYixZQUFPLE9BQVAsQ0FBZSxrQkFBZjtBQUNBO0FBQ0QsUUFBSSxTQUFTLFFBQWIsRUFBdUI7QUFDdEIsWUFBTyxPQUFQLENBQWUsU0FBUyxRQUF4QjtBQUNBO0FBQ0Q7O0FBRUQsT0FBTSxZQUFZLEtBQUssWUFBTCxDQUFrQixRQUFsQixFQUE0QixRQUE1QixDQUFsQjtBQUNBLE9BQUksU0FBSixFQUFlO0FBQ2QsUUFBSSxVQUFVLFFBQWQsRUFBd0I7QUFDdkIsWUFBTyxPQUFQLENBQWUsVUFBVSxRQUF6QjtBQUNBO0FBQ0Q7QUFDRCxVQUFPLE1BQVA7QUFDQTs7OzBDQUV3QixTLEVBQVcsVSxFQUFZLGEsRUFBZTtBQUM5RCxPQUFJLFFBQVEsS0FBSyxXQUFMLEdBQW1CLFNBQS9CO0FBQ0EsT0FBSSxRQUFRLEtBQUssWUFBTCxHQUFvQixVQUFoQzs7QUFFQSxPQUFJLFNBQVMsQ0FBQyxLQUFkLEVBQXFCO0FBQ3BCLFlBQVEsS0FBSyxZQUFMLEdBQXFCLGFBQWEsYUFBMUM7QUFDQSxJQUZELE1BR0EsSUFBSSxDQUFDLEtBQUQsSUFBVSxLQUFkLEVBQXFCO0FBQ3BCLFlBQVEsS0FBSyxXQUFMLEdBQW9CLFlBQVksYUFBeEM7QUFDQTs7QUFFRCxPQUFJLFNBQVMsS0FBYixFQUFvQjtBQUNuQixXQUFPLEdBQVA7QUFDQSxJQUZELE1BR0EsSUFBSSxDQUFDLEtBQUQsSUFBVSxLQUFkLEVBQXFCO0FBQ3BCLFdBQU8sR0FBUDtBQUNBLElBRkQsTUFHQSxJQUFJLFNBQVMsQ0FBQyxLQUFkLEVBQXFCO0FBQ3BCLFdBQU8sR0FBUDtBQUNBO0FBQ0QsVUFBTyxHQUFQO0FBQ0E7Ozs0QkFFVSxRLEVBQVUsUSxFQUFVO0FBQzlCLE9BQUksS0FBSyxXQUFMLENBQWlCLFFBQWpCLENBQUosRUFBZ0M7QUFDL0IsUUFBTSxXQUFXLEtBQUssY0FBTCxDQUFvQixRQUFwQixDQUFqQjtBQUNBLFFBQUksWUFBWSxTQUFTLEtBQXpCLEVBQWdDO0FBQy9CLFlBQU8sU0FBUyxLQUFoQjtBQUNBLEtBRkQsTUFFTztBQUNOLFlBQU8sU0FBUDtBQUNBO0FBQ0QsSUFQRCxNQU9PO0FBQ04sUUFBTSxlQUFlLFdBQVcsS0FBSyxPQUFMLENBQWEsY0FBN0M7QUFDQSxRQUFNLFlBQVcsS0FBSyxjQUFMLENBQW9CLFFBQXBCLENBQWpCO0FBQ0EsUUFBSSxhQUFZLFVBQVMsS0FBekIsRUFBZ0M7QUFDL0IsWUFBTyxLQUFLLEtBQUwsQ0FBVyxTQUFYLENBQXFCLFlBQXJCLEVBQW1DLFVBQVMsS0FBNUMsQ0FBUDtBQUNBLEtBRkQsTUFFTztBQUNOLFlBQU8sU0FBUDtBQUNBO0FBQ0Q7QUFDRDs7OzRCQUVVLFEsRUFBVSxRLEVBQVUsSSxFQUFNO0FBQ3BDLE9BQU0sZUFBZSxXQUFXLEtBQUssT0FBTCxDQUFhLGNBQTdDO0FBQ0EsT0FBTSxXQUFXLEtBQUssY0FBTCxDQUFvQixRQUFwQixDQUFqQjtBQUNBLE9BQUksWUFBWSxTQUFTLEtBQXpCLEVBQWdDO0FBQy9CLFNBQUssS0FBTCxDQUFXLFNBQVgsQ0FBcUIsWUFBckIsRUFBbUMsU0FBUyxLQUE1QyxFQUFtRCxJQUFuRDtBQUNBO0FBQ0Q7Ozs4QkFFWSxLLEVBQU87QUFDbkIsVUFBTyxLQUFLLE9BQUwsQ0FBYSxjQUFiLEdBQThCLEtBQUssS0FBTCxDQUFXLFdBQVgsQ0FBdUIsS0FBdkIsQ0FBckM7QUFDQTs7OzJCQUVTLFEsRUFBVTtBQUNuQixPQUFJLFlBQVksS0FBSyxPQUFMLENBQWEsY0FBN0IsRUFBNkM7QUFDNUMsV0FBTyxLQUFLLEtBQUwsQ0FBVyxRQUFYLENBQW9CLFdBQVcsS0FBSyxPQUFMLENBQWEsY0FBNUMsQ0FBUDtBQUNBLElBRkQsTUFFTztBQUNOLFdBQU8sSUFBUDtBQUNBO0FBQ0Q7OztpQ0FFZSxLLEVBQU87QUFDdEIsUUFBSyxJQUFJLElBQUUsQ0FBWCxFQUFjLElBQUUsS0FBSyxPQUFMLENBQWEsT0FBYixDQUFxQixNQUFyQyxFQUE2QyxHQUE3QyxFQUFrRDtBQUNqRCxRQUFJLEtBQUssT0FBTCxDQUFhLE9BQWIsQ0FBcUIsQ0FBckIsRUFBd0IsS0FBeEIsS0FBa0MsS0FBdEMsRUFBNkM7QUFDNUMsWUFBTyxDQUFQO0FBQ0E7QUFDRDtBQUNELFVBQU8sQ0FBQyxDQUFSO0FBQ0E7OztpQ0FFZSxRLEVBQVU7QUFDekIsT0FBSSxLQUFLLE9BQUwsQ0FBYSxPQUFiLENBQXFCLFFBQXJCLENBQUosRUFBb0M7QUFDbkMsV0FBTyxLQUFLLE9BQUwsQ0FBYSxPQUFiLENBQXFCLFFBQXJCLEVBQStCLEtBQXRDO0FBQ0E7QUFDRDs7O21DQUVnQjtBQUNoQixRQUFLLGVBQUw7QUFDQSxRQUFLLGdCQUFMO0FBQ0EsUUFBSyxxQkFBTDtBQUNBOzs7b0NBRWtCO0FBQ2xCLFFBQUssV0FBTCxHQUFtQixDQUFuQjtBQUNBLFFBQUssSUFBSSxJQUFFLENBQVgsRUFBYyxJQUFFLEtBQUssWUFBTCxDQUFrQixNQUFsQyxFQUEwQyxHQUExQyxFQUErQztBQUM5QyxRQUFJLEtBQUssWUFBTCxDQUFrQixDQUFsQixFQUFxQixLQUFyQixLQUErQixTQUFuQyxFQUE4QztBQUM3QyxVQUFLLFdBQUwsSUFBb0IsS0FBSyxZQUFMLENBQWtCLENBQWxCLEVBQXFCLEtBQXpDO0FBQ0EsS0FGRCxNQUVPO0FBQ04sVUFBSyxXQUFMLElBQW9CLEtBQUssT0FBTCxDQUFhLFdBQWpDO0FBQ0E7QUFDRDtBQUNEOzs7cUNBRW1CO0FBQ25CLE9BQUksc0JBQXNCLE9BQU8sSUFBUCxDQUFZLEtBQUssZUFBakIsQ0FBMUI7QUFDQSxRQUFLLFlBQUwsR0FBb0IsS0FBSyxPQUFMLENBQWEsU0FBYixJQUEwQixLQUFLLE9BQUwsQ0FBYSxjQUFiLEdBQThCLG9CQUFvQixNQUE1RSxDQUFwQjtBQUNBLFFBQUssSUFBSSxLQUFULElBQWtCLEtBQUssZUFBdkIsRUFBd0M7QUFDdkMsUUFBSSxLQUFLLGVBQUwsQ0FBcUIsS0FBckIsRUFBNEIsTUFBNUIsS0FBdUMsU0FBM0MsRUFBc0Q7QUFDckQsVUFBSyxZQUFMLElBQXFCLEtBQUssZUFBTCxDQUFxQixLQUFyQixFQUE0QixNQUFqRDtBQUNBLEtBRkQsTUFFTztBQUNOLFVBQUssWUFBTCxJQUFxQixLQUFLLE9BQUwsQ0FBYSxTQUFsQztBQUNBO0FBQ0Q7O0FBRUQsT0FBSSxnQkFBZ0IsT0FBTyxJQUFQLENBQVksS0FBSyxTQUFqQixDQUFwQjtBQUNBLFFBQUssWUFBTCxJQUFxQixLQUFLLE9BQUwsQ0FBYSxTQUFiLElBQTBCLEtBQUssS0FBTCxDQUFXLFdBQVgsS0FBMkIsY0FBYyxNQUFuRSxDQUFyQjtBQUNBLFFBQUssSUFBSSxNQUFULElBQWtCLEtBQUssU0FBdkIsRUFBa0M7QUFDakMsUUFBSSxLQUFLLFNBQUwsQ0FBZSxNQUFmLEVBQXNCLE1BQXRCLEtBQWlDLFNBQXJDLEVBQWdEO0FBQy9DLFVBQUssWUFBTCxJQUFxQixLQUFLLFNBQUwsQ0FBZSxNQUFmLEVBQXNCLE1BQTNDO0FBQ0EsS0FGRCxNQUVPO0FBQ04sVUFBSyxZQUFMLElBQXFCLEtBQUssT0FBTCxDQUFhLFNBQWxDO0FBQ0E7QUFDRDtBQUNEOzs7MENBRXdCO0FBQ3hCLE9BQUksS0FBSyxPQUFMLENBQWEsVUFBYixJQUEyQixLQUFLLE9BQUwsQ0FBYSxVQUFiLENBQXdCLE1BQXhCLEdBQWlDLENBQWhFLEVBQW1FO0FBQ2xFLFFBQUksTUFBTSxDQUFWO0FBQ0EsU0FBSyxJQUFJLElBQUUsQ0FBWCxFQUFjLElBQUUsS0FBSyxPQUFMLENBQWEsVUFBYixDQUF3QixNQUF4QyxFQUFnRCxHQUFoRCxFQUFxRDtBQUNwRCxZQUFPLEtBQUssWUFBTCxDQUFtQixLQUFLLE9BQUwsQ0FBYSxRQUFiLEdBQXNCLENBQXZCLEdBQTBCLENBQTVDLENBQVA7QUFDQTtBQUNELFNBQUssaUJBQUwsR0FBeUIsR0FBekI7QUFDQSxJQU5ELE1BTU87QUFDTixTQUFLLGlCQUFMLEdBQXlCLENBQXpCO0FBQ0E7QUFDRDs7Ozs7Ozs7Ozs7Ozs7Ozs7SUMzWlcsSyxXQUFBLEs7QUFFWixrQkFBZTtBQUFBOztBQUNkLE9BQUssTUFBTCxHQUFjLEVBQWQ7QUFDQTs7Ozt5QkFFTyxHLEVBQUs7QUFDWixVQUFRLEtBQUssTUFBTCxDQUFZLEdBQVosTUFBcUIsU0FBN0I7QUFDQTs7O3NCQUVJLEcsRUFBSztBQUNULFVBQU8sS0FBSyxNQUFMLENBQVksR0FBWixDQUFQO0FBQ0E7OztzQkFFSSxHLEVBQUssSyxFQUFPO0FBQ2hCLFFBQUssTUFBTCxDQUFZLEdBQVosSUFBbUIsS0FBbkI7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNoQlcsSyxXQUFBLEs7Ozs7Ozs7d0JBRUMsTSxFQUFRLE0sRUFBUTtBQUM1QixRQUFLLElBQUksSUFBVCxJQUFpQixNQUFqQixFQUF5QjtBQUN4QixRQUFJLE9BQU8sY0FBUCxDQUFzQixJQUF0QixDQUFKLEVBQWlDO0FBQ2hDLFlBQU8sSUFBUCxJQUFlLE9BQU8sSUFBUCxDQUFmO0FBQ0E7QUFDRDtBQUNELFVBQU8sTUFBUDtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FDVEY7O0FBQ0E7Ozs7Ozs7Ozs7OztJQUVhLEksV0FBQSxJOzs7QUFFWixlQUFhLEtBQWIsRUFBb0IsVUFBcEIsRUFBZ0M7QUFBQTs7QUFBQTs7QUFFL0IsUUFBSyxNQUFMLEdBQWMsS0FBZDtBQUNBLFFBQUssV0FBTCxHQUFtQixVQUFuQjtBQUNBLFFBQUssU0FBTCxHQUFrQixpRUFDYixnRUFEYSxHQUViLHFIQUZhLEdBR2IsU0FIYSxHQUliLDJEQUphLEdBS2IsZ0hBTGEsR0FNYixTQU5hLEdBT2IsNERBUGEsR0FRYixpSEFSYSxHQVNiLFNBVGEsR0FVYiw4REFWYSxHQVdiLG1IQVhhLEdBWWIsU0FaYSxHQWFiLG1FQWJhLEdBY2Isd0hBZGEsR0FlYixTQWZhLEdBZ0JiLDhEQWhCYSxHQWlCYixtSEFqQmEsR0FrQmIsU0FsQmEsR0FtQmIsUUFuQmEsR0FvQmIsOEdBcEJhLEdBcUJiLDBDQXJCYSxHQXNCYixRQXRCYSxHQXVCYix1SEF2QmEsR0F3QmIsMENBeEJhLEdBeUJiLFFBekJMO0FBSitCO0FBOEIvQjs7Ozt5QkFFTyxPLEVBQVM7QUFDaEIsUUFBSyxRQUFMLEdBQWdCLE9BQWhCO0FBQ0EsUUFBSyxRQUFMLENBQWMsU0FBZCxHQUEwQixPQUExQjtBQUNBLFFBQUssUUFBTCxDQUFjLFNBQWQsR0FBMEIsS0FBSyxTQUEvQjtBQUNBLFFBQUssUUFBTCxDQUFjLEtBQWQsQ0FBb0IsUUFBcEIsR0FBK0IsVUFBL0I7QUFDQSxRQUFLLFFBQUwsQ0FBYyxLQUFkLENBQW9CLFFBQXBCLEdBQStCLFFBQS9CO0FBQ0EsUUFBSyxRQUFMLENBQWMsUUFBZCxHQUF5QixDQUF6Qjs7QUFFQSxRQUFLLFlBQUwsR0FBb0IsS0FBSyxRQUFMLENBQWMsYUFBZCxDQUE0QixxQkFBNUIsQ0FBcEI7QUFDQSxRQUFLLFlBQUwsR0FBb0IsS0FBSyxRQUFMLENBQWMsYUFBZCxDQUE0QixzQkFBNUIsQ0FBcEI7QUFDQSxRQUFLLGFBQUwsR0FBcUIsS0FBSyxRQUFMLENBQWMsYUFBZCxDQUE0Qix1QkFBNUIsQ0FBckI7QUFDQSxRQUFLLFFBQUwsR0FBZ0IsS0FBSyxRQUFMLENBQWMsYUFBZCxDQUE0QixpQkFBNUIsQ0FBaEI7QUFDQSxRQUFLLFNBQUwsR0FBaUIsS0FBSyxRQUFMLENBQWMsYUFBZCxDQUE0QixrQkFBNUIsQ0FBakI7QUFDQSxRQUFLLFNBQUwsR0FBaUIsS0FBSyxRQUFMLENBQWMsYUFBZCxDQUE0QixrQkFBNUIsQ0FBakI7QUFDQSxRQUFLLFVBQUwsR0FBa0IsS0FBSyxRQUFMLENBQWMsYUFBZCxDQUE0QixtQkFBNUIsQ0FBbEI7QUFDQSxRQUFLLFdBQUwsR0FBbUIsS0FBSyxRQUFMLENBQWMsYUFBZCxDQUE0QixvQkFBNUIsQ0FBbkI7QUFDQSxRQUFLLFlBQUwsR0FBb0IsS0FBSyxRQUFMLENBQWMsYUFBZCxDQUE0QixxQkFBNUIsQ0FBcEI7QUFDQSxRQUFLLFdBQUwsR0FBbUIsS0FBSyxRQUFMLENBQWMsYUFBZCxDQUE0QixvQkFBNUIsQ0FBbkI7QUFDQSxRQUFLLFlBQUwsR0FBb0IsS0FBSyxRQUFMLENBQWMsYUFBZCxDQUE0QixxQkFBNUIsQ0FBcEI7QUFDQSxRQUFLLGVBQUwsR0FBdUIsS0FBSyxRQUFMLENBQWMsYUFBZCxDQUE0Qix5QkFBNUIsQ0FBdkI7QUFDQSxRQUFLLGdCQUFMLEdBQXdCLEtBQUssUUFBTCxDQUFjLGFBQWQsQ0FBNEIsMEJBQTVCLENBQXhCOztBQUVBLFFBQUssWUFBTCxHQUFvQixLQUFLLHNCQUFMLEVBQXBCOztBQUVBLFFBQUssUUFBTCxHQUFnQixLQUFLLFFBQUwsQ0FBYyxhQUFkLENBQTRCLGdCQUE1QixDQUFoQjtBQUNBLFFBQUssUUFBTCxHQUFnQixLQUFLLFFBQUwsQ0FBYyxhQUFkLENBQTRCLGdCQUE1QixDQUFoQjtBQUNBLFFBQUssYUFBTCxHQUFxQixLQUFLLFFBQUwsQ0FBYyxhQUFkLENBQTRCLHNCQUE1QixDQUFyQjtBQUNBLFFBQUssYUFBTCxHQUFxQixLQUFLLFFBQUwsQ0FBYyxhQUFkLENBQTRCLHNCQUE1QixDQUFyQjtBQUNBLFFBQUssUUFBTCxDQUFjLEtBQWQsQ0FBb0IsTUFBcEIsR0FBNkIsS0FBSyxZQUFMLEdBQW9CLElBQWpEO0FBQ0EsUUFBSyxRQUFMLENBQWMsS0FBZCxDQUFvQixLQUFwQixHQUE0QixLQUFLLFlBQUwsR0FBb0IsSUFBaEQ7QUFDQSxRQUFLLGFBQUwsQ0FBbUIsS0FBbkIsQ0FBeUIsTUFBekIsR0FBa0MsS0FBSyxZQUFMLEdBQW9CLElBQXREO0FBQ0EsUUFBSyxhQUFMLENBQW1CLEtBQW5CLENBQXlCLEtBQXpCLEdBQWlDLEtBQUssWUFBTCxHQUFvQixJQUFyRDs7QUFFQSxRQUFLLFlBQUw7QUFDQSxRQUFLLGFBQUw7QUFDQSxRQUFLLGVBQUw7O0FBRUEsUUFBSyxXQUFMLENBQWlCLGdCQUFqQixDQUFrQyxpQkFBbEMsRUFBcUQ7QUFDcEQsVUFBTTtBQUQ4QyxJQUFyRDtBQUdBOzs7NkJBRVc7QUFDWCxRQUFLLGFBQUwsQ0FBbUIsU0FBbkIsR0FBK0IsRUFBL0I7QUFDQSxRQUFLLFNBQUwsQ0FBZSxTQUFmLEdBQTJCLEVBQTNCO0FBQ0EsUUFBSyxVQUFMLENBQWdCLFNBQWhCLEdBQTRCLEVBQTVCO0FBQ0EsUUFBSyxZQUFMLENBQWtCLFNBQWxCLEdBQThCLEVBQTlCO0FBQ0EsUUFBSyxnQkFBTCxDQUFzQixTQUF0QixHQUFrQyxFQUFsQztBQUNBLFFBQUssWUFBTCxDQUFrQixTQUFsQixHQUE4QixFQUE5Qjs7QUFFQSxRQUFLLGFBQUw7QUFDQTs7OytCQUVhO0FBQ2IsVUFBTyxLQUFLLFFBQVo7QUFDQTs7OzZCQUVXLEMsRUFBRyxlLEVBQWlCO0FBQy9CLFFBQUssU0FBTCxDQUFlLFVBQWYsR0FBNEIsQ0FBNUI7QUFDQSxRQUFLLFlBQUwsQ0FBa0IsVUFBbEIsR0FBK0IsQ0FBL0I7QUFDQSxRQUFLLFlBQUwsQ0FBa0IsVUFBbEIsR0FBK0IsQ0FBL0I7QUFDQSxPQUFJLG1CQUFtQixvQkFBb0IsU0FBM0MsRUFBc0Q7QUFDckQsU0FBSyxRQUFMLENBQWMsVUFBZCxHQUEyQixDQUEzQjtBQUNBO0FBQ0Q7OzsrQkFFYTtBQUNiLFVBQU8sS0FBSyxZQUFMLENBQWtCLFVBQXpCO0FBQ0E7Ozs2QkFFVyxDLEVBQUcsZSxFQUFpQjtBQUMvQixRQUFLLFlBQUwsQ0FBa0IsU0FBbEIsR0FBOEIsQ0FBOUI7QUFDQSxRQUFLLFVBQUwsQ0FBZ0IsU0FBaEIsR0FBNEIsQ0FBNUI7QUFDQSxPQUFJLG1CQUFtQixvQkFBb0IsU0FBM0MsRUFBc0Q7QUFDckQsU0FBSyxRQUFMLENBQWMsU0FBZCxHQUEwQixDQUExQjtBQUNBO0FBQ0Q7OzsrQkFFYTtBQUNiLFVBQU8sS0FBSyxZQUFMLENBQWtCLFNBQXpCO0FBQ0E7OzsrQkFFYSxRLEVBQVUsUSxFQUFVLFEsRUFBVTtBQUMzQyxPQUFJLE9BQU8sS0FBSyxPQUFMLENBQWEsUUFBYixFQUF1QixRQUF2QixDQUFYO0FBQ0EsT0FBSSxnQkFBZ0IsS0FBSyxhQUFMLENBQW1CLFNBQXZDO0FBQ0EsT0FBSSxpQkFBaUIsS0FBSyxhQUFMLENBQW1CLFVBQXhDOztBQUVBLFFBQUssc0JBQUwsQ0FBNEIsS0FBNUI7O0FBRUEsT0FBSSxrQkFBa0IsS0FBSyxhQUFMLENBQW1CLFNBQXpDLEVBQW9EO0FBQ25ELFNBQUssVUFBTCxDQUFnQixLQUFLLGFBQUwsQ0FBbUIsU0FBbkMsRUFBOEMsSUFBOUM7QUFDQTtBQUNELE9BQUksbUJBQW1CLEtBQUssYUFBTCxDQUFtQixVQUExQyxFQUFzRDtBQUNyRCxTQUFLLFVBQUwsQ0FBZ0IsS0FBSyxhQUFMLENBQW1CLFVBQW5DLEVBQStDLElBQS9DO0FBQ0E7QUFDRDs7OzBCQUVRLFEsRUFBVSxRLEVBQVU7QUFDNUIsT0FBSSxPQUFPLEtBQUssUUFBTCxDQUFjLGFBQWQsQ0FBNEIsc0JBQW9CLFFBQXBCLEdBQTZCLHFCQUE3QixHQUFtRCxRQUFuRCxHQUE0RCxJQUF4RixDQUFYO0FBQ0EsVUFBTyxJQUFQO0FBQ0E7Ozs2QkFFVyxRLEVBQVUsUSxFQUFVO0FBQy9CLE9BQUksT0FBTyxLQUFLLE9BQUwsQ0FBYSxRQUFiLEVBQXVCLFFBQXZCLENBQVg7QUFDQSxPQUFJLElBQUosRUFBVTtBQUNUO0FBQ0EsUUFBSSxjQUFjLElBQWxCO0FBQ0EsUUFBSSxDQUFDLEtBQUssVUFBTixJQUFvQixDQUFDLEtBQUssVUFBTCxDQUFnQixTQUFoQixDQUEwQixRQUExQixDQUFtQyxvQkFBbkMsQ0FBekIsRUFBbUY7QUFDbEY7QUFDQSxVQUFLLFNBQUwsR0FBaUIsRUFBakI7O0FBRUE7QUFDQSxtQkFBYyxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBZDtBQUNBLGlCQUFZLFNBQVosR0FBd0Isb0JBQXhCO0FBQ0EsVUFBSyxXQUFMLENBQWlCLFdBQWpCO0FBQ0EsS0FSRCxNQVFPO0FBQ04sbUJBQWMsS0FBSyxVQUFuQjtBQUNBOztBQUVEO0FBQ0EsUUFBSSxPQUFPLEtBQUssTUFBTCxDQUFZLFNBQVosQ0FBc0IsUUFBdEIsRUFBZ0MsUUFBaEMsQ0FBWDs7QUFFQTtBQUNBLFFBQUksTUFBTSxFQUFDLE1BQU0sSUFBUCxFQUFWO0FBQ0EsU0FBSyxXQUFMLENBQWlCLGdCQUFqQixDQUFrQyxrQkFBbEMsRUFBc0QsR0FBdEQ7QUFDQSxXQUFPLElBQUksSUFBWDs7QUFFQTtBQUNBO0FBQ0EsUUFBSSxlQUFlLEtBQW5CO0FBQ0EsUUFBSSxLQUFLLFdBQUwsQ0FBaUIsWUFBakIsQ0FBOEIsWUFBOUIsQ0FBSixFQUFpRDtBQUNoRCxXQUFNO0FBQ0wsZ0JBREs7QUFFTCxnQkFGSztBQUdMLDhCQUhLO0FBSUwsd0JBSks7QUFLTCx3QkFMSztBQU1MLGFBQU8sS0FBSyxNQUFMLENBQVksUUFBWixDQUFxQixRQUFyQixDQU5GO0FBT0wsYUFBTyxLQUFLLE1BQUwsQ0FBWSxjQUFaLENBQTJCLFFBQTNCLENBUEY7QUFRTCxlQUFTO0FBUkosTUFBTjtBQVVBLFVBQUssV0FBTCxDQUFpQixnQkFBakIsQ0FBa0MsWUFBbEMsRUFBZ0QsR0FBaEQ7QUFDQSxvQkFBZSxJQUFJLE9BQW5CO0FBQ0E7O0FBRUQsUUFBSSxDQUFDLFlBQUwsRUFBbUI7QUFDbEIsU0FBSSxTQUFTLFNBQVQsSUFBc0IsU0FBUyxJQUFuQyxFQUF5QztBQUN4QyxrQkFBWSxTQUFaLEdBQXdCLElBQXhCO0FBQ0EsTUFGRCxNQUVPO0FBQ04sa0JBQVksU0FBWixHQUF3QixFQUF4QjtBQUNBO0FBQ0Q7O0FBRUQsU0FBSyxXQUFMLENBQWlCLGdCQUFqQixDQUFrQyxpQkFBbEMsRUFBcUQ7QUFDcEQsV0FBTSxJQUQ4QztBQUVwRCxlQUFVLFFBRjBDO0FBR3BELGVBQVUsUUFIMEM7QUFJcEQsV0FBTTtBQUo4QyxLQUFyRDtBQU1BO0FBQ0Q7OztvQ0FFa0I7QUFBQTs7QUFFbEIsUUFBSyxlQUFMLEdBQXVCLFVBQUMsQ0FBRCxFQUFPO0FBQzdCLFdBQUssVUFBTCxDQUFnQixFQUFFLE1BQUYsQ0FBUyxTQUF6QixFQUFvQyxLQUFwQztBQUNBLFdBQUssUUFBTCxDQUFjLFNBQWQsRUFBeUIsQ0FBekI7QUFDQSxJQUhEOztBQUtBLFFBQUssZUFBTCxHQUF1QixVQUFDLENBQUQsRUFBTztBQUM3QixXQUFLLFVBQUwsQ0FBZ0IsRUFBRSxNQUFGLENBQVMsVUFBekIsRUFBcUMsS0FBckM7QUFDQSxXQUFLLFFBQUwsQ0FBYyxTQUFkLEVBQXlCLENBQXpCO0FBQ0EsSUFIRDs7QUFLQSxRQUFLLGFBQUwsR0FBcUIsVUFBQyxDQUFELEVBQU87QUFDM0IsUUFBSSxXQUFXLE9BQUssVUFBTCxFQUFmO0FBQ0EsUUFBSSxXQUFXLE9BQUssVUFBTCxFQUFmO0FBQ0EsV0FBSyxVQUFMLENBQWdCLFdBQVcsRUFBRSxNQUE3QjtBQUNBLFdBQUssVUFBTCxDQUFnQixXQUFXLEVBQUUsTUFBN0I7QUFDQSxRQUFJLEVBQUUsTUFBRixLQUFhLENBQWpCLEVBQW9CO0FBQ25CLFlBQUssUUFBTCxDQUFjLFNBQWQsRUFBeUIsQ0FBekI7QUFDQTtBQUNELFFBQUksRUFBRSxNQUFGLEtBQWEsQ0FBakIsRUFBb0I7QUFDbkIsWUFBSyxRQUFMLENBQWMsU0FBZCxFQUF5QixDQUF6QjtBQUNBO0FBQ0QsSUFYRDs7QUFhQSxRQUFLLGVBQUwsR0FBdUIsVUFBQyxDQUFELEVBQU87QUFDN0IsV0FBSyxXQUFMLENBQWlCLGdCQUFqQixDQUFrQyxTQUFsQyxFQUE2QyxDQUE3QztBQUNBLElBRkQ7O0FBSUEsUUFBSyxRQUFMLENBQWMsZ0JBQWQsQ0FBK0IsUUFBL0IsRUFBeUMsS0FBSyxlQUE5QztBQUNBLFFBQUssUUFBTCxDQUFjLGdCQUFkLENBQStCLFFBQS9CLEVBQXlDLEtBQUssZUFBOUM7QUFDQSxRQUFLLFlBQUwsQ0FBa0IsZ0JBQWxCLENBQW1DLE9BQW5DLEVBQTRDLEtBQUssYUFBakQ7QUFDQSxRQUFLLFFBQUwsQ0FBYyxnQkFBZCxDQUErQixTQUEvQixFQUEwQyxLQUFLLGVBQS9DO0FBRUE7OztrQ0FFZ0I7QUFDaEIsUUFBSyxZQUFMLENBQWtCLEtBQWxCLENBQXdCLEtBQXhCLEdBQWdDLGlCQUFpQixLQUFLLFlBQXRCLEdBQXFDLEtBQXJFO0FBQ0EsUUFBSyxZQUFMLENBQWtCLEtBQWxCLENBQXdCLE1BQXhCLEdBQWlDLGlCQUFpQixLQUFLLFlBQXRCLEdBQXFDLEtBQXRFOztBQUVBLE9BQUksZ0JBQWdCLEtBQUssTUFBTCxDQUFZLGdCQUFaLEVBQXBCO0FBQ0EsT0FBSSxtQkFBbUIsS0FBSyxNQUFMLENBQVksbUJBQVosRUFBdkI7QUFDQSxPQUFJLGlCQUFpQixLQUFLLE1BQUwsQ0FBWSxpQkFBWixFQUFyQjs7QUFFQSxRQUFLLFlBQUwsQ0FBa0IsS0FBbEIsQ0FBd0IsSUFBeEIsR0FBK0IsS0FBL0I7QUFDQSxRQUFLLFlBQUwsQ0FBa0IsS0FBbEIsQ0FBd0IsR0FBeEIsR0FBOEIsS0FBOUI7QUFDQSxRQUFLLFlBQUwsQ0FBa0IsS0FBbEIsQ0FBd0IsS0FBeEIsR0FBZ0MsaUJBQWlCLElBQWpEO0FBQ0EsUUFBSyxZQUFMLENBQWtCLEtBQWxCLENBQXdCLE1BQXhCLEdBQWlDLGdCQUFnQixJQUFqRDtBQUNBLFFBQUssUUFBTCxDQUFjLEtBQWQsQ0FBb0IsSUFBcEIsR0FBMkIsaUJBQWlCLElBQTVDO0FBQ0EsUUFBSyxRQUFMLENBQWMsS0FBZCxDQUFvQixHQUFwQixHQUEwQixLQUExQjtBQUNBLFFBQUssUUFBTCxDQUFjLEtBQWQsQ0FBb0IsS0FBcEIsR0FBNEIsaUJBQWlCLGNBQWpCLEdBQWtDLEtBQTlEO0FBQ0EsUUFBSyxRQUFMLENBQWMsS0FBZCxDQUFvQixNQUFwQixHQUE2QixnQkFBZ0IsSUFBN0M7QUFDQSxRQUFLLFNBQUwsQ0FBZSxLQUFmLENBQXFCLElBQXJCLEdBQTRCLEtBQTVCO0FBQ0EsUUFBSyxTQUFMLENBQWUsS0FBZixDQUFxQixHQUFyQixHQUEyQixnQkFBZ0IsSUFBM0M7QUFDQSxRQUFLLFNBQUwsQ0FBZSxLQUFmLENBQXFCLEtBQXJCLEdBQTZCLGlCQUFpQixJQUE5QztBQUNBLFFBQUssU0FBTCxDQUFlLEtBQWYsQ0FBcUIsTUFBckIsR0FBOEIsa0JBQWtCLGdCQUFnQixnQkFBbEMsSUFBc0QsS0FBcEY7QUFDQSxRQUFLLFdBQUwsQ0FBaUIsS0FBakIsQ0FBdUIsSUFBdkIsR0FBOEIsaUJBQWlCLElBQS9DO0FBQ0EsUUFBSyxXQUFMLENBQWlCLEtBQWpCLENBQXVCLEdBQXZCLEdBQTZCLGdCQUFnQixJQUE3QztBQUNBLFFBQUssV0FBTCxDQUFpQixLQUFqQixDQUF1QixLQUF2QixHQUErQixpQkFBaUIsY0FBakIsR0FBa0MsS0FBakU7QUFDQSxRQUFLLFdBQUwsQ0FBaUIsS0FBakIsQ0FBdUIsTUFBdkIsR0FBZ0Msa0JBQWtCLGdCQUFnQixnQkFBbEMsSUFBc0QsS0FBdEY7QUFDQSxRQUFLLGVBQUwsQ0FBcUIsS0FBckIsQ0FBMkIsSUFBM0IsR0FBa0MsS0FBbEM7QUFDQSxRQUFLLGVBQUwsQ0FBcUIsS0FBckIsQ0FBMkIsTUFBM0IsR0FBb0MsS0FBcEM7QUFDQSxRQUFLLGVBQUwsQ0FBcUIsS0FBckIsQ0FBMkIsS0FBM0IsR0FBbUMsaUJBQWlCLElBQXBEO0FBQ0EsUUFBSyxlQUFMLENBQXFCLEtBQXJCLENBQTJCLE1BQTNCLEdBQW9DLG1CQUFtQixJQUF2RDtBQUNBLFFBQUssV0FBTCxDQUFpQixLQUFqQixDQUF1QixJQUF2QixHQUE4QixpQkFBaUIsSUFBL0M7QUFDQSxRQUFLLFdBQUwsQ0FBaUIsS0FBakIsQ0FBdUIsTUFBdkIsR0FBZ0MsS0FBaEM7QUFDQSxRQUFLLFdBQUwsQ0FBaUIsS0FBakIsQ0FBdUIsS0FBdkIsR0FBK0IsaUJBQWlCLGNBQWpCLEdBQWtDLEtBQWpFO0FBQ0EsUUFBSyxXQUFMLENBQWlCLEtBQWpCLENBQXVCLE1BQXZCLEdBQWdDLG1CQUFtQixJQUFuRDs7QUFFQSxRQUFLLFlBQUw7QUFDQSxRQUFLLGdCQUFMO0FBQ0E7OztpQ0FFZTtBQUFBOztBQUNmLFFBQUssZUFBTCxHQUF1QixxQ0FBbUIsVUFBQyxPQUFELEVBQVUsUUFBVixFQUF1QjtBQUNoRSxXQUFLLGdCQUFMO0FBQ0EsSUFGc0IsQ0FBdkI7QUFHQSxRQUFLLGVBQUwsQ0FBcUIsT0FBckIsQ0FBNkIsS0FBSyxRQUFsQztBQUNBOzs7cUNBRW1CO0FBQ25CLE9BQUksYUFBYSxLQUFLLE1BQUwsQ0FBWSxhQUFaLEVBQWpCO0FBQ0EsT0FBSSxjQUFjLEtBQUssTUFBTCxDQUFZLGNBQVosRUFBbEI7QUFDQSxRQUFLLGFBQUwsQ0FBbUIsS0FBbkIsQ0FBeUIsS0FBekIsR0FBaUMsYUFBYSxJQUE5QztBQUNBLFFBQUssYUFBTCxDQUFtQixLQUFuQixDQUF5QixNQUF6QixHQUFrQyxjQUFjLElBQWhEOztBQUVBLE9BQUksV0FBVyxLQUFLLFFBQUwsQ0FBYyxxQkFBZCxFQUFmO0FBQ0EsT0FBSSxpQkFBaUIsS0FBSyxNQUFMLENBQVksdUJBQVosQ0FBb0MsU0FBUyxLQUE3QyxFQUFvRCxTQUFTLE1BQTdELEVBQXFFLEtBQUssWUFBMUUsQ0FBckI7O0FBRUEsV0FBUSxjQUFSO0FBQ0MsU0FBSyxHQUFMO0FBQ0MsVUFBSyxRQUFMLENBQWMsS0FBZCxDQUFvQixPQUFwQixHQUE4QixNQUE5QjtBQUNBLFVBQUssUUFBTCxDQUFjLEtBQWQsQ0FBb0IsT0FBcEIsR0FBOEIsTUFBOUI7QUFDQSxVQUFLLFlBQUwsQ0FBa0IsS0FBbEIsQ0FBd0IsS0FBeEIsR0FBZ0MsTUFBaEM7QUFDQSxVQUFLLFlBQUwsQ0FBa0IsS0FBbEIsQ0FBd0IsTUFBeEIsR0FBaUMsTUFBakM7QUFDQTtBQUNELFNBQUssR0FBTDtBQUNDLFVBQUssUUFBTCxDQUFjLEtBQWQsQ0FBb0IsT0FBcEIsR0FBOEIsT0FBOUI7QUFDQSxVQUFLLFFBQUwsQ0FBYyxLQUFkLENBQW9CLE9BQXBCLEdBQThCLE1BQTlCO0FBQ0EsVUFBSyxRQUFMLENBQWMsS0FBZCxDQUFvQixLQUFwQixHQUE0QixNQUE1QjtBQUNBLFVBQUssWUFBTCxDQUFrQixLQUFsQixDQUF3QixLQUF4QixHQUFnQyxNQUFoQztBQUNBLFVBQUssWUFBTCxDQUFrQixLQUFsQixDQUF3QixNQUF4QixHQUFpQyxpQkFBaUIsS0FBSyxZQUF0QixHQUFxQyxLQUF0RTtBQUNBO0FBQ0QsU0FBSyxHQUFMO0FBQ0MsVUFBSyxRQUFMLENBQWMsS0FBZCxDQUFvQixPQUFwQixHQUE4QixNQUE5QjtBQUNBLFVBQUssUUFBTCxDQUFjLEtBQWQsQ0FBb0IsT0FBcEIsR0FBOEIsT0FBOUI7QUFDQSxVQUFLLFFBQUwsQ0FBYyxLQUFkLENBQW9CLE1BQXBCLEdBQTZCLE1BQTdCO0FBQ0EsVUFBSyxZQUFMLENBQWtCLEtBQWxCLENBQXdCLEtBQXhCLEdBQWdDLGlCQUFpQixLQUFLLFlBQXRCLEdBQXFDLEtBQXJFO0FBQ0EsVUFBSyxZQUFMLENBQWtCLEtBQWxCLENBQXdCLE1BQXhCLEdBQWlDLE1BQWpDO0FBQ0E7QUFDRCxTQUFLLEdBQUw7QUFDQyxVQUFLLFFBQUwsQ0FBYyxLQUFkLENBQW9CLE9BQXBCLEdBQThCLE9BQTlCO0FBQ0EsVUFBSyxRQUFMLENBQWMsS0FBZCxDQUFvQixPQUFwQixHQUE4QixPQUE5QjtBQUNBLFVBQUssUUFBTCxDQUFjLEtBQWQsQ0FBb0IsS0FBcEIsR0FBNEIsaUJBQWlCLEtBQUssWUFBdEIsR0FBcUMsS0FBakU7QUFDQSxVQUFLLFFBQUwsQ0FBYyxLQUFkLENBQW9CLE1BQXBCLEdBQTZCLGlCQUFpQixLQUFLLFlBQXRCLEdBQXFDLEtBQWxFO0FBQ0EsVUFBSyxZQUFMLENBQWtCLEtBQWxCLENBQXdCLEtBQXhCLEdBQWdDLGlCQUFpQixLQUFLLFlBQXRCLEdBQXFDLEtBQXJFO0FBQ0EsVUFBSyxZQUFMLENBQWtCLEtBQWxCLENBQXdCLE1BQXhCLEdBQWlDLGlCQUFpQixLQUFLLFlBQXRCLEdBQXFDLEtBQXRFO0FBQ0E7QUE1QkY7QUE4QkE7OztpQ0FFZTtBQUNmLE9BQUksWUFBWSxLQUFLLE1BQUwsQ0FBWSxnQkFBWixFQUFoQjtBQUNBLE9BQUksYUFBYSxLQUFLLE1BQUwsQ0FBWSxpQkFBWixFQUFqQjtBQUNBLE9BQUksZUFBZSxLQUFLLE1BQUwsQ0FBWSxtQkFBWixFQUFuQjtBQUNBLE9BQUksV0FBVyxLQUFLLE1BQUwsQ0FBWSxXQUFaLEVBQWY7QUFDQSxPQUFJLGNBQWMsS0FBSyxNQUFMLENBQVksY0FBWixFQUFsQjtBQUNBLE9BQUksWUFBWSxDQUFoQjtBQUNBLE9BQUksYUFBYSxDQUFqQjtBQUNBLE9BQUksV0FBVyxFQUFmOztBQUVBO0FBQ0EsZUFBWSxDQUFaO0FBQ0EsUUFBSyxJQUFJLElBQUUsQ0FBWCxFQUFjLElBQUUsU0FBaEIsRUFBMkIsR0FBM0IsRUFBZ0M7QUFDL0IsUUFBSSxZQUFZLEtBQUssTUFBTCxDQUFZLFlBQVosQ0FBeUIsQ0FBekIsQ0FBaEI7QUFDQTtBQUNBLGlCQUFhLENBQWI7QUFDQSxTQUFLLElBQUksSUFBRSxDQUFYLEVBQWMsSUFBRSxVQUFoQixFQUE0QixHQUE1QixFQUFpQztBQUNoQyxjQUFTLENBQVQsSUFBYyxLQUFLLE1BQUwsQ0FBWSxjQUFaLENBQTJCLENBQTNCLENBQWQ7QUFDQSxVQUFLLFdBQUwsQ0FBaUIsQ0FBakIsRUFBb0IsQ0FBcEIsRUFBdUIsS0FBSyxhQUE1QixFQUEyQyxVQUEzQyxFQUF1RCxTQUF2RCxFQUFrRSxTQUFTLENBQVQsQ0FBbEUsRUFBK0UsU0FBL0U7QUFDQSxtQkFBYyxTQUFTLENBQVQsQ0FBZDtBQUNBO0FBQ0Q7QUFDQSxpQkFBYSxDQUFiO0FBQ0EsU0FBSyxJQUFJLEtBQUUsVUFBWCxFQUF1QixLQUFFLFdBQXpCLEVBQXNDLElBQXRDLEVBQTJDO0FBQzFDLGNBQVMsRUFBVCxJQUFjLEtBQUssTUFBTCxDQUFZLGNBQVosQ0FBMkIsRUFBM0IsQ0FBZDtBQUNBLFVBQUssV0FBTCxDQUFpQixDQUFqQixFQUFvQixFQUFwQixFQUF1QixLQUFLLFNBQTVCLEVBQXVDLFVBQXZDLEVBQW1ELFNBQW5ELEVBQThELFNBQVMsRUFBVCxDQUE5RCxFQUEyRSxTQUEzRTtBQUNBLG1CQUFjLFNBQVMsRUFBVCxDQUFkO0FBQ0E7QUFDRCxpQkFBYSxTQUFiO0FBQ0E7O0FBRUQ7QUFDQSxlQUFZLENBQVo7QUFDQSxRQUFLLElBQUksS0FBRSxTQUFYLEVBQXNCLEtBQUcsV0FBUyxZQUFsQyxFQUFpRCxJQUFqRCxFQUFzRDtBQUNyRCxRQUFJLGFBQVksS0FBSyxNQUFMLENBQVksWUFBWixDQUF5QixFQUF6QixDQUFoQjtBQUNBO0FBQ0EsaUJBQWEsQ0FBYjtBQUNBLFNBQUssSUFBSSxNQUFFLENBQVgsRUFBYyxNQUFFLFVBQWhCLEVBQTRCLEtBQTVCLEVBQWlDO0FBQ2hDLFVBQUssV0FBTCxDQUFpQixFQUFqQixFQUFvQixHQUFwQixFQUF1QixLQUFLLFVBQTVCLEVBQXdDLFVBQXhDLEVBQW9ELFNBQXBELEVBQStELFNBQVMsR0FBVCxDQUEvRCxFQUE0RSxVQUE1RTtBQUNBLG1CQUFjLFNBQVMsR0FBVCxDQUFkO0FBQ0E7QUFDRDtBQUNBLGlCQUFhLENBQWI7QUFDQSxTQUFLLElBQUksTUFBRSxVQUFYLEVBQXVCLE1BQUUsV0FBekIsRUFBc0MsS0FBdEMsRUFBMkM7QUFDMUMsVUFBSyxXQUFMLENBQWlCLEVBQWpCLEVBQW9CLEdBQXBCLEVBQXVCLEtBQUssWUFBNUIsRUFBMEMsVUFBMUMsRUFBc0QsU0FBdEQsRUFBaUUsU0FBUyxHQUFULENBQWpFLEVBQThFLFVBQTlFO0FBQ0EsbUJBQWMsU0FBUyxHQUFULENBQWQ7QUFDQTtBQUNELGlCQUFhLFVBQWI7QUFDQTs7QUFFRDtBQUNBLGVBQVksQ0FBWjtBQUNBLFFBQUssSUFBSSxNQUFHLFdBQVMsWUFBckIsRUFBb0MsTUFBRSxRQUF0QyxFQUFnRCxLQUFoRCxFQUFxRDtBQUNwRCxRQUFJLGNBQVksS0FBSyxNQUFMLENBQVksWUFBWixDQUF5QixHQUF6QixDQUFoQjtBQUNBO0FBQ0EsaUJBQWEsQ0FBYjtBQUNBLFNBQUssSUFBSSxNQUFFLENBQVgsRUFBYyxNQUFFLFVBQWhCLEVBQTRCLEtBQTVCLEVBQWlDO0FBQ2hDLFVBQUssV0FBTCxDQUFpQixHQUFqQixFQUFvQixHQUFwQixFQUF1QixLQUFLLGdCQUE1QixFQUE4QyxVQUE5QyxFQUEwRCxTQUExRCxFQUFxRSxTQUFTLEdBQVQsQ0FBckUsRUFBa0YsV0FBbEY7QUFDQSxtQkFBYyxTQUFTLEdBQVQsQ0FBZDtBQUNBO0FBQ0Q7QUFDQSxpQkFBYSxDQUFiO0FBQ0EsU0FBSyxJQUFJLE1BQUUsVUFBWCxFQUF1QixNQUFFLFdBQXpCLEVBQXNDLEtBQXRDLEVBQTJDO0FBQzFDLFVBQUssV0FBTCxDQUFpQixHQUFqQixFQUFvQixHQUFwQixFQUF1QixLQUFLLFlBQTVCLEVBQTBDLFVBQTFDLEVBQXNELFNBQXRELEVBQWlFLFNBQVMsR0FBVCxDQUFqRSxFQUE4RSxXQUE5RTtBQUNBLG1CQUFjLFNBQVMsR0FBVCxDQUFkO0FBQ0E7QUFDRCxpQkFBYSxXQUFiO0FBQ0E7QUFDRDs7OzhCQUVZLFEsRUFBVSxRLEVBQVUsSSxFQUFNLEMsRUFBRyxDLEVBQUcsSyxFQUFPLE0sRUFBUTtBQUMzRCxPQUFJLE9BQU8sS0FBSyxNQUFMLENBQVksU0FBWixDQUFzQixRQUF0QixFQUFnQyxRQUFoQyxDQUFYOztBQUVBO0FBQ0EsT0FBSSxNQUFNLEVBQUMsTUFBTSxJQUFQLEVBQVY7QUFDQSxRQUFLLFdBQUwsQ0FBaUIsZ0JBQWpCLENBQWtDLGtCQUFsQyxFQUFzRCxHQUF0RDtBQUNBLFVBQU8sSUFBSSxJQUFYOztBQUVBLE9BQUksT0FBTyxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBWDtBQUNBLE9BQUksY0FBYyxLQUFLLE1BQUwsQ0FBWSxjQUFaLENBQTJCLFFBQTNCLEVBQXFDLFFBQXJDLENBQWxCO0FBQ0EsUUFBSyxTQUFMLEdBQWlCLGdCQUFnQixZQUFZLElBQVosQ0FBaUIsR0FBakIsQ0FBakM7QUFDQSxRQUFLLEtBQUwsQ0FBVyxJQUFYLEdBQWtCLElBQUksSUFBdEI7QUFDQSxRQUFLLEtBQUwsQ0FBVyxHQUFYLEdBQWlCLElBQUksSUFBckI7QUFDQSxRQUFLLEtBQUwsQ0FBVyxLQUFYLEdBQW1CLFFBQVEsSUFBM0I7QUFDQSxRQUFLLEtBQUwsQ0FBVyxNQUFYLEdBQW9CLFNBQVMsSUFBN0I7QUFDQSxRQUFLLE9BQUwsQ0FBYSxRQUFiLEdBQXdCLFFBQXhCO0FBQ0EsUUFBSyxPQUFMLENBQWEsUUFBYixHQUF3QixRQUF4Qjs7QUFFQSxPQUFJLGNBQWMsU0FBUyxhQUFULENBQXVCLEtBQXZCLENBQWxCO0FBQ0EsZUFBWSxTQUFaLEdBQXdCLG9CQUF4QjtBQUNBLFFBQUssV0FBTCxDQUFpQixXQUFqQjtBQUNBLFFBQUssV0FBTCxDQUFpQixJQUFqQjs7QUFFQSxPQUFJLFdBQVc7QUFDZCxjQURjO0FBRWQsNEJBRmM7QUFHZCxzQkFIYztBQUlkLHNCQUpjO0FBS2QsY0FMYztBQU1kLFdBQU8sS0FBSyxNQUFMLENBQVksUUFBWixDQUFxQixRQUFyQixDQU5PO0FBT2QsV0FBTyxLQUFLLE1BQUwsQ0FBWSxjQUFaLENBQTJCLFFBQTNCLENBUE87QUFRZCxhQUFTO0FBUkssSUFBZjs7QUFXQTtBQUNBO0FBQ0EsT0FBSSxlQUFlLEtBQW5CO0FBQ0EsT0FBSSxLQUFLLFdBQUwsQ0FBaUIsWUFBakIsQ0FBOEIsWUFBOUIsQ0FBSixFQUFpRDtBQUNoRCxTQUFLLFdBQUwsQ0FBaUIsZ0JBQWpCLENBQWtDLFlBQWxDLEVBQWdELFFBQWhEO0FBQ0EsbUJBQWUsU0FBUyxPQUF4QjtBQUNBOztBQUVELE9BQUksQ0FBQyxZQUFMLEVBQW1CO0FBQ2xCLFFBQUksU0FBUyxTQUFiLEVBQXdCO0FBQ3ZCLGlCQUFZLFNBQVosR0FBd0IsSUFBeEI7QUFDQTtBQUNEOztBQUVELFFBQUssV0FBTCxDQUFpQixnQkFBakIsQ0FBa0MsaUJBQWxDLEVBQXFELFFBQXJEO0FBQ0EsUUFBSyxXQUFMLENBQWlCLGdCQUFqQixDQUFrQyxpQkFBbEMsRUFBcUQsUUFBckQ7O0FBRUEsY0FBVyxJQUFYO0FBQ0E7OzsyQ0FFeUI7QUFDekIsT0FBSSxRQUFRLFNBQVMsYUFBVCxDQUF1QixHQUF2QixDQUFaO0FBQ0EsU0FBTSxLQUFOLENBQVksS0FBWixHQUFvQixNQUFwQjtBQUNBLFNBQU0sS0FBTixDQUFZLE1BQVosR0FBcUIsT0FBckI7QUFDQSxPQUFJLFVBQVUsU0FBUyxhQUFULENBQXVCLEtBQXZCLENBQWQ7QUFDQSxXQUFRLFNBQVIsR0FBb0IsT0FBcEI7QUFDQSxPQUFJLFFBQVEsU0FBUyxhQUFULENBQXVCLEtBQXZCLENBQVo7QUFDQSxTQUFNLEtBQU4sQ0FBWSxRQUFaLEdBQXVCLFVBQXZCO0FBQ0EsU0FBTSxLQUFOLENBQVksR0FBWixHQUFrQixLQUFsQjtBQUNBLFNBQU0sS0FBTixDQUFZLElBQVosR0FBbUIsS0FBbkI7QUFDQSxTQUFNLEtBQU4sQ0FBWSxVQUFaLEdBQXlCLFFBQXpCO0FBQ0EsU0FBTSxLQUFOLENBQVksS0FBWixHQUFvQixPQUFwQjtBQUNBLFNBQU0sS0FBTixDQUFZLE1BQVosR0FBcUIsT0FBckI7QUFDQSxTQUFNLEtBQU4sQ0FBWSxRQUFaLEdBQXVCLFFBQXZCO0FBQ0EsU0FBTSxXQUFOLENBQWtCLEtBQWxCO0FBQ0EsV0FBUSxXQUFSLENBQW9CLEtBQXBCO0FBQ0EsWUFBUyxJQUFULENBQWMsV0FBZCxDQUEwQixPQUExQjtBQUNBLE9BQUksS0FBSyxNQUFNLFdBQWY7QUFDQSxTQUFNLEtBQU4sQ0FBWSxRQUFaLEdBQXVCLFFBQXZCO0FBQ0EsT0FBSSxLQUFLLE1BQU0sV0FBZjtBQUNBLE9BQUksTUFBTSxFQUFWLEVBQWMsS0FBSyxNQUFNLFdBQVg7QUFDZCxZQUFTLElBQVQsQ0FBYyxXQUFkLENBQTJCLE9BQTNCO0FBQ0EsVUFBUSxLQUFLLEVBQU4sSUFBYSxLQUFLLFNBQUwsS0FBaUIsQ0FBakIsR0FBbUIsQ0FBaEMsQ0FBUDtBQUNBOzs7OEJBR1k7QUFDWCxPQUFJLEtBQUssT0FBTyxTQUFQLENBQWlCLFNBQTFCO0FBQ0EsT0FBSSxPQUFPLEdBQUcsT0FBSCxDQUFXLE9BQVgsQ0FBWDtBQUNBLE9BQUksT0FBTyxDQUFYLEVBQWM7QUFDWjtBQUNBLFdBQU8sU0FBUyxHQUFHLFNBQUgsQ0FBYSxPQUFPLENBQXBCLEVBQXVCLEdBQUcsT0FBSCxDQUFXLEdBQVgsRUFBZ0IsSUFBaEIsQ0FBdkIsQ0FBVCxFQUF3RCxFQUF4RCxDQUFQO0FBQ0Q7O0FBRUQsT0FBSSxVQUFVLEdBQUcsT0FBSCxDQUFXLFVBQVgsQ0FBZDtBQUNBLE9BQUksVUFBVSxDQUFkLEVBQWlCO0FBQ2Y7QUFDQSxRQUFJLEtBQUssR0FBRyxPQUFILENBQVcsS0FBWCxDQUFUO0FBQ0EsV0FBTyxTQUFTLEdBQUcsU0FBSCxDQUFhLEtBQUssQ0FBbEIsRUFBcUIsR0FBRyxPQUFILENBQVcsR0FBWCxFQUFnQixFQUFoQixDQUFyQixDQUFULEVBQW9ELEVBQXBELENBQVA7QUFDRDs7QUFFRCxPQUFJLE9BQU8sR0FBRyxPQUFILENBQVcsT0FBWCxDQUFYO0FBQ0EsT0FBSSxPQUFPLENBQVgsRUFBYztBQUNaO0FBQ0EsV0FBTyxTQUFTLEdBQUcsU0FBSCxDQUFhLE9BQU8sQ0FBcEIsRUFBdUIsR0FBRyxPQUFILENBQVcsR0FBWCxFQUFnQixJQUFoQixDQUF2QixDQUFULEVBQXdELEVBQXhELENBQVA7QUFDRDtBQUNEO0FBQ0EsVUFBTyxLQUFQO0FBQ0Q7Ozs7Ozs7OztBQzVlRjs7QUFFQSxPQUFPLEtBQVA7O0FBRUE7O0FBRUEsSUFBSSxDQUFDLFFBQVEsU0FBUixDQUFrQixzQkFBdkIsRUFBK0M7QUFDM0MsWUFBUSxTQUFSLENBQWtCLHNCQUFsQixHQUEyQyxVQUFVLGNBQVYsRUFBMEI7QUFDakUseUJBQWlCLFVBQVUsTUFBVixLQUFxQixDQUFyQixHQUF5QixJQUF6QixHQUFnQyxDQUFDLENBQUMsY0FBbkQ7O0FBRUEsWUFBSSxTQUFTLEtBQUssVUFBbEI7QUFBQSxZQUNJLHNCQUFzQixPQUFPLGdCQUFQLENBQXdCLE1BQXhCLEVBQWdDLElBQWhDLENBRDFCO0FBQUEsWUFFSSx1QkFBdUIsU0FBUyxvQkFBb0IsZ0JBQXBCLENBQXFDLGtCQUFyQyxDQUFULENBRjNCO0FBQUEsWUFHSSx3QkFBd0IsU0FBUyxvQkFBb0IsZ0JBQXBCLENBQXFDLG1CQUFyQyxDQUFULENBSDVCO0FBQUEsWUFJSSxVQUFVLEtBQUssU0FBTCxHQUFpQixPQUFPLFNBQXhCLEdBQW9DLE9BQU8sU0FKekQ7QUFBQSxZQUtJLGFBQWMsS0FBSyxTQUFMLEdBQWlCLE9BQU8sU0FBeEIsR0FBb0MsS0FBSyxZQUF6QyxHQUF3RCxvQkFBekQsR0FBa0YsT0FBTyxTQUFQLEdBQW1CLE9BQU8sWUFMN0g7QUFBQSxZQU1JLFdBQVcsS0FBSyxVQUFMLEdBQWtCLE9BQU8sVUFBekIsR0FBc0MsT0FBTyxVQU41RDtBQUFBLFlBT0ksWUFBYSxLQUFLLFVBQUwsR0FBa0IsT0FBTyxVQUF6QixHQUFzQyxLQUFLLFdBQTNDLEdBQXlELHFCQUExRCxHQUFvRixPQUFPLFVBQVAsR0FBb0IsT0FBTyxXQVAvSDtBQUFBLFlBUUksZUFBZSxXQUFXLENBQUMsVUFSL0I7O0FBVUEsWUFBSSxDQUFDLFdBQVcsVUFBWixLQUEyQixjQUEvQixFQUErQztBQUMzQyxtQkFBTyxTQUFQLEdBQW1CLEtBQUssU0FBTCxHQUFpQixPQUFPLFNBQXhCLEdBQW9DLE9BQU8sWUFBUCxHQUFzQixDQUExRCxHQUE4RCxvQkFBOUQsR0FBcUYsS0FBSyxZQUFMLEdBQW9CLENBQTVIO0FBQ0g7O0FBRUQsWUFBSSxDQUFDLFlBQVksU0FBYixLQUEyQixjQUEvQixFQUErQztBQUMzQyxtQkFBTyxVQUFQLEdBQW9CLEtBQUssVUFBTCxHQUFrQixPQUFPLFVBQXpCLEdBQXNDLE9BQU8sV0FBUCxHQUFxQixDQUEzRCxHQUErRCxxQkFBL0QsR0FBdUYsS0FBSyxXQUFMLEdBQW1CLENBQTlIO0FBQ0g7O0FBRUQsWUFBSSxDQUFDLFdBQVcsVUFBWCxJQUF5QixRQUF6QixJQUFxQyxTQUF0QyxLQUFvRCxDQUFDLGNBQXpELEVBQXlFO0FBQ3JFLGlCQUFLLGNBQUwsQ0FBb0IsWUFBcEI7QUFDSDtBQUNKLEtBeEJEO0FBeUJIIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG5cdHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpIDpcblx0dHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKGZhY3RvcnkpIDpcblx0KGdsb2JhbC5SZXNpemVPYnNlcnZlciA9IGZhY3RvcnkoKSk7XG59KHRoaXMsIChmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0JztcblxuLyoqXHJcbiAqIEEgY29sbGVjdGlvbiBvZiBzaGltcyB0aGF0IHByb3ZpZGUgbWluaW1hbCBmdW5jdGlvbmFsaXR5IG9mIHRoZSBFUzYgY29sbGVjdGlvbnMuXHJcbiAqXHJcbiAqIFRoZXNlIGltcGxlbWVudGF0aW9ucyBhcmUgbm90IG1lYW50IHRvIGJlIHVzZWQgb3V0c2lkZSBvZiB0aGUgUmVzaXplT2JzZXJ2ZXJcclxuICogbW9kdWxlcyBhcyB0aGV5IGNvdmVyIG9ubHkgYSBsaW1pdGVkIHJhbmdlIG9mIHVzZSBjYXNlcy5cclxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSByZXF1aXJlLWpzZG9jLCB2YWxpZC1qc2RvYyAqL1xudmFyIE1hcFNoaW0gPSAoZnVuY3Rpb24gKCkge1xuICAgIGlmICh0eXBlb2YgTWFwICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gTWFwO1xuICAgIH1cblxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBpbmRleCBpbiBwcm92aWRlZCBhcnJheSB0aGF0IG1hdGNoZXMgdGhlIHNwZWNpZmllZCBrZXkuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtBcnJheTxBcnJheT59IGFyclxyXG4gICAgICogQHBhcmFtIHsqfSBrZXlcclxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRJbmRleChhcnIsIGtleSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gLTE7XG5cbiAgICAgICAgYXJyLnNvbWUoZnVuY3Rpb24gKGVudHJ5LCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKGVudHJ5WzBdID09PSBrZXkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBpbmRleDtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIGFub255bW91cygpIHtcbiAgICAgICAgICAgIHRoaXMuX19lbnRyaWVzX18gPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcm90b3R5cGVBY2Nlc3NvcnMgPSB7IHNpemU6IHsgY29uZmlndXJhYmxlOiB0cnVlIH0gfTtcblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAgICAgKi9cbiAgICAgICAgcHJvdG90eXBlQWNjZXNzb3JzLnNpemUuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX19lbnRyaWVzX18ubGVuZ3RoO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7Kn0ga2V5XHJcbiAgICAgICAgICogQHJldHVybnMgeyp9XHJcbiAgICAgICAgICovXG4gICAgICAgIGFub255bW91cy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gZ2V0SW5kZXgodGhpcy5fX2VudHJpZXNfXywga2V5KTtcbiAgICAgICAgICAgIHZhciBlbnRyeSA9IHRoaXMuX19lbnRyaWVzX19baW5kZXhdO1xuXG4gICAgICAgICAgICByZXR1cm4gZW50cnkgJiYgZW50cnlbMV07XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHsqfSBrZXlcclxuICAgICAgICAgKiBAcGFyYW0geyp9IHZhbHVlXHJcbiAgICAgICAgICogQHJldHVybnMge3ZvaWR9XHJcbiAgICAgICAgICovXG4gICAgICAgIGFub255bW91cy5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGdldEluZGV4KHRoaXMuX19lbnRyaWVzX18sIGtleSk7XG5cbiAgICAgICAgICAgIGlmICh+aW5kZXgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9fZW50cmllc19fW2luZGV4XVsxXSA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9fZW50cmllc19fLnB1c2goW2tleSwgdmFsdWVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0geyp9IGtleVxyXG4gICAgICAgICAqIEByZXR1cm5zIHt2b2lkfVxyXG4gICAgICAgICAqL1xuICAgICAgICBhbm9ueW1vdXMucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHZhciBlbnRyaWVzID0gdGhpcy5fX2VudHJpZXNfXztcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGdldEluZGV4KGVudHJpZXMsIGtleSk7XG5cbiAgICAgICAgICAgIGlmICh+aW5kZXgpIHtcbiAgICAgICAgICAgICAgICBlbnRyaWVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHsqfSBrZXlcclxuICAgICAgICAgKiBAcmV0dXJucyB7dm9pZH1cclxuICAgICAgICAgKi9cbiAgICAgICAgYW5vbnltb3VzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gISF+Z2V0SW5kZXgodGhpcy5fX2VudHJpZXNfXywga2V5KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcmV0dXJucyB7dm9pZH1cclxuICAgICAgICAgKi9cbiAgICAgICAgYW5vbnltb3VzLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX19lbnRyaWVzX18uc3BsaWNlKDApO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXHJcbiAgICAgICAgICogQHBhcmFtIHsqfSBbY3R4PW51bGxdXHJcbiAgICAgICAgICogQHJldHVybnMge3ZvaWR9XHJcbiAgICAgICAgICovXG4gICAgICAgIGFub255bW91cy5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChjYWxsYmFjaywgY3R4KSB7XG4gICAgICAgICAgICB2YXIgdGhpcyQxID0gdGhpcztcbiAgICAgICAgICAgIGlmICggY3R4ID09PSB2b2lkIDAgKSBjdHggPSBudWxsO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGlzdCA9IHRoaXMkMS5fX2VudHJpZXNfXzsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICB2YXIgZW50cnkgPSBsaXN0W2ldO1xuXG4gICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjdHgsIGVudHJ5WzFdLCBlbnRyeVswXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoIGFub255bW91cy5wcm90b3R5cGUsIHByb3RvdHlwZUFjY2Vzc29ycyApO1xuXG4gICAgICAgIHJldHVybiBhbm9ueW1vdXM7XG4gICAgfSgpKTtcbn0pKCk7XG5cbi8qKlxyXG4gKiBEZXRlY3RzIHdoZXRoZXIgd2luZG93IGFuZCBkb2N1bWVudCBvYmplY3RzIGFyZSBhdmFpbGFibGUgaW4gY3VycmVudCBlbnZpcm9ubWVudC5cclxuICovXG52YXIgaXNCcm93c2VyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuZG9jdW1lbnQgPT09IGRvY3VtZW50O1xuXG4vLyBSZXR1cm5zIGdsb2JhbCBvYmplY3Qgb2YgYSBjdXJyZW50IGVudmlyb25tZW50LlxudmFyIGdsb2JhbCQxID0gKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgJiYgZ2xvYmFsLk1hdGggPT09IE1hdGgpIHtcbiAgICAgICAgcmV0dXJuIGdsb2JhbDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnICYmIHNlbGYuTWF0aCA9PT0gTWF0aCkge1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lk1hdGggPT09IE1hdGgpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdztcbiAgICB9XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmV3LWZ1bmNcbiAgICByZXR1cm4gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbn0pKCk7XG5cbi8qKlxyXG4gKiBBIHNoaW0gZm9yIHRoZSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgd2hpY2ggZmFsbHMgYmFjayB0byB0aGUgc2V0VGltZW91dCBpZlxyXG4gKiBmaXJzdCBvbmUgaXMgbm90IHN1cHBvcnRlZC5cclxuICpcclxuICogQHJldHVybnMge251bWJlcn0gUmVxdWVzdHMnIGlkZW50aWZpZXIuXHJcbiAqL1xudmFyIHJlcXVlc3RBbmltYXRpb25GcmFtZSQxID0gKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBJdCdzIHJlcXVpcmVkIHRvIHVzZSBhIGJvdW5kZWQgZnVuY3Rpb24gYmVjYXVzZSBJRSBzb21ldGltZXMgdGhyb3dzXG4gICAgICAgIC8vIGFuIFwiSW52YWxpZCBjYWxsaW5nIG9iamVjdFwiIGVycm9yIGlmIHJBRiBpcyBpbnZva2VkIHdpdGhvdXQgdGhlIGdsb2JhbFxuICAgICAgICAvLyBvYmplY3Qgb24gdGhlIGxlZnQgaGFuZCBzaWRlLlxuICAgICAgICByZXR1cm4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lLmJpbmQoZ2xvYmFsJDEpO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAoY2FsbGJhY2spIHsgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyByZXR1cm4gY2FsbGJhY2soRGF0ZS5ub3coKSk7IH0sIDEwMDAgLyA2MCk7IH07XG59KSgpO1xuXG4vLyBEZWZpbmVzIG1pbmltdW0gdGltZW91dCBiZWZvcmUgYWRkaW5nIGEgdHJhaWxpbmcgY2FsbC5cbnZhciB0cmFpbGluZ1RpbWVvdXQgPSAyO1xuXG4vKipcclxuICogQ3JlYXRlcyBhIHdyYXBwZXIgZnVuY3Rpb24gd2hpY2ggZW5zdXJlcyB0aGF0IHByb3ZpZGVkIGNhbGxiYWNrIHdpbGwgYmVcclxuICogaW52b2tlZCBvbmx5IG9uY2UgZHVyaW5nIHRoZSBzcGVjaWZpZWQgZGVsYXkgcGVyaW9kLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIGJlIGludm9rZWQgYWZ0ZXIgdGhlIGRlbGF5IHBlcmlvZC5cclxuICogQHBhcmFtIHtudW1iZXJ9IGRlbGF5IC0gRGVsYXkgYWZ0ZXIgd2hpY2ggdG8gaW52b2tlIGNhbGxiYWNrLlxyXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259XHJcbiAqL1xudmFyIHRocm90dGxlID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBkZWxheSkge1xuICAgIHZhciBsZWFkaW5nQ2FsbCA9IGZhbHNlLFxuICAgICAgICB0cmFpbGluZ0NhbGwgPSBmYWxzZSxcbiAgICAgICAgbGFzdENhbGxUaW1lID0gMDtcblxuICAgIC8qKlxyXG4gICAgICogSW52b2tlcyB0aGUgb3JpZ2luYWwgY2FsbGJhY2sgZnVuY3Rpb24gYW5kIHNjaGVkdWxlcyBuZXcgaW52b2NhdGlvbiBpZlxyXG4gICAgICogdGhlIFwicHJveHlcIiB3YXMgY2FsbGVkIGR1cmluZyBjdXJyZW50IHJlcXVlc3QuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge3ZvaWR9XHJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZXNvbHZlUGVuZGluZygpIHtcbiAgICAgICAgaWYgKGxlYWRpbmdDYWxsKSB7XG4gICAgICAgICAgICBsZWFkaW5nQ2FsbCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRyYWlsaW5nQ2FsbCkge1xuICAgICAgICAgICAgcHJveHkoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxyXG4gICAgICogQ2FsbGJhY2sgaW52b2tlZCBhZnRlciB0aGUgc3BlY2lmaWVkIGRlbGF5LiBJdCB3aWxsIGZ1cnRoZXIgcG9zdHBvbmVcclxuICAgICAqIGludm9jYXRpb24gb2YgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGRlbGVnYXRpbmcgaXQgdG8gdGhlXHJcbiAgICAgKiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge3ZvaWR9XHJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0aW1lb3V0Q2FsbGJhY2soKSB7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSQxKHJlc29sdmVQZW5kaW5nKTtcbiAgICB9XG5cbiAgICAvKipcclxuICAgICAqIFNjaGVkdWxlcyBpbnZvY2F0aW9uIG9mIHRoZSBvcmlnaW5hbCBmdW5jdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7dm9pZH1cclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHByb3h5KCkge1xuICAgICAgICB2YXIgdGltZVN0YW1wID0gRGF0ZS5ub3coKTtcblxuICAgICAgICBpZiAobGVhZGluZ0NhbGwpIHtcbiAgICAgICAgICAgIC8vIFJlamVjdCBpbW1lZGlhdGVseSBmb2xsb3dpbmcgY2FsbHMuXG4gICAgICAgICAgICBpZiAodGltZVN0YW1wIC0gbGFzdENhbGxUaW1lIDwgdHJhaWxpbmdUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTY2hlZHVsZSBuZXcgY2FsbCB0byBiZSBpbiBpbnZva2VkIHdoZW4gdGhlIHBlbmRpbmcgb25lIGlzIHJlc29sdmVkLlxuICAgICAgICAgICAgLy8gVGhpcyBpcyBpbXBvcnRhbnQgZm9yIFwidHJhbnNpdGlvbnNcIiB3aGljaCBuZXZlciBhY3R1YWxseSBzdGFydFxuICAgICAgICAgICAgLy8gaW1tZWRpYXRlbHkgc28gdGhlcmUgaXMgYSBjaGFuY2UgdGhhdCB3ZSBtaWdodCBtaXNzIG9uZSBpZiBjaGFuZ2VcbiAgICAgICAgICAgIC8vIGhhcHBlbnMgYW1pZHMgdGhlIHBlbmRpbmcgaW52b2NhdGlvbi5cbiAgICAgICAgICAgIHRyYWlsaW5nQ2FsbCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZWFkaW5nQ2FsbCA9IHRydWU7XG4gICAgICAgICAgICB0cmFpbGluZ0NhbGwgPSBmYWxzZTtcblxuICAgICAgICAgICAgc2V0VGltZW91dCh0aW1lb3V0Q2FsbGJhY2ssIGRlbGF5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxhc3RDYWxsVGltZSA9IHRpbWVTdGFtcDtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJveHk7XG59O1xuXG4vLyBNaW5pbXVtIGRlbGF5IGJlZm9yZSBpbnZva2luZyB0aGUgdXBkYXRlIG9mIG9ic2VydmVycy5cbnZhciBSRUZSRVNIX0RFTEFZID0gMjA7XG5cbi8vIEEgbGlzdCBvZiBzdWJzdHJpbmdzIG9mIENTUyBwcm9wZXJ0aWVzIHVzZWQgdG8gZmluZCB0cmFuc2l0aW9uIGV2ZW50cyB0aGF0XG4vLyBtaWdodCBhZmZlY3QgZGltZW5zaW9ucyBvZiBvYnNlcnZlZCBlbGVtZW50cy5cbnZhciB0cmFuc2l0aW9uS2V5cyA9IFsndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbScsICdsZWZ0JywgJ3dpZHRoJywgJ2hlaWdodCcsICdzaXplJywgJ3dlaWdodCddO1xuXG4vLyBDaGVjayBpZiBNdXRhdGlvbk9ic2VydmVyIGlzIGF2YWlsYWJsZS5cbnZhciBtdXRhdGlvbk9ic2VydmVyU3VwcG9ydGVkID0gdHlwZW9mIE11dGF0aW9uT2JzZXJ2ZXIgIT09ICd1bmRlZmluZWQnO1xuXG4vKipcclxuICogU2luZ2xldG9uIGNvbnRyb2xsZXIgY2xhc3Mgd2hpY2ggaGFuZGxlcyB1cGRhdGVzIG9mIFJlc2l6ZU9ic2VydmVyIGluc3RhbmNlcy5cclxuICovXG52YXIgUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jb25uZWN0ZWRfID0gZmFsc2U7XG4gICAgdGhpcy5tdXRhdGlvbkV2ZW50c0FkZGVkXyA9IGZhbHNlO1xuICAgIHRoaXMubXV0YXRpb25zT2JzZXJ2ZXJfID0gbnVsbDtcbiAgICB0aGlzLm9ic2VydmVyc18gPSBbXTtcblxuICAgIHRoaXMub25UcmFuc2l0aW9uRW5kXyA9IHRoaXMub25UcmFuc2l0aW9uRW5kXy5iaW5kKHRoaXMpO1xuICAgIHRoaXMucmVmcmVzaCA9IHRocm90dGxlKHRoaXMucmVmcmVzaC5iaW5kKHRoaXMpLCBSRUZSRVNIX0RFTEFZKTtcbn07XG5cbi8qKlxyXG4gKiBBZGRzIG9ic2VydmVyIHRvIG9ic2VydmVycyBsaXN0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge1Jlc2l6ZU9ic2VydmVyU1BJfSBvYnNlcnZlciAtIE9ic2VydmVyIHRvIGJlIGFkZGVkLlxyXG4gKiBAcmV0dXJucyB7dm9pZH1cclxuICovXG5cblxuLyoqXHJcbiAqIEhvbGRzIHJlZmVyZW5jZSB0byB0aGUgY29udHJvbGxlcidzIGluc3RhbmNlLlxyXG4gKlxyXG4gKiBAcHJpdmF0ZSB7UmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyfVxyXG4gKi9cblxuXG4vKipcclxuICogS2VlcHMgcmVmZXJlbmNlIHRvIHRoZSBpbnN0YW5jZSBvZiBNdXRhdGlvbk9ic2VydmVyLlxyXG4gKlxyXG4gKiBAcHJpdmF0ZSB7TXV0YXRpb25PYnNlcnZlcn1cclxuICovXG5cbi8qKlxyXG4gKiBJbmRpY2F0ZXMgd2hldGhlciBET00gbGlzdGVuZXJzIGhhdmUgYmVlbiBhZGRlZC5cclxuICpcclxuICogQHByaXZhdGUge2Jvb2xlYW59XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLnByb3RvdHlwZS5hZGRPYnNlcnZlciA9IGZ1bmN0aW9uIChvYnNlcnZlcikge1xuICAgIGlmICghfnRoaXMub2JzZXJ2ZXJzXy5pbmRleE9mKG9ic2VydmVyKSkge1xuICAgICAgICB0aGlzLm9ic2VydmVyc18ucHVzaChvYnNlcnZlcik7XG4gICAgfVxuXG4gICAgLy8gQWRkIGxpc3RlbmVycyBpZiB0aGV5IGhhdmVuJ3QgYmVlbiBhZGRlZCB5ZXQuXG4gICAgaWYgKCF0aGlzLmNvbm5lY3RlZF8pIHtcbiAgICAgICAgdGhpcy5jb25uZWN0XygpO1xuICAgIH1cbn07XG5cbi8qKlxyXG4gKiBSZW1vdmVzIG9ic2VydmVyIGZyb20gb2JzZXJ2ZXJzIGxpc3QuXHJcbiAqXHJcbiAqIEBwYXJhbSB7UmVzaXplT2JzZXJ2ZXJTUEl9IG9ic2VydmVyIC0gT2JzZXJ2ZXIgdG8gYmUgcmVtb3ZlZC5cclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLnByb3RvdHlwZS5yZW1vdmVPYnNlcnZlciA9IGZ1bmN0aW9uIChvYnNlcnZlcikge1xuICAgIHZhciBvYnNlcnZlcnMgPSB0aGlzLm9ic2VydmVyc187XG4gICAgdmFyIGluZGV4ID0gb2JzZXJ2ZXJzLmluZGV4T2Yob2JzZXJ2ZXIpO1xuXG4gICAgLy8gUmVtb3ZlIG9ic2VydmVyIGlmIGl0J3MgcHJlc2VudCBpbiByZWdpc3RyeS5cbiAgICBpZiAofmluZGV4KSB7XG4gICAgICAgIG9ic2VydmVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZSBsaXN0ZW5lcnMgaWYgY29udHJvbGxlciBoYXMgbm8gY29ubmVjdGVkIG9ic2VydmVycy5cbiAgICBpZiAoIW9ic2VydmVycy5sZW5ndGggJiYgdGhpcy5jb25uZWN0ZWRfKSB7XG4gICAgICAgIHRoaXMuZGlzY29ubmVjdF8oKTtcbiAgICB9XG59O1xuXG4vKipcclxuICogSW52b2tlcyB0aGUgdXBkYXRlIG9mIG9ic2VydmVycy4gSXQgd2lsbCBjb250aW51ZSBydW5uaW5nIHVwZGF0ZXMgaW5zb2ZhclxyXG4gKiBpdCBkZXRlY3RzIGNoYW5nZXMuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHt2b2lkfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5wcm90b3R5cGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2hhbmdlc0RldGVjdGVkID0gdGhpcy51cGRhdGVPYnNlcnZlcnNfKCk7XG5cbiAgICAvLyBDb250aW51ZSBydW5uaW5nIHVwZGF0ZXMgaWYgY2hhbmdlcyBoYXZlIGJlZW4gZGV0ZWN0ZWQgYXMgdGhlcmUgbWlnaHRcbiAgICAvLyBiZSBmdXR1cmUgb25lcyBjYXVzZWQgYnkgQ1NTIHRyYW5zaXRpb25zLlxuICAgIGlmIChjaGFuZ2VzRGV0ZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgfVxufTtcblxuLyoqXHJcbiAqIFVwZGF0ZXMgZXZlcnkgb2JzZXJ2ZXIgZnJvbSBvYnNlcnZlcnMgbGlzdCBhbmQgbm90aWZpZXMgdGhlbSBvZiBxdWV1ZWRcclxuICogZW50cmllcy5cclxuICpcclxuICogQHByaXZhdGVcclxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgXCJ0cnVlXCIgaWYgYW55IG9ic2VydmVyIGhhcyBkZXRlY3RlZCBjaGFuZ2VzIGluXHJcbiAqICBkaW1lbnNpb25zIG9mIGl0J3MgZWxlbWVudHMuXHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVPYnNlcnZlcnNfID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIENvbGxlY3Qgb2JzZXJ2ZXJzIHRoYXQgaGF2ZSBhY3RpdmUgb2JzZXJ2YXRpb25zLlxuICAgIHZhciBhY3RpdmVPYnNlcnZlcnMgPSB0aGlzLm9ic2VydmVyc18uZmlsdGVyKGZ1bmN0aW9uIChvYnNlcnZlcikge1xuICAgICAgICByZXR1cm4gb2JzZXJ2ZXIuZ2F0aGVyQWN0aXZlKCksIG9ic2VydmVyLmhhc0FjdGl2ZSgpO1xuICAgIH0pO1xuXG4gICAgLy8gRGVsaXZlciBub3RpZmljYXRpb25zIGluIGEgc2VwYXJhdGUgY3ljbGUgaW4gb3JkZXIgdG8gYXZvaWQgYW55XG4gICAgLy8gY29sbGlzaW9ucyBiZXR3ZWVuIG9ic2VydmVycywgZS5nLiB3aGVuIG11bHRpcGxlIGluc3RhbmNlcyBvZlxuICAgIC8vIFJlc2l6ZU9ic2VydmVyIGFyZSB0cmFja2luZyB0aGUgc2FtZSBlbGVtZW50IGFuZCB0aGUgY2FsbGJhY2sgb2Ygb25lXG4gICAgLy8gb2YgdGhlbSBjaGFuZ2VzIGNvbnRlbnQgZGltZW5zaW9ucyBvZiB0aGUgb2JzZXJ2ZWQgdGFyZ2V0LiBTb21ldGltZXNcbiAgICAvLyB0aGlzIG1heSByZXN1bHQgaW4gbm90aWZpY2F0aW9ucyBiZWluZyBibG9ja2VkIGZvciB0aGUgcmVzdCBvZiBvYnNlcnZlcnMuXG4gICAgYWN0aXZlT2JzZXJ2ZXJzLmZvckVhY2goZnVuY3Rpb24gKG9ic2VydmVyKSB7IHJldHVybiBvYnNlcnZlci5icm9hZGNhc3RBY3RpdmUoKTsgfSk7XG5cbiAgICByZXR1cm4gYWN0aXZlT2JzZXJ2ZXJzLmxlbmd0aCA+IDA7XG59O1xuXG4vKipcclxuICogSW5pdGlhbGl6ZXMgRE9NIGxpc3RlbmVycy5cclxuICpcclxuICogQHByaXZhdGVcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLnByb3RvdHlwZS5jb25uZWN0XyA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBEbyBub3RoaW5nIGlmIHJ1bm5pbmcgaW4gYSBub24tYnJvd3NlciBlbnZpcm9ubWVudCBvciBpZiBsaXN0ZW5lcnNcbiAgICAvLyBoYXZlIGJlZW4gYWxyZWFkeSBhZGRlZC5cbiAgICBpZiAoIWlzQnJvd3NlciB8fCB0aGlzLmNvbm5lY3RlZF8pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmlwdGlvbiB0byB0aGUgXCJUcmFuc2l0aW9uZW5kXCIgZXZlbnQgaXMgdXNlZCBhcyBhIHdvcmthcm91bmQgZm9yXG4gICAgLy8gZGVsYXllZCB0cmFuc2l0aW9ucy4gVGhpcyB3YXkgaXQncyBwb3NzaWJsZSB0byBjYXB0dXJlIGF0IGxlYXN0IHRoZVxuICAgIC8vIGZpbmFsIHN0YXRlIG9mIGFuIGVsZW1lbnQuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIHRoaXMub25UcmFuc2l0aW9uRW5kXyk7XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5yZWZyZXNoKTtcblxuICAgIGlmIChtdXRhdGlvbk9ic2VydmVyU3VwcG9ydGVkKSB7XG4gICAgICAgIHRoaXMubXV0YXRpb25zT2JzZXJ2ZXJfID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIodGhpcy5yZWZyZXNoKTtcblxuICAgICAgICB0aGlzLm11dGF0aW9uc09ic2VydmVyXy5vYnNlcnZlKGRvY3VtZW50LCB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgICAgY2hhcmFjdGVyRGF0YTogdHJ1ZSxcbiAgICAgICAgICAgIHN1YnRyZWU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NU3VidHJlZU1vZGlmaWVkJywgdGhpcy5yZWZyZXNoKTtcblxuICAgICAgICB0aGlzLm11dGF0aW9uRXZlbnRzQWRkZWRfID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbm5lY3RlZF8gPSB0cnVlO1xufTtcblxuLyoqXHJcbiAqIFJlbW92ZXMgRE9NIGxpc3RlbmVycy5cclxuICpcclxuICogQHByaXZhdGVcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLnByb3RvdHlwZS5kaXNjb25uZWN0XyA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBEbyBub3RoaW5nIGlmIHJ1bm5pbmcgaW4gYSBub24tYnJvd3NlciBlbnZpcm9ubWVudCBvciBpZiBsaXN0ZW5lcnNcbiAgICAvLyBoYXZlIGJlZW4gYWxyZWFkeSByZW1vdmVkLlxuICAgIGlmICghaXNCcm93c2VyIHx8ICF0aGlzLmNvbm5lY3RlZF8pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCB0aGlzLm9uVHJhbnNpdGlvbkVuZF8pO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLnJlZnJlc2gpO1xuXG4gICAgaWYgKHRoaXMubXV0YXRpb25zT2JzZXJ2ZXJfKSB7XG4gICAgICAgIHRoaXMubXV0YXRpb25zT2JzZXJ2ZXJfLmRpc2Nvbm5lY3QoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5tdXRhdGlvbkV2ZW50c0FkZGVkXykge1xuICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdET01TdWJ0cmVlTW9kaWZpZWQnLCB0aGlzLnJlZnJlc2gpO1xuICAgIH1cblxuICAgIHRoaXMubXV0YXRpb25zT2JzZXJ2ZXJfID0gbnVsbDtcbiAgICB0aGlzLm11dGF0aW9uRXZlbnRzQWRkZWRfID0gZmFsc2U7XG4gICAgdGhpcy5jb25uZWN0ZWRfID0gZmFsc2U7XG59O1xuXG4vKipcclxuICogXCJUcmFuc2l0aW9uZW5kXCIgZXZlbnQgaGFuZGxlci5cclxuICpcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtIHtUcmFuc2l0aW9uRXZlbnR9IGV2ZW50XHJcbiAqIEByZXR1cm5zIHt2b2lkfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5wcm90b3R5cGUub25UcmFuc2l0aW9uRW5kXyA9IGZ1bmN0aW9uIChyZWYpIHtcbiAgICAgICAgdmFyIHByb3BlcnR5TmFtZSA9IHJlZi5wcm9wZXJ0eU5hbWU7IGlmICggcHJvcGVydHlOYW1lID09PSB2b2lkIDAgKSBwcm9wZXJ0eU5hbWUgPSAnJztcblxuICAgIC8vIERldGVjdCB3aGV0aGVyIHRyYW5zaXRpb24gbWF5IGFmZmVjdCBkaW1lbnNpb25zIG9mIGFuIGVsZW1lbnQuXG4gICAgdmFyIGlzUmVmbG93UHJvcGVydHkgPSB0cmFuc2l0aW9uS2V5cy5zb21lKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgcmV0dXJuICEhfnByb3BlcnR5TmFtZS5pbmRleE9mKGtleSk7XG4gICAgfSk7XG5cbiAgICBpZiAoaXNSZWZsb3dQcm9wZXJ0eSkge1xuICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICB9XG59O1xuXG4vKipcclxuICogUmV0dXJucyBpbnN0YW5jZSBvZiB0aGUgUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7UmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5nZXRJbnN0YW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuaW5zdGFuY2VfKSB7XG4gICAgICAgIHRoaXMuaW5zdGFuY2VfID0gbmV3IFJlc2l6ZU9ic2VydmVyQ29udHJvbGxlcigpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmluc3RhbmNlXztcbn07XG5cblJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5pbnN0YW5jZV8gPSBudWxsO1xuXG4vKipcclxuICogRGVmaW5lcyBub24td3JpdGFibGUvZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIHRoZSBwcm92aWRlZCB0YXJnZXQgb2JqZWN0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0IC0gT2JqZWN0IGZvciB3aGljaCB0byBkZWZpbmUgcHJvcGVydGllcy5cclxuICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gUHJvcGVydGllcyB0byBiZSBkZWZpbmVkLlxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBUYXJnZXQgb2JqZWN0LlxyXG4gKi9cbnZhciBkZWZpbmVDb25maWd1cmFibGUgPSAoZnVuY3Rpb24gKHRhcmdldCwgcHJvcHMpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGlzdCA9IE9iamVjdC5rZXlzKHByb3BzKTsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIGtleSA9IGxpc3RbaV07XG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCB7XG4gICAgICAgICAgICB2YWx1ZTogcHJvcHNba2V5XSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB0YXJnZXQ7XG59KTtcblxuLyoqXHJcbiAqIFJldHVybnMgdGhlIGdsb2JhbCBvYmplY3QgYXNzb2NpYXRlZCB3aXRoIHByb3ZpZGVkIGVsZW1lbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXRcclxuICogQHJldHVybnMge09iamVjdH1cclxuICovXG52YXIgZ2V0V2luZG93T2YgPSAoZnVuY3Rpb24gKHRhcmdldCkge1xuICAgIC8vIEFzc3VtZSB0aGF0IHRoZSBlbGVtZW50IGlzIGFuIGluc3RhbmNlIG9mIE5vZGUsIHdoaWNoIG1lYW5zIHRoYXQgaXRcbiAgICAvLyBoYXMgdGhlIFwib3duZXJEb2N1bWVudFwiIHByb3BlcnR5IGZyb20gd2hpY2ggd2UgY2FuIHJldHJpZXZlIGFcbiAgICAvLyBjb3JyZXNwb25kaW5nIGdsb2JhbCBvYmplY3QuXG4gICAgdmFyIG93bmVyR2xvYmFsID0gdGFyZ2V0ICYmIHRhcmdldC5vd25lckRvY3VtZW50ICYmIHRhcmdldC5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3O1xuXG4gICAgLy8gUmV0dXJuIHRoZSBsb2NhbCBnbG9iYWwgb2JqZWN0IGlmIGl0J3Mgbm90IHBvc3NpYmxlIGV4dHJhY3Qgb25lIGZyb21cbiAgICAvLyBwcm92aWRlZCBlbGVtZW50LlxuICAgIHJldHVybiBvd25lckdsb2JhbCB8fCBnbG9iYWwkMTtcbn0pO1xuXG4vLyBQbGFjZWhvbGRlciBvZiBhbiBlbXB0eSBjb250ZW50IHJlY3RhbmdsZS5cbnZhciBlbXB0eVJlY3QgPSBjcmVhdGVSZWN0SW5pdCgwLCAwLCAwLCAwKTtcblxuLyoqXHJcbiAqIENvbnZlcnRzIHByb3ZpZGVkIHN0cmluZyB0byBhIG51bWJlci5cclxuICpcclxuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSB2YWx1ZVxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gKi9cbmZ1bmN0aW9uIHRvRmxvYXQodmFsdWUpIHtcbiAgICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZSkgfHwgMDtcbn1cblxuLyoqXHJcbiAqIEV4dHJhY3RzIGJvcmRlcnMgc2l6ZSBmcm9tIHByb3ZpZGVkIHN0eWxlcy5cclxuICpcclxuICogQHBhcmFtIHtDU1NTdHlsZURlY2xhcmF0aW9ufSBzdHlsZXNcclxuICogQHBhcmFtIHsuLi5zdHJpbmd9IHBvc2l0aW9ucyAtIEJvcmRlcnMgcG9zaXRpb25zICh0b3AsIHJpZ2h0LCAuLi4pXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAqL1xuZnVuY3Rpb24gZ2V0Qm9yZGVyc1NpemUoc3R5bGVzKSB7XG4gICAgdmFyIHBvc2l0aW9ucyA9IFtdLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoIC0gMTtcbiAgICB3aGlsZSAoIGxlbi0tID4gMCApIHBvc2l0aW9uc1sgbGVuIF0gPSBhcmd1bWVudHNbIGxlbiArIDEgXTtcblxuICAgIHJldHVybiBwb3NpdGlvbnMucmVkdWNlKGZ1bmN0aW9uIChzaXplLCBwb3NpdGlvbikge1xuICAgICAgICB2YXIgdmFsdWUgPSBzdHlsZXNbJ2JvcmRlci0nICsgcG9zaXRpb24gKyAnLXdpZHRoJ107XG5cbiAgICAgICAgcmV0dXJuIHNpemUgKyB0b0Zsb2F0KHZhbHVlKTtcbiAgICB9LCAwKTtcbn1cblxuLyoqXHJcbiAqIEV4dHJhY3RzIHBhZGRpbmdzIHNpemVzIGZyb20gcHJvdmlkZWQgc3R5bGVzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0NTU1N0eWxlRGVjbGFyYXRpb259IHN0eWxlc1xyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBQYWRkaW5ncyBib3guXHJcbiAqL1xuZnVuY3Rpb24gZ2V0UGFkZGluZ3Moc3R5bGVzKSB7XG4gICAgdmFyIHBvc2l0aW9ucyA9IFsndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbScsICdsZWZ0J107XG4gICAgdmFyIHBhZGRpbmdzID0ge307XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbGlzdCA9IHBvc2l0aW9uczsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIHBvc2l0aW9uID0gbGlzdFtpXTtcblxuICAgICAgICB2YXIgdmFsdWUgPSBzdHlsZXNbJ3BhZGRpbmctJyArIHBvc2l0aW9uXTtcblxuICAgICAgICBwYWRkaW5nc1twb3NpdGlvbl0gPSB0b0Zsb2F0KHZhbHVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFkZGluZ3M7XG59XG5cbi8qKlxyXG4gKiBDYWxjdWxhdGVzIGNvbnRlbnQgcmVjdGFuZ2xlIG9mIHByb3ZpZGVkIFNWRyBlbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge1NWR0dyYXBoaWNzRWxlbWVudH0gdGFyZ2V0IC0gRWxlbWVudCBjb250ZW50IHJlY3RhbmdsZSBvZiB3aGljaCBuZWVkc1xyXG4gKiAgICAgIHRvIGJlIGNhbGN1bGF0ZWQuXHJcbiAqIEByZXR1cm5zIHtET01SZWN0SW5pdH1cclxuICovXG5mdW5jdGlvbiBnZXRTVkdDb250ZW50UmVjdCh0YXJnZXQpIHtcbiAgICB2YXIgYmJveCA9IHRhcmdldC5nZXRCQm94KCk7XG5cbiAgICByZXR1cm4gY3JlYXRlUmVjdEluaXQoMCwgMCwgYmJveC53aWR0aCwgYmJveC5oZWlnaHQpO1xufVxuXG4vKipcclxuICogQ2FsY3VsYXRlcyBjb250ZW50IHJlY3RhbmdsZSBvZiBwcm92aWRlZCBIVE1MRWxlbWVudC5cclxuICpcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IC0gRWxlbWVudCBmb3Igd2hpY2ggdG8gY2FsY3VsYXRlIHRoZSBjb250ZW50IHJlY3RhbmdsZS5cclxuICogQHJldHVybnMge0RPTVJlY3RJbml0fVxyXG4gKi9cbmZ1bmN0aW9uIGdldEhUTUxFbGVtZW50Q29udGVudFJlY3QodGFyZ2V0KSB7XG4gICAgLy8gQ2xpZW50IHdpZHRoICYgaGVpZ2h0IHByb3BlcnRpZXMgY2FuJ3QgYmVcbiAgICAvLyB1c2VkIGV4Y2x1c2l2ZWx5IGFzIHRoZXkgcHJvdmlkZSByb3VuZGVkIHZhbHVlcy5cbiAgICB2YXIgY2xpZW50V2lkdGggPSB0YXJnZXQuY2xpZW50V2lkdGg7XG4gICAgdmFyIGNsaWVudEhlaWdodCA9IHRhcmdldC5jbGllbnRIZWlnaHQ7XG5cbiAgICAvLyBCeSB0aGlzIGNvbmRpdGlvbiB3ZSBjYW4gY2F0Y2ggYWxsIG5vbi1yZXBsYWNlZCBpbmxpbmUsIGhpZGRlbiBhbmRcbiAgICAvLyBkZXRhY2hlZCBlbGVtZW50cy4gVGhvdWdoIGVsZW1lbnRzIHdpdGggd2lkdGggJiBoZWlnaHQgcHJvcGVydGllcyBsZXNzXG4gICAgLy8gdGhhbiAwLjUgd2lsbCBiZSBkaXNjYXJkZWQgYXMgd2VsbC5cbiAgICAvL1xuICAgIC8vIFdpdGhvdXQgaXQgd2Ugd291bGQgbmVlZCB0byBpbXBsZW1lbnQgc2VwYXJhdGUgbWV0aG9kcyBmb3IgZWFjaCBvZlxuICAgIC8vIHRob3NlIGNhc2VzIGFuZCBpdCdzIG5vdCBwb3NzaWJsZSB0byBwZXJmb3JtIGEgcHJlY2lzZSBhbmQgcGVyZm9ybWFuY2VcbiAgICAvLyBlZmZlY3RpdmUgdGVzdCBmb3IgaGlkZGVuIGVsZW1lbnRzLiBFLmcuIGV2ZW4galF1ZXJ5J3MgJzp2aXNpYmxlJyBmaWx0ZXJcbiAgICAvLyBnaXZlcyB3cm9uZyByZXN1bHRzIGZvciBlbGVtZW50cyB3aXRoIHdpZHRoICYgaGVpZ2h0IGxlc3MgdGhhbiAwLjUuXG4gICAgaWYgKCFjbGllbnRXaWR0aCAmJiAhY2xpZW50SGVpZ2h0KSB7XG4gICAgICAgIHJldHVybiBlbXB0eVJlY3Q7XG4gICAgfVxuXG4gICAgdmFyIHN0eWxlcyA9IGdldFdpbmRvd09mKHRhcmdldCkuZ2V0Q29tcHV0ZWRTdHlsZSh0YXJnZXQpO1xuICAgIHZhciBwYWRkaW5ncyA9IGdldFBhZGRpbmdzKHN0eWxlcyk7XG4gICAgdmFyIGhvcml6UGFkID0gcGFkZGluZ3MubGVmdCArIHBhZGRpbmdzLnJpZ2h0O1xuICAgIHZhciB2ZXJ0UGFkID0gcGFkZGluZ3MudG9wICsgcGFkZGluZ3MuYm90dG9tO1xuXG4gICAgLy8gQ29tcHV0ZWQgc3R5bGVzIG9mIHdpZHRoICYgaGVpZ2h0IGFyZSBiZWluZyB1c2VkIGJlY2F1c2UgdGhleSBhcmUgdGhlXG4gICAgLy8gb25seSBkaW1lbnNpb25zIGF2YWlsYWJsZSB0byBKUyB0aGF0IGNvbnRhaW4gbm9uLXJvdW5kZWQgdmFsdWVzLiBJdCBjb3VsZFxuICAgIC8vIGJlIHBvc3NpYmxlIHRvIHV0aWxpemUgdGhlIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBpZiBvbmx5IGl0J3MgZGF0YSB3YXNuJ3RcbiAgICAvLyBhZmZlY3RlZCBieSBDU1MgdHJhbnNmb3JtYXRpb25zIGxldCBhbG9uZSBwYWRkaW5ncywgYm9yZGVycyBhbmQgc2Nyb2xsIGJhcnMuXG4gICAgdmFyIHdpZHRoID0gdG9GbG9hdChzdHlsZXMud2lkdGgpLFxuICAgICAgICBoZWlnaHQgPSB0b0Zsb2F0KHN0eWxlcy5oZWlnaHQpO1xuXG4gICAgLy8gV2lkdGggJiBoZWlnaHQgaW5jbHVkZSBwYWRkaW5ncyBhbmQgYm9yZGVycyB3aGVuIHRoZSAnYm9yZGVyLWJveCcgYm94XG4gICAgLy8gbW9kZWwgaXMgYXBwbGllZCAoZXhjZXB0IGZvciBJRSkuXG4gICAgaWYgKHN0eWxlcy5ib3hTaXppbmcgPT09ICdib3JkZXItYm94Jykge1xuICAgICAgICAvLyBGb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgcmVxdWlyZWQgdG8gaGFuZGxlIEludGVybmV0IEV4cGxvcmVyIHdoaWNoXG4gICAgICAgIC8vIGRvZXNuJ3QgaW5jbHVkZSBwYWRkaW5ncyBhbmQgYm9yZGVycyB0byBjb21wdXRlZCBDU1MgZGltZW5zaW9ucy5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gV2UgY2FuIHNheSB0aGF0IGlmIENTUyBkaW1lbnNpb25zICsgcGFkZGluZ3MgYXJlIGVxdWFsIHRvIHRoZSBcImNsaWVudFwiXG4gICAgICAgIC8vIHByb3BlcnRpZXMgdGhlbiBpdCdzIGVpdGhlciBJRSwgYW5kIHRodXMgd2UgZG9uJ3QgbmVlZCB0byBzdWJ0cmFjdFxuICAgICAgICAvLyBhbnl0aGluZywgb3IgYW4gZWxlbWVudCBtZXJlbHkgZG9lc24ndCBoYXZlIHBhZGRpbmdzL2JvcmRlcnMgc3R5bGVzLlxuICAgICAgICBpZiAoTWF0aC5yb3VuZCh3aWR0aCArIGhvcml6UGFkKSAhPT0gY2xpZW50V2lkdGgpIHtcbiAgICAgICAgICAgIHdpZHRoIC09IGdldEJvcmRlcnNTaXplKHN0eWxlcywgJ2xlZnQnLCAncmlnaHQnKSArIGhvcml6UGFkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKE1hdGgucm91bmQoaGVpZ2h0ICsgdmVydFBhZCkgIT09IGNsaWVudEhlaWdodCkge1xuICAgICAgICAgICAgaGVpZ2h0IC09IGdldEJvcmRlcnNTaXplKHN0eWxlcywgJ3RvcCcsICdib3R0b20nKSArIHZlcnRQYWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGb2xsb3dpbmcgc3RlcHMgY2FuJ3QgYmUgYXBwbGllZCB0byB0aGUgZG9jdW1lbnQncyByb290IGVsZW1lbnQgYXMgaXRzXG4gICAgLy8gY2xpZW50W1dpZHRoL0hlaWdodF0gcHJvcGVydGllcyByZXByZXNlbnQgdmlld3BvcnQgYXJlYSBvZiB0aGUgd2luZG93LlxuICAgIC8vIEJlc2lkZXMsIGl0J3MgYXMgd2VsbCBub3QgbmVjZXNzYXJ5IGFzIHRoZSA8aHRtbD4gaXRzZWxmIG5laXRoZXIgaGFzXG4gICAgLy8gcmVuZGVyZWQgc2Nyb2xsIGJhcnMgbm9yIGl0IGNhbiBiZSBjbGlwcGVkLlxuICAgIGlmICghaXNEb2N1bWVudEVsZW1lbnQodGFyZ2V0KSkge1xuICAgICAgICAvLyBJbiBzb21lIGJyb3dzZXJzIChvbmx5IGluIEZpcmVmb3gsIGFjdHVhbGx5KSBDU1Mgd2lkdGggJiBoZWlnaHRcbiAgICAgICAgLy8gaW5jbHVkZSBzY3JvbGwgYmFycyBzaXplIHdoaWNoIGNhbiBiZSByZW1vdmVkIGF0IHRoaXMgc3RlcCBhcyBzY3JvbGxcbiAgICAgICAgLy8gYmFycyBhcmUgdGhlIG9ubHkgZGlmZmVyZW5jZSBiZXR3ZWVuIHJvdW5kZWQgZGltZW5zaW9ucyArIHBhZGRpbmdzXG4gICAgICAgIC8vIGFuZCBcImNsaWVudFwiIHByb3BlcnRpZXMsIHRob3VnaCB0aGF0IGlzIG5vdCBhbHdheXMgdHJ1ZSBpbiBDaHJvbWUuXG4gICAgICAgIHZhciB2ZXJ0U2Nyb2xsYmFyID0gTWF0aC5yb3VuZCh3aWR0aCArIGhvcml6UGFkKSAtIGNsaWVudFdpZHRoO1xuICAgICAgICB2YXIgaG9yaXpTY3JvbGxiYXIgPSBNYXRoLnJvdW5kKGhlaWdodCArIHZlcnRQYWQpIC0gY2xpZW50SGVpZ2h0O1xuXG4gICAgICAgIC8vIENocm9tZSBoYXMgYSByYXRoZXIgd2VpcmQgcm91bmRpbmcgb2YgXCJjbGllbnRcIiBwcm9wZXJ0aWVzLlxuICAgICAgICAvLyBFLmcuIGZvciBhbiBlbGVtZW50IHdpdGggY29udGVudCB3aWR0aCBvZiAzMTQuMnB4IGl0IHNvbWV0aW1lcyBnaXZlc1xuICAgICAgICAvLyB0aGUgY2xpZW50IHdpZHRoIG9mIDMxNXB4IGFuZCBmb3IgdGhlIHdpZHRoIG9mIDMxNC43cHggaXQgbWF5IGdpdmVcbiAgICAgICAgLy8gMzE0cHguIEFuZCBpdCBkb2Vzbid0IGhhcHBlbiBhbGwgdGhlIHRpbWUuIFNvIGp1c3QgaWdub3JlIHRoaXMgZGVsdGFcbiAgICAgICAgLy8gYXMgYSBub24tcmVsZXZhbnQuXG4gICAgICAgIGlmIChNYXRoLmFicyh2ZXJ0U2Nyb2xsYmFyKSAhPT0gMSkge1xuICAgICAgICAgICAgd2lkdGggLT0gdmVydFNjcm9sbGJhcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChNYXRoLmFicyhob3JpelNjcm9sbGJhcikgIT09IDEpIHtcbiAgICAgICAgICAgIGhlaWdodCAtPSBob3JpelNjcm9sbGJhcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjcmVhdGVSZWN0SW5pdChwYWRkaW5ncy5sZWZ0LCBwYWRkaW5ncy50b3AsIHdpZHRoLCBoZWlnaHQpO1xufVxuXG4vKipcclxuICogQ2hlY2tzIHdoZXRoZXIgcHJvdmlkZWQgZWxlbWVudCBpcyBhbiBpbnN0YW5jZSBvZiB0aGUgU1ZHR3JhcGhpY3NFbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCAtIEVsZW1lbnQgdG8gYmUgY2hlY2tlZC5cclxuICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAqL1xudmFyIGlzU1ZHR3JhcGhpY3NFbGVtZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICAvLyBTb21lIGJyb3dzZXJzLCBuYW1lbHkgSUUgYW5kIEVkZ2UsIGRvbid0IGhhdmUgdGhlIFNWR0dyYXBoaWNzRWxlbWVudFxuICAgIC8vIGludGVyZmFjZS5cbiAgICBpZiAodHlwZW9mIFNWR0dyYXBoaWNzRWxlbWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQpIHsgcmV0dXJuIHRhcmdldCBpbnN0YW5jZW9mIGdldFdpbmRvd09mKHRhcmdldCkuU1ZHR3JhcGhpY3NFbGVtZW50OyB9O1xuICAgIH1cblxuICAgIC8vIElmIGl0J3Mgc28sIHRoZW4gY2hlY2sgdGhhdCBlbGVtZW50IGlzIGF0IGxlYXN0IGFuIGluc3RhbmNlIG9mIHRoZVxuICAgIC8vIFNWR0VsZW1lbnQgYW5kIHRoYXQgaXQgaGFzIHRoZSBcImdldEJCb3hcIiBtZXRob2QuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWV4dHJhLXBhcmVuc1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0KSB7IHJldHVybiB0YXJnZXQgaW5zdGFuY2VvZiBnZXRXaW5kb3dPZih0YXJnZXQpLlNWR0VsZW1lbnQgJiYgdHlwZW9mIHRhcmdldC5nZXRCQm94ID09PSAnZnVuY3Rpb24nOyB9O1xufSkoKTtcblxuLyoqXHJcbiAqIENoZWNrcyB3aGV0aGVyIHByb3ZpZGVkIGVsZW1lbnQgaXMgYSBkb2N1bWVudCBlbGVtZW50ICg8aHRtbD4pLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCAtIEVsZW1lbnQgdG8gYmUgY2hlY2tlZC5cclxuICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAqL1xuZnVuY3Rpb24gaXNEb2N1bWVudEVsZW1lbnQodGFyZ2V0KSB7XG4gICAgcmV0dXJuIHRhcmdldCA9PT0gZ2V0V2luZG93T2YodGFyZ2V0KS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG59XG5cbi8qKlxyXG4gKiBDYWxjdWxhdGVzIGFuIGFwcHJvcHJpYXRlIGNvbnRlbnQgcmVjdGFuZ2xlIGZvciBwcm92aWRlZCBodG1sIG9yIHN2ZyBlbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCAtIEVsZW1lbnQgY29udGVudCByZWN0YW5nbGUgb2Ygd2hpY2ggbmVlZHMgdG8gYmUgY2FsY3VsYXRlZC5cclxuICogQHJldHVybnMge0RPTVJlY3RJbml0fVxyXG4gKi9cbmZ1bmN0aW9uIGdldENvbnRlbnRSZWN0KHRhcmdldCkge1xuICAgIGlmICghaXNCcm93c2VyKSB7XG4gICAgICAgIHJldHVybiBlbXB0eVJlY3Q7XG4gICAgfVxuXG4gICAgaWYgKGlzU1ZHR3JhcGhpY3NFbGVtZW50KHRhcmdldCkpIHtcbiAgICAgICAgcmV0dXJuIGdldFNWR0NvbnRlbnRSZWN0KHRhcmdldCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGdldEhUTUxFbGVtZW50Q29udGVudFJlY3QodGFyZ2V0KTtcbn1cblxuLyoqXHJcbiAqIENyZWF0ZXMgcmVjdGFuZ2xlIHdpdGggYW4gaW50ZXJmYWNlIG9mIHRoZSBET01SZWN0UmVhZE9ubHkuXHJcbiAqIFNwZWM6IGh0dHBzOi8vZHJhZnRzLmZ4dGYub3JnL2dlb21ldHJ5LyNkb21yZWN0cmVhZG9ubHlcclxuICpcclxuICogQHBhcmFtIHtET01SZWN0SW5pdH0gcmVjdEluaXQgLSBPYmplY3Qgd2l0aCByZWN0YW5nbGUncyB4L3kgY29vcmRpbmF0ZXMgYW5kIGRpbWVuc2lvbnMuXHJcbiAqIEByZXR1cm5zIHtET01SZWN0UmVhZE9ubHl9XHJcbiAqL1xuZnVuY3Rpb24gY3JlYXRlUmVhZE9ubHlSZWN0KHJlZikge1xuICAgIHZhciB4ID0gcmVmLng7XG4gICAgdmFyIHkgPSByZWYueTtcbiAgICB2YXIgd2lkdGggPSByZWYud2lkdGg7XG4gICAgdmFyIGhlaWdodCA9IHJlZi5oZWlnaHQ7XG5cbiAgICAvLyBJZiBET01SZWN0UmVhZE9ubHkgaXMgYXZhaWxhYmxlIHVzZSBpdCBhcyBhIHByb3RvdHlwZSBmb3IgdGhlIHJlY3RhbmdsZS5cbiAgICB2YXIgQ29uc3RyID0gdHlwZW9mIERPTVJlY3RSZWFkT25seSAhPT0gJ3VuZGVmaW5lZCcgPyBET01SZWN0UmVhZE9ubHkgOiBPYmplY3Q7XG4gICAgdmFyIHJlY3QgPSBPYmplY3QuY3JlYXRlKENvbnN0ci5wcm90b3R5cGUpO1xuXG4gICAgLy8gUmVjdGFuZ2xlJ3MgcHJvcGVydGllcyBhcmUgbm90IHdyaXRhYmxlIGFuZCBub24tZW51bWVyYWJsZS5cbiAgICBkZWZpbmVDb25maWd1cmFibGUocmVjdCwge1xuICAgICAgICB4OiB4LCB5OiB5LCB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICB0b3A6IHksXG4gICAgICAgIHJpZ2h0OiB4ICsgd2lkdGgsXG4gICAgICAgIGJvdHRvbTogaGVpZ2h0ICsgeSxcbiAgICAgICAgbGVmdDogeFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlY3Q7XG59XG5cbi8qKlxyXG4gKiBDcmVhdGVzIERPTVJlY3RJbml0IG9iamVjdCBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgZGltZW5zaW9ucyBhbmQgdGhlIHgveSBjb29yZGluYXRlcy5cclxuICogU3BlYzogaHR0cHM6Ly9kcmFmdHMuZnh0Zi5vcmcvZ2VvbWV0cnkvI2RpY3RkZWYtZG9tcmVjdGluaXRcclxuICpcclxuICogQHBhcmFtIHtudW1iZXJ9IHggLSBYIGNvb3JkaW5hdGUuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gWSBjb29yZGluYXRlLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gd2lkdGggLSBSZWN0YW5nbGUncyB3aWR0aC5cclxuICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIFJlY3RhbmdsZSdzIGhlaWdodC5cclxuICogQHJldHVybnMge0RPTVJlY3RJbml0fVxyXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVJlY3RJbml0KHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcbiAgICByZXR1cm4geyB4OiB4LCB5OiB5LCB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0IH07XG59XG5cbi8qKlxyXG4gKiBDbGFzcyB0aGF0IGlzIHJlc3BvbnNpYmxlIGZvciBjb21wdXRhdGlvbnMgb2YgdGhlIGNvbnRlbnQgcmVjdGFuZ2xlIG9mXHJcbiAqIHByb3ZpZGVkIERPTSBlbGVtZW50IGFuZCBmb3Iga2VlcGluZyB0cmFjayBvZiBpdCdzIGNoYW5nZXMuXHJcbiAqL1xudmFyIFJlc2l6ZU9ic2VydmF0aW9uID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgdGhpcy5icm9hZGNhc3RXaWR0aCA9IDA7XG4gICAgdGhpcy5icm9hZGNhc3RIZWlnaHQgPSAwO1xuICAgIHRoaXMuY29udGVudFJlY3RfID0gY3JlYXRlUmVjdEluaXQoMCwgMCwgMCwgMCk7XG5cbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbn07XG5cbi8qKlxyXG4gKiBVcGRhdGVzIGNvbnRlbnQgcmVjdGFuZ2xlIGFuZCB0ZWxscyB3aGV0aGVyIGl0J3Mgd2lkdGggb3IgaGVpZ2h0IHByb3BlcnRpZXNcclxuICogaGF2ZSBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IGJyb2FkY2FzdC5cclxuICpcclxuICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAqL1xuXG5cbi8qKlxyXG4gKiBSZWZlcmVuY2UgdG8gdGhlIGxhc3Qgb2JzZXJ2ZWQgY29udGVudCByZWN0YW5nbGUuXHJcbiAqXHJcbiAqIEBwcml2YXRlIHtET01SZWN0SW5pdH1cclxuICovXG5cblxuLyoqXHJcbiAqIEJyb2FkY2FzdGVkIHdpZHRoIG9mIGNvbnRlbnQgcmVjdGFuZ2xlLlxyXG4gKlxyXG4gKiBAdHlwZSB7bnVtYmVyfVxyXG4gKi9cblJlc2l6ZU9ic2VydmF0aW9uLnByb3RvdHlwZS5pc0FjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVjdCA9IGdldENvbnRlbnRSZWN0KHRoaXMudGFyZ2V0KTtcblxuICAgIHRoaXMuY29udGVudFJlY3RfID0gcmVjdDtcblxuICAgIHJldHVybiByZWN0LndpZHRoICE9PSB0aGlzLmJyb2FkY2FzdFdpZHRoIHx8IHJlY3QuaGVpZ2h0ICE9PSB0aGlzLmJyb2FkY2FzdEhlaWdodDtcbn07XG5cbi8qKlxyXG4gKiBVcGRhdGVzICdicm9hZGNhc3RXaWR0aCcgYW5kICdicm9hZGNhc3RIZWlnaHQnIHByb3BlcnRpZXMgd2l0aCBhIGRhdGFcclxuICogZnJvbSB0aGUgY29ycmVzcG9uZGluZyBwcm9wZXJ0aWVzIG9mIHRoZSBsYXN0IG9ic2VydmVkIGNvbnRlbnQgcmVjdGFuZ2xlLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7RE9NUmVjdEluaXR9IExhc3Qgb2JzZXJ2ZWQgY29udGVudCByZWN0YW5nbGUuXHJcbiAqL1xuUmVzaXplT2JzZXJ2YXRpb24ucHJvdG90eXBlLmJyb2FkY2FzdFJlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlY3QgPSB0aGlzLmNvbnRlbnRSZWN0XztcblxuICAgIHRoaXMuYnJvYWRjYXN0V2lkdGggPSByZWN0LndpZHRoO1xuICAgIHRoaXMuYnJvYWRjYXN0SGVpZ2h0ID0gcmVjdC5oZWlnaHQ7XG5cbiAgICByZXR1cm4gcmVjdDtcbn07XG5cbnZhciBSZXNpemVPYnNlcnZlckVudHJ5ID0gZnVuY3Rpb24odGFyZ2V0LCByZWN0SW5pdCkge1xuICAgIHZhciBjb250ZW50UmVjdCA9IGNyZWF0ZVJlYWRPbmx5UmVjdChyZWN0SW5pdCk7XG5cbiAgICAvLyBBY2NvcmRpbmcgdG8gdGhlIHNwZWNpZmljYXRpb24gZm9sbG93aW5nIHByb3BlcnRpZXMgYXJlIG5vdCB3cml0YWJsZVxuICAgIC8vIGFuZCBhcmUgYWxzbyBub3QgZW51bWVyYWJsZSBpbiB0aGUgbmF0aXZlIGltcGxlbWVudGF0aW9uLlxuICAgIC8vXG4gICAgLy8gUHJvcGVydHkgYWNjZXNzb3JzIGFyZSBub3QgYmVpbmcgdXNlZCBhcyB0aGV5J2QgcmVxdWlyZSB0byBkZWZpbmUgYVxuICAgIC8vIHByaXZhdGUgV2Vha01hcCBzdG9yYWdlIHdoaWNoIG1heSBjYXVzZSBtZW1vcnkgbGVha3MgaW4gYnJvd3NlcnMgdGhhdFxuICAgIC8vIGRvbid0IHN1cHBvcnQgdGhpcyB0eXBlIG9mIGNvbGxlY3Rpb25zLlxuICAgIGRlZmluZUNvbmZpZ3VyYWJsZSh0aGlzLCB7IHRhcmdldDogdGFyZ2V0LCBjb250ZW50UmVjdDogY29udGVudFJlY3QgfSk7XG59O1xuXG52YXIgUmVzaXplT2JzZXJ2ZXJTUEkgPSBmdW5jdGlvbihjYWxsYmFjaywgY29udHJvbGxlciwgY2FsbGJhY2tDdHgpIHtcbiAgICB0aGlzLmFjdGl2ZU9ic2VydmF0aW9uc18gPSBbXTtcbiAgICB0aGlzLm9ic2VydmF0aW9uc18gPSBuZXcgTWFwU2hpbSgpO1xuXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgY2FsbGJhY2sgcHJvdmlkZWQgYXMgcGFyYW1ldGVyIDEgaXMgbm90IGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuXG4gICAgdGhpcy5jYWxsYmFja18gPSBjYWxsYmFjaztcbiAgICB0aGlzLmNvbnRyb2xsZXJfID0gY29udHJvbGxlcjtcbiAgICB0aGlzLmNhbGxiYWNrQ3R4XyA9IGNhbGxiYWNrQ3R4O1xufTtcblxuLyoqXHJcbiAqIFN0YXJ0cyBvYnNlcnZpbmcgcHJvdmlkZWQgZWxlbWVudC5cclxuICpcclxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXQgLSBFbGVtZW50IHRvIGJlIG9ic2VydmVkLlxyXG4gKiBAcmV0dXJucyB7dm9pZH1cclxuICovXG5cblxuLyoqXHJcbiAqIFJlZ2lzdHJ5IG9mIHRoZSBSZXNpemVPYnNlcnZhdGlvbiBpbnN0YW5jZXMuXHJcbiAqXHJcbiAqIEBwcml2YXRlIHtNYXA8RWxlbWVudCwgUmVzaXplT2JzZXJ2YXRpb24+fVxyXG4gKi9cblxuXG4vKipcclxuICogUHVibGljIFJlc2l6ZU9ic2VydmVyIGluc3RhbmNlIHdoaWNoIHdpbGwgYmUgcGFzc2VkIHRvIHRoZSBjYWxsYmFja1xyXG4gKiBmdW5jdGlvbiBhbmQgdXNlZCBhcyBhIHZhbHVlIG9mIGl0J3MgXCJ0aGlzXCIgYmluZGluZy5cclxuICpcclxuICogQHByaXZhdGUge1Jlc2l6ZU9ic2VydmVyfVxyXG4gKi9cblxuLyoqXHJcbiAqIENvbGxlY3Rpb24gb2YgcmVzaXplIG9ic2VydmF0aW9ucyB0aGF0IGhhdmUgZGV0ZWN0ZWQgY2hhbmdlcyBpbiBkaW1lbnNpb25zXHJcbiAqIG9mIGVsZW1lbnRzLlxyXG4gKlxyXG4gKiBAcHJpdmF0ZSB7QXJyYXk8UmVzaXplT2JzZXJ2YXRpb24+fVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyU1BJLnByb3RvdHlwZS5vYnNlcnZlID0gZnVuY3Rpb24gKHRhcmdldCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCcxIGFyZ3VtZW50IHJlcXVpcmVkLCBidXQgb25seSAwIHByZXNlbnQuJyk7XG4gICAgfVxuXG4gICAgLy8gRG8gbm90aGluZyBpZiBjdXJyZW50IGVudmlyb25tZW50IGRvZXNuJ3QgaGF2ZSB0aGUgRWxlbWVudCBpbnRlcmZhY2UuXG4gICAgaWYgKHR5cGVvZiBFbGVtZW50ID09PSAndW5kZWZpbmVkJyB8fCAhKEVsZW1lbnQgaW5zdGFuY2VvZiBPYmplY3QpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoISh0YXJnZXQgaW5zdGFuY2VvZiBnZXRXaW5kb3dPZih0YXJnZXQpLkVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3BhcmFtZXRlciAxIGlzIG5vdCBvZiB0eXBlIFwiRWxlbWVudFwiLicpO1xuICAgIH1cblxuICAgIHZhciBvYnNlcnZhdGlvbnMgPSB0aGlzLm9ic2VydmF0aW9uc187XG5cbiAgICAvLyBEbyBub3RoaW5nIGlmIGVsZW1lbnQgaXMgYWxyZWFkeSBiZWluZyBvYnNlcnZlZC5cbiAgICBpZiAob2JzZXJ2YXRpb25zLmhhcyh0YXJnZXQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBvYnNlcnZhdGlvbnMuc2V0KHRhcmdldCwgbmV3IFJlc2l6ZU9ic2VydmF0aW9uKHRhcmdldCkpO1xuXG4gICAgdGhpcy5jb250cm9sbGVyXy5hZGRPYnNlcnZlcih0aGlzKTtcblxuICAgIC8vIEZvcmNlIHRoZSB1cGRhdGUgb2Ygb2JzZXJ2YXRpb25zLlxuICAgIHRoaXMuY29udHJvbGxlcl8ucmVmcmVzaCgpO1xufTtcblxuLyoqXHJcbiAqIFN0b3BzIG9ic2VydmluZyBwcm92aWRlZCBlbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCAtIEVsZW1lbnQgdG8gc3RvcCBvYnNlcnZpbmcuXHJcbiAqIEByZXR1cm5zIHt2b2lkfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyU1BJLnByb3RvdHlwZS51bm9ic2VydmUgPSBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJzEgYXJndW1lbnQgcmVxdWlyZWQsIGJ1dCBvbmx5IDAgcHJlc2VudC4nKTtcbiAgICB9XG5cbiAgICAvLyBEbyBub3RoaW5nIGlmIGN1cnJlbnQgZW52aXJvbm1lbnQgZG9lc24ndCBoYXZlIHRoZSBFbGVtZW50IGludGVyZmFjZS5cbiAgICBpZiAodHlwZW9mIEVsZW1lbnQgPT09ICd1bmRlZmluZWQnIHx8ICEoRWxlbWVudCBpbnN0YW5jZW9mIE9iamVjdCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghKHRhcmdldCBpbnN0YW5jZW9mIGdldFdpbmRvd09mKHRhcmdldCkuRWxlbWVudCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigncGFyYW1ldGVyIDEgaXMgbm90IG9mIHR5cGUgXCJFbGVtZW50XCIuJyk7XG4gICAgfVxuXG4gICAgdmFyIG9ic2VydmF0aW9ucyA9IHRoaXMub2JzZXJ2YXRpb25zXztcblxuICAgIC8vIERvIG5vdGhpbmcgaWYgZWxlbWVudCBpcyBub3QgYmVpbmcgb2JzZXJ2ZWQuXG4gICAgaWYgKCFvYnNlcnZhdGlvbnMuaGFzKHRhcmdldCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG9ic2VydmF0aW9ucy5kZWxldGUodGFyZ2V0KTtcblxuICAgIGlmICghb2JzZXJ2YXRpb25zLnNpemUpIHtcbiAgICAgICAgdGhpcy5jb250cm9sbGVyXy5yZW1vdmVPYnNlcnZlcih0aGlzKTtcbiAgICB9XG59O1xuXG4vKipcclxuICogU3RvcHMgb2JzZXJ2aW5nIGFsbCBlbGVtZW50cy5cclxuICpcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJTUEkucHJvdG90eXBlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5jbGVhckFjdGl2ZSgpO1xuICAgIHRoaXMub2JzZXJ2YXRpb25zXy5jbGVhcigpO1xuICAgIHRoaXMuY29udHJvbGxlcl8ucmVtb3ZlT2JzZXJ2ZXIodGhpcyk7XG59O1xuXG4vKipcclxuICogQ29sbGVjdHMgb2JzZXJ2YXRpb24gaW5zdGFuY2VzIHRoZSBhc3NvY2lhdGVkIGVsZW1lbnQgb2Ygd2hpY2ggaGFzIGNoYW5nZWRcclxuICogaXQncyBjb250ZW50IHJlY3RhbmdsZS5cclxuICpcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJTUEkucHJvdG90eXBlLmdhdGhlckFjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRoaXMkMSA9IHRoaXM7XG5cbiAgICB0aGlzLmNsZWFyQWN0aXZlKCk7XG5cbiAgICB0aGlzLm9ic2VydmF0aW9uc18uZm9yRWFjaChmdW5jdGlvbiAob2JzZXJ2YXRpb24pIHtcbiAgICAgICAgaWYgKG9ic2VydmF0aW9uLmlzQWN0aXZlKCkpIHtcbiAgICAgICAgICAgIHRoaXMkMS5hY3RpdmVPYnNlcnZhdGlvbnNfLnB1c2gob2JzZXJ2YXRpb24pO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vKipcclxuICogSW52b2tlcyBpbml0aWFsIGNhbGxiYWNrIGZ1bmN0aW9uIHdpdGggYSBsaXN0IG9mIFJlc2l6ZU9ic2VydmVyRW50cnlcclxuICogaW5zdGFuY2VzIGNvbGxlY3RlZCBmcm9tIGFjdGl2ZSByZXNpemUgb2JzZXJ2YXRpb25zLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7dm9pZH1cclxuICovXG5SZXNpemVPYnNlcnZlclNQSS5wcm90b3R5cGUuYnJvYWRjYXN0QWN0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIERvIG5vdGhpbmcgaWYgb2JzZXJ2ZXIgZG9lc24ndCBoYXZlIGFjdGl2ZSBvYnNlcnZhdGlvbnMuXG4gICAgaWYgKCF0aGlzLmhhc0FjdGl2ZSgpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgY3R4ID0gdGhpcy5jYWxsYmFja0N0eF87XG5cbiAgICAvLyBDcmVhdGUgUmVzaXplT2JzZXJ2ZXJFbnRyeSBpbnN0YW5jZSBmb3IgZXZlcnkgYWN0aXZlIG9ic2VydmF0aW9uLlxuICAgIHZhciBlbnRyaWVzID0gdGhpcy5hY3RpdmVPYnNlcnZhdGlvbnNfLm1hcChmdW5jdGlvbiAob2JzZXJ2YXRpb24pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNpemVPYnNlcnZlckVudHJ5KG9ic2VydmF0aW9uLnRhcmdldCwgb2JzZXJ2YXRpb24uYnJvYWRjYXN0UmVjdCgpKTtcbiAgICB9KTtcblxuICAgIHRoaXMuY2FsbGJhY2tfLmNhbGwoY3R4LCBlbnRyaWVzLCBjdHgpO1xuICAgIHRoaXMuY2xlYXJBY3RpdmUoKTtcbn07XG5cbi8qKlxyXG4gKiBDbGVhcnMgdGhlIGNvbGxlY3Rpb24gb2YgYWN0aXZlIG9ic2VydmF0aW9ucy5cclxuICpcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJTUEkucHJvdG90eXBlLmNsZWFyQWN0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuYWN0aXZlT2JzZXJ2YXRpb25zXy5zcGxpY2UoMCk7XG59O1xuXG4vKipcclxuICogVGVsbHMgd2hldGhlciBvYnNlcnZlciBoYXMgYWN0aXZlIG9ic2VydmF0aW9ucy5cclxuICpcclxuICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJTUEkucHJvdG90eXBlLmhhc0FjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5hY3RpdmVPYnNlcnZhdGlvbnNfLmxlbmd0aCA+IDA7XG59O1xuXG4vLyBSZWdpc3RyeSBvZiBpbnRlcm5hbCBvYnNlcnZlcnMuIElmIFdlYWtNYXAgaXMgbm90IGF2YWlsYWJsZSB1c2UgY3VycmVudCBzaGltXG4vLyBmb3IgdGhlIE1hcCBjb2xsZWN0aW9uIGFzIGl0IGhhcyBhbGwgcmVxdWlyZWQgbWV0aG9kcyBhbmQgYmVjYXVzZSBXZWFrTWFwXG4vLyBjYW4ndCBiZSBmdWxseSBwb2x5ZmlsbGVkIGFueXdheS5cbnZhciBvYnNlcnZlcnMgPSB0eXBlb2YgV2Vha01hcCAhPT0gJ3VuZGVmaW5lZCcgPyBuZXcgV2Vha01hcCgpIDogbmV3IE1hcFNoaW0oKTtcblxuLyoqXHJcbiAqIFJlc2l6ZU9ic2VydmVyIEFQSS4gRW5jYXBzdWxhdGVzIHRoZSBSZXNpemVPYnNlcnZlciBTUEkgaW1wbGVtZW50YXRpb25cclxuICogZXhwb3Npbmcgb25seSB0aG9zZSBtZXRob2RzIGFuZCBwcm9wZXJ0aWVzIHRoYXQgYXJlIGRlZmluZWQgaW4gdGhlIHNwZWMuXHJcbiAqL1xudmFyIFJlc2l6ZU9ic2VydmVyID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUmVzaXplT2JzZXJ2ZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbi4nKTtcbiAgICB9XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJzEgYXJndW1lbnQgcmVxdWlyZWQsIGJ1dCBvbmx5IDAgcHJlc2VudC4nKTtcbiAgICB9XG5cbiAgICB2YXIgY29udHJvbGxlciA9IFJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5nZXRJbnN0YW5jZSgpO1xuICAgIHZhciBvYnNlcnZlciA9IG5ldyBSZXNpemVPYnNlcnZlclNQSShjYWxsYmFjaywgY29udHJvbGxlciwgdGhpcyk7XG5cbiAgICBvYnNlcnZlcnMuc2V0KHRoaXMsIG9ic2VydmVyKTtcbn07XG5cbi8vIEV4cG9zZSBwdWJsaWMgbWV0aG9kcyBvZiBSZXNpemVPYnNlcnZlci5cblsnb2JzZXJ2ZScsICd1bm9ic2VydmUnLCAnZGlzY29ubmVjdCddLmZvckVhY2goZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgIFJlc2l6ZU9ic2VydmVyLnByb3RvdHlwZVttZXRob2RdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKHJlZiA9IG9ic2VydmVycy5nZXQodGhpcykpW21ldGhvZF0uYXBwbHkocmVmLCBhcmd1bWVudHMpO1xuICAgICAgICB2YXIgcmVmO1xuICAgIH07XG59KTtcblxudmFyIGluZGV4ID0gKGZ1bmN0aW9uICgpIHtcbiAgICAvLyBFeHBvcnQgZXhpc3RpbmcgaW1wbGVtZW50YXRpb24gaWYgYXZhaWxhYmxlLlxuICAgIGlmICh0eXBlb2YgZ2xvYmFsJDEuUmVzaXplT2JzZXJ2ZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBnbG9iYWwkMS5SZXNpemVPYnNlcnZlcjtcbiAgICB9XG5cbiAgICByZXR1cm4gUmVzaXplT2JzZXJ2ZXI7XG59KSgpO1xuXG5yZXR1cm4gaW5kZXg7XG5cbn0pKSk7XG4iLCJpbXBvcnQgeyBFdmVudERpc3BhdGNoZXIgfSBmcm9tIFwiLi4vZ3JpZC9ldmVudFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIERhdGFUYWJsZSBleHRlbmRzIEV2ZW50RGlzcGF0Y2hlciB7XHJcbiAgICBcclxuICAgIGNvbnN0cnVjdG9yIChkYXRhTW9kZWwsIGV4dGVuc2lvbikge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX2V4dGVuc2lvbiA9IGV4dGVuc2lvbjtcclxuICAgICAgICB0aGlzLl9pZFJ1bm5lciA9IDA7XHJcbiAgICAgICAgdGhpcy5fcmlkID0gW107XHJcbiAgICAgICAgdGhpcy5fcm93TWFwID0ge307XHJcbiAgICAgICAgdGhpcy5fZGF0YSA9IFtdO1xyXG4gICAgICAgIHRoaXMuX2Jsb2NrRXZlbnQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl9wcm9jZXNzZWRFdmVudCA9IFtdO1xyXG5cclxuICAgICAgICBsZXQgeyBmb3JtYXQsIGRhdGEsIGZpZWxkcyB9ID0gZGF0YU1vZGVsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFNldCBkZWZhdWx0IGZvcm1hdCBhdCByb3dzXHJcbiAgICAgICAgaWYgKCFmb3JtYXQpIHtcclxuICAgICAgICAgICAgZm9ybWF0ID0gJ3Jvd3MnO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9kYXRhRm9ybWF0ID0gZm9ybWF0O1xyXG4gICAgICAgIHRoaXMuX2ZpZWxkcyA9IGZpZWxkcztcclxuXHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaT0wOyBpPGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRkUm93KGRhdGFbaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fZGF0YSA9IFtdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRSb3dDb3VudCAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGEubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEFsbERhdGEoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGE7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RGF0YSAocm93SWQsIGZpZWxkKSB7XHJcbiAgICAgICAgbGV0IHJvdyA9IHRoaXMuX3Jvd01hcFtyb3dJZF07XHJcbiAgICAgICAgaWYgKHJvdykge1xyXG4gICAgICAgICAgICByZXR1cm4gcm93W2ZpZWxkXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBnZXREYXRhQXQgKHJvd0luZGV4LCBmaWVsZCkge1xyXG4gICAgICAgIGxldCByb3cgPSB0aGlzLl9kYXRhW3Jvd0luZGV4XTtcclxuICAgICAgICBpZiAocm93KSB7XHJcbiAgICAgICAgICAgIHJldHVybiByb3dbZmllbGRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFJvd0RhdGEgKHJvd0lkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Jvd01hcFtyb3dJZF07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Um93RGF0YUF0IChyb3dJbmRleCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhW3Jvd0luZGV4XTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRSb3dJbmRleCAocm93SWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcmlkLmluZGV4T2Yocm93SWQpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFJvd0lkIChyb3dJbmRleCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9yaWRbcm93SW5kZXhdO1xyXG4gICAgfVxyXG5cclxuICAgIHNldERhdGEgKHJvd0lkLCBmaWVsZCwgdmFsdWUpIHtcclxuICAgICAgICBjb25zdCBiZWZvcmVVcGRhdGVBcmcgPSB7XHJcblx0XHRcdHJvd0lkOiByb3dJZCxcclxuXHRcdFx0ZmllbGQ6IGZpZWxkLFxyXG5cdFx0XHRkYXRhOiB2YWx1ZSxcclxuXHRcdFx0Y2FuY2VsOiBmYWxzZVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5fcHJvY2Vzc2VkRXZlbnQucHVzaChiZWZvcmVVcGRhdGVBcmcpO1xyXG5cclxuICAgICAgICBsZXQgYmxvY2tlZCA9IGZhbHNlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICghdGhpcy5fYmxvY2tFdmVudCkge1xyXG5cdFx0XHR0aGlzLl9ibG9ja0V2ZW50ID0gdHJ1ZTtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9uLmV4ZWN1dGVFeHRlbnNpb24oJ2RhdGFCZWZvcmVVcGRhdGUnLCBiZWZvcmVVcGRhdGVBcmcpO1xyXG5cdFx0XHR0aGlzLl9ibG9ja0V2ZW50ID0gZmFsc2U7XHJcblx0XHR9IGVsc2Uge1xyXG4gICAgICAgICAgICBibG9ja2VkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG5cdFx0aWYgKCFiZWZvcmVVcGRhdGVBcmcuY2FuY2VsKSB7XHJcbiAgICAgICAgICAgIGxldCByb3cgPSB0aGlzLl9yb3dNYXBbcm93SWRdO1xyXG4gICAgICAgICAgICBpZiAocm93KSB7XHJcbiAgICAgICAgICAgICAgICByb3dbZmllbGRdID0gYmVmb3JlVXBkYXRlQXJnLmRhdGE7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2Jsb2NrRXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ibG9ja0V2ZW50ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9leHRlbnNpb24uZXhlY3V0ZUV4dGVuc2lvbignZGF0YUFmdGVyVXBkYXRlJywgYmVmb3JlVXBkYXRlQXJnKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ibG9ja0V2ZW50ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghYmxvY2tlZCkge1xyXG4gICAgICAgICAgICB0aGlzLl9leHRlbnNpb24uZXhlY3V0ZUV4dGVuc2lvbignZGF0YUZpbmlzaFVwZGF0ZScsIHtcclxuICAgICAgICAgICAgICAgIHVwZGF0ZXM6IHRoaXMuX3Byb2Nlc3NlZEV2ZW50XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvL0NsZWFyIHByb2Nlc3NlZCBldmVudCBsaXN0ICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NlZEV2ZW50Lmxlbmd0aCA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldERhdGFBdCAocm93SW5kZXgsIGZpZWxkLCB2YWx1ZSkge1xyXG4gICAgICAgIGNvbnN0IHJvd0lkID0gdGhpcy5fcmlkW3Jvd0luZGV4XTtcclxuICAgICAgICBpZiAocm93SWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldERhdGEocm93SWQsIGZpZWxkLCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFkZFJvdyAocm93RGF0YSkge1xyXG4gICAgICAgIGNvbnN0IGNvdW50ID0gdGhpcy5nZXRSb3dDb3VudCgpO1xyXG4gICAgICAgIHRoaXMuaW5zZXJ0Um93KGNvdW50LCByb3dEYXRhKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW5zZXJ0Um93IChyb3dJbmRleCwgcm93RGF0YSkge1xyXG4gICAgICAgIGlmICh0aGlzLl9kYXRhRm9ybWF0ID09PSAncm93cycpIHtcclxuICAgICAgICAgICAgbGV0IHJpZCA9IHRoaXMuX2dlbmVyYXRlUm93SWQoKTtcclxuICAgICAgICAgICAgdGhpcy5fcmlkLnNwbGljZShyb3dJbmRleCwgMCwgcmlkKTtcclxuICAgICAgICAgICAgdGhpcy5fcm93TWFwW3JpZF0gPSByb3dEYXRhO1xyXG4gICAgICAgICAgICB0aGlzLl9kYXRhLnNwbGljZShyb3dJbmRleCwgMCwgcm93RGF0YSk7XHJcbiAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgaWYgKHRoaXMuX2RhdGFGb3JtYXQgPT09ICdhcnJheScpIHtcclxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5fZmllbGRzKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHJpZCA9IHRoaXMuX2dlbmVyYXRlUm93SWQoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3JpZC5zcGxpY2Uocm93SW5kZXgsIDAsIHJpZCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgbmV3T2JqID0gdGhpcy5fY3JlYXRlT2JqZWN0KHJvd0RhdGEsIHRoaXMuX2ZpZWxkcyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yb3dNYXBbcmlkXSA9IG5ld09iajtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2RhdGEuc3BsaWNlKHJvd0luZGV4LCAwLCBuZXdPYmopO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZVJvdyAocmlkKSB7IFxyXG4gICAgICAgIGxldCByb3cgPSB0aGlzLl9yb3dNYXBbcmlkXTtcclxuICAgICAgICBsZXQgaW5kZXggPSB0aGlzLl9kYXRhLmluZGV4T2Yocm93KTtcclxuICAgICAgICB0aGlzLl9kYXRhLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgdGhpcy5fcmlkLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMuX3Jvd01hcFtyaWRdO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZVJvd0F0IChpbmRleCkge1xyXG4gICAgICAgIGxldCByaWQgPSBPYmplY3Qua2V5cyh0aGlzLl9yb3dNYXApLmZpbmQoa2V5ID0+IG9iamVjdFtrZXldID09PSB2YWx1ZSk7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMuX3Jvd01hcFtyaWRdO1xyXG4gICAgICAgIHRoaXMuX2RhdGEuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICB0aGlzLl9yaWQuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVBbGxSb3dzICgpIHtcclxuICAgICAgICB0aGlzLl9yaWQgPSBbXTtcclxuICAgICAgICB0aGlzLl9yb3dNYXAgPSB7fTtcclxuICAgICAgICB0aGlzLl9kYXRhID0gW107ICAgICAgICBcclxuICAgIH1cclxuXHJcbiAgICBfZ2VuZXJhdGVSb3dJZCAoKSB7XHJcbiAgICAgICAgdGhpcy5faWRSdW5uZXIrKztcclxuICAgICAgICByZXR1cm4gJycgKyB0aGlzLl9pZFJ1bm5lcjtcclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlT2JqZWN0KGFycmF5VmFsdWVzLCBmaWVsZHMpIHtcclxuICAgICAgICBsZXQgbmV3T2JqID0ge307XHJcbiAgICAgICAgZm9yIChsZXQgaT0wOyBpPGZpZWxkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBuZXdPYmpbZmllbGRzW2ldXSA9IGFycmF5VmFsdWVzW2ldO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3T2JqO1xyXG4gICAgfVxyXG5cclxufSIsImV4cG9ydCBjbGFzcyBDb3B5UGFzdGVFeHRlbnNpb24ge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuX2dsb2JhbENsaXBib2FyZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuXHRpbml0IChncmlkLCBjb25maWcpIHtcclxuXHRcdHRoaXMuX2dyaWQgPSBncmlkO1xyXG5cdFx0dGhpcy5fY29uZmlnID0gY29uZmlnO1xyXG5cdH1cclxuXHJcblx0a2V5RG93biAoZSkge1xyXG4gICAgICAgIGlmICh0aGlzLl9nbG9iYWxDbGlwYm9hcmQgJiYgZS5jdHJsS2V5KSB7XHJcbiAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ2MnKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZGF0YSA9IHRoaXMuX2NvcHkoKTtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmNsaXBib2FyZERhdGEuc2V0RGF0YSgndGV4dCcsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgaWYgKGUua2V5ID09PSAndicpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Bhc3RlKHdpbmRvdy5jbGlwYm9hcmREYXRhLmdldERhdGEoJ3RleHQnKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ3JpZEFmdGVyUmVuZGVyKGUpIHtcclxuICAgICAgICBpZiAoIXdpbmRvdy5jbGlwYm9hcmREYXRhKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2dyaWQudmlldy5nZXRFbGVtZW50KCkuYWRkRXZlbnRMaXN0ZW5lcigncGFzdGUnLCAocGFzdGVFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcGFzdGUocGFzdGVFdmVudC5jbGlwYm9hcmREYXRhLmdldERhdGEoJ3RleHQnKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLl9ncmlkLnZpZXcuZ2V0RWxlbWVudCgpLmFkZEV2ZW50TGlzdGVuZXIoJ2NvcHknLCAoY29weUV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZGF0YSA9IHRoaXMuX2NvcHkoKTtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29weUV2ZW50LmNsaXBib2FyZERhdGEuc2V0RGF0YSgndGV4dC9wbGFpbicsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvcHlFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5fZ2xvYmFsQ2xpcGJvYXJkID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fZ2xvYmFsQ2xpcGJvYXJkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NvcHkoY2xpcGJvYXJkRGF0YSkge1xyXG4gICAgICAgIGxldCBzZWxlY3Rpb24gPSB0aGlzLl9ncmlkLnN0YXRlLmdldCgnc2VsZWN0aW9uJyk7XHJcbiAgICAgICAgaWYgKHNlbGVjdGlvbiAmJiBzZWxlY3Rpb24ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBsZXQgcyA9IHNlbGVjdGlvblswXTtcclxuICAgICAgICAgICAgbGV0IHJvd3MgPSBbXTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaT0wOyBpPHMuaDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY29scyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaj0wOyBqPHMudzsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29scy5wdXNoKHRoaXMuX2dyaWQuZGF0YS5nZXREYXRhQXQocy5yICsgaSwgcy5jICsgaikpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcm93cy5wdXNoKGNvbHMuam9pbignXFx0JykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByb3dzLmpvaW4oJ1xcbicpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfcGFzdGUoZGF0YSkge1xyXG4gICAgICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgICAgIGRhdGEgPSBkYXRhLnJlcGxhY2UoL1xcbiQvZywgJycpO1xyXG4gICAgICAgICAgICBsZXQgc2VsZWN0aW9uID0gdGhpcy5fZ3JpZC5zdGF0ZS5nZXQoJ3NlbGVjdGlvbicpO1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0aW9uICYmIHNlbGVjdGlvbi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcyA9IHNlbGVjdGlvblswXTtcclxuICAgICAgICAgICAgICAgIGxldCByb3dzID0gZGF0YS5zcGxpdCgnXFxuJyk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpPTA7IGk8cm93cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjb2xzID0gcm93c1tpXS5zcGxpdCgnXFx0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaj0wOyBqPGNvbHMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHBhc3RlUm93ID0gIHMuciArIGk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwYXN0ZUNvbCA9IHMuYyArIGo7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9ncmlkLm1vZGVsLmNhbkVkaXQocGFzdGVSb3csIHBhc3RlQ29sKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ3JpZC5kYXRhLnNldERhdGFBdChwYXN0ZVJvdywgcGFzdGVDb2wsIGNvbHNbal0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ3JpZC52aWV3LnVwZGF0ZUNlbGwocGFzdGVSb3csIHBhc3RlQ29sKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn0iLCJleHBvcnQgY2xhc3MgRWRpdG9yRXh0ZW5zaW9uIHtcclxuXHJcblx0aW5pdCAoZ3JpZCwgY29uZmlnKSB7XHJcblx0XHR0aGlzLl9ncmlkID0gZ3JpZDtcclxuXHRcdHRoaXMuX2NvbmZpZyA9IGNvbmZpZztcclxuXHRcdHRoaXMuX2VkaXRvckF0dGFjaGVkID0gZmFsc2U7XHJcblx0XHR0aGlzLnNjcm9sbEhhbmRsZXIgPSB0aGlzLnNjcm9sbEhhbmRsZXIuYmluZCh0aGlzKTtcclxuXHRcdHRoaXMuX2dyaWQudmlldy5saXN0ZW4oJ3ZzY3JvbGwnLCB0aGlzLnNjcm9sbEhhbmRsZXIpO1xyXG5cdFx0dGhpcy5fZ3JpZC52aWV3Lmxpc3RlbignaHNjcm9sbCcsIHRoaXMuc2Nyb2xsSGFuZGxlcik7XHJcblx0fVxyXG5cclxuXHRzY3JvbGxIYW5kbGVyICgpIHtcclxuXHRcdHRoaXMuX2RldGFjaEVkaXRvcigpO1xyXG5cdH1cclxuXHJcblx0a2V5RG93biAoZSkge1xyXG5cdFx0aWYgKCF0aGlzLl9lZGl0b3JBdHRhY2hlZCkge1xyXG5cdFx0XHRpZiAoIWUuY3RybEtleSkge1xyXG5cdFx0XHRcdGxldCBzZWxlY3Rpb24gPSB0aGlzLl9ncmlkLnN0YXRlLmdldCgnc2VsZWN0aW9uJyk7XHJcblx0XHRcdFx0aWYgKHNlbGVjdGlvbiAmJiBzZWxlY3Rpb24ubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRcdFx0bGV0IHJvd0luZGV4ID0gc2VsZWN0aW9uWzBdLnI7XHJcblx0XHRcdFx0XHRsZXQgY29sSW5kZXggPSBzZWxlY3Rpb25bMF0uYztcclxuXHRcdFx0XHRcdGxldCBlZGl0ID0gZmFsc2U7XHJcblx0XHRcdFx0XHRpZiAoZS5rZXlDb2RlID09PSAxMyB8fCAoZS5rZXlDb2RlID4gMzEgJiYgIShlLmtleUNvZGUgPj0gMzcgJiYgZS5rZXlDb2RlIDw9IDQwKSkpIHtcclxuXHRcdFx0XHRcdFx0ZWRpdCA9IHRydWU7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZiAoZWRpdCAmJlxyXG5cdFx0XHRcdFx0XHRyb3dJbmRleCA+PSAwICYmIHJvd0luZGV4IDwgdGhpcy5fZ3JpZC5tb2RlbC5nZXRSb3dDb3VudCgpICYmXHJcblx0XHRcdFx0XHRcdGNvbEluZGV4ID49IDAgJiYgY29sSW5kZXggPCB0aGlzLl9ncmlkLm1vZGVsLmdldENvbHVtbkNvdW50KCkpIHtcclxuXHRcdFx0XHRcdFx0bGV0IGNlbGwgPSB0aGlzLl9ncmlkLnZpZXcuZ2V0Q2VsbChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cdFx0XHRcdFx0XHRpZiAoY2VsbCkge1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuX2VkaXRDZWxsKGNlbGwpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHRcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGNlbGxBZnRlclJlbmRlciAoZSkge1xyXG5cdFx0ZS5jZWxsLmFkZEV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgKGUpID0+IHtcclxuXHRcdFx0bGV0IGFjdHVhbENlbGwgPSBlLnRhcmdldDtcclxuXHRcdFx0aWYgKGFjdHVhbENlbGwpIHtcclxuXHRcdFx0XHR0aGlzLl9lZGl0Q2VsbChhY3R1YWxDZWxsKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRfZWRpdENlbGwgKGNlbGwpIHtcclxuXHRcdGxldCBhY3R1YWxDZWxsID0gY2VsbDtcclxuXHRcdGxldCBhY3R1YWxSb3cgPSBwYXJzZUludChhY3R1YWxDZWxsLmRhdGFzZXQucm93SW5kZXgpO1xyXG5cdFx0bGV0IGFjdHVhbENvbCA9IHBhcnNlSW50KGFjdHVhbENlbGwuZGF0YXNldC5jb2xJbmRleCk7XHJcblx0XHRpZiAodGhpcy5fZ3JpZC5tb2RlbC5jYW5FZGl0KGFjdHVhbFJvdywgYWN0dWFsQ29sKSkge1xyXG5cclxuXHRcdFx0Ly9HZXQgZGF0YSB0byBiZSBlZGl0ZWRcclxuXHRcdFx0bGV0IGRhdGEgPSB0aGlzLl9ncmlkLm1vZGVsLmdldERhdGFBdChhY3R1YWxSb3csIGFjdHVhbENvbCk7XHJcblxyXG5cdFx0XHQvL0lmIHRoZXJlJ3MgY3VzdG9tIGVkaXRvciwgdXNlIGN1c3RvbSBlZGl0b3IgdG8gYXR0YWNoIHRoZSBlZGl0b3JcclxuXHRcdFx0dGhpcy5fZ3JpZC5zdGF0ZS5zZXQoJ2VkaXRpbmcnLCB0cnVlKTtcclxuXHJcblx0XHRcdC8vQ3JlYXRlIGZsb2F0IGVkaXRvciBjb250YWluZXJcclxuXHRcdFx0bGV0IGNlbGxCb3VuZCA9IGNlbGwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblx0XHRcdGNvbnN0IHNjcm9sbGluZ0VsZW1lbnQgPSBkb2N1bWVudC5zY3JvbGxpbmdFbGVtZW50IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDsgXHJcblx0XHRcdGxldCBzY3JvbGxUb3AgPSBzY3JvbGxpbmdFbGVtZW50LnNjcm9sbFRvcDtcclxuXHRcdFx0bGV0IHNjcm9sbExlZnQgPSBzY3JvbGxpbmdFbGVtZW50LnNjcm9sbExlZnQ7XHJcblx0XHRcdHRoaXMuX2VkaXRvckNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cdFx0XHR0aGlzLl9lZGl0b3JDb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG5cdFx0XHR0aGlzLl9lZGl0b3JDb250YWluZXIuc3R5bGUudG9wID0gKGNlbGxCb3VuZC50b3AgKyBzY3JvbGxUb3ApICsgJ3B4JztcclxuXHRcdFx0dGhpcy5fZWRpdG9yQ29udGFpbmVyLnN0eWxlLmxlZnQgPSAoY2VsbEJvdW5kLmxlZnQgKyBzY3JvbGxMZWZ0KSArICdweCc7XHJcblx0XHRcdHRoaXMuX2VkaXRvckNvbnRhaW5lci5zdHlsZS53aWR0aCA9IGNlbGxCb3VuZC53aWR0aCArICdweCc7XHJcblx0XHRcdHRoaXMuX2VkaXRvckNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBjZWxsQm91bmQuaGVpZ2h0ICsgJ3B4JztcclxuXHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLl9lZGl0b3JDb250YWluZXIpO1xyXG5cclxuXHRcdFx0Ly9DaGVjayBpZiB0aGVyZSdzIGFueSBjdXN0b20gZWRpdG9yXHJcblx0XHRcdGxldCBjdXN0b21FZGl0b3IgPSB0aGlzLl9ncmlkLm1vZGVsLmdldENhc2NhZGVkQ2VsbFByb3AoYWN0dWFsQ2VsbC5kYXRhc2V0LnJvd0luZGV4LCBhY3R1YWxDZWxsLmRhdGFzZXQuY29sSW5kZXgsICdlZGl0b3InKTtcclxuXHRcdFx0aWYgKGN1c3RvbUVkaXRvciAmJiBjdXN0b21FZGl0b3IuYXR0YWNoKSB7XHJcblx0XHRcdFx0Y3VzdG9tRWRpdG9yLmF0dGFjaCh0aGlzLl9lZGl0b3JDb250YWluZXIsIGRhdGEsIHRoaXMuX2RvbmUuYmluZCh0aGlzKSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5fYXR0YWNoRWRpdG9yKHRoaXMuX2VkaXRvckNvbnRhaW5lciwgZGF0YSwgdGhpcy5fZG9uZS5iaW5kKHRoaXMpKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5fZWRpdG9yQXR0YWNoZWQgPSB0cnVlO1xyXG5cdFx0XHR0aGlzLl9lZGl0aW5nQ29sID0gYWN0dWFsQ29sO1xyXG5cdFx0XHR0aGlzLl9lZGl0aW5nUm93ID0gYWN0dWFsUm93O1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0X2F0dGFjaEVkaXRvciAoY2VsbCwgZGF0YSwgZG9uZSkge1xyXG5cdFx0aWYgKCF0aGlzLl9pbnB1dEVsZW1lbnQpIHtcclxuXHRcdFx0bGV0IGNlbGxCb3VuZCA9IGNlbGwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC50eXBlID0gJ3RleHQnO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQudmFsdWUgPSBkYXRhO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQuc3R5bGUud2lkdGggPSAoY2VsbEJvdW5kLndpZHRoKSArICdweCc7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5zdHlsZS5oZWlnaHQgPSAoY2VsbEJvdW5kLmhlaWdodCkgKyAncHgnO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQuY2xhc3NOYW1lID0gJ3BncmlkLWNlbGwtdGV4dC1lZGl0b3InO1xyXG5cdFx0XHRcclxuXHRcdFx0Y2VsbC5hcHBlbmRDaGlsZCh0aGlzLl9pbnB1dEVsZW1lbnQpO1xyXG5cclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LmZvY3VzKCk7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5zZWxlY3QoKTtcclxuXHJcblx0XHRcdHRoaXMuX2Fycm93S2V5TG9ja2VkID0gZmFsc2U7XHJcblxyXG5cdFx0XHR0aGlzLl9rZXlkb3duSGFuZGxlciA9IChlKSA9PiB7XHJcblx0XHRcdFx0c3dpdGNoIChlLmtleUNvZGUpIHtcclxuXHRcdFx0XHRcdGNhc2UgMTM6IC8vRW50ZXJcclxuXHRcdFx0XHRcdFx0Ly9QcmV2ZW50IGRvdWJsZSBkb25lKCkgY2FsbFxyXG5cdFx0XHRcdFx0XHRpZiAodGhpcy5faW5wdXRFbGVtZW50KSB7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLl9ibHVySGFuZGxlcik7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0ZG9uZShlLnRhcmdldC52YWx1ZSk7XHJcblx0XHRcdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0XHRjYXNlIDI3OiAvL0VTQ1xyXG5cdFx0XHRcdFx0XHQvL1ByZXZlbnQgZG91YmxlIGRvbmUoKSBjYWxsXHJcblx0XHRcdFx0XHRcdGlmICh0aGlzLl9pbnB1dEVsZW1lbnQpIHtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMuX2JsdXJIYW5kbGVyKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRkb25lKCk7XHJcblx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRcdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0XHRjYXNlIDQwOiAvL0Rvd25cclxuXHRcdFx0XHRcdGNhc2UgMzg6IC8vVXBcclxuXHRcdFx0XHRcdGNhc2UgMzc6IC8vTGVmdFxyXG5cdFx0XHRcdFx0Y2FzZSAzOTogLy9SaWdodFxyXG5cdFx0XHRcdFx0XHRpZiAoIXRoaXMuX2Fycm93S2V5TG9ja2VkKSB7XHJcblx0XHRcdFx0XHRcdFx0ZG9uZShlLnRhcmdldC52YWx1ZSk7XHJcblx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0dGhpcy5fYmx1ckhhbmRsZXIgPSAoZSkgPT4ge1xyXG5cdFx0XHRcdGRvbmUoZS50YXJnZXQudmFsdWUpO1xyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0dGhpcy5fY2xpY2tIYW5kbGVyID0gKGUpID0+IHtcclxuXHRcdFx0XHR0aGlzLl9hcnJvd0tleUxvY2tlZCA9IHRydWU7XHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2tleWRvd25IYW5kbGVyKTtcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLl9ibHVySGFuZGxlcik7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX2NsaWNrSGFuZGxlcik7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRfZGV0YWNoRWRpdG9yICgpIHtcclxuXHRcdGlmICh0aGlzLl9lZGl0b3JDb250YWluZXIpIHtcclxuXHRcdFx0Ly9Eb3VibGUgY2hlY2tpbmcgdG8gZml4IHdpZXJlZCBidWdcclxuXHRcdFx0dGhpcy5fZWRpdG9yQ29udGFpbmVyLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5fZWRpdG9yQ29udGFpbmVyKTtcclxuXHRcdFx0dGhpcy5fZWRpdG9yQ29udGFpbmVyID0gbnVsbDtcclxuXHRcdFx0aWYgKHRoaXMuX2lucHV0RWxlbWVudCkge1xyXG5cdFx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fa2V5ZG93bkhhbmRsZXIpO1xyXG5cdFx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5fYmx1ckhhbmRsZXIpO1xyXG5cdFx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX2NsaWNrSGFuZGxlcik7XHJcblx0XHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5faW5wdXRFbGVtZW50KTtcclxuXHRcdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQgPSBudWxsO1xyXG5cdFx0XHRcdHRoaXMuX2tleWRvd25IYW5kbGVyID0gbnVsbDtcclxuXHRcdFx0XHR0aGlzLl9ibHVySGFuZGxlciA9IG51bGw7XHJcblx0XHRcdFx0dGhpcy5fY2xpY2tIYW5kbGVyID0gbnVsbDtcdFxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRfZG9uZSAocmVzdWx0LCBtdWx0aUZpZWxkcykge1xyXG5cdFx0dGhpcy5fZGV0YWNoRWRpdG9yKCk7XHJcblx0XHRpZiAocmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0aWYgKCFtdWx0aUZpZWxkcykge1xyXG5cdFx0XHRcdHRoaXMuX2dyaWQubW9kZWwuc2V0RGF0YUF0KHRoaXMuX2VkaXRpbmdSb3csIHRoaXMuX2VkaXRpbmdDb2wsIHJlc3VsdCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0bGV0IHJvd0lkID0gdGhpcy5fZ3JpZC5tb2RlbC5nZXRSb3dJZCh0aGlzLl9lZGl0aW5nUm93KTtcclxuXHRcdFx0XHRpZiAocm93SWQpIHtcclxuXHRcdFx0XHRcdGZvciAobGV0IHByb3AgaW4gcmVzdWx0KSB7XHJcblx0XHRcdFx0XHRcdGlmIChyZXN1bHQuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLl9ncmlkLmRhdGEuc2V0RGF0YShyb3dJZCwgcHJvcCwgcmVzdWx0W3Byb3BdKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0dGhpcy5fZ3JpZC52aWV3LnVwZGF0ZUNlbGwodGhpcy5fZWRpdGluZ1JvdywgdGhpcy5fZWRpdGluZ0NvbCk7XHJcblx0XHR0aGlzLl9lZGl0aW5nUm93ID0gLTE7XHJcblx0XHR0aGlzLl9lZGl0aW5nQ29sID0gLTE7XHJcblx0XHR0aGlzLl9lZGl0b3JBdHRhY2hlZCA9IGZhbHNlO1xyXG5cdFx0dGhpcy5fZ3JpZC5zdGF0ZS5zZXQoJ2VkaXRpbmcnLCBmYWxzZSk7XHJcblxyXG5cdFx0Ly9SZS1mb2N1cyBhdCB0aGUgZ3JpZFxyXG5cdFx0dGhpcy5fZ3JpZC52aWV3LmdldEVsZW1lbnQoKS5mb2N1cygpO1xyXG5cdH1cclxuXHJcbn0iLCJleHBvcnQgY2xhc3MgRm9ybWF0dGVyRXh0ZW5zaW9uIHtcclxuXHJcbiAgICBpbml0IChncmlkLCBjb25maWcpIHtcclxuXHRcdHRoaXMuX2dyaWQgPSBncmlkO1xyXG5cdFx0dGhpcy5fY29uZmlnID0gY29uZmlnO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjZWxsUmVuZGVyIChlKSB7XHJcbiAgICAgICAgY29uc3QgbW9kZWwgPSB0aGlzLl9ncmlkLm1vZGVsLmdldENvbHVtbk1vZGVsKGUuY29sSW5kZXgpO1xyXG4gICAgICAgIGlmIChtb2RlbCAmJiBtb2RlbC5mb3JtYXR0ZXIgJiYgbW9kZWwuZm9ybWF0dGVyLnJlbmRlcikge1xyXG4gICAgICAgICAgICBsZXQgbmV3RXZlbnQgPSBPYmplY3QuYXNzaWduKHt9LCBlKTtcclxuICAgICAgICAgICAgbmV3RXZlbnQuY29sTW9kZWwgPSBtb2RlbDtcclxuICAgICAgICAgICAgbW9kZWwuZm9ybWF0dGVyLnJlbmRlcihuZXdFdmVudCk7XHJcbiAgICAgICAgICAgIGUuaGFuZGxlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNlbGxVcGRhdGUgKGUpIHtcclxuICAgICAgICBjb25zdCBtb2RlbCA9IHRoaXMuX2dyaWQubW9kZWwuZ2V0Q29sdW1uTW9kZWwoZS5jb2xJbmRleCk7XHJcbiAgICAgICAgaWYgKG1vZGVsICYmIG1vZGVsLmZvcm1hdHRlciAmJiBtb2RlbC5mb3JtYXR0ZXIudXBkYXRlKSB7XHJcbiAgICAgICAgICAgIGxldCBuZXdFdmVudCA9IE9iamVjdC5hc3NpZ24oe30sIGUpO1xyXG4gICAgICAgICAgICBuZXdFdmVudC5jb2xNb2RlbCA9IG1vZGVsO1xyXG4gICAgICAgICAgICBtb2RlbC5mb3JtYXR0ZXIudXBkYXRlKG5ld0V2ZW50KTtcclxuICAgICAgICAgICAgZS5oYW5kbGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59IiwiZXhwb3J0IGNsYXNzIFNlbGVjdGlvbkV4dGVuc2lvbiB7XHJcblxyXG5cdGluaXQgKGdyaWQsIGNvbmZpZykge1xyXG5cdFx0dGhpcy5fZ3JpZCA9IGdyaWQ7XHJcblx0XHR0aGlzLl9jb25maWcgPSBjb25maWc7XHJcblx0XHR0aGlzLl9jdXJyZW50U2VsZWN0aW9uID0gbnVsbDtcclxuXHRcdHRoaXMuX3NlbGVjdGlvbkNsYXNzID0gKHRoaXMuX2NvbmZpZy5zZWxlY3Rpb24gJiYgdGhpcy5fY29uZmlnLnNlbGVjdGlvbi5jc3NDbGFzcyk/dGhpcy5fY29uZmlnLnNlbGVjdGlvbi5jc3NDbGFzczoncGdyaWQtY2VsbC1zZWxlY3Rpb24nO1xyXG5cdH1cclxuXHJcblx0a2V5RG93biAoZSkge1xyXG5cdFx0bGV0IGVkaXRpbmcgPSB0aGlzLl9ncmlkLnN0YXRlLmdldCgnZWRpdGluZycpO1xyXG5cdFx0aWYgKGVkaXRpbmcpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0bGV0IHNlbGVjdGlvbiA9IHRoaXMuX2dyaWQuc3RhdGUuZ2V0KCdzZWxlY3Rpb24nKTtcclxuXHRcdGlmIChzZWxlY3Rpb24gJiYgc2VsZWN0aW9uLmxlbmd0aCA+IDApIHtcclxuXHRcdFx0bGV0IHJvd0luZGV4ID0gc2VsZWN0aW9uWzBdLnI7XHJcblx0XHRcdGxldCBjb2xJbmRleCA9IHNlbGVjdGlvblswXS5jO1xyXG5cdFx0XHRsZXQgYWxpZ25Ub3AgPSB0cnVlO1xyXG5cdFx0XHRzd2l0Y2ggKGUua2V5Q29kZSkge1xyXG5cdFx0XHRcdGNhc2UgNDA6IC8vRG93blxyXG5cdFx0XHRcdFx0cm93SW5kZXgrKztcclxuXHRcdFx0XHRcdGFsaWduVG9wID0gZmFsc2U7XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRjYXNlIDM4OiAvL1VwXHJcblx0XHRcdFx0XHRyb3dJbmRleC0tO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0Y2FzZSAzNzogLy9MZWZ0XHJcblx0XHRcdFx0XHRjb2xJbmRleC0tO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0Y2FzZSAzOTogLy9SaWdodFxyXG5cdFx0XHRcdGNhc2UgOTogLy9UYWJcclxuXHRcdFx0XHRcdGNvbEluZGV4Kys7XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRkZWZhdWx0OlxyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChyb3dJbmRleCA+PSAwICYmIHJvd0luZGV4IDwgdGhpcy5fZ3JpZC5tb2RlbC5nZXRSb3dDb3VudCgpICYmXHJcblx0XHRcdFx0Y29sSW5kZXggPj0gMCAmJiBjb2xJbmRleCA8IHRoaXMuX2dyaWQubW9kZWwuZ2V0Q29sdW1uQ291bnQoKSkge1xyXG5cdFx0XHRcdGNvbnN0IGlzSGVhZGVyID0gdGhpcy5fZ3JpZC5tb2RlbC5pc0hlYWRlclJvdyhyb3dJbmRleCk7XHJcblx0XHRcdFx0Y29uc3Qgcm93TW9kZWwgPSB0aGlzLl9ncmlkLm1vZGVsLmdldFJvd01vZGVsKHJvd0luZGV4KTtcclxuXHRcdFx0XHRpZiAoIXJvd01vZGVsIHx8ICFpc0hlYWRlcikge1xyXG5cdFx0XHRcdFx0bGV0IGNlbGwgPSB0aGlzLl9ncmlkLnZpZXcuZ2V0Q2VsbChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cdFx0XHRcdFx0aWYgKGNlbGwpIHtcclxuXHRcdFx0XHRcdFx0dGhpcy5fc2VsZWN0Q2VsbChjZWxsLCByb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cdFx0XHRcdFx0XHR0aGlzLl9ncmlkLnZpZXcuc2Nyb2xsVG9DZWxsKHJvd0luZGV4LCBjb2xJbmRleCwgYWxpZ25Ub3ApO1xyXG5cdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRjZWxsQWZ0ZXJSZW5kZXIgKGUpIHtcclxuXHRcdGUuY2VsbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZSkgPT4ge1xyXG5cdFx0XHRjb25zdCBhY3R1YWxDZWxsID0gZS50YXJnZXQ7XHJcblx0XHRcdGNvbnN0IGFjdHVhbFJvdyA9IHBhcnNlSW50KGFjdHVhbENlbGwuZGF0YXNldC5yb3dJbmRleCk7XHJcblx0XHRcdGNvbnN0IGFjdHVhbENvbCA9IHBhcnNlSW50KGFjdHVhbENlbGwuZGF0YXNldC5jb2xJbmRleCk7XHJcblx0XHRcdGNvbnN0IHJvd01vZGVsID0gdGhpcy5fZ3JpZC5tb2RlbC5nZXRSb3dNb2RlbChhY3R1YWxSb3cpO1xyXG5cdFx0XHRjb25zdCBpc0hlYWRlciA9IHRoaXMuX2dyaWQubW9kZWwuaXNIZWFkZXJSb3coYWN0dWFsUm93KTtcclxuXHRcdFx0aWYgKCFyb3dNb2RlbCB8fCAhaXNIZWFkZXIpIHtcclxuXHRcdFx0XHRpZiAoYWN0dWFsQ2VsbC5jbGFzc0xpc3QuY29udGFpbnMoJ3BncmlkLWNlbGwnKSkge1xyXG5cdFx0XHRcdFx0dGhpcy5fc2VsZWN0Q2VsbChhY3R1YWxDZWxsLCBhY3R1YWxSb3csIGFjdHVhbENvbCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdF9zZWxlY3RDZWxsIChjZWxsLCByb3dJbmRleCwgY29sSW5kZXgpIHtcclxuXHRcdC8vQ2xlYXIgb2xkIHNlbGVjdGlvblxyXG5cdFx0aWYgKHRoaXMuX2N1cnJlbnRTZWxlY3Rpb24gJiYgdGhpcy5fY3VycmVudFNlbGVjdGlvbiAhPT0gY2VsbCkge1xyXG5cdFx0XHR0aGlzLl9jdXJyZW50U2VsZWN0aW9uLmNsYXNzTGlzdC5yZW1vdmUodGhpcy5fc2VsZWN0aW9uQ2xhc3MpO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vU2V0IHNlbGVjdGlvblxyXG5cdFx0dGhpcy5fY3VycmVudFNlbGVjdGlvbiA9IGNlbGw7XHJcblx0XHR0aGlzLl9jdXJyZW50U2VsZWN0aW9uLmNsYXNzTGlzdC5hZGQodGhpcy5fc2VsZWN0aW9uQ2xhc3MpO1xyXG5cdFx0dGhpcy5fZ3JpZC52aWV3LmdldEVsZW1lbnQoKS5mb2N1cygpO1xyXG5cclxuXHRcdC8vU3RvcmUgc2VsZWN0aW9uIHN0YXRlXHJcblx0XHRsZXQgc2VsZWN0aW9uID0gdGhpcy5fZ3JpZC5zdGF0ZS5nZXQoJ3NlbGVjdGlvbicpO1xyXG5cdFx0aWYgKCFzZWxlY3Rpb24pIHtcclxuXHRcdFx0c2VsZWN0aW9uID0gW107XHJcblx0XHRcdHRoaXMuX2dyaWQuc3RhdGUuc2V0KCdzZWxlY3Rpb24nLCBzZWxlY3Rpb24pO1xyXG5cdFx0fVxyXG5cdFx0c2VsZWN0aW9uLmxlbmd0aCA9IDA7XHJcblx0XHRzZWxlY3Rpb24ucHVzaCh7XHJcblx0XHRcdHI6IHJvd0luZGV4LFxyXG5cdFx0XHRjOiBjb2xJbmRleCxcclxuXHRcdFx0dzogMSxcclxuXHRcdFx0aDogMVxyXG5cdFx0fSk7XHJcblxyXG5cdH1cclxuXHJcbn0iLCJleHBvcnQgY2xhc3MgVmlld1VwZGF0ZXJFeHRlbnNpb24ge1xyXG5cclxuICAgIGluaXQgKGdyaWQsIGNvbmZpZykge1xyXG5cdFx0dGhpcy5fZ3JpZCA9IGdyaWQ7XHJcblx0XHR0aGlzLl9jb25maWcgPSBjb25maWc7XHJcblx0fVxyXG5cclxuICAgIGRhdGFGaW5pc2hVcGRhdGUgKGUpIHtcclxuICAgICAgICBsZXQgcm93SW5kZXhDYWNoZSA9IHt9O1xyXG4gICAgICAgIGxldCBjb2xJbmRleENhY2hlID0ge307XHJcbiAgICAgICAgZm9yIChsZXQgaT0wOyBpPGUudXBkYXRlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQge3Jvd0lkLCBmaWVsZH0gPSBlLnVwZGF0ZXNbaV07XHJcbiAgICAgICAgICAgIGxldCByb3dJbmRleCA9IG51bGw7XHJcbiAgICAgICAgICAgIGxldCBjb2xJbmRleCA9IG51bGw7XHJcbiAgICAgICAgICAgIGlmIChyb3dJbmRleENhY2hlW3Jvd0lkXSkge1xyXG4gICAgICAgICAgICAgICAgcm93SW5kZXggPSByb3dJbmRleENhY2hlW3Jvd0lkXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJvd0luZGV4ID0gdGhpcy5fZ3JpZC5tb2RlbC5nZXRSb3dJbmRleChyb3dJZCk7XHJcbiAgICAgICAgICAgICAgICByb3dJbmRleENhY2hlW3Jvd0lkXSA9IHJvd0luZGV4OyAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoY29sSW5kZXhDYWNoZVtmaWVsZF0pIHtcclxuICAgICAgICAgICAgICAgIGNvbEluZGV4ID0gY29sSW5kZXhDYWNoZVtmaWVsZF07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb2xJbmRleCA9IHRoaXMuX2dyaWQubW9kZWwuZ2V0Q29sdW1uSW5kZXgoZmllbGQpO1xyXG4gICAgICAgICAgICAgICAgY29sSW5kZXhDYWNoZVtyb3dJZF0gPSBjb2xJbmRleDsgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5fZ3JpZC52aWV3LnVwZGF0ZUNlbGwocm93SW5kZXgsIGNvbEluZGV4KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59IiwiZXhwb3J0IGNsYXNzIEV2ZW50RGlzcGF0Y2hlciB7XHJcblxyXG5cdGNvbnN0cnVjdG9yKCkge1xyXG5cdFx0dGhpcy5faGFuZGxlcnMgPSB7fTtcclxuXHR9XHJcblxyXG5cdGxpc3RlbihldmVudE5hbWUsIGhhbmRsZXIpIHtcclxuXHRcdGlmICghdGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXSkge1xyXG5cdFx0XHR0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdID0gW107XHJcblx0XHR9XHJcblx0XHR0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdLnB1c2goaGFuZGxlcik7XHJcblx0fVxyXG5cclxuXHR1bmxpc3RlbihldmVudE5hbWUsIGhhbmRsZXIpIHtcclxuXHRcdGlmICh0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdKSB7XHJcblx0XHRcdGxldCBpbmRleCA9IHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0uaW5kZXhPZihoYW5kbGVyKTtcclxuXHRcdFx0aWYgKGluZGV4ID4gLTEpIHtcclxuXHRcdFx0XHR0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdLnNwbGljZShpbmRleCwgMSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGhhc0xpc3RlbmVyKGV2ZW50TmFtZSkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0gJiYgdGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXS5sZW5ndGggPiAwO1xyXG5cdH1cclxuXHJcblx0ZGlzcGF0Y2goZXZlbnROYW1lLCBldmVudEFyZykge1xyXG5cdFx0aWYgKHRoaXMuaGFzTGlzdGVuZXIoZXZlbnROYW1lKSkge1xyXG5cdFx0XHRsZXQgbGlzdGVuZXJzID0gdGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXTtcclxuXHRcdFx0Zm9yIChsZXQgaT0wOyBpPGxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdGxpc3RlbmVyc1tpXShldmVudEFyZyk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG59IiwiZXhwb3J0IGNsYXNzIEV4dGVuc2lvbiB7XHJcblxyXG5cdGNvbnN0cnVjdG9yIChncmlkLCBjb25maWcpIHtcclxuXHRcdHRoaXMuX2dyaWQgPSBncmlkO1xyXG5cdFx0dGhpcy5fY29uZmlnID0gY29uZmlnO1xyXG5cclxuXHRcdHRoaXMuX2V4dGVuc2lvbnMgPSB7XHJcblx0XHRcdGNlbGxSZW5kZXI6IFtdLFxyXG5cdFx0XHRjZWxsQWZ0ZXJSZW5kZXI6IFtdLFxyXG5cdFx0XHRjZWxsVXBkYXRlOiBbXSxcclxuXHRcdFx0Y2VsbEFmdGVyVXBkYXRlOiBbXSxcclxuXHRcdFx0Y2VsbEVkaXRhYmxlQ2hlY2s6IFtdLFxyXG5cdFx0XHRrZXlEb3duOiBbXSxcclxuXHRcdFx0Z3JpZEFmdGVyUmVuZGVyOiBbXSxcclxuXHRcdFx0ZGF0YUJlZm9yZVJlbmRlcjogW10sXHJcblx0XHRcdGRhdGFCZWZvcmVVcGRhdGU6IFtdLFxyXG5cdFx0XHRkYXRhQWZ0ZXJVcGRhdGU6IFtdLFxyXG5cdFx0XHRkYXRhRmluaXNoVXBkYXRlOiBbXVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0bG9hZEV4dGVuc2lvbiAoZXh0KSB7XHJcblx0XHRpZiAoZXh0Wydpbml0J10pIHtcclxuXHRcdFx0ZXh0Wydpbml0J10odGhpcy5fZ3JpZCwgdGhpcy5fY29uZmlnKTtcclxuXHRcdH1cclxuXHRcdGZvciAobGV0IGV4dFBvaW50IGluIHRoaXMuX2V4dGVuc2lvbnMpIHtcclxuXHRcdFx0aWYgKGV4dFtleHRQb2ludF0pIHtcclxuXHRcdFx0XHR0aGlzLl9leHRlbnNpb25zW2V4dFBvaW50XS5wdXNoKGV4dCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGhhc0V4dGVuc2lvbiAoZXh0UG9pbnQpIHtcclxuXHRcdHJldHVybiAodGhpcy5fZXh0ZW5zaW9uc1tleHRQb2ludF0gJiYgdGhpcy5fZXh0ZW5zaW9uc1tleHRQb2ludF0ubGVuZ3RoID4gMClcclxuXHR9XHJcblxyXG5cdHF1ZXJ5RXh0ZW5zaW9uIChleHRQb2ludCkge1xyXG5cdFx0aWYgKHRoaXMuX2V4dGVuc2lvbnNbZXh0UG9pbnRdKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLl9leHRlbnNpb25zW2V4dFBvaW50XTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiBbXTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGV4ZWN1dGVFeHRlbnNpb24gKGV4dFBvaW50KSB7XHJcblx0XHR0aGlzLnF1ZXJ5RXh0ZW5zaW9uKGV4dFBvaW50KS5mb3JFYWNoKChleHQpID0+IHtcclxuXHRcdFx0ZXh0W2V4dFBvaW50XS5hcHBseShleHQsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxufSIsImltcG9ydCB7IFZpZXcgfSBmcm9tICcuL3ZpZXcnO1xyXG5pbXBvcnQgeyBNb2RlbCB9IGZyb20gJy4vbW9kZWwnO1xyXG5pbXBvcnQgeyBEYXRhVGFibGUgfSBmcm9tICcuLi9kYXRhL3RhYmxlJztcclxuaW1wb3J0IHsgRXh0ZW5zaW9uIH0gZnJvbSAnLi9leHRlbnNpb24nO1xyXG5pbXBvcnQgeyBTdGF0ZSB9IGZyb20gJy4vc3RhdGUnO1xyXG5pbXBvcnQgeyBFdmVudERpc3BhdGNoZXIgfSBmcm9tICcuL2V2ZW50JztcclxuaW1wb3J0IHsgVXRpbHMgfSBmcm9tICcuL3V0aWxzJztcclxuXHJcbmltcG9ydCB7IFNlbGVjdGlvbkV4dGVuc2lvbiB9IGZyb20gJy4uL2V4dGVuc2lvbnMvc2VsZWN0aW9uJztcclxuaW1wb3J0IHsgRWRpdG9yRXh0ZW5zaW9uIH0gZnJvbSAnLi4vZXh0ZW5zaW9ucy9lZGl0b3InO1xyXG5pbXBvcnQgeyBDb3B5UGFzdGVFeHRlbnNpb24gfSBmcm9tICcuLi9leHRlbnNpb25zL2NvcHlwYXN0ZSc7XHJcbmltcG9ydCB7IFZpZXdVcGRhdGVyRXh0ZW5zaW9uIH0gZnJvbSAnLi4vZXh0ZW5zaW9ucy92aWV3LXVwZGF0ZXInO1xyXG5pbXBvcnQgeyBGb3JtYXR0ZXJFeHRlbnNpb24gfSBmcm9tICcuLi9leHRlbnNpb25zL2Zvcm1hdHRlcic7XHJcblxyXG5leHBvcnQgY2xhc3MgUEdyaWQgZXh0ZW5kcyBFdmVudERpc3BhdGNoZXIge1xyXG5cclxuXHRjb25zdHJ1Y3Rvcihjb25maWcpIHtcclxuXHRcdHN1cGVyKCk7XHJcblxyXG5cdFx0Ly9NZXJnZSBjb25maWcgd2l0aCBkZWZhdWx0IGNvbmZpZ1xyXG5cdFx0bGV0IGRlZmF1bHRDb25maWcgPSB7XHJcblx0XHRcdHJvd0NvdW50OiAwLFxyXG5cdFx0XHRoZWFkZXJSb3dDb3VudDogMSxcclxuXHRcdFx0Zm9vdGVyUm93Q291bnQ6IDAsXHJcblx0XHRcdGNvbHVtbkNvdW50OiAwLFxyXG5cdFx0XHRyb3dIZWlnaHQ6IDMyLFxyXG5cdFx0XHRjb2x1bW5XaWR0aDogMTAwXHJcblx0XHR9O1xyXG5cdFx0dGhpcy5fY29uZmlnID0gVXRpbHMubWl4aW4oY29uZmlnLCBkZWZhdWx0Q29uZmlnKTtcclxuXHJcblx0XHQvL0V4dGVuc2lvbnMgU3RvcmVcclxuXHRcdHRoaXMuX2V4dGVuc2lvbnMgPSBuZXcgRXh0ZW5zaW9uKHRoaXMsIHRoaXMuX2NvbmZpZyk7XHJcblxyXG5cdFx0dGhpcy5fZGF0YSA9IG5ldyBEYXRhVGFibGUodGhpcy5fY29uZmlnLmRhdGFNb2RlbCwgdGhpcy5fZXh0ZW5zaW9ucyk7XHJcblx0XHR0aGlzLl9tb2RlbCA9IG5ldyBNb2RlbCh0aGlzLl9jb25maWcsIHRoaXMuX2RhdGEsIHRoaXMuX2V4dGVuc2lvbnMpO1xyXG5cdFx0dGhpcy5fdmlldyA9IG5ldyBWaWV3KHRoaXMuX21vZGVsLCB0aGlzLl9leHRlbnNpb25zKTtcclxuXHRcdHRoaXMuX3N0YXRlID0gbmV3IFN0YXRlKCk7XHJcblxyXG5cdFx0Ly9Mb2FkIGRlZmF1bHQgZXh0ZW5zaW9uc1xyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5zZWxlY3Rpb24pIHtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5sb2FkRXh0ZW5zaW9uKG5ldyBTZWxlY3Rpb25FeHRlbnNpb24oKSk7XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmVkaXRpbmcpIHtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5sb2FkRXh0ZW5zaW9uKG5ldyBFZGl0b3JFeHRlbnNpb24oKSk7XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmNvcHlwYXN0ZSkge1xyXG5cdFx0XHR0aGlzLl9leHRlbnNpb25zLmxvYWRFeHRlbnNpb24obmV3IENvcHlQYXN0ZUV4dGVuc2lvbigpKTtcclxuXHRcdH1cclxuXHRcdGlmICh0aGlzLl9jb25maWcuYXV0b1VwZGF0ZSkge1xyXG5cdFx0XHR0aGlzLl9leHRlbnNpb25zLmxvYWRFeHRlbnNpb24obmV3IFZpZXdVcGRhdGVyRXh0ZW5zaW9uKCkpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5jb2x1bW5Gb3JtYXR0ZXIpIHtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5sb2FkRXh0ZW5zaW9uKG5ldyBGb3JtYXR0ZXJFeHRlbnNpb24oKSk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly9Mb2FkIGluaXRpYWwgZXh0ZXJuYWwgZXh0ZW5zaW9uc1xyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5leHRlbnNpb25zICYmIHRoaXMuX2NvbmZpZy5leHRlbnNpb25zLmxlbmd0aCA+IDApIHtcclxuXHRcdFx0dGhpcy5fY29uZmlnLmV4dGVuc2lvbnMuZm9yRWFjaCgoZXh0KSA9PiB7XHJcblx0XHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5sb2FkRXh0ZW5zaW9uKGV4dCk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Z2V0IHZpZXcoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fdmlldztcclxuXHR9XHJcblxyXG5cdGdldCBtb2RlbCgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9tb2RlbDtcclxuXHR9XHJcblxyXG5cdGdldCBkYXRhKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2RhdGE7XHJcblx0fVxyXG5cclxuXHRnZXQgZXh0ZW5zaW9uKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2V4dGVuc2lvbnM7XHJcblx0fVxyXG5cclxuXHRnZXQgc3RhdGUgKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX3N0YXRlO1xyXG5cdH1cclxuXHJcblx0cmVuZGVyKGVsZW1lbnQpIHtcclxuXHRcdHRoaXMuX3ZpZXcucmVuZGVyKGVsZW1lbnQpO1xyXG5cdH1cclxuXHJcbn0iLCJpbXBvcnQgeyBFdmVudERpc3BhdGNoZXIgfSBmcm9tICcuL2V2ZW50JztcclxuXHJcbmV4cG9ydCBjbGFzcyBNb2RlbCBleHRlbmRzIEV2ZW50RGlzcGF0Y2hlciB7XHJcblxyXG5cdGNvbnN0cnVjdG9yIChjb25maWcsIGRhdGEsIGV4dGVuc2lvbikge1xyXG5cdFx0c3VwZXIoKTtcclxuXHRcdHRoaXMuX2NvbmZpZyA9IGNvbmZpZztcclxuXHRcdHRoaXMuX2RhdGEgPSBkYXRhO1xyXG5cdFx0dGhpcy5fZXh0ZW5zaW9uID0gZXh0ZW5zaW9uO1xyXG5cclxuXHRcdHRoaXMuX2NvbHVtbk1vZGVsID0gW107XHJcblx0XHR0aGlzLl9yb3dNb2RlbCA9IHt9O1xyXG5cdFx0dGhpcy5faGVhZGVyUm93TW9kZWwgPSB7fTtcclxuXHRcdHRoaXMuX2NlbGxNb2RlbCA9IHt9O1xyXG5cdFx0dGhpcy5faGVhZGVyQ2VsbE1vZGVsID0ge307XHJcblxyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dzKSB7XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTx0aGlzLl9jb25maWcuaGVhZGVyUm93cy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdGlmICh0aGlzLl9jb25maWcuaGVhZGVyUm93c1tpXS5pICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdHRoaXMuX2hlYWRlclJvd01vZGVsW3RoaXMuX2NvbmZpZy5oZWFkZXJSb3dzW2ldLmldID0gdGhpcy5fY29uZmlnLmhlYWRlclJvd3NbaV07XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmNvbHVtbnMpIHtcclxuXHRcdFx0Zm9yIChsZXQgaT0wOyBpPHRoaXMuX2NvbmZpZy5jb2x1bW5zLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuX2NvbmZpZy5jb2x1bW5zW2ldLmkgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0dGhpcy5fY29sdW1uTW9kZWxbdGhpcy5fY29uZmlnLmNvbHVtbnNbaV0uaV0gPSB0aGlzLl9jb25maWcuY29sdW1uc1tpXTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhpcy5fY29sdW1uTW9kZWxbaV0gPSB0aGlzLl9jb25maWcuY29sdW1uc1tpXTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmICh0aGlzLl9jb25maWcucm93cykge1xyXG5cdFx0XHRmb3IgKGxldCBpPTA7IGk8dGhpcy5fY29uZmlnLnJvd3MubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHR0aGlzLl9yb3dNb2RlbFt0aGlzLl9jb25maWcucm93c1tpXS5pXSA9IHRoaXMuX2NvbmZpZy5yb3dzW2ldO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmNlbGxzKSB7XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTx0aGlzLl9jb25maWcuY2VsbHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRsZXQgbW9kZWwgPSB0aGlzLl9jb25maWcuY2VsbHNbaV07XHJcblx0XHRcdFx0aWYgKCF0aGlzLl9jZWxsTW9kZWxbbW9kZWwuY10pIHtcclxuXHRcdFx0XHRcdHRoaXMuX2NlbGxNb2RlbFttb2RlbC5jXSA9IHt9O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLl9jZWxsTW9kZWxbbW9kZWwuY11bbW9kZWwucl0gPSBtb2RlbDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5oZWFkZXJDZWxscykge1xyXG5cdFx0XHRmb3IgKGxldCBpPTA7IGk8dGhpcy5fY29uZmlnLmhlYWRlckNlbGxzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0bGV0IG1vZGVsID0gdGhpcy5fY29uZmlnLmhlYWRlckNlbGxzW2ldO1xyXG5cdFx0XHRcdGlmICghdGhpcy5faGVhZGVyQ2VsbE1vZGVsW21vZGVsLmNdKSB7XHJcblx0XHRcdFx0XHR0aGlzLl9oZWFkZXJDZWxsTW9kZWxbbW9kZWwuY10gPSB7fTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5faGVhZGVyQ2VsbE1vZGVsW21vZGVsLmNdW21vZGVsLnJdID0gbW9kZWw7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLl9jYWxjVG90YWxTaXplKCk7XHJcblx0fVxyXG5cclxuXHRjYW5FZGl0IChyb3dJbmRleCwgY29sSW5kZXgpIHtcclxuXHRcdGxldCByb3dNb2RlbCA9IHRoaXMuZ2V0Um93TW9kZWwocm93SW5kZXgpO1xyXG5cdFx0bGV0IGNvbE1vZGVsID0gdGhpcy5nZXRDb2x1bW5Nb2RlbChjb2xJbmRleCk7XHJcblx0XHRsZXQgY2VsbE1vZGVsID0gdGhpcy5nZXRDZWxsTW9kZWwocm93SW5kZXgsIGNvbEluZGV4KTtcclxuXHRcdGxldCByZXN1bHQgPSBmYWxzZTtcclxuXHJcblx0XHRpZiAoKHJvd01vZGVsICYmIHJvd01vZGVsLmVkaXRhYmxlKSB8fFxyXG5cdFx0XHQoY29sTW9kZWwgJiYgY29sTW9kZWwuZWRpdGFibGUpIHx8XHJcblx0XHRcdChjZWxsTW9kZWwgJiYgY2VsbE1vZGVsLmVkaXRhYmxlKSkge1xyXG5cdFx0XHRpZiAoKHJvd01vZGVsICYmIHJvd01vZGVsLmVkaXRhYmxlID09PSBmYWxzZSkgfHxcclxuXHRcdFx0XHQoY29sTW9kZWwgJiYgY29sTW9kZWwuZWRpdGFibGUgPT09IGZhbHNlKSB8fFxyXG5cdFx0XHRcdChjZWxsTW9kZWwgJiYgY2VsbE1vZGVsLmVkaXRhYmxlID09PSBmYWxzZSkpIHtcclxuXHRcdFx0XHRyZXN1bHQgPSBmYWxzZTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZXN1bHQgPSB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0Ly9FZGl0aWJpbGl0eSBjYW4gYmUgb3ZlcnJpZGRlbiBieSBleHRlbnNpb25cclxuXHRcdGlmICh0aGlzLl9leHRlbnNpb24uaGFzRXh0ZW5zaW9uKCdjZWxsRWRpdGFibGVDaGVjaycpKSB7XHJcblx0XHRcdFxyXG5cdFx0XHQvL0NhbiBFZGl0IE92ZXJyaWRpbmdcclxuXHRcdFx0Y29uc3Qgcm93SWQgPSB0aGlzLmdldFJvd0lkKHJvd0luZGV4KTtcclxuXHRcdFx0Y29uc3QgZmllbGQgPSB0aGlzLmdldENvbHVtbkZpZWxkKGNvbEluZGV4KTtcclxuXHRcdFx0Y29uc3QgZGF0YVJvdyA9IHRoaXMuX2RhdGEuZ2V0Um93RGF0YShyb3dJZCk7XHJcblx0XHRcdGNvbnN0IGUgPSB7XHJcblx0XHRcdFx0cm93SW5kZXg6IHJvd0luZGV4LFxyXG5cdFx0XHRcdGNvbEluZGV4OiBjb2xJbmRleCxcclxuXHRcdFx0XHRyb3dJZDogcm93SWQsXHJcblx0XHRcdFx0ZmllbGQ6IGZpZWxkLFxyXG5cdFx0XHRcdGRhdGFSb3c6IGRhdGFSb3csXHJcblx0XHRcdFx0cm93TW9kZWw6IHJvd01vZGVsLFxyXG5cdFx0XHRcdGNvbE1vZGVsOiBjb2xNb2RlbCxcclxuXHRcdFx0XHRjZWxsTW9kZWw6IGNlbGxNb2RlbCxcclxuXHRcdFx0XHRjYW5FZGl0OiByZXN1bHRcclxuXHRcdFx0fTtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9uLmV4ZWN1dGVFeHRlbnNpb24oJ2NlbGxFZGl0YWJsZUNoZWNrJywgZSk7XHJcblx0XHRcdHJlc3VsdCA9IGUuY2FuRWRpdDtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdH1cclxuXHJcblx0aXNIZWFkZXJSb3cgKHJvd0luZGV4KSB7XHJcblx0XHRyZXR1cm4gcm93SW5kZXggPCB0aGlzLl9jb25maWcuaGVhZGVyUm93Q291bnQ7XHJcblx0fVxyXG5cclxuXHRnZXRDb2x1bW5XaWR0aCAoY29sSW5kZXgpIHtcclxuXHRcdGxldCBjb2xNb2RlbCA9IHRoaXMuX2NvbHVtbk1vZGVsW2NvbEluZGV4XTtcclxuXHRcdGlmIChjb2xNb2RlbCAmJiBjb2xNb2RlbC53aWR0aCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdHJldHVybiBjb2xNb2RlbC53aWR0aDtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiB0aGlzLl9jb25maWcuY29sdW1uV2lkdGg7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRnZXRSb3dIZWlnaHQgKHJvd0luZGV4KSB7XHJcblx0XHRpZiAodGhpcy5pc0hlYWRlclJvdyhyb3dJbmRleCkpIHtcclxuXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjb25zdCBkYXRhUm93SW5kZXggPSByb3dJbmRleCAtIHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudDtcclxuXHRcdFx0bGV0IHJvd01vZGVsID0gdGhpcy5fcm93TW9kZWxbZGF0YVJvd0luZGV4XTtcclxuXHRcdFx0aWYgKHJvd01vZGVsICYmIHJvd01vZGVsLmhlaWdodCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJvd01vZGVsLmhlaWdodDtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLnJvd0hlaWdodDtcclxuXHRcdFx0fVx0XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRnZXRDb2x1bW5Db3VudCAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLmNvbHVtbnMubGVuZ3RoO1xyXG5cdH1cclxuXHJcblx0Z2V0Um93Q291bnQgKCkge1xyXG5cdFx0bGV0IGhlYWRlclJvd0NvdW50ID0gdGhpcy5fY29uZmlnLmhlYWRlclJvd0NvdW50O1xyXG5cdFx0cmV0dXJuIGhlYWRlclJvd0NvdW50ICsgdGhpcy5fZGF0YS5nZXRSb3dDb3VudCgpO1xyXG5cdH1cclxuXHJcblx0Z2V0VG9wRnJlZXplUm93cyAoKSB7XHJcblx0XHRsZXQgdG9wRnJlZXplID0gMDtcclxuXHRcdGlmICh0aGlzLl9jb25maWcuaGVhZGVyUm93Q291bnQgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHR0b3BGcmVlemUgKz0gdGhpcy5fY29uZmlnLmhlYWRlclJvd0NvdW50OyBcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRvcEZyZWV6ZSArPSAxO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lICYmIHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lLnRvcCA+IDApIHtcclxuXHRcdFx0dG9wRnJlZXplICs9IHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lLnRvcDtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0b3BGcmVlemU7XHJcblx0fVxyXG5cclxuXHRnZXRUb3BGcmVlemVTaXplICgpIHtcclxuXHRcdGNvbnN0IHRvcEZyZWV6ZVJvdyA9IHRoaXMuZ2V0VG9wRnJlZXplUm93cygpOyBcclxuXHRcdGxldCBzdW0gPSAwO1xyXG5cdFx0Zm9yIChsZXQgaT0wOyBpPHRvcEZyZWV6ZVJvdzsgaSsrKSB7XHJcblx0XHRcdHN1bSArPSB0aGlzLmdldFJvd0hlaWdodChpKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBzdW07XHJcblx0fVxyXG5cclxuXHRnZXRMZWZ0RnJlZXplUm93cyAoKSB7XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUgJiYgdGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUubGVmdCA+IDApIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lLmxlZnQ7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gMDtcclxuXHR9XHJcblxyXG5cdGdldExlZnRGcmVlemVTaXplICgpIHtcclxuXHRcdGlmICh0aGlzLl9jb25maWcuZnJlZXplUGFuZSAmJiB0aGlzLl9jb25maWcuZnJlZXplUGFuZS5sZWZ0ID4gMCkge1xyXG5cdFx0XHRsZXQgc3VtID0gMDtcclxuXHRcdFx0Zm9yIChsZXQgaT0wOyBpPHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lLmxlZnQ7IGkrKykge1xyXG5cdFx0XHRcdHN1bSArPSB0aGlzLmdldENvbHVtbldpZHRoKGkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBzdW07XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gMDtcclxuXHR9XHJcblxyXG5cdGdldEJvdHRvbUZyZWV6ZVJvd3MgKCkge1xyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lICYmIHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lLmJvdHRvbSA+IDApIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lLmJvdHRvbTtcclxuXHRcdH1cclxuXHRcdHJldHVybiAwO1xyXG5cdH1cclxuXHJcblx0Z2V0Qm90dG9tRnJlZXplU2l6ZSAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fYm90dG9tRnJlZXplU2l6ZTtcclxuXHR9XHJcblxyXG5cdGdldENvbHVtbldpZHRoIChpbmRleCkge1xyXG5cdFx0aWYgKHRoaXMuX2NvbHVtbk1vZGVsW2luZGV4XSAmJiB0aGlzLl9jb2x1bW5Nb2RlbFtpbmRleF0ud2lkdGggIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fY29sdW1uTW9kZWxbaW5kZXhdLndpZHRoO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXMuX2NvbmZpZy5jb2x1bW5XaWR0aDtcclxuXHR9XHJcblxyXG5cdGdldFJvd0hlaWdodCAoaW5kZXgpIHtcclxuXHRcdGlmICh0aGlzLl9yb3dNb2RlbFtpbmRleF0gJiYgdGhpcy5fcm93TW9kZWxbaW5kZXhdLmhlaWdodCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLl9yb3dNb2RlbFtpbmRleF0uaGVpZ2h0O1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXMuX2NvbmZpZy5yb3dIZWlnaHQ7XHJcblx0fVxyXG5cclxuXHRnZXRUb3RhbFdpZHRoICgpIHtcclxuXHRcdHJldHVybiB0aGlzLl90b3RhbFdpZHRoO1xyXG5cdH1cclxuXHJcblx0Z2V0VG90YWxIZWlnaHQgKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX3RvdGFsSGVpZ2h0O1xyXG5cdH1cclxuXHJcblx0Z2V0Um93TW9kZWwgKHJvd0luZGV4KSB7XHJcblx0XHRpZiAodGhpcy5pc0hlYWRlclJvdyhyb3dJbmRleCkpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2hlYWRlclJvd01vZGVsW3Jvd0luZGV4XTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGNvbnN0IGRhdGFSb3dJbmRleCA9IHJvd0luZGV4IC0gdGhpcy5fY29uZmlnLmhlYWRlclJvd0NvdW50O1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fcm93TW9kZWxbZGF0YVJvd0luZGV4XTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldENvbHVtbk1vZGVsIChjb2xJbmRleCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2NvbHVtbk1vZGVsW2NvbEluZGV4XTtcclxuXHR9XHJcblxyXG5cdGdldENlbGxNb2RlbCAocm93SW5kZXgsIGNvbEluZGV4KSB7XHJcblx0XHRpZiAodGhpcy5pc0hlYWRlclJvdyhyb3dJbmRleCkpIHtcclxuXHRcdFx0aWYgKHRoaXMuX2hlYWRlckNlbGxNb2RlbFtjb2xJbmRleF0pIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5faGVhZGVyQ2VsbE1vZGVsW2NvbEluZGV4XVtyb3dJbmRleF07XHJcblx0XHRcdH1cclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGNvbnN0IGRhdGFSb3dJbmRleCA9IHJvd0luZGV4IC0gdGhpcy5fY29uZmlnLmhlYWRlclJvd0NvdW50O1xyXG5cdFx0XHRpZiAodGhpcy5fY2VsbE1vZGVsW2NvbEluZGV4XSkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9jZWxsTW9kZWxbY29sSW5kZXhdW2RhdGFSb3dJbmRleF07XHJcblx0XHRcdH1cdFxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Z2V0Q2FzY2FkZWRDZWxsUHJvcCAocm93SW5kZXgsIGNvbEluZGV4LCBwcm9wTmFtZSkge1xyXG5cdFx0Y29uc3QgY2VsbE1vZGVsID0gdGhpcy5nZXRDZWxsTW9kZWwocm93SW5kZXgsIGNvbEluZGV4KTtcclxuXHRcdGlmIChjZWxsTW9kZWwgJiYgY2VsbE1vZGVsW3Byb3BOYW1lXSkge1xyXG5cdFx0XHRyZXR1cm4gY2VsbE1vZGVsW3Byb3BOYW1lXTtcclxuXHRcdH1cclxuXHJcblx0XHRjb25zdCByb3dNb2RlbCA9IHRoaXMuZ2V0Um93TW9kZWwocm93SW5kZXgpO1xyXG5cdFx0aWYgKHJvd01vZGVsICYmIHJvd01vZGVsW3Byb3BOYW1lXSkge1xyXG5cdFx0XHRyZXR1cm4gcm93TW9kZWxbcHJvcE5hbWVdO1xyXG5cdFx0fVxyXG5cclxuXHRcdGNvbnN0IGNvbHVtbk1vZGVsID0gdGhpcy5nZXRDb2x1bW5Nb2RlbChjb2xJbmRleCk7XHJcblx0XHRpZiAoY29sdW1uTW9kZWwgJiYgY29sdW1uTW9kZWxbcHJvcE5hbWVdKSB7XHJcblx0XHRcdHJldHVybiBjb2x1bW5Nb2RlbFtwcm9wTmFtZV07XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcclxuXHR9XHJcblxyXG5cdGdldENlbGxDbGFzc2VzIChyb3dJbmRleCwgY29sSW5kZXgpIHtcclxuXHRcdGxldCBvdXRwdXQgPSBbXTtcclxuXHRcdGNvbnN0IGNvbE1vZGVsID0gdGhpcy5nZXRDb2x1bW5Nb2RlbChjb2xJbmRleCk7XHJcblx0XHRpZiAoY29sTW9kZWwpIHtcclxuXHRcdFx0aWYgKGNvbE1vZGVsLmNzc0NsYXNzKSB7XHJcblx0XHRcdFx0b3V0cHV0LnVuc2hpZnQoY29sTW9kZWwuY3NzQ2xhc3MpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0Y29uc3QgaXNIZWFkZXIgPSB0aGlzLmlzSGVhZGVyUm93KHJvd0luZGV4KTtcclxuXHRcdGNvbnN0IHJvd01vZGVsID0gdGhpcy5nZXRSb3dNb2RlbChyb3dJbmRleCk7XHJcblx0XHRpZiAocm93TW9kZWwpIHtcclxuXHRcdFx0aWYgKGlzSGVhZGVyKSB7XHJcblx0XHRcdFx0b3V0cHV0LnVuc2hpZnQoJ3BncmlkLXJvdy1oZWFkZXInKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAocm93TW9kZWwuY3NzQ2xhc3MpIHtcclxuXHRcdFx0XHRvdXRwdXQudW5zaGlmdChyb3dNb2RlbC5jc3NDbGFzcyk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRjb25zdCBjZWxsTW9kZWwgPSB0aGlzLmdldENlbGxNb2RlbChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cdFx0aWYgKGNlbGxNb2RlbCkge1xyXG5cdFx0XHRpZiAoY2VsbE1vZGVsLmNzc0NsYXNzKSB7XHJcblx0XHRcdFx0b3V0cHV0LnVuc2hpZnQoY2VsbE1vZGVsLmNzc0NsYXNzKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIG91dHB1dDtcclxuXHR9XHJcblxyXG5cdGRldGVybWluZVNjcm9sbGJhclN0YXRlICh2aWV3V2lkdGgsIHZpZXdIZWlnaHQsIHNjcm9sbGJhclNpemUpIHtcclxuXHRcdGxldCBuZWVkSCA9IHRoaXMuX3RvdGFsV2lkdGggPiB2aWV3V2lkdGg7XHJcblx0XHRsZXQgbmVlZFYgPSB0aGlzLl90b3RhbEhlaWdodCA+IHZpZXdIZWlnaHQ7XHJcblxyXG5cdFx0aWYgKG5lZWRIICYmICFuZWVkVikge1xyXG5cdFx0XHRuZWVkViA9IHRoaXMuX3RvdGFsSGVpZ2h0ID4gKHZpZXdIZWlnaHQgLSBzY3JvbGxiYXJTaXplKTtcclxuXHRcdH0gZWxzZVxyXG5cdFx0aWYgKCFuZWVkSCAmJiBuZWVkVikge1xyXG5cdFx0XHRuZWVkSCA9IHRoaXMuX3RvdGFsV2lkdGggPiAodmlld1dpZHRoIC0gc2Nyb2xsYmFyU2l6ZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKG5lZWRIICYmIG5lZWRWKSB7XHJcblx0XHRcdHJldHVybiAnYic7XHJcblx0XHR9IGVsc2VcclxuXHRcdGlmICghbmVlZEggJiYgbmVlZFYpIHtcclxuXHRcdFx0cmV0dXJuICd2JztcclxuXHRcdH0gZWxzZVxyXG5cdFx0aWYgKG5lZWRIICYmICFuZWVkVikge1xyXG5cdFx0XHRyZXR1cm4gJ2gnO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuICduJztcclxuXHR9XHJcblxyXG5cdGdldERhdGFBdCAocm93SW5kZXgsIGNvbEluZGV4KSB7XHJcblx0XHRpZiAodGhpcy5pc0hlYWRlclJvdyhyb3dJbmRleCkpIHtcclxuXHRcdFx0Y29uc3QgY29sTW9kZWwgPSB0aGlzLmdldENvbHVtbk1vZGVsKGNvbEluZGV4KTtcclxuXHRcdFx0aWYgKGNvbE1vZGVsICYmIGNvbE1vZGVsLnRpdGxlKSB7XHJcblx0XHRcdFx0cmV0dXJuIGNvbE1vZGVsLnRpdGxlO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XHJcblx0XHRcdH1cclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGNvbnN0IGRhdGFSb3dJbmRleCA9IHJvd0luZGV4IC0gdGhpcy5fY29uZmlnLmhlYWRlclJvd0NvdW50O1xyXG5cdFx0XHRjb25zdCBjb2xNb2RlbCA9IHRoaXMuZ2V0Q29sdW1uTW9kZWwoY29sSW5kZXgpO1xyXG5cdFx0XHRpZiAoY29sTW9kZWwgJiYgY29sTW9kZWwuZmllbGQpIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fZGF0YS5nZXREYXRhQXQoZGF0YVJvd0luZGV4LCBjb2xNb2RlbC5maWVsZCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcclxuXHRcdFx0fVx0XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRzZXREYXRhQXQgKHJvd0luZGV4LCBjb2xJbmRleCwgZGF0YSkge1xyXG5cdFx0Y29uc3QgZGF0YVJvd0luZGV4ID0gcm93SW5kZXggLSB0aGlzLl9jb25maWcuaGVhZGVyUm93Q291bnQ7XHJcblx0XHRjb25zdCBjb2xNb2RlbCA9IHRoaXMuZ2V0Q29sdW1uTW9kZWwoY29sSW5kZXgpO1xyXG5cdFx0aWYgKGNvbE1vZGVsICYmIGNvbE1vZGVsLmZpZWxkKSB7XHJcblx0XHRcdHRoaXMuX2RhdGEuc2V0RGF0YUF0KGRhdGFSb3dJbmRleCwgY29sTW9kZWwuZmllbGQsIGRhdGEpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Z2V0Um93SW5kZXggKHJvd0lkKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLmhlYWRlclJvd0NvdW50ICsgdGhpcy5fZGF0YS5nZXRSb3dJbmRleChyb3dJZCk7XHJcblx0fVxyXG5cclxuXHRnZXRSb3dJZCAocm93SW5kZXgpIHtcclxuXHRcdGlmIChyb3dJbmRleCA+PSB0aGlzLl9jb25maWcuaGVhZGVyUm93Q291bnQpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2RhdGEuZ2V0Um93SWQocm93SW5kZXggLSB0aGlzLl9jb25maWcuaGVhZGVyUm93Q291bnQpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRnZXRDb2x1bW5JbmRleCAoZmllbGQpIHtcclxuXHRcdGZvciAobGV0IGk9MDsgaTx0aGlzLl9jb25maWcuY29sdW1ucy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRpZiAodGhpcy5fY29uZmlnLmNvbHVtbnNbaV0uZmllbGQgPT09IGZpZWxkKSB7XHJcblx0XHRcdFx0cmV0dXJuIGk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiAtMTtcclxuXHR9XHJcblxyXG5cdGdldENvbHVtbkZpZWxkIChjb2xJbmRleCkge1xyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5jb2x1bW5zW2NvbEluZGV4XSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLmNvbHVtbnNbY29sSW5kZXhdLmZpZWxkO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0X2NhbGNUb3RhbFNpemUoKSB7XHJcblx0XHR0aGlzLl9jYWxjVG90YWxXaWR0aCgpO1xyXG5cdFx0dGhpcy5fY2FsY1RvdGFsSGVpZ2h0KCk7XHJcblx0XHR0aGlzLl9jYWxjQm90dG9tRnJlZXplU2l6ZSgpO1xyXG5cdH1cclxuXHJcblx0X2NhbGNUb3RhbFdpZHRoICgpIHtcclxuXHRcdHRoaXMuX3RvdGFsV2lkdGggPSAwO1xyXG5cdFx0Zm9yIChsZXQgaT0wOyBpPHRoaXMuX2NvbHVtbk1vZGVsLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdGlmICh0aGlzLl9jb2x1bW5Nb2RlbFtpXS53aWR0aCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0dGhpcy5fdG90YWxXaWR0aCArPSB0aGlzLl9jb2x1bW5Nb2RlbFtpXS53aWR0aDtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLl90b3RhbFdpZHRoICs9IHRoaXMuX2NvbmZpZy5jb2x1bW5XaWR0aDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0X2NhbGNUb3RhbEhlaWdodCAoKSB7XHJcblx0XHRsZXQgaGVhZGVyUm93TW9kZWxDb3VudCA9IE9iamVjdC5rZXlzKHRoaXMuX2hlYWRlclJvd01vZGVsKTtcclxuXHRcdHRoaXMuX3RvdGFsSGVpZ2h0ID0gdGhpcy5fY29uZmlnLnJvd0hlaWdodCAqICh0aGlzLl9jb25maWcuaGVhZGVyUm93Q291bnQgLSBoZWFkZXJSb3dNb2RlbENvdW50Lmxlbmd0aCk7XHJcblx0XHRmb3IgKGxldCBpbmRleCBpbiB0aGlzLl9oZWFkZXJSb3dNb2RlbCkge1xyXG5cdFx0XHRpZiAodGhpcy5faGVhZGVyUm93TW9kZWxbaW5kZXhdLmhlaWdodCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0dGhpcy5fdG90YWxIZWlnaHQgKz0gdGhpcy5faGVhZGVyUm93TW9kZWxbaW5kZXhdLmhlaWdodDtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLl90b3RhbEhlaWdodCArPSB0aGlzLl9jb25maWcucm93SGVpZ2h0O1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IHJvd01vZGVsQ291bnQgPSBPYmplY3Qua2V5cyh0aGlzLl9yb3dNb2RlbCk7XHJcblx0XHR0aGlzLl90b3RhbEhlaWdodCArPSB0aGlzLl9jb25maWcucm93SGVpZ2h0ICogKHRoaXMuX2RhdGEuZ2V0Um93Q291bnQoKSAtIHJvd01vZGVsQ291bnQubGVuZ3RoKTtcclxuXHRcdGZvciAobGV0IGluZGV4IGluIHRoaXMuX3Jvd01vZGVsKSB7XHJcblx0XHRcdGlmICh0aGlzLl9yb3dNb2RlbFtpbmRleF0uaGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHR0aGlzLl90b3RhbEhlaWdodCArPSB0aGlzLl9yb3dNb2RlbFtpbmRleF0uaGVpZ2h0O1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMuX3RvdGFsSGVpZ2h0ICs9IHRoaXMuX2NvbmZpZy5yb3dIZWlnaHQ7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdF9jYWxjQm90dG9tRnJlZXplU2l6ZSAoKSB7XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUgJiYgdGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUuYm90dG9tID4gMCkge1xyXG5cdFx0XHRsZXQgc3VtID0gMDtcclxuXHRcdFx0Zm9yIChsZXQgaT0wOyBpPHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lLmJvdHRvbTsgaSsrKSB7XHJcblx0XHRcdFx0c3VtICs9IHRoaXMuZ2V0Um93SGVpZ2h0KCh0aGlzLl9jb25maWcucm93Q291bnQtMSktaSk7XHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy5fYm90dG9tRnJlZXplU2l6ZSA9IHN1bTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMuX2JvdHRvbUZyZWV6ZVNpemUgPSAwO1xyXG5cdFx0fVxyXG5cdH1cclxufSIsImV4cG9ydCBjbGFzcyBTdGF0ZSB7XHJcblxyXG5cdGNvbnN0cnVjdG9yICgpIHtcclxuXHRcdHRoaXMuX3N0YXRlID0ge307XHJcblx0fVxyXG5cclxuXHRleGlzdHMgKGtleSkge1xyXG5cdFx0cmV0dXJuICh0aGlzLl9zdGF0ZVtrZXldICE9PSB1bmRlZmluZWQpO1xyXG5cdH1cclxuXHJcblx0Z2V0IChrZXkpIHtcclxuXHRcdHJldHVybiB0aGlzLl9zdGF0ZVtrZXldO1xyXG5cdH1cclxuXHJcblx0c2V0IChrZXksIHZhbHVlKSB7XHJcblx0XHR0aGlzLl9zdGF0ZVtrZXldID0gdmFsdWU7XHJcblx0fVxyXG5cdFxyXG59IiwiZXhwb3J0IGNsYXNzIFV0aWxzIHtcclxuXHJcblx0c3RhdGljIG1peGluKHNvdXJjZSwgdGFyZ2V0KSB7XHJcblx0XHRmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xyXG5cdFx0XHRpZiAoc291cmNlLmhhc093blByb3BlcnR5KHByb3ApKSB7XHJcblx0XHRcdFx0dGFyZ2V0W3Byb3BdID0gc291cmNlW3Byb3BdO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGFyZ2V0O1xyXG5cdH1cclxufSIsImltcG9ydCB7IEV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJy4vZXZlbnQnO1xyXG5pbXBvcnQgUmVzaXplT2JzZXJ2ZXIgZnJvbSAncmVzaXplLW9ic2VydmVyLXBvbHlmaWxsJztcclxuXHJcbmV4cG9ydCBjbGFzcyBWaWV3IGV4dGVuZHMgRXZlbnREaXNwYXRjaGVyIHtcclxuXHJcblx0Y29uc3RydWN0b3IgKG1vZGVsLCBleHRlbnNpb25zKSB7XHJcblx0XHRzdXBlcigpO1xyXG5cdFx0dGhpcy5fbW9kZWwgPSBtb2RlbDtcclxuXHRcdHRoaXMuX2V4dGVuc2lvbnMgPSBleHRlbnNpb25zO1xyXG5cdFx0dGhpcy5fdGVtcGxhdGUgPSBcdCc8ZGl2IGNsYXNzPVwicGdyaWQtY29udGVudC1wYW5lXCIgc3R5bGU9XCJwb3NpdGlvbjogcmVsYXRpdmU7XCI+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PGRpdiBjbGFzcz1cInBncmlkLXRvcC1sZWZ0LXBhbmVcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcIj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHRcdDxkaXYgY2xhc3M9XCJwZ3JpZC10b3AtbGVmdC1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgb3ZlcmZsb3c6IGhpZGRlbjsgcG9zaXRpb246IHJlbGF0aXZlO1wiPjwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDxkaXYgY2xhc3M9XCJwZ3JpZC10b3AtcGFuZVwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1wiPicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdFx0PGRpdiBjbGFzcz1cInBncmlkLXRvcC1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgb3ZlcmZsb3c6IGhpZGRlbjsgcG9zaXRpb246IHJlbGF0aXZlO1wiPjwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDxkaXYgY2xhc3M9XCJwZ3JpZC1sZWZ0LXBhbmVcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcIj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHRcdDxkaXYgY2xhc3M9XCJwZ3JpZC1sZWZ0LWlubmVyXCIgc3R5bGU9XCJ3aWR0aDogMTAwJTsgaGVpZ2h0OiAxMDAlOyBvdmVyZmxvdzogaGlkZGVuOyBwb3NpdGlvbjogcmVsYXRpdmU7XCI+PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PGRpdiBjbGFzcz1cInBncmlkLWNlbnRlci1wYW5lXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XCI+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0XHQ8ZGl2IGNsYXNzPVwicGdyaWQtY2VudGVyLWlubmVyXCIgc3R5bGU9XCJ3aWR0aDogMTAwJTsgaGVpZ2h0OiAxMDAlOyBvdmVyZmxvdzogaGlkZGVuOyBwb3NpdGlvbjogcmVsYXRpdmU7XCI+PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PGRpdiBjbGFzcz1cInBncmlkLWJvdHRvbS1sZWZ0LXBhbmVcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcIj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHRcdDxkaXYgY2xhc3M9XCJwZ3JpZC1ib3R0b20tbGVmdC1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgb3ZlcmZsb3c6IGhpZGRlbjsgcG9zaXRpb246IHJlbGF0aXZlO1wiPjwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDxkaXYgY2xhc3M9XCJwZ3JpZC1ib3R0b20tcGFuZVwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1wiPicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdFx0PGRpdiBjbGFzcz1cInBncmlkLWJvdHRvbS1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgb3ZlcmZsb3c6IGhpZGRlbjsgcG9zaXRpb246IHJlbGF0aXZlO1wiPjwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCc8L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cInBncmlkLWhzY3JvbGxcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTsgYm90dG9tOiAwcHg7IG92ZXJmbG93LXk6IGhpZGRlbjsgb3ZlcmZsb3cteDogc2Nyb2xsO1wiPicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDxkaXYgY2xhc3M9XCJwZ3JpZC1oc2Nyb2xsLXRodW1iXCI+PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0JzwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwicGdyaWQtdnNjcm9sbFwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlOyByaWdodDogMHB4OyB0b3A6IDBweDsgb3ZlcmZsb3cteTogc2Nyb2xsOyBvdmVyZmxvdy14OiBoaWRkZW47XCI+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PGRpdiBjbGFzcz1cInBncmlkLXZzY3JvbGwtdGh1bWJcIj48L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnPC9kaXY+JztcclxuXHR9XHJcblxyXG5cdHJlbmRlciAoZWxlbWVudCkge1xyXG5cdFx0dGhpcy5fZWxlbWVudCA9IGVsZW1lbnQ7XHJcblx0XHR0aGlzLl9lbGVtZW50LmNsYXNzTmFtZSA9ICdwZ3JpZCc7XHJcblx0XHR0aGlzLl9lbGVtZW50LmlubmVySFRNTCA9IHRoaXMuX3RlbXBsYXRlO1xyXG5cdFx0dGhpcy5fZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XHJcblx0XHR0aGlzLl9lbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XHJcblx0XHR0aGlzLl9lbGVtZW50LnRhYkluZGV4ID0gMTtcclxuXHJcblx0XHR0aGlzLl9jb250ZW50UGFuZSA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLWNvbnRlbnQtcGFuZScpO1xyXG5cdFx0dGhpcy5fdG9wTGVmdFBhbmUgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC10b3AtbGVmdC1wYW5lJyk7XHJcblx0XHR0aGlzLl90b3BMZWZ0SW5uZXIgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC10b3AtbGVmdC1pbm5lcicpO1xyXG5cdFx0dGhpcy5fdG9wUGFuZSA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLXRvcC1wYW5lJyk7XHJcblx0XHR0aGlzLl90b3BJbm5lciA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLXRvcC1pbm5lcicpO1xyXG5cdFx0dGhpcy5fbGVmdFBhbmUgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1sZWZ0LXBhbmUnKTtcclxuXHRcdHRoaXMuX2xlZnRJbm5lciA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLWxlZnQtaW5uZXInKTtcclxuXHRcdHRoaXMuX2NlbnRlclBhbmUgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1jZW50ZXItcGFuZScpO1xyXG5cdFx0dGhpcy5fY2VudGVySW5uZXIgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1jZW50ZXItaW5uZXInKTtcclxuXHRcdHRoaXMuX2JvdHRvbVBhbmUgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1ib3R0b20tcGFuZScpO1xyXG5cdFx0dGhpcy5fYm90dG9tSW5uZXIgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1ib3R0b20taW5uZXInKTtcclxuXHRcdHRoaXMuX2JvdHRvbUxlZnRQYW5lID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtYm90dG9tLWxlZnQtcGFuZScpO1xyXG5cdFx0dGhpcy5fYm90dG9tTGVmdElubmVyID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtYm90dG9tLWxlZnQtaW5uZXInKTtcclxuXHJcblx0XHR0aGlzLl9zY3JvbGxXaWR0aCA9IHRoaXMuX21lYXN1cmVTY3JvbGxiYXJXaWR0aCgpO1xyXG5cclxuXHRcdHRoaXMuX2hTY3JvbGwgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1oc2Nyb2xsJyk7XHJcblx0XHR0aGlzLl92U2Nyb2xsID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtdnNjcm9sbCcpO1xyXG5cdFx0dGhpcy5faFNjcm9sbFRodW1iID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtaHNjcm9sbC10aHVtYicpO1xyXG5cdFx0dGhpcy5fdlNjcm9sbFRodW1iID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtdnNjcm9sbC10aHVtYicpO1xyXG5cdFx0dGhpcy5faFNjcm9sbC5zdHlsZS5oZWlnaHQgPSB0aGlzLl9zY3JvbGxXaWR0aCArICdweCc7XHJcblx0XHR0aGlzLl92U2Nyb2xsLnN0eWxlLndpZHRoID0gdGhpcy5fc2Nyb2xsV2lkdGggKyAncHgnO1xyXG5cdFx0dGhpcy5faFNjcm9sbFRodW1iLnN0eWxlLmhlaWdodCA9IHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4JztcclxuXHRcdHRoaXMuX3ZTY3JvbGxUaHVtYi5zdHlsZS53aWR0aCA9IHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4JztcclxuXHJcblx0XHR0aGlzLl9vYnNlcnZlU2l6ZSgpO1xyXG5cdFx0dGhpcy5fcmVzdHVyZWN0dXJlKCk7XHJcblx0XHR0aGlzLl9hdHRhY2hIYW5kbGVycygpO1xyXG5cclxuXHRcdHRoaXMuX2V4dGVuc2lvbnMuZXhlY3V0ZUV4dGVuc2lvbignZ3JpZEFmdGVyUmVuZGVyJywge1xyXG5cdFx0XHRncmlkOiB0aGlzXHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdHJlUmVuZGVyICgpIHtcclxuXHRcdHRoaXMuX3RvcExlZnRJbm5lci5pbm5lckhUTUwgPSAnJztcclxuXHRcdHRoaXMuX3RvcElubmVyLmlubmVySFRNTCA9ICcnO1xyXG5cdFx0dGhpcy5fbGVmdElubmVyLmlubmVySFRNTCA9ICcnO1xyXG5cdFx0dGhpcy5fY2VudGVySW5uZXIuaW5uZXJIVE1MID0gJyc7XHJcblx0XHR0aGlzLl9ib3R0b21MZWZ0SW5uZXIuaW5uZXJIVE1MID0gJyc7XHJcblx0XHR0aGlzLl9ib3R0b21Jbm5lci5pbm5lckhUTUwgPSAnJztcclxuXHJcblx0XHR0aGlzLl9yZXN0dXJlY3R1cmUoKTtcclxuXHR9XHJcblxyXG5cdGdldEVsZW1lbnQgKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2VsZW1lbnQ7XHJcblx0fVxyXG5cclxuXHRzZXRTY3JvbGxYICh4LCBhZGp1c3RTY3JvbGxCYXIpIHtcclxuXHRcdHRoaXMuX3RvcElubmVyLnNjcm9sbExlZnQgPSB4O1xyXG5cdFx0dGhpcy5fY2VudGVySW5uZXIuc2Nyb2xsTGVmdCA9IHg7XHJcblx0XHR0aGlzLl9ib3R0b21Jbm5lci5zY3JvbGxMZWZ0ID0geDtcclxuXHRcdGlmIChhZGp1c3RTY3JvbGxCYXIgfHwgYWRqdXN0U2Nyb2xsQmFyID09PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0dGhpcy5faFNjcm9sbC5zY3JvbGxMZWZ0ID0geDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldFNjcm9sbFggKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2NlbnRlcklubmVyLnNjcm9sbExlZnQ7XHJcblx0fVxyXG5cclxuXHRzZXRTY3JvbGxZICh5LCBhZGp1c3RTY3JvbGxCYXIpIHtcclxuXHRcdHRoaXMuX2NlbnRlcklubmVyLnNjcm9sbFRvcCA9IHk7XHJcblx0XHR0aGlzLl9sZWZ0SW5uZXIuc2Nyb2xsVG9wID0geTtcclxuXHRcdGlmIChhZGp1c3RTY3JvbGxCYXIgfHwgYWRqdXN0U2Nyb2xsQmFyID09PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0dGhpcy5fdlNjcm9sbC5zY3JvbGxUb3AgPSB5O1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Z2V0U2Nyb2xsWSAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fY2VudGVySW5uZXIuc2Nyb2xsVG9wO1xyXG5cdH1cclxuXHJcblx0c2Nyb2xsVG9DZWxsIChyb3dJbmRleCwgY29sSW5kZXgsIGFsaWduVG9wKSB7XHJcblx0XHRsZXQgY2VsbCA9IHRoaXMuZ2V0Q2VsbChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cdFx0bGV0IG9yaWdTY3JvbGxUb3AgPSBjZWxsLnBhcmVudEVsZW1lbnQuc2Nyb2xsVG9wO1xyXG5cdFx0bGV0IG9yaWdTY3JvbGxMZWZ0ID0gY2VsbC5wYXJlbnRFbGVtZW50LnNjcm9sbExlZnQ7XHJcblxyXG5cdFx0Y2VsbC5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKGZhbHNlKTtcclxuXHJcblx0XHRpZiAob3JpZ1Njcm9sbFRvcCAhPT0gY2VsbC5wYXJlbnRFbGVtZW50LnNjcm9sbFRvcCkge1xyXG5cdFx0XHR0aGlzLnNldFNjcm9sbFkoY2VsbC5wYXJlbnRFbGVtZW50LnNjcm9sbFRvcCwgdHJ1ZSk7XHJcblx0XHR9XHJcblx0XHRpZiAob3JpZ1Njcm9sbExlZnQgIT09IGNlbGwucGFyZW50RWxlbWVudC5zY3JvbGxMZWZ0KSB7XHJcblx0XHRcdHRoaXMuc2V0U2Nyb2xsWChjZWxsLnBhcmVudEVsZW1lbnQuc2Nyb2xsTGVmdCwgdHJ1ZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRnZXRDZWxsIChyb3dJbmRleCwgY29sSW5kZXgpIHtcclxuXHRcdGxldCBjZWxsID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1yb3ctaW5kZXg9XCInK3Jvd0luZGV4KydcIl1bZGF0YS1jb2wtaW5kZXg9XCInK2NvbEluZGV4KydcIl0nKTtcclxuXHRcdHJldHVybiBjZWxsO1xyXG5cdH1cclxuXHJcblx0dXBkYXRlQ2VsbCAocm93SW5kZXgsIGNvbEluZGV4KSB7XHJcblx0XHRsZXQgY2VsbCA9IHRoaXMuZ2V0Q2VsbChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cdFx0aWYgKGNlbGwpIHtcclxuXHRcdFx0Ly9DcmVhdGUgY2VsbCBjb250ZW50IHdyYXBwZXIgaWYgbm90IGFueVxyXG5cdFx0XHRsZXQgY2VsbENvbnRlbnQgPSBudWxsO1xyXG5cdFx0XHRpZiAoIWNlbGwuZmlyc3RDaGlsZCB8fCAhY2VsbC5maXJzdENoaWxkLmNsYXNzTGlzdC5jb250YWlucygncGdyaWQtY2VsbC1jb250ZW50JykpIHtcclxuXHRcdFx0XHQvL0NsZWFyIGNlbGxcclxuXHRcdFx0XHRjZWxsLmlubmVySFRNTCA9ICcnO1xyXG5cclxuXHRcdFx0XHQvL0FkZCBuZXcgY2VsbCBjb250ZW50XHJcblx0XHRcdFx0Y2VsbENvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHRcdFx0XHRjZWxsQ29udGVudC5jbGFzc05hbWUgPSAncGdyaWQtY2VsbC1jb250ZW50JztcclxuXHRcdFx0XHRjZWxsLmFwcGVuZENoaWxkKGNlbGxDb250ZW50KTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRjZWxsQ29udGVudCA9IGNlbGwuZmlyc3RDaGlsZDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly9HZXQgZGF0YSB0byBiZSB1cGRhdGVkXHJcblx0XHRcdGxldCBkYXRhID0gdGhpcy5fbW9kZWwuZ2V0RGF0YUF0KHJvd0luZGV4LCBjb2xJbmRleCk7XHJcblxyXG5cdFx0XHQvL0RhdGEgY2FuIGJlIHRyYW5zZm9ybWVkIGJlZm9yZSByZW5kZXJpbmcgdXNpbmcgZGF0YUJlZm9yZVJlbmRlciBleHRlbnNpb25cclxuXHRcdFx0bGV0IGFyZyA9IHtkYXRhOiBkYXRhfTtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5leGVjdXRlRXh0ZW5zaW9uKCdkYXRhQmVmb3JlUmVuZGVyJywgYXJnKTtcclxuXHRcdFx0ZGF0YSA9IGFyZy5kYXRhO1xyXG5cclxuXHRcdFx0Ly9JZiB0aGVyZSdzIGNlbGxVcGRhdGUgZXh0ZW5zaW9uLCB0aGVuIGV4ZWN1dGUgaXQgdG8gdXBkYXRlIHRoZSBjZWxsIGRhdGFcclxuXHRcdFx0Ly9FbHNlIHVzZSBkZWZhdWx0IHdheSB0byBwdXQgdGhlIGRhdGEgZGlyZWN0bHkgdG8gdGhlIGNlbGwgY29udGVudFxyXG5cdFx0XHRsZXQgaGFuZGxlZEJ5RXh0ID0gZmFsc2U7XHJcblx0XHRcdGlmICh0aGlzLl9leHRlbnNpb25zLmhhc0V4dGVuc2lvbignY2VsbFVwZGF0ZScpKSB7XHJcblx0XHRcdFx0YXJnID0ge1xyXG5cdFx0XHRcdFx0ZGF0YSxcclxuXHRcdFx0XHRcdGNlbGwsXHJcblx0XHRcdFx0XHRjZWxsQ29udGVudCxcclxuXHRcdFx0XHRcdHJvd0luZGV4LFxyXG5cdFx0XHRcdFx0Y29sSW5kZXgsXHJcblx0XHRcdFx0XHRyb3dJZDogdGhpcy5fbW9kZWwuZ2V0Um93SWQocm93SW5kZXgpLFxyXG5cdFx0XHRcdFx0ZmllbGQ6IHRoaXMuX21vZGVsLmdldENvbHVtbkZpZWxkKGNvbEluZGV4KSxcclxuXHRcdFx0XHRcdGhhbmRsZWQ6IGZhbHNlXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMuX2V4dGVuc2lvbnMuZXhlY3V0ZUV4dGVuc2lvbignY2VsbFVwZGF0ZScsIGFyZyk7XHJcblx0XHRcdFx0aGFuZGxlZEJ5RXh0ID0gYXJnLmhhbmRsZWQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmICghaGFuZGxlZEJ5RXh0KSB7XHJcblx0XHRcdFx0aWYgKGRhdGEgIT09IHVuZGVmaW5lZCAmJiBkYXRhICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRjZWxsQ29udGVudC5pbm5lckhUTUwgPSBkYXRhO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRjZWxsQ29udGVudC5pbm5lckhUTUwgPSAnJztcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMuX2V4dGVuc2lvbnMuZXhlY3V0ZUV4dGVuc2lvbignY2VsbEFmdGVyVXBkYXRlJywge1xyXG5cdFx0XHRcdGNlbGw6IGNlbGwsXHJcblx0XHRcdFx0cm93SW5kZXg6IHJvd0luZGV4LFxyXG5cdFx0XHRcdGNvbEluZGV4OiBjb2xJbmRleCxcclxuXHRcdFx0XHRkYXRhOiBkYXRhXHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0X2F0dGFjaEhhbmRsZXJzICgpIHtcclxuXHJcblx0XHR0aGlzLl92U2Nyb2xsSGFuZGxlciA9IChlKSA9PiB7XHJcblx0XHRcdHRoaXMuc2V0U2Nyb2xsWShlLnRhcmdldC5zY3JvbGxUb3AsIGZhbHNlKTtcclxuXHRcdFx0dGhpcy5kaXNwYXRjaCgndnNjcm9sbCcsIGUpO1xyXG5cdFx0fTtcclxuXHJcblx0XHR0aGlzLl9oU2Nyb2xsSGFuZGxlciA9IChlKSA9PiB7XHJcblx0XHRcdHRoaXMuc2V0U2Nyb2xsWChlLnRhcmdldC5zY3JvbGxMZWZ0LCBmYWxzZSk7XHJcblx0XHRcdHRoaXMuZGlzcGF0Y2goJ2hzY3JvbGwnLCBlKTtcclxuXHRcdH07XHJcblxyXG5cdFx0dGhpcy5fd2hlZWxIYW5kbGVyID0gKGUpID0+IHtcclxuXHRcdFx0bGV0IGN1cnJlbnRYID0gdGhpcy5nZXRTY3JvbGxYKCk7XHJcblx0XHRcdGxldCBjdXJyZW50WSA9IHRoaXMuZ2V0U2Nyb2xsWSgpO1xyXG5cdFx0XHR0aGlzLnNldFNjcm9sbFgoY3VycmVudFggKyBlLmRlbHRhWCk7XHJcblx0XHRcdHRoaXMuc2V0U2Nyb2xsWShjdXJyZW50WSArIGUuZGVsdGFZKTtcclxuXHRcdFx0aWYgKGUuZGVsdGFYICE9PSAwKSB7XHJcblx0XHRcdFx0dGhpcy5kaXNwYXRjaCgnaHNjcm9sbCcsIGUpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChlLmRlbHRhWSAhPT0gMCkge1xyXG5cdFx0XHRcdHRoaXMuZGlzcGF0Y2goJ3ZzY3JvbGwnLCBlKTtcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHJcblx0XHR0aGlzLl9rZXlEb3duSGFuZGxlciA9IChlKSA9PiB7XHJcblx0XHRcdHRoaXMuX2V4dGVuc2lvbnMuZXhlY3V0ZUV4dGVuc2lvbigna2V5RG93bicsIGUpO1xyXG5cdFx0fTtcclxuXHJcblx0XHR0aGlzLl92U2Nyb2xsLmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMuX3ZTY3JvbGxIYW5kbGVyKTtcclxuXHRcdHRoaXMuX2hTY3JvbGwuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcy5faFNjcm9sbEhhbmRsZXIpO1xyXG5cdFx0dGhpcy5fY29udGVudFBhbmUuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLl93aGVlbEhhbmRsZXIpO1xyXG5cdFx0dGhpcy5fZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fa2V5RG93bkhhbmRsZXIpO1xyXG5cclxuXHR9XHJcblxyXG5cdF9yZXN0dXJlY3R1cmUgKCkge1xyXG5cdFx0dGhpcy5fY29udGVudFBhbmUuc3R5bGUud2lkdGggPSAnY2FsYygxMDAlIC0gJyArIHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4KSc7XHJcblx0XHR0aGlzLl9jb250ZW50UGFuZS5zdHlsZS5oZWlnaHQgPSAnY2FsYygxMDAlIC0gJyArIHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4KSc7XHJcblxyXG5cdFx0bGV0IHRvcEZyZWV6ZVNpemUgPSB0aGlzLl9tb2RlbC5nZXRUb3BGcmVlemVTaXplKCk7XHJcblx0XHRsZXQgYm90dG9tRnJlZXplU2l6ZSA9IHRoaXMuX21vZGVsLmdldEJvdHRvbUZyZWV6ZVNpemUoKTtcclxuXHRcdGxldCBsZWZ0RnJlZXplU2l6ZSA9IHRoaXMuX21vZGVsLmdldExlZnRGcmVlemVTaXplKCk7XHJcblxyXG5cdFx0dGhpcy5fdG9wTGVmdFBhbmUuc3R5bGUubGVmdCA9ICcwcHgnO1xyXG5cdFx0dGhpcy5fdG9wTGVmdFBhbmUuc3R5bGUudG9wID0gJzBweCc7XHJcblx0XHR0aGlzLl90b3BMZWZ0UGFuZS5zdHlsZS53aWR0aCA9IGxlZnRGcmVlemVTaXplICsgJ3B4JztcclxuXHRcdHRoaXMuX3RvcExlZnRQYW5lLnN0eWxlLmhlaWdodCA9IHRvcEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fdG9wUGFuZS5zdHlsZS5sZWZ0ID0gbGVmdEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fdG9wUGFuZS5zdHlsZS50b3AgPSAnMHB4JztcclxuXHRcdHRoaXMuX3RvcFBhbmUuc3R5bGUud2lkdGggPSAnY2FsYygxMDAlIC0gJyArIGxlZnRGcmVlemVTaXplICsgJ3B4KSc7XHJcblx0XHR0aGlzLl90b3BQYW5lLnN0eWxlLmhlaWdodCA9IHRvcEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fbGVmdFBhbmUuc3R5bGUubGVmdCA9ICcwcHgnO1xyXG5cdFx0dGhpcy5fbGVmdFBhbmUuc3R5bGUudG9wID0gdG9wRnJlZXplU2l6ZSArICdweCc7XHJcblx0XHR0aGlzLl9sZWZ0UGFuZS5zdHlsZS53aWR0aCA9IGxlZnRGcmVlemVTaXplICsgJ3B4JztcclxuXHRcdHRoaXMuX2xlZnRQYW5lLnN0eWxlLmhlaWdodCA9ICdjYWxjKDEwMCUgLSAnICsgKHRvcEZyZWV6ZVNpemUgKyBib3R0b21GcmVlemVTaXplKSArICdweCknO1xyXG5cdFx0dGhpcy5fY2VudGVyUGFuZS5zdHlsZS5sZWZ0ID0gbGVmdEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fY2VudGVyUGFuZS5zdHlsZS50b3AgPSB0b3BGcmVlemVTaXplICsgJ3B4JztcclxuXHRcdHRoaXMuX2NlbnRlclBhbmUuc3R5bGUud2lkdGggPSAnY2FsYygxMDAlIC0gJyArIGxlZnRGcmVlemVTaXplICsgJ3B4KSc7XHJcblx0XHR0aGlzLl9jZW50ZXJQYW5lLnN0eWxlLmhlaWdodCA9ICdjYWxjKDEwMCUgLSAnICsgKHRvcEZyZWV6ZVNpemUgKyBib3R0b21GcmVlemVTaXplKSArICdweCknO1xyXG5cdFx0dGhpcy5fYm90dG9tTGVmdFBhbmUuc3R5bGUubGVmdCA9ICcwcHgnO1xyXG5cdFx0dGhpcy5fYm90dG9tTGVmdFBhbmUuc3R5bGUuYm90dG9tID0gJzBweCc7XHJcblx0XHR0aGlzLl9ib3R0b21MZWZ0UGFuZS5zdHlsZS53aWR0aCA9IGxlZnRGcmVlemVTaXplICsgJ3B4JztcclxuXHRcdHRoaXMuX2JvdHRvbUxlZnRQYW5lLnN0eWxlLmhlaWdodCA9IGJvdHRvbUZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fYm90dG9tUGFuZS5zdHlsZS5sZWZ0ID0gbGVmdEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fYm90dG9tUGFuZS5zdHlsZS5ib3R0b20gPSAnMHB4JztcclxuXHRcdHRoaXMuX2JvdHRvbVBhbmUuc3R5bGUud2lkdGggPSAnY2FsYygxMDAlIC0gJyArIGxlZnRGcmVlemVTaXplICsgJ3B4KSc7XHJcblx0XHR0aGlzLl9ib3R0b21QYW5lLnN0eWxlLmhlaWdodCA9IGJvdHRvbUZyZWV6ZVNpemUgKyAncHgnO1xyXG5cclxuXHRcdHRoaXMuX3JlbmRlckNlbGxzKCk7XHJcblx0XHR0aGlzLl91cGRhdGVTY3JvbGxCYXIoKTtcclxuXHR9XHJcblxyXG5cdF9vYnNlcnZlU2l6ZSAoKSB7XHJcblx0XHR0aGlzLl9yZXNpemVPYnNlcnZlciA9IG5ldyBSZXNpemVPYnNlcnZlcigoZW50cmllcywgb2JzZXJ2ZXIpID0+IHtcclxuXHRcdFx0dGhpcy5fdXBkYXRlU2Nyb2xsQmFyKCk7XHJcblx0XHR9KTtcclxuXHRcdHRoaXMuX3Jlc2l6ZU9ic2VydmVyLm9ic2VydmUodGhpcy5fZWxlbWVudCk7XHJcblx0fVxyXG5cclxuXHRfdXBkYXRlU2Nyb2xsQmFyICgpIHtcclxuXHRcdGxldCB0b3RhbFdpZHRoID0gdGhpcy5fbW9kZWwuZ2V0VG90YWxXaWR0aCgpO1xyXG5cdFx0bGV0IHRvdGFsSGVpZ2h0ID0gdGhpcy5fbW9kZWwuZ2V0VG90YWxIZWlnaHQoKTtcclxuXHRcdHRoaXMuX2hTY3JvbGxUaHVtYi5zdHlsZS53aWR0aCA9IHRvdGFsV2lkdGggKyAncHgnO1xyXG5cdFx0dGhpcy5fdlNjcm9sbFRodW1iLnN0eWxlLmhlaWdodCA9IHRvdGFsSGVpZ2h0ICsgJ3B4JztcclxuXHJcblx0XHRsZXQgZ3JpZFJlY3QgPSB0aGlzLl9lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG5cdFx0bGV0IHNjcm9sbEJhclN0YXRlID0gdGhpcy5fbW9kZWwuZGV0ZXJtaW5lU2Nyb2xsYmFyU3RhdGUoZ3JpZFJlY3Qud2lkdGgsIGdyaWRSZWN0LmhlaWdodCwgdGhpcy5fc2Nyb2xsV2lkdGgpO1xyXG5cclxuXHRcdHN3aXRjaCAoc2Nyb2xsQmFyU3RhdGUpIHtcclxuXHRcdFx0Y2FzZSAnbic6XHJcblx0XHRcdFx0dGhpcy5faFNjcm9sbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cdFx0XHRcdHRoaXMuX3ZTY3JvbGwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHRcdFx0XHR0aGlzLl9jb250ZW50UGFuZS5zdHlsZS53aWR0aCA9ICcxMDAlJztcclxuXHRcdFx0XHR0aGlzLl9jb250ZW50UGFuZS5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGNhc2UgJ2gnOlxyXG5cdFx0XHRcdHRoaXMuX2hTY3JvbGwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcblx0XHRcdFx0dGhpcy5fdlNjcm9sbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cdFx0XHRcdHRoaXMuX2hTY3JvbGwuc3R5bGUud2lkdGggPSAnMTAwJSc7XHJcblx0XHRcdFx0dGhpcy5fY29udGVudFBhbmUuc3R5bGUud2lkdGggPSAnMTAwJSc7XHJcblx0XHRcdFx0dGhpcy5fY29udGVudFBhbmUuc3R5bGUuaGVpZ2h0ID0gJ2NhbGMoMTAwJSAtICcgKyB0aGlzLl9zY3JvbGxXaWR0aCArICdweCknO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICd2JzpcclxuXHRcdFx0XHR0aGlzLl9oU2Nyb2xsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0XHRcdFx0dGhpcy5fdlNjcm9sbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuXHRcdFx0XHR0aGlzLl92U2Nyb2xsLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcclxuXHRcdFx0XHR0aGlzLl9jb250ZW50UGFuZS5zdHlsZS53aWR0aCA9ICdjYWxjKDEwMCUgLSAnICsgdGhpcy5fc2Nyb2xsV2lkdGggKyAncHgpJztcclxuXHRcdFx0XHR0aGlzLl9jb250ZW50UGFuZS5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGNhc2UgJ2InOlxyXG5cdFx0XHRcdHRoaXMuX2hTY3JvbGwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcblx0XHRcdFx0dGhpcy5fdlNjcm9sbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuXHRcdFx0XHR0aGlzLl9oU2Nyb2xsLnN0eWxlLndpZHRoID0gJ2NhbGMoMTAwJSAtICcgKyB0aGlzLl9zY3JvbGxXaWR0aCArICdweCknO1xyXG5cdFx0XHRcdHRoaXMuX3ZTY3JvbGwuc3R5bGUuaGVpZ2h0ID0gJ2NhbGMoMTAwJSAtICcgKyB0aGlzLl9zY3JvbGxXaWR0aCArICdweCknO1xyXG5cdFx0XHRcdHRoaXMuX2NvbnRlbnRQYW5lLnN0eWxlLndpZHRoID0gJ2NhbGMoMTAwJSAtICcgKyB0aGlzLl9zY3JvbGxXaWR0aCArICdweCknO1xyXG5cdFx0XHRcdHRoaXMuX2NvbnRlbnRQYW5lLnN0eWxlLmhlaWdodCA9ICdjYWxjKDEwMCUgLSAnICsgdGhpcy5fc2Nyb2xsV2lkdGggKyAncHgpJztcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdF9yZW5kZXJDZWxscyAoKSB7XHJcblx0XHRsZXQgdG9wRnJlZXplID0gdGhpcy5fbW9kZWwuZ2V0VG9wRnJlZXplUm93cygpO1xyXG5cdFx0bGV0IGxlZnRGcmVlemUgPSB0aGlzLl9tb2RlbC5nZXRMZWZ0RnJlZXplUm93cygpO1xyXG5cdFx0bGV0IGJvdHRvbUZyZWV6ZSA9IHRoaXMuX21vZGVsLmdldEJvdHRvbUZyZWV6ZVJvd3MoKTtcclxuXHRcdGxldCByb3dDb3VudCA9IHRoaXMuX21vZGVsLmdldFJvd0NvdW50KCk7XHJcblx0XHRsZXQgY29sdW1uQ291bnQgPSB0aGlzLl9tb2RlbC5nZXRDb2x1bW5Db3VudCgpO1xyXG5cdFx0bGV0IHRvcFJ1bm5lciA9IDA7XHJcblx0XHRsZXQgbGVmdFJ1bm5lciA9IDA7XHJcblx0XHRsZXQgY29sV2lkdGggPSBbXTtcclxuXHJcblx0XHQvL1JlbmRlciB0b3Agcm93c1xyXG5cdFx0dG9wUnVubmVyID0gMDtcclxuXHRcdGZvciAobGV0IGo9MDsgajx0b3BGcmVlemU7IGorKykge1xyXG5cdFx0XHRsZXQgcm93SGVpZ2h0ID0gdGhpcy5fbW9kZWwuZ2V0Um93SGVpZ2h0KGopO1xyXG5cdFx0XHQvL1JlbmRlciB0b3AgbGVmdCBjZWxsc1xyXG5cdFx0XHRsZWZ0UnVubmVyID0gMDtcclxuXHRcdFx0Zm9yIChsZXQgaT0wOyBpPGxlZnRGcmVlemU7IGkrKykge1xyXG5cdFx0XHRcdGNvbFdpZHRoW2ldID0gdGhpcy5fbW9kZWwuZ2V0Q29sdW1uV2lkdGgoaSk7XHJcblx0XHRcdFx0dGhpcy5fcmVuZGVyQ2VsbChqLCBpLCB0aGlzLl90b3BMZWZ0SW5uZXIsIGxlZnRSdW5uZXIsIHRvcFJ1bm5lciwgY29sV2lkdGhbaV0sIHJvd0hlaWdodCk7XHJcblx0XHRcdFx0bGVmdFJ1bm5lciArPSBjb2xXaWR0aFtpXTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvL1JlbmRlciB0b3AgY2VsbHNcclxuXHRcdFx0bGVmdFJ1bm5lciA9IDA7XHJcblx0XHRcdGZvciAobGV0IGk9bGVmdEZyZWV6ZTsgaTxjb2x1bW5Db3VudDsgaSsrKSB7XHJcblx0XHRcdFx0Y29sV2lkdGhbaV0gPSB0aGlzLl9tb2RlbC5nZXRDb2x1bW5XaWR0aChpKTtcclxuXHRcdFx0XHR0aGlzLl9yZW5kZXJDZWxsKGosIGksIHRoaXMuX3RvcElubmVyLCBsZWZ0UnVubmVyLCB0b3BSdW5uZXIsIGNvbFdpZHRoW2ldLCByb3dIZWlnaHQpO1xyXG5cdFx0XHRcdGxlZnRSdW5uZXIgKz0gY29sV2lkdGhbaV07XHJcblx0XHRcdH1cclxuXHRcdFx0dG9wUnVubmVyICs9IHJvd0hlaWdodDtcclxuXHRcdH1cclxuXHJcblx0XHQvL1JlbmRlciBtaWRkbGUgcm93c1xyXG5cdFx0dG9wUnVubmVyID0gMDtcclxuXHRcdGZvciAobGV0IGo9dG9wRnJlZXplOyBqPChyb3dDb3VudC1ib3R0b21GcmVlemUpOyBqKyspIHtcclxuXHRcdFx0bGV0IHJvd0hlaWdodCA9IHRoaXMuX21vZGVsLmdldFJvd0hlaWdodChqKTtcclxuXHRcdFx0Ly9SZW5kZXIgbGVmdCBjZWxsc1xyXG5cdFx0XHRsZWZ0UnVubmVyID0gMDtcclxuXHRcdFx0Zm9yIChsZXQgaT0wOyBpPGxlZnRGcmVlemU7IGkrKykge1xyXG5cdFx0XHRcdHRoaXMuX3JlbmRlckNlbGwoaiwgaSwgdGhpcy5fbGVmdElubmVyLCBsZWZ0UnVubmVyLCB0b3BSdW5uZXIsIGNvbFdpZHRoW2ldLCByb3dIZWlnaHQpO1xyXG5cdFx0XHRcdGxlZnRSdW5uZXIgKz0gY29sV2lkdGhbaV07XHJcblx0XHRcdH1cclxuXHRcdFx0Ly9SZW5kZXIgY2VudGVyIGNlbGxzXHJcblx0XHRcdGxlZnRSdW5uZXIgPSAwO1xyXG5cdFx0XHRmb3IgKGxldCBpPWxlZnRGcmVlemU7IGk8Y29sdW1uQ291bnQ7IGkrKykge1xyXG5cdFx0XHRcdHRoaXMuX3JlbmRlckNlbGwoaiwgaSwgdGhpcy5fY2VudGVySW5uZXIsIGxlZnRSdW5uZXIsIHRvcFJ1bm5lciwgY29sV2lkdGhbaV0sIHJvd0hlaWdodCk7XHJcblx0XHRcdFx0bGVmdFJ1bm5lciArPSBjb2xXaWR0aFtpXTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0b3BSdW5uZXIgKz0gcm93SGVpZ2h0O1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vUmVuZGVyIGJvdHRvbSByb3dzXHJcblx0XHR0b3BSdW5uZXIgPSAwO1xyXG5cdFx0Zm9yIChsZXQgaj0ocm93Q291bnQtYm90dG9tRnJlZXplKTsgajxyb3dDb3VudDsgaisrKSB7XHJcblx0XHRcdGxldCByb3dIZWlnaHQgPSB0aGlzLl9tb2RlbC5nZXRSb3dIZWlnaHQoaik7XHJcblx0XHRcdC8vUmVuZGVyIGxlZnQgY2VsbHNcclxuXHRcdFx0bGVmdFJ1bm5lciA9IDA7XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTxsZWZ0RnJlZXplOyBpKyspIHtcclxuXHRcdFx0XHR0aGlzLl9yZW5kZXJDZWxsKGosIGksIHRoaXMuX2JvdHRvbUxlZnRJbm5lciwgbGVmdFJ1bm5lciwgdG9wUnVubmVyLCBjb2xXaWR0aFtpXSwgcm93SGVpZ2h0KTtcclxuXHRcdFx0XHRsZWZ0UnVubmVyICs9IGNvbFdpZHRoW2ldO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vUmVuZGVyIGNlbnRlciBjZWxsc1xyXG5cdFx0XHRsZWZ0UnVubmVyID0gMDtcclxuXHRcdFx0Zm9yIChsZXQgaT1sZWZ0RnJlZXplOyBpPGNvbHVtbkNvdW50OyBpKyspIHtcclxuXHRcdFx0XHR0aGlzLl9yZW5kZXJDZWxsKGosIGksIHRoaXMuX2JvdHRvbUlubmVyLCBsZWZ0UnVubmVyLCB0b3BSdW5uZXIsIGNvbFdpZHRoW2ldLCByb3dIZWlnaHQpO1xyXG5cdFx0XHRcdGxlZnRSdW5uZXIgKz0gY29sV2lkdGhbaV07XHJcblx0XHRcdH1cclxuXHRcdFx0dG9wUnVubmVyICs9IHJvd0hlaWdodDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdF9yZW5kZXJDZWxsIChyb3dJbmRleCwgY29sSW5kZXgsIHBhbmUsIHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcclxuXHRcdGxldCBkYXRhID0gdGhpcy5fbW9kZWwuZ2V0RGF0YUF0KHJvd0luZGV4LCBjb2xJbmRleCk7XHJcblxyXG5cdFx0Ly9EYXRhIGNhbiBiZSB0cmFuc2Zvcm1lZCBiZWZvcmUgcmVuZGVyaW5nIHVzaW5nIGRhdGFCZWZvcmVSZW5kZXIgZXh0ZW5zaW9uXHJcblx0XHRsZXQgYXJnID0ge2RhdGE6IGRhdGF9O1xyXG5cdFx0dGhpcy5fZXh0ZW5zaW9ucy5leGVjdXRlRXh0ZW5zaW9uKCdkYXRhQmVmb3JlUmVuZGVyJywgYXJnKTtcclxuXHRcdGRhdGEgPSBhcmcuZGF0YTtcclxuXHJcblx0XHRsZXQgY2VsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cdFx0bGV0IGNlbGxDbGFzc2VzID0gdGhpcy5fbW9kZWwuZ2V0Q2VsbENsYXNzZXMocm93SW5kZXgsIGNvbEluZGV4KTtcclxuXHRcdGNlbGwuY2xhc3NOYW1lID0gJ3BncmlkLWNlbGwgJyArIGNlbGxDbGFzc2VzLmpvaW4oJyAnKTtcclxuXHRcdGNlbGwuc3R5bGUubGVmdCA9IHggKyAncHgnO1xyXG5cdFx0Y2VsbC5zdHlsZS50b3AgPSB5ICsgJ3B4JztcclxuXHRcdGNlbGwuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XHJcblx0XHRjZWxsLnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XHJcblx0XHRjZWxsLmRhdGFzZXQucm93SW5kZXggPSByb3dJbmRleDtcclxuXHRcdGNlbGwuZGF0YXNldC5jb2xJbmRleCA9IGNvbEluZGV4O1xyXG5cclxuXHRcdGxldCBjZWxsQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cdFx0Y2VsbENvbnRlbnQuY2xhc3NOYW1lID0gJ3BncmlkLWNlbGwtY29udGVudCc7XHJcblx0XHRjZWxsLmFwcGVuZENoaWxkKGNlbGxDb250ZW50KTtcclxuXHRcdHBhbmUuYXBwZW5kQ2hpbGQoY2VsbCk7XHJcblxyXG5cdFx0bGV0IGV2ZW50QXJnID0ge1xyXG5cdFx0XHRjZWxsLFxyXG5cdFx0XHRjZWxsQ29udGVudCxcclxuXHRcdFx0cm93SW5kZXgsXHJcblx0XHRcdGNvbEluZGV4LFxyXG5cdFx0XHRkYXRhLFxyXG5cdFx0XHRyb3dJZDogdGhpcy5fbW9kZWwuZ2V0Um93SWQocm93SW5kZXgpLFxyXG5cdFx0XHRmaWVsZDogdGhpcy5fbW9kZWwuZ2V0Q29sdW1uRmllbGQoY29sSW5kZXgpLFxyXG5cdFx0XHRoYW5kbGVkOiBmYWxzZVxyXG5cdFx0fTtcclxuXHJcblx0XHQvL0lmIHRoZXJlJ3MgY2VsbFJlbmRlciBleHRlbnNpb24sIHVzZSBjZWxsUmVuZGVyIGV4dGVuc2lvbiB0byByZW5kZXIgdGhlIGNlbGxcclxuXHRcdC8vRWxzZSBqdXN0IHNldCB0aGUgZGF0YSB0byB0aGUgY2VsbENvbnRlbnQgZGlyZWN0bHlcclxuXHRcdGxldCBoYW5kbGVkQnlFeHQgPSBmYWxzZTtcclxuXHRcdGlmICh0aGlzLl9leHRlbnNpb25zLmhhc0V4dGVuc2lvbignY2VsbFJlbmRlcicpKSB7XHJcblx0XHRcdHRoaXMuX2V4dGVuc2lvbnMuZXhlY3V0ZUV4dGVuc2lvbignY2VsbFJlbmRlcicsIGV2ZW50QXJnKTtcclxuXHRcdFx0aGFuZGxlZEJ5RXh0ID0gZXZlbnRBcmcuaGFuZGxlZDtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIWhhbmRsZWRCeUV4dCkge1xyXG5cdFx0XHRpZiAoZGF0YSAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0Y2VsbENvbnRlbnQuaW5uZXJIVE1MID0gZGF0YTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX2V4dGVuc2lvbnMuZXhlY3V0ZUV4dGVuc2lvbignY2VsbEFmdGVyUmVuZGVyJywgZXZlbnRBcmcpO1xyXG5cdFx0dGhpcy5fZXh0ZW5zaW9ucy5leGVjdXRlRXh0ZW5zaW9uKCdjZWxsQWZ0ZXJVcGRhdGUnLCBldmVudEFyZyk7XHJcblxyXG5cdFx0ZXZlbnRBcmcgPSBudWxsO1xyXG5cdH1cclxuXHJcblx0X21lYXN1cmVTY3JvbGxiYXJXaWR0aCAoKSB7XHJcblx0XHR2YXIgaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcblx0XHRpbm5lci5zdHlsZS53aWR0aCA9ICcxMDAlJztcclxuXHRcdGlubmVyLnN0eWxlLmhlaWdodCA9ICcyMDBweCc7XHJcblx0XHR2YXIgb3V0bW9zdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cdFx0b3V0bW9zdC5jbGFzc05hbWUgPSAncGdyaWQnO1xyXG5cdFx0dmFyIG91dGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRvdXRlci5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcblx0XHRvdXRlci5zdHlsZS50b3AgPSAnMHB4JztcclxuXHRcdG91dGVyLnN0eWxlLmxlZnQgPSAnMHB4JztcclxuXHRcdG91dGVyLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcclxuXHRcdG91dGVyLnN0eWxlLndpZHRoID0gJzIwMHB4JztcclxuXHRcdG91dGVyLnN0eWxlLmhlaWdodCA9ICcxNTBweCc7XHJcblx0XHRvdXRlci5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xyXG5cdFx0b3V0ZXIuYXBwZW5kQ2hpbGQoaW5uZXIpO1xyXG5cdFx0b3V0bW9zdC5hcHBlbmRDaGlsZChvdXRlcik7XHJcblx0XHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG91dG1vc3QpO1xyXG5cdFx0dmFyIHcxID0gaW5uZXIub2Zmc2V0V2lkdGg7XHJcblx0XHRvdXRlci5zdHlsZS5vdmVyZmxvdyA9ICdzY3JvbGwnO1xyXG5cdFx0dmFyIHcyID0gaW5uZXIub2Zmc2V0V2lkdGg7XHJcblx0XHRpZiAodzEgPT0gdzIpIHcyID0gb3V0ZXIuY2xpZW50V2lkdGg7XHJcblx0XHRkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkIChvdXRtb3N0KTtcclxuXHRcdHJldHVybiAodzEgLSB3MikgKyAodGhpcy5fZGV0ZWN0SUUoKT8xOjApO1xyXG5cdH1cclxuXHJcblxyXG5cdF9kZXRlY3RJRSAoKSB7XHJcblx0ICB2YXIgdWEgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudDtcclxuXHQgIHZhciBtc2llID0gdWEuaW5kZXhPZignTVNJRSAnKTtcclxuXHQgIGlmIChtc2llID4gMCkge1xyXG5cdCAgICAvLyBJRSAxMCBvciBvbGRlciA9PiByZXR1cm4gdmVyc2lvbiBudW1iZXJcclxuXHQgICAgcmV0dXJuIHBhcnNlSW50KHVhLnN1YnN0cmluZyhtc2llICsgNSwgdWEuaW5kZXhPZignLicsIG1zaWUpKSwgMTApO1xyXG5cdCAgfVxyXG5cclxuXHQgIHZhciB0cmlkZW50ID0gdWEuaW5kZXhPZignVHJpZGVudC8nKTtcclxuXHQgIGlmICh0cmlkZW50ID4gMCkge1xyXG5cdCAgICAvLyBJRSAxMSA9PiByZXR1cm4gdmVyc2lvbiBudW1iZXJcclxuXHQgICAgdmFyIHJ2ID0gdWEuaW5kZXhPZigncnY6Jyk7XHJcblx0ICAgIHJldHVybiBwYXJzZUludCh1YS5zdWJzdHJpbmcocnYgKyAzLCB1YS5pbmRleE9mKCcuJywgcnYpKSwgMTApO1xyXG5cdCAgfVxyXG5cclxuXHQgIHZhciBlZGdlID0gdWEuaW5kZXhPZignRWRnZS8nKTtcclxuXHQgIGlmIChlZGdlID4gMCkge1xyXG5cdCAgICAvLyBFZGdlIChJRSAxMispID0+IHJldHVybiB2ZXJzaW9uIG51bWJlclxyXG5cdCAgICByZXR1cm4gcGFyc2VJbnQodWEuc3Vic3RyaW5nKGVkZ2UgKyA1LCB1YS5pbmRleE9mKCcuJywgZWRnZSkpLCAxMCk7XHJcblx0ICB9XHJcblx0ICAvLyBvdGhlciBicm93c2VyXHJcblx0ICByZXR1cm4gZmFsc2U7XHJcblx0fVxyXG59IiwiaW1wb3J0IHsgUEdyaWQgfSBmcm9tICcuL2dyaWQvZ3JpZCc7XHJcblxyXG53aW5kb3cuUEdyaWQgPSBQR3JpZDtcclxuXHJcbi8vIFBvbHlmaWxsIC0gRWxlbWVudC5zY3JvbGxJbnRvVmlld0lmTmVlZGVkXHJcblxyXG5pZiAoIUVsZW1lbnQucHJvdG90eXBlLnNjcm9sbEludG9WaWV3SWZOZWVkZWQpIHtcclxuICAgIEVsZW1lbnQucHJvdG90eXBlLnNjcm9sbEludG9WaWV3SWZOZWVkZWQgPSBmdW5jdGlvbiAoY2VudGVySWZOZWVkZWQpIHtcclxuICAgICAgICBjZW50ZXJJZk5lZWRlZCA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDAgPyB0cnVlIDogISFjZW50ZXJJZk5lZWRlZDtcclxuXHJcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50Tm9kZSxcclxuICAgICAgICAgICAgcGFyZW50Q29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHBhcmVudCwgbnVsbCksXHJcbiAgICAgICAgICAgIHBhcmVudEJvcmRlclRvcFdpZHRoID0gcGFyc2VJbnQocGFyZW50Q29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdib3JkZXItdG9wLXdpZHRoJykpLFxyXG4gICAgICAgICAgICBwYXJlbnRCb3JkZXJMZWZ0V2lkdGggPSBwYXJzZUludChwYXJlbnRDb21wdXRlZFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2JvcmRlci1sZWZ0LXdpZHRoJykpLFxyXG4gICAgICAgICAgICBvdmVyVG9wID0gdGhpcy5vZmZzZXRUb3AgLSBwYXJlbnQub2Zmc2V0VG9wIDwgcGFyZW50LnNjcm9sbFRvcCxcclxuICAgICAgICAgICAgb3ZlckJvdHRvbSA9ICh0aGlzLm9mZnNldFRvcCAtIHBhcmVudC5vZmZzZXRUb3AgKyB0aGlzLmNsaWVudEhlaWdodCAtIHBhcmVudEJvcmRlclRvcFdpZHRoKSA+IChwYXJlbnQuc2Nyb2xsVG9wICsgcGFyZW50LmNsaWVudEhlaWdodCksXHJcbiAgICAgICAgICAgIG92ZXJMZWZ0ID0gdGhpcy5vZmZzZXRMZWZ0IC0gcGFyZW50Lm9mZnNldExlZnQgPCBwYXJlbnQuc2Nyb2xsTGVmdCxcclxuICAgICAgICAgICAgb3ZlclJpZ2h0ID0gKHRoaXMub2Zmc2V0TGVmdCAtIHBhcmVudC5vZmZzZXRMZWZ0ICsgdGhpcy5jbGllbnRXaWR0aCAtIHBhcmVudEJvcmRlckxlZnRXaWR0aCkgPiAocGFyZW50LnNjcm9sbExlZnQgKyBwYXJlbnQuY2xpZW50V2lkdGgpLFxyXG4gICAgICAgICAgICBhbGlnbldpdGhUb3AgPSBvdmVyVG9wICYmICFvdmVyQm90dG9tO1xyXG5cclxuICAgICAgICBpZiAoKG92ZXJUb3AgfHwgb3ZlckJvdHRvbSkgJiYgY2VudGVySWZOZWVkZWQpIHtcclxuICAgICAgICAgICAgcGFyZW50LnNjcm9sbFRvcCA9IHRoaXMub2Zmc2V0VG9wIC0gcGFyZW50Lm9mZnNldFRvcCAtIHBhcmVudC5jbGllbnRIZWlnaHQgLyAyIC0gcGFyZW50Qm9yZGVyVG9wV2lkdGggKyB0aGlzLmNsaWVudEhlaWdodCAvIDI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoKG92ZXJMZWZ0IHx8IG92ZXJSaWdodCkgJiYgY2VudGVySWZOZWVkZWQpIHtcclxuICAgICAgICAgICAgcGFyZW50LnNjcm9sbExlZnQgPSB0aGlzLm9mZnNldExlZnQgLSBwYXJlbnQub2Zmc2V0TGVmdCAtIHBhcmVudC5jbGllbnRXaWR0aCAvIDIgLSBwYXJlbnRCb3JkZXJMZWZ0V2lkdGggKyB0aGlzLmNsaWVudFdpZHRoIC8gMjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICgob3ZlclRvcCB8fCBvdmVyQm90dG9tIHx8IG92ZXJMZWZ0IHx8IG92ZXJSaWdodCkgJiYgIWNlbnRlcklmTmVlZGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsSW50b1ZpZXcoYWxpZ25XaXRoVG9wKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59Il19

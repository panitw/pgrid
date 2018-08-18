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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcmVzaXplLW9ic2VydmVyLXBvbHlmaWxsL2Rpc3QvUmVzaXplT2JzZXJ2ZXIuanMiLCJzcmNcXGRhdGFcXHRhYmxlLmpzIiwic3JjXFxleHRlbnNpb25zXFxjb3B5cGFzdGUuanMiLCJzcmNcXGV4dGVuc2lvbnNcXGVkaXRvci5qcyIsInNyY1xcZXh0ZW5zaW9uc1xcc2VsZWN0aW9uLmpzIiwic3JjXFxleHRlbnNpb25zXFx2aWV3LXVwZGF0ZXIuanMiLCJzcmNcXGdyaWRcXGV2ZW50LmpzIiwic3JjXFxncmlkXFxleHRlbnNpb24uanMiLCJzcmNcXGdyaWRcXGdyaWQuanMiLCJzcmNcXGdyaWRcXG1vZGVsLmpzIiwic3JjXFxncmlkXFxzdGF0ZS5qcyIsInNyY1xcZ3JpZFxcdXRpbHMuanMiLCJzcmNcXGdyaWRcXHZpZXcuanMiLCJzcmNcXG1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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LFlBQUksQ0FBQyxXQUFXLFVBQVosS0FBMkIsY0FBL0IsRUFBK0M7QUFDM0MsbUJBQU8sU0FBUCxHQUFtQixLQUFLLFNBQUwsR0FBaUIsT0FBTyxTQUF4QixHQUFvQyxPQUFPLFlBQVAsR0FBc0IsQ0FBMUQsR0FBOEQsb0JBQTlELEdBQXFGLEtBQUssWUFBTCxHQUFvQixDQUE1SDtBQUNIOztBQUVELFlBQUksQ0FBQyxZQUFZLFNBQWIsS0FBMkIsY0FBL0IsRUFBK0M7QUFDM0MsbUJBQU8sVUFBUCxHQUFvQixLQUFLLFVBQUwsR0FBa0IsT0FBTyxVQUF6QixHQUFzQyxPQUFPLFdBQVAsR0FBcUIsQ0FBM0QsR0FBK0QscUJBQS9ELEdBQXVGLEtBQUssV0FBTCxHQUFtQixDQUE5SDtBQUNIOztBQUVELFlBQUksQ0FBQyxXQUFXLFVBQVgsSUFBeUIsUUFBekIsSUFBcUMsU0FBdEMsS0FBb0QsQ0FBQyxjQUF6RCxFQUF5RTtBQUNyRSxpQkFBSyxjQUFMLENBQW9CLFlBQXBCO0FBQ0g7QUFDSixLQXhCRDtBQXlCSCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuXHR0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKSA6XG5cdHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShmYWN0b3J5KSA6XG5cdChnbG9iYWwuUmVzaXplT2JzZXJ2ZXIgPSBmYWN0b3J5KCkpO1xufSh0aGlzLCAoZnVuY3Rpb24gKCkgeyAndXNlIHN0cmljdCc7XG5cbi8qKlxyXG4gKiBBIGNvbGxlY3Rpb24gb2Ygc2hpbXMgdGhhdCBwcm92aWRlIG1pbmltYWwgZnVuY3Rpb25hbGl0eSBvZiB0aGUgRVM2IGNvbGxlY3Rpb25zLlxyXG4gKlxyXG4gKiBUaGVzZSBpbXBsZW1lbnRhdGlvbnMgYXJlIG5vdCBtZWFudCB0byBiZSB1c2VkIG91dHNpZGUgb2YgdGhlIFJlc2l6ZU9ic2VydmVyXHJcbiAqIG1vZHVsZXMgYXMgdGhleSBjb3ZlciBvbmx5IGEgbGltaXRlZCByYW5nZSBvZiB1c2UgY2FzZXMuXHJcbiAqL1xuLyogZXNsaW50LWRpc2FibGUgcmVxdWlyZS1qc2RvYywgdmFsaWQtanNkb2MgKi9cbnZhciBNYXBTaGltID0gKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIE1hcCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIE1hcDtcbiAgICB9XG5cbiAgICAvKipcclxuICAgICAqIFJldHVybnMgaW5kZXggaW4gcHJvdmlkZWQgYXJyYXkgdGhhdCBtYXRjaGVzIHRoZSBzcGVjaWZpZWQga2V5LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7QXJyYXk8QXJyYXk+fSBhcnJcclxuICAgICAqIEBwYXJhbSB7Kn0ga2V5XHJcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0SW5kZXgoYXJyLCBrZXkpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IC0xO1xuXG4gICAgICAgIGFyci5zb21lKGZ1bmN0aW9uIChlbnRyeSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChlbnRyeVswXSA9PT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gaW5kZXg7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHJldHVybiAoZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBhbm9ueW1vdXMoKSB7XG4gICAgICAgICAgICB0aGlzLl9fZW50cmllc19fID0gW107XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcHJvdG90eXBlQWNjZXNzb3JzID0geyBzaXplOiB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH07XG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgICAgICovXG4gICAgICAgIHByb3RvdHlwZUFjY2Vzc29ycy5zaXplLmdldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9fZW50cmllc19fLmxlbmd0aDtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0geyp9IGtleVxyXG4gICAgICAgICAqIEByZXR1cm5zIHsqfVxyXG4gICAgICAgICAqL1xuICAgICAgICBhbm9ueW1vdXMucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGdldEluZGV4KHRoaXMuX19lbnRyaWVzX18sIGtleSk7XG4gICAgICAgICAgICB2YXIgZW50cnkgPSB0aGlzLl9fZW50cmllc19fW2luZGV4XTtcblxuICAgICAgICAgICAgcmV0dXJuIGVudHJ5ICYmIGVudHJ5WzFdO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7Kn0ga2V5XHJcbiAgICAgICAgICogQHBhcmFtIHsqfSB2YWx1ZVxyXG4gICAgICAgICAqIEByZXR1cm5zIHt2b2lkfVxyXG4gICAgICAgICAqL1xuICAgICAgICBhbm9ueW1vdXMucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBnZXRJbmRleCh0aGlzLl9fZW50cmllc19fLCBrZXkpO1xuXG4gICAgICAgICAgICBpZiAofmluZGV4KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fX2VudHJpZXNfX1tpbmRleF1bMV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fX2VudHJpZXNfXy5wdXNoKFtrZXksIHZhbHVlXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHsqfSBrZXlcclxuICAgICAgICAgKiBAcmV0dXJucyB7dm9pZH1cclxuICAgICAgICAgKi9cbiAgICAgICAgYW5vbnltb3VzLnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICB2YXIgZW50cmllcyA9IHRoaXMuX19lbnRyaWVzX187XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBnZXRJbmRleChlbnRyaWVzLCBrZXkpO1xuXG4gICAgICAgICAgICBpZiAofmluZGV4KSB7XG4gICAgICAgICAgICAgICAgZW50cmllcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7Kn0ga2V5XHJcbiAgICAgICAgICogQHJldHVybnMge3ZvaWR9XHJcbiAgICAgICAgICovXG4gICAgICAgIGFub255bW91cy5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuICEhfmdldEluZGV4KHRoaXMuX19lbnRyaWVzX18sIGtleSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHJldHVybnMge3ZvaWR9XHJcbiAgICAgICAgICovXG4gICAgICAgIGFub255bW91cy5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLl9fZW50cmllc19fLnNwbGljZSgwKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xyXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gW2N0eD1udWxsXVxyXG4gICAgICAgICAqIEByZXR1cm5zIHt2b2lkfVxyXG4gICAgICAgICAqL1xuICAgICAgICBhbm9ueW1vdXMucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiAoY2FsbGJhY2ssIGN0eCkge1xuICAgICAgICAgICAgdmFyIHRoaXMkMSA9IHRoaXM7XG4gICAgICAgICAgICBpZiAoIGN0eCA9PT0gdm9pZCAwICkgY3R4ID0gbnVsbDtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxpc3QgPSB0aGlzJDEuX19lbnRyaWVzX187IGkgPCBsaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVudHJ5ID0gbGlzdFtpXTtcblxuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoY3R4LCBlbnRyeVsxXSwgZW50cnlbMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKCBhbm9ueW1vdXMucHJvdG90eXBlLCBwcm90b3R5cGVBY2Nlc3NvcnMgKTtcblxuICAgICAgICByZXR1cm4gYW5vbnltb3VzO1xuICAgIH0oKSk7XG59KSgpO1xuXG4vKipcclxuICogRGV0ZWN0cyB3aGV0aGVyIHdpbmRvdyBhbmQgZG9jdW1lbnQgb2JqZWN0cyBhcmUgYXZhaWxhYmxlIGluIGN1cnJlbnQgZW52aXJvbm1lbnQuXHJcbiAqL1xudmFyIGlzQnJvd3NlciA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmRvY3VtZW50ID09PSBkb2N1bWVudDtcblxuLy8gUmV0dXJucyBnbG9iYWwgb2JqZWN0IG9mIGEgY3VycmVudCBlbnZpcm9ubWVudC5cbnZhciBnbG9iYWwkMSA9IChmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnICYmIGdsb2JhbC5NYXRoID09PSBNYXRoKSB7XG4gICAgICAgIHJldHVybiBnbG9iYWw7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJyAmJiBzZWxmLk1hdGggPT09IE1hdGgpIHtcbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5NYXRoID09PSBNYXRoKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3c7XG4gICAgfVxuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW5ldy1mdW5jXG4gICAgcmV0dXJuIEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG59KSgpO1xuXG4vKipcclxuICogQSBzaGltIGZvciB0aGUgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHdoaWNoIGZhbGxzIGJhY2sgdG8gdGhlIHNldFRpbWVvdXQgaWZcclxuICogZmlyc3Qgb25lIGlzIG5vdCBzdXBwb3J0ZWQuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJlcXVlc3RzJyBpZGVudGlmaWVyLlxyXG4gKi9cbnZhciByZXF1ZXN0QW5pbWF0aW9uRnJhbWUkMSA9IChmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHR5cGVvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gSXQncyByZXF1aXJlZCB0byB1c2UgYSBib3VuZGVkIGZ1bmN0aW9uIGJlY2F1c2UgSUUgc29tZXRpbWVzIHRocm93c1xuICAgICAgICAvLyBhbiBcIkludmFsaWQgY2FsbGluZyBvYmplY3RcIiBlcnJvciBpZiByQUYgaXMgaW52b2tlZCB3aXRob3V0IHRoZSBnbG9iYWxcbiAgICAgICAgLy8gb2JqZWN0IG9uIHRoZSBsZWZ0IGhhbmQgc2lkZS5cbiAgICAgICAgcmV0dXJuIHJlcXVlc3RBbmltYXRpb25GcmFtZS5iaW5kKGdsb2JhbCQxKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKGNhbGxiYWNrKSB7IHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgcmV0dXJuIGNhbGxiYWNrKERhdGUubm93KCkpOyB9LCAxMDAwIC8gNjApOyB9O1xufSkoKTtcblxuLy8gRGVmaW5lcyBtaW5pbXVtIHRpbWVvdXQgYmVmb3JlIGFkZGluZyBhIHRyYWlsaW5nIGNhbGwuXG52YXIgdHJhaWxpbmdUaW1lb3V0ID0gMjtcblxuLyoqXHJcbiAqIENyZWF0ZXMgYSB3cmFwcGVyIGZ1bmN0aW9uIHdoaWNoIGVuc3VyZXMgdGhhdCBwcm92aWRlZCBjYWxsYmFjayB3aWxsIGJlXHJcbiAqIGludm9rZWQgb25seSBvbmNlIGR1cmluZyB0aGUgc3BlY2lmaWVkIGRlbGF5IHBlcmlvZC5cclxuICpcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byBiZSBpbnZva2VkIGFmdGVyIHRoZSBkZWxheSBwZXJpb2QuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBkZWxheSAtIERlbGF5IGFmdGVyIHdoaWNoIHRvIGludm9rZSBjYWxsYmFjay5cclxuICogQHJldHVybnMge0Z1bmN0aW9ufVxyXG4gKi9cbnZhciB0aHJvdHRsZSA9IGZ1bmN0aW9uIChjYWxsYmFjaywgZGVsYXkpIHtcbiAgICB2YXIgbGVhZGluZ0NhbGwgPSBmYWxzZSxcbiAgICAgICAgdHJhaWxpbmdDYWxsID0gZmFsc2UsXG4gICAgICAgIGxhc3RDYWxsVGltZSA9IDA7XG5cbiAgICAvKipcclxuICAgICAqIEludm9rZXMgdGhlIG9yaWdpbmFsIGNhbGxiYWNrIGZ1bmN0aW9uIGFuZCBzY2hlZHVsZXMgbmV3IGludm9jYXRpb24gaWZcclxuICAgICAqIHRoZSBcInByb3h5XCIgd2FzIGNhbGxlZCBkdXJpbmcgY3VycmVudCByZXF1ZXN0LlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHt2b2lkfVxyXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVzb2x2ZVBlbmRpbmcoKSB7XG4gICAgICAgIGlmIChsZWFkaW5nQ2FsbCkge1xuICAgICAgICAgICAgbGVhZGluZ0NhbGwgPSBmYWxzZTtcblxuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0cmFpbGluZ0NhbGwpIHtcbiAgICAgICAgICAgIHByb3h5KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcclxuICAgICAqIENhbGxiYWNrIGludm9rZWQgYWZ0ZXIgdGhlIHNwZWNpZmllZCBkZWxheS4gSXQgd2lsbCBmdXJ0aGVyIHBvc3Rwb25lXHJcbiAgICAgKiBpbnZvY2F0aW9uIG9mIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBkZWxlZ2F0aW5nIGl0IHRvIHRoZVxyXG4gICAgICogcmVxdWVzdEFuaW1hdGlvbkZyYW1lLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHt2b2lkfVxyXG4gICAgICovXG4gICAgZnVuY3Rpb24gdGltZW91dENhbGxiYWNrKCkge1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUkMShyZXNvbHZlUGVuZGluZyk7XG4gICAgfVxuXG4gICAgLyoqXHJcbiAgICAgKiBTY2hlZHVsZXMgaW52b2NhdGlvbiBvZiB0aGUgb3JpZ2luYWwgZnVuY3Rpb24uXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge3ZvaWR9XHJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBwcm94eSgpIHtcbiAgICAgICAgdmFyIHRpbWVTdGFtcCA9IERhdGUubm93KCk7XG5cbiAgICAgICAgaWYgKGxlYWRpbmdDYWxsKSB7XG4gICAgICAgICAgICAvLyBSZWplY3QgaW1tZWRpYXRlbHkgZm9sbG93aW5nIGNhbGxzLlxuICAgICAgICAgICAgaWYgKHRpbWVTdGFtcCAtIGxhc3RDYWxsVGltZSA8IHRyYWlsaW5nVGltZW91dCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU2NoZWR1bGUgbmV3IGNhbGwgdG8gYmUgaW4gaW52b2tlZCB3aGVuIHRoZSBwZW5kaW5nIG9uZSBpcyByZXNvbHZlZC5cbiAgICAgICAgICAgIC8vIFRoaXMgaXMgaW1wb3J0YW50IGZvciBcInRyYW5zaXRpb25zXCIgd2hpY2ggbmV2ZXIgYWN0dWFsbHkgc3RhcnRcbiAgICAgICAgICAgIC8vIGltbWVkaWF0ZWx5IHNvIHRoZXJlIGlzIGEgY2hhbmNlIHRoYXQgd2UgbWlnaHQgbWlzcyBvbmUgaWYgY2hhbmdlXG4gICAgICAgICAgICAvLyBoYXBwZW5zIGFtaWRzIHRoZSBwZW5kaW5nIGludm9jYXRpb24uXG4gICAgICAgICAgICB0cmFpbGluZ0NhbGwgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGVhZGluZ0NhbGwgPSB0cnVlO1xuICAgICAgICAgICAgdHJhaWxpbmdDYWxsID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHNldFRpbWVvdXQodGltZW91dENhbGxiYWNrLCBkZWxheSk7XG4gICAgICAgIH1cblxuICAgICAgICBsYXN0Q2FsbFRpbWUgPSB0aW1lU3RhbXA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3h5O1xufTtcblxuLy8gTWluaW11bSBkZWxheSBiZWZvcmUgaW52b2tpbmcgdGhlIHVwZGF0ZSBvZiBvYnNlcnZlcnMuXG52YXIgUkVGUkVTSF9ERUxBWSA9IDIwO1xuXG4vLyBBIGxpc3Qgb2Ygc3Vic3RyaW5ncyBvZiBDU1MgcHJvcGVydGllcyB1c2VkIHRvIGZpbmQgdHJhbnNpdGlvbiBldmVudHMgdGhhdFxuLy8gbWlnaHQgYWZmZWN0IGRpbWVuc2lvbnMgb2Ygb2JzZXJ2ZWQgZWxlbWVudHMuXG52YXIgdHJhbnNpdGlvbktleXMgPSBbJ3RvcCcsICdyaWdodCcsICdib3R0b20nLCAnbGVmdCcsICd3aWR0aCcsICdoZWlnaHQnLCAnc2l6ZScsICd3ZWlnaHQnXTtcblxuLy8gQ2hlY2sgaWYgTXV0YXRpb25PYnNlcnZlciBpcyBhdmFpbGFibGUuXG52YXIgbXV0YXRpb25PYnNlcnZlclN1cHBvcnRlZCA9IHR5cGVvZiBNdXRhdGlvbk9ic2VydmVyICE9PSAndW5kZWZpbmVkJztcblxuLyoqXHJcbiAqIFNpbmdsZXRvbiBjb250cm9sbGVyIGNsYXNzIHdoaWNoIGhhbmRsZXMgdXBkYXRlcyBvZiBSZXNpemVPYnNlcnZlciBpbnN0YW5jZXMuXHJcbiAqL1xudmFyIFJlc2l6ZU9ic2VydmVyQ29udHJvbGxlciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY29ubmVjdGVkXyA9IGZhbHNlO1xuICAgIHRoaXMubXV0YXRpb25FdmVudHNBZGRlZF8gPSBmYWxzZTtcbiAgICB0aGlzLm11dGF0aW9uc09ic2VydmVyXyA9IG51bGw7XG4gICAgdGhpcy5vYnNlcnZlcnNfID0gW107XG5cbiAgICB0aGlzLm9uVHJhbnNpdGlvbkVuZF8gPSB0aGlzLm9uVHJhbnNpdGlvbkVuZF8uYmluZCh0aGlzKTtcbiAgICB0aGlzLnJlZnJlc2ggPSB0aHJvdHRsZSh0aGlzLnJlZnJlc2guYmluZCh0aGlzKSwgUkVGUkVTSF9ERUxBWSk7XG59O1xuXG4vKipcclxuICogQWRkcyBvYnNlcnZlciB0byBvYnNlcnZlcnMgbGlzdC5cclxuICpcclxuICogQHBhcmFtIHtSZXNpemVPYnNlcnZlclNQSX0gb2JzZXJ2ZXIgLSBPYnNlcnZlciB0byBiZSBhZGRlZC5cclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuXG5cbi8qKlxyXG4gKiBIb2xkcyByZWZlcmVuY2UgdG8gdGhlIGNvbnRyb2xsZXIncyBpbnN0YW5jZS5cclxuICpcclxuICogQHByaXZhdGUge1Jlc2l6ZU9ic2VydmVyQ29udHJvbGxlcn1cclxuICovXG5cblxuLyoqXHJcbiAqIEtlZXBzIHJlZmVyZW5jZSB0byB0aGUgaW5zdGFuY2Ugb2YgTXV0YXRpb25PYnNlcnZlci5cclxuICpcclxuICogQHByaXZhdGUge011dGF0aW9uT2JzZXJ2ZXJ9XHJcbiAqL1xuXG4vKipcclxuICogSW5kaWNhdGVzIHdoZXRoZXIgRE9NIGxpc3RlbmVycyBoYXZlIGJlZW4gYWRkZWQuXHJcbiAqXHJcbiAqIEBwcml2YXRlIHtib29sZWFufVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5wcm90b3R5cGUuYWRkT2JzZXJ2ZXIgPSBmdW5jdGlvbiAob2JzZXJ2ZXIpIHtcbiAgICBpZiAoIX50aGlzLm9ic2VydmVyc18uaW5kZXhPZihvYnNlcnZlcikpIHtcbiAgICAgICAgdGhpcy5vYnNlcnZlcnNfLnB1c2gob2JzZXJ2ZXIpO1xuICAgIH1cblxuICAgIC8vIEFkZCBsaXN0ZW5lcnMgaWYgdGhleSBoYXZlbid0IGJlZW4gYWRkZWQgeWV0LlxuICAgIGlmICghdGhpcy5jb25uZWN0ZWRfKSB7XG4gICAgICAgIHRoaXMuY29ubmVjdF8oKTtcbiAgICB9XG59O1xuXG4vKipcclxuICogUmVtb3ZlcyBvYnNlcnZlciBmcm9tIG9ic2VydmVycyBsaXN0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge1Jlc2l6ZU9ic2VydmVyU1BJfSBvYnNlcnZlciAtIE9ic2VydmVyIHRvIGJlIHJlbW92ZWQuXHJcbiAqIEByZXR1cm5zIHt2b2lkfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5wcm90b3R5cGUucmVtb3ZlT2JzZXJ2ZXIgPSBmdW5jdGlvbiAob2JzZXJ2ZXIpIHtcbiAgICB2YXIgb2JzZXJ2ZXJzID0gdGhpcy5vYnNlcnZlcnNfO1xuICAgIHZhciBpbmRleCA9IG9ic2VydmVycy5pbmRleE9mKG9ic2VydmVyKTtcblxuICAgIC8vIFJlbW92ZSBvYnNlcnZlciBpZiBpdCdzIHByZXNlbnQgaW4gcmVnaXN0cnkuXG4gICAgaWYgKH5pbmRleCkge1xuICAgICAgICBvYnNlcnZlcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgbGlzdGVuZXJzIGlmIGNvbnRyb2xsZXIgaGFzIG5vIGNvbm5lY3RlZCBvYnNlcnZlcnMuXG4gICAgaWYgKCFvYnNlcnZlcnMubGVuZ3RoICYmIHRoaXMuY29ubmVjdGVkXykge1xuICAgICAgICB0aGlzLmRpc2Nvbm5lY3RfKCk7XG4gICAgfVxufTtcblxuLyoqXHJcbiAqIEludm9rZXMgdGhlIHVwZGF0ZSBvZiBvYnNlcnZlcnMuIEl0IHdpbGwgY29udGludWUgcnVubmluZyB1cGRhdGVzIGluc29mYXJcclxuICogaXQgZGV0ZWN0cyBjaGFuZ2VzLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7dm9pZH1cclxuICovXG5SZXNpemVPYnNlcnZlckNvbnRyb2xsZXIucHJvdG90eXBlLnJlZnJlc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNoYW5nZXNEZXRlY3RlZCA9IHRoaXMudXBkYXRlT2JzZXJ2ZXJzXygpO1xuXG4gICAgLy8gQ29udGludWUgcnVubmluZyB1cGRhdGVzIGlmIGNoYW5nZXMgaGF2ZSBiZWVuIGRldGVjdGVkIGFzIHRoZXJlIG1pZ2h0XG4gICAgLy8gYmUgZnV0dXJlIG9uZXMgY2F1c2VkIGJ5IENTUyB0cmFuc2l0aW9ucy5cbiAgICBpZiAoY2hhbmdlc0RldGVjdGVkKSB7XG4gICAgICAgIHRoaXMucmVmcmVzaCgpO1xuICAgIH1cbn07XG5cbi8qKlxyXG4gKiBVcGRhdGVzIGV2ZXJ5IG9ic2VydmVyIGZyb20gb2JzZXJ2ZXJzIGxpc3QgYW5kIG5vdGlmaWVzIHRoZW0gb2YgcXVldWVkXHJcbiAqIGVudHJpZXMuXHJcbiAqXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIFwidHJ1ZVwiIGlmIGFueSBvYnNlcnZlciBoYXMgZGV0ZWN0ZWQgY2hhbmdlcyBpblxyXG4gKiAgZGltZW5zaW9ucyBvZiBpdCdzIGVsZW1lbnRzLlxyXG4gKi9cblJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5wcm90b3R5cGUudXBkYXRlT2JzZXJ2ZXJzXyA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBDb2xsZWN0IG9ic2VydmVycyB0aGF0IGhhdmUgYWN0aXZlIG9ic2VydmF0aW9ucy5cbiAgICB2YXIgYWN0aXZlT2JzZXJ2ZXJzID0gdGhpcy5vYnNlcnZlcnNfLmZpbHRlcihmdW5jdGlvbiAob2JzZXJ2ZXIpIHtcbiAgICAgICAgcmV0dXJuIG9ic2VydmVyLmdhdGhlckFjdGl2ZSgpLCBvYnNlcnZlci5oYXNBY3RpdmUoKTtcbiAgICB9KTtcblxuICAgIC8vIERlbGl2ZXIgbm90aWZpY2F0aW9ucyBpbiBhIHNlcGFyYXRlIGN5Y2xlIGluIG9yZGVyIHRvIGF2b2lkIGFueVxuICAgIC8vIGNvbGxpc2lvbnMgYmV0d2VlbiBvYnNlcnZlcnMsIGUuZy4gd2hlbiBtdWx0aXBsZSBpbnN0YW5jZXMgb2ZcbiAgICAvLyBSZXNpemVPYnNlcnZlciBhcmUgdHJhY2tpbmcgdGhlIHNhbWUgZWxlbWVudCBhbmQgdGhlIGNhbGxiYWNrIG9mIG9uZVxuICAgIC8vIG9mIHRoZW0gY2hhbmdlcyBjb250ZW50IGRpbWVuc2lvbnMgb2YgdGhlIG9ic2VydmVkIHRhcmdldC4gU29tZXRpbWVzXG4gICAgLy8gdGhpcyBtYXkgcmVzdWx0IGluIG5vdGlmaWNhdGlvbnMgYmVpbmcgYmxvY2tlZCBmb3IgdGhlIHJlc3Qgb2Ygb2JzZXJ2ZXJzLlxuICAgIGFjdGl2ZU9ic2VydmVycy5mb3JFYWNoKGZ1bmN0aW9uIChvYnNlcnZlcikgeyByZXR1cm4gb2JzZXJ2ZXIuYnJvYWRjYXN0QWN0aXZlKCk7IH0pO1xuXG4gICAgcmV0dXJuIGFjdGl2ZU9ic2VydmVycy5sZW5ndGggPiAwO1xufTtcblxuLyoqXHJcbiAqIEluaXRpYWxpemVzIERPTSBsaXN0ZW5lcnMuXHJcbiAqXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm5zIHt2b2lkfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5wcm90b3R5cGUuY29ubmVjdF8gPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gRG8gbm90aGluZyBpZiBydW5uaW5nIGluIGEgbm9uLWJyb3dzZXIgZW52aXJvbm1lbnQgb3IgaWYgbGlzdGVuZXJzXG4gICAgLy8gaGF2ZSBiZWVuIGFscmVhZHkgYWRkZWQuXG4gICAgaWYgKCFpc0Jyb3dzZXIgfHwgdGhpcy5jb25uZWN0ZWRfKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpcHRpb24gdG8gdGhlIFwiVHJhbnNpdGlvbmVuZFwiIGV2ZW50IGlzIHVzZWQgYXMgYSB3b3JrYXJvdW5kIGZvclxuICAgIC8vIGRlbGF5ZWQgdHJhbnNpdGlvbnMuIFRoaXMgd2F5IGl0J3MgcG9zc2libGUgdG8gY2FwdHVyZSBhdCBsZWFzdCB0aGVcbiAgICAvLyBmaW5hbCBzdGF0ZSBvZiBhbiBlbGVtZW50LlxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCB0aGlzLm9uVHJhbnNpdGlvbkVuZF8pO1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMucmVmcmVzaCk7XG5cbiAgICBpZiAobXV0YXRpb25PYnNlcnZlclN1cHBvcnRlZCkge1xuICAgICAgICB0aGlzLm11dGF0aW9uc09ic2VydmVyXyA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKHRoaXMucmVmcmVzaCk7XG5cbiAgICAgICAgdGhpcy5tdXRhdGlvbnNPYnNlcnZlcl8ub2JzZXJ2ZShkb2N1bWVudCwge1xuICAgICAgICAgICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICAgIGNoYXJhY3RlckRhdGE6IHRydWUsXG4gICAgICAgICAgICBzdWJ0cmVlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTVN1YnRyZWVNb2RpZmllZCcsIHRoaXMucmVmcmVzaCk7XG5cbiAgICAgICAgdGhpcy5tdXRhdGlvbkV2ZW50c0FkZGVkXyA9IHRydWU7XG4gICAgfVxuXG4gICAgdGhpcy5jb25uZWN0ZWRfID0gdHJ1ZTtcbn07XG5cbi8qKlxyXG4gKiBSZW1vdmVzIERPTSBsaXN0ZW5lcnMuXHJcbiAqXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm5zIHt2b2lkfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5wcm90b3R5cGUuZGlzY29ubmVjdF8gPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gRG8gbm90aGluZyBpZiBydW5uaW5nIGluIGEgbm9uLWJyb3dzZXIgZW52aXJvbm1lbnQgb3IgaWYgbGlzdGVuZXJzXG4gICAgLy8gaGF2ZSBiZWVuIGFscmVhZHkgcmVtb3ZlZC5cbiAgICBpZiAoIWlzQnJvd3NlciB8fCAhdGhpcy5jb25uZWN0ZWRfKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgdGhpcy5vblRyYW5zaXRpb25FbmRfKTtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5yZWZyZXNoKTtcblxuICAgIGlmICh0aGlzLm11dGF0aW9uc09ic2VydmVyXykge1xuICAgICAgICB0aGlzLm11dGF0aW9uc09ic2VydmVyXy5kaXNjb25uZWN0KCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubXV0YXRpb25FdmVudHNBZGRlZF8pIHtcbiAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignRE9NU3VidHJlZU1vZGlmaWVkJywgdGhpcy5yZWZyZXNoKTtcbiAgICB9XG5cbiAgICB0aGlzLm11dGF0aW9uc09ic2VydmVyXyA9IG51bGw7XG4gICAgdGhpcy5tdXRhdGlvbkV2ZW50c0FkZGVkXyA9IGZhbHNlO1xuICAgIHRoaXMuY29ubmVjdGVkXyA9IGZhbHNlO1xufTtcblxuLyoqXHJcbiAqIFwiVHJhbnNpdGlvbmVuZFwiIGV2ZW50IGhhbmRsZXIuXHJcbiAqXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSB7VHJhbnNpdGlvbkV2ZW50fSBldmVudFxyXG4gKiBAcmV0dXJucyB7dm9pZH1cclxuICovXG5SZXNpemVPYnNlcnZlckNvbnRyb2xsZXIucHJvdG90eXBlLm9uVHJhbnNpdGlvbkVuZF8gPSBmdW5jdGlvbiAocmVmKSB7XG4gICAgICAgIHZhciBwcm9wZXJ0eU5hbWUgPSByZWYucHJvcGVydHlOYW1lOyBpZiAoIHByb3BlcnR5TmFtZSA9PT0gdm9pZCAwICkgcHJvcGVydHlOYW1lID0gJyc7XG5cbiAgICAvLyBEZXRlY3Qgd2hldGhlciB0cmFuc2l0aW9uIG1heSBhZmZlY3QgZGltZW5zaW9ucyBvZiBhbiBlbGVtZW50LlxuICAgIHZhciBpc1JlZmxvd1Byb3BlcnR5ID0gdHJhbnNpdGlvbktleXMuc29tZShmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHJldHVybiAhIX5wcm9wZXJ0eU5hbWUuaW5kZXhPZihrZXkpO1xuICAgIH0pO1xuXG4gICAgaWYgKGlzUmVmbG93UHJvcGVydHkpIHtcbiAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgfVxufTtcblxuLyoqXHJcbiAqIFJldHVybnMgaW5zdGFuY2Ugb2YgdGhlIFJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5cclxuICpcclxuICogQHJldHVybnMge1Jlc2l6ZU9ic2VydmVyQ29udHJvbGxlcn1cclxuICovXG5SZXNpemVPYnNlcnZlckNvbnRyb2xsZXIuZ2V0SW5zdGFuY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmluc3RhbmNlXykge1xuICAgICAgICB0aGlzLmluc3RhbmNlXyA9IG5ldyBSZXNpemVPYnNlcnZlckNvbnRyb2xsZXIoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5pbnN0YW5jZV87XG59O1xuXG5SZXNpemVPYnNlcnZlckNvbnRyb2xsZXIuaW5zdGFuY2VfID0gbnVsbDtcblxuLyoqXHJcbiAqIERlZmluZXMgbm9uLXdyaXRhYmxlL2VudW1lcmFibGUgcHJvcGVydGllcyBvZiB0aGUgcHJvdmlkZWQgdGFyZ2V0IG9iamVjdC5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IHRhcmdldCAtIE9iamVjdCBmb3Igd2hpY2ggdG8gZGVmaW5lIHByb3BlcnRpZXMuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wcyAtIFByb3BlcnRpZXMgdG8gYmUgZGVmaW5lZC5cclxuICogQHJldHVybnMge09iamVjdH0gVGFyZ2V0IG9iamVjdC5cclxuICovXG52YXIgZGVmaW5lQ29uZmlndXJhYmxlID0gKGZ1bmN0aW9uICh0YXJnZXQsIHByb3BzKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxpc3QgPSBPYmplY3Qua2V5cyhwcm9wcyk7IGkgPCBsaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHZhciBrZXkgPSBsaXN0W2ldO1xuXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwge1xuICAgICAgICAgICAgdmFsdWU6IHByb3BzW2tleV0sXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFyZ2V0O1xufSk7XG5cbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBnbG9iYWwgb2JqZWN0IGFzc29jaWF0ZWQgd2l0aCBwcm92aWRlZCBlbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0XHJcbiAqIEByZXR1cm5zIHtPYmplY3R9XHJcbiAqL1xudmFyIGdldFdpbmRvd09mID0gKGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAvLyBBc3N1bWUgdGhhdCB0aGUgZWxlbWVudCBpcyBhbiBpbnN0YW5jZSBvZiBOb2RlLCB3aGljaCBtZWFucyB0aGF0IGl0XG4gICAgLy8gaGFzIHRoZSBcIm93bmVyRG9jdW1lbnRcIiBwcm9wZXJ0eSBmcm9tIHdoaWNoIHdlIGNhbiByZXRyaWV2ZSBhXG4gICAgLy8gY29ycmVzcG9uZGluZyBnbG9iYWwgb2JqZWN0LlxuICAgIHZhciBvd25lckdsb2JhbCA9IHRhcmdldCAmJiB0YXJnZXQub3duZXJEb2N1bWVudCAmJiB0YXJnZXQub3duZXJEb2N1bWVudC5kZWZhdWx0VmlldztcblxuICAgIC8vIFJldHVybiB0aGUgbG9jYWwgZ2xvYmFsIG9iamVjdCBpZiBpdCdzIG5vdCBwb3NzaWJsZSBleHRyYWN0IG9uZSBmcm9tXG4gICAgLy8gcHJvdmlkZWQgZWxlbWVudC5cbiAgICByZXR1cm4gb3duZXJHbG9iYWwgfHwgZ2xvYmFsJDE7XG59KTtcblxuLy8gUGxhY2Vob2xkZXIgb2YgYW4gZW1wdHkgY29udGVudCByZWN0YW5nbGUuXG52YXIgZW1wdHlSZWN0ID0gY3JlYXRlUmVjdEluaXQoMCwgMCwgMCwgMCk7XG5cbi8qKlxyXG4gKiBDb252ZXJ0cyBwcm92aWRlZCBzdHJpbmcgdG8gYSBudW1iZXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gdmFsdWVcclxuICogQHJldHVybnMge251bWJlcn1cclxuICovXG5mdW5jdGlvbiB0b0Zsb2F0KHZhbHVlKSB7XG4gICAgcmV0dXJuIHBhcnNlRmxvYXQodmFsdWUpIHx8IDA7XG59XG5cbi8qKlxyXG4gKiBFeHRyYWN0cyBib3JkZXJzIHNpemUgZnJvbSBwcm92aWRlZCBzdHlsZXMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7Q1NTU3R5bGVEZWNsYXJhdGlvbn0gc3R5bGVzXHJcbiAqIEBwYXJhbSB7Li4uc3RyaW5nfSBwb3NpdGlvbnMgLSBCb3JkZXJzIHBvc2l0aW9ucyAodG9wLCByaWdodCwgLi4uKVxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gKi9cbmZ1bmN0aW9uIGdldEJvcmRlcnNTaXplKHN0eWxlcykge1xuICAgIHZhciBwb3NpdGlvbnMgPSBbXSwgbGVuID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7XG4gICAgd2hpbGUgKCBsZW4tLSA+IDAgKSBwb3NpdGlvbnNbIGxlbiBdID0gYXJndW1lbnRzWyBsZW4gKyAxIF07XG5cbiAgICByZXR1cm4gcG9zaXRpb25zLnJlZHVjZShmdW5jdGlvbiAoc2l6ZSwgcG9zaXRpb24pIHtcbiAgICAgICAgdmFyIHZhbHVlID0gc3R5bGVzWydib3JkZXItJyArIHBvc2l0aW9uICsgJy13aWR0aCddO1xuXG4gICAgICAgIHJldHVybiBzaXplICsgdG9GbG9hdCh2YWx1ZSk7XG4gICAgfSwgMCk7XG59XG5cbi8qKlxyXG4gKiBFeHRyYWN0cyBwYWRkaW5ncyBzaXplcyBmcm9tIHByb3ZpZGVkIHN0eWxlcy5cclxuICpcclxuICogQHBhcmFtIHtDU1NTdHlsZURlY2xhcmF0aW9ufSBzdHlsZXNcclxuICogQHJldHVybnMge09iamVjdH0gUGFkZGluZ3MgYm94LlxyXG4gKi9cbmZ1bmN0aW9uIGdldFBhZGRpbmdzKHN0eWxlcykge1xuICAgIHZhciBwb3NpdGlvbnMgPSBbJ3RvcCcsICdyaWdodCcsICdib3R0b20nLCAnbGVmdCddO1xuICAgIHZhciBwYWRkaW5ncyA9IHt9O1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGxpc3QgPSBwb3NpdGlvbnM7IGkgPCBsaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHZhciBwb3NpdGlvbiA9IGxpc3RbaV07XG5cbiAgICAgICAgdmFyIHZhbHVlID0gc3R5bGVzWydwYWRkaW5nLScgKyBwb3NpdGlvbl07XG5cbiAgICAgICAgcGFkZGluZ3NbcG9zaXRpb25dID0gdG9GbG9hdCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhZGRpbmdzO1xufVxuXG4vKipcclxuICogQ2FsY3VsYXRlcyBjb250ZW50IHJlY3RhbmdsZSBvZiBwcm92aWRlZCBTVkcgZWxlbWVudC5cclxuICpcclxuICogQHBhcmFtIHtTVkdHcmFwaGljc0VsZW1lbnR9IHRhcmdldCAtIEVsZW1lbnQgY29udGVudCByZWN0YW5nbGUgb2Ygd2hpY2ggbmVlZHNcclxuICogICAgICB0byBiZSBjYWxjdWxhdGVkLlxyXG4gKiBAcmV0dXJucyB7RE9NUmVjdEluaXR9XHJcbiAqL1xuZnVuY3Rpb24gZ2V0U1ZHQ29udGVudFJlY3QodGFyZ2V0KSB7XG4gICAgdmFyIGJib3ggPSB0YXJnZXQuZ2V0QkJveCgpO1xuXG4gICAgcmV0dXJuIGNyZWF0ZVJlY3RJbml0KDAsIDAsIGJib3gud2lkdGgsIGJib3guaGVpZ2h0KTtcbn1cblxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgY29udGVudCByZWN0YW5nbGUgb2YgcHJvdmlkZWQgSFRNTEVsZW1lbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRhcmdldCAtIEVsZW1lbnQgZm9yIHdoaWNoIHRvIGNhbGN1bGF0ZSB0aGUgY29udGVudCByZWN0YW5nbGUuXHJcbiAqIEByZXR1cm5zIHtET01SZWN0SW5pdH1cclxuICovXG5mdW5jdGlvbiBnZXRIVE1MRWxlbWVudENvbnRlbnRSZWN0KHRhcmdldCkge1xuICAgIC8vIENsaWVudCB3aWR0aCAmIGhlaWdodCBwcm9wZXJ0aWVzIGNhbid0IGJlXG4gICAgLy8gdXNlZCBleGNsdXNpdmVseSBhcyB0aGV5IHByb3ZpZGUgcm91bmRlZCB2YWx1ZXMuXG4gICAgdmFyIGNsaWVudFdpZHRoID0gdGFyZ2V0LmNsaWVudFdpZHRoO1xuICAgIHZhciBjbGllbnRIZWlnaHQgPSB0YXJnZXQuY2xpZW50SGVpZ2h0O1xuXG4gICAgLy8gQnkgdGhpcyBjb25kaXRpb24gd2UgY2FuIGNhdGNoIGFsbCBub24tcmVwbGFjZWQgaW5saW5lLCBoaWRkZW4gYW5kXG4gICAgLy8gZGV0YWNoZWQgZWxlbWVudHMuIFRob3VnaCBlbGVtZW50cyB3aXRoIHdpZHRoICYgaGVpZ2h0IHByb3BlcnRpZXMgbGVzc1xuICAgIC8vIHRoYW4gMC41IHdpbGwgYmUgZGlzY2FyZGVkIGFzIHdlbGwuXG4gICAgLy9cbiAgICAvLyBXaXRob3V0IGl0IHdlIHdvdWxkIG5lZWQgdG8gaW1wbGVtZW50IHNlcGFyYXRlIG1ldGhvZHMgZm9yIGVhY2ggb2ZcbiAgICAvLyB0aG9zZSBjYXNlcyBhbmQgaXQncyBub3QgcG9zc2libGUgdG8gcGVyZm9ybSBhIHByZWNpc2UgYW5kIHBlcmZvcm1hbmNlXG4gICAgLy8gZWZmZWN0aXZlIHRlc3QgZm9yIGhpZGRlbiBlbGVtZW50cy4gRS5nLiBldmVuIGpRdWVyeSdzICc6dmlzaWJsZScgZmlsdGVyXG4gICAgLy8gZ2l2ZXMgd3JvbmcgcmVzdWx0cyBmb3IgZWxlbWVudHMgd2l0aCB3aWR0aCAmIGhlaWdodCBsZXNzIHRoYW4gMC41LlxuICAgIGlmICghY2xpZW50V2lkdGggJiYgIWNsaWVudEhlaWdodCkge1xuICAgICAgICByZXR1cm4gZW1wdHlSZWN0O1xuICAgIH1cblxuICAgIHZhciBzdHlsZXMgPSBnZXRXaW5kb3dPZih0YXJnZXQpLmdldENvbXB1dGVkU3R5bGUodGFyZ2V0KTtcbiAgICB2YXIgcGFkZGluZ3MgPSBnZXRQYWRkaW5ncyhzdHlsZXMpO1xuICAgIHZhciBob3JpelBhZCA9IHBhZGRpbmdzLmxlZnQgKyBwYWRkaW5ncy5yaWdodDtcbiAgICB2YXIgdmVydFBhZCA9IHBhZGRpbmdzLnRvcCArIHBhZGRpbmdzLmJvdHRvbTtcblxuICAgIC8vIENvbXB1dGVkIHN0eWxlcyBvZiB3aWR0aCAmIGhlaWdodCBhcmUgYmVpbmcgdXNlZCBiZWNhdXNlIHRoZXkgYXJlIHRoZVxuICAgIC8vIG9ubHkgZGltZW5zaW9ucyBhdmFpbGFibGUgdG8gSlMgdGhhdCBjb250YWluIG5vbi1yb3VuZGVkIHZhbHVlcy4gSXQgY291bGRcbiAgICAvLyBiZSBwb3NzaWJsZSB0byB1dGlsaXplIHRoZSBnZXRCb3VuZGluZ0NsaWVudFJlY3QgaWYgb25seSBpdCdzIGRhdGEgd2Fzbid0XG4gICAgLy8gYWZmZWN0ZWQgYnkgQ1NTIHRyYW5zZm9ybWF0aW9ucyBsZXQgYWxvbmUgcGFkZGluZ3MsIGJvcmRlcnMgYW5kIHNjcm9sbCBiYXJzLlxuICAgIHZhciB3aWR0aCA9IHRvRmxvYXQoc3R5bGVzLndpZHRoKSxcbiAgICAgICAgaGVpZ2h0ID0gdG9GbG9hdChzdHlsZXMuaGVpZ2h0KTtcblxuICAgIC8vIFdpZHRoICYgaGVpZ2h0IGluY2x1ZGUgcGFkZGluZ3MgYW5kIGJvcmRlcnMgd2hlbiB0aGUgJ2JvcmRlci1ib3gnIGJveFxuICAgIC8vIG1vZGVsIGlzIGFwcGxpZWQgKGV4Y2VwdCBmb3IgSUUpLlxuICAgIGlmIChzdHlsZXMuYm94U2l6aW5nID09PSAnYm9yZGVyLWJveCcpIHtcbiAgICAgICAgLy8gRm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIHJlcXVpcmVkIHRvIGhhbmRsZSBJbnRlcm5ldCBFeHBsb3JlciB3aGljaFxuICAgICAgICAvLyBkb2Vzbid0IGluY2x1ZGUgcGFkZGluZ3MgYW5kIGJvcmRlcnMgdG8gY29tcHV0ZWQgQ1NTIGRpbWVuc2lvbnMuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFdlIGNhbiBzYXkgdGhhdCBpZiBDU1MgZGltZW5zaW9ucyArIHBhZGRpbmdzIGFyZSBlcXVhbCB0byB0aGUgXCJjbGllbnRcIlxuICAgICAgICAvLyBwcm9wZXJ0aWVzIHRoZW4gaXQncyBlaXRoZXIgSUUsIGFuZCB0aHVzIHdlIGRvbid0IG5lZWQgdG8gc3VidHJhY3RcbiAgICAgICAgLy8gYW55dGhpbmcsIG9yIGFuIGVsZW1lbnQgbWVyZWx5IGRvZXNuJ3QgaGF2ZSBwYWRkaW5ncy9ib3JkZXJzIHN0eWxlcy5cbiAgICAgICAgaWYgKE1hdGgucm91bmQod2lkdGggKyBob3JpelBhZCkgIT09IGNsaWVudFdpZHRoKSB7XG4gICAgICAgICAgICB3aWR0aCAtPSBnZXRCb3JkZXJzU2l6ZShzdHlsZXMsICdsZWZ0JywgJ3JpZ2h0JykgKyBob3JpelBhZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChNYXRoLnJvdW5kKGhlaWdodCArIHZlcnRQYWQpICE9PSBjbGllbnRIZWlnaHQpIHtcbiAgICAgICAgICAgIGhlaWdodCAtPSBnZXRCb3JkZXJzU2l6ZShzdHlsZXMsICd0b3AnLCAnYm90dG9tJykgKyB2ZXJ0UGFkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gRm9sbG93aW5nIHN0ZXBzIGNhbid0IGJlIGFwcGxpZWQgdG8gdGhlIGRvY3VtZW50J3Mgcm9vdCBlbGVtZW50IGFzIGl0c1xuICAgIC8vIGNsaWVudFtXaWR0aC9IZWlnaHRdIHByb3BlcnRpZXMgcmVwcmVzZW50IHZpZXdwb3J0IGFyZWEgb2YgdGhlIHdpbmRvdy5cbiAgICAvLyBCZXNpZGVzLCBpdCdzIGFzIHdlbGwgbm90IG5lY2Vzc2FyeSBhcyB0aGUgPGh0bWw+IGl0c2VsZiBuZWl0aGVyIGhhc1xuICAgIC8vIHJlbmRlcmVkIHNjcm9sbCBiYXJzIG5vciBpdCBjYW4gYmUgY2xpcHBlZC5cbiAgICBpZiAoIWlzRG9jdW1lbnRFbGVtZW50KHRhcmdldCkpIHtcbiAgICAgICAgLy8gSW4gc29tZSBicm93c2VycyAob25seSBpbiBGaXJlZm94LCBhY3R1YWxseSkgQ1NTIHdpZHRoICYgaGVpZ2h0XG4gICAgICAgIC8vIGluY2x1ZGUgc2Nyb2xsIGJhcnMgc2l6ZSB3aGljaCBjYW4gYmUgcmVtb3ZlZCBhdCB0aGlzIHN0ZXAgYXMgc2Nyb2xsXG4gICAgICAgIC8vIGJhcnMgYXJlIHRoZSBvbmx5IGRpZmZlcmVuY2UgYmV0d2VlbiByb3VuZGVkIGRpbWVuc2lvbnMgKyBwYWRkaW5nc1xuICAgICAgICAvLyBhbmQgXCJjbGllbnRcIiBwcm9wZXJ0aWVzLCB0aG91Z2ggdGhhdCBpcyBub3QgYWx3YXlzIHRydWUgaW4gQ2hyb21lLlxuICAgICAgICB2YXIgdmVydFNjcm9sbGJhciA9IE1hdGgucm91bmQod2lkdGggKyBob3JpelBhZCkgLSBjbGllbnRXaWR0aDtcbiAgICAgICAgdmFyIGhvcml6U2Nyb2xsYmFyID0gTWF0aC5yb3VuZChoZWlnaHQgKyB2ZXJ0UGFkKSAtIGNsaWVudEhlaWdodDtcblxuICAgICAgICAvLyBDaHJvbWUgaGFzIGEgcmF0aGVyIHdlaXJkIHJvdW5kaW5nIG9mIFwiY2xpZW50XCIgcHJvcGVydGllcy5cbiAgICAgICAgLy8gRS5nLiBmb3IgYW4gZWxlbWVudCB3aXRoIGNvbnRlbnQgd2lkdGggb2YgMzE0LjJweCBpdCBzb21ldGltZXMgZ2l2ZXNcbiAgICAgICAgLy8gdGhlIGNsaWVudCB3aWR0aCBvZiAzMTVweCBhbmQgZm9yIHRoZSB3aWR0aCBvZiAzMTQuN3B4IGl0IG1heSBnaXZlXG4gICAgICAgIC8vIDMxNHB4LiBBbmQgaXQgZG9lc24ndCBoYXBwZW4gYWxsIHRoZSB0aW1lLiBTbyBqdXN0IGlnbm9yZSB0aGlzIGRlbHRhXG4gICAgICAgIC8vIGFzIGEgbm9uLXJlbGV2YW50LlxuICAgICAgICBpZiAoTWF0aC5hYnModmVydFNjcm9sbGJhcikgIT09IDEpIHtcbiAgICAgICAgICAgIHdpZHRoIC09IHZlcnRTY3JvbGxiYXI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoTWF0aC5hYnMoaG9yaXpTY3JvbGxiYXIpICE9PSAxKSB7XG4gICAgICAgICAgICBoZWlnaHQgLT0gaG9yaXpTY3JvbGxiYXI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY3JlYXRlUmVjdEluaXQocGFkZGluZ3MubGVmdCwgcGFkZGluZ3MudG9wLCB3aWR0aCwgaGVpZ2h0KTtcbn1cblxuLyoqXHJcbiAqIENoZWNrcyB3aGV0aGVyIHByb3ZpZGVkIGVsZW1lbnQgaXMgYW4gaW5zdGFuY2Ugb2YgdGhlIFNWR0dyYXBoaWNzRWxlbWVudC5cclxuICpcclxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXQgLSBFbGVtZW50IHRvIGJlIGNoZWNrZWQuXHJcbiAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gKi9cbnZhciBpc1NWR0dyYXBoaWNzRWxlbWVudCA9IChmdW5jdGlvbiAoKSB7XG4gICAgLy8gU29tZSBicm93c2VycywgbmFtZWx5IElFIGFuZCBFZGdlLCBkb24ndCBoYXZlIHRoZSBTVkdHcmFwaGljc0VsZW1lbnRcbiAgICAvLyBpbnRlcmZhY2UuXG4gICAgaWYgKHR5cGVvZiBTVkdHcmFwaGljc0VsZW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0KSB7IHJldHVybiB0YXJnZXQgaW5zdGFuY2VvZiBnZXRXaW5kb3dPZih0YXJnZXQpLlNWR0dyYXBoaWNzRWxlbWVudDsgfTtcbiAgICB9XG5cbiAgICAvLyBJZiBpdCdzIHNvLCB0aGVuIGNoZWNrIHRoYXQgZWxlbWVudCBpcyBhdCBsZWFzdCBhbiBpbnN0YW5jZSBvZiB0aGVcbiAgICAvLyBTVkdFbGVtZW50IGFuZCB0aGF0IGl0IGhhcyB0aGUgXCJnZXRCQm94XCIgbWV0aG9kLlxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1leHRyYS1wYXJlbnNcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCkgeyByZXR1cm4gdGFyZ2V0IGluc3RhbmNlb2YgZ2V0V2luZG93T2YodGFyZ2V0KS5TVkdFbGVtZW50ICYmIHR5cGVvZiB0YXJnZXQuZ2V0QkJveCA9PT0gJ2Z1bmN0aW9uJzsgfTtcbn0pKCk7XG5cbi8qKlxyXG4gKiBDaGVja3Mgd2hldGhlciBwcm92aWRlZCBlbGVtZW50IGlzIGEgZG9jdW1lbnQgZWxlbWVudCAoPGh0bWw+KS5cclxuICpcclxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXQgLSBFbGVtZW50IHRvIGJlIGNoZWNrZWQuXHJcbiAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gKi9cbmZ1bmN0aW9uIGlzRG9jdW1lbnRFbGVtZW50KHRhcmdldCkge1xuICAgIHJldHVybiB0YXJnZXQgPT09IGdldFdpbmRvd09mKHRhcmdldCkuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xufVxuXG4vKipcclxuICogQ2FsY3VsYXRlcyBhbiBhcHByb3ByaWF0ZSBjb250ZW50IHJlY3RhbmdsZSBmb3IgcHJvdmlkZWQgaHRtbCBvciBzdmcgZWxlbWVudC5cclxuICpcclxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXQgLSBFbGVtZW50IGNvbnRlbnQgcmVjdGFuZ2xlIG9mIHdoaWNoIG5lZWRzIHRvIGJlIGNhbGN1bGF0ZWQuXHJcbiAqIEByZXR1cm5zIHtET01SZWN0SW5pdH1cclxuICovXG5mdW5jdGlvbiBnZXRDb250ZW50UmVjdCh0YXJnZXQpIHtcbiAgICBpZiAoIWlzQnJvd3Nlcikge1xuICAgICAgICByZXR1cm4gZW1wdHlSZWN0O1xuICAgIH1cblxuICAgIGlmIChpc1NWR0dyYXBoaWNzRWxlbWVudCh0YXJnZXQpKSB7XG4gICAgICAgIHJldHVybiBnZXRTVkdDb250ZW50UmVjdCh0YXJnZXQpO1xuICAgIH1cblxuICAgIHJldHVybiBnZXRIVE1MRWxlbWVudENvbnRlbnRSZWN0KHRhcmdldCk7XG59XG5cbi8qKlxyXG4gKiBDcmVhdGVzIHJlY3RhbmdsZSB3aXRoIGFuIGludGVyZmFjZSBvZiB0aGUgRE9NUmVjdFJlYWRPbmx5LlxyXG4gKiBTcGVjOiBodHRwczovL2RyYWZ0cy5meHRmLm9yZy9nZW9tZXRyeS8jZG9tcmVjdHJlYWRvbmx5XHJcbiAqXHJcbiAqIEBwYXJhbSB7RE9NUmVjdEluaXR9IHJlY3RJbml0IC0gT2JqZWN0IHdpdGggcmVjdGFuZ2xlJ3MgeC95IGNvb3JkaW5hdGVzIGFuZCBkaW1lbnNpb25zLlxyXG4gKiBAcmV0dXJucyB7RE9NUmVjdFJlYWRPbmx5fVxyXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVJlYWRPbmx5UmVjdChyZWYpIHtcbiAgICB2YXIgeCA9IHJlZi54O1xuICAgIHZhciB5ID0gcmVmLnk7XG4gICAgdmFyIHdpZHRoID0gcmVmLndpZHRoO1xuICAgIHZhciBoZWlnaHQgPSByZWYuaGVpZ2h0O1xuXG4gICAgLy8gSWYgRE9NUmVjdFJlYWRPbmx5IGlzIGF2YWlsYWJsZSB1c2UgaXQgYXMgYSBwcm90b3R5cGUgZm9yIHRoZSByZWN0YW5nbGUuXG4gICAgdmFyIENvbnN0ciA9IHR5cGVvZiBET01SZWN0UmVhZE9ubHkgIT09ICd1bmRlZmluZWQnID8gRE9NUmVjdFJlYWRPbmx5IDogT2JqZWN0O1xuICAgIHZhciByZWN0ID0gT2JqZWN0LmNyZWF0ZShDb25zdHIucHJvdG90eXBlKTtcblxuICAgIC8vIFJlY3RhbmdsZSdzIHByb3BlcnRpZXMgYXJlIG5vdCB3cml0YWJsZSBhbmQgbm9uLWVudW1lcmFibGUuXG4gICAgZGVmaW5lQ29uZmlndXJhYmxlKHJlY3QsIHtcbiAgICAgICAgeDogeCwgeTogeSwgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgdG9wOiB5LFxuICAgICAgICByaWdodDogeCArIHdpZHRoLFxuICAgICAgICBib3R0b206IGhlaWdodCArIHksXG4gICAgICAgIGxlZnQ6IHhcbiAgICB9KTtcblxuICAgIHJldHVybiByZWN0O1xufVxuXG4vKipcclxuICogQ3JlYXRlcyBET01SZWN0SW5pdCBvYmplY3QgYmFzZWQgb24gdGhlIHByb3ZpZGVkIGRpbWVuc2lvbnMgYW5kIHRoZSB4L3kgY29vcmRpbmF0ZXMuXHJcbiAqIFNwZWM6IGh0dHBzOi8vZHJhZnRzLmZ4dGYub3JnL2dlb21ldHJ5LyNkaWN0ZGVmLWRvbXJlY3Rpbml0XHJcbiAqXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gWCBjb29yZGluYXRlLlxyXG4gKiBAcGFyYW0ge251bWJlcn0geSAtIFkgY29vcmRpbmF0ZS5cclxuICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoIC0gUmVjdGFuZ2xlJ3Mgd2lkdGguXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSBSZWN0YW5nbGUncyBoZWlnaHQuXHJcbiAqIEByZXR1cm5zIHtET01SZWN0SW5pdH1cclxuICovXG5mdW5jdGlvbiBjcmVhdGVSZWN0SW5pdCh4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgcmV0dXJuIHsgeDogeCwgeTogeSwgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCB9O1xufVxuXG4vKipcclxuICogQ2xhc3MgdGhhdCBpcyByZXNwb25zaWJsZSBmb3IgY29tcHV0YXRpb25zIG9mIHRoZSBjb250ZW50IHJlY3RhbmdsZSBvZlxyXG4gKiBwcm92aWRlZCBET00gZWxlbWVudCBhbmQgZm9yIGtlZXBpbmcgdHJhY2sgb2YgaXQncyBjaGFuZ2VzLlxyXG4gKi9cbnZhciBSZXNpemVPYnNlcnZhdGlvbiA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgIHRoaXMuYnJvYWRjYXN0V2lkdGggPSAwO1xuICAgIHRoaXMuYnJvYWRjYXN0SGVpZ2h0ID0gMDtcbiAgICB0aGlzLmNvbnRlbnRSZWN0XyA9IGNyZWF0ZVJlY3RJbml0KDAsIDAsIDAsIDApO1xuXG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG59O1xuXG4vKipcclxuICogVXBkYXRlcyBjb250ZW50IHJlY3RhbmdsZSBhbmQgdGVsbHMgd2hldGhlciBpdCdzIHdpZHRoIG9yIGhlaWdodCBwcm9wZXJ0aWVzXHJcbiAqIGhhdmUgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCBicm9hZGNhc3QuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gKi9cblxuXG4vKipcclxuICogUmVmZXJlbmNlIHRvIHRoZSBsYXN0IG9ic2VydmVkIGNvbnRlbnQgcmVjdGFuZ2xlLlxyXG4gKlxyXG4gKiBAcHJpdmF0ZSB7RE9NUmVjdEluaXR9XHJcbiAqL1xuXG5cbi8qKlxyXG4gKiBCcm9hZGNhc3RlZCB3aWR0aCBvZiBjb250ZW50IHJlY3RhbmdsZS5cclxuICpcclxuICogQHR5cGUge251bWJlcn1cclxuICovXG5SZXNpemVPYnNlcnZhdGlvbi5wcm90b3R5cGUuaXNBY3RpdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlY3QgPSBnZXRDb250ZW50UmVjdCh0aGlzLnRhcmdldCk7XG5cbiAgICB0aGlzLmNvbnRlbnRSZWN0XyA9IHJlY3Q7XG5cbiAgICByZXR1cm4gcmVjdC53aWR0aCAhPT0gdGhpcy5icm9hZGNhc3RXaWR0aCB8fCByZWN0LmhlaWdodCAhPT0gdGhpcy5icm9hZGNhc3RIZWlnaHQ7XG59O1xuXG4vKipcclxuICogVXBkYXRlcyAnYnJvYWRjYXN0V2lkdGgnIGFuZCAnYnJvYWRjYXN0SGVpZ2h0JyBwcm9wZXJ0aWVzIHdpdGggYSBkYXRhXHJcbiAqIGZyb20gdGhlIGNvcnJlc3BvbmRpbmcgcHJvcGVydGllcyBvZiB0aGUgbGFzdCBvYnNlcnZlZCBjb250ZW50IHJlY3RhbmdsZS5cclxuICpcclxuICogQHJldHVybnMge0RPTVJlY3RJbml0fSBMYXN0IG9ic2VydmVkIGNvbnRlbnQgcmVjdGFuZ2xlLlxyXG4gKi9cblJlc2l6ZU9ic2VydmF0aW9uLnByb3RvdHlwZS5icm9hZGNhc3RSZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZWN0ID0gdGhpcy5jb250ZW50UmVjdF87XG5cbiAgICB0aGlzLmJyb2FkY2FzdFdpZHRoID0gcmVjdC53aWR0aDtcbiAgICB0aGlzLmJyb2FkY2FzdEhlaWdodCA9IHJlY3QuaGVpZ2h0O1xuXG4gICAgcmV0dXJuIHJlY3Q7XG59O1xuXG52YXIgUmVzaXplT2JzZXJ2ZXJFbnRyeSA9IGZ1bmN0aW9uKHRhcmdldCwgcmVjdEluaXQpIHtcbiAgICB2YXIgY29udGVudFJlY3QgPSBjcmVhdGVSZWFkT25seVJlY3QocmVjdEluaXQpO1xuXG4gICAgLy8gQWNjb3JkaW5nIHRvIHRoZSBzcGVjaWZpY2F0aW9uIGZvbGxvd2luZyBwcm9wZXJ0aWVzIGFyZSBub3Qgd3JpdGFibGVcbiAgICAvLyBhbmQgYXJlIGFsc28gbm90IGVudW1lcmFibGUgaW4gdGhlIG5hdGl2ZSBpbXBsZW1lbnRhdGlvbi5cbiAgICAvL1xuICAgIC8vIFByb3BlcnR5IGFjY2Vzc29ycyBhcmUgbm90IGJlaW5nIHVzZWQgYXMgdGhleSdkIHJlcXVpcmUgdG8gZGVmaW5lIGFcbiAgICAvLyBwcml2YXRlIFdlYWtNYXAgc3RvcmFnZSB3aGljaCBtYXkgY2F1c2UgbWVtb3J5IGxlYWtzIGluIGJyb3dzZXJzIHRoYXRcbiAgICAvLyBkb24ndCBzdXBwb3J0IHRoaXMgdHlwZSBvZiBjb2xsZWN0aW9ucy5cbiAgICBkZWZpbmVDb25maWd1cmFibGUodGhpcywgeyB0YXJnZXQ6IHRhcmdldCwgY29udGVudFJlY3Q6IGNvbnRlbnRSZWN0IH0pO1xufTtcblxudmFyIFJlc2l6ZU9ic2VydmVyU1BJID0gZnVuY3Rpb24oY2FsbGJhY2ssIGNvbnRyb2xsZXIsIGNhbGxiYWNrQ3R4KSB7XG4gICAgdGhpcy5hY3RpdmVPYnNlcnZhdGlvbnNfID0gW107XG4gICAgdGhpcy5vYnNlcnZhdGlvbnNfID0gbmV3IE1hcFNoaW0oKTtcblxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIGNhbGxiYWNrIHByb3ZpZGVkIGFzIHBhcmFtZXRlciAxIGlzIG5vdCBhIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIHRoaXMuY2FsbGJhY2tfID0gY2FsbGJhY2s7XG4gICAgdGhpcy5jb250cm9sbGVyXyA9IGNvbnRyb2xsZXI7XG4gICAgdGhpcy5jYWxsYmFja0N0eF8gPSBjYWxsYmFja0N0eDtcbn07XG5cbi8qKlxyXG4gKiBTdGFydHMgb2JzZXJ2aW5nIHByb3ZpZGVkIGVsZW1lbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0IC0gRWxlbWVudCB0byBiZSBvYnNlcnZlZC5cclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuXG5cbi8qKlxyXG4gKiBSZWdpc3RyeSBvZiB0aGUgUmVzaXplT2JzZXJ2YXRpb24gaW5zdGFuY2VzLlxyXG4gKlxyXG4gKiBAcHJpdmF0ZSB7TWFwPEVsZW1lbnQsIFJlc2l6ZU9ic2VydmF0aW9uPn1cclxuICovXG5cblxuLyoqXHJcbiAqIFB1YmxpYyBSZXNpemVPYnNlcnZlciBpbnN0YW5jZSB3aGljaCB3aWxsIGJlIHBhc3NlZCB0byB0aGUgY2FsbGJhY2tcclxuICogZnVuY3Rpb24gYW5kIHVzZWQgYXMgYSB2YWx1ZSBvZiBpdCdzIFwidGhpc1wiIGJpbmRpbmcuXHJcbiAqXHJcbiAqIEBwcml2YXRlIHtSZXNpemVPYnNlcnZlcn1cclxuICovXG5cbi8qKlxyXG4gKiBDb2xsZWN0aW9uIG9mIHJlc2l6ZSBvYnNlcnZhdGlvbnMgdGhhdCBoYXZlIGRldGVjdGVkIGNoYW5nZXMgaW4gZGltZW5zaW9uc1xyXG4gKiBvZiBlbGVtZW50cy5cclxuICpcclxuICogQHByaXZhdGUge0FycmF5PFJlc2l6ZU9ic2VydmF0aW9uPn1cclxuICovXG5SZXNpemVPYnNlcnZlclNQSS5wcm90b3R5cGUub2JzZXJ2ZSA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignMSBhcmd1bWVudCByZXF1aXJlZCwgYnV0IG9ubHkgMCBwcmVzZW50LicpO1xuICAgIH1cblxuICAgIC8vIERvIG5vdGhpbmcgaWYgY3VycmVudCBlbnZpcm9ubWVudCBkb2Vzbid0IGhhdmUgdGhlIEVsZW1lbnQgaW50ZXJmYWNlLlxuICAgIGlmICh0eXBlb2YgRWxlbWVudCA9PT0gJ3VuZGVmaW5lZCcgfHwgIShFbGVtZW50IGluc3RhbmNlb2YgT2JqZWN0KSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCEodGFyZ2V0IGluc3RhbmNlb2YgZ2V0V2luZG93T2YodGFyZ2V0KS5FbGVtZW50KSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdwYXJhbWV0ZXIgMSBpcyBub3Qgb2YgdHlwZSBcIkVsZW1lbnRcIi4nKTtcbiAgICB9XG5cbiAgICB2YXIgb2JzZXJ2YXRpb25zID0gdGhpcy5vYnNlcnZhdGlvbnNfO1xuXG4gICAgLy8gRG8gbm90aGluZyBpZiBlbGVtZW50IGlzIGFscmVhZHkgYmVpbmcgb2JzZXJ2ZWQuXG4gICAgaWYgKG9ic2VydmF0aW9ucy5oYXModGFyZ2V0KSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgb2JzZXJ2YXRpb25zLnNldCh0YXJnZXQsIG5ldyBSZXNpemVPYnNlcnZhdGlvbih0YXJnZXQpKTtcblxuICAgIHRoaXMuY29udHJvbGxlcl8uYWRkT2JzZXJ2ZXIodGhpcyk7XG5cbiAgICAvLyBGb3JjZSB0aGUgdXBkYXRlIG9mIG9ic2VydmF0aW9ucy5cbiAgICB0aGlzLmNvbnRyb2xsZXJfLnJlZnJlc2goKTtcbn07XG5cbi8qKlxyXG4gKiBTdG9wcyBvYnNlcnZpbmcgcHJvdmlkZWQgZWxlbWVudC5cclxuICpcclxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXQgLSBFbGVtZW50IHRvIHN0b3Agb2JzZXJ2aW5nLlxyXG4gKiBAcmV0dXJucyB7dm9pZH1cclxuICovXG5SZXNpemVPYnNlcnZlclNQSS5wcm90b3R5cGUudW5vYnNlcnZlID0gZnVuY3Rpb24gKHRhcmdldCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCcxIGFyZ3VtZW50IHJlcXVpcmVkLCBidXQgb25seSAwIHByZXNlbnQuJyk7XG4gICAgfVxuXG4gICAgLy8gRG8gbm90aGluZyBpZiBjdXJyZW50IGVudmlyb25tZW50IGRvZXNuJ3QgaGF2ZSB0aGUgRWxlbWVudCBpbnRlcmZhY2UuXG4gICAgaWYgKHR5cGVvZiBFbGVtZW50ID09PSAndW5kZWZpbmVkJyB8fCAhKEVsZW1lbnQgaW5zdGFuY2VvZiBPYmplY3QpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoISh0YXJnZXQgaW5zdGFuY2VvZiBnZXRXaW5kb3dPZih0YXJnZXQpLkVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3BhcmFtZXRlciAxIGlzIG5vdCBvZiB0eXBlIFwiRWxlbWVudFwiLicpO1xuICAgIH1cblxuICAgIHZhciBvYnNlcnZhdGlvbnMgPSB0aGlzLm9ic2VydmF0aW9uc187XG5cbiAgICAvLyBEbyBub3RoaW5nIGlmIGVsZW1lbnQgaXMgbm90IGJlaW5nIG9ic2VydmVkLlxuICAgIGlmICghb2JzZXJ2YXRpb25zLmhhcyh0YXJnZXQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBvYnNlcnZhdGlvbnMuZGVsZXRlKHRhcmdldCk7XG5cbiAgICBpZiAoIW9ic2VydmF0aW9ucy5zaXplKSB7XG4gICAgICAgIHRoaXMuY29udHJvbGxlcl8ucmVtb3ZlT2JzZXJ2ZXIodGhpcyk7XG4gICAgfVxufTtcblxuLyoqXHJcbiAqIFN0b3BzIG9ic2VydmluZyBhbGwgZWxlbWVudHMuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHt2b2lkfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyU1BJLnByb3RvdHlwZS5kaXNjb25uZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuY2xlYXJBY3RpdmUoKTtcbiAgICB0aGlzLm9ic2VydmF0aW9uc18uY2xlYXIoKTtcbiAgICB0aGlzLmNvbnRyb2xsZXJfLnJlbW92ZU9ic2VydmVyKHRoaXMpO1xufTtcblxuLyoqXHJcbiAqIENvbGxlY3RzIG9ic2VydmF0aW9uIGluc3RhbmNlcyB0aGUgYXNzb2NpYXRlZCBlbGVtZW50IG9mIHdoaWNoIGhhcyBjaGFuZ2VkXHJcbiAqIGl0J3MgY29udGVudCByZWN0YW5nbGUuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHt2b2lkfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyU1BJLnByb3RvdHlwZS5nYXRoZXJBY3RpdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0aGlzJDEgPSB0aGlzO1xuXG4gICAgdGhpcy5jbGVhckFjdGl2ZSgpO1xuXG4gICAgdGhpcy5vYnNlcnZhdGlvbnNfLmZvckVhY2goZnVuY3Rpb24gKG9ic2VydmF0aW9uKSB7XG4gICAgICAgIGlmIChvYnNlcnZhdGlvbi5pc0FjdGl2ZSgpKSB7XG4gICAgICAgICAgICB0aGlzJDEuYWN0aXZlT2JzZXJ2YXRpb25zXy5wdXNoKG9ic2VydmF0aW9uKTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuLyoqXHJcbiAqIEludm9rZXMgaW5pdGlhbCBjYWxsYmFjayBmdW5jdGlvbiB3aXRoIGEgbGlzdCBvZiBSZXNpemVPYnNlcnZlckVudHJ5XHJcbiAqIGluc3RhbmNlcyBjb2xsZWN0ZWQgZnJvbSBhY3RpdmUgcmVzaXplIG9ic2VydmF0aW9ucy5cclxuICpcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJTUEkucHJvdG90eXBlLmJyb2FkY2FzdEFjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBEbyBub3RoaW5nIGlmIG9ic2VydmVyIGRvZXNuJ3QgaGF2ZSBhY3RpdmUgb2JzZXJ2YXRpb25zLlxuICAgIGlmICghdGhpcy5oYXNBY3RpdmUoKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGN0eCA9IHRoaXMuY2FsbGJhY2tDdHhfO1xuXG4gICAgLy8gQ3JlYXRlIFJlc2l6ZU9ic2VydmVyRW50cnkgaW5zdGFuY2UgZm9yIGV2ZXJ5IGFjdGl2ZSBvYnNlcnZhdGlvbi5cbiAgICB2YXIgZW50cmllcyA9IHRoaXMuYWN0aXZlT2JzZXJ2YXRpb25zXy5tYXAoZnVuY3Rpb24gKG9ic2VydmF0aW9uKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVzaXplT2JzZXJ2ZXJFbnRyeShvYnNlcnZhdGlvbi50YXJnZXQsIG9ic2VydmF0aW9uLmJyb2FkY2FzdFJlY3QoKSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmNhbGxiYWNrXy5jYWxsKGN0eCwgZW50cmllcywgY3R4KTtcbiAgICB0aGlzLmNsZWFyQWN0aXZlKCk7XG59O1xuXG4vKipcclxuICogQ2xlYXJzIHRoZSBjb2xsZWN0aW9uIG9mIGFjdGl2ZSBvYnNlcnZhdGlvbnMuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHt2b2lkfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyU1BJLnByb3RvdHlwZS5jbGVhckFjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmFjdGl2ZU9ic2VydmF0aW9uc18uc3BsaWNlKDApO1xufTtcblxuLyoqXHJcbiAqIFRlbGxzIHdoZXRoZXIgb2JzZXJ2ZXIgaGFzIGFjdGl2ZSBvYnNlcnZhdGlvbnMuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyU1BJLnByb3RvdHlwZS5oYXNBY3RpdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuYWN0aXZlT2JzZXJ2YXRpb25zXy5sZW5ndGggPiAwO1xufTtcblxuLy8gUmVnaXN0cnkgb2YgaW50ZXJuYWwgb2JzZXJ2ZXJzLiBJZiBXZWFrTWFwIGlzIG5vdCBhdmFpbGFibGUgdXNlIGN1cnJlbnQgc2hpbVxuLy8gZm9yIHRoZSBNYXAgY29sbGVjdGlvbiBhcyBpdCBoYXMgYWxsIHJlcXVpcmVkIG1ldGhvZHMgYW5kIGJlY2F1c2UgV2Vha01hcFxuLy8gY2FuJ3QgYmUgZnVsbHkgcG9seWZpbGxlZCBhbnl3YXkuXG52YXIgb2JzZXJ2ZXJzID0gdHlwZW9mIFdlYWtNYXAgIT09ICd1bmRlZmluZWQnID8gbmV3IFdlYWtNYXAoKSA6IG5ldyBNYXBTaGltKCk7XG5cbi8qKlxyXG4gKiBSZXNpemVPYnNlcnZlciBBUEkuIEVuY2Fwc3VsYXRlcyB0aGUgUmVzaXplT2JzZXJ2ZXIgU1BJIGltcGxlbWVudGF0aW9uXHJcbiAqIGV4cG9zaW5nIG9ubHkgdGhvc2UgbWV0aG9kcyBhbmQgcHJvcGVydGllcyB0aGF0IGFyZSBkZWZpbmVkIGluIHRoZSBzcGVjLlxyXG4gKi9cbnZhciBSZXNpemVPYnNlcnZlciA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFJlc2l6ZU9ic2VydmVyKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCcxIGFyZ3VtZW50IHJlcXVpcmVkLCBidXQgb25seSAwIHByZXNlbnQuJyk7XG4gICAgfVxuXG4gICAgdmFyIGNvbnRyb2xsZXIgPSBSZXNpemVPYnNlcnZlckNvbnRyb2xsZXIuZ2V0SW5zdGFuY2UoKTtcbiAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXJTUEkoY2FsbGJhY2ssIGNvbnRyb2xsZXIsIHRoaXMpO1xuXG4gICAgb2JzZXJ2ZXJzLnNldCh0aGlzLCBvYnNlcnZlcik7XG59O1xuXG4vLyBFeHBvc2UgcHVibGljIG1ldGhvZHMgb2YgUmVzaXplT2JzZXJ2ZXIuXG5bJ29ic2VydmUnLCAndW5vYnNlcnZlJywgJ2Rpc2Nvbm5lY3QnXS5mb3JFYWNoKGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICBSZXNpemVPYnNlcnZlci5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIChyZWYgPSBvYnNlcnZlcnMuZ2V0KHRoaXMpKVttZXRob2RdLmFwcGx5KHJlZiwgYXJndW1lbnRzKTtcbiAgICAgICAgdmFyIHJlZjtcbiAgICB9O1xufSk7XG5cbnZhciBpbmRleCA9IChmdW5jdGlvbiAoKSB7XG4gICAgLy8gRXhwb3J0IGV4aXN0aW5nIGltcGxlbWVudGF0aW9uIGlmIGF2YWlsYWJsZS5cbiAgICBpZiAodHlwZW9mIGdsb2JhbCQxLlJlc2l6ZU9ic2VydmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gZ2xvYmFsJDEuUmVzaXplT2JzZXJ2ZXI7XG4gICAgfVxuXG4gICAgcmV0dXJuIFJlc2l6ZU9ic2VydmVyO1xufSkoKTtcblxucmV0dXJuIGluZGV4O1xuXG59KSkpO1xuIiwiaW1wb3J0IHsgRXZlbnREaXNwYXRjaGVyIH0gZnJvbSBcIi4uL2dyaWQvZXZlbnRcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBEYXRhVGFibGUgZXh0ZW5kcyBFdmVudERpc3BhdGNoZXIge1xyXG4gICAgXHJcbiAgICBjb25zdHJ1Y3RvciAoZGF0YU1vZGVsLCBleHRlbnNpb24pIHtcclxuICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICB0aGlzLl9leHRlbnNpb24gPSBleHRlbnNpb247XHJcbiAgICAgICAgdGhpcy5faWRSdW5uZXIgPSAwO1xyXG4gICAgICAgIHRoaXMuX3JpZCA9IFtdO1xyXG4gICAgICAgIHRoaXMuX3Jvd01hcCA9IHt9O1xyXG4gICAgICAgIHRoaXMuX2RhdGEgPSBbXTtcclxuICAgICAgICB0aGlzLl9ibG9ja0V2ZW50ID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fcHJvY2Vzc2VkRXZlbnQgPSBbXTtcclxuXHJcbiAgICAgICAgbGV0IHsgZm9ybWF0LCBkYXRhLCBmaWVsZHMgfSA9IGRhdGFNb2RlbDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBTZXQgZGVmYXVsdCBmb3JtYXQgYXQgcm93c1xyXG4gICAgICAgIGlmICghZm9ybWF0KSB7XHJcbiAgICAgICAgICAgIGZvcm1hdCA9ICdyb3dzJztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fZGF0YUZvcm1hdCA9IGZvcm1hdDtcclxuICAgICAgICB0aGlzLl9maWVsZHMgPSBmaWVsZHM7XHJcblxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGRhdGEpKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGk9MDsgaTxkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZFJvdyhkYXRhW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2RhdGEgPSBbXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Um93Q291bnQgKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBnZXREYXRhIChyb3dJZCwgZmllbGQpIHtcclxuICAgICAgICBsZXQgcm93ID0gdGhpcy5fcm93TWFwW3Jvd0lkXTtcclxuICAgICAgICBpZiAocm93KSB7XHJcbiAgICAgICAgICAgIHJldHVybiByb3dbZmllbGRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIGdldERhdGFBdCAocm93SW5kZXgsIGZpZWxkKSB7XHJcbiAgICAgICAgbGV0IHJvdyA9IHRoaXMuX2RhdGFbcm93SW5kZXhdO1xyXG4gICAgICAgIGlmIChyb3cpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJvd1tmaWVsZF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Um93RGF0YSAocm93SWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcm93TWFwW3Jvd0lkXTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRSb3dEYXRhQXQgKHJvd0luZGV4KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGFbcm93SW5kZXhdO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFJvd0luZGV4IChyb3dJZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9yaWQuaW5kZXhPZihyb3dJZCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Um93SWQgKHJvd0luZGV4KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JpZFtyb3dJbmRleF07XHJcbiAgICB9XHJcblxyXG4gICAgc2V0RGF0YSAocm93SWQsIGZpZWxkLCB2YWx1ZSkge1xyXG4gICAgICAgIGNvbnN0IGJlZm9yZVVwZGF0ZUFyZyA9IHtcclxuXHRcdFx0cm93SWQ6IHJvd0lkLFxyXG5cdFx0XHRmaWVsZDogZmllbGQsXHJcblx0XHRcdGRhdGE6IHZhbHVlLFxyXG5cdFx0XHRjYW5jZWw6IGZhbHNlXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLl9wcm9jZXNzZWRFdmVudC5wdXNoKGJlZm9yZVVwZGF0ZUFyZyk7XHJcblxyXG4gICAgICAgIGxldCBibG9ja2VkID0gZmFsc2U7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCF0aGlzLl9ibG9ja0V2ZW50KSB7XHJcblx0XHRcdHRoaXMuX2Jsb2NrRXZlbnQgPSB0cnVlO1xyXG5cdFx0XHR0aGlzLl9leHRlbnNpb24uZXhlY3V0ZUV4dGVuc2lvbignZGF0YUJlZm9yZVVwZGF0ZScsIGJlZm9yZVVwZGF0ZUFyZyk7XHJcblx0XHRcdHRoaXMuX2Jsb2NrRXZlbnQgPSBmYWxzZTtcclxuXHRcdH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGJsb2NrZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcblx0XHRpZiAoIWJlZm9yZVVwZGF0ZUFyZy5jYW5jZWwpIHtcclxuICAgICAgICAgICAgbGV0IHJvdyA9IHRoaXMuX3Jvd01hcFtyb3dJZF07XHJcbiAgICAgICAgICAgIGlmIChyb3cpIHtcclxuICAgICAgICAgICAgICAgIHJvd1tmaWVsZF0gPSBiZWZvcmVVcGRhdGVBcmcuZGF0YTtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fYmxvY2tFdmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Jsb2NrRXZlbnQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V4dGVuc2lvbi5leGVjdXRlRXh0ZW5zaW9uKCdkYXRhQWZ0ZXJVcGRhdGUnLCBiZWZvcmVVcGRhdGVBcmcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Jsb2NrRXZlbnQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFibG9ja2VkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2V4dGVuc2lvbi5leGVjdXRlRXh0ZW5zaW9uKCdkYXRhRmluaXNoVXBkYXRlJywge1xyXG4gICAgICAgICAgICAgICAgdXBkYXRlczogdGhpcy5fcHJvY2Vzc2VkRXZlbnRcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vQ2xlYXIgcHJvY2Vzc2VkIGV2ZW50IGxpc3QgICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc2VkRXZlbnQubGVuZ3RoID0gMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0RGF0YUF0IChyb3dJbmRleCwgZmllbGQsIHZhbHVlKSB7XHJcbiAgICAgICAgY29uc3Qgcm93SWQgPSB0aGlzLl9yaWRbcm93SW5kZXhdO1xyXG4gICAgICAgIGlmIChyb3dJZCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0RGF0YShyb3dJZCwgZmllbGQsIHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYWRkUm93IChyb3dEYXRhKSB7XHJcbiAgICAgICAgY29uc3QgY291bnQgPSB0aGlzLmdldFJvd0NvdW50KCk7XHJcbiAgICAgICAgdGhpcy5pbnNlcnRSb3coY291bnQsIHJvd0RhdGEpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpbnNlcnRSb3cgKHJvd0luZGV4LCByb3dEYXRhKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2RhdGFGb3JtYXQgPT09ICdyb3dzJykge1xyXG4gICAgICAgICAgICBsZXQgcmlkID0gdGhpcy5fZ2VuZXJhdGVSb3dJZCgpO1xyXG4gICAgICAgICAgICB0aGlzLl9yaWQuc3BsaWNlKHJvd0luZGV4LCAwLCByaWQpO1xyXG4gICAgICAgICAgICB0aGlzLl9yb3dNYXBbcmlkXSA9IHJvd0RhdGE7XHJcbiAgICAgICAgICAgIHRoaXMuX2RhdGEuc3BsaWNlKHJvd0luZGV4LCAwLCByb3dEYXRhKTtcclxuICAgICAgICB9IGVsc2VcclxuICAgICAgICBpZiAodGhpcy5fZGF0YUZvcm1hdCA9PT0gJ2FycmF5Jykge1xyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLl9maWVsZHMpKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmlkID0gdGhpcy5fZ2VuZXJhdGVSb3dJZCgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmlkLnNwbGljZShyb3dJbmRleCwgMCwgcmlkKTtcclxuICAgICAgICAgICAgICAgIGxldCBuZXdPYmogPSB0aGlzLl9jcmVhdGVPYmplY3Qocm93RGF0YSwgdGhpcy5fZmllbGRzKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Jvd01hcFtyaWRdID0gbmV3T2JqO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZGF0YS5zcGxpY2Uocm93SW5kZXgsIDAsIG5ld09iaik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlUm93IChyaWQpIHsgXHJcbiAgICAgICAgbGV0IHJvdyA9IHRoaXMuX3Jvd01hcFtyaWRdO1xyXG4gICAgICAgIGxldCBpbmRleCA9IHRoaXMuX2RhdGEuaW5kZXhPZihyb3cpO1xyXG4gICAgICAgIHRoaXMuX2RhdGEuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICBkZWxldGUgdGhpcy5fcm93TWFwW3JpZF07XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlUm93QXQgKGluZGV4KSB7XHJcbiAgICAgICAgbGV0IHJpZCA9IE9iamVjdC5rZXlzKHRoaXMuX3Jvd01hcCkuZmluZChrZXkgPT4gb2JqZWN0W2tleV0gPT09IHZhbHVlKTtcclxuICAgICAgICBkZWxldGUgdGhpcy5fcm93TWFwW3JpZF07XHJcbiAgICAgICAgdGhpcy5fZGF0YS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIF9nZW5lcmF0ZVJvd0lkICgpIHtcclxuICAgICAgICB0aGlzLl9pZFJ1bm5lcisrO1xyXG4gICAgICAgIHJldHVybiAnJyArIHRoaXMuX2lkUnVubmVyO1xyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVPYmplY3QoYXJyYXlWYWx1ZXMsIGZpZWxkcykge1xyXG4gICAgICAgIGxldCBuZXdPYmogPSB7fTtcclxuICAgICAgICBmb3IgKGxldCBpPTA7IGk8ZmllbGRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIG5ld09ialtmaWVsZHNbaV1dID0gYXJyYXlWYWx1ZXNbaV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBuZXdPYmo7XHJcbiAgICB9XHJcblxyXG59IiwiZXhwb3J0IGNsYXNzIENvcHlQYXN0ZUV4dGVuc2lvbiB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5fZ2xvYmFsQ2xpcGJvYXJkID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG5cdGluaXQgKGdyaWQsIGNvbmZpZykge1xyXG5cdFx0dGhpcy5fZ3JpZCA9IGdyaWQ7XHJcblx0XHR0aGlzLl9jb25maWcgPSBjb25maWc7XHJcblx0fVxyXG5cclxuXHRrZXlEb3duIChlKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2dsb2JhbENsaXBib2FyZCAmJiBlLmN0cmxLZXkpIHtcclxuICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnYycpIHtcclxuICAgICAgICAgICAgICAgIGxldCBkYXRhID0gdGhpcy5fY29weSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xpcGJvYXJkRGF0YS5zZXREYXRhKCd0ZXh0JywgZGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICBpZiAoZS5rZXkgPT09ICd2Jykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcGFzdGUod2luZG93LmNsaXBib2FyZERhdGEuZ2V0RGF0YSgndGV4dCcpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBncmlkQWZ0ZXJSZW5kZXIoZSkge1xyXG4gICAgICAgIGlmICghd2luZG93LmNsaXBib2FyZERhdGEpIHtcclxuICAgICAgICAgICAgdGhpcy5fZ3JpZC52aWV3LmdldEVsZW1lbnQoKS5hZGRFdmVudExpc3RlbmVyKCdwYXN0ZScsIChwYXN0ZUV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXN0ZShwYXN0ZUV2ZW50LmNsaXBib2FyZERhdGEuZ2V0RGF0YSgndGV4dCcpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuX2dyaWQudmlldy5nZXRFbGVtZW50KCkuYWRkRXZlbnRMaXN0ZW5lcignY29weScsIChjb3B5RXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBkYXRhID0gdGhpcy5fY29weSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb3B5RXZlbnQuY2xpcGJvYXJkRGF0YS5zZXREYXRhKCd0ZXh0L3BsYWluJywgZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29weUV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLl9nbG9iYWxDbGlwYm9hcmQgPSBmYWxzZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9nbG9iYWxDbGlwYm9hcmQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY29weShjbGlwYm9hcmREYXRhKSB7XHJcbiAgICAgICAgbGV0IHNlbGVjdGlvbiA9IHRoaXMuX2dyaWQuc3RhdGUuZ2V0KCdzZWxlY3Rpb24nKTtcclxuICAgICAgICBpZiAoc2VsZWN0aW9uICYmIHNlbGVjdGlvbi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGxldCBzID0gc2VsZWN0aW9uWzBdO1xyXG4gICAgICAgICAgICBsZXQgcm93cyA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpPTA7IGk8cy5oOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGxldCBjb2xzID0gW107XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqPTA7IGo8cy53OyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xzLnB1c2godGhpcy5fZ3JpZC5kYXRhLmdldERhdGFBdChzLnIgKyBpLCBzLmMgKyBqKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByb3dzLnB1c2goY29scy5qb2luKCdcXHQnKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJvd3Muam9pbignXFxuJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9wYXN0ZShkYXRhKSB7XHJcbiAgICAgICAgaWYgKGRhdGEpIHtcclxuICAgICAgICAgICAgZGF0YSA9IGRhdGEucmVwbGFjZSgvXFxuJC9nLCAnJyk7XHJcbiAgICAgICAgICAgIGxldCBzZWxlY3Rpb24gPSB0aGlzLl9ncmlkLnN0YXRlLmdldCgnc2VsZWN0aW9uJyk7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3Rpb24gJiYgc2VsZWN0aW9uLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGxldCBzID0gc2VsZWN0aW9uWzBdO1xyXG4gICAgICAgICAgICAgICAgbGV0IHJvd3MgPSBkYXRhLnNwbGl0KCdcXG4nKTtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGk9MDsgaTxyb3dzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNvbHMgPSByb3dzW2ldLnNwbGl0KCdcXHQnKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqPTA7IGo8Y29scy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcGFzdGVSb3cgPSAgcy5yICsgaTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHBhc3RlQ29sID0gcy5jICsgajtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2dyaWQubW9kZWwuY2FuRWRpdChwYXN0ZVJvdywgcGFzdGVDb2wpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ncmlkLmRhdGEuc2V0RGF0YUF0KHBhc3RlUm93LCBwYXN0ZUNvbCwgY29sc1tqXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ncmlkLnZpZXcudXBkYXRlQ2VsbChwYXN0ZVJvdywgcGFzdGVDb2wpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufSIsImV4cG9ydCBjbGFzcyBFZGl0b3JFeHRlbnNpb24ge1xyXG5cclxuXHRpbml0IChncmlkLCBjb25maWcpIHtcclxuXHRcdHRoaXMuX2dyaWQgPSBncmlkO1xyXG5cdFx0dGhpcy5fY29uZmlnID0gY29uZmlnO1xyXG5cdFx0dGhpcy5fZWRpdG9yQXR0YWNoZWQgPSBmYWxzZTtcclxuXHR9XHJcblxyXG5cdGtleURvd24gKGUpIHtcclxuXHRcdGlmICghdGhpcy5fZWRpdG9yQXR0YWNoZWQpIHtcclxuXHRcdFx0aWYgKCFlLmN0cmxLZXkpIHtcclxuXHRcdFx0XHRsZXQgc2VsZWN0aW9uID0gdGhpcy5fZ3JpZC5zdGF0ZS5nZXQoJ3NlbGVjdGlvbicpO1xyXG5cdFx0XHRcdGlmIChzZWxlY3Rpb24gJiYgc2VsZWN0aW9uLmxlbmd0aCA+IDApIHtcclxuXHRcdFx0XHRcdGxldCByb3dJbmRleCA9IHNlbGVjdGlvblswXS5yO1xyXG5cdFx0XHRcdFx0bGV0IGNvbEluZGV4ID0gc2VsZWN0aW9uWzBdLmM7XHJcblx0XHRcdFx0XHRsZXQgZWRpdCA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0aWYgKGUua2V5Q29kZSA9PT0gMTMgfHwgKGUua2V5Q29kZSA+IDMxICYmICEoZS5rZXlDb2RlID49IDM3ICYmIGUua2V5Q29kZSA8PSA0MCkpKSB7XHJcblx0XHRcdFx0XHRcdGVkaXQgPSB0cnVlO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYgKGVkaXQgJiZcclxuXHRcdFx0XHRcdFx0cm93SW5kZXggPj0gMCAmJiByb3dJbmRleCA8IHRoaXMuX2dyaWQubW9kZWwuZ2V0Um93Q291bnQoKSAmJlxyXG5cdFx0XHRcdFx0XHRjb2xJbmRleCA+PSAwICYmIGNvbEluZGV4IDwgdGhpcy5fZ3JpZC5tb2RlbC5nZXRDb2x1bW5Db3VudCgpKSB7XHJcblx0XHRcdFx0XHRcdGxldCBjZWxsID0gdGhpcy5fZ3JpZC52aWV3LmdldENlbGwocm93SW5kZXgsIGNvbEluZGV4KTtcclxuXHRcdFx0XHRcdFx0aWYgKGNlbGwpIHtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLl9lZGl0Q2VsbChjZWxsKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVx0XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRjZWxsQWZ0ZXJSZW5kZXIgKGUpIHtcclxuXHRcdGUuY2VsbC5hZGRFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIChlKSA9PiB7XHJcblx0XHRcdGxldCBhY3R1YWxDZWxsID0gZS50YXJnZXQ7XHJcblx0XHRcdGlmIChhY3R1YWxDZWxsKSB7XHJcblx0XHRcdFx0dGhpcy5fZWRpdENlbGwoYWN0dWFsQ2VsbCk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0X2VkaXRDZWxsIChjZWxsKSB7XHJcblx0XHRsZXQgYWN0dWFsQ2VsbCA9IGNlbGw7XHJcblx0XHRsZXQgYWN0dWFsUm93ID0gcGFyc2VJbnQoYWN0dWFsQ2VsbC5kYXRhc2V0LnJvd0luZGV4KTtcclxuXHRcdGxldCBhY3R1YWxDb2wgPSBwYXJzZUludChhY3R1YWxDZWxsLmRhdGFzZXQuY29sSW5kZXgpO1xyXG5cdFx0aWYgKHRoaXMuX2dyaWQubW9kZWwuY2FuRWRpdChhY3R1YWxSb3csIGFjdHVhbENvbCkpIHtcclxuXHRcdFx0Ly9HZXQgZGF0YSB0byBiZSBlZGl0ZWRcclxuXHRcdFx0bGV0IGRhdGEgPSB0aGlzLl9ncmlkLm1vZGVsLmdldERhdGFBdChhY3R1YWxSb3csIGFjdHVhbENvbCk7XHJcblxyXG5cdFx0XHQvL0lmIHRoZXJlJ3MgY3VzdG9tIGVkaXRvciwgdXNlIGN1c3RvbSBlZGl0b3IgdG8gYXR0YWNoIHRoZSBlZGl0b3JcclxuXHRcdFx0dGhpcy5fZ3JpZC5zdGF0ZS5zZXQoJ2VkaXRpbmcnLCB0cnVlKTtcclxuXHRcdFx0bGV0IGN1c3RvbUVkaXRvciA9IHRoaXMuX2dyaWQubW9kZWwuZ2V0Q2FzY2FkZWRDZWxsUHJvcChhY3R1YWxDZWxsLmRhdGFzZXQucm93SW5kZXgsIGFjdHVhbENlbGwuZGF0YXNldC5jb2xJbmRleCwgJ2VkaXRvcicpO1xyXG5cdFx0XHRpZiAoY3VzdG9tRWRpdG9yICYmIGN1c3RvbUVkaXRvci5hdHRhY2gpIHtcclxuXHRcdFx0XHRjdXN0b21FZGl0b3IuYXR0YWNoKGFjdHVhbENlbGwsIGRhdGEsIHRoaXMuX2RvbmUuYmluZCh0aGlzKSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5fYXR0YWNoRWRpdG9yKGFjdHVhbENlbGwsIGRhdGEsIHRoaXMuX2RvbmUuYmluZCh0aGlzKSk7XHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy5fZWRpdG9yQXR0YWNoZWQgPSB0cnVlO1xyXG5cdFx0XHR0aGlzLl9lZGl0aW5nQ29sID0gYWN0dWFsQ29sO1xyXG5cdFx0XHR0aGlzLl9lZGl0aW5nUm93ID0gYWN0dWFsUm93O1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0X2F0dGFjaEVkaXRvciAoY2VsbCwgZGF0YSwgZG9uZSkge1xyXG5cdFx0aWYgKCF0aGlzLl9pbnB1dEVsZW1lbnQpIHtcclxuXHRcdFx0bGV0IGNlbGxCb3VuZCA9IGNlbGwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC50eXBlID0gJ3RleHQnO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQudmFsdWUgPSBkYXRhO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQuc3R5bGUud2lkdGggPSAoY2VsbEJvdW5kLndpZHRoLTYpICsgJ3B4JztcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LnN0eWxlLmhlaWdodCA9IChjZWxsQm91bmQuaGVpZ2h0LTMpICsgJ3B4JztcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LmNsYXNzTmFtZSA9ICdwZ3JpZC1jZWxsLXRleHQtZWRpdG9yJztcclxuXHRcdFx0Y2VsbC5pbm5lckhUTUwgPSAnJztcclxuXHRcdFx0Y2VsbC5hcHBlbmRDaGlsZCh0aGlzLl9pbnB1dEVsZW1lbnQpO1xyXG5cclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LmZvY3VzKCk7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5zZWxlY3QoKTtcclxuXHJcblx0XHRcdHRoaXMuX2Fycm93S2V5TG9ja2VkID0gZmFsc2U7XHJcblxyXG5cdFx0XHR0aGlzLl9rZXlkb3duSGFuZGxlciA9IChlKSA9PiB7XHJcblx0XHRcdFx0c3dpdGNoIChlLmtleUNvZGUpIHtcclxuXHRcdFx0XHRcdGNhc2UgMTM6IC8vRW50ZXJcclxuXHRcdFx0XHRcdFx0ZG9uZShlLnRhcmdldC52YWx1ZSk7XHJcblx0XHRcdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0XHRjYXNlIDI3OiAvL0VTQ1xyXG5cdFx0XHRcdFx0XHRkb25lKCk7XHJcblx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRcdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0XHRjYXNlIDQwOiAvL0Rvd25cclxuXHRcdFx0XHRcdGNhc2UgMzg6IC8vVXBcclxuXHRcdFx0XHRcdGNhc2UgMzc6IC8vTGVmdFxyXG5cdFx0XHRcdFx0Y2FzZSAzOTogLy9SaWdodFxyXG5cdFx0XHRcdFx0XHRpZiAoIXRoaXMuX2Fycm93S2V5TG9ja2VkKSB7XHJcblx0XHRcdFx0XHRcdFx0ZG9uZShlLnRhcmdldC52YWx1ZSk7XHJcblx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cdFx0XHR0aGlzLl9rZXlkb3duSGFuZGxlciA9IHRoaXMuX2tleWRvd25IYW5kbGVyLmJpbmQodGhpcyk7XHJcblxyXG5cdFx0XHR0aGlzLl9ibHVySGFuZGxlciA9IChlKSA9PiB7XHJcblx0XHRcdFx0ZG9uZShlLnRhcmdldC52YWx1ZSk7XHJcblx0XHRcdH07XHJcblx0XHRcdHRoaXMuX2JsdXJIYW5kbGVyID0gdGhpcy5fYmx1ckhhbmRsZXIuYmluZCh0aGlzKTtcclxuXHJcblx0XHRcdHRoaXMuX2NsaWNrSGFuZGxlciA9IChlKSA9PiB7XHJcblx0XHRcdFx0dGhpcy5fYXJyb3dLZXlMb2NrZWQgPSB0cnVlO1xyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9rZXlkb3duSGFuZGxlcik7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5fYmx1ckhhbmRsZXIpO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9jbGlja0hhbmRsZXIpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0X2RldGFjaEVkaXRvciAoKSB7XHJcblx0XHRpZiAodGhpcy5faW5wdXRFbGVtZW50KSB7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fa2V5ZG93bkhhbmRsZXIpO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMuX2JsdXJIYW5kbGVyKTtcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fY2xpY2tIYW5kbGVyKTtcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5faW5wdXRFbGVtZW50KTtcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50ID0gbnVsbDtcclxuXHRcdFx0dGhpcy5fa2V5ZG93bkhhbmRsZXIgPSBudWxsO1xyXG5cdFx0XHR0aGlzLl9ibHVySGFuZGxlciA9IG51bGw7XHJcblx0XHRcdHRoaXMuX2NsaWNrSGFuZGxlciA9IG51bGw7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRfZG9uZSAocmVzdWx0KSB7XHJcblx0XHR0aGlzLl9kZXRhY2hFZGl0b3IoKTtcclxuXHRcdGlmIChyZXN1bHQgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHR0aGlzLl9ncmlkLm1vZGVsLnNldERhdGFBdCh0aGlzLl9lZGl0aW5nUm93LCB0aGlzLl9lZGl0aW5nQ29sLCByZXN1bHQpO1xyXG5cdFx0fVxyXG5cdFx0dGhpcy5fZ3JpZC52aWV3LnVwZGF0ZUNlbGwodGhpcy5fZWRpdGluZ1JvdywgdGhpcy5fZWRpdGluZ0NvbCk7XHJcblx0XHR0aGlzLl9lZGl0aW5nUm93ID0gLTE7XHJcblx0XHR0aGlzLl9lZGl0aW5nQ29sID0gLTE7XHJcblx0XHR0aGlzLl9lZGl0b3JBdHRhY2hlZCA9IGZhbHNlO1xyXG5cdFx0dGhpcy5fZ3JpZC5zdGF0ZS5zZXQoJ2VkaXRpbmcnLCBmYWxzZSk7XHJcblxyXG5cdFx0Ly9SZS1mb2N1cyBhdCB0aGUgZ3JpZFxyXG5cdFx0dGhpcy5fZ3JpZC52aWV3LmdldEVsZW1lbnQoKS5mb2N1cygpO1xyXG5cdH1cclxuXHJcbn0iLCJleHBvcnQgY2xhc3MgU2VsZWN0aW9uRXh0ZW5zaW9uIHtcclxuXHJcblx0aW5pdCAoZ3JpZCwgY29uZmlnKSB7XHJcblx0XHR0aGlzLl9ncmlkID0gZ3JpZDtcclxuXHRcdHRoaXMuX2NvbmZpZyA9IGNvbmZpZztcclxuXHRcdHRoaXMuX2N1cnJlbnRTZWxlY3Rpb24gPSBudWxsO1xyXG5cdFx0dGhpcy5fc2VsZWN0aW9uQ2xhc3MgPSAodGhpcy5fY29uZmlnLnNlbGVjdGlvbiAmJiB0aGlzLl9jb25maWcuc2VsZWN0aW9uLmNzc0NsYXNzKT90aGlzLl9jb25maWcuc2VsZWN0aW9uLmNzc0NsYXNzOidwZ3JpZC1jZWxsLXNlbGVjdGlvbic7XHJcblx0fVxyXG5cclxuXHRrZXlEb3duIChlKSB7XHJcblx0XHRsZXQgZWRpdGluZyA9IHRoaXMuX2dyaWQuc3RhdGUuZ2V0KCdlZGl0aW5nJyk7XHJcblx0XHRpZiAoZWRpdGluZykge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRsZXQgc2VsZWN0aW9uID0gdGhpcy5fZ3JpZC5zdGF0ZS5nZXQoJ3NlbGVjdGlvbicpO1xyXG5cdFx0aWYgKHNlbGVjdGlvbiAmJiBzZWxlY3Rpb24ubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRsZXQgcm93SW5kZXggPSBzZWxlY3Rpb25bMF0ucjtcclxuXHRcdFx0bGV0IGNvbEluZGV4ID0gc2VsZWN0aW9uWzBdLmM7XHJcblx0XHRcdGxldCBhbGlnblRvcCA9IHRydWU7XHJcblx0XHRcdHN3aXRjaCAoZS5rZXlDb2RlKSB7XHJcblx0XHRcdFx0Y2FzZSA0MDogLy9Eb3duXHJcblx0XHRcdFx0XHRyb3dJbmRleCsrO1xyXG5cdFx0XHRcdFx0YWxpZ25Ub3AgPSBmYWxzZTtcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdGNhc2UgMzg6IC8vVXBcclxuXHRcdFx0XHRcdHJvd0luZGV4LS07XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRjYXNlIDM3OiAvL0xlZnRcclxuXHRcdFx0XHRcdGNvbEluZGV4LS07XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRjYXNlIDM5OiAvL1JpZ2h0XHJcblx0XHRcdFx0Y2FzZSA5OiAvL1RhYlxyXG5cdFx0XHRcdFx0Y29sSW5kZXgrKztcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdGRlZmF1bHQ6XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHJvd0luZGV4ID49IDAgJiYgcm93SW5kZXggPCB0aGlzLl9ncmlkLm1vZGVsLmdldFJvd0NvdW50KCkgJiZcclxuXHRcdFx0XHRjb2xJbmRleCA+PSAwICYmIGNvbEluZGV4IDwgdGhpcy5fZ3JpZC5tb2RlbC5nZXRDb2x1bW5Db3VudCgpKSB7XHJcblx0XHRcdFx0Y29uc3QgaXNIZWFkZXIgPSB0aGlzLl9ncmlkLm1vZGVsLmlzSGVhZGVyUm93KHJvd0luZGV4KTtcclxuXHRcdFx0XHRjb25zdCByb3dNb2RlbCA9IHRoaXMuX2dyaWQubW9kZWwuZ2V0Um93TW9kZWwocm93SW5kZXgpO1xyXG5cdFx0XHRcdGlmICghcm93TW9kZWwgfHwgIWlzSGVhZGVyKSB7XHJcblx0XHRcdFx0XHRsZXQgY2VsbCA9IHRoaXMuX2dyaWQudmlldy5nZXRDZWxsKHJvd0luZGV4LCBjb2xJbmRleCk7XHJcblx0XHRcdFx0XHRpZiAoY2VsbCkge1xyXG5cdFx0XHRcdFx0XHR0aGlzLl9zZWxlY3RDZWxsKGNlbGwsIHJvd0luZGV4LCBjb2xJbmRleCk7XHJcblx0XHRcdFx0XHRcdHRoaXMuX2dyaWQudmlldy5zY3JvbGxUb0NlbGwocm93SW5kZXgsIGNvbEluZGV4LCBhbGlnblRvcCk7XHJcblx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGNlbGxBZnRlclJlbmRlciAoZSkge1xyXG5cdFx0ZS5jZWxsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB7XHJcblx0XHRcdGNvbnN0IGFjdHVhbENlbGwgPSBlLnRhcmdldDtcclxuXHRcdFx0Y29uc3QgYWN0dWFsUm93ID0gcGFyc2VJbnQoYWN0dWFsQ2VsbC5kYXRhc2V0LnJvd0luZGV4KTtcclxuXHRcdFx0Y29uc3QgYWN0dWFsQ29sID0gcGFyc2VJbnQoYWN0dWFsQ2VsbC5kYXRhc2V0LmNvbEluZGV4KTtcclxuXHRcdFx0Y29uc3Qgcm93TW9kZWwgPSB0aGlzLl9ncmlkLm1vZGVsLmdldFJvd01vZGVsKGFjdHVhbFJvdyk7XHJcblx0XHRcdGNvbnN0IGlzSGVhZGVyID0gdGhpcy5fZ3JpZC5tb2RlbC5pc0hlYWRlclJvdyhhY3R1YWxSb3cpO1xyXG5cdFx0XHRpZiAoIXJvd01vZGVsIHx8ICFpc0hlYWRlcikge1xyXG5cdFx0XHRcdGlmIChhY3R1YWxDZWxsLmNsYXNzTGlzdC5jb250YWlucygncGdyaWQtY2VsbCcpKSB7XHJcblx0XHRcdFx0XHR0aGlzLl9zZWxlY3RDZWxsKGFjdHVhbENlbGwsIGFjdHVhbFJvdywgYWN0dWFsQ29sKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0X3NlbGVjdENlbGwgKGNlbGwsIHJvd0luZGV4LCBjb2xJbmRleCkge1xyXG5cdFx0Ly9DbGVhciBvbGQgc2VsZWN0aW9uXHJcblx0XHRpZiAodGhpcy5fY3VycmVudFNlbGVjdGlvbiAmJiB0aGlzLl9jdXJyZW50U2VsZWN0aW9uICE9PSBjZWxsKSB7XHJcblx0XHRcdHRoaXMuX2N1cnJlbnRTZWxlY3Rpb24uY2xhc3NMaXN0LnJlbW92ZSh0aGlzLl9zZWxlY3Rpb25DbGFzcyk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly9TZXQgc2VsZWN0aW9uXHJcblx0XHR0aGlzLl9jdXJyZW50U2VsZWN0aW9uID0gY2VsbDtcclxuXHRcdHRoaXMuX2N1cnJlbnRTZWxlY3Rpb24uY2xhc3NMaXN0LmFkZCh0aGlzLl9zZWxlY3Rpb25DbGFzcyk7XHJcblx0XHR0aGlzLl9ncmlkLnZpZXcuZ2V0RWxlbWVudCgpLmZvY3VzKCk7XHJcblxyXG5cdFx0Ly9TdG9yZSBzZWxlY3Rpb24gc3RhdGVcclxuXHRcdGxldCBzZWxlY3Rpb24gPSB0aGlzLl9ncmlkLnN0YXRlLmdldCgnc2VsZWN0aW9uJyk7XHJcblx0XHRpZiAoIXNlbGVjdGlvbikge1xyXG5cdFx0XHRzZWxlY3Rpb24gPSBbXTtcclxuXHRcdFx0dGhpcy5fZ3JpZC5zdGF0ZS5zZXQoJ3NlbGVjdGlvbicsIHNlbGVjdGlvbik7XHJcblx0XHR9XHJcblx0XHRzZWxlY3Rpb24ubGVuZ3RoID0gMDtcclxuXHRcdHNlbGVjdGlvbi5wdXNoKHtcclxuXHRcdFx0cjogcm93SW5kZXgsXHJcblx0XHRcdGM6IGNvbEluZGV4LFxyXG5cdFx0XHR3OiAxLFxyXG5cdFx0XHRoOiAxXHJcblx0XHR9KTtcclxuXHJcblx0fVxyXG5cclxufSIsImV4cG9ydCBjbGFzcyBWaWV3VXBkYXRlckV4dGVuc2lvbiB7XHJcblxyXG4gICAgaW5pdCAoZ3JpZCwgY29uZmlnKSB7XHJcblx0XHR0aGlzLl9ncmlkID0gZ3JpZDtcclxuXHRcdHRoaXMuX2NvbmZpZyA9IGNvbmZpZztcclxuXHR9XHJcblxyXG4gICAgZGF0YUZpbmlzaFVwZGF0ZSAoZSkge1xyXG4gICAgICAgIGxldCByb3dJbmRleENhY2hlID0ge307XHJcbiAgICAgICAgbGV0IGNvbEluZGV4Q2FjaGUgPSB7fTtcclxuICAgICAgICBmb3IgKGxldCBpPTA7IGk8ZS51cGRhdGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCB7cm93SWQsIGZpZWxkfSA9IGUudXBkYXRlc1tpXTtcclxuICAgICAgICAgICAgbGV0IHJvd0luZGV4ID0gbnVsbDtcclxuICAgICAgICAgICAgbGV0IGNvbEluZGV4ID0gbnVsbDtcclxuICAgICAgICAgICAgaWYgKHJvd0luZGV4Q2FjaGVbcm93SWRdKSB7XHJcbiAgICAgICAgICAgICAgICByb3dJbmRleCA9IHJvd0luZGV4Q2FjaGVbcm93SWRdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcm93SW5kZXggPSB0aGlzLl9ncmlkLm1vZGVsLmdldFJvd0luZGV4KHJvd0lkKTtcclxuICAgICAgICAgICAgICAgIHJvd0luZGV4Q2FjaGVbcm93SWRdID0gcm93SW5kZXg7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChjb2xJbmRleENhY2hlW2ZpZWxkXSkge1xyXG4gICAgICAgICAgICAgICAgY29sSW5kZXggPSBjb2xJbmRleENhY2hlW2ZpZWxkXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbEluZGV4ID0gdGhpcy5fZ3JpZC5tb2RlbC5nZXRDb2x1bW5JbmRleChmaWVsZCk7XHJcbiAgICAgICAgICAgICAgICBjb2xJbmRleENhY2hlW3Jvd0lkXSA9IGNvbEluZGV4OyAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLl9ncmlkLnZpZXcudXBkYXRlQ2VsbChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn0iLCJleHBvcnQgY2xhc3MgRXZlbnREaXNwYXRjaGVyIHtcclxuXHJcblx0Y29uc3RydWN0b3IoKSB7XHJcblx0XHR0aGlzLl9oYW5kbGVycyA9IHt9O1xyXG5cdH1cclxuXHJcblx0bGlzdGVuKGV2ZW50TmFtZSwgaGFuZGxlcikge1xyXG5cdFx0aWYgKCF0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdKSB7XHJcblx0XHRcdHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0gPSBbXTtcclxuXHRcdH1cclxuXHRcdHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0ucHVzaChoYWRubGVyKTtcclxuXHR9XHJcblxyXG5cdHVubGlzdGVuKGV2ZW50TmFtZSwgaGFuZGxlcikge1xyXG5cdFx0aWYgKHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0pIHtcclxuXHRcdFx0bGV0IGluZGV4ID0gdGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXS5pbmRleE9mKGhhbmRsZXIpO1xyXG5cdFx0XHRpZiAoaW5kZXggPiAtMSkge1xyXG5cdFx0XHRcdHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0aGFzTGlzdGVuZXIoZXZlbnROYW1lKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXSAmJiB0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdLmxlbmd0aCA+IDA7XHJcblx0fVxyXG5cclxuXHRkaXNwYXRjaChldmVudE5hbWUsIGV2ZW50QXJnKSB7XHJcblx0XHRpZiAodGhpcy5oYXNMaXN0ZW5lcihldmVudE5hbWUpKSB7XHJcblx0XHRcdGxldCBsaXN0ZW5lcnMgPSB0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdO1xyXG5cdFx0XHRmb3IgKGxldCBpPTA7IGk8bGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0bGlzdGVuZXJzW2ldKGV2ZW50QXJnKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn0iLCJleHBvcnQgY2xhc3MgRXh0ZW5zaW9uIHtcclxuXHJcblx0Y29uc3RydWN0b3IgKGdyaWQsIGNvbmZpZykge1xyXG5cdFx0dGhpcy5fZ3JpZCA9IGdyaWQ7XHJcblx0XHR0aGlzLl9jb25maWcgPSBjb25maWc7XHJcblxyXG5cdFx0dGhpcy5fZXh0ZW5zaW9ucyA9IHtcclxuXHRcdFx0Y2VsbFJlbmRlcjogW10sXHJcblx0XHRcdGNlbGxBZnRlclJlbmRlcjogW10sXHJcblx0XHRcdGNlbGxVcGRhdGU6IFtdLFxyXG5cdFx0XHRjZWxsQWZ0ZXJVcGRhdGU6IFtdLFxyXG5cdFx0XHRrZXlEb3duOiBbXSxcclxuXHRcdFx0Z3JpZEFmdGVyUmVuZGVyOiBbXSxcclxuXHRcdFx0ZGF0YUJlZm9yZVJlbmRlcjogW10sXHJcblx0XHRcdGRhdGFCZWZvcmVVcGRhdGU6IFtdLFxyXG5cdFx0XHRkYXRhQWZ0ZXJVcGRhdGU6IFtdLFxyXG5cdFx0XHRkYXRhRmluaXNoVXBkYXRlOiBbXVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0bG9hZEV4dGVuc2lvbiAoZXh0KSB7XHJcblx0XHRpZiAoZXh0Wydpbml0J10pIHtcclxuXHRcdFx0ZXh0Wydpbml0J10odGhpcy5fZ3JpZCwgdGhpcy5fY29uZmlnKTtcclxuXHRcdH1cclxuXHRcdGZvciAobGV0IGV4dFBvaW50IGluIHRoaXMuX2V4dGVuc2lvbnMpIHtcclxuXHRcdFx0aWYgKGV4dFtleHRQb2ludF0pIHtcclxuXHRcdFx0XHR0aGlzLl9leHRlbnNpb25zW2V4dFBvaW50XS5wdXNoKGV4dCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGhhc0V4dGVuc2lvbiAoZXh0UG9pbnQpIHtcclxuXHRcdHJldHVybiAodGhpcy5fZXh0ZW5zaW9uc1tleHRQb2ludF0gJiYgdGhpcy5fZXh0ZW5zaW9uc1tleHRQb2ludF0ubGVuZ3RoID4gMClcclxuXHR9XHJcblxyXG5cdHF1ZXJ5RXh0ZW5zaW9uIChleHRQb2ludCkge1xyXG5cdFx0aWYgKHRoaXMuX2V4dGVuc2lvbnNbZXh0UG9pbnRdKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLl9leHRlbnNpb25zW2V4dFBvaW50XTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiBbXTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGV4ZWN1dGVFeHRlbnNpb24gKGV4dFBvaW50KSB7XHJcblx0XHR0aGlzLnF1ZXJ5RXh0ZW5zaW9uKGV4dFBvaW50KS5mb3JFYWNoKChleHQpID0+IHtcclxuXHRcdFx0ZXh0W2V4dFBvaW50XS5hcHBseShleHQsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxufSIsImltcG9ydCB7IFZpZXcgfSBmcm9tICcuL3ZpZXcnO1xyXG5pbXBvcnQgeyBNb2RlbCB9IGZyb20gJy4vbW9kZWwnO1xyXG5pbXBvcnQgeyBEYXRhVGFibGUgfSBmcm9tICcuLi9kYXRhL3RhYmxlJztcclxuaW1wb3J0IHsgRXh0ZW5zaW9uIH0gZnJvbSAnLi9leHRlbnNpb24nO1xyXG5pbXBvcnQgeyBTdGF0ZSB9IGZyb20gJy4vc3RhdGUnO1xyXG5pbXBvcnQgeyBFdmVudERpc3BhdGNoZXIgfSBmcm9tICcuL2V2ZW50JztcclxuaW1wb3J0IHsgVXRpbHMgfSBmcm9tICcuL3V0aWxzJztcclxuXHJcbmltcG9ydCB7IFNlbGVjdGlvbkV4dGVuc2lvbiB9IGZyb20gJy4uL2V4dGVuc2lvbnMvc2VsZWN0aW9uJztcclxuaW1wb3J0IHsgRWRpdG9yRXh0ZW5zaW9uIH0gZnJvbSAnLi4vZXh0ZW5zaW9ucy9lZGl0b3InO1xyXG5pbXBvcnQgeyBDb3B5UGFzdGVFeHRlbnNpb24gfSBmcm9tICcuLi9leHRlbnNpb25zL2NvcHlwYXN0ZSc7XHJcbmltcG9ydCB7IFZpZXdVcGRhdGVyRXh0ZW5zaW9uIH0gZnJvbSAnLi4vZXh0ZW5zaW9ucy92aWV3LXVwZGF0ZXInO1xyXG5cclxuZXhwb3J0IGNsYXNzIFBHcmlkIGV4dGVuZHMgRXZlbnREaXNwYXRjaGVyIHtcclxuXHJcblx0Y29uc3RydWN0b3IoY29uZmlnKSB7XHJcblx0XHRzdXBlcigpO1xyXG5cclxuXHRcdC8vTWVyZ2UgY29uZmlnIHdpdGggZGVmYXVsdCBjb25maWdcclxuXHRcdGxldCBkZWZhdWx0Q29uZmlnID0ge1xyXG5cdFx0XHRyb3dDb3VudDogMCxcclxuXHRcdFx0aGVhZGVyUm93Q291bnQ6IDEsXHJcblx0XHRcdGZvb3RlclJvd0NvdW50OiAwLFxyXG5cdFx0XHRjb2x1bW5Db3VudDogMCxcclxuXHRcdFx0cm93SGVpZ2h0OiAzMixcclxuXHRcdFx0Y29sdW1uV2lkdGg6IDEwMFxyXG5cdFx0fTtcclxuXHRcdHRoaXMuX2NvbmZpZyA9IFV0aWxzLm1peGluKGNvbmZpZywgZGVmYXVsdENvbmZpZyk7XHJcblxyXG5cdFx0Ly9FeHRlbnNpb25zIFN0b3JlXHJcblx0XHR0aGlzLl9leHRlbnNpb25zID0gbmV3IEV4dGVuc2lvbih0aGlzLCB0aGlzLl9jb25maWcpO1xyXG5cclxuXHRcdHRoaXMuX2RhdGEgPSBuZXcgRGF0YVRhYmxlKHRoaXMuX2NvbmZpZy5kYXRhTW9kZWwsIHRoaXMuX2V4dGVuc2lvbnMpO1xyXG5cdFx0dGhpcy5fbW9kZWwgPSBuZXcgTW9kZWwodGhpcy5fY29uZmlnLCB0aGlzLl9kYXRhKTtcclxuXHRcdHRoaXMuX3ZpZXcgPSBuZXcgVmlldyh0aGlzLl9tb2RlbCwgdGhpcy5fZXh0ZW5zaW9ucyk7XHJcblx0XHR0aGlzLl9zdGF0ZSA9IG5ldyBTdGF0ZSgpO1xyXG5cclxuXHRcdC8vTG9hZCBkZWZhdWx0IGV4dGVuc2lvbnNcclxuXHRcdGlmICh0aGlzLl9jb25maWcuc2VsZWN0aW9uKSB7XHJcblx0XHRcdHRoaXMuX2V4dGVuc2lvbnMubG9hZEV4dGVuc2lvbihuZXcgU2VsZWN0aW9uRXh0ZW5zaW9uKCkpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5lZGl0aW5nKSB7XHJcblx0XHRcdHRoaXMuX2V4dGVuc2lvbnMubG9hZEV4dGVuc2lvbihuZXcgRWRpdG9yRXh0ZW5zaW9uKCkpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5jb3B5cGFzdGUpIHtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5sb2FkRXh0ZW5zaW9uKG5ldyBDb3B5UGFzdGVFeHRlbnNpb24oKSk7XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmF1dG9VcGRhdGUpIHtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5sb2FkRXh0ZW5zaW9uKG5ldyBWaWV3VXBkYXRlckV4dGVuc2lvbigpKTtcclxuXHRcdH1cclxuXHJcblx0XHQvL0xvYWQgaW5pdGlhbCBleHRlcm5hbCBleHRlbnNpb25zXHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmV4dGVuc2lvbnMgJiYgdGhpcy5fY29uZmlnLmV4dGVuc2lvbnMubGVuZ3RoID4gMCkge1xyXG5cdFx0XHR0aGlzLl9jb25maWcuZXh0ZW5zaW9ucy5mb3JFYWNoKChleHQpID0+IHtcclxuXHRcdFx0XHR0aGlzLl9leHRlbnNpb25zLmxvYWRFeHRlbnNpb24oZXh0KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRnZXQgdmlldygpIHtcclxuXHRcdHJldHVybiB0aGlzLl92aWV3O1xyXG5cdH1cclxuXHJcblx0Z2V0IG1vZGVsKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX21vZGVsO1xyXG5cdH1cclxuXHJcblx0Z2V0IGRhdGEoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fZGF0YTtcclxuXHR9XHJcblxyXG5cdGdldCBleHRlbnNpb24oKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fZXh0ZW5zaW9ucztcclxuXHR9XHJcblxyXG5cdGdldCBzdGF0ZSAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fc3RhdGU7XHJcblx0fVxyXG5cclxuXHRyZW5kZXIoZWxlbWVudCkge1xyXG5cdFx0dGhpcy5fdmlldy5yZW5kZXIoZWxlbWVudCk7XHJcblx0fVxyXG5cclxufSIsImltcG9ydCB7IEV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJy4vZXZlbnQnO1xyXG5cclxuZXhwb3J0IGNsYXNzIE1vZGVsIGV4dGVuZHMgRXZlbnREaXNwYXRjaGVyIHtcclxuXHJcblx0Y29uc3RydWN0b3IgKGNvbmZpZywgZGF0YSkge1xyXG5cdFx0c3VwZXIoKTtcclxuXHRcdHRoaXMuX2NvbmZpZyA9IGNvbmZpZztcclxuXHRcdHRoaXMuX2RhdGEgPSBkYXRhO1xyXG5cclxuXHRcdHRoaXMuX2NvbHVtbk1vZGVsID0gW107XHJcblx0XHR0aGlzLl9yb3dNb2RlbCA9IHt9O1xyXG5cdFx0dGhpcy5faGVhZGVyUm93TW9kZWwgPSB7fTtcclxuXHRcdHRoaXMuX2NlbGxNb2RlbCA9IHt9O1xyXG5cdFx0dGhpcy5faGVhZGVyQ2VsbE1vZGVsID0ge307XHJcblxyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dzKSB7XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTx0aGlzLl9jb25maWcuaGVhZGVyUm93cy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdGlmICh0aGlzLl9jb25maWcuaGVhZGVyUm93c1tpXS5pICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdHRoaXMuX2hlYWRlclJvd01vZGVsW3RoaXMuX2NvbmZpZy5oZWFkZXJSb3dzW2ldLmldID0gdGhpcy5fY29uZmlnLmhlYWRlclJvd3NbaV07XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmNvbHVtbnMpIHtcclxuXHRcdFx0Zm9yIChsZXQgaT0wOyBpPHRoaXMuX2NvbmZpZy5jb2x1bW5zLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuX2NvbmZpZy5jb2x1bW5zW2ldLmkgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0dGhpcy5fY29sdW1uTW9kZWxbdGhpcy5fY29uZmlnLmNvbHVtbnNbaV0uaV0gPSB0aGlzLl9jb25maWcuY29sdW1uc1tpXTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhpcy5fY29sdW1uTW9kZWxbaV0gPSB0aGlzLl9jb25maWcuY29sdW1uc1tpXTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmICh0aGlzLl9jb25maWcucm93cykge1xyXG5cdFx0XHRmb3IgKGxldCBpPTA7IGk8dGhpcy5fY29uZmlnLnJvd3MubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHR0aGlzLl9yb3dNb2RlbFt0aGlzLl9jb25maWcucm93c1tpXS5pXSA9IHRoaXMuX2NvbmZpZy5yb3dzW2ldO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmNlbGxzKSB7XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTx0aGlzLl9jb25maWcuY2VsbHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRsZXQgbW9kZWwgPSB0aGlzLl9jb25maWcuY2VsbHNbaV07XHJcblx0XHRcdFx0aWYgKCF0aGlzLl9jZWxsTW9kZWxbbW9kZWwuY10pIHtcclxuXHRcdFx0XHRcdHRoaXMuX2NlbGxNb2RlbFttb2RlbC5jXSA9IHt9O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLl9jZWxsTW9kZWxbbW9kZWwuY11bbW9kZWwucl0gPSBtb2RlbDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5oZWFkZXJDZWxscykge1xyXG5cdFx0XHRmb3IgKGxldCBpPTA7IGk8dGhpcy5fY29uZmlnLmhlYWRlckNlbGxzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0bGV0IG1vZGVsID0gdGhpcy5fY29uZmlnLmhlYWRlckNlbGxzW2ldO1xyXG5cdFx0XHRcdGlmICghdGhpcy5faGVhZGVyQ2VsbE1vZGVsW21vZGVsLmNdKSB7XHJcblx0XHRcdFx0XHR0aGlzLl9oZWFkZXJDZWxsTW9kZWxbbW9kZWwuY10gPSB7fTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5faGVhZGVyQ2VsbE1vZGVsW21vZGVsLmNdW21vZGVsLnJdID0gbW9kZWw7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLl9jYWxjVG90YWxTaXplKCk7XHJcblx0fVxyXG5cclxuXHRjYW5FZGl0IChyb3dJbmRleCwgY29sSW5kZXgpIHtcclxuXHRcdGxldCByb3dNb2RlbCA9IHRoaXMuZ2V0Um93TW9kZWwocm93SW5kZXgpO1xyXG5cdFx0bGV0IGNvbE1vZGVsID0gdGhpcy5nZXRDb2x1bW5Nb2RlbChjb2xJbmRleCk7XHJcblx0XHRsZXQgY2VsbE1vZGVsID0gdGhpcy5nZXRDZWxsTW9kZWwocm93SW5kZXgsIGNvbEluZGV4KTtcclxuXHJcblx0XHRpZiAoKHJvd01vZGVsICYmIHJvd01vZGVsLmVkaXRhYmxlKSB8fFxyXG5cdFx0XHQoY29sTW9kZWwgJiYgY29sTW9kZWwuZWRpdGFibGUpIHx8XHJcblx0XHRcdChjZWxsTW9kZWwgJiYgY2VsbE1vZGVsLmVkaXRhYmxlKSkge1xyXG5cdFx0XHRpZiAoKHJvd01vZGVsICYmIHJvd01vZGVsLmVkaXRhYmxlID09PSBmYWxzZSkgfHxcclxuXHRcdFx0XHQoY29sTW9kZWwgJiYgY29sTW9kZWwuZWRpdGFibGUgPT09IGZhbHNlKSB8fFxyXG5cdFx0XHRcdChjZWxsTW9kZWwgJiYgY2VsbE1vZGVsLmVkaXRhYmxlID09PSBmYWxzZSkpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gZmFsc2U7XHRcclxufVxyXG5cclxuXHRpc0hlYWRlclJvdyAocm93SW5kZXgpIHtcclxuXHRcdHJldHVybiByb3dJbmRleCA8IHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudDtcclxuXHR9XHJcblxyXG5cdGdldENvbHVtbldpZHRoIChjb2xJbmRleCkge1xyXG5cdFx0bGV0IGNvbE1vZGVsID0gdGhpcy5fY29sdW1uTW9kZWxbY29sSW5kZXhdO1xyXG5cdFx0aWYgKGNvbE1vZGVsICYmIGNvbE1vZGVsLndpZHRoICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0cmV0dXJuIGNvbE1vZGVsLndpZHRoO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2NvbmZpZy5jb2x1bW5XaWR0aDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldFJvd0hlaWdodCAocm93SW5kZXgpIHtcclxuXHRcdGlmICh0aGlzLmlzSGVhZGVyUm93KHJvd0luZGV4KSkge1xyXG5cclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGNvbnN0IGRhdGFSb3dJbmRleCA9IHJvd0luZGV4IC0gdGhpcy5fY29uZmlnLmhlYWRlclJvd0NvdW50O1xyXG5cdFx0XHRsZXQgcm93TW9kZWwgPSB0aGlzLl9yb3dNb2RlbFtkYXRhUm93SW5kZXhdO1xyXG5cdFx0XHRpZiAocm93TW9kZWwgJiYgcm93TW9kZWwuaGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRyZXR1cm4gcm93TW9kZWwuaGVpZ2h0O1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9jb25maWcucm93SGVpZ2h0O1xyXG5cdFx0XHR9XHRcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldENvbHVtbkNvdW50ICgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9jb25maWcuY29sdW1ucy5sZW5ndGg7XHJcblx0fVxyXG5cclxuXHRnZXRSb3dDb3VudCAoKSB7XHJcblx0XHRsZXQgaGVhZGVyUm93Q291bnQgPSB0aGlzLl9jb25maWcuaGVhZGVyUm93Q291bnQ7XHJcblx0XHRyZXR1cm4gaGVhZGVyUm93Q291bnQgKyB0aGlzLl9kYXRhLmdldFJvd0NvdW50KCk7XHJcblx0fVxyXG5cclxuXHRnZXRUb3BGcmVlemVSb3dzICgpIHtcclxuXHRcdGxldCB0b3BGcmVlemUgPSAwO1xyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdHRvcEZyZWV6ZSArPSB0aGlzLl9jb25maWcuaGVhZGVyUm93Q291bnQ7IFxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dG9wRnJlZXplICs9IDE7XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUgJiYgdGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUudG9wID4gMCkge1xyXG5cdFx0XHR0b3BGcmVlemUgKz0gdGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUudG9wO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRvcEZyZWV6ZTtcclxuXHR9XHJcblxyXG5cdGdldFRvcEZyZWV6ZVNpemUgKCkge1xyXG5cdFx0Y29uc3QgdG9wRnJlZXplUm93ID0gdGhpcy5nZXRUb3BGcmVlemVSb3dzKCk7IFxyXG5cdFx0bGV0IHN1bSA9IDA7XHJcblx0XHRmb3IgKGxldCBpPTA7IGk8dG9wRnJlZXplUm93OyBpKyspIHtcclxuXHRcdFx0c3VtICs9IHRoaXMuZ2V0Um93SGVpZ2h0KGkpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHN1bTtcclxuXHR9XHJcblxyXG5cdGdldExlZnRGcmVlemVSb3dzICgpIHtcclxuXHRcdGlmICh0aGlzLl9jb25maWcuZnJlZXplUGFuZSAmJiB0aGlzLl9jb25maWcuZnJlZXplUGFuZS5sZWZ0ID4gMCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUubGVmdDtcclxuXHRcdH1cclxuXHRcdHJldHVybiAwO1xyXG5cdH1cclxuXHJcblx0Z2V0TGVmdEZyZWV6ZVNpemUgKCkge1xyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lICYmIHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lLmxlZnQgPiAwKSB7XHJcblx0XHRcdGxldCBzdW0gPSAwO1xyXG5cdFx0XHRmb3IgKGxldCBpPTA7IGk8dGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUubGVmdDsgaSsrKSB7XHJcblx0XHRcdFx0c3VtICs9IHRoaXMuZ2V0Q29sdW1uV2lkdGgoaSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHN1bTtcclxuXHRcdH1cclxuXHRcdHJldHVybiAwO1xyXG5cdH1cclxuXHJcblx0Z2V0Qm90dG9tRnJlZXplUm93cyAoKSB7XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUgJiYgdGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUuYm90dG9tID4gMCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUuYm90dG9tO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIDA7XHJcblx0fVxyXG5cclxuXHRnZXRCb3R0b21GcmVlemVTaXplICgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9ib3R0b21GcmVlemVTaXplO1xyXG5cdH1cclxuXHJcblx0Z2V0Q29sdW1uV2lkdGggKGluZGV4KSB7XHJcblx0XHRpZiAodGhpcy5fY29sdW1uTW9kZWxbaW5kZXhdICYmIHRoaXMuX2NvbHVtbk1vZGVsW2luZGV4XS53aWR0aCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLl9jb2x1bW5Nb2RlbFtpbmRleF0ud2lkdGg7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLmNvbHVtbldpZHRoO1xyXG5cdH1cclxuXHJcblx0Z2V0Um93SGVpZ2h0IChpbmRleCkge1xyXG5cdFx0aWYgKHRoaXMuX3Jvd01vZGVsW2luZGV4XSAmJiB0aGlzLl9yb3dNb2RlbFtpbmRleF0uaGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX3Jvd01vZGVsW2luZGV4XS5oZWlnaHQ7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLnJvd0hlaWdodDtcclxuXHR9XHJcblxyXG5cdGdldFRvdGFsV2lkdGggKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX3RvdGFsV2lkdGg7XHJcblx0fVxyXG5cclxuXHRnZXRUb3RhbEhlaWdodCAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fdG90YWxIZWlnaHQ7XHJcblx0fVxyXG5cclxuXHRnZXRSb3dNb2RlbCAocm93SW5kZXgpIHtcclxuXHRcdGlmICh0aGlzLmlzSGVhZGVyUm93KHJvd0luZGV4KSkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5faGVhZGVyUm93TW9kZWxbcm93SW5kZXhdO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Y29uc3QgZGF0YVJvd0luZGV4ID0gcm93SW5kZXggLSB0aGlzLl9jb25maWcuaGVhZGVyUm93Q291bnQ7XHJcblx0XHRcdHJldHVybiB0aGlzLl9yb3dNb2RlbFtkYXRhUm93SW5kZXhdO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Z2V0Q29sdW1uTW9kZWwgKGNvbEluZGV4KSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fY29sdW1uTW9kZWxbY29sSW5kZXhdO1xyXG5cdH1cclxuXHJcblx0Z2V0Q2VsbE1vZGVsIChyb3dJbmRleCwgY29sSW5kZXgpIHtcclxuXHRcdGlmICh0aGlzLmlzSGVhZGVyUm93KHJvd0luZGV4KSkge1xyXG5cdFx0XHRpZiAodGhpcy5faGVhZGVyQ2VsbE1vZGVsW2NvbEluZGV4XSkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9oZWFkZXJDZWxsTW9kZWxbY29sSW5kZXhdW3Jvd0luZGV4XTtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Y29uc3QgZGF0YVJvd0luZGV4ID0gcm93SW5kZXggLSB0aGlzLl9jb25maWcuaGVhZGVyUm93Q291bnQ7XHJcblx0XHRcdGlmICh0aGlzLl9jZWxsTW9kZWxbY29sSW5kZXhdKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX2NlbGxNb2RlbFtjb2xJbmRleF1bZGF0YVJvd0luZGV4XTtcclxuXHRcdFx0fVx0XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRnZXRDYXNjYWRlZENlbGxQcm9wIChyb3dJbmRleCwgY29sSW5kZXgsIHByb3BOYW1lKSB7XHJcblx0XHRjb25zdCBjZWxsTW9kZWwgPSB0aGlzLmdldENlbGxNb2RlbChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cdFx0aWYgKGNlbGxNb2RlbCAmJiBjZWxsTW9kZWxbcHJvcE5hbWVdKSB7XHJcblx0XHRcdHJldHVybiBjZWxsTW9kZWxbcHJvcE5hbWVdO1xyXG5cdFx0fVxyXG5cclxuXHRcdGNvbnN0IHJvd01vZGVsID0gdGhpcy5nZXRSb3dNb2RlbChyb3dJbmRleCk7XHJcblx0XHRpZiAocm93TW9kZWwgJiYgcm93TW9kZWxbcHJvcE5hbWVdKSB7XHJcblx0XHRcdHJldHVybiByb3dNb2RlbFtwcm9wTmFtZV07XHJcblx0XHR9XHJcblxyXG5cdFx0Y29uc3QgY29sdW1uTW9kZWwgPSB0aGlzLmdldENvbHVtbk1vZGVsKGNvbEluZGV4KTtcclxuXHRcdGlmIChjb2x1bW5Nb2RlbCAmJiBjb2x1bW5Nb2RlbFtwcm9wTmFtZV0pIHtcclxuXHRcdFx0cmV0dXJuIGNvbHVtbk1vZGVsW3Byb3BOYW1lXTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xyXG5cdH1cclxuXHJcblx0Z2V0Q2VsbENsYXNzZXMgKHJvd0luZGV4LCBjb2xJbmRleCkge1xyXG5cdFx0bGV0IG91dHB1dCA9IFtdO1xyXG5cdFx0Y29uc3QgY29sTW9kZWwgPSB0aGlzLmdldENvbHVtbk1vZGVsKGNvbEluZGV4KTtcclxuXHRcdGlmIChjb2xNb2RlbCkge1xyXG5cdFx0XHRpZiAoY29sTW9kZWwuY3NzQ2xhc3MpIHtcclxuXHRcdFx0XHRvdXRwdXQudW5zaGlmdChjb2xNb2RlbC5jc3NDbGFzcyk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRjb25zdCBpc0hlYWRlciA9IHRoaXMuaXNIZWFkZXJSb3cocm93SW5kZXgpO1xyXG5cdFx0Y29uc3Qgcm93TW9kZWwgPSB0aGlzLmdldFJvd01vZGVsKHJvd0luZGV4KTtcclxuXHRcdGlmIChyb3dNb2RlbCkge1xyXG5cdFx0XHRpZiAoaXNIZWFkZXIpIHtcclxuXHRcdFx0XHRvdXRwdXQudW5zaGlmdCgncGdyaWQtcm93LWhlYWRlcicpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChyb3dNb2RlbC5jc3NDbGFzcykge1xyXG5cdFx0XHRcdG91dHB1dC51bnNoaWZ0KHJvd01vZGVsLmNzc0NsYXNzKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGNvbnN0IGNlbGxNb2RlbCA9IHRoaXMuZ2V0Q2VsbE1vZGVsKHJvd0luZGV4LCBjb2xJbmRleCk7XHJcblx0XHRpZiAoY2VsbE1vZGVsKSB7XHJcblx0XHRcdGlmIChjZWxsTW9kZWwuY3NzQ2xhc3MpIHtcclxuXHRcdFx0XHRvdXRwdXQudW5zaGlmdChjZWxsTW9kZWwuY3NzQ2xhc3MpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gb3V0cHV0O1xyXG5cdH1cclxuXHJcblx0ZGV0ZXJtaW5lU2Nyb2xsYmFyU3RhdGUgKHZpZXdXaWR0aCwgdmlld0hlaWdodCwgc2Nyb2xsYmFyU2l6ZSkge1xyXG5cdFx0bGV0IG5lZWRIID0gdGhpcy5fdG90YWxXaWR0aCA+IHZpZXdXaWR0aDtcclxuXHRcdGxldCBuZWVkViA9IHRoaXMuX3RvdGFsSGVpZ2h0ID4gdmlld0hlaWdodDtcclxuXHJcblx0XHRpZiAobmVlZEggJiYgIW5lZWRWKSB7XHJcblx0XHRcdG5lZWRWID0gdGhpcy5fdG90YWxIZWlnaHQgPiAodmlld0hlaWdodCAtIHNjcm9sbGJhclNpemUpO1xyXG5cdFx0fSBlbHNlXHJcblx0XHRpZiAoIW5lZWRIICYmIG5lZWRWKSB7XHJcblx0XHRcdG5lZWRIID0gdGhpcy5fdG90YWxXaWR0aCA+ICh2aWV3V2lkdGggLSBzY3JvbGxiYXJTaXplKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAobmVlZEggJiYgbmVlZFYpIHtcclxuXHRcdFx0cmV0dXJuICdiJztcclxuXHRcdH0gZWxzZVxyXG5cdFx0aWYgKCFuZWVkSCAmJiBuZWVkVikge1xyXG5cdFx0XHRyZXR1cm4gJ3YnO1xyXG5cdFx0fSBlbHNlXHJcblx0XHRpZiAobmVlZEggJiYgIW5lZWRWKSB7XHJcblx0XHRcdHJldHVybiAnaCc7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gJ24nO1xyXG5cdH1cclxuXHJcblx0Z2V0RGF0YUF0IChyb3dJbmRleCwgY29sSW5kZXgpIHtcclxuXHRcdGlmICh0aGlzLmlzSGVhZGVyUm93KHJvd0luZGV4KSkge1xyXG5cdFx0XHRjb25zdCBjb2xNb2RlbCA9IHRoaXMuZ2V0Q29sdW1uTW9kZWwoY29sSW5kZXgpO1xyXG5cdFx0XHRpZiAoY29sTW9kZWwgJiYgY29sTW9kZWwudGl0bGUpIHtcclxuXHRcdFx0XHRyZXR1cm4gY29sTW9kZWwudGl0bGU7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Y29uc3QgZGF0YVJvd0luZGV4ID0gcm93SW5kZXggLSB0aGlzLl9jb25maWcuaGVhZGVyUm93Q291bnQ7XHJcblx0XHRcdGNvbnN0IGNvbE1vZGVsID0gdGhpcy5nZXRDb2x1bW5Nb2RlbChjb2xJbmRleCk7XHJcblx0XHRcdGlmIChjb2xNb2RlbCAmJiBjb2xNb2RlbC5maWVsZCkge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9kYXRhLmdldERhdGFBdChkYXRhUm93SW5kZXgsIGNvbE1vZGVsLmZpZWxkKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xyXG5cdFx0XHR9XHRcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHNldERhdGFBdCAocm93SW5kZXgsIGNvbEluZGV4LCBkYXRhKSB7XHJcblx0XHRjb25zdCBkYXRhUm93SW5kZXggPSByb3dJbmRleCAtIHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudDtcclxuXHRcdGNvbnN0IGNvbE1vZGVsID0gdGhpcy5nZXRDb2x1bW5Nb2RlbChjb2xJbmRleCk7XHJcblx0XHRpZiAoY29sTW9kZWwgJiYgY29sTW9kZWwuZmllbGQpIHtcclxuXHRcdFx0dGhpcy5fZGF0YS5zZXREYXRhQXQoZGF0YVJvd0luZGV4LCBjb2xNb2RlbC5maWVsZCwgZGF0YSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRnZXRSb3dJbmRleCAocm93SWQpIHtcclxuXHRcdHJldHVybiB0aGlzLl9jb25maWcuaGVhZGVyUm93Q291bnQgKyB0aGlzLl9kYXRhLmdldFJvd0luZGV4KHJvd0lkKTtcclxuXHR9XHJcblxyXG5cdGdldFJvd0lkIChyb3dJbmRleCkge1xyXG5cdFx0aWYgKHJvd0luZGV4ID49IHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fZGF0YS5nZXRSb3dJZChyb3dJbmRleCAtIHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldENvbHVtbkluZGV4IChmaWVsZCkge1xyXG5cdFx0Zm9yIChsZXQgaT0wOyBpPHRoaXMuX2NvbmZpZy5jb2x1bW5zLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdGlmICh0aGlzLl9jb25maWcuY29sdW1uc1tpXS5maWVsZCA9PT0gZmllbGQpIHtcclxuXHRcdFx0XHRyZXR1cm4gaTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIC0xO1xyXG5cdH1cclxuXHJcblx0Z2V0Q29sdW1uRmllbGQgKGNvbEluZGV4KSB7XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmNvbHVtbnNbY29sSW5kZXhdKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLl9jb25maWcuY29sdW1uc1tjb2xJbmRleF0uZmllbGQ7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRfY2FsY1RvdGFsU2l6ZSgpIHtcclxuXHRcdHRoaXMuX2NhbGNUb3RhbFdpZHRoKCk7XHJcblx0XHR0aGlzLl9jYWxjVG90YWxIZWlnaHQoKTtcclxuXHRcdHRoaXMuX2NhbGNCb3R0b21GcmVlemVTaXplKCk7XHJcblx0fVxyXG5cclxuXHRfY2FsY1RvdGFsV2lkdGggKCkge1xyXG5cdFx0dGhpcy5fdG90YWxXaWR0aCA9IDA7XHJcblx0XHRmb3IgKGxldCBpPTA7IGk8dGhpcy5fY29sdW1uTW9kZWwubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0aWYgKHRoaXMuX2NvbHVtbk1vZGVsW2ldLndpZHRoICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHR0aGlzLl90b3RhbFdpZHRoICs9IHRoaXMuX2NvbHVtbk1vZGVsW2ldLndpZHRoO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMuX3RvdGFsV2lkdGggKz0gdGhpcy5fY29uZmlnLmNvbHVtbldpZHRoO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRfY2FsY1RvdGFsSGVpZ2h0ICgpIHtcclxuXHRcdGxldCBoZWFkZXJSb3dNb2RlbENvdW50ID0gT2JqZWN0LmtleXModGhpcy5faGVhZGVyUm93TW9kZWwpO1xyXG5cdFx0dGhpcy5fdG90YWxIZWlnaHQgPSB0aGlzLl9jb25maWcucm93SGVpZ2h0ICogKHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudCAtIGhlYWRlclJvd01vZGVsQ291bnQubGVuZ3RoKTtcclxuXHRcdGZvciAobGV0IGluZGV4IGluIHRoaXMuX2hlYWRlclJvd01vZGVsKSB7XHJcblx0XHRcdGlmICh0aGlzLl9oZWFkZXJSb3dNb2RlbFtpbmRleF0uaGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHR0aGlzLl90b3RhbEhlaWdodCArPSB0aGlzLl9oZWFkZXJSb3dNb2RlbFtpbmRleF0uaGVpZ2h0O1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMuX3RvdGFsSGVpZ2h0ICs9IHRoaXMuX2NvbmZpZy5yb3dIZWlnaHQ7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRsZXQgcm93TW9kZWxDb3VudCA9IE9iamVjdC5rZXlzKHRoaXMuX3Jvd01vZGVsKTtcclxuXHRcdHRoaXMuX3RvdGFsSGVpZ2h0ICs9IHRoaXMuX2NvbmZpZy5yb3dIZWlnaHQgKiAodGhpcy5fZGF0YS5nZXRSb3dDb3VudCgpIC0gcm93TW9kZWxDb3VudC5sZW5ndGgpO1xyXG5cdFx0Zm9yIChsZXQgaW5kZXggaW4gdGhpcy5fcm93TW9kZWwpIHtcclxuXHRcdFx0aWYgKHRoaXMuX3Jvd01vZGVsW2luZGV4XS5oZWlnaHQgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdHRoaXMuX3RvdGFsSGVpZ2h0ICs9IHRoaXMuX3Jvd01vZGVsW2luZGV4XS5oZWlnaHQ7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5fdG90YWxIZWlnaHQgKz0gdGhpcy5fY29uZmlnLnJvd0hlaWdodDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0X2NhbGNCb3R0b21GcmVlemVTaXplICgpIHtcclxuXHRcdGlmICh0aGlzLl9jb25maWcuZnJlZXplUGFuZSAmJiB0aGlzLl9jb25maWcuZnJlZXplUGFuZS5ib3R0b20gPiAwKSB7XHJcblx0XHRcdGxldCBzdW0gPSAwO1xyXG5cdFx0XHRmb3IgKGxldCBpPTA7IGk8dGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUuYm90dG9tOyBpKyspIHtcclxuXHRcdFx0XHRzdW0gKz0gdGhpcy5nZXRSb3dIZWlnaHQoKHRoaXMuX2NvbmZpZy5yb3dDb3VudC0xKS1pKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLl9ib3R0b21GcmVlemVTaXplID0gc3VtO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy5fYm90dG9tRnJlZXplU2l6ZSA9IDA7XHJcblx0XHR9XHJcblx0fVxyXG59IiwiZXhwb3J0IGNsYXNzIFN0YXRlIHtcclxuXHJcblx0Y29uc3RydWN0b3IgKCkge1xyXG5cdFx0dGhpcy5fc3RhdGUgPSB7fTtcclxuXHR9XHJcblxyXG5cdGV4aXN0cyAoa2V5KSB7XHJcblx0XHRyZXR1cm4gKHRoaXMuX3N0YXRlW2tleV0gIT09IHVuZGVmaW5lZCk7XHJcblx0fVxyXG5cclxuXHRnZXQgKGtleSkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX3N0YXRlW2tleV07XHJcblx0fVxyXG5cclxuXHRzZXQgKGtleSwgdmFsdWUpIHtcclxuXHRcdHRoaXMuX3N0YXRlW2tleV0gPSB2YWx1ZTtcclxuXHR9XHJcblx0XHJcbn0iLCJleHBvcnQgY2xhc3MgVXRpbHMge1xyXG5cclxuXHRzdGF0aWMgbWl4aW4oc291cmNlLCB0YXJnZXQpIHtcclxuXHRcdGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XHJcblx0XHRcdGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuXHRcdFx0XHR0YXJnZXRbcHJvcF0gPSBzb3VyY2VbcHJvcF07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiB0YXJnZXQ7XHJcblx0fVxyXG59IiwiaW1wb3J0IHsgRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnLi9ldmVudCc7XHJcbmltcG9ydCBSZXNpemVPYnNlcnZlciBmcm9tICdyZXNpemUtb2JzZXJ2ZXItcG9seWZpbGwnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFZpZXcgZXh0ZW5kcyBFdmVudERpc3BhdGNoZXIge1xyXG5cclxuXHRjb25zdHJ1Y3RvciAobW9kZWwsIGV4dGVuc2lvbnMpIHtcclxuXHRcdHN1cGVyKCk7XHJcblx0XHR0aGlzLl9tb2RlbCA9IG1vZGVsO1xyXG5cdFx0dGhpcy5fZXh0ZW5zaW9ucyA9IGV4dGVuc2lvbnM7XHJcblx0XHR0aGlzLl90ZW1wbGF0ZSA9IFx0JzxkaXYgY2xhc3M9XCJwZ3JpZC1jb250ZW50LXBhbmVcIiBzdHlsZT1cInBvc2l0aW9uOiByZWxhdGl2ZTtcIj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHQ8ZGl2IGNsYXNzPVwicGdyaWQtdG9wLWxlZnQtcGFuZVwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1wiPicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdFx0PGRpdiBjbGFzcz1cInBncmlkLXRvcC1sZWZ0LWlubmVyXCIgc3R5bGU9XCJ3aWR0aDogMTAwJTsgaGVpZ2h0OiAxMDAlOyBvdmVyZmxvdzogaGlkZGVuOyBwb3NpdGlvbjogcmVsYXRpdmU7XCI+PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PGRpdiBjbGFzcz1cInBncmlkLXRvcC1wYW5lXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XCI+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0XHQ8ZGl2IGNsYXNzPVwicGdyaWQtdG9wLWlubmVyXCIgc3R5bGU9XCJ3aWR0aDogMTAwJTsgaGVpZ2h0OiAxMDAlOyBvdmVyZmxvdzogaGlkZGVuOyBwb3NpdGlvbjogcmVsYXRpdmU7XCI+PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PGRpdiBjbGFzcz1cInBncmlkLWxlZnQtcGFuZVwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1wiPicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdFx0PGRpdiBjbGFzcz1cInBncmlkLWxlZnQtaW5uZXJcIiBzdHlsZT1cIndpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7IG92ZXJmbG93OiBoaWRkZW47IHBvc2l0aW9uOiByZWxhdGl2ZTtcIj48L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHQ8L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHQ8ZGl2IGNsYXNzPVwicGdyaWQtY2VudGVyLXBhbmVcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcIj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHRcdDxkaXYgY2xhc3M9XCJwZ3JpZC1jZW50ZXItaW5uZXJcIiBzdHlsZT1cIndpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7IG92ZXJmbG93OiBoaWRkZW47IHBvc2l0aW9uOiByZWxhdGl2ZTtcIj48L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHQ8L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHQ8ZGl2IGNsYXNzPVwicGdyaWQtYm90dG9tLWxlZnQtcGFuZVwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1wiPicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdFx0PGRpdiBjbGFzcz1cInBncmlkLWJvdHRvbS1sZWZ0LWlubmVyXCIgc3R5bGU9XCJ3aWR0aDogMTAwJTsgaGVpZ2h0OiAxMDAlOyBvdmVyZmxvdzogaGlkZGVuOyBwb3NpdGlvbjogcmVsYXRpdmU7XCI+PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PGRpdiBjbGFzcz1cInBncmlkLWJvdHRvbS1wYW5lXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XCI+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0XHQ8ZGl2IGNsYXNzPVwicGdyaWQtYm90dG9tLWlubmVyXCIgc3R5bGU9XCJ3aWR0aDogMTAwJTsgaGVpZ2h0OiAxMDAlOyBvdmVyZmxvdzogaGlkZGVuOyBwb3NpdGlvbjogcmVsYXRpdmU7XCI+PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0JzwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwicGdyaWQtaHNjcm9sbFwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlOyBib3R0b206IDBweDsgb3ZlcmZsb3cteTogaGlkZGVuOyBvdmVyZmxvdy14OiBzY3JvbGw7XCI+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PGRpdiBjbGFzcz1cInBncmlkLWhzY3JvbGwtdGh1bWJcIj48L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnPC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJwZ3JpZC12c2Nyb2xsXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7IHJpZ2h0OiAwcHg7IHRvcDogMHB4OyBvdmVyZmxvdy15OiBzY3JvbGw7IG92ZXJmbG93LXg6IGhpZGRlbjtcIj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHQ8ZGl2IGNsYXNzPVwicGdyaWQtdnNjcm9sbC10aHVtYlwiPjwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCc8L2Rpdj4nO1xyXG5cdH1cclxuXHJcblx0cmVuZGVyIChlbGVtZW50KSB7XHJcblx0XHR0aGlzLl9lbGVtZW50ID0gZWxlbWVudDtcclxuXHRcdHRoaXMuX2VsZW1lbnQuY2xhc3NOYW1lID0gJ3BncmlkJztcclxuXHRcdHRoaXMuX2VsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5fdGVtcGxhdGU7XHJcblx0XHR0aGlzLl9lbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcclxuXHRcdHRoaXMuX2VsZW1lbnQuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcclxuXHRcdHRoaXMuX2VsZW1lbnQudGFiSW5kZXggPSAxO1xyXG5cclxuXHRcdHRoaXMuX2NvbnRlbnRQYW5lID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtY29udGVudC1wYW5lJyk7XHJcblx0XHR0aGlzLl90b3BMZWZ0UGFuZSA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLXRvcC1sZWZ0LXBhbmUnKTtcclxuXHRcdHRoaXMuX3RvcExlZnRJbm5lciA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLXRvcC1sZWZ0LWlubmVyJyk7XHJcblx0XHR0aGlzLl90b3BQYW5lID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtdG9wLXBhbmUnKTtcclxuXHRcdHRoaXMuX3RvcElubmVyID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtdG9wLWlubmVyJyk7XHJcblx0XHR0aGlzLl9sZWZ0UGFuZSA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLWxlZnQtcGFuZScpO1xyXG5cdFx0dGhpcy5fbGVmdElubmVyID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtbGVmdC1pbm5lcicpO1xyXG5cdFx0dGhpcy5fY2VudGVyUGFuZSA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLWNlbnRlci1wYW5lJyk7XHJcblx0XHR0aGlzLl9jZW50ZXJJbm5lciA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLWNlbnRlci1pbm5lcicpO1xyXG5cdFx0dGhpcy5fYm90dG9tUGFuZSA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLWJvdHRvbS1wYW5lJyk7XHJcblx0XHR0aGlzLl9ib3R0b21Jbm5lciA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLWJvdHRvbS1pbm5lcicpO1xyXG5cdFx0dGhpcy5fYm90dG9tTGVmdFBhbmUgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1ib3R0b20tbGVmdC1wYW5lJyk7XHJcblx0XHR0aGlzLl9ib3R0b21MZWZ0SW5uZXIgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1ib3R0b20tbGVmdC1pbm5lcicpO1xyXG5cclxuXHRcdHRoaXMuX3Njcm9sbFdpZHRoID0gdGhpcy5fbWVhc3VyZVNjcm9sbGJhcldpZHRoKCk7XHJcblxyXG5cdFx0dGhpcy5faFNjcm9sbCA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLWhzY3JvbGwnKTtcclxuXHRcdHRoaXMuX3ZTY3JvbGwgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC12c2Nyb2xsJyk7XHJcblx0XHR0aGlzLl9oU2Nyb2xsVGh1bWIgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1oc2Nyb2xsLXRodW1iJyk7XHJcblx0XHR0aGlzLl92U2Nyb2xsVGh1bWIgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC12c2Nyb2xsLXRodW1iJyk7XHJcblx0XHR0aGlzLl9oU2Nyb2xsLnN0eWxlLmhlaWdodCA9IHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4JztcclxuXHRcdHRoaXMuX3ZTY3JvbGwuc3R5bGUud2lkdGggPSB0aGlzLl9zY3JvbGxXaWR0aCArICdweCc7XHJcblx0XHR0aGlzLl9oU2Nyb2xsVGh1bWIuc3R5bGUuaGVpZ2h0ID0gdGhpcy5fc2Nyb2xsV2lkdGggKyAncHgnO1xyXG5cdFx0dGhpcy5fdlNjcm9sbFRodW1iLnN0eWxlLndpZHRoID0gdGhpcy5fc2Nyb2xsV2lkdGggKyAncHgnO1xyXG5cclxuXHRcdHRoaXMuX29ic2VydmVTaXplKCk7XHJcblx0XHR0aGlzLl9yZXN0dXJlY3R1cmUoKTtcclxuXHRcdHRoaXMuX2F0dGFjaEhhbmRsZXJzKCk7XHJcblxyXG5cdFx0dGhpcy5fZXh0ZW5zaW9ucy5leGVjdXRlRXh0ZW5zaW9uKCdncmlkQWZ0ZXJSZW5kZXInLCB7XHJcblx0XHRcdGdyaWQ6IHRoaXNcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0cmVSZW5kZXIgKCkge1xyXG5cdFx0dGhpcy5fdG9wTGVmdElubmVyLmlubmVySFRNTCA9ICcnO1xyXG5cdFx0dGhpcy5fdG9wSW5uZXIuaW5uZXJIVE1MID0gJyc7XHJcblx0XHR0aGlzLl9sZWZ0SW5uZXIuaW5uZXJIVE1MID0gJyc7XHJcblx0XHR0aGlzLl9jZW50ZXJJbm5lci5pbm5lckhUTUwgPSAnJztcclxuXHRcdHRoaXMuX2JvdHRvbUxlZnRJbm5lci5pbm5lckhUTUwgPSAnJztcclxuXHRcdHRoaXMuX2JvdHRvbUlubmVyLmlubmVySFRNTCA9ICcnO1xyXG5cclxuXHRcdHRoaXMuX3Jlc3R1cmVjdHVyZSgpO1xyXG5cdH1cclxuXHJcblx0Z2V0RWxlbWVudCAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fZWxlbWVudDtcclxuXHR9XHJcblxyXG5cdHNldFNjcm9sbFggKHgsIGFkanVzdFNjcm9sbEJhcikge1xyXG5cdFx0dGhpcy5fdG9wSW5uZXIuc2Nyb2xsTGVmdCA9IHg7XHJcblx0XHR0aGlzLl9jZW50ZXJJbm5lci5zY3JvbGxMZWZ0ID0geDtcclxuXHRcdHRoaXMuX2JvdHRvbUlubmVyLnNjcm9sbExlZnQgPSB4O1xyXG5cdFx0aWYgKGFkanVzdFNjcm9sbEJhciB8fCBhZGp1c3RTY3JvbGxCYXIgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHR0aGlzLl9oU2Nyb2xsLnNjcm9sbExlZnQgPSB4O1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Z2V0U2Nyb2xsWCAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fY2VudGVySW5uZXIuc2Nyb2xsTGVmdDtcclxuXHR9XHJcblxyXG5cdHNldFNjcm9sbFkgKHksIGFkanVzdFNjcm9sbEJhcikge1xyXG5cdFx0dGhpcy5fY2VudGVySW5uZXIuc2Nyb2xsVG9wID0geTtcclxuXHRcdHRoaXMuX2xlZnRJbm5lci5zY3JvbGxUb3AgPSB5O1xyXG5cdFx0aWYgKGFkanVzdFNjcm9sbEJhciB8fCBhZGp1c3RTY3JvbGxCYXIgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHR0aGlzLl92U2Nyb2xsLnNjcm9sbFRvcCA9IHk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRnZXRTY3JvbGxZICgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9jZW50ZXJJbm5lci5zY3JvbGxUb3A7XHJcblx0fVxyXG5cclxuXHRzY3JvbGxUb0NlbGwgKHJvd0luZGV4LCBjb2xJbmRleCwgYWxpZ25Ub3ApIHtcclxuXHRcdGxldCBjZWxsID0gdGhpcy5nZXRDZWxsKHJvd0luZGV4LCBjb2xJbmRleCk7XHJcblx0XHRsZXQgb3JpZ1Njcm9sbFRvcCA9IGNlbGwucGFyZW50RWxlbWVudC5zY3JvbGxUb3A7XHJcblx0XHRsZXQgb3JpZ1Njcm9sbExlZnQgPSBjZWxsLnBhcmVudEVsZW1lbnQuc2Nyb2xsTGVmdDtcclxuXHJcblx0XHRjZWxsLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoZmFsc2UpO1xyXG5cclxuXHRcdGlmIChvcmlnU2Nyb2xsVG9wICE9PSBjZWxsLnBhcmVudEVsZW1lbnQuc2Nyb2xsVG9wKSB7XHJcblx0XHRcdHRoaXMuc2V0U2Nyb2xsWShjZWxsLnBhcmVudEVsZW1lbnQuc2Nyb2xsVG9wLCB0cnVlKTtcclxuXHRcdH1cclxuXHRcdGlmIChvcmlnU2Nyb2xsTGVmdCAhPT0gY2VsbC5wYXJlbnRFbGVtZW50LnNjcm9sbExlZnQpIHtcclxuXHRcdFx0dGhpcy5zZXRTY3JvbGxYKGNlbGwucGFyZW50RWxlbWVudC5zY3JvbGxMZWZ0LCB0cnVlKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldENlbGwgKHJvd0luZGV4LCBjb2xJbmRleCkge1xyXG5cdFx0bGV0IGNlbGwgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXJvdy1pbmRleD1cIicrcm93SW5kZXgrJ1wiXVtkYXRhLWNvbC1pbmRleD1cIicrY29sSW5kZXgrJ1wiXScpO1xyXG5cdFx0cmV0dXJuIGNlbGw7XHJcblx0fVxyXG5cclxuXHR1cGRhdGVDZWxsIChyb3dJbmRleCwgY29sSW5kZXgpIHtcclxuXHRcdGxldCBjZWxsID0gdGhpcy5nZXRDZWxsKHJvd0luZGV4LCBjb2xJbmRleCk7XHJcblx0XHRpZiAoY2VsbCkge1xyXG5cdFx0XHQvL0NyZWF0ZSBjZWxsIGNvbnRlbnQgd3JhcHBlciBpZiBub3QgYW55XHJcblx0XHRcdGxldCBjZWxsQ29udGVudCA9IG51bGw7XHJcblx0XHRcdGlmICghY2VsbC5maXJzdENoaWxkIHx8ICFjZWxsLmZpcnN0Q2hpbGQuY2xhc3NMaXN0LmNvbnRhaW5zKCdwZ3JpZC1jZWxsLWNvbnRlbnQnKSkge1xyXG5cdFx0XHRcdC8vQ2xlYXIgY2VsbFxyXG5cdFx0XHRcdGNlbGwuaW5uZXJIVE1MID0gJyc7XHJcblxyXG5cdFx0XHRcdC8vQWRkIG5ldyBjZWxsIGNvbnRlbnRcclxuXHRcdFx0XHRjZWxsQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cdFx0XHRcdGNlbGxDb250ZW50LmNsYXNzTmFtZSA9ICdwZ3JpZC1jZWxsLWNvbnRlbnQnO1xyXG5cdFx0XHRcdGNlbGwuYXBwZW5kQ2hpbGQoY2VsbENvbnRlbnQpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGNlbGxDb250ZW50ID0gY2VsbC5maXJzdENoaWxkO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvL0dldCBkYXRhIHRvIGJlIHVwZGF0ZWRcclxuXHRcdFx0bGV0IGRhdGEgPSB0aGlzLl9tb2RlbC5nZXREYXRhQXQocm93SW5kZXgsIGNvbEluZGV4KTtcclxuXHJcblx0XHRcdC8vRGF0YSBjYW4gYmUgdHJhbnNmb3JtZWQgYmVmb3JlIHJlbmRlcmluZyB1c2luZyBkYXRhQmVmb3JlUmVuZGVyIGV4dGVuc2lvblxyXG5cdFx0XHRsZXQgYXJnID0ge2RhdGE6IGRhdGF9O1xyXG5cdFx0XHR0aGlzLl9leHRlbnNpb25zLmV4ZWN1dGVFeHRlbnNpb24oJ2RhdGFCZWZvcmVSZW5kZXInLCBhcmcpO1xyXG5cdFx0XHRkYXRhID0gYXJnLmRhdGE7XHJcblxyXG5cdFx0XHQvL0lmIHRoZXJlJ3MgY2VsbFVwZGF0ZSBleHRlbnNpb24sIHRoZW4gZXhlY3V0ZSBpdCB0byB1cGRhdGUgdGhlIGNlbGwgZGF0YVxyXG5cdFx0XHQvL0Vsc2UgdXNlIGRlZmF1bHQgd2F5IHRvIHB1dCB0aGUgZGF0YSBkaXJlY3RseSB0byB0aGUgY2VsbCBjb250ZW50XHJcblx0XHRcdGxldCBoYW5kbGVkQnlFeHQgPSBmYWxzZTtcclxuXHRcdFx0aWYgKHRoaXMuX2V4dGVuc2lvbnMuaGFzRXh0ZW5zaW9uKCdjZWxsVXBkYXRlJykpIHtcclxuXHRcdFx0XHRhcmcgPSB7XHJcblx0XHRcdFx0XHRkYXRhLFxyXG5cdFx0XHRcdFx0Y2VsbCxcclxuXHRcdFx0XHRcdGNlbGxDb250ZW50LFxyXG5cdFx0XHRcdFx0cm93SW5kZXgsXHJcblx0XHRcdFx0XHRjb2xJbmRleCxcclxuXHRcdFx0XHRcdHJvd0lkOiB0aGlzLl9tb2RlbC5nZXRSb3dJZChyb3dJbmRleCksXHJcblx0XHRcdFx0XHRmaWVsZDogdGhpcy5fbW9kZWwuZ2V0Q29sdW1uRmllbGQoY29sSW5kZXgpLFxyXG5cdFx0XHRcdFx0aGFuZGxlZDogZmFsc2VcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5leGVjdXRlRXh0ZW5zaW9uKCdjZWxsVXBkYXRlJywgYXJnKTtcclxuXHRcdFx0XHRoYW5kbGVkQnlFeHQgPSBhcmcuaGFuZGxlZDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKCFoYW5kbGVkQnlFeHQpIHtcclxuXHRcdFx0XHRpZiAoZGF0YSAhPT0gdW5kZWZpbmVkICYmIGRhdGEgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdGNlbGxDb250ZW50LmlubmVySFRNTCA9IGRhdGE7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGNlbGxDb250ZW50LmlubmVySFRNTCA9ICcnO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5leGVjdXRlRXh0ZW5zaW9uKCdjZWxsQWZ0ZXJVcGRhdGUnLCB7XHJcblx0XHRcdFx0Y2VsbDogY2VsbCxcclxuXHRcdFx0XHRyb3dJbmRleDogcm93SW5kZXgsXHJcblx0XHRcdFx0Y29sSW5kZXg6IGNvbEluZGV4LFxyXG5cdFx0XHRcdGRhdGE6IGRhdGFcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRfYXR0YWNoSGFuZGxlcnMgKCkge1xyXG5cclxuXHRcdHRoaXMuX3ZTY3JvbGxIYW5kbGVyID0gKGUpID0+IHtcclxuXHRcdFx0dGhpcy5zZXRTY3JvbGxZKGUudGFyZ2V0LnNjcm9sbFRvcCwgZmFsc2UpO1xyXG5cdFx0fTtcclxuXHJcblx0XHR0aGlzLl9oU2Nyb2xsSGFuZGxlciA9IChlKSA9PiB7XHJcblx0XHRcdHRoaXMuc2V0U2Nyb2xsWChlLnRhcmdldC5zY3JvbGxMZWZ0LCBmYWxzZSk7XHJcblx0XHR9O1xyXG5cclxuXHRcdHRoaXMuX3doZWVsSGFuZGxlciA9IChlKSA9PiB7XHJcblx0XHRcdGxldCBjdXJyZW50WCA9IHRoaXMuZ2V0U2Nyb2xsWCgpO1xyXG5cdFx0XHRsZXQgY3VycmVudFkgPSB0aGlzLmdldFNjcm9sbFkoKTtcclxuXHRcdFx0dGhpcy5zZXRTY3JvbGxYKGN1cnJlbnRYICsgZS5kZWx0YVgpO1xyXG5cdFx0XHR0aGlzLnNldFNjcm9sbFkoY3VycmVudFkgKyBlLmRlbHRhWSk7XHJcblx0XHR9O1xyXG5cclxuXHRcdHRoaXMuX2tleURvd25IYW5kbGVyID0gKGUpID0+IHtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5leGVjdXRlRXh0ZW5zaW9uKCdrZXlEb3duJywgZSk7XHJcblx0XHR9O1xyXG5cclxuXHRcdHRoaXMuX3ZTY3JvbGwuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcy5fdlNjcm9sbEhhbmRsZXIpO1xyXG5cdFx0dGhpcy5faFNjcm9sbC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLl9oU2Nyb2xsSGFuZGxlcik7XHJcblx0XHR0aGlzLl9jb250ZW50UGFuZS5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIHRoaXMuX3doZWVsSGFuZGxlcik7XHJcblx0XHR0aGlzLl9lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9rZXlEb3duSGFuZGxlcik7XHJcblxyXG5cdH1cclxuXHJcblx0X3Jlc3R1cmVjdHVyZSAoKSB7XHJcblx0XHR0aGlzLl9jb250ZW50UGFuZS5zdHlsZS53aWR0aCA9ICdjYWxjKDEwMCUgLSAnICsgdGhpcy5fc2Nyb2xsV2lkdGggKyAncHgpJztcclxuXHRcdHRoaXMuX2NvbnRlbnRQYW5lLnN0eWxlLmhlaWdodCA9ICdjYWxjKDEwMCUgLSAnICsgdGhpcy5fc2Nyb2xsV2lkdGggKyAncHgpJztcclxuXHJcblx0XHRsZXQgdG9wRnJlZXplU2l6ZSA9IHRoaXMuX21vZGVsLmdldFRvcEZyZWV6ZVNpemUoKTtcclxuXHRcdGxldCBib3R0b21GcmVlemVTaXplID0gdGhpcy5fbW9kZWwuZ2V0Qm90dG9tRnJlZXplU2l6ZSgpO1xyXG5cdFx0bGV0IGxlZnRGcmVlemVTaXplID0gdGhpcy5fbW9kZWwuZ2V0TGVmdEZyZWV6ZVNpemUoKTtcclxuXHJcblx0XHR0aGlzLl90b3BMZWZ0UGFuZS5zdHlsZS5sZWZ0ID0gJzBweCc7XHJcblx0XHR0aGlzLl90b3BMZWZ0UGFuZS5zdHlsZS50b3AgPSAnMHB4JztcclxuXHRcdHRoaXMuX3RvcExlZnRQYW5lLnN0eWxlLndpZHRoID0gbGVmdEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fdG9wTGVmdFBhbmUuc3R5bGUuaGVpZ2h0ID0gdG9wRnJlZXplU2l6ZSArICdweCc7XHJcblx0XHR0aGlzLl90b3BQYW5lLnN0eWxlLmxlZnQgPSBsZWZ0RnJlZXplU2l6ZSArICdweCc7XHJcblx0XHR0aGlzLl90b3BQYW5lLnN0eWxlLnRvcCA9ICcwcHgnO1xyXG5cdFx0dGhpcy5fdG9wUGFuZS5zdHlsZS53aWR0aCA9ICdjYWxjKDEwMCUgLSAnICsgbGVmdEZyZWV6ZVNpemUgKyAncHgpJztcclxuXHRcdHRoaXMuX3RvcFBhbmUuc3R5bGUuaGVpZ2h0ID0gdG9wRnJlZXplU2l6ZSArICdweCc7XHJcblx0XHR0aGlzLl9sZWZ0UGFuZS5zdHlsZS5sZWZ0ID0gJzBweCc7XHJcblx0XHR0aGlzLl9sZWZ0UGFuZS5zdHlsZS50b3AgPSB0b3BGcmVlemVTaXplICsgJ3B4JztcclxuXHRcdHRoaXMuX2xlZnRQYW5lLnN0eWxlLndpZHRoID0gbGVmdEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fbGVmdFBhbmUuc3R5bGUuaGVpZ2h0ID0gJ2NhbGMoMTAwJSAtICcgKyAodG9wRnJlZXplU2l6ZSArIGJvdHRvbUZyZWV6ZVNpemUpICsgJ3B4KSc7XHJcblx0XHR0aGlzLl9jZW50ZXJQYW5lLnN0eWxlLmxlZnQgPSBsZWZ0RnJlZXplU2l6ZSArICdweCc7XHJcblx0XHR0aGlzLl9jZW50ZXJQYW5lLnN0eWxlLnRvcCA9IHRvcEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fY2VudGVyUGFuZS5zdHlsZS53aWR0aCA9ICdjYWxjKDEwMCUgLSAnICsgbGVmdEZyZWV6ZVNpemUgKyAncHgpJztcclxuXHRcdHRoaXMuX2NlbnRlclBhbmUuc3R5bGUuaGVpZ2h0ID0gJ2NhbGMoMTAwJSAtICcgKyAodG9wRnJlZXplU2l6ZSArIGJvdHRvbUZyZWV6ZVNpemUpICsgJ3B4KSc7XHJcblx0XHR0aGlzLl9ib3R0b21MZWZ0UGFuZS5zdHlsZS5sZWZ0ID0gJzBweCc7XHJcblx0XHR0aGlzLl9ib3R0b21MZWZ0UGFuZS5zdHlsZS5ib3R0b20gPSAnMHB4JztcclxuXHRcdHRoaXMuX2JvdHRvbUxlZnRQYW5lLnN0eWxlLndpZHRoID0gbGVmdEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fYm90dG9tTGVmdFBhbmUuc3R5bGUuaGVpZ2h0ID0gYm90dG9tRnJlZXplU2l6ZSArICdweCc7XHJcblx0XHR0aGlzLl9ib3R0b21QYW5lLnN0eWxlLmxlZnQgPSBsZWZ0RnJlZXplU2l6ZSArICdweCc7XHJcblx0XHR0aGlzLl9ib3R0b21QYW5lLnN0eWxlLmJvdHRvbSA9ICcwcHgnO1xyXG5cdFx0dGhpcy5fYm90dG9tUGFuZS5zdHlsZS53aWR0aCA9ICdjYWxjKDEwMCUgLSAnICsgbGVmdEZyZWV6ZVNpemUgKyAncHgpJztcclxuXHRcdHRoaXMuX2JvdHRvbVBhbmUuc3R5bGUuaGVpZ2h0ID0gYm90dG9tRnJlZXplU2l6ZSArICdweCc7XHJcblxyXG5cdFx0dGhpcy5fcmVuZGVyQ2VsbHMoKTtcclxuXHRcdHRoaXMuX3VwZGF0ZVNjcm9sbEJhcigpO1xyXG5cdH1cclxuXHJcblx0X29ic2VydmVTaXplICgpIHtcclxuXHRcdHRoaXMuX3Jlc2l6ZU9ic2VydmVyID0gbmV3IFJlc2l6ZU9ic2VydmVyKChlbnRyaWVzLCBvYnNlcnZlcikgPT4ge1xyXG5cdFx0XHR0aGlzLl91cGRhdGVTY3JvbGxCYXIoKTtcclxuXHRcdH0pO1xyXG5cdFx0dGhpcy5fcmVzaXplT2JzZXJ2ZXIub2JzZXJ2ZSh0aGlzLl9lbGVtZW50KTtcclxuXHR9XHJcblxyXG5cdF91cGRhdGVTY3JvbGxCYXIgKCkge1xyXG5cdFx0bGV0IHRvdGFsV2lkdGggPSB0aGlzLl9tb2RlbC5nZXRUb3RhbFdpZHRoKCk7XHJcblx0XHRsZXQgdG90YWxIZWlnaHQgPSB0aGlzLl9tb2RlbC5nZXRUb3RhbEhlaWdodCgpO1xyXG5cdFx0dGhpcy5faFNjcm9sbFRodW1iLnN0eWxlLndpZHRoID0gdG90YWxXaWR0aCArICdweCc7XHJcblx0XHR0aGlzLl92U2Nyb2xsVGh1bWIuc3R5bGUuaGVpZ2h0ID0gdG90YWxIZWlnaHQgKyAncHgnO1xyXG5cclxuXHRcdGxldCBncmlkUmVjdCA9IHRoaXMuX2VsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblx0XHRsZXQgc2Nyb2xsQmFyU3RhdGUgPSB0aGlzLl9tb2RlbC5kZXRlcm1pbmVTY3JvbGxiYXJTdGF0ZShncmlkUmVjdC53aWR0aCwgZ3JpZFJlY3QuaGVpZ2h0LCB0aGlzLl9zY3JvbGxXaWR0aCk7XHJcblxyXG5cdFx0c3dpdGNoIChzY3JvbGxCYXJTdGF0ZSkge1xyXG5cdFx0XHRjYXNlICduJzpcclxuXHRcdFx0XHR0aGlzLl9oU2Nyb2xsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0XHRcdFx0dGhpcy5fdlNjcm9sbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cdFx0XHRcdHRoaXMuX2NvbnRlbnRQYW5lLnN0eWxlLndpZHRoID0gJzEwMCUnO1xyXG5cdFx0XHRcdHRoaXMuX2NvbnRlbnRQYW5lLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAnaCc6XHJcblx0XHRcdFx0dGhpcy5faFNjcm9sbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuXHRcdFx0XHR0aGlzLl92U2Nyb2xsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0XHRcdFx0dGhpcy5faFNjcm9sbC5zdHlsZS53aWR0aCA9ICcxMDAlJztcclxuXHRcdFx0XHR0aGlzLl9jb250ZW50UGFuZS5zdHlsZS53aWR0aCA9ICcxMDAlJztcclxuXHRcdFx0XHR0aGlzLl9jb250ZW50UGFuZS5zdHlsZS5oZWlnaHQgPSAnY2FsYygxMDAlIC0gJyArIHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4KSc7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGNhc2UgJ3YnOlxyXG5cdFx0XHRcdHRoaXMuX2hTY3JvbGwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHRcdFx0XHR0aGlzLl92U2Nyb2xsLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG5cdFx0XHRcdHRoaXMuX3ZTY3JvbGwuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xyXG5cdFx0XHRcdHRoaXMuX2NvbnRlbnRQYW5lLnN0eWxlLndpZHRoID0gJ2NhbGMoMTAwJSAtICcgKyB0aGlzLl9zY3JvbGxXaWR0aCArICdweCknO1xyXG5cdFx0XHRcdHRoaXMuX2NvbnRlbnRQYW5lLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAnYic6XHJcblx0XHRcdFx0dGhpcy5faFNjcm9sbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuXHRcdFx0XHR0aGlzLl92U2Nyb2xsLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG5cdFx0XHRcdHRoaXMuX2hTY3JvbGwuc3R5bGUud2lkdGggPSAnY2FsYygxMDAlIC0gJyArIHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4KSc7XHJcblx0XHRcdFx0dGhpcy5fdlNjcm9sbC5zdHlsZS5oZWlnaHQgPSAnY2FsYygxMDAlIC0gJyArIHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4KSc7XHJcblx0XHRcdFx0dGhpcy5fY29udGVudFBhbmUuc3R5bGUud2lkdGggPSAnY2FsYygxMDAlIC0gJyArIHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4KSc7XHJcblx0XHRcdFx0dGhpcy5fY29udGVudFBhbmUuc3R5bGUuaGVpZ2h0ID0gJ2NhbGMoMTAwJSAtICcgKyB0aGlzLl9zY3JvbGxXaWR0aCArICdweCknO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0X3JlbmRlckNlbGxzICgpIHtcclxuXHRcdGxldCB0b3BGcmVlemUgPSB0aGlzLl9tb2RlbC5nZXRUb3BGcmVlemVSb3dzKCk7XHJcblx0XHRsZXQgbGVmdEZyZWV6ZSA9IHRoaXMuX21vZGVsLmdldExlZnRGcmVlemVSb3dzKCk7XHJcblx0XHRsZXQgYm90dG9tRnJlZXplID0gdGhpcy5fbW9kZWwuZ2V0Qm90dG9tRnJlZXplUm93cygpO1xyXG5cdFx0bGV0IHJvd0NvdW50ID0gdGhpcy5fbW9kZWwuZ2V0Um93Q291bnQoKTtcclxuXHRcdGxldCBjb2x1bW5Db3VudCA9IHRoaXMuX21vZGVsLmdldENvbHVtbkNvdW50KCk7XHJcblx0XHRsZXQgdG9wUnVubmVyID0gMDtcclxuXHRcdGxldCBsZWZ0UnVubmVyID0gMDtcclxuXHRcdGxldCBjb2xXaWR0aCA9IFtdO1xyXG5cclxuXHRcdC8vUmVuZGVyIHRvcCByb3dzXHJcblx0XHR0b3BSdW5uZXIgPSAwO1xyXG5cdFx0Zm9yIChsZXQgaj0wOyBqPHRvcEZyZWV6ZTsgaisrKSB7XHJcblx0XHRcdGxldCByb3dIZWlnaHQgPSB0aGlzLl9tb2RlbC5nZXRSb3dIZWlnaHQoaik7XHJcblx0XHRcdC8vUmVuZGVyIHRvcCBsZWZ0IGNlbGxzXHJcblx0XHRcdGxlZnRSdW5uZXIgPSAwO1xyXG5cdFx0XHRmb3IgKGxldCBpPTA7IGk8bGVmdEZyZWV6ZTsgaSsrKSB7XHJcblx0XHRcdFx0Y29sV2lkdGhbaV0gPSB0aGlzLl9tb2RlbC5nZXRDb2x1bW5XaWR0aChpKTtcclxuXHRcdFx0XHR0aGlzLl9yZW5kZXJDZWxsKGosIGksIHRoaXMuX3RvcExlZnRJbm5lciwgbGVmdFJ1bm5lciwgdG9wUnVubmVyLCBjb2xXaWR0aFtpXSwgcm93SGVpZ2h0KTtcclxuXHRcdFx0XHRsZWZ0UnVubmVyICs9IGNvbFdpZHRoW2ldO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vUmVuZGVyIHRvcCBjZWxsc1xyXG5cdFx0XHRsZWZ0UnVubmVyID0gMDtcclxuXHRcdFx0Zm9yIChsZXQgaT1sZWZ0RnJlZXplOyBpPGNvbHVtbkNvdW50OyBpKyspIHtcclxuXHRcdFx0XHRjb2xXaWR0aFtpXSA9IHRoaXMuX21vZGVsLmdldENvbHVtbldpZHRoKGkpO1xyXG5cdFx0XHRcdHRoaXMuX3JlbmRlckNlbGwoaiwgaSwgdGhpcy5fdG9wSW5uZXIsIGxlZnRSdW5uZXIsIHRvcFJ1bm5lciwgY29sV2lkdGhbaV0sIHJvd0hlaWdodCk7XHJcblx0XHRcdFx0bGVmdFJ1bm5lciArPSBjb2xXaWR0aFtpXTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0b3BSdW5uZXIgKz0gcm93SGVpZ2h0O1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vUmVuZGVyIG1pZGRsZSByb3dzXHJcblx0XHR0b3BSdW5uZXIgPSAwO1xyXG5cdFx0Zm9yIChsZXQgaj10b3BGcmVlemU7IGo8KHJvd0NvdW50LWJvdHRvbUZyZWV6ZSk7IGorKykge1xyXG5cdFx0XHRsZXQgcm93SGVpZ2h0ID0gdGhpcy5fbW9kZWwuZ2V0Um93SGVpZ2h0KGopO1xyXG5cdFx0XHQvL1JlbmRlciBsZWZ0IGNlbGxzXHJcblx0XHRcdGxlZnRSdW5uZXIgPSAwO1xyXG5cdFx0XHRmb3IgKGxldCBpPTA7IGk8bGVmdEZyZWV6ZTsgaSsrKSB7XHJcblx0XHRcdFx0dGhpcy5fcmVuZGVyQ2VsbChqLCBpLCB0aGlzLl9sZWZ0SW5uZXIsIGxlZnRSdW5uZXIsIHRvcFJ1bm5lciwgY29sV2lkdGhbaV0sIHJvd0hlaWdodCk7XHJcblx0XHRcdFx0bGVmdFJ1bm5lciArPSBjb2xXaWR0aFtpXTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvL1JlbmRlciBjZW50ZXIgY2VsbHNcclxuXHRcdFx0bGVmdFJ1bm5lciA9IDA7XHJcblx0XHRcdGZvciAobGV0IGk9bGVmdEZyZWV6ZTsgaTxjb2x1bW5Db3VudDsgaSsrKSB7XHJcblx0XHRcdFx0dGhpcy5fcmVuZGVyQ2VsbChqLCBpLCB0aGlzLl9jZW50ZXJJbm5lciwgbGVmdFJ1bm5lciwgdG9wUnVubmVyLCBjb2xXaWR0aFtpXSwgcm93SGVpZ2h0KTtcclxuXHRcdFx0XHRsZWZ0UnVubmVyICs9IGNvbFdpZHRoW2ldO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRvcFJ1bm5lciArPSByb3dIZWlnaHQ7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly9SZW5kZXIgYm90dG9tIHJvd3NcclxuXHRcdHRvcFJ1bm5lciA9IDA7XHJcblx0XHRmb3IgKGxldCBqPShyb3dDb3VudC1ib3R0b21GcmVlemUpOyBqPHJvd0NvdW50OyBqKyspIHtcclxuXHRcdFx0bGV0IHJvd0hlaWdodCA9IHRoaXMuX21vZGVsLmdldFJvd0hlaWdodChqKTtcclxuXHRcdFx0Ly9SZW5kZXIgbGVmdCBjZWxsc1xyXG5cdFx0XHRsZWZ0UnVubmVyID0gMDtcclxuXHRcdFx0Zm9yIChsZXQgaT0wOyBpPGxlZnRGcmVlemU7IGkrKykge1xyXG5cdFx0XHRcdHRoaXMuX3JlbmRlckNlbGwoaiwgaSwgdGhpcy5fYm90dG9tTGVmdElubmVyLCBsZWZ0UnVubmVyLCB0b3BSdW5uZXIsIGNvbFdpZHRoW2ldLCByb3dIZWlnaHQpO1xyXG5cdFx0XHRcdGxlZnRSdW5uZXIgKz0gY29sV2lkdGhbaV07XHJcblx0XHRcdH1cclxuXHRcdFx0Ly9SZW5kZXIgY2VudGVyIGNlbGxzXHJcblx0XHRcdGxlZnRSdW5uZXIgPSAwO1xyXG5cdFx0XHRmb3IgKGxldCBpPWxlZnRGcmVlemU7IGk8Y29sdW1uQ291bnQ7IGkrKykge1xyXG5cdFx0XHRcdHRoaXMuX3JlbmRlckNlbGwoaiwgaSwgdGhpcy5fYm90dG9tSW5uZXIsIGxlZnRSdW5uZXIsIHRvcFJ1bm5lciwgY29sV2lkdGhbaV0sIHJvd0hlaWdodCk7XHJcblx0XHRcdFx0bGVmdFJ1bm5lciArPSBjb2xXaWR0aFtpXTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0b3BSdW5uZXIgKz0gcm93SGVpZ2h0O1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0X3JlbmRlckNlbGwgKHJvd0luZGV4LCBjb2xJbmRleCwgcGFuZSwgeCwgeSwgd2lkdGgsIGhlaWdodCkge1xyXG5cdFx0bGV0IGRhdGEgPSB0aGlzLl9tb2RlbC5nZXREYXRhQXQocm93SW5kZXgsIGNvbEluZGV4KTtcclxuXHJcblx0XHQvL0RhdGEgY2FuIGJlIHRyYW5zZm9ybWVkIGJlZm9yZSByZW5kZXJpbmcgdXNpbmcgZGF0YUJlZm9yZVJlbmRlciBleHRlbnNpb25cclxuXHRcdGxldCBhcmcgPSB7ZGF0YTogZGF0YX07XHJcblx0XHR0aGlzLl9leHRlbnNpb25zLmV4ZWN1dGVFeHRlbnNpb24oJ2RhdGFCZWZvcmVSZW5kZXInLCBhcmcpO1xyXG5cdFx0ZGF0YSA9IGFyZy5kYXRhO1xyXG5cclxuXHRcdGxldCBjZWxsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRsZXQgY2VsbENsYXNzZXMgPSB0aGlzLl9tb2RlbC5nZXRDZWxsQ2xhc3Nlcyhyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cdFx0Y2VsbC5jbGFzc05hbWUgPSAncGdyaWQtY2VsbCAnICsgY2VsbENsYXNzZXMuam9pbignICcpO1xyXG5cdFx0Y2VsbC5zdHlsZS5sZWZ0ID0geCArICdweCc7XHJcblx0XHRjZWxsLnN0eWxlLnRvcCA9IHkgKyAncHgnO1xyXG5cdFx0Y2VsbC5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcclxuXHRcdGNlbGwuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcclxuXHRcdGNlbGwuZGF0YXNldC5yb3dJbmRleCA9IHJvd0luZGV4O1xyXG5cdFx0Y2VsbC5kYXRhc2V0LmNvbEluZGV4ID0gY29sSW5kZXg7XHJcblxyXG5cdFx0bGV0IGNlbGxDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRjZWxsQ29udGVudC5jbGFzc05hbWUgPSAncGdyaWQtY2VsbC1jb250ZW50JztcclxuXHRcdGNlbGwuYXBwZW5kQ2hpbGQoY2VsbENvbnRlbnQpO1xyXG5cdFx0cGFuZS5hcHBlbmRDaGlsZChjZWxsKTtcclxuXHJcblx0XHRsZXQgZXZlbnRBcmcgPSB7XHJcblx0XHRcdGNlbGwsXHJcblx0XHRcdGNlbGxDb250ZW50LFxyXG5cdFx0XHRyb3dJbmRleCxcclxuXHRcdFx0Y29sSW5kZXgsXHJcblx0XHRcdGRhdGEsXHJcblx0XHRcdHJvd0lkOiB0aGlzLl9tb2RlbC5nZXRSb3dJZChyb3dJbmRleCksXHJcblx0XHRcdGZpZWxkOiB0aGlzLl9tb2RlbC5nZXRDb2x1bW5GaWVsZChjb2xJbmRleCksXHJcblx0XHRcdGhhbmRsZWQ6IGZhbHNlXHJcblx0XHR9O1xyXG5cclxuXHRcdC8vSWYgdGhlcmUncyBjZWxsUmVuZGVyIGV4dGVuc2lvbiwgdXNlIGNlbGxSZW5kZXIgZXh0ZW5zaW9uIHRvIHJlbmRlciB0aGUgY2VsbFxyXG5cdFx0Ly9FbHNlIGp1c3Qgc2V0IHRoZSBkYXRhIHRvIHRoZSBjZWxsQ29udGVudCBkaXJlY3RseVxyXG5cdFx0bGV0IGhhbmRsZWRCeUV4dCA9IGZhbHNlO1xyXG5cdFx0aWYgKHRoaXMuX2V4dGVuc2lvbnMuaGFzRXh0ZW5zaW9uKCdjZWxsUmVuZGVyJykpIHtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5leGVjdXRlRXh0ZW5zaW9uKCdjZWxsUmVuZGVyJywgZXZlbnRBcmcpO1xyXG5cdFx0XHRoYW5kbGVkQnlFeHQgPSBldmVudEFyZy5oYW5kbGVkO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICghaGFuZGxlZEJ5RXh0KSB7XHJcblx0XHRcdGlmIChkYXRhICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRjZWxsQ29udGVudC5pbm5lckhUTUwgPSBkYXRhO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5fZXh0ZW5zaW9ucy5leGVjdXRlRXh0ZW5zaW9uKCdjZWxsQWZ0ZXJSZW5kZXInLCBldmVudEFyZyk7XHJcblx0XHR0aGlzLl9leHRlbnNpb25zLmV4ZWN1dGVFeHRlbnNpb24oJ2NlbGxBZnRlclVwZGF0ZScsIGV2ZW50QXJnKTtcclxuXHJcblx0XHRldmVudEFyZyA9IG51bGw7XHJcblx0fVxyXG5cclxuXHRfbWVhc3VyZVNjcm9sbGJhcldpZHRoICgpIHtcclxuXHRcdHZhciBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuXHRcdGlubmVyLnN0eWxlLndpZHRoID0gJzEwMCUnO1xyXG5cdFx0aW5uZXIuc3R5bGUuaGVpZ2h0ID0gJzIwMHB4JztcclxuXHRcdHZhciBvdXRtb3N0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRvdXRtb3N0LmNsYXNzTmFtZSA9ICdwZ3JpZCc7XHJcblx0XHR2YXIgb3V0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHRcdG91dGVyLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcclxuXHRcdG91dGVyLnN0eWxlLnRvcCA9ICcwcHgnO1xyXG5cdFx0b3V0ZXIuc3R5bGUubGVmdCA9ICcwcHgnO1xyXG5cdFx0b3V0ZXIuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xyXG5cdFx0b3V0ZXIuc3R5bGUud2lkdGggPSAnMjAwcHgnO1xyXG5cdFx0b3V0ZXIuc3R5bGUuaGVpZ2h0ID0gJzE1MHB4JztcclxuXHRcdG91dGVyLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XHJcblx0XHRvdXRlci5hcHBlbmRDaGlsZChpbm5lcik7XHJcblx0XHRvdXRtb3N0LmFwcGVuZENoaWxkKG91dGVyKTtcclxuXHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQob3V0bW9zdCk7XHJcblx0XHR2YXIgdzEgPSBpbm5lci5vZmZzZXRXaWR0aDtcclxuXHRcdG91dGVyLnN0eWxlLm92ZXJmbG93ID0gJ3Njcm9sbCc7XHJcblx0XHR2YXIgdzIgPSBpbm5lci5vZmZzZXRXaWR0aDtcclxuXHRcdGlmICh3MSA9PSB3MikgdzIgPSBvdXRlci5jbGllbnRXaWR0aDtcclxuXHRcdGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQgKG91dG1vc3QpO1xyXG5cdFx0cmV0dXJuICh3MSAtIHcyKSArICh0aGlzLl9kZXRlY3RJRSgpPzE6MCk7XHJcblx0fVxyXG5cclxuXHJcblx0X2RldGVjdElFICgpIHtcclxuXHQgIHZhciB1YSA9IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50O1xyXG5cdCAgdmFyIG1zaWUgPSB1YS5pbmRleE9mKCdNU0lFICcpO1xyXG5cdCAgaWYgKG1zaWUgPiAwKSB7XHJcblx0ICAgIC8vIElFIDEwIG9yIG9sZGVyID0+IHJldHVybiB2ZXJzaW9uIG51bWJlclxyXG5cdCAgICByZXR1cm4gcGFyc2VJbnQodWEuc3Vic3RyaW5nKG1zaWUgKyA1LCB1YS5pbmRleE9mKCcuJywgbXNpZSkpLCAxMCk7XHJcblx0ICB9XHJcblxyXG5cdCAgdmFyIHRyaWRlbnQgPSB1YS5pbmRleE9mKCdUcmlkZW50LycpO1xyXG5cdCAgaWYgKHRyaWRlbnQgPiAwKSB7XHJcblx0ICAgIC8vIElFIDExID0+IHJldHVybiB2ZXJzaW9uIG51bWJlclxyXG5cdCAgICB2YXIgcnYgPSB1YS5pbmRleE9mKCdydjonKTtcclxuXHQgICAgcmV0dXJuIHBhcnNlSW50KHVhLnN1YnN0cmluZyhydiArIDMsIHVhLmluZGV4T2YoJy4nLCBydikpLCAxMCk7XHJcblx0ICB9XHJcblxyXG5cdCAgdmFyIGVkZ2UgPSB1YS5pbmRleE9mKCdFZGdlLycpO1xyXG5cdCAgaWYgKGVkZ2UgPiAwKSB7XHJcblx0ICAgIC8vIEVkZ2UgKElFIDEyKykgPT4gcmV0dXJuIHZlcnNpb24gbnVtYmVyXHJcblx0ICAgIHJldHVybiBwYXJzZUludCh1YS5zdWJzdHJpbmcoZWRnZSArIDUsIHVhLmluZGV4T2YoJy4nLCBlZGdlKSksIDEwKTtcclxuXHQgIH1cclxuXHQgIC8vIG90aGVyIGJyb3dzZXJcclxuXHQgIHJldHVybiBmYWxzZTtcclxuXHR9XHJcbn0iLCJpbXBvcnQgeyBQR3JpZCB9IGZyb20gJy4vZ3JpZC9ncmlkJztcclxuXHJcbndpbmRvdy5QR3JpZCA9IFBHcmlkO1xyXG5cclxuLy8gUG9seWZpbGwgLSBFbGVtZW50LnNjcm9sbEludG9WaWV3SWZOZWVkZWRcclxuXHJcbmlmICghRWxlbWVudC5wcm90b3R5cGUuc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCkge1xyXG4gICAgRWxlbWVudC5wcm90b3R5cGUuc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCA9IGZ1bmN0aW9uIChjZW50ZXJJZk5lZWRlZCkge1xyXG4gICAgICAgIGNlbnRlcklmTmVlZGVkID0gYXJndW1lbnRzLmxlbmd0aCA9PT0gMCA/IHRydWUgOiAhIWNlbnRlcklmTmVlZGVkO1xyXG5cclxuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlLFxyXG4gICAgICAgICAgICBwYXJlbnRDb21wdXRlZFN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUocGFyZW50LCBudWxsKSxcclxuICAgICAgICAgICAgcGFyZW50Qm9yZGVyVG9wV2lkdGggPSBwYXJzZUludChwYXJlbnRDb21wdXRlZFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2JvcmRlci10b3Atd2lkdGgnKSksXHJcbiAgICAgICAgICAgIHBhcmVudEJvcmRlckxlZnRXaWR0aCA9IHBhcnNlSW50KHBhcmVudENvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnYm9yZGVyLWxlZnQtd2lkdGgnKSksXHJcbiAgICAgICAgICAgIG92ZXJUb3AgPSB0aGlzLm9mZnNldFRvcCAtIHBhcmVudC5vZmZzZXRUb3AgPCBwYXJlbnQuc2Nyb2xsVG9wLFxyXG4gICAgICAgICAgICBvdmVyQm90dG9tID0gKHRoaXMub2Zmc2V0VG9wIC0gcGFyZW50Lm9mZnNldFRvcCArIHRoaXMuY2xpZW50SGVpZ2h0IC0gcGFyZW50Qm9yZGVyVG9wV2lkdGgpID4gKHBhcmVudC5zY3JvbGxUb3AgKyBwYXJlbnQuY2xpZW50SGVpZ2h0KSxcclxuICAgICAgICAgICAgb3ZlckxlZnQgPSB0aGlzLm9mZnNldExlZnQgLSBwYXJlbnQub2Zmc2V0TGVmdCA8IHBhcmVudC5zY3JvbGxMZWZ0LFxyXG4gICAgICAgICAgICBvdmVyUmlnaHQgPSAodGhpcy5vZmZzZXRMZWZ0IC0gcGFyZW50Lm9mZnNldExlZnQgKyB0aGlzLmNsaWVudFdpZHRoIC0gcGFyZW50Qm9yZGVyTGVmdFdpZHRoKSA+IChwYXJlbnQuc2Nyb2xsTGVmdCArIHBhcmVudC5jbGllbnRXaWR0aCksXHJcbiAgICAgICAgICAgIGFsaWduV2l0aFRvcCA9IG92ZXJUb3AgJiYgIW92ZXJCb3R0b207XHJcblxyXG4gICAgICAgIGlmICgob3ZlclRvcCB8fCBvdmVyQm90dG9tKSAmJiBjZW50ZXJJZk5lZWRlZCkge1xyXG4gICAgICAgICAgICBwYXJlbnQuc2Nyb2xsVG9wID0gdGhpcy5vZmZzZXRUb3AgLSBwYXJlbnQub2Zmc2V0VG9wIC0gcGFyZW50LmNsaWVudEhlaWdodCAvIDIgLSBwYXJlbnRCb3JkZXJUb3BXaWR0aCArIHRoaXMuY2xpZW50SGVpZ2h0IC8gMjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICgob3ZlckxlZnQgfHwgb3ZlclJpZ2h0KSAmJiBjZW50ZXJJZk5lZWRlZCkge1xyXG4gICAgICAgICAgICBwYXJlbnQuc2Nyb2xsTGVmdCA9IHRoaXMub2Zmc2V0TGVmdCAtIHBhcmVudC5vZmZzZXRMZWZ0IC0gcGFyZW50LmNsaWVudFdpZHRoIC8gMiAtIHBhcmVudEJvcmRlckxlZnRXaWR0aCArIHRoaXMuY2xpZW50V2lkdGggLyAyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKChvdmVyVG9wIHx8IG92ZXJCb3R0b20gfHwgb3ZlckxlZnQgfHwgb3ZlclJpZ2h0KSAmJiAhY2VudGVySWZOZWVkZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5zY3JvbGxJbnRvVmlldyhhbGlnbldpdGhUb3ApO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn0iXX0=

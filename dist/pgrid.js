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
				this._editorContainer = document.createElement('div');
				this._editorContainer.style.position = 'absolute';
				this._editorContainer.style.top = cellBound.top + 'px';
				this._editorContainer.style.left = cellBound.left + 'px';
				this._editorContainer.style.width = cellBound.width + 'px';
				this._editorContainer.style.height = cellBound.height + 'px';
				document.body.appendChild(this._editorContainer);

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
			if (this._editorContainer) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcmVzaXplLW9ic2VydmVyLXBvbHlmaWxsL2Rpc3QvUmVzaXplT2JzZXJ2ZXIuanMiLCJzcmNcXGRhdGFcXHRhYmxlLmpzIiwic3JjXFxleHRlbnNpb25zXFxjb3B5cGFzdGUuanMiLCJzcmNcXGV4dGVuc2lvbnNcXGVkaXRvci5qcyIsInNyY1xcZXh0ZW5zaW9uc1xcc2VsZWN0aW9uLmpzIiwic3JjXFxleHRlbnNpb25zXFx2aWV3LXVwZGF0ZXIuanMiLCJzcmNcXGdyaWRcXGV2ZW50LmpzIiwic3JjXFxncmlkXFxleHRlbnNpb24uanMiLCJzcmNcXGdyaWRcXGdyaWQuanMiLCJzcmNcXGdyaWRcXG1vZGVsLmpzIiwic3JjXFxncmlkXFxzdGF0ZS5qcyIsInNyY1xcZ3JpZFxcdXRpbHMuanMiLCJzcmNcXGdyaWRcXHZpZXcuanMiLCJzcmNcXG1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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LEtBQUssV0FBM0MsR0FBeUQscUJBQTFELEdBQW9GLE9BQU8sVUFBUCxHQUFvQixPQUFPLFdBUC9IO0FBQUEsWUFRSSxlQUFlLFdBQVcsQ0FBQyxVQVIvQjs7QUFVQSxZQUFJLENBQUMsV0FBVyxVQUFaLEtBQTJCLGNBQS9CLEVBQStDO0FBQzNDLG1CQUFPLFNBQVAsR0FBbUIsS0FBSyxTQUFMLEdBQWlCLE9BQU8sU0FBeEIsR0FBb0MsT0FBTyxZQUFQLEdBQXNCLENBQTFELEdBQThELG9CQUE5RCxHQUFxRixLQUFLLFlBQUwsR0FBb0IsQ0FBNUg7QUFDSDs7QUFFRCxZQUFJLENBQUMsWUFBWSxTQUFiLEtBQTJCLGNBQS9CLEVBQStDO0FBQzNDLG1CQUFPLFVBQVAsR0FBb0IsS0FBSyxVQUFMLEdBQWtCLE9BQU8sVUFBekIsR0FBc0MsT0FBTyxXQUFQLEdBQXFCLENBQTNELEdBQStELHFCQUEvRCxHQUF1RixLQUFLLFdBQUwsR0FBbUIsQ0FBOUg7QUFDSDs7QUFFRCxZQUFJLENBQUMsV0FBVyxVQUFYLElBQXlCLFFBQXpCLElBQXFDLFNBQXRDLEtBQW9ELENBQUMsY0FBekQsRUFBeUU7QUFDckUsaUJBQUssY0FBTCxDQUFvQixZQUFwQjtBQUNIO0FBQ0osS0F4QkQ7QUF5QkgiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcblx0dHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCkgOlxuXHR0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoZmFjdG9yeSkgOlxuXHQoZ2xvYmFsLlJlc2l6ZU9ic2VydmVyID0gZmFjdG9yeSgpKTtcbn0odGhpcywgKGZ1bmN0aW9uICgpIHsgJ3VzZSBzdHJpY3QnO1xuXG4vKipcclxuICogQSBjb2xsZWN0aW9uIG9mIHNoaW1zIHRoYXQgcHJvdmlkZSBtaW5pbWFsIGZ1bmN0aW9uYWxpdHkgb2YgdGhlIEVTNiBjb2xsZWN0aW9ucy5cclxuICpcclxuICogVGhlc2UgaW1wbGVtZW50YXRpb25zIGFyZSBub3QgbWVhbnQgdG8gYmUgdXNlZCBvdXRzaWRlIG9mIHRoZSBSZXNpemVPYnNlcnZlclxyXG4gKiBtb2R1bGVzIGFzIHRoZXkgY292ZXIgb25seSBhIGxpbWl0ZWQgcmFuZ2Ugb2YgdXNlIGNhc2VzLlxyXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIHJlcXVpcmUtanNkb2MsIHZhbGlkLWpzZG9jICovXG52YXIgTWFwU2hpbSA9IChmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHR5cGVvZiBNYXAgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBNYXA7XG4gICAgfVxuXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIGluZGV4IGluIHByb3ZpZGVkIGFycmF5IHRoYXQgbWF0Y2hlcyB0aGUgc3BlY2lmaWVkIGtleS5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5PEFycmF5Pn0gYXJyXHJcbiAgICAgKiBAcGFyYW0geyp9IGtleVxyXG4gICAgICogQHJldHVybnMge251bWJlcn1cclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldEluZGV4KGFyciwga2V5KSB7XG4gICAgICAgIHZhciByZXN1bHQgPSAtMTtcblxuICAgICAgICBhcnIuc29tZShmdW5jdGlvbiAoZW50cnksIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoZW50cnlbMF0gPT09IGtleSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGluZGV4O1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICByZXR1cm4gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gYW5vbnltb3VzKCkge1xuICAgICAgICAgICAgdGhpcy5fX2VudHJpZXNfXyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHByb3RvdHlwZUFjY2Vzc29ycyA9IHsgc2l6ZTogeyBjb25maWd1cmFibGU6IHRydWUgfSB9O1xuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAgICAgICAqL1xuICAgICAgICBwcm90b3R5cGVBY2Nlc3NvcnMuc2l6ZS5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fX2VudHJpZXNfXy5sZW5ndGg7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHsqfSBrZXlcclxuICAgICAgICAgKiBAcmV0dXJucyB7Kn1cclxuICAgICAgICAgKi9cbiAgICAgICAgYW5vbnltb3VzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBnZXRJbmRleCh0aGlzLl9fZW50cmllc19fLCBrZXkpO1xuICAgICAgICAgICAgdmFyIGVudHJ5ID0gdGhpcy5fX2VudHJpZXNfX1tpbmRleF07XG5cbiAgICAgICAgICAgIHJldHVybiBlbnRyeSAmJiBlbnRyeVsxXTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0geyp9IGtleVxyXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gdmFsdWVcclxuICAgICAgICAgKiBAcmV0dXJucyB7dm9pZH1cclxuICAgICAgICAgKi9cbiAgICAgICAgYW5vbnltb3VzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gZ2V0SW5kZXgodGhpcy5fX2VudHJpZXNfXywga2V5KTtcblxuICAgICAgICAgICAgaWYgKH5pbmRleCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX19lbnRyaWVzX19baW5kZXhdWzFdID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX19lbnRyaWVzX18ucHVzaChba2V5LCB2YWx1ZV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7Kn0ga2V5XHJcbiAgICAgICAgICogQHJldHVybnMge3ZvaWR9XHJcbiAgICAgICAgICovXG4gICAgICAgIGFub255bW91cy5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgdmFyIGVudHJpZXMgPSB0aGlzLl9fZW50cmllc19fO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gZ2V0SW5kZXgoZW50cmllcywga2V5KTtcblxuICAgICAgICAgICAgaWYgKH5pbmRleCkge1xuICAgICAgICAgICAgICAgIGVudHJpZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0geyp9IGtleVxyXG4gICAgICAgICAqIEByZXR1cm5zIHt2b2lkfVxyXG4gICAgICAgICAqL1xuICAgICAgICBhbm9ueW1vdXMucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiAhIX5nZXRJbmRleCh0aGlzLl9fZW50cmllc19fLCBrZXkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEByZXR1cm5zIHt2b2lkfVxyXG4gICAgICAgICAqL1xuICAgICAgICBhbm9ueW1vdXMucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5fX2VudHJpZXNfXy5zcGxpY2UoMCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcclxuICAgICAgICAgKiBAcGFyYW0geyp9IFtjdHg9bnVsbF1cclxuICAgICAgICAgKiBAcmV0dXJucyB7dm9pZH1cclxuICAgICAgICAgKi9cbiAgICAgICAgYW5vbnltb3VzLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBjdHgpIHtcbiAgICAgICAgICAgIHZhciB0aGlzJDEgPSB0aGlzO1xuICAgICAgICAgICAgaWYgKCBjdHggPT09IHZvaWQgMCApIGN0eCA9IG51bGw7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsaXN0ID0gdGhpcyQxLl9fZW50cmllc19fOyBpIDwgbGlzdC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIHZhciBlbnRyeSA9IGxpc3RbaV07XG5cbiAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKGN0eCwgZW50cnlbMV0sIGVudHJ5WzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyggYW5vbnltb3VzLnByb3RvdHlwZSwgcHJvdG90eXBlQWNjZXNzb3JzICk7XG5cbiAgICAgICAgcmV0dXJuIGFub255bW91cztcbiAgICB9KCkpO1xufSkoKTtcblxuLyoqXHJcbiAqIERldGVjdHMgd2hldGhlciB3aW5kb3cgYW5kIGRvY3VtZW50IG9iamVjdHMgYXJlIGF2YWlsYWJsZSBpbiBjdXJyZW50IGVudmlyb25tZW50LlxyXG4gKi9cbnZhciBpc0Jyb3dzZXIgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5kb2N1bWVudCA9PT0gZG9jdW1lbnQ7XG5cbi8vIFJldHVybnMgZ2xvYmFsIG9iamVjdCBvZiBhIGN1cnJlbnQgZW52aXJvbm1lbnQuXG52YXIgZ2xvYmFsJDEgPSAoZnVuY3Rpb24gKCkge1xuICAgIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyAmJiBnbG9iYWwuTWF0aCA9PT0gTWF0aCkge1xuICAgICAgICByZXR1cm4gZ2xvYmFsO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgJiYgc2VsZi5NYXRoID09PSBNYXRoKSB7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuTWF0aCA9PT0gTWF0aCkge1xuICAgICAgICByZXR1cm4gd2luZG93O1xuICAgIH1cblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1uZXctZnVuY1xuICAgIHJldHVybiBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xufSkoKTtcblxuLyoqXHJcbiAqIEEgc2hpbSBmb3IgdGhlIHJlcXVlc3RBbmltYXRpb25GcmFtZSB3aGljaCBmYWxscyBiYWNrIHRvIHRoZSBzZXRUaW1lb3V0IGlmXHJcbiAqIGZpcnN0IG9uZSBpcyBub3Qgc3VwcG9ydGVkLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXF1ZXN0cycgaWRlbnRpZmllci5cclxuICovXG52YXIgcmVxdWVzdEFuaW1hdGlvbkZyYW1lJDEgPSAoZnVuY3Rpb24gKCkge1xuICAgIGlmICh0eXBlb2YgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIEl0J3MgcmVxdWlyZWQgdG8gdXNlIGEgYm91bmRlZCBmdW5jdGlvbiBiZWNhdXNlIElFIHNvbWV0aW1lcyB0aHJvd3NcbiAgICAgICAgLy8gYW4gXCJJbnZhbGlkIGNhbGxpbmcgb2JqZWN0XCIgZXJyb3IgaWYgckFGIGlzIGludm9rZWQgd2l0aG91dCB0aGUgZ2xvYmFsXG4gICAgICAgIC8vIG9iamVjdCBvbiB0aGUgbGVmdCBoYW5kIHNpZGUuXG4gICAgICAgIHJldHVybiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUuYmluZChnbG9iYWwkMSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChjYWxsYmFjaykgeyByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7IHJldHVybiBjYWxsYmFjayhEYXRlLm5vdygpKTsgfSwgMTAwMCAvIDYwKTsgfTtcbn0pKCk7XG5cbi8vIERlZmluZXMgbWluaW11bSB0aW1lb3V0IGJlZm9yZSBhZGRpbmcgYSB0cmFpbGluZyBjYWxsLlxudmFyIHRyYWlsaW5nVGltZW91dCA9IDI7XG5cbi8qKlxyXG4gKiBDcmVhdGVzIGEgd3JhcHBlciBmdW5jdGlvbiB3aGljaCBlbnN1cmVzIHRoYXQgcHJvdmlkZWQgY2FsbGJhY2sgd2lsbCBiZVxyXG4gKiBpbnZva2VkIG9ubHkgb25jZSBkdXJpbmcgdGhlIHNwZWNpZmllZCBkZWxheSBwZXJpb2QuXHJcbiAqXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gYmUgaW52b2tlZCBhZnRlciB0aGUgZGVsYXkgcGVyaW9kLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gZGVsYXkgLSBEZWxheSBhZnRlciB3aGljaCB0byBpbnZva2UgY2FsbGJhY2suXHJcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn1cclxuICovXG52YXIgdGhyb3R0bGUgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIGRlbGF5KSB7XG4gICAgdmFyIGxlYWRpbmdDYWxsID0gZmFsc2UsXG4gICAgICAgIHRyYWlsaW5nQ2FsbCA9IGZhbHNlLFxuICAgICAgICBsYXN0Q2FsbFRpbWUgPSAwO1xuXG4gICAgLyoqXHJcbiAgICAgKiBJbnZva2VzIHRoZSBvcmlnaW5hbCBjYWxsYmFjayBmdW5jdGlvbiBhbmQgc2NoZWR1bGVzIG5ldyBpbnZvY2F0aW9uIGlmXHJcbiAgICAgKiB0aGUgXCJwcm94eVwiIHdhcyBjYWxsZWQgZHVyaW5nIGN1cnJlbnQgcmVxdWVzdC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7dm9pZH1cclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlc29sdmVQZW5kaW5nKCkge1xuICAgICAgICBpZiAobGVhZGluZ0NhbGwpIHtcbiAgICAgICAgICAgIGxlYWRpbmdDYWxsID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHJhaWxpbmdDYWxsKSB7XG4gICAgICAgICAgICBwcm94eSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXHJcbiAgICAgKiBDYWxsYmFjayBpbnZva2VkIGFmdGVyIHRoZSBzcGVjaWZpZWQgZGVsYXkuIEl0IHdpbGwgZnVydGhlciBwb3N0cG9uZVxyXG4gICAgICogaW52b2NhdGlvbiBvZiB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gZGVsZWdhdGluZyBpdCB0byB0aGVcclxuICAgICAqIHJlcXVlc3RBbmltYXRpb25GcmFtZS5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7dm9pZH1cclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRpbWVvdXRDYWxsYmFjaygpIHtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lJDEocmVzb2x2ZVBlbmRpbmcpO1xuICAgIH1cblxuICAgIC8qKlxyXG4gICAgICogU2NoZWR1bGVzIGludm9jYXRpb24gb2YgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHt2b2lkfVxyXG4gICAgICovXG4gICAgZnVuY3Rpb24gcHJveHkoKSB7XG4gICAgICAgIHZhciB0aW1lU3RhbXAgPSBEYXRlLm5vdygpO1xuXG4gICAgICAgIGlmIChsZWFkaW5nQ2FsbCkge1xuICAgICAgICAgICAgLy8gUmVqZWN0IGltbWVkaWF0ZWx5IGZvbGxvd2luZyBjYWxscy5cbiAgICAgICAgICAgIGlmICh0aW1lU3RhbXAgLSBsYXN0Q2FsbFRpbWUgPCB0cmFpbGluZ1RpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNjaGVkdWxlIG5ldyBjYWxsIHRvIGJlIGluIGludm9rZWQgd2hlbiB0aGUgcGVuZGluZyBvbmUgaXMgcmVzb2x2ZWQuXG4gICAgICAgICAgICAvLyBUaGlzIGlzIGltcG9ydGFudCBmb3IgXCJ0cmFuc2l0aW9uc1wiIHdoaWNoIG5ldmVyIGFjdHVhbGx5IHN0YXJ0XG4gICAgICAgICAgICAvLyBpbW1lZGlhdGVseSBzbyB0aGVyZSBpcyBhIGNoYW5jZSB0aGF0IHdlIG1pZ2h0IG1pc3Mgb25lIGlmIGNoYW5nZVxuICAgICAgICAgICAgLy8gaGFwcGVucyBhbWlkcyB0aGUgcGVuZGluZyBpbnZvY2F0aW9uLlxuICAgICAgICAgICAgdHJhaWxpbmdDYWxsID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxlYWRpbmdDYWxsID0gdHJ1ZTtcbiAgICAgICAgICAgIHRyYWlsaW5nQ2FsbCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBzZXRUaW1lb3V0KHRpbWVvdXRDYWxsYmFjaywgZGVsYXkpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGFzdENhbGxUaW1lID0gdGltZVN0YW1wO1xuICAgIH1cblxuICAgIHJldHVybiBwcm94eTtcbn07XG5cbi8vIE1pbmltdW0gZGVsYXkgYmVmb3JlIGludm9raW5nIHRoZSB1cGRhdGUgb2Ygb2JzZXJ2ZXJzLlxudmFyIFJFRlJFU0hfREVMQVkgPSAyMDtcblxuLy8gQSBsaXN0IG9mIHN1YnN0cmluZ3Mgb2YgQ1NTIHByb3BlcnRpZXMgdXNlZCB0byBmaW5kIHRyYW5zaXRpb24gZXZlbnRzIHRoYXRcbi8vIG1pZ2h0IGFmZmVjdCBkaW1lbnNpb25zIG9mIG9ic2VydmVkIGVsZW1lbnRzLlxudmFyIHRyYW5zaXRpb25LZXlzID0gWyd0b3AnLCAncmlnaHQnLCAnYm90dG9tJywgJ2xlZnQnLCAnd2lkdGgnLCAnaGVpZ2h0JywgJ3NpemUnLCAnd2VpZ2h0J107XG5cbi8vIENoZWNrIGlmIE11dGF0aW9uT2JzZXJ2ZXIgaXMgYXZhaWxhYmxlLlxudmFyIG11dGF0aW9uT2JzZXJ2ZXJTdXBwb3J0ZWQgPSB0eXBlb2YgTXV0YXRpb25PYnNlcnZlciAhPT0gJ3VuZGVmaW5lZCc7XG5cbi8qKlxyXG4gKiBTaW5nbGV0b24gY29udHJvbGxlciBjbGFzcyB3aGljaCBoYW5kbGVzIHVwZGF0ZXMgb2YgUmVzaXplT2JzZXJ2ZXIgaW5zdGFuY2VzLlxyXG4gKi9cbnZhciBSZXNpemVPYnNlcnZlckNvbnRyb2xsZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNvbm5lY3RlZF8gPSBmYWxzZTtcbiAgICB0aGlzLm11dGF0aW9uRXZlbnRzQWRkZWRfID0gZmFsc2U7XG4gICAgdGhpcy5tdXRhdGlvbnNPYnNlcnZlcl8gPSBudWxsO1xuICAgIHRoaXMub2JzZXJ2ZXJzXyA9IFtdO1xuXG4gICAgdGhpcy5vblRyYW5zaXRpb25FbmRfID0gdGhpcy5vblRyYW5zaXRpb25FbmRfLmJpbmQodGhpcyk7XG4gICAgdGhpcy5yZWZyZXNoID0gdGhyb3R0bGUodGhpcy5yZWZyZXNoLmJpbmQodGhpcyksIFJFRlJFU0hfREVMQVkpO1xufTtcblxuLyoqXHJcbiAqIEFkZHMgb2JzZXJ2ZXIgdG8gb2JzZXJ2ZXJzIGxpc3QuXHJcbiAqXHJcbiAqIEBwYXJhbSB7UmVzaXplT2JzZXJ2ZXJTUEl9IG9ic2VydmVyIC0gT2JzZXJ2ZXIgdG8gYmUgYWRkZWQuXHJcbiAqIEByZXR1cm5zIHt2b2lkfVxyXG4gKi9cblxuXG4vKipcclxuICogSG9sZHMgcmVmZXJlbmNlIHRvIHRoZSBjb250cm9sbGVyJ3MgaW5zdGFuY2UuXHJcbiAqXHJcbiAqIEBwcml2YXRlIHtSZXNpemVPYnNlcnZlckNvbnRyb2xsZXJ9XHJcbiAqL1xuXG5cbi8qKlxyXG4gKiBLZWVwcyByZWZlcmVuY2UgdG8gdGhlIGluc3RhbmNlIG9mIE11dGF0aW9uT2JzZXJ2ZXIuXHJcbiAqXHJcbiAqIEBwcml2YXRlIHtNdXRhdGlvbk9ic2VydmVyfVxyXG4gKi9cblxuLyoqXHJcbiAqIEluZGljYXRlcyB3aGV0aGVyIERPTSBsaXN0ZW5lcnMgaGF2ZSBiZWVuIGFkZGVkLlxyXG4gKlxyXG4gKiBAcHJpdmF0ZSB7Ym9vbGVhbn1cclxuICovXG5SZXNpemVPYnNlcnZlckNvbnRyb2xsZXIucHJvdG90eXBlLmFkZE9ic2VydmVyID0gZnVuY3Rpb24gKG9ic2VydmVyKSB7XG4gICAgaWYgKCF+dGhpcy5vYnNlcnZlcnNfLmluZGV4T2Yob2JzZXJ2ZXIpKSB7XG4gICAgICAgIHRoaXMub2JzZXJ2ZXJzXy5wdXNoKG9ic2VydmVyKTtcbiAgICB9XG5cbiAgICAvLyBBZGQgbGlzdGVuZXJzIGlmIHRoZXkgaGF2ZW4ndCBiZWVuIGFkZGVkIHlldC5cbiAgICBpZiAoIXRoaXMuY29ubmVjdGVkXykge1xuICAgICAgICB0aGlzLmNvbm5lY3RfKCk7XG4gICAgfVxufTtcblxuLyoqXHJcbiAqIFJlbW92ZXMgb2JzZXJ2ZXIgZnJvbSBvYnNlcnZlcnMgbGlzdC5cclxuICpcclxuICogQHBhcmFtIHtSZXNpemVPYnNlcnZlclNQSX0gb2JzZXJ2ZXIgLSBPYnNlcnZlciB0byBiZSByZW1vdmVkLlxyXG4gKiBAcmV0dXJucyB7dm9pZH1cclxuICovXG5SZXNpemVPYnNlcnZlckNvbnRyb2xsZXIucHJvdG90eXBlLnJlbW92ZU9ic2VydmVyID0gZnVuY3Rpb24gKG9ic2VydmVyKSB7XG4gICAgdmFyIG9ic2VydmVycyA9IHRoaXMub2JzZXJ2ZXJzXztcbiAgICB2YXIgaW5kZXggPSBvYnNlcnZlcnMuaW5kZXhPZihvYnNlcnZlcik7XG5cbiAgICAvLyBSZW1vdmUgb2JzZXJ2ZXIgaWYgaXQncyBwcmVzZW50IGluIHJlZ2lzdHJ5LlxuICAgIGlmICh+aW5kZXgpIHtcbiAgICAgICAgb2JzZXJ2ZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIGxpc3RlbmVycyBpZiBjb250cm9sbGVyIGhhcyBubyBjb25uZWN0ZWQgb2JzZXJ2ZXJzLlxuICAgIGlmICghb2JzZXJ2ZXJzLmxlbmd0aCAmJiB0aGlzLmNvbm5lY3RlZF8pIHtcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0XygpO1xuICAgIH1cbn07XG5cbi8qKlxyXG4gKiBJbnZva2VzIHRoZSB1cGRhdGUgb2Ygb2JzZXJ2ZXJzLiBJdCB3aWxsIGNvbnRpbnVlIHJ1bm5pbmcgdXBkYXRlcyBpbnNvZmFyXHJcbiAqIGl0IGRldGVjdHMgY2hhbmdlcy5cclxuICpcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLnByb3RvdHlwZS5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBjaGFuZ2VzRGV0ZWN0ZWQgPSB0aGlzLnVwZGF0ZU9ic2VydmVyc18oKTtcblxuICAgIC8vIENvbnRpbnVlIHJ1bm5pbmcgdXBkYXRlcyBpZiBjaGFuZ2VzIGhhdmUgYmVlbiBkZXRlY3RlZCBhcyB0aGVyZSBtaWdodFxuICAgIC8vIGJlIGZ1dHVyZSBvbmVzIGNhdXNlZCBieSBDU1MgdHJhbnNpdGlvbnMuXG4gICAgaWYgKGNoYW5nZXNEZXRlY3RlZCkge1xuICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICB9XG59O1xuXG4vKipcclxuICogVXBkYXRlcyBldmVyeSBvYnNlcnZlciBmcm9tIG9ic2VydmVycyBsaXN0IGFuZCBub3RpZmllcyB0aGVtIG9mIHF1ZXVlZFxyXG4gKiBlbnRyaWVzLlxyXG4gKlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBcInRydWVcIiBpZiBhbnkgb2JzZXJ2ZXIgaGFzIGRldGVjdGVkIGNoYW5nZXMgaW5cclxuICogIGRpbWVuc2lvbnMgb2YgaXQncyBlbGVtZW50cy5cclxuICovXG5SZXNpemVPYnNlcnZlckNvbnRyb2xsZXIucHJvdG90eXBlLnVwZGF0ZU9ic2VydmVyc18gPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gQ29sbGVjdCBvYnNlcnZlcnMgdGhhdCBoYXZlIGFjdGl2ZSBvYnNlcnZhdGlvbnMuXG4gICAgdmFyIGFjdGl2ZU9ic2VydmVycyA9IHRoaXMub2JzZXJ2ZXJzXy5maWx0ZXIoZnVuY3Rpb24gKG9ic2VydmVyKSB7XG4gICAgICAgIHJldHVybiBvYnNlcnZlci5nYXRoZXJBY3RpdmUoKSwgb2JzZXJ2ZXIuaGFzQWN0aXZlKCk7XG4gICAgfSk7XG5cbiAgICAvLyBEZWxpdmVyIG5vdGlmaWNhdGlvbnMgaW4gYSBzZXBhcmF0ZSBjeWNsZSBpbiBvcmRlciB0byBhdm9pZCBhbnlcbiAgICAvLyBjb2xsaXNpb25zIGJldHdlZW4gb2JzZXJ2ZXJzLCBlLmcuIHdoZW4gbXVsdGlwbGUgaW5zdGFuY2VzIG9mXG4gICAgLy8gUmVzaXplT2JzZXJ2ZXIgYXJlIHRyYWNraW5nIHRoZSBzYW1lIGVsZW1lbnQgYW5kIHRoZSBjYWxsYmFjayBvZiBvbmVcbiAgICAvLyBvZiB0aGVtIGNoYW5nZXMgY29udGVudCBkaW1lbnNpb25zIG9mIHRoZSBvYnNlcnZlZCB0YXJnZXQuIFNvbWV0aW1lc1xuICAgIC8vIHRoaXMgbWF5IHJlc3VsdCBpbiBub3RpZmljYXRpb25zIGJlaW5nIGJsb2NrZWQgZm9yIHRoZSByZXN0IG9mIG9ic2VydmVycy5cbiAgICBhY3RpdmVPYnNlcnZlcnMuZm9yRWFjaChmdW5jdGlvbiAob2JzZXJ2ZXIpIHsgcmV0dXJuIG9ic2VydmVyLmJyb2FkY2FzdEFjdGl2ZSgpOyB9KTtcblxuICAgIHJldHVybiBhY3RpdmVPYnNlcnZlcnMubGVuZ3RoID4gMDtcbn07XG5cbi8qKlxyXG4gKiBJbml0aWFsaXplcyBET00gbGlzdGVuZXJzLlxyXG4gKlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJucyB7dm9pZH1cclxuICovXG5SZXNpemVPYnNlcnZlckNvbnRyb2xsZXIucHJvdG90eXBlLmNvbm5lY3RfID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIERvIG5vdGhpbmcgaWYgcnVubmluZyBpbiBhIG5vbi1icm93c2VyIGVudmlyb25tZW50IG9yIGlmIGxpc3RlbmVyc1xuICAgIC8vIGhhdmUgYmVlbiBhbHJlYWR5IGFkZGVkLlxuICAgIGlmICghaXNCcm93c2VyIHx8IHRoaXMuY29ubmVjdGVkXykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaXB0aW9uIHRvIHRoZSBcIlRyYW5zaXRpb25lbmRcIiBldmVudCBpcyB1c2VkIGFzIGEgd29ya2Fyb3VuZCBmb3JcbiAgICAvLyBkZWxheWVkIHRyYW5zaXRpb25zLiBUaGlzIHdheSBpdCdzIHBvc3NpYmxlIHRvIGNhcHR1cmUgYXQgbGVhc3QgdGhlXG4gICAgLy8gZmluYWwgc3RhdGUgb2YgYW4gZWxlbWVudC5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgdGhpcy5vblRyYW5zaXRpb25FbmRfKTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLnJlZnJlc2gpO1xuXG4gICAgaWYgKG11dGF0aW9uT2JzZXJ2ZXJTdXBwb3J0ZWQpIHtcbiAgICAgICAgdGhpcy5tdXRhdGlvbnNPYnNlcnZlcl8gPSBuZXcgTXV0YXRpb25PYnNlcnZlcih0aGlzLnJlZnJlc2gpO1xuXG4gICAgICAgIHRoaXMubXV0YXRpb25zT2JzZXJ2ZXJfLm9ic2VydmUoZG9jdW1lbnQsIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlLFxuICAgICAgICAgICAgc3VidHJlZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01TdWJ0cmVlTW9kaWZpZWQnLCB0aGlzLnJlZnJlc2gpO1xuXG4gICAgICAgIHRoaXMubXV0YXRpb25FdmVudHNBZGRlZF8gPSB0cnVlO1xuICAgIH1cblxuICAgIHRoaXMuY29ubmVjdGVkXyA9IHRydWU7XG59O1xuXG4vKipcclxuICogUmVtb3ZlcyBET00gbGlzdGVuZXJzLlxyXG4gKlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJucyB7dm9pZH1cclxuICovXG5SZXNpemVPYnNlcnZlckNvbnRyb2xsZXIucHJvdG90eXBlLmRpc2Nvbm5lY3RfID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIERvIG5vdGhpbmcgaWYgcnVubmluZyBpbiBhIG5vbi1icm93c2VyIGVudmlyb25tZW50IG9yIGlmIGxpc3RlbmVyc1xuICAgIC8vIGhhdmUgYmVlbiBhbHJlYWR5IHJlbW92ZWQuXG4gICAgaWYgKCFpc0Jyb3dzZXIgfHwgIXRoaXMuY29ubmVjdGVkXykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIHRoaXMub25UcmFuc2l0aW9uRW5kXyk7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMucmVmcmVzaCk7XG5cbiAgICBpZiAodGhpcy5tdXRhdGlvbnNPYnNlcnZlcl8pIHtcbiAgICAgICAgdGhpcy5tdXRhdGlvbnNPYnNlcnZlcl8uZGlzY29ubmVjdCgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm11dGF0aW9uRXZlbnRzQWRkZWRfKSB7XG4gICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ0RPTVN1YnRyZWVNb2RpZmllZCcsIHRoaXMucmVmcmVzaCk7XG4gICAgfVxuXG4gICAgdGhpcy5tdXRhdGlvbnNPYnNlcnZlcl8gPSBudWxsO1xuICAgIHRoaXMubXV0YXRpb25FdmVudHNBZGRlZF8gPSBmYWxzZTtcbiAgICB0aGlzLmNvbm5lY3RlZF8gPSBmYWxzZTtcbn07XG5cbi8qKlxyXG4gKiBcIlRyYW5zaXRpb25lbmRcIiBldmVudCBoYW5kbGVyLlxyXG4gKlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0ge1RyYW5zaXRpb25FdmVudH0gZXZlbnRcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLnByb3RvdHlwZS5vblRyYW5zaXRpb25FbmRfID0gZnVuY3Rpb24gKHJlZikge1xuICAgICAgICB2YXIgcHJvcGVydHlOYW1lID0gcmVmLnByb3BlcnR5TmFtZTsgaWYgKCBwcm9wZXJ0eU5hbWUgPT09IHZvaWQgMCApIHByb3BlcnR5TmFtZSA9ICcnO1xuXG4gICAgLy8gRGV0ZWN0IHdoZXRoZXIgdHJhbnNpdGlvbiBtYXkgYWZmZWN0IGRpbWVuc2lvbnMgb2YgYW4gZWxlbWVudC5cbiAgICB2YXIgaXNSZWZsb3dQcm9wZXJ0eSA9IHRyYW5zaXRpb25LZXlzLnNvbWUoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICByZXR1cm4gISF+cHJvcGVydHlOYW1lLmluZGV4T2Yoa2V5KTtcbiAgICB9KTtcblxuICAgIGlmIChpc1JlZmxvd1Byb3BlcnR5KSB7XG4gICAgICAgIHRoaXMucmVmcmVzaCgpO1xuICAgIH1cbn07XG5cbi8qKlxyXG4gKiBSZXR1cm5zIGluc3RhbmNlIG9mIHRoZSBSZXNpemVPYnNlcnZlckNvbnRyb2xsZXIuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtSZXNpemVPYnNlcnZlckNvbnRyb2xsZXJ9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLmdldEluc3RhbmNlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5pbnN0YW5jZV8pIHtcbiAgICAgICAgdGhpcy5pbnN0YW5jZV8gPSBuZXcgUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuaW5zdGFuY2VfO1xufTtcblxuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLmluc3RhbmNlXyA9IG51bGw7XG5cbi8qKlxyXG4gKiBEZWZpbmVzIG5vbi13cml0YWJsZS9lbnVtZXJhYmxlIHByb3BlcnRpZXMgb2YgdGhlIHByb3ZpZGVkIHRhcmdldCBvYmplY3QuXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXQgLSBPYmplY3QgZm9yIHdoaWNoIHRvIGRlZmluZSBwcm9wZXJ0aWVzLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcHJvcHMgLSBQcm9wZXJ0aWVzIHRvIGJlIGRlZmluZWQuXHJcbiAqIEByZXR1cm5zIHtPYmplY3R9IFRhcmdldCBvYmplY3QuXHJcbiAqL1xudmFyIGRlZmluZUNvbmZpZ3VyYWJsZSA9IChmdW5jdGlvbiAodGFyZ2V0LCBwcm9wcykge1xuICAgIGZvciAodmFyIGkgPSAwLCBsaXN0ID0gT2JqZWN0LmtleXMocHJvcHMpOyBpIDwgbGlzdC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB2YXIga2V5ID0gbGlzdFtpXTtcblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHtcbiAgICAgICAgICAgIHZhbHVlOiBwcm9wc1trZXldLFxuICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhcmdldDtcbn0pO1xuXG4vKipcclxuICogUmV0dXJucyB0aGUgZ2xvYmFsIG9iamVjdCBhc3NvY2lhdGVkIHdpdGggcHJvdmlkZWQgZWxlbWVudC5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IHRhcmdldFxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fVxyXG4gKi9cbnZhciBnZXRXaW5kb3dPZiA9IChmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgLy8gQXNzdW1lIHRoYXQgdGhlIGVsZW1lbnQgaXMgYW4gaW5zdGFuY2Ugb2YgTm9kZSwgd2hpY2ggbWVhbnMgdGhhdCBpdFxuICAgIC8vIGhhcyB0aGUgXCJvd25lckRvY3VtZW50XCIgcHJvcGVydHkgZnJvbSB3aGljaCB3ZSBjYW4gcmV0cmlldmUgYVxuICAgIC8vIGNvcnJlc3BvbmRpbmcgZ2xvYmFsIG9iamVjdC5cbiAgICB2YXIgb3duZXJHbG9iYWwgPSB0YXJnZXQgJiYgdGFyZ2V0Lm93bmVyRG9jdW1lbnQgJiYgdGFyZ2V0Lm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXc7XG5cbiAgICAvLyBSZXR1cm4gdGhlIGxvY2FsIGdsb2JhbCBvYmplY3QgaWYgaXQncyBub3QgcG9zc2libGUgZXh0cmFjdCBvbmUgZnJvbVxuICAgIC8vIHByb3ZpZGVkIGVsZW1lbnQuXG4gICAgcmV0dXJuIG93bmVyR2xvYmFsIHx8IGdsb2JhbCQxO1xufSk7XG5cbi8vIFBsYWNlaG9sZGVyIG9mIGFuIGVtcHR5IGNvbnRlbnQgcmVjdGFuZ2xlLlxudmFyIGVtcHR5UmVjdCA9IGNyZWF0ZVJlY3RJbml0KDAsIDAsIDAsIDApO1xuXG4vKipcclxuICogQ29udmVydHMgcHJvdmlkZWQgc3RyaW5nIHRvIGEgbnVtYmVyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IHZhbHVlXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAqL1xuZnVuY3Rpb24gdG9GbG9hdCh2YWx1ZSkge1xuICAgIHJldHVybiBwYXJzZUZsb2F0KHZhbHVlKSB8fCAwO1xufVxuXG4vKipcclxuICogRXh0cmFjdHMgYm9yZGVycyBzaXplIGZyb20gcHJvdmlkZWQgc3R5bGVzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0NTU1N0eWxlRGVjbGFyYXRpb259IHN0eWxlc1xyXG4gKiBAcGFyYW0gey4uLnN0cmluZ30gcG9zaXRpb25zIC0gQm9yZGVycyBwb3NpdGlvbnMgKHRvcCwgcmlnaHQsIC4uLilcclxuICogQHJldHVybnMge251bWJlcn1cclxuICovXG5mdW5jdGlvbiBnZXRCb3JkZXJzU2l6ZShzdHlsZXMpIHtcbiAgICB2YXIgcG9zaXRpb25zID0gW10sIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGggLSAxO1xuICAgIHdoaWxlICggbGVuLS0gPiAwICkgcG9zaXRpb25zWyBsZW4gXSA9IGFyZ3VtZW50c1sgbGVuICsgMSBdO1xuXG4gICAgcmV0dXJuIHBvc2l0aW9ucy5yZWR1Y2UoZnVuY3Rpb24gKHNpemUsIHBvc2l0aW9uKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IHN0eWxlc1snYm9yZGVyLScgKyBwb3NpdGlvbiArICctd2lkdGgnXTtcblxuICAgICAgICByZXR1cm4gc2l6ZSArIHRvRmxvYXQodmFsdWUpO1xuICAgIH0sIDApO1xufVxuXG4vKipcclxuICogRXh0cmFjdHMgcGFkZGluZ3Mgc2l6ZXMgZnJvbSBwcm92aWRlZCBzdHlsZXMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7Q1NTU3R5bGVEZWNsYXJhdGlvbn0gc3R5bGVzXHJcbiAqIEByZXR1cm5zIHtPYmplY3R9IFBhZGRpbmdzIGJveC5cclxuICovXG5mdW5jdGlvbiBnZXRQYWRkaW5ncyhzdHlsZXMpIHtcbiAgICB2YXIgcG9zaXRpb25zID0gWyd0b3AnLCAncmlnaHQnLCAnYm90dG9tJywgJ2xlZnQnXTtcbiAgICB2YXIgcGFkZGluZ3MgPSB7fTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsaXN0ID0gcG9zaXRpb25zOyBpIDwgbGlzdC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB2YXIgcG9zaXRpb24gPSBsaXN0W2ldO1xuXG4gICAgICAgIHZhciB2YWx1ZSA9IHN0eWxlc1sncGFkZGluZy0nICsgcG9zaXRpb25dO1xuXG4gICAgICAgIHBhZGRpbmdzW3Bvc2l0aW9uXSA9IHRvRmxvYXQodmFsdWUpO1xuICAgIH1cblxuICAgIHJldHVybiBwYWRkaW5ncztcbn1cblxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgY29udGVudCByZWN0YW5nbGUgb2YgcHJvdmlkZWQgU1ZHIGVsZW1lbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U1ZHR3JhcGhpY3NFbGVtZW50fSB0YXJnZXQgLSBFbGVtZW50IGNvbnRlbnQgcmVjdGFuZ2xlIG9mIHdoaWNoIG5lZWRzXHJcbiAqICAgICAgdG8gYmUgY2FsY3VsYXRlZC5cclxuICogQHJldHVybnMge0RPTVJlY3RJbml0fVxyXG4gKi9cbmZ1bmN0aW9uIGdldFNWR0NvbnRlbnRSZWN0KHRhcmdldCkge1xuICAgIHZhciBiYm94ID0gdGFyZ2V0LmdldEJCb3goKTtcblxuICAgIHJldHVybiBjcmVhdGVSZWN0SW5pdCgwLCAwLCBiYm94LndpZHRoLCBiYm94LmhlaWdodCk7XG59XG5cbi8qKlxyXG4gKiBDYWxjdWxhdGVzIGNvbnRlbnQgcmVjdGFuZ2xlIG9mIHByb3ZpZGVkIEhUTUxFbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXQgLSBFbGVtZW50IGZvciB3aGljaCB0byBjYWxjdWxhdGUgdGhlIGNvbnRlbnQgcmVjdGFuZ2xlLlxyXG4gKiBAcmV0dXJucyB7RE9NUmVjdEluaXR9XHJcbiAqL1xuZnVuY3Rpb24gZ2V0SFRNTEVsZW1lbnRDb250ZW50UmVjdCh0YXJnZXQpIHtcbiAgICAvLyBDbGllbnQgd2lkdGggJiBoZWlnaHQgcHJvcGVydGllcyBjYW4ndCBiZVxuICAgIC8vIHVzZWQgZXhjbHVzaXZlbHkgYXMgdGhleSBwcm92aWRlIHJvdW5kZWQgdmFsdWVzLlxuICAgIHZhciBjbGllbnRXaWR0aCA9IHRhcmdldC5jbGllbnRXaWR0aDtcbiAgICB2YXIgY2xpZW50SGVpZ2h0ID0gdGFyZ2V0LmNsaWVudEhlaWdodDtcblxuICAgIC8vIEJ5IHRoaXMgY29uZGl0aW9uIHdlIGNhbiBjYXRjaCBhbGwgbm9uLXJlcGxhY2VkIGlubGluZSwgaGlkZGVuIGFuZFxuICAgIC8vIGRldGFjaGVkIGVsZW1lbnRzLiBUaG91Z2ggZWxlbWVudHMgd2l0aCB3aWR0aCAmIGhlaWdodCBwcm9wZXJ0aWVzIGxlc3NcbiAgICAvLyB0aGFuIDAuNSB3aWxsIGJlIGRpc2NhcmRlZCBhcyB3ZWxsLlxuICAgIC8vXG4gICAgLy8gV2l0aG91dCBpdCB3ZSB3b3VsZCBuZWVkIHRvIGltcGxlbWVudCBzZXBhcmF0ZSBtZXRob2RzIGZvciBlYWNoIG9mXG4gICAgLy8gdGhvc2UgY2FzZXMgYW5kIGl0J3Mgbm90IHBvc3NpYmxlIHRvIHBlcmZvcm0gYSBwcmVjaXNlIGFuZCBwZXJmb3JtYW5jZVxuICAgIC8vIGVmZmVjdGl2ZSB0ZXN0IGZvciBoaWRkZW4gZWxlbWVudHMuIEUuZy4gZXZlbiBqUXVlcnkncyAnOnZpc2libGUnIGZpbHRlclxuICAgIC8vIGdpdmVzIHdyb25nIHJlc3VsdHMgZm9yIGVsZW1lbnRzIHdpdGggd2lkdGggJiBoZWlnaHQgbGVzcyB0aGFuIDAuNS5cbiAgICBpZiAoIWNsaWVudFdpZHRoICYmICFjbGllbnRIZWlnaHQpIHtcbiAgICAgICAgcmV0dXJuIGVtcHR5UmVjdDtcbiAgICB9XG5cbiAgICB2YXIgc3R5bGVzID0gZ2V0V2luZG93T2YodGFyZ2V0KS5nZXRDb21wdXRlZFN0eWxlKHRhcmdldCk7XG4gICAgdmFyIHBhZGRpbmdzID0gZ2V0UGFkZGluZ3Moc3R5bGVzKTtcbiAgICB2YXIgaG9yaXpQYWQgPSBwYWRkaW5ncy5sZWZ0ICsgcGFkZGluZ3MucmlnaHQ7XG4gICAgdmFyIHZlcnRQYWQgPSBwYWRkaW5ncy50b3AgKyBwYWRkaW5ncy5ib3R0b207XG5cbiAgICAvLyBDb21wdXRlZCBzdHlsZXMgb2Ygd2lkdGggJiBoZWlnaHQgYXJlIGJlaW5nIHVzZWQgYmVjYXVzZSB0aGV5IGFyZSB0aGVcbiAgICAvLyBvbmx5IGRpbWVuc2lvbnMgYXZhaWxhYmxlIHRvIEpTIHRoYXQgY29udGFpbiBub24tcm91bmRlZCB2YWx1ZXMuIEl0IGNvdWxkXG4gICAgLy8gYmUgcG9zc2libGUgdG8gdXRpbGl6ZSB0aGUgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGlmIG9ubHkgaXQncyBkYXRhIHdhc24ndFxuICAgIC8vIGFmZmVjdGVkIGJ5IENTUyB0cmFuc2Zvcm1hdGlvbnMgbGV0IGFsb25lIHBhZGRpbmdzLCBib3JkZXJzIGFuZCBzY3JvbGwgYmFycy5cbiAgICB2YXIgd2lkdGggPSB0b0Zsb2F0KHN0eWxlcy53aWR0aCksXG4gICAgICAgIGhlaWdodCA9IHRvRmxvYXQoc3R5bGVzLmhlaWdodCk7XG5cbiAgICAvLyBXaWR0aCAmIGhlaWdodCBpbmNsdWRlIHBhZGRpbmdzIGFuZCBib3JkZXJzIHdoZW4gdGhlICdib3JkZXItYm94JyBib3hcbiAgICAvLyBtb2RlbCBpcyBhcHBsaWVkIChleGNlcHQgZm9yIElFKS5cbiAgICBpZiAoc3R5bGVzLmJveFNpemluZyA9PT0gJ2JvcmRlci1ib3gnKSB7XG4gICAgICAgIC8vIEZvbGxvd2luZyBjb25kaXRpb25zIGFyZSByZXF1aXJlZCB0byBoYW5kbGUgSW50ZXJuZXQgRXhwbG9yZXIgd2hpY2hcbiAgICAgICAgLy8gZG9lc24ndCBpbmNsdWRlIHBhZGRpbmdzIGFuZCBib3JkZXJzIHRvIGNvbXB1dGVkIENTUyBkaW1lbnNpb25zLlxuICAgICAgICAvL1xuICAgICAgICAvLyBXZSBjYW4gc2F5IHRoYXQgaWYgQ1NTIGRpbWVuc2lvbnMgKyBwYWRkaW5ncyBhcmUgZXF1YWwgdG8gdGhlIFwiY2xpZW50XCJcbiAgICAgICAgLy8gcHJvcGVydGllcyB0aGVuIGl0J3MgZWl0aGVyIElFLCBhbmQgdGh1cyB3ZSBkb24ndCBuZWVkIHRvIHN1YnRyYWN0XG4gICAgICAgIC8vIGFueXRoaW5nLCBvciBhbiBlbGVtZW50IG1lcmVseSBkb2Vzbid0IGhhdmUgcGFkZGluZ3MvYm9yZGVycyBzdHlsZXMuXG4gICAgICAgIGlmIChNYXRoLnJvdW5kKHdpZHRoICsgaG9yaXpQYWQpICE9PSBjbGllbnRXaWR0aCkge1xuICAgICAgICAgICAgd2lkdGggLT0gZ2V0Qm9yZGVyc1NpemUoc3R5bGVzLCAnbGVmdCcsICdyaWdodCcpICsgaG9yaXpQYWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoTWF0aC5yb3VuZChoZWlnaHQgKyB2ZXJ0UGFkKSAhPT0gY2xpZW50SGVpZ2h0KSB7XG4gICAgICAgICAgICBoZWlnaHQgLT0gZ2V0Qm9yZGVyc1NpemUoc3R5bGVzLCAndG9wJywgJ2JvdHRvbScpICsgdmVydFBhZDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZvbGxvd2luZyBzdGVwcyBjYW4ndCBiZSBhcHBsaWVkIHRvIHRoZSBkb2N1bWVudCdzIHJvb3QgZWxlbWVudCBhcyBpdHNcbiAgICAvLyBjbGllbnRbV2lkdGgvSGVpZ2h0XSBwcm9wZXJ0aWVzIHJlcHJlc2VudCB2aWV3cG9ydCBhcmVhIG9mIHRoZSB3aW5kb3cuXG4gICAgLy8gQmVzaWRlcywgaXQncyBhcyB3ZWxsIG5vdCBuZWNlc3NhcnkgYXMgdGhlIDxodG1sPiBpdHNlbGYgbmVpdGhlciBoYXNcbiAgICAvLyByZW5kZXJlZCBzY3JvbGwgYmFycyBub3IgaXQgY2FuIGJlIGNsaXBwZWQuXG4gICAgaWYgKCFpc0RvY3VtZW50RWxlbWVudCh0YXJnZXQpKSB7XG4gICAgICAgIC8vIEluIHNvbWUgYnJvd3NlcnMgKG9ubHkgaW4gRmlyZWZveCwgYWN0dWFsbHkpIENTUyB3aWR0aCAmIGhlaWdodFxuICAgICAgICAvLyBpbmNsdWRlIHNjcm9sbCBiYXJzIHNpemUgd2hpY2ggY2FuIGJlIHJlbW92ZWQgYXQgdGhpcyBzdGVwIGFzIHNjcm9sbFxuICAgICAgICAvLyBiYXJzIGFyZSB0aGUgb25seSBkaWZmZXJlbmNlIGJldHdlZW4gcm91bmRlZCBkaW1lbnNpb25zICsgcGFkZGluZ3NcbiAgICAgICAgLy8gYW5kIFwiY2xpZW50XCIgcHJvcGVydGllcywgdGhvdWdoIHRoYXQgaXMgbm90IGFsd2F5cyB0cnVlIGluIENocm9tZS5cbiAgICAgICAgdmFyIHZlcnRTY3JvbGxiYXIgPSBNYXRoLnJvdW5kKHdpZHRoICsgaG9yaXpQYWQpIC0gY2xpZW50V2lkdGg7XG4gICAgICAgIHZhciBob3JpelNjcm9sbGJhciA9IE1hdGgucm91bmQoaGVpZ2h0ICsgdmVydFBhZCkgLSBjbGllbnRIZWlnaHQ7XG5cbiAgICAgICAgLy8gQ2hyb21lIGhhcyBhIHJhdGhlciB3ZWlyZCByb3VuZGluZyBvZiBcImNsaWVudFwiIHByb3BlcnRpZXMuXG4gICAgICAgIC8vIEUuZy4gZm9yIGFuIGVsZW1lbnQgd2l0aCBjb250ZW50IHdpZHRoIG9mIDMxNC4ycHggaXQgc29tZXRpbWVzIGdpdmVzXG4gICAgICAgIC8vIHRoZSBjbGllbnQgd2lkdGggb2YgMzE1cHggYW5kIGZvciB0aGUgd2lkdGggb2YgMzE0LjdweCBpdCBtYXkgZ2l2ZVxuICAgICAgICAvLyAzMTRweC4gQW5kIGl0IGRvZXNuJ3QgaGFwcGVuIGFsbCB0aGUgdGltZS4gU28ganVzdCBpZ25vcmUgdGhpcyBkZWx0YVxuICAgICAgICAvLyBhcyBhIG5vbi1yZWxldmFudC5cbiAgICAgICAgaWYgKE1hdGguYWJzKHZlcnRTY3JvbGxiYXIpICE9PSAxKSB7XG4gICAgICAgICAgICB3aWR0aCAtPSB2ZXJ0U2Nyb2xsYmFyO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKE1hdGguYWJzKGhvcml6U2Nyb2xsYmFyKSAhPT0gMSkge1xuICAgICAgICAgICAgaGVpZ2h0IC09IGhvcml6U2Nyb2xsYmFyO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNyZWF0ZVJlY3RJbml0KHBhZGRpbmdzLmxlZnQsIHBhZGRpbmdzLnRvcCwgd2lkdGgsIGhlaWdodCk7XG59XG5cbi8qKlxyXG4gKiBDaGVja3Mgd2hldGhlciBwcm92aWRlZCBlbGVtZW50IGlzIGFuIGluc3RhbmNlIG9mIHRoZSBTVkdHcmFwaGljc0VsZW1lbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0IC0gRWxlbWVudCB0byBiZSBjaGVja2VkLlxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICovXG52YXIgaXNTVkdHcmFwaGljc0VsZW1lbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIC8vIFNvbWUgYnJvd3NlcnMsIG5hbWVseSBJRSBhbmQgRWRnZSwgZG9uJ3QgaGF2ZSB0aGUgU1ZHR3JhcGhpY3NFbGVtZW50XG4gICAgLy8gaW50ZXJmYWNlLlxuICAgIGlmICh0eXBlb2YgU1ZHR3JhcGhpY3NFbGVtZW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCkgeyByZXR1cm4gdGFyZ2V0IGluc3RhbmNlb2YgZ2V0V2luZG93T2YodGFyZ2V0KS5TVkdHcmFwaGljc0VsZW1lbnQ7IH07XG4gICAgfVxuXG4gICAgLy8gSWYgaXQncyBzbywgdGhlbiBjaGVjayB0aGF0IGVsZW1lbnQgaXMgYXQgbGVhc3QgYW4gaW5zdGFuY2Ugb2YgdGhlXG4gICAgLy8gU1ZHRWxlbWVudCBhbmQgdGhhdCBpdCBoYXMgdGhlIFwiZ2V0QkJveFwiIG1ldGhvZC5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tZXh0cmEtcGFyZW5zXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQpIHsgcmV0dXJuIHRhcmdldCBpbnN0YW5jZW9mIGdldFdpbmRvd09mKHRhcmdldCkuU1ZHRWxlbWVudCAmJiB0eXBlb2YgdGFyZ2V0LmdldEJCb3ggPT09ICdmdW5jdGlvbic7IH07XG59KSgpO1xuXG4vKipcclxuICogQ2hlY2tzIHdoZXRoZXIgcHJvdmlkZWQgZWxlbWVudCBpcyBhIGRvY3VtZW50IGVsZW1lbnQgKDxodG1sPikuXHJcbiAqXHJcbiAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0IC0gRWxlbWVudCB0byBiZSBjaGVja2VkLlxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICovXG5mdW5jdGlvbiBpc0RvY3VtZW50RWxlbWVudCh0YXJnZXQpIHtcbiAgICByZXR1cm4gdGFyZ2V0ID09PSBnZXRXaW5kb3dPZih0YXJnZXQpLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbn1cblxuLyoqXHJcbiAqIENhbGN1bGF0ZXMgYW4gYXBwcm9wcmlhdGUgY29udGVudCByZWN0YW5nbGUgZm9yIHByb3ZpZGVkIGh0bWwgb3Igc3ZnIGVsZW1lbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0IC0gRWxlbWVudCBjb250ZW50IHJlY3RhbmdsZSBvZiB3aGljaCBuZWVkcyB0byBiZSBjYWxjdWxhdGVkLlxyXG4gKiBAcmV0dXJucyB7RE9NUmVjdEluaXR9XHJcbiAqL1xuZnVuY3Rpb24gZ2V0Q29udGVudFJlY3QodGFyZ2V0KSB7XG4gICAgaWYgKCFpc0Jyb3dzZXIpIHtcbiAgICAgICAgcmV0dXJuIGVtcHR5UmVjdDtcbiAgICB9XG5cbiAgICBpZiAoaXNTVkdHcmFwaGljc0VsZW1lbnQodGFyZ2V0KSkge1xuICAgICAgICByZXR1cm4gZ2V0U1ZHQ29udGVudFJlY3QodGFyZ2V0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0SFRNTEVsZW1lbnRDb250ZW50UmVjdCh0YXJnZXQpO1xufVxuXG4vKipcclxuICogQ3JlYXRlcyByZWN0YW5nbGUgd2l0aCBhbiBpbnRlcmZhY2Ugb2YgdGhlIERPTVJlY3RSZWFkT25seS5cclxuICogU3BlYzogaHR0cHM6Ly9kcmFmdHMuZnh0Zi5vcmcvZ2VvbWV0cnkvI2RvbXJlY3RyZWFkb25seVxyXG4gKlxyXG4gKiBAcGFyYW0ge0RPTVJlY3RJbml0fSByZWN0SW5pdCAtIE9iamVjdCB3aXRoIHJlY3RhbmdsZSdzIHgveSBjb29yZGluYXRlcyBhbmQgZGltZW5zaW9ucy5cclxuICogQHJldHVybnMge0RPTVJlY3RSZWFkT25seX1cclxuICovXG5mdW5jdGlvbiBjcmVhdGVSZWFkT25seVJlY3QocmVmKSB7XG4gICAgdmFyIHggPSByZWYueDtcbiAgICB2YXIgeSA9IHJlZi55O1xuICAgIHZhciB3aWR0aCA9IHJlZi53aWR0aDtcbiAgICB2YXIgaGVpZ2h0ID0gcmVmLmhlaWdodDtcblxuICAgIC8vIElmIERPTVJlY3RSZWFkT25seSBpcyBhdmFpbGFibGUgdXNlIGl0IGFzIGEgcHJvdG90eXBlIGZvciB0aGUgcmVjdGFuZ2xlLlxuICAgIHZhciBDb25zdHIgPSB0eXBlb2YgRE9NUmVjdFJlYWRPbmx5ICE9PSAndW5kZWZpbmVkJyA/IERPTVJlY3RSZWFkT25seSA6IE9iamVjdDtcbiAgICB2YXIgcmVjdCA9IE9iamVjdC5jcmVhdGUoQ29uc3RyLnByb3RvdHlwZSk7XG5cbiAgICAvLyBSZWN0YW5nbGUncyBwcm9wZXJ0aWVzIGFyZSBub3Qgd3JpdGFibGUgYW5kIG5vbi1lbnVtZXJhYmxlLlxuICAgIGRlZmluZUNvbmZpZ3VyYWJsZShyZWN0LCB7XG4gICAgICAgIHg6IHgsIHk6IHksIHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgIHRvcDogeSxcbiAgICAgICAgcmlnaHQ6IHggKyB3aWR0aCxcbiAgICAgICAgYm90dG9tOiBoZWlnaHQgKyB5LFxuICAgICAgICBsZWZ0OiB4XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVjdDtcbn1cblxuLyoqXHJcbiAqIENyZWF0ZXMgRE9NUmVjdEluaXQgb2JqZWN0IGJhc2VkIG9uIHRoZSBwcm92aWRlZCBkaW1lbnNpb25zIGFuZCB0aGUgeC95IGNvb3JkaW5hdGVzLlxyXG4gKiBTcGVjOiBodHRwczovL2RyYWZ0cy5meHRmLm9yZy9nZW9tZXRyeS8jZGljdGRlZi1kb21yZWN0aW5pdFxyXG4gKlxyXG4gKiBAcGFyYW0ge251bWJlcn0geCAtIFggY29vcmRpbmF0ZS5cclxuICogQHBhcmFtIHtudW1iZXJ9IHkgLSBZIGNvb3JkaW5hdGUuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aCAtIFJlY3RhbmdsZSdzIHdpZHRoLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0IC0gUmVjdGFuZ2xlJ3MgaGVpZ2h0LlxyXG4gKiBAcmV0dXJucyB7RE9NUmVjdEluaXR9XHJcbiAqL1xuZnVuY3Rpb24gY3JlYXRlUmVjdEluaXQoeCwgeSwgd2lkdGgsIGhlaWdodCkge1xuICAgIHJldHVybiB7IHg6IHgsIHk6IHksIHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQgfTtcbn1cblxuLyoqXHJcbiAqIENsYXNzIHRoYXQgaXMgcmVzcG9uc2libGUgZm9yIGNvbXB1dGF0aW9ucyBvZiB0aGUgY29udGVudCByZWN0YW5nbGUgb2ZcclxuICogcHJvdmlkZWQgRE9NIGVsZW1lbnQgYW5kIGZvciBrZWVwaW5nIHRyYWNrIG9mIGl0J3MgY2hhbmdlcy5cclxuICovXG52YXIgUmVzaXplT2JzZXJ2YXRpb24gPSBmdW5jdGlvbih0YXJnZXQpIHtcbiAgICB0aGlzLmJyb2FkY2FzdFdpZHRoID0gMDtcbiAgICB0aGlzLmJyb2FkY2FzdEhlaWdodCA9IDA7XG4gICAgdGhpcy5jb250ZW50UmVjdF8gPSBjcmVhdGVSZWN0SW5pdCgwLCAwLCAwLCAwKTtcblxuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xufTtcblxuLyoqXHJcbiAqIFVwZGF0ZXMgY29udGVudCByZWN0YW5nbGUgYW5kIHRlbGxzIHdoZXRoZXIgaXQncyB3aWR0aCBvciBoZWlnaHQgcHJvcGVydGllc1xyXG4gKiBoYXZlIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgYnJvYWRjYXN0LlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICovXG5cblxuLyoqXHJcbiAqIFJlZmVyZW5jZSB0byB0aGUgbGFzdCBvYnNlcnZlZCBjb250ZW50IHJlY3RhbmdsZS5cclxuICpcclxuICogQHByaXZhdGUge0RPTVJlY3RJbml0fVxyXG4gKi9cblxuXG4vKipcclxuICogQnJvYWRjYXN0ZWQgd2lkdGggb2YgY29udGVudCByZWN0YW5nbGUuXHJcbiAqXHJcbiAqIEB0eXBlIHtudW1iZXJ9XHJcbiAqL1xuUmVzaXplT2JzZXJ2YXRpb24ucHJvdG90eXBlLmlzQWN0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZWN0ID0gZ2V0Q29udGVudFJlY3QodGhpcy50YXJnZXQpO1xuXG4gICAgdGhpcy5jb250ZW50UmVjdF8gPSByZWN0O1xuXG4gICAgcmV0dXJuIHJlY3Qud2lkdGggIT09IHRoaXMuYnJvYWRjYXN0V2lkdGggfHwgcmVjdC5oZWlnaHQgIT09IHRoaXMuYnJvYWRjYXN0SGVpZ2h0O1xufTtcblxuLyoqXHJcbiAqIFVwZGF0ZXMgJ2Jyb2FkY2FzdFdpZHRoJyBhbmQgJ2Jyb2FkY2FzdEhlaWdodCcgcHJvcGVydGllcyB3aXRoIGEgZGF0YVxyXG4gKiBmcm9tIHRoZSBjb3JyZXNwb25kaW5nIHByb3BlcnRpZXMgb2YgdGhlIGxhc3Qgb2JzZXJ2ZWQgY29udGVudCByZWN0YW5nbGUuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtET01SZWN0SW5pdH0gTGFzdCBvYnNlcnZlZCBjb250ZW50IHJlY3RhbmdsZS5cclxuICovXG5SZXNpemVPYnNlcnZhdGlvbi5wcm90b3R5cGUuYnJvYWRjYXN0UmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVjdCA9IHRoaXMuY29udGVudFJlY3RfO1xuXG4gICAgdGhpcy5icm9hZGNhc3RXaWR0aCA9IHJlY3Qud2lkdGg7XG4gICAgdGhpcy5icm9hZGNhc3RIZWlnaHQgPSByZWN0LmhlaWdodDtcblxuICAgIHJldHVybiByZWN0O1xufTtcblxudmFyIFJlc2l6ZU9ic2VydmVyRW50cnkgPSBmdW5jdGlvbih0YXJnZXQsIHJlY3RJbml0KSB7XG4gICAgdmFyIGNvbnRlbnRSZWN0ID0gY3JlYXRlUmVhZE9ubHlSZWN0KHJlY3RJbml0KTtcblxuICAgIC8vIEFjY29yZGluZyB0byB0aGUgc3BlY2lmaWNhdGlvbiBmb2xsb3dpbmcgcHJvcGVydGllcyBhcmUgbm90IHdyaXRhYmxlXG4gICAgLy8gYW5kIGFyZSBhbHNvIG5vdCBlbnVtZXJhYmxlIGluIHRoZSBuYXRpdmUgaW1wbGVtZW50YXRpb24uXG4gICAgLy9cbiAgICAvLyBQcm9wZXJ0eSBhY2Nlc3NvcnMgYXJlIG5vdCBiZWluZyB1c2VkIGFzIHRoZXknZCByZXF1aXJlIHRvIGRlZmluZSBhXG4gICAgLy8gcHJpdmF0ZSBXZWFrTWFwIHN0b3JhZ2Ugd2hpY2ggbWF5IGNhdXNlIG1lbW9yeSBsZWFrcyBpbiBicm93c2VycyB0aGF0XG4gICAgLy8gZG9uJ3Qgc3VwcG9ydCB0aGlzIHR5cGUgb2YgY29sbGVjdGlvbnMuXG4gICAgZGVmaW5lQ29uZmlndXJhYmxlKHRoaXMsIHsgdGFyZ2V0OiB0YXJnZXQsIGNvbnRlbnRSZWN0OiBjb250ZW50UmVjdCB9KTtcbn07XG5cbnZhciBSZXNpemVPYnNlcnZlclNQSSA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBjb250cm9sbGVyLCBjYWxsYmFja0N0eCkge1xuICAgIHRoaXMuYWN0aXZlT2JzZXJ2YXRpb25zXyA9IFtdO1xuICAgIHRoaXMub2JzZXJ2YXRpb25zXyA9IG5ldyBNYXBTaGltKCk7XG5cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBjYWxsYmFjayBwcm92aWRlZCBhcyBwYXJhbWV0ZXIgMSBpcyBub3QgYSBmdW5jdGlvbi4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmNhbGxiYWNrXyA9IGNhbGxiYWNrO1xuICAgIHRoaXMuY29udHJvbGxlcl8gPSBjb250cm9sbGVyO1xuICAgIHRoaXMuY2FsbGJhY2tDdHhfID0gY2FsbGJhY2tDdHg7XG59O1xuXG4vKipcclxuICogU3RhcnRzIG9ic2VydmluZyBwcm92aWRlZCBlbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCAtIEVsZW1lbnQgdG8gYmUgb2JzZXJ2ZWQuXHJcbiAqIEByZXR1cm5zIHt2b2lkfVxyXG4gKi9cblxuXG4vKipcclxuICogUmVnaXN0cnkgb2YgdGhlIFJlc2l6ZU9ic2VydmF0aW9uIGluc3RhbmNlcy5cclxuICpcclxuICogQHByaXZhdGUge01hcDxFbGVtZW50LCBSZXNpemVPYnNlcnZhdGlvbj59XHJcbiAqL1xuXG5cbi8qKlxyXG4gKiBQdWJsaWMgUmVzaXplT2JzZXJ2ZXIgaW5zdGFuY2Ugd2hpY2ggd2lsbCBiZSBwYXNzZWQgdG8gdGhlIGNhbGxiYWNrXHJcbiAqIGZ1bmN0aW9uIGFuZCB1c2VkIGFzIGEgdmFsdWUgb2YgaXQncyBcInRoaXNcIiBiaW5kaW5nLlxyXG4gKlxyXG4gKiBAcHJpdmF0ZSB7UmVzaXplT2JzZXJ2ZXJ9XHJcbiAqL1xuXG4vKipcclxuICogQ29sbGVjdGlvbiBvZiByZXNpemUgb2JzZXJ2YXRpb25zIHRoYXQgaGF2ZSBkZXRlY3RlZCBjaGFuZ2VzIGluIGRpbWVuc2lvbnNcclxuICogb2YgZWxlbWVudHMuXHJcbiAqXHJcbiAqIEBwcml2YXRlIHtBcnJheTxSZXNpemVPYnNlcnZhdGlvbj59XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJTUEkucHJvdG90eXBlLm9ic2VydmUgPSBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJzEgYXJndW1lbnQgcmVxdWlyZWQsIGJ1dCBvbmx5IDAgcHJlc2VudC4nKTtcbiAgICB9XG5cbiAgICAvLyBEbyBub3RoaW5nIGlmIGN1cnJlbnQgZW52aXJvbm1lbnQgZG9lc24ndCBoYXZlIHRoZSBFbGVtZW50IGludGVyZmFjZS5cbiAgICBpZiAodHlwZW9mIEVsZW1lbnQgPT09ICd1bmRlZmluZWQnIHx8ICEoRWxlbWVudCBpbnN0YW5jZW9mIE9iamVjdCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghKHRhcmdldCBpbnN0YW5jZW9mIGdldFdpbmRvd09mKHRhcmdldCkuRWxlbWVudCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigncGFyYW1ldGVyIDEgaXMgbm90IG9mIHR5cGUgXCJFbGVtZW50XCIuJyk7XG4gICAgfVxuXG4gICAgdmFyIG9ic2VydmF0aW9ucyA9IHRoaXMub2JzZXJ2YXRpb25zXztcblxuICAgIC8vIERvIG5vdGhpbmcgaWYgZWxlbWVudCBpcyBhbHJlYWR5IGJlaW5nIG9ic2VydmVkLlxuICAgIGlmIChvYnNlcnZhdGlvbnMuaGFzKHRhcmdldCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG9ic2VydmF0aW9ucy5zZXQodGFyZ2V0LCBuZXcgUmVzaXplT2JzZXJ2YXRpb24odGFyZ2V0KSk7XG5cbiAgICB0aGlzLmNvbnRyb2xsZXJfLmFkZE9ic2VydmVyKHRoaXMpO1xuXG4gICAgLy8gRm9yY2UgdGhlIHVwZGF0ZSBvZiBvYnNlcnZhdGlvbnMuXG4gICAgdGhpcy5jb250cm9sbGVyXy5yZWZyZXNoKCk7XG59O1xuXG4vKipcclxuICogU3RvcHMgb2JzZXJ2aW5nIHByb3ZpZGVkIGVsZW1lbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0IC0gRWxlbWVudCB0byBzdG9wIG9ic2VydmluZy5cclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJTUEkucHJvdG90eXBlLnVub2JzZXJ2ZSA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignMSBhcmd1bWVudCByZXF1aXJlZCwgYnV0IG9ubHkgMCBwcmVzZW50LicpO1xuICAgIH1cblxuICAgIC8vIERvIG5vdGhpbmcgaWYgY3VycmVudCBlbnZpcm9ubWVudCBkb2Vzbid0IGhhdmUgdGhlIEVsZW1lbnQgaW50ZXJmYWNlLlxuICAgIGlmICh0eXBlb2YgRWxlbWVudCA9PT0gJ3VuZGVmaW5lZCcgfHwgIShFbGVtZW50IGluc3RhbmNlb2YgT2JqZWN0KSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCEodGFyZ2V0IGluc3RhbmNlb2YgZ2V0V2luZG93T2YodGFyZ2V0KS5FbGVtZW50KSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdwYXJhbWV0ZXIgMSBpcyBub3Qgb2YgdHlwZSBcIkVsZW1lbnRcIi4nKTtcbiAgICB9XG5cbiAgICB2YXIgb2JzZXJ2YXRpb25zID0gdGhpcy5vYnNlcnZhdGlvbnNfO1xuXG4gICAgLy8gRG8gbm90aGluZyBpZiBlbGVtZW50IGlzIG5vdCBiZWluZyBvYnNlcnZlZC5cbiAgICBpZiAoIW9ic2VydmF0aW9ucy5oYXModGFyZ2V0KSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgb2JzZXJ2YXRpb25zLmRlbGV0ZSh0YXJnZXQpO1xuXG4gICAgaWYgKCFvYnNlcnZhdGlvbnMuc2l6ZSkge1xuICAgICAgICB0aGlzLmNvbnRyb2xsZXJfLnJlbW92ZU9ic2VydmVyKHRoaXMpO1xuICAgIH1cbn07XG5cbi8qKlxyXG4gKiBTdG9wcyBvYnNlcnZpbmcgYWxsIGVsZW1lbnRzLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7dm9pZH1cclxuICovXG5SZXNpemVPYnNlcnZlclNQSS5wcm90b3R5cGUuZGlzY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmNsZWFyQWN0aXZlKCk7XG4gICAgdGhpcy5vYnNlcnZhdGlvbnNfLmNsZWFyKCk7XG4gICAgdGhpcy5jb250cm9sbGVyXy5yZW1vdmVPYnNlcnZlcih0aGlzKTtcbn07XG5cbi8qKlxyXG4gKiBDb2xsZWN0cyBvYnNlcnZhdGlvbiBpbnN0YW5jZXMgdGhlIGFzc29jaWF0ZWQgZWxlbWVudCBvZiB3aGljaCBoYXMgY2hhbmdlZFxyXG4gKiBpdCdzIGNvbnRlbnQgcmVjdGFuZ2xlLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7dm9pZH1cclxuICovXG5SZXNpemVPYnNlcnZlclNQSS5wcm90b3R5cGUuZ2F0aGVyQWN0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdGhpcyQxID0gdGhpcztcblxuICAgIHRoaXMuY2xlYXJBY3RpdmUoKTtcblxuICAgIHRoaXMub2JzZXJ2YXRpb25zXy5mb3JFYWNoKGZ1bmN0aW9uIChvYnNlcnZhdGlvbikge1xuICAgICAgICBpZiAob2JzZXJ2YXRpb24uaXNBY3RpdmUoKSkge1xuICAgICAgICAgICAgdGhpcyQxLmFjdGl2ZU9ic2VydmF0aW9uc18ucHVzaChvYnNlcnZhdGlvbik7XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbi8qKlxyXG4gKiBJbnZva2VzIGluaXRpYWwgY2FsbGJhY2sgZnVuY3Rpb24gd2l0aCBhIGxpc3Qgb2YgUmVzaXplT2JzZXJ2ZXJFbnRyeVxyXG4gKiBpbnN0YW5jZXMgY29sbGVjdGVkIGZyb20gYWN0aXZlIHJlc2l6ZSBvYnNlcnZhdGlvbnMuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHt2b2lkfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyU1BJLnByb3RvdHlwZS5icm9hZGNhc3RBY3RpdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gRG8gbm90aGluZyBpZiBvYnNlcnZlciBkb2Vzbid0IGhhdmUgYWN0aXZlIG9ic2VydmF0aW9ucy5cbiAgICBpZiAoIXRoaXMuaGFzQWN0aXZlKCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBjdHggPSB0aGlzLmNhbGxiYWNrQ3R4XztcblxuICAgIC8vIENyZWF0ZSBSZXNpemVPYnNlcnZlckVudHJ5IGluc3RhbmNlIGZvciBldmVyeSBhY3RpdmUgb2JzZXJ2YXRpb24uXG4gICAgdmFyIGVudHJpZXMgPSB0aGlzLmFjdGl2ZU9ic2VydmF0aW9uc18ubWFwKGZ1bmN0aW9uIChvYnNlcnZhdGlvbikge1xuICAgICAgICByZXR1cm4gbmV3IFJlc2l6ZU9ic2VydmVyRW50cnkob2JzZXJ2YXRpb24udGFyZ2V0LCBvYnNlcnZhdGlvbi5icm9hZGNhc3RSZWN0KCkpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5jYWxsYmFja18uY2FsbChjdHgsIGVudHJpZXMsIGN0eCk7XG4gICAgdGhpcy5jbGVhckFjdGl2ZSgpO1xufTtcblxuLyoqXHJcbiAqIENsZWFycyB0aGUgY29sbGVjdGlvbiBvZiBhY3RpdmUgb2JzZXJ2YXRpb25zLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7dm9pZH1cclxuICovXG5SZXNpemVPYnNlcnZlclNQSS5wcm90b3R5cGUuY2xlYXJBY3RpdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5hY3RpdmVPYnNlcnZhdGlvbnNfLnNwbGljZSgwKTtcbn07XG5cbi8qKlxyXG4gKiBUZWxscyB3aGV0aGVyIG9ic2VydmVyIGhhcyBhY3RpdmUgb2JzZXJ2YXRpb25zLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICovXG5SZXNpemVPYnNlcnZlclNQSS5wcm90b3R5cGUuaGFzQWN0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmFjdGl2ZU9ic2VydmF0aW9uc18ubGVuZ3RoID4gMDtcbn07XG5cbi8vIFJlZ2lzdHJ5IG9mIGludGVybmFsIG9ic2VydmVycy4gSWYgV2Vha01hcCBpcyBub3QgYXZhaWxhYmxlIHVzZSBjdXJyZW50IHNoaW1cbi8vIGZvciB0aGUgTWFwIGNvbGxlY3Rpb24gYXMgaXQgaGFzIGFsbCByZXF1aXJlZCBtZXRob2RzIGFuZCBiZWNhdXNlIFdlYWtNYXBcbi8vIGNhbid0IGJlIGZ1bGx5IHBvbHlmaWxsZWQgYW55d2F5LlxudmFyIG9ic2VydmVycyA9IHR5cGVvZiBXZWFrTWFwICE9PSAndW5kZWZpbmVkJyA/IG5ldyBXZWFrTWFwKCkgOiBuZXcgTWFwU2hpbSgpO1xuXG4vKipcclxuICogUmVzaXplT2JzZXJ2ZXIgQVBJLiBFbmNhcHN1bGF0ZXMgdGhlIFJlc2l6ZU9ic2VydmVyIFNQSSBpbXBsZW1lbnRhdGlvblxyXG4gKiBleHBvc2luZyBvbmx5IHRob3NlIG1ldGhvZHMgYW5kIHByb3BlcnRpZXMgdGhhdCBhcmUgZGVmaW5lZCBpbiB0aGUgc3BlYy5cclxuICovXG52YXIgUmVzaXplT2JzZXJ2ZXIgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBSZXNpemVPYnNlcnZlcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uLicpO1xuICAgIH1cbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignMSBhcmd1bWVudCByZXF1aXJlZCwgYnV0IG9ubHkgMCBwcmVzZW50LicpO1xuICAgIH1cblxuICAgIHZhciBjb250cm9sbGVyID0gUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLmdldEluc3RhbmNlKCk7XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IFJlc2l6ZU9ic2VydmVyU1BJKGNhbGxiYWNrLCBjb250cm9sbGVyLCB0aGlzKTtcblxuICAgIG9ic2VydmVycy5zZXQodGhpcywgb2JzZXJ2ZXIpO1xufTtcblxuLy8gRXhwb3NlIHB1YmxpYyBtZXRob2RzIG9mIFJlc2l6ZU9ic2VydmVyLlxuWydvYnNlcnZlJywgJ3Vub2JzZXJ2ZScsICdkaXNjb25uZWN0J10uZm9yRWFjaChmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgUmVzaXplT2JzZXJ2ZXIucHJvdG90eXBlW21ldGhvZF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAocmVmID0gb2JzZXJ2ZXJzLmdldCh0aGlzKSlbbWV0aG9kXS5hcHBseShyZWYsIGFyZ3VtZW50cyk7XG4gICAgICAgIHZhciByZWY7XG4gICAgfTtcbn0pO1xuXG52YXIgaW5kZXggPSAoZnVuY3Rpb24gKCkge1xuICAgIC8vIEV4cG9ydCBleGlzdGluZyBpbXBsZW1lbnRhdGlvbiBpZiBhdmFpbGFibGUuXG4gICAgaWYgKHR5cGVvZiBnbG9iYWwkMS5SZXNpemVPYnNlcnZlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGdsb2JhbCQxLlJlc2l6ZU9ic2VydmVyO1xuICAgIH1cblxuICAgIHJldHVybiBSZXNpemVPYnNlcnZlcjtcbn0pKCk7XG5cbnJldHVybiBpbmRleDtcblxufSkpKTtcbiIsImltcG9ydCB7IEV2ZW50RGlzcGF0Y2hlciB9IGZyb20gXCIuLi9ncmlkL2V2ZW50XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRGF0YVRhYmxlIGV4dGVuZHMgRXZlbnREaXNwYXRjaGVyIHtcclxuICAgIFxyXG4gICAgY29uc3RydWN0b3IgKGRhdGFNb2RlbCwgZXh0ZW5zaW9uKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy5fZXh0ZW5zaW9uID0gZXh0ZW5zaW9uO1xyXG4gICAgICAgIHRoaXMuX2lkUnVubmVyID0gMDtcclxuICAgICAgICB0aGlzLl9yaWQgPSBbXTtcclxuICAgICAgICB0aGlzLl9yb3dNYXAgPSB7fTtcclxuICAgICAgICB0aGlzLl9kYXRhID0gW107XHJcbiAgICAgICAgdGhpcy5fYmxvY2tFdmVudCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuX3Byb2Nlc3NlZEV2ZW50ID0gW107XHJcblxyXG4gICAgICAgIGxldCB7IGZvcm1hdCwgZGF0YSwgZmllbGRzIH0gPSBkYXRhTW9kZWw7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gU2V0IGRlZmF1bHQgZm9ybWF0IGF0IHJvd3NcclxuICAgICAgICBpZiAoIWZvcm1hdCkge1xyXG4gICAgICAgICAgICBmb3JtYXQgPSAncm93cyc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2RhdGFGb3JtYXQgPSBmb3JtYXQ7XHJcbiAgICAgICAgdGhpcy5fZmllbGRzID0gZmllbGRzO1xyXG5cclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkYXRhKSkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpPTA7IGk8ZGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRSb3coZGF0YVtpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9kYXRhID0gW107XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldFJvd0NvdW50ICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RGF0YSAocm93SWQsIGZpZWxkKSB7XHJcbiAgICAgICAgbGV0IHJvdyA9IHRoaXMuX3Jvd01hcFtyb3dJZF07XHJcbiAgICAgICAgaWYgKHJvdykge1xyXG4gICAgICAgICAgICByZXR1cm4gcm93W2ZpZWxkXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBnZXREYXRhQXQgKHJvd0luZGV4LCBmaWVsZCkge1xyXG4gICAgICAgIGxldCByb3cgPSB0aGlzLl9kYXRhW3Jvd0luZGV4XTtcclxuICAgICAgICBpZiAocm93KSB7XHJcbiAgICAgICAgICAgIHJldHVybiByb3dbZmllbGRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFJvd0RhdGEgKHJvd0lkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Jvd01hcFtyb3dJZF07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Um93RGF0YUF0IChyb3dJbmRleCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhW3Jvd0luZGV4XTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRSb3dJbmRleCAocm93SWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcmlkLmluZGV4T2Yocm93SWQpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFJvd0lkIChyb3dJbmRleCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9yaWRbcm93SW5kZXhdO1xyXG4gICAgfVxyXG5cclxuICAgIHNldERhdGEgKHJvd0lkLCBmaWVsZCwgdmFsdWUpIHtcclxuICAgICAgICBjb25zdCBiZWZvcmVVcGRhdGVBcmcgPSB7XHJcblx0XHRcdHJvd0lkOiByb3dJZCxcclxuXHRcdFx0ZmllbGQ6IGZpZWxkLFxyXG5cdFx0XHRkYXRhOiB2YWx1ZSxcclxuXHRcdFx0Y2FuY2VsOiBmYWxzZVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5fcHJvY2Vzc2VkRXZlbnQucHVzaChiZWZvcmVVcGRhdGVBcmcpO1xyXG5cclxuICAgICAgICBsZXQgYmxvY2tlZCA9IGZhbHNlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICghdGhpcy5fYmxvY2tFdmVudCkge1xyXG5cdFx0XHR0aGlzLl9ibG9ja0V2ZW50ID0gdHJ1ZTtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9uLmV4ZWN1dGVFeHRlbnNpb24oJ2RhdGFCZWZvcmVVcGRhdGUnLCBiZWZvcmVVcGRhdGVBcmcpO1xyXG5cdFx0XHR0aGlzLl9ibG9ja0V2ZW50ID0gZmFsc2U7XHJcblx0XHR9IGVsc2Uge1xyXG4gICAgICAgICAgICBibG9ja2VkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG5cdFx0aWYgKCFiZWZvcmVVcGRhdGVBcmcuY2FuY2VsKSB7XHJcbiAgICAgICAgICAgIGxldCByb3cgPSB0aGlzLl9yb3dNYXBbcm93SWRdO1xyXG4gICAgICAgICAgICBpZiAocm93KSB7XHJcbiAgICAgICAgICAgICAgICByb3dbZmllbGRdID0gYmVmb3JlVXBkYXRlQXJnLmRhdGE7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2Jsb2NrRXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ibG9ja0V2ZW50ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9leHRlbnNpb24uZXhlY3V0ZUV4dGVuc2lvbignZGF0YUFmdGVyVXBkYXRlJywgYmVmb3JlVXBkYXRlQXJnKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ibG9ja0V2ZW50ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghYmxvY2tlZCkge1xyXG4gICAgICAgICAgICB0aGlzLl9leHRlbnNpb24uZXhlY3V0ZUV4dGVuc2lvbignZGF0YUZpbmlzaFVwZGF0ZScsIHtcclxuICAgICAgICAgICAgICAgIHVwZGF0ZXM6IHRoaXMuX3Byb2Nlc3NlZEV2ZW50XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvL0NsZWFyIHByb2Nlc3NlZCBldmVudCBsaXN0ICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NlZEV2ZW50Lmxlbmd0aCA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldERhdGFBdCAocm93SW5kZXgsIGZpZWxkLCB2YWx1ZSkge1xyXG4gICAgICAgIGNvbnN0IHJvd0lkID0gdGhpcy5fcmlkW3Jvd0luZGV4XTtcclxuICAgICAgICBpZiAocm93SWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB0aGlzLnNldERhdGEocm93SWQsIGZpZWxkLCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFkZFJvdyAocm93RGF0YSkge1xyXG4gICAgICAgIGNvbnN0IGNvdW50ID0gdGhpcy5nZXRSb3dDb3VudCgpO1xyXG4gICAgICAgIHRoaXMuaW5zZXJ0Um93KGNvdW50LCByb3dEYXRhKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW5zZXJ0Um93IChyb3dJbmRleCwgcm93RGF0YSkge1xyXG4gICAgICAgIGlmICh0aGlzLl9kYXRhRm9ybWF0ID09PSAncm93cycpIHtcclxuICAgICAgICAgICAgbGV0IHJpZCA9IHRoaXMuX2dlbmVyYXRlUm93SWQoKTtcclxuICAgICAgICAgICAgdGhpcy5fcmlkLnNwbGljZShyb3dJbmRleCwgMCwgcmlkKTtcclxuICAgICAgICAgICAgdGhpcy5fcm93TWFwW3JpZF0gPSByb3dEYXRhO1xyXG4gICAgICAgICAgICB0aGlzLl9kYXRhLnNwbGljZShyb3dJbmRleCwgMCwgcm93RGF0YSk7XHJcbiAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgaWYgKHRoaXMuX2RhdGFGb3JtYXQgPT09ICdhcnJheScpIHtcclxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5fZmllbGRzKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHJpZCA9IHRoaXMuX2dlbmVyYXRlUm93SWQoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3JpZC5zcGxpY2Uocm93SW5kZXgsIDAsIHJpZCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgbmV3T2JqID0gdGhpcy5fY3JlYXRlT2JqZWN0KHJvd0RhdGEsIHRoaXMuX2ZpZWxkcyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yb3dNYXBbcmlkXSA9IG5ld09iajtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2RhdGEuc3BsaWNlKHJvd0luZGV4LCAwLCBuZXdPYmopO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZVJvdyAocmlkKSB7IFxyXG4gICAgICAgIGxldCByb3cgPSB0aGlzLl9yb3dNYXBbcmlkXTtcclxuICAgICAgICBsZXQgaW5kZXggPSB0aGlzLl9kYXRhLmluZGV4T2Yocm93KTtcclxuICAgICAgICB0aGlzLl9kYXRhLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMuX3Jvd01hcFtyaWRdO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZVJvd0F0IChpbmRleCkge1xyXG4gICAgICAgIGxldCByaWQgPSBPYmplY3Qua2V5cyh0aGlzLl9yb3dNYXApLmZpbmQoa2V5ID0+IG9iamVjdFtrZXldID09PSB2YWx1ZSk7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMuX3Jvd01hcFtyaWRdO1xyXG4gICAgICAgIHRoaXMuX2RhdGEuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIH1cclxuXHJcbiAgICBfZ2VuZXJhdGVSb3dJZCAoKSB7XHJcbiAgICAgICAgdGhpcy5faWRSdW5uZXIrKztcclxuICAgICAgICByZXR1cm4gJycgKyB0aGlzLl9pZFJ1bm5lcjtcclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlT2JqZWN0KGFycmF5VmFsdWVzLCBmaWVsZHMpIHtcclxuICAgICAgICBsZXQgbmV3T2JqID0ge307XHJcbiAgICAgICAgZm9yIChsZXQgaT0wOyBpPGZpZWxkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBuZXdPYmpbZmllbGRzW2ldXSA9IGFycmF5VmFsdWVzW2ldO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3T2JqO1xyXG4gICAgfVxyXG5cclxufSIsImV4cG9ydCBjbGFzcyBDb3B5UGFzdGVFeHRlbnNpb24ge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuX2dsb2JhbENsaXBib2FyZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuXHRpbml0IChncmlkLCBjb25maWcpIHtcclxuXHRcdHRoaXMuX2dyaWQgPSBncmlkO1xyXG5cdFx0dGhpcy5fY29uZmlnID0gY29uZmlnO1xyXG5cdH1cclxuXHJcblx0a2V5RG93biAoZSkge1xyXG4gICAgICAgIGlmICh0aGlzLl9nbG9iYWxDbGlwYm9hcmQgJiYgZS5jdHJsS2V5KSB7XHJcbiAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ2MnKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZGF0YSA9IHRoaXMuX2NvcHkoKTtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmNsaXBib2FyZERhdGEuc2V0RGF0YSgndGV4dCcsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgaWYgKGUua2V5ID09PSAndicpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Bhc3RlKHdpbmRvdy5jbGlwYm9hcmREYXRhLmdldERhdGEoJ3RleHQnKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ3JpZEFmdGVyUmVuZGVyKGUpIHtcclxuICAgICAgICBpZiAoIXdpbmRvdy5jbGlwYm9hcmREYXRhKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2dyaWQudmlldy5nZXRFbGVtZW50KCkuYWRkRXZlbnRMaXN0ZW5lcigncGFzdGUnLCAocGFzdGVFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcGFzdGUocGFzdGVFdmVudC5jbGlwYm9hcmREYXRhLmdldERhdGEoJ3RleHQnKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLl9ncmlkLnZpZXcuZ2V0RWxlbWVudCgpLmFkZEV2ZW50TGlzdGVuZXIoJ2NvcHknLCAoY29weUV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZGF0YSA9IHRoaXMuX2NvcHkoKTtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29weUV2ZW50LmNsaXBib2FyZERhdGEuc2V0RGF0YSgndGV4dC9wbGFpbicsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvcHlFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5fZ2xvYmFsQ2xpcGJvYXJkID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fZ2xvYmFsQ2xpcGJvYXJkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NvcHkoY2xpcGJvYXJkRGF0YSkge1xyXG4gICAgICAgIGxldCBzZWxlY3Rpb24gPSB0aGlzLl9ncmlkLnN0YXRlLmdldCgnc2VsZWN0aW9uJyk7XHJcbiAgICAgICAgaWYgKHNlbGVjdGlvbiAmJiBzZWxlY3Rpb24ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBsZXQgcyA9IHNlbGVjdGlvblswXTtcclxuICAgICAgICAgICAgbGV0IHJvd3MgPSBbXTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaT0wOyBpPHMuaDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY29scyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaj0wOyBqPHMudzsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29scy5wdXNoKHRoaXMuX2dyaWQuZGF0YS5nZXREYXRhQXQocy5yICsgaSwgcy5jICsgaikpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcm93cy5wdXNoKGNvbHMuam9pbignXFx0JykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByb3dzLmpvaW4oJ1xcbicpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfcGFzdGUoZGF0YSkge1xyXG4gICAgICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgICAgIGRhdGEgPSBkYXRhLnJlcGxhY2UoL1xcbiQvZywgJycpO1xyXG4gICAgICAgICAgICBsZXQgc2VsZWN0aW9uID0gdGhpcy5fZ3JpZC5zdGF0ZS5nZXQoJ3NlbGVjdGlvbicpO1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0aW9uICYmIHNlbGVjdGlvbi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcyA9IHNlbGVjdGlvblswXTtcclxuICAgICAgICAgICAgICAgIGxldCByb3dzID0gZGF0YS5zcGxpdCgnXFxuJyk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpPTA7IGk8cm93cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjb2xzID0gcm93c1tpXS5zcGxpdCgnXFx0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaj0wOyBqPGNvbHMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHBhc3RlUm93ID0gIHMuciArIGk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwYXN0ZUNvbCA9IHMuYyArIGo7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9ncmlkLm1vZGVsLmNhbkVkaXQocGFzdGVSb3csIHBhc3RlQ29sKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ3JpZC5kYXRhLnNldERhdGFBdChwYXN0ZVJvdywgcGFzdGVDb2wsIGNvbHNbal0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ3JpZC52aWV3LnVwZGF0ZUNlbGwocGFzdGVSb3csIHBhc3RlQ29sKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn0iLCJleHBvcnQgY2xhc3MgRWRpdG9yRXh0ZW5zaW9uIHtcclxuXHJcblx0aW5pdCAoZ3JpZCwgY29uZmlnKSB7XHJcblx0XHR0aGlzLl9ncmlkID0gZ3JpZDtcclxuXHRcdHRoaXMuX2NvbmZpZyA9IGNvbmZpZztcclxuXHRcdHRoaXMuX2VkaXRvckF0dGFjaGVkID0gZmFsc2U7XHJcblx0XHR0aGlzLnNjcm9sbEhhbmRsZXIgPSB0aGlzLnNjcm9sbEhhbmRsZXIuYmluZCh0aGlzKTtcclxuXHRcdHRoaXMuX2dyaWQudmlldy5saXN0ZW4oJ3ZzY3JvbGwnLCB0aGlzLnNjcm9sbEhhbmRsZXIpO1xyXG5cdFx0dGhpcy5fZ3JpZC52aWV3Lmxpc3RlbignaHNjcm9sbCcsIHRoaXMuc2Nyb2xsSGFuZGxlcik7XHJcblx0fVxyXG5cclxuXHRzY3JvbGxIYW5kbGVyICgpIHtcclxuXHRcdHRoaXMuX2RldGFjaEVkaXRvcigpO1xyXG5cdH1cclxuXHJcblx0a2V5RG93biAoZSkge1xyXG5cdFx0aWYgKCF0aGlzLl9lZGl0b3JBdHRhY2hlZCkge1xyXG5cdFx0XHRpZiAoIWUuY3RybEtleSkge1xyXG5cdFx0XHRcdGxldCBzZWxlY3Rpb24gPSB0aGlzLl9ncmlkLnN0YXRlLmdldCgnc2VsZWN0aW9uJyk7XHJcblx0XHRcdFx0aWYgKHNlbGVjdGlvbiAmJiBzZWxlY3Rpb24ubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRcdFx0bGV0IHJvd0luZGV4ID0gc2VsZWN0aW9uWzBdLnI7XHJcblx0XHRcdFx0XHRsZXQgY29sSW5kZXggPSBzZWxlY3Rpb25bMF0uYztcclxuXHRcdFx0XHRcdGxldCBlZGl0ID0gZmFsc2U7XHJcblx0XHRcdFx0XHRpZiAoZS5rZXlDb2RlID09PSAxMyB8fCAoZS5rZXlDb2RlID4gMzEgJiYgIShlLmtleUNvZGUgPj0gMzcgJiYgZS5rZXlDb2RlIDw9IDQwKSkpIHtcclxuXHRcdFx0XHRcdFx0ZWRpdCA9IHRydWU7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZiAoZWRpdCAmJlxyXG5cdFx0XHRcdFx0XHRyb3dJbmRleCA+PSAwICYmIHJvd0luZGV4IDwgdGhpcy5fZ3JpZC5tb2RlbC5nZXRSb3dDb3VudCgpICYmXHJcblx0XHRcdFx0XHRcdGNvbEluZGV4ID49IDAgJiYgY29sSW5kZXggPCB0aGlzLl9ncmlkLm1vZGVsLmdldENvbHVtbkNvdW50KCkpIHtcclxuXHRcdFx0XHRcdFx0bGV0IGNlbGwgPSB0aGlzLl9ncmlkLnZpZXcuZ2V0Q2VsbChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cdFx0XHRcdFx0XHRpZiAoY2VsbCkge1xyXG5cdFx0XHRcdFx0XHRcdHRoaXMuX2VkaXRDZWxsKGNlbGwpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHRcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGNlbGxBZnRlclJlbmRlciAoZSkge1xyXG5cdFx0ZS5jZWxsLmFkZEV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgKGUpID0+IHtcclxuXHRcdFx0bGV0IGFjdHVhbENlbGwgPSBlLnRhcmdldDtcclxuXHRcdFx0aWYgKGFjdHVhbENlbGwpIHtcclxuXHRcdFx0XHR0aGlzLl9lZGl0Q2VsbChhY3R1YWxDZWxsKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRfZWRpdENlbGwgKGNlbGwpIHtcclxuXHRcdGxldCBhY3R1YWxDZWxsID0gY2VsbDtcclxuXHRcdGxldCBhY3R1YWxSb3cgPSBwYXJzZUludChhY3R1YWxDZWxsLmRhdGFzZXQucm93SW5kZXgpO1xyXG5cdFx0bGV0IGFjdHVhbENvbCA9IHBhcnNlSW50KGFjdHVhbENlbGwuZGF0YXNldC5jb2xJbmRleCk7XHJcblx0XHRpZiAodGhpcy5fZ3JpZC5tb2RlbC5jYW5FZGl0KGFjdHVhbFJvdywgYWN0dWFsQ29sKSkge1xyXG5cdFx0XHQvL0dldCBkYXRhIHRvIGJlIGVkaXRlZFxyXG5cdFx0XHRsZXQgZGF0YSA9IHRoaXMuX2dyaWQubW9kZWwuZ2V0RGF0YUF0KGFjdHVhbFJvdywgYWN0dWFsQ29sKTtcclxuXHJcblx0XHRcdC8vSWYgdGhlcmUncyBjdXN0b20gZWRpdG9yLCB1c2UgY3VzdG9tIGVkaXRvciB0byBhdHRhY2ggdGhlIGVkaXRvclxyXG5cdFx0XHR0aGlzLl9ncmlkLnN0YXRlLnNldCgnZWRpdGluZycsIHRydWUpO1xyXG5cclxuXHRcdFx0Ly9DcmVhdGUgZmxvYXQgZWRpdG9yIGNvbnRhaW5lclxyXG5cdFx0XHRsZXQgY2VsbEJvdW5kID0gY2VsbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHRcdFx0dGhpcy5fZWRpdG9yQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRcdHRoaXMuX2VkaXRvckNvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcblx0XHRcdHRoaXMuX2VkaXRvckNvbnRhaW5lci5zdHlsZS50b3AgPSBjZWxsQm91bmQudG9wICsgJ3B4JztcclxuXHRcdFx0dGhpcy5fZWRpdG9yQ29udGFpbmVyLnN0eWxlLmxlZnQgPSBjZWxsQm91bmQubGVmdCArICdweCc7XHJcblx0XHRcdHRoaXMuX2VkaXRvckNvbnRhaW5lci5zdHlsZS53aWR0aCA9IGNlbGxCb3VuZC53aWR0aCArICdweCc7XHJcblx0XHRcdHRoaXMuX2VkaXRvckNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBjZWxsQm91bmQuaGVpZ2h0ICsgJ3B4JztcclxuXHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLl9lZGl0b3JDb250YWluZXIpO1xyXG5cclxuXHRcdFx0bGV0IGN1c3RvbUVkaXRvciA9IHRoaXMuX2dyaWQubW9kZWwuZ2V0Q2FzY2FkZWRDZWxsUHJvcChhY3R1YWxDZWxsLmRhdGFzZXQucm93SW5kZXgsIGFjdHVhbENlbGwuZGF0YXNldC5jb2xJbmRleCwgJ2VkaXRvcicpO1xyXG5cdFx0XHRpZiAoY3VzdG9tRWRpdG9yICYmIGN1c3RvbUVkaXRvci5hdHRhY2gpIHtcclxuXHRcdFx0XHRjdXN0b21FZGl0b3IuYXR0YWNoKHRoaXMuX2VkaXRvckNvbnRhaW5lciwgZGF0YSwgdGhpcy5fZG9uZS5iaW5kKHRoaXMpKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLl9hdHRhY2hFZGl0b3IodGhpcy5fZWRpdG9yQ29udGFpbmVyLCBkYXRhLCB0aGlzLl9kb25lLmJpbmQodGhpcykpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRoaXMuX2VkaXRvckF0dGFjaGVkID0gdHJ1ZTtcclxuXHRcdFx0dGhpcy5fZWRpdGluZ0NvbCA9IGFjdHVhbENvbDtcclxuXHRcdFx0dGhpcy5fZWRpdGluZ1JvdyA9IGFjdHVhbFJvdztcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdF9hdHRhY2hFZGl0b3IgKGNlbGwsIGRhdGEsIGRvbmUpIHtcclxuXHRcdGlmICghdGhpcy5faW5wdXRFbGVtZW50KSB7XHJcblx0XHRcdGxldCBjZWxsQm91bmQgPSBjZWxsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQudHlwZSA9ICd0ZXh0JztcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LnZhbHVlID0gZGF0YTtcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LnN0eWxlLndpZHRoID0gKGNlbGxCb3VuZC53aWR0aCkgKyAncHgnO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gKGNlbGxCb3VuZC5oZWlnaHQpICsgJ3B4JztcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LmNsYXNzTmFtZSA9ICdwZ3JpZC1jZWxsLXRleHQtZWRpdG9yJztcclxuXHRcdFx0XHJcblx0XHRcdGNlbGwuYXBwZW5kQ2hpbGQodGhpcy5faW5wdXRFbGVtZW50KTtcclxuXHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5mb2N1cygpO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQuc2VsZWN0KCk7XHJcblxyXG5cdFx0XHR0aGlzLl9hcnJvd0tleUxvY2tlZCA9IGZhbHNlO1xyXG5cclxuXHRcdFx0dGhpcy5fa2V5ZG93bkhhbmRsZXIgPSAoZSkgPT4ge1xyXG5cdFx0XHRcdHN3aXRjaCAoZS5rZXlDb2RlKSB7XHJcblx0XHRcdFx0XHRjYXNlIDEzOiAvL0VudGVyXHJcblx0XHRcdFx0XHRcdGRvbmUoZS50YXJnZXQudmFsdWUpO1xyXG5cdFx0XHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdFx0Y2FzZSAyNzogLy9FU0NcclxuXHRcdFx0XHRcdFx0ZG9uZSgpO1xyXG5cdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblx0XHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdFx0Y2FzZSA0MDogLy9Eb3duXHJcblx0XHRcdFx0XHRjYXNlIDM4OiAvL1VwXHJcblx0XHRcdFx0XHRjYXNlIDM3OiAvL0xlZnRcclxuXHRcdFx0XHRcdGNhc2UgMzk6IC8vUmlnaHRcclxuXHRcdFx0XHRcdFx0aWYgKCF0aGlzLl9hcnJvd0tleUxvY2tlZCkge1xyXG5cdFx0XHRcdFx0XHRcdGRvbmUoZS50YXJnZXQudmFsdWUpO1xyXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fTtcclxuXHRcdFx0dGhpcy5fa2V5ZG93bkhhbmRsZXIgPSB0aGlzLl9rZXlkb3duSGFuZGxlci5iaW5kKHRoaXMpO1xyXG5cclxuXHRcdFx0dGhpcy5fYmx1ckhhbmRsZXIgPSAoZSkgPT4ge1xyXG5cdFx0XHRcdGRvbmUoZS50YXJnZXQudmFsdWUpO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHR0aGlzLl9ibHVySGFuZGxlciA9IHRoaXMuX2JsdXJIYW5kbGVyLmJpbmQodGhpcyk7XHJcblxyXG5cdFx0XHR0aGlzLl9jbGlja0hhbmRsZXIgPSAoZSkgPT4ge1xyXG5cdFx0XHRcdHRoaXMuX2Fycm93S2V5TG9ja2VkID0gdHJ1ZTtcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fa2V5ZG93bkhhbmRsZXIpO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMuX2JsdXJIYW5kbGVyKTtcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fY2xpY2tIYW5kbGVyKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdF9kZXRhY2hFZGl0b3IgKCkge1xyXG5cdFx0aWYgKHRoaXMuX2VkaXRvckNvbnRhaW5lcikge1xyXG5cdFx0XHR0aGlzLl9lZGl0b3JDb250YWluZXIucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLl9lZGl0b3JDb250YWluZXIpO1xyXG5cdFx0XHR0aGlzLl9lZGl0b3JDb250YWluZXIgPSBudWxsO1xyXG5cdFx0XHRpZiAodGhpcy5faW5wdXRFbGVtZW50KSB7XHJcblx0XHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9rZXlkb3duSGFuZGxlcik7XHJcblx0XHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLl9ibHVySGFuZGxlcik7XHJcblx0XHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fY2xpY2tIYW5kbGVyKTtcclxuXHRcdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLl9pbnB1dEVsZW1lbnQpO1xyXG5cdFx0XHRcdHRoaXMuX2lucHV0RWxlbWVudCA9IG51bGw7XHJcblx0XHRcdFx0dGhpcy5fa2V5ZG93bkhhbmRsZXIgPSBudWxsO1xyXG5cdFx0XHRcdHRoaXMuX2JsdXJIYW5kbGVyID0gbnVsbDtcclxuXHRcdFx0XHR0aGlzLl9jbGlja0hhbmRsZXIgPSBudWxsO1x0XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdF9kb25lIChyZXN1bHQpIHtcclxuXHRcdHRoaXMuX2RldGFjaEVkaXRvcigpO1xyXG5cdFx0aWYgKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdHRoaXMuX2dyaWQubW9kZWwuc2V0RGF0YUF0KHRoaXMuX2VkaXRpbmdSb3csIHRoaXMuX2VkaXRpbmdDb2wsIHJlc3VsdCk7XHJcblx0XHR9XHJcblx0XHR0aGlzLl9ncmlkLnZpZXcudXBkYXRlQ2VsbCh0aGlzLl9lZGl0aW5nUm93LCB0aGlzLl9lZGl0aW5nQ29sKTtcclxuXHRcdHRoaXMuX2VkaXRpbmdSb3cgPSAtMTtcclxuXHRcdHRoaXMuX2VkaXRpbmdDb2wgPSAtMTtcclxuXHRcdHRoaXMuX2VkaXRvckF0dGFjaGVkID0gZmFsc2U7XHJcblx0XHR0aGlzLl9ncmlkLnN0YXRlLnNldCgnZWRpdGluZycsIGZhbHNlKTtcclxuXHJcblx0XHQvL1JlLWZvY3VzIGF0IHRoZSBncmlkXHJcblx0XHR0aGlzLl9ncmlkLnZpZXcuZ2V0RWxlbWVudCgpLmZvY3VzKCk7XHJcblx0fVxyXG5cclxufSIsImV4cG9ydCBjbGFzcyBTZWxlY3Rpb25FeHRlbnNpb24ge1xyXG5cclxuXHRpbml0IChncmlkLCBjb25maWcpIHtcclxuXHRcdHRoaXMuX2dyaWQgPSBncmlkO1xyXG5cdFx0dGhpcy5fY29uZmlnID0gY29uZmlnO1xyXG5cdFx0dGhpcy5fY3VycmVudFNlbGVjdGlvbiA9IG51bGw7XHJcblx0XHR0aGlzLl9zZWxlY3Rpb25DbGFzcyA9ICh0aGlzLl9jb25maWcuc2VsZWN0aW9uICYmIHRoaXMuX2NvbmZpZy5zZWxlY3Rpb24uY3NzQ2xhc3MpP3RoaXMuX2NvbmZpZy5zZWxlY3Rpb24uY3NzQ2xhc3M6J3BncmlkLWNlbGwtc2VsZWN0aW9uJztcclxuXHR9XHJcblxyXG5cdGtleURvd24gKGUpIHtcclxuXHRcdGxldCBlZGl0aW5nID0gdGhpcy5fZ3JpZC5zdGF0ZS5nZXQoJ2VkaXRpbmcnKTtcclxuXHRcdGlmIChlZGl0aW5nKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdGxldCBzZWxlY3Rpb24gPSB0aGlzLl9ncmlkLnN0YXRlLmdldCgnc2VsZWN0aW9uJyk7XHJcblx0XHRpZiAoc2VsZWN0aW9uICYmIHNlbGVjdGlvbi5sZW5ndGggPiAwKSB7XHJcblx0XHRcdGxldCByb3dJbmRleCA9IHNlbGVjdGlvblswXS5yO1xyXG5cdFx0XHRsZXQgY29sSW5kZXggPSBzZWxlY3Rpb25bMF0uYztcclxuXHRcdFx0bGV0IGFsaWduVG9wID0gdHJ1ZTtcclxuXHRcdFx0c3dpdGNoIChlLmtleUNvZGUpIHtcclxuXHRcdFx0XHRjYXNlIDQwOiAvL0Rvd25cclxuXHRcdFx0XHRcdHJvd0luZGV4Kys7XHJcblx0XHRcdFx0XHRhbGlnblRvcCA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0Y2FzZSAzODogLy9VcFxyXG5cdFx0XHRcdFx0cm93SW5kZXgtLTtcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdGNhc2UgMzc6IC8vTGVmdFxyXG5cdFx0XHRcdFx0Y29sSW5kZXgtLTtcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdGNhc2UgMzk6IC8vUmlnaHRcclxuXHRcdFx0XHRjYXNlIDk6IC8vVGFiXHJcblx0XHRcdFx0XHRjb2xJbmRleCsrO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAocm93SW5kZXggPj0gMCAmJiByb3dJbmRleCA8IHRoaXMuX2dyaWQubW9kZWwuZ2V0Um93Q291bnQoKSAmJlxyXG5cdFx0XHRcdGNvbEluZGV4ID49IDAgJiYgY29sSW5kZXggPCB0aGlzLl9ncmlkLm1vZGVsLmdldENvbHVtbkNvdW50KCkpIHtcclxuXHRcdFx0XHRjb25zdCBpc0hlYWRlciA9IHRoaXMuX2dyaWQubW9kZWwuaXNIZWFkZXJSb3cocm93SW5kZXgpO1xyXG5cdFx0XHRcdGNvbnN0IHJvd01vZGVsID0gdGhpcy5fZ3JpZC5tb2RlbC5nZXRSb3dNb2RlbChyb3dJbmRleCk7XHJcblx0XHRcdFx0aWYgKCFyb3dNb2RlbCB8fCAhaXNIZWFkZXIpIHtcclxuXHRcdFx0XHRcdGxldCBjZWxsID0gdGhpcy5fZ3JpZC52aWV3LmdldENlbGwocm93SW5kZXgsIGNvbEluZGV4KTtcclxuXHRcdFx0XHRcdGlmIChjZWxsKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMuX3NlbGVjdENlbGwoY2VsbCwgcm93SW5kZXgsIGNvbEluZGV4KTtcclxuXHRcdFx0XHRcdFx0dGhpcy5fZ3JpZC52aWV3LnNjcm9sbFRvQ2VsbChyb3dJbmRleCwgY29sSW5kZXgsIGFsaWduVG9wKTtcclxuXHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Y2VsbEFmdGVyUmVuZGVyIChlKSB7XHJcblx0XHRlLmNlbGwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGUpID0+IHtcclxuXHRcdFx0Y29uc3QgYWN0dWFsQ2VsbCA9IGUudGFyZ2V0O1xyXG5cdFx0XHRjb25zdCBhY3R1YWxSb3cgPSBwYXJzZUludChhY3R1YWxDZWxsLmRhdGFzZXQucm93SW5kZXgpO1xyXG5cdFx0XHRjb25zdCBhY3R1YWxDb2wgPSBwYXJzZUludChhY3R1YWxDZWxsLmRhdGFzZXQuY29sSW5kZXgpO1xyXG5cdFx0XHRjb25zdCByb3dNb2RlbCA9IHRoaXMuX2dyaWQubW9kZWwuZ2V0Um93TW9kZWwoYWN0dWFsUm93KTtcclxuXHRcdFx0Y29uc3QgaXNIZWFkZXIgPSB0aGlzLl9ncmlkLm1vZGVsLmlzSGVhZGVyUm93KGFjdHVhbFJvdyk7XHJcblx0XHRcdGlmICghcm93TW9kZWwgfHwgIWlzSGVhZGVyKSB7XHJcblx0XHRcdFx0aWYgKGFjdHVhbENlbGwuY2xhc3NMaXN0LmNvbnRhaW5zKCdwZ3JpZC1jZWxsJykpIHtcclxuXHRcdFx0XHRcdHRoaXMuX3NlbGVjdENlbGwoYWN0dWFsQ2VsbCwgYWN0dWFsUm93LCBhY3R1YWxDb2wpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRfc2VsZWN0Q2VsbCAoY2VsbCwgcm93SW5kZXgsIGNvbEluZGV4KSB7XHJcblx0XHQvL0NsZWFyIG9sZCBzZWxlY3Rpb25cclxuXHRcdGlmICh0aGlzLl9jdXJyZW50U2VsZWN0aW9uICYmIHRoaXMuX2N1cnJlbnRTZWxlY3Rpb24gIT09IGNlbGwpIHtcclxuXHRcdFx0dGhpcy5fY3VycmVudFNlbGVjdGlvbi5jbGFzc0xpc3QucmVtb3ZlKHRoaXMuX3NlbGVjdGlvbkNsYXNzKTtcclxuXHRcdH1cclxuXHJcblx0XHQvL1NldCBzZWxlY3Rpb25cclxuXHRcdHRoaXMuX2N1cnJlbnRTZWxlY3Rpb24gPSBjZWxsO1xyXG5cdFx0dGhpcy5fY3VycmVudFNlbGVjdGlvbi5jbGFzc0xpc3QuYWRkKHRoaXMuX3NlbGVjdGlvbkNsYXNzKTtcclxuXHRcdHRoaXMuX2dyaWQudmlldy5nZXRFbGVtZW50KCkuZm9jdXMoKTtcclxuXHJcblx0XHQvL1N0b3JlIHNlbGVjdGlvbiBzdGF0ZVxyXG5cdFx0bGV0IHNlbGVjdGlvbiA9IHRoaXMuX2dyaWQuc3RhdGUuZ2V0KCdzZWxlY3Rpb24nKTtcclxuXHRcdGlmICghc2VsZWN0aW9uKSB7XHJcblx0XHRcdHNlbGVjdGlvbiA9IFtdO1xyXG5cdFx0XHR0aGlzLl9ncmlkLnN0YXRlLnNldCgnc2VsZWN0aW9uJywgc2VsZWN0aW9uKTtcclxuXHRcdH1cclxuXHRcdHNlbGVjdGlvbi5sZW5ndGggPSAwO1xyXG5cdFx0c2VsZWN0aW9uLnB1c2goe1xyXG5cdFx0XHRyOiByb3dJbmRleCxcclxuXHRcdFx0YzogY29sSW5kZXgsXHJcblx0XHRcdHc6IDEsXHJcblx0XHRcdGg6IDFcclxuXHRcdH0pO1xyXG5cclxuXHR9XHJcblxyXG59IiwiZXhwb3J0IGNsYXNzIFZpZXdVcGRhdGVyRXh0ZW5zaW9uIHtcclxuXHJcbiAgICBpbml0IChncmlkLCBjb25maWcpIHtcclxuXHRcdHRoaXMuX2dyaWQgPSBncmlkO1xyXG5cdFx0dGhpcy5fY29uZmlnID0gY29uZmlnO1xyXG5cdH1cclxuXHJcbiAgICBkYXRhRmluaXNoVXBkYXRlIChlKSB7XHJcbiAgICAgICAgbGV0IHJvd0luZGV4Q2FjaGUgPSB7fTtcclxuICAgICAgICBsZXQgY29sSW5kZXhDYWNoZSA9IHt9O1xyXG4gICAgICAgIGZvciAobGV0IGk9MDsgaTxlLnVwZGF0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IHtyb3dJZCwgZmllbGR9ID0gZS51cGRhdGVzW2ldO1xyXG4gICAgICAgICAgICBsZXQgcm93SW5kZXggPSBudWxsO1xyXG4gICAgICAgICAgICBsZXQgY29sSW5kZXggPSBudWxsO1xyXG4gICAgICAgICAgICBpZiAocm93SW5kZXhDYWNoZVtyb3dJZF0pIHtcclxuICAgICAgICAgICAgICAgIHJvd0luZGV4ID0gcm93SW5kZXhDYWNoZVtyb3dJZF07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByb3dJbmRleCA9IHRoaXMuX2dyaWQubW9kZWwuZ2V0Um93SW5kZXgocm93SWQpO1xyXG4gICAgICAgICAgICAgICAgcm93SW5kZXhDYWNoZVtyb3dJZF0gPSByb3dJbmRleDsgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGNvbEluZGV4Q2FjaGVbZmllbGRdKSB7XHJcbiAgICAgICAgICAgICAgICBjb2xJbmRleCA9IGNvbEluZGV4Q2FjaGVbZmllbGRdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29sSW5kZXggPSB0aGlzLl9ncmlkLm1vZGVsLmdldENvbHVtbkluZGV4KGZpZWxkKTtcclxuICAgICAgICAgICAgICAgIGNvbEluZGV4Q2FjaGVbcm93SWRdID0gY29sSW5kZXg7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9ICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuX2dyaWQudmlldy51cGRhdGVDZWxsKHJvd0luZGV4LCBjb2xJbmRleCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufSIsImV4cG9ydCBjbGFzcyBFdmVudERpc3BhdGNoZXIge1xyXG5cclxuXHRjb25zdHJ1Y3RvcigpIHtcclxuXHRcdHRoaXMuX2hhbmRsZXJzID0ge307XHJcblx0fVxyXG5cclxuXHRsaXN0ZW4oZXZlbnROYW1lLCBoYW5kbGVyKSB7XHJcblx0XHRpZiAoIXRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0pIHtcclxuXHRcdFx0dGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXSA9IFtdO1xyXG5cdFx0fVxyXG5cdFx0dGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXS5wdXNoKGhhbmRsZXIpO1xyXG5cdH1cclxuXHJcblx0dW5saXN0ZW4oZXZlbnROYW1lLCBoYW5kbGVyKSB7XHJcblx0XHRpZiAodGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXSkge1xyXG5cdFx0XHRsZXQgaW5kZXggPSB0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdLmluZGV4T2YoaGFuZGxlcik7XHJcblx0XHRcdGlmIChpbmRleCA+IC0xKSB7XHJcblx0XHRcdFx0dGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRoYXNMaXN0ZW5lcihldmVudE5hbWUpIHtcclxuXHRcdHJldHVybiB0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdICYmIHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0ubGVuZ3RoID4gMDtcclxuXHR9XHJcblxyXG5cdGRpc3BhdGNoKGV2ZW50TmFtZSwgZXZlbnRBcmcpIHtcclxuXHRcdGlmICh0aGlzLmhhc0xpc3RlbmVyKGV2ZW50TmFtZSkpIHtcclxuXHRcdFx0bGV0IGxpc3RlbmVycyA9IHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV07XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTxsaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRsaXN0ZW5lcnNbaV0oZXZlbnRBcmcpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxufSIsImV4cG9ydCBjbGFzcyBFeHRlbnNpb24ge1xyXG5cclxuXHRjb25zdHJ1Y3RvciAoZ3JpZCwgY29uZmlnKSB7XHJcblx0XHR0aGlzLl9ncmlkID0gZ3JpZDtcclxuXHRcdHRoaXMuX2NvbmZpZyA9IGNvbmZpZztcclxuXHJcblx0XHR0aGlzLl9leHRlbnNpb25zID0ge1xyXG5cdFx0XHRjZWxsUmVuZGVyOiBbXSxcclxuXHRcdFx0Y2VsbEFmdGVyUmVuZGVyOiBbXSxcclxuXHRcdFx0Y2VsbFVwZGF0ZTogW10sXHJcblx0XHRcdGNlbGxBZnRlclVwZGF0ZTogW10sXHJcblx0XHRcdGtleURvd246IFtdLFxyXG5cdFx0XHRncmlkQWZ0ZXJSZW5kZXI6IFtdLFxyXG5cdFx0XHRkYXRhQmVmb3JlUmVuZGVyOiBbXSxcclxuXHRcdFx0ZGF0YUJlZm9yZVVwZGF0ZTogW10sXHJcblx0XHRcdGRhdGFBZnRlclVwZGF0ZTogW10sXHJcblx0XHRcdGRhdGFGaW5pc2hVcGRhdGU6IFtdXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRsb2FkRXh0ZW5zaW9uIChleHQpIHtcclxuXHRcdGlmIChleHRbJ2luaXQnXSkge1xyXG5cdFx0XHRleHRbJ2luaXQnXSh0aGlzLl9ncmlkLCB0aGlzLl9jb25maWcpO1xyXG5cdFx0fVxyXG5cdFx0Zm9yIChsZXQgZXh0UG9pbnQgaW4gdGhpcy5fZXh0ZW5zaW9ucykge1xyXG5cdFx0XHRpZiAoZXh0W2V4dFBvaW50XSkge1xyXG5cdFx0XHRcdHRoaXMuX2V4dGVuc2lvbnNbZXh0UG9pbnRdLnB1c2goZXh0KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0aGFzRXh0ZW5zaW9uIChleHRQb2ludCkge1xyXG5cdFx0cmV0dXJuICh0aGlzLl9leHRlbnNpb25zW2V4dFBvaW50XSAmJiB0aGlzLl9leHRlbnNpb25zW2V4dFBvaW50XS5sZW5ndGggPiAwKVxyXG5cdH1cclxuXHJcblx0cXVlcnlFeHRlbnNpb24gKGV4dFBvaW50KSB7XHJcblx0XHRpZiAodGhpcy5fZXh0ZW5zaW9uc1tleHRQb2ludF0pIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2V4dGVuc2lvbnNbZXh0UG9pbnRdO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIFtdO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZXhlY3V0ZUV4dGVuc2lvbiAoZXh0UG9pbnQpIHtcclxuXHRcdHRoaXMucXVlcnlFeHRlbnNpb24oZXh0UG9pbnQpLmZvckVhY2goKGV4dCkgPT4ge1xyXG5cdFx0XHRleHRbZXh0UG9pbnRdLmFwcGx5KGV4dCwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG59IiwiaW1wb3J0IHsgVmlldyB9IGZyb20gJy4vdmlldyc7XHJcbmltcG9ydCB7IE1vZGVsIH0gZnJvbSAnLi9tb2RlbCc7XHJcbmltcG9ydCB7IERhdGFUYWJsZSB9IGZyb20gJy4uL2RhdGEvdGFibGUnO1xyXG5pbXBvcnQgeyBFeHRlbnNpb24gfSBmcm9tICcuL2V4dGVuc2lvbic7XHJcbmltcG9ydCB7IFN0YXRlIH0gZnJvbSAnLi9zdGF0ZSc7XHJcbmltcG9ydCB7IEV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJy4vZXZlbnQnO1xyXG5pbXBvcnQgeyBVdGlscyB9IGZyb20gJy4vdXRpbHMnO1xyXG5cclxuaW1wb3J0IHsgU2VsZWN0aW9uRXh0ZW5zaW9uIH0gZnJvbSAnLi4vZXh0ZW5zaW9ucy9zZWxlY3Rpb24nO1xyXG5pbXBvcnQgeyBFZGl0b3JFeHRlbnNpb24gfSBmcm9tICcuLi9leHRlbnNpb25zL2VkaXRvcic7XHJcbmltcG9ydCB7IENvcHlQYXN0ZUV4dGVuc2lvbiB9IGZyb20gJy4uL2V4dGVuc2lvbnMvY29weXBhc3RlJztcclxuaW1wb3J0IHsgVmlld1VwZGF0ZXJFeHRlbnNpb24gfSBmcm9tICcuLi9leHRlbnNpb25zL3ZpZXctdXBkYXRlcic7XHJcblxyXG5leHBvcnQgY2xhc3MgUEdyaWQgZXh0ZW5kcyBFdmVudERpc3BhdGNoZXIge1xyXG5cclxuXHRjb25zdHJ1Y3Rvcihjb25maWcpIHtcclxuXHRcdHN1cGVyKCk7XHJcblxyXG5cdFx0Ly9NZXJnZSBjb25maWcgd2l0aCBkZWZhdWx0IGNvbmZpZ1xyXG5cdFx0bGV0IGRlZmF1bHRDb25maWcgPSB7XHJcblx0XHRcdHJvd0NvdW50OiAwLFxyXG5cdFx0XHRoZWFkZXJSb3dDb3VudDogMSxcclxuXHRcdFx0Zm9vdGVyUm93Q291bnQ6IDAsXHJcblx0XHRcdGNvbHVtbkNvdW50OiAwLFxyXG5cdFx0XHRyb3dIZWlnaHQ6IDMyLFxyXG5cdFx0XHRjb2x1bW5XaWR0aDogMTAwXHJcblx0XHR9O1xyXG5cdFx0dGhpcy5fY29uZmlnID0gVXRpbHMubWl4aW4oY29uZmlnLCBkZWZhdWx0Q29uZmlnKTtcclxuXHJcblx0XHQvL0V4dGVuc2lvbnMgU3RvcmVcclxuXHRcdHRoaXMuX2V4dGVuc2lvbnMgPSBuZXcgRXh0ZW5zaW9uKHRoaXMsIHRoaXMuX2NvbmZpZyk7XHJcblxyXG5cdFx0dGhpcy5fZGF0YSA9IG5ldyBEYXRhVGFibGUodGhpcy5fY29uZmlnLmRhdGFNb2RlbCwgdGhpcy5fZXh0ZW5zaW9ucyk7XHJcblx0XHR0aGlzLl9tb2RlbCA9IG5ldyBNb2RlbCh0aGlzLl9jb25maWcsIHRoaXMuX2RhdGEpO1xyXG5cdFx0dGhpcy5fdmlldyA9IG5ldyBWaWV3KHRoaXMuX21vZGVsLCB0aGlzLl9leHRlbnNpb25zKTtcclxuXHRcdHRoaXMuX3N0YXRlID0gbmV3IFN0YXRlKCk7XHJcblxyXG5cdFx0Ly9Mb2FkIGRlZmF1bHQgZXh0ZW5zaW9uc1xyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5zZWxlY3Rpb24pIHtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5sb2FkRXh0ZW5zaW9uKG5ldyBTZWxlY3Rpb25FeHRlbnNpb24oKSk7XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmVkaXRpbmcpIHtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5sb2FkRXh0ZW5zaW9uKG5ldyBFZGl0b3JFeHRlbnNpb24oKSk7XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmNvcHlwYXN0ZSkge1xyXG5cdFx0XHR0aGlzLl9leHRlbnNpb25zLmxvYWRFeHRlbnNpb24obmV3IENvcHlQYXN0ZUV4dGVuc2lvbigpKTtcclxuXHRcdH1cclxuXHRcdGlmICh0aGlzLl9jb25maWcuYXV0b1VwZGF0ZSkge1xyXG5cdFx0XHR0aGlzLl9leHRlbnNpb25zLmxvYWRFeHRlbnNpb24obmV3IFZpZXdVcGRhdGVyRXh0ZW5zaW9uKCkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vTG9hZCBpbml0aWFsIGV4dGVybmFsIGV4dGVuc2lvbnNcclxuXHRcdGlmICh0aGlzLl9jb25maWcuZXh0ZW5zaW9ucyAmJiB0aGlzLl9jb25maWcuZXh0ZW5zaW9ucy5sZW5ndGggPiAwKSB7XHJcblx0XHRcdHRoaXMuX2NvbmZpZy5leHRlbnNpb25zLmZvckVhY2goKGV4dCkgPT4ge1xyXG5cdFx0XHRcdHRoaXMuX2V4dGVuc2lvbnMubG9hZEV4dGVuc2lvbihleHQpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldCB2aWV3KCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX3ZpZXc7XHJcblx0fVxyXG5cclxuXHRnZXQgbW9kZWwoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fbW9kZWw7XHJcblx0fVxyXG5cclxuXHRnZXQgZGF0YSgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9kYXRhO1xyXG5cdH1cclxuXHJcblx0Z2V0IGV4dGVuc2lvbigpIHtcclxuXHRcdHJldHVybiB0aGlzLl9leHRlbnNpb25zO1xyXG5cdH1cclxuXHJcblx0Z2V0IHN0YXRlICgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9zdGF0ZTtcclxuXHR9XHJcblxyXG5cdHJlbmRlcihlbGVtZW50KSB7XHJcblx0XHR0aGlzLl92aWV3LnJlbmRlcihlbGVtZW50KTtcclxuXHR9XHJcblxyXG59IiwiaW1wb3J0IHsgRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnLi9ldmVudCc7XHJcblxyXG5leHBvcnQgY2xhc3MgTW9kZWwgZXh0ZW5kcyBFdmVudERpc3BhdGNoZXIge1xyXG5cclxuXHRjb25zdHJ1Y3RvciAoY29uZmlnLCBkYXRhKSB7XHJcblx0XHRzdXBlcigpO1xyXG5cdFx0dGhpcy5fY29uZmlnID0gY29uZmlnO1xyXG5cdFx0dGhpcy5fZGF0YSA9IGRhdGE7XHJcblxyXG5cdFx0dGhpcy5fY29sdW1uTW9kZWwgPSBbXTtcclxuXHRcdHRoaXMuX3Jvd01vZGVsID0ge307XHJcblx0XHR0aGlzLl9oZWFkZXJSb3dNb2RlbCA9IHt9O1xyXG5cdFx0dGhpcy5fY2VsbE1vZGVsID0ge307XHJcblx0XHR0aGlzLl9oZWFkZXJDZWxsTW9kZWwgPSB7fTtcclxuXHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmhlYWRlclJvd3MpIHtcclxuXHRcdFx0Zm9yIChsZXQgaT0wOyBpPHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dzW2ldLmkgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0dGhpcy5faGVhZGVyUm93TW9kZWxbdGhpcy5fY29uZmlnLmhlYWRlclJvd3NbaV0uaV0gPSB0aGlzLl9jb25maWcuaGVhZGVyUm93c1tpXTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmICh0aGlzLl9jb25maWcuY29sdW1ucykge1xyXG5cdFx0XHRmb3IgKGxldCBpPTA7IGk8dGhpcy5fY29uZmlnLmNvbHVtbnMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRpZiAodGhpcy5fY29uZmlnLmNvbHVtbnNbaV0uaSAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHR0aGlzLl9jb2x1bW5Nb2RlbFt0aGlzLl9jb25maWcuY29sdW1uc1tpXS5pXSA9IHRoaXMuX2NvbmZpZy5jb2x1bW5zW2ldO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR0aGlzLl9jb2x1bW5Nb2RlbFtpXSA9IHRoaXMuX2NvbmZpZy5jb2x1bW5zW2ldO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5yb3dzKSB7XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTx0aGlzLl9jb25maWcucm93cy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdHRoaXMuX3Jvd01vZGVsW3RoaXMuX2NvbmZpZy5yb3dzW2ldLmldID0gdGhpcy5fY29uZmlnLnJvd3NbaV07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmICh0aGlzLl9jb25maWcuY2VsbHMpIHtcclxuXHRcdFx0Zm9yIChsZXQgaT0wOyBpPHRoaXMuX2NvbmZpZy5jZWxscy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdGxldCBtb2RlbCA9IHRoaXMuX2NvbmZpZy5jZWxsc1tpXTtcclxuXHRcdFx0XHRpZiAoIXRoaXMuX2NlbGxNb2RlbFttb2RlbC5jXSkge1xyXG5cdFx0XHRcdFx0dGhpcy5fY2VsbE1vZGVsW21vZGVsLmNdID0ge307XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMuX2NlbGxNb2RlbFttb2RlbC5jXVttb2RlbC5yXSA9IG1vZGVsO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmhlYWRlckNlbGxzKSB7XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTx0aGlzLl9jb25maWcuaGVhZGVyQ2VsbHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRsZXQgbW9kZWwgPSB0aGlzLl9jb25maWcuaGVhZGVyQ2VsbHNbaV07XHJcblx0XHRcdFx0aWYgKCF0aGlzLl9oZWFkZXJDZWxsTW9kZWxbbW9kZWwuY10pIHtcclxuXHRcdFx0XHRcdHRoaXMuX2hlYWRlckNlbGxNb2RlbFttb2RlbC5jXSA9IHt9O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLl9oZWFkZXJDZWxsTW9kZWxbbW9kZWwuY11bbW9kZWwucl0gPSBtb2RlbDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX2NhbGNUb3RhbFNpemUoKTtcclxuXHR9XHJcblxyXG5cdGNhbkVkaXQgKHJvd0luZGV4LCBjb2xJbmRleCkge1xyXG5cdFx0bGV0IHJvd01vZGVsID0gdGhpcy5nZXRSb3dNb2RlbChyb3dJbmRleCk7XHJcblx0XHRsZXQgY29sTW9kZWwgPSB0aGlzLmdldENvbHVtbk1vZGVsKGNvbEluZGV4KTtcclxuXHRcdGxldCBjZWxsTW9kZWwgPSB0aGlzLmdldENlbGxNb2RlbChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cclxuXHRcdGlmICgocm93TW9kZWwgJiYgcm93TW9kZWwuZWRpdGFibGUpIHx8XHJcblx0XHRcdChjb2xNb2RlbCAmJiBjb2xNb2RlbC5lZGl0YWJsZSkgfHxcclxuXHRcdFx0KGNlbGxNb2RlbCAmJiBjZWxsTW9kZWwuZWRpdGFibGUpKSB7XHJcblx0XHRcdGlmICgocm93TW9kZWwgJiYgcm93TW9kZWwuZWRpdGFibGUgPT09IGZhbHNlKSB8fFxyXG5cdFx0XHRcdChjb2xNb2RlbCAmJiBjb2xNb2RlbC5lZGl0YWJsZSA9PT0gZmFsc2UpIHx8XHJcblx0XHRcdFx0KGNlbGxNb2RlbCAmJiBjZWxsTW9kZWwuZWRpdGFibGUgPT09IGZhbHNlKSkge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBmYWxzZTtcdFxyXG59XHJcblxyXG5cdGlzSGVhZGVyUm93IChyb3dJbmRleCkge1xyXG5cdFx0cmV0dXJuIHJvd0luZGV4IDwgdGhpcy5fY29uZmlnLmhlYWRlclJvd0NvdW50O1xyXG5cdH1cclxuXHJcblx0Z2V0Q29sdW1uV2lkdGggKGNvbEluZGV4KSB7XHJcblx0XHRsZXQgY29sTW9kZWwgPSB0aGlzLl9jb2x1bW5Nb2RlbFtjb2xJbmRleF07XHJcblx0XHRpZiAoY29sTW9kZWwgJiYgY29sTW9kZWwud2lkdGggIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRyZXR1cm4gY29sTW9kZWwud2lkdGg7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLmNvbHVtbldpZHRoO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Z2V0Um93SGVpZ2h0IChyb3dJbmRleCkge1xyXG5cdFx0aWYgKHRoaXMuaXNIZWFkZXJSb3cocm93SW5kZXgpKSB7XHJcblxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Y29uc3QgZGF0YVJvd0luZGV4ID0gcm93SW5kZXggLSB0aGlzLl9jb25maWcuaGVhZGVyUm93Q291bnQ7XHJcblx0XHRcdGxldCByb3dNb2RlbCA9IHRoaXMuX3Jvd01vZGVsW2RhdGFSb3dJbmRleF07XHJcblx0XHRcdGlmIChyb3dNb2RlbCAmJiByb3dNb2RlbC5oZWlnaHQgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdHJldHVybiByb3dNb2RlbC5oZWlnaHQ7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX2NvbmZpZy5yb3dIZWlnaHQ7XHJcblx0XHRcdH1cdFxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Z2V0Q29sdW1uQ291bnQgKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2NvbmZpZy5jb2x1bW5zLmxlbmd0aDtcclxuXHR9XHJcblxyXG5cdGdldFJvd0NvdW50ICgpIHtcclxuXHRcdGxldCBoZWFkZXJSb3dDb3VudCA9IHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudDtcclxuXHRcdHJldHVybiBoZWFkZXJSb3dDb3VudCArIHRoaXMuX2RhdGEuZ2V0Um93Q291bnQoKTtcclxuXHR9XHJcblxyXG5cdGdldFRvcEZyZWV6ZVJvd3MgKCkge1xyXG5cdFx0bGV0IHRvcEZyZWV6ZSA9IDA7XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmhlYWRlclJvd0NvdW50ICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0dG9wRnJlZXplICs9IHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudDsgXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0b3BGcmVlemUgKz0gMTtcclxuXHRcdH1cclxuXHRcdGlmICh0aGlzLl9jb25maWcuZnJlZXplUGFuZSAmJiB0aGlzLl9jb25maWcuZnJlZXplUGFuZS50b3AgPiAwKSB7XHJcblx0XHRcdHRvcEZyZWV6ZSArPSB0aGlzLl9jb25maWcuZnJlZXplUGFuZS50b3A7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdG9wRnJlZXplO1xyXG5cdH1cclxuXHJcblx0Z2V0VG9wRnJlZXplU2l6ZSAoKSB7XHJcblx0XHRjb25zdCB0b3BGcmVlemVSb3cgPSB0aGlzLmdldFRvcEZyZWV6ZVJvd3MoKTsgXHJcblx0XHRsZXQgc3VtID0gMDtcclxuXHRcdGZvciAobGV0IGk9MDsgaTx0b3BGcmVlemVSb3c7IGkrKykge1xyXG5cdFx0XHRzdW0gKz0gdGhpcy5nZXRSb3dIZWlnaHQoaSk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gc3VtO1xyXG5cdH1cclxuXHJcblx0Z2V0TGVmdEZyZWV6ZVJvd3MgKCkge1xyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lICYmIHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lLmxlZnQgPiAwKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLl9jb25maWcuZnJlZXplUGFuZS5sZWZ0O1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIDA7XHJcblx0fVxyXG5cclxuXHRnZXRMZWZ0RnJlZXplU2l6ZSAoKSB7XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUgJiYgdGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUubGVmdCA+IDApIHtcclxuXHRcdFx0bGV0IHN1bSA9IDA7XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTx0aGlzLl9jb25maWcuZnJlZXplUGFuZS5sZWZ0OyBpKyspIHtcclxuXHRcdFx0XHRzdW0gKz0gdGhpcy5nZXRDb2x1bW5XaWR0aChpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gc3VtO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIDA7XHJcblx0fVxyXG5cclxuXHRnZXRCb3R0b21GcmVlemVSb3dzICgpIHtcclxuXHRcdGlmICh0aGlzLl9jb25maWcuZnJlZXplUGFuZSAmJiB0aGlzLl9jb25maWcuZnJlZXplUGFuZS5ib3R0b20gPiAwKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLl9jb25maWcuZnJlZXplUGFuZS5ib3R0b207XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gMDtcclxuXHR9XHJcblxyXG5cdGdldEJvdHRvbUZyZWV6ZVNpemUgKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2JvdHRvbUZyZWV6ZVNpemU7XHJcblx0fVxyXG5cclxuXHRnZXRDb2x1bW5XaWR0aCAoaW5kZXgpIHtcclxuXHRcdGlmICh0aGlzLl9jb2x1bW5Nb2RlbFtpbmRleF0gJiYgdGhpcy5fY29sdW1uTW9kZWxbaW5kZXhdLndpZHRoICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2NvbHVtbk1vZGVsW2luZGV4XS53aWR0aDtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzLl9jb25maWcuY29sdW1uV2lkdGg7XHJcblx0fVxyXG5cclxuXHRnZXRSb3dIZWlnaHQgKGluZGV4KSB7XHJcblx0XHRpZiAodGhpcy5fcm93TW9kZWxbaW5kZXhdICYmIHRoaXMuX3Jvd01vZGVsW2luZGV4XS5oZWlnaHQgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fcm93TW9kZWxbaW5kZXhdLmhlaWdodDtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzLl9jb25maWcucm93SGVpZ2h0O1xyXG5cdH1cclxuXHJcblx0Z2V0VG90YWxXaWR0aCAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fdG90YWxXaWR0aDtcclxuXHR9XHJcblxyXG5cdGdldFRvdGFsSGVpZ2h0ICgpIHtcclxuXHRcdHJldHVybiB0aGlzLl90b3RhbEhlaWdodDtcclxuXHR9XHJcblxyXG5cdGdldFJvd01vZGVsIChyb3dJbmRleCkge1xyXG5cdFx0aWYgKHRoaXMuaXNIZWFkZXJSb3cocm93SW5kZXgpKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLl9oZWFkZXJSb3dNb2RlbFtyb3dJbmRleF07XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjb25zdCBkYXRhUm93SW5kZXggPSByb3dJbmRleCAtIHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudDtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX3Jvd01vZGVsW2RhdGFSb3dJbmRleF07XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRnZXRDb2x1bW5Nb2RlbCAoY29sSW5kZXgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9jb2x1bW5Nb2RlbFtjb2xJbmRleF07XHJcblx0fVxyXG5cclxuXHRnZXRDZWxsTW9kZWwgKHJvd0luZGV4LCBjb2xJbmRleCkge1xyXG5cdFx0aWYgKHRoaXMuaXNIZWFkZXJSb3cocm93SW5kZXgpKSB7XHJcblx0XHRcdGlmICh0aGlzLl9oZWFkZXJDZWxsTW9kZWxbY29sSW5kZXhdKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX2hlYWRlckNlbGxNb2RlbFtjb2xJbmRleF1bcm93SW5kZXhdO1xyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjb25zdCBkYXRhUm93SW5kZXggPSByb3dJbmRleCAtIHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudDtcclxuXHRcdFx0aWYgKHRoaXMuX2NlbGxNb2RlbFtjb2xJbmRleF0pIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fY2VsbE1vZGVsW2NvbEluZGV4XVtkYXRhUm93SW5kZXhdO1xyXG5cdFx0XHR9XHRcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldENhc2NhZGVkQ2VsbFByb3AgKHJvd0luZGV4LCBjb2xJbmRleCwgcHJvcE5hbWUpIHtcclxuXHRcdGNvbnN0IGNlbGxNb2RlbCA9IHRoaXMuZ2V0Q2VsbE1vZGVsKHJvd0luZGV4LCBjb2xJbmRleCk7XHJcblx0XHRpZiAoY2VsbE1vZGVsICYmIGNlbGxNb2RlbFtwcm9wTmFtZV0pIHtcclxuXHRcdFx0cmV0dXJuIGNlbGxNb2RlbFtwcm9wTmFtZV07XHJcblx0XHR9XHJcblxyXG5cdFx0Y29uc3Qgcm93TW9kZWwgPSB0aGlzLmdldFJvd01vZGVsKHJvd0luZGV4KTtcclxuXHRcdGlmIChyb3dNb2RlbCAmJiByb3dNb2RlbFtwcm9wTmFtZV0pIHtcclxuXHRcdFx0cmV0dXJuIHJvd01vZGVsW3Byb3BOYW1lXTtcclxuXHRcdH1cclxuXHJcblx0XHRjb25zdCBjb2x1bW5Nb2RlbCA9IHRoaXMuZ2V0Q29sdW1uTW9kZWwoY29sSW5kZXgpO1xyXG5cdFx0aWYgKGNvbHVtbk1vZGVsICYmIGNvbHVtbk1vZGVsW3Byb3BOYW1lXSkge1xyXG5cdFx0XHRyZXR1cm4gY29sdW1uTW9kZWxbcHJvcE5hbWVdO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB1bmRlZmluZWQ7XHJcblx0fVxyXG5cclxuXHRnZXRDZWxsQ2xhc3NlcyAocm93SW5kZXgsIGNvbEluZGV4KSB7XHJcblx0XHRsZXQgb3V0cHV0ID0gW107XHJcblx0XHRjb25zdCBjb2xNb2RlbCA9IHRoaXMuZ2V0Q29sdW1uTW9kZWwoY29sSW5kZXgpO1xyXG5cdFx0aWYgKGNvbE1vZGVsKSB7XHJcblx0XHRcdGlmIChjb2xNb2RlbC5jc3NDbGFzcykge1xyXG5cdFx0XHRcdG91dHB1dC51bnNoaWZ0KGNvbE1vZGVsLmNzc0NsYXNzKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGNvbnN0IGlzSGVhZGVyID0gdGhpcy5pc0hlYWRlclJvdyhyb3dJbmRleCk7XHJcblx0XHRjb25zdCByb3dNb2RlbCA9IHRoaXMuZ2V0Um93TW9kZWwocm93SW5kZXgpO1xyXG5cdFx0aWYgKHJvd01vZGVsKSB7XHJcblx0XHRcdGlmIChpc0hlYWRlcikge1xyXG5cdFx0XHRcdG91dHB1dC51bnNoaWZ0KCdwZ3JpZC1yb3ctaGVhZGVyJyk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHJvd01vZGVsLmNzc0NsYXNzKSB7XHJcblx0XHRcdFx0b3V0cHV0LnVuc2hpZnQocm93TW9kZWwuY3NzQ2xhc3MpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0Y29uc3QgY2VsbE1vZGVsID0gdGhpcy5nZXRDZWxsTW9kZWwocm93SW5kZXgsIGNvbEluZGV4KTtcclxuXHRcdGlmIChjZWxsTW9kZWwpIHtcclxuXHRcdFx0aWYgKGNlbGxNb2RlbC5jc3NDbGFzcykge1xyXG5cdFx0XHRcdG91dHB1dC51bnNoaWZ0KGNlbGxNb2RlbC5jc3NDbGFzcyk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiBvdXRwdXQ7XHJcblx0fVxyXG5cclxuXHRkZXRlcm1pbmVTY3JvbGxiYXJTdGF0ZSAodmlld1dpZHRoLCB2aWV3SGVpZ2h0LCBzY3JvbGxiYXJTaXplKSB7XHJcblx0XHRsZXQgbmVlZEggPSB0aGlzLl90b3RhbFdpZHRoID4gdmlld1dpZHRoO1xyXG5cdFx0bGV0IG5lZWRWID0gdGhpcy5fdG90YWxIZWlnaHQgPiB2aWV3SGVpZ2h0O1xyXG5cclxuXHRcdGlmIChuZWVkSCAmJiAhbmVlZFYpIHtcclxuXHRcdFx0bmVlZFYgPSB0aGlzLl90b3RhbEhlaWdodCA+ICh2aWV3SGVpZ2h0IC0gc2Nyb2xsYmFyU2l6ZSk7XHJcblx0XHR9IGVsc2VcclxuXHRcdGlmICghbmVlZEggJiYgbmVlZFYpIHtcclxuXHRcdFx0bmVlZEggPSB0aGlzLl90b3RhbFdpZHRoID4gKHZpZXdXaWR0aCAtIHNjcm9sbGJhclNpemUpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChuZWVkSCAmJiBuZWVkVikge1xyXG5cdFx0XHRyZXR1cm4gJ2InO1xyXG5cdFx0fSBlbHNlXHJcblx0XHRpZiAoIW5lZWRIICYmIG5lZWRWKSB7XHJcblx0XHRcdHJldHVybiAndic7XHJcblx0XHR9IGVsc2VcclxuXHRcdGlmIChuZWVkSCAmJiAhbmVlZFYpIHtcclxuXHRcdFx0cmV0dXJuICdoJztcclxuXHRcdH1cclxuXHRcdHJldHVybiAnbic7XHJcblx0fVxyXG5cclxuXHRnZXREYXRhQXQgKHJvd0luZGV4LCBjb2xJbmRleCkge1xyXG5cdFx0aWYgKHRoaXMuaXNIZWFkZXJSb3cocm93SW5kZXgpKSB7XHJcblx0XHRcdGNvbnN0IGNvbE1vZGVsID0gdGhpcy5nZXRDb2x1bW5Nb2RlbChjb2xJbmRleCk7XHJcblx0XHRcdGlmIChjb2xNb2RlbCAmJiBjb2xNb2RlbC50aXRsZSkge1xyXG5cdFx0XHRcdHJldHVybiBjb2xNb2RlbC50aXRsZTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjb25zdCBkYXRhUm93SW5kZXggPSByb3dJbmRleCAtIHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudDtcclxuXHRcdFx0Y29uc3QgY29sTW9kZWwgPSB0aGlzLmdldENvbHVtbk1vZGVsKGNvbEluZGV4KTtcclxuXHRcdFx0aWYgKGNvbE1vZGVsICYmIGNvbE1vZGVsLmZpZWxkKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX2RhdGEuZ2V0RGF0YUF0KGRhdGFSb3dJbmRleCwgY29sTW9kZWwuZmllbGQpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XHJcblx0XHRcdH1cdFxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0c2V0RGF0YUF0IChyb3dJbmRleCwgY29sSW5kZXgsIGRhdGEpIHtcclxuXHRcdGNvbnN0IGRhdGFSb3dJbmRleCA9IHJvd0luZGV4IC0gdGhpcy5fY29uZmlnLmhlYWRlclJvd0NvdW50O1xyXG5cdFx0Y29uc3QgY29sTW9kZWwgPSB0aGlzLmdldENvbHVtbk1vZGVsKGNvbEluZGV4KTtcclxuXHRcdGlmIChjb2xNb2RlbCAmJiBjb2xNb2RlbC5maWVsZCkge1xyXG5cdFx0XHR0aGlzLl9kYXRhLnNldERhdGFBdChkYXRhUm93SW5kZXgsIGNvbE1vZGVsLmZpZWxkLCBkYXRhKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldFJvd0luZGV4IChyb3dJZCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2NvbmZpZy5oZWFkZXJSb3dDb3VudCArIHRoaXMuX2RhdGEuZ2V0Um93SW5kZXgocm93SWQpO1xyXG5cdH1cclxuXHJcblx0Z2V0Um93SWQgKHJvd0luZGV4KSB7XHJcblx0XHRpZiAocm93SW5kZXggPj0gdGhpcy5fY29uZmlnLmhlYWRlclJvd0NvdW50KSB7XHJcblx0XHRcdHJldHVybiB0aGlzLl9kYXRhLmdldFJvd0lkKHJvd0luZGV4IC0gdGhpcy5fY29uZmlnLmhlYWRlclJvd0NvdW50KTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Z2V0Q29sdW1uSW5kZXggKGZpZWxkKSB7XHJcblx0XHRmb3IgKGxldCBpPTA7IGk8dGhpcy5fY29uZmlnLmNvbHVtbnMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0aWYgKHRoaXMuX2NvbmZpZy5jb2x1bW5zW2ldLmZpZWxkID09PSBmaWVsZCkge1xyXG5cdFx0XHRcdHJldHVybiBpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gLTE7XHJcblx0fVxyXG5cclxuXHRnZXRDb2x1bW5GaWVsZCAoY29sSW5kZXgpIHtcclxuXHRcdGlmICh0aGlzLl9jb25maWcuY29sdW1uc1tjb2xJbmRleF0pIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2NvbmZpZy5jb2x1bW5zW2NvbEluZGV4XS5maWVsZDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdF9jYWxjVG90YWxTaXplKCkge1xyXG5cdFx0dGhpcy5fY2FsY1RvdGFsV2lkdGgoKTtcclxuXHRcdHRoaXMuX2NhbGNUb3RhbEhlaWdodCgpO1xyXG5cdFx0dGhpcy5fY2FsY0JvdHRvbUZyZWV6ZVNpemUoKTtcclxuXHR9XHJcblxyXG5cdF9jYWxjVG90YWxXaWR0aCAoKSB7XHJcblx0XHR0aGlzLl90b3RhbFdpZHRoID0gMDtcclxuXHRcdGZvciAobGV0IGk9MDsgaTx0aGlzLl9jb2x1bW5Nb2RlbC5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRpZiAodGhpcy5fY29sdW1uTW9kZWxbaV0ud2lkdGggIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdHRoaXMuX3RvdGFsV2lkdGggKz0gdGhpcy5fY29sdW1uTW9kZWxbaV0ud2lkdGg7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5fdG90YWxXaWR0aCArPSB0aGlzLl9jb25maWcuY29sdW1uV2lkdGg7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdF9jYWxjVG90YWxIZWlnaHQgKCkge1xyXG5cdFx0bGV0IGhlYWRlclJvd01vZGVsQ291bnQgPSBPYmplY3Qua2V5cyh0aGlzLl9oZWFkZXJSb3dNb2RlbCk7XHJcblx0XHR0aGlzLl90b3RhbEhlaWdodCA9IHRoaXMuX2NvbmZpZy5yb3dIZWlnaHQgKiAodGhpcy5fY29uZmlnLmhlYWRlclJvd0NvdW50IC0gaGVhZGVyUm93TW9kZWxDb3VudC5sZW5ndGgpO1xyXG5cdFx0Zm9yIChsZXQgaW5kZXggaW4gdGhpcy5faGVhZGVyUm93TW9kZWwpIHtcclxuXHRcdFx0aWYgKHRoaXMuX2hlYWRlclJvd01vZGVsW2luZGV4XS5oZWlnaHQgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdHRoaXMuX3RvdGFsSGVpZ2h0ICs9IHRoaXMuX2hlYWRlclJvd01vZGVsW2luZGV4XS5oZWlnaHQ7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5fdG90YWxIZWlnaHQgKz0gdGhpcy5fY29uZmlnLnJvd0hlaWdodDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGxldCByb3dNb2RlbENvdW50ID0gT2JqZWN0LmtleXModGhpcy5fcm93TW9kZWwpO1xyXG5cdFx0dGhpcy5fdG90YWxIZWlnaHQgKz0gdGhpcy5fY29uZmlnLnJvd0hlaWdodCAqICh0aGlzLl9kYXRhLmdldFJvd0NvdW50KCkgLSByb3dNb2RlbENvdW50Lmxlbmd0aCk7XHJcblx0XHRmb3IgKGxldCBpbmRleCBpbiB0aGlzLl9yb3dNb2RlbCkge1xyXG5cdFx0XHRpZiAodGhpcy5fcm93TW9kZWxbaW5kZXhdLmhlaWdodCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0dGhpcy5fdG90YWxIZWlnaHQgKz0gdGhpcy5fcm93TW9kZWxbaW5kZXhdLmhlaWdodDtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLl90b3RhbEhlaWdodCArPSB0aGlzLl9jb25maWcucm93SGVpZ2h0O1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRfY2FsY0JvdHRvbUZyZWV6ZVNpemUgKCkge1xyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lICYmIHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lLmJvdHRvbSA+IDApIHtcclxuXHRcdFx0bGV0IHN1bSA9IDA7XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTx0aGlzLl9jb25maWcuZnJlZXplUGFuZS5ib3R0b207IGkrKykge1xyXG5cdFx0XHRcdHN1bSArPSB0aGlzLmdldFJvd0hlaWdodCgodGhpcy5fY29uZmlnLnJvd0NvdW50LTEpLWkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRoaXMuX2JvdHRvbUZyZWV6ZVNpemUgPSBzdW07XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0aGlzLl9ib3R0b21GcmVlemVTaXplID0gMDtcclxuXHRcdH1cclxuXHR9XHJcbn0iLCJleHBvcnQgY2xhc3MgU3RhdGUge1xyXG5cclxuXHRjb25zdHJ1Y3RvciAoKSB7XHJcblx0XHR0aGlzLl9zdGF0ZSA9IHt9O1xyXG5cdH1cclxuXHJcblx0ZXhpc3RzIChrZXkpIHtcclxuXHRcdHJldHVybiAodGhpcy5fc3RhdGVba2V5XSAhPT0gdW5kZWZpbmVkKTtcclxuXHR9XHJcblxyXG5cdGdldCAoa2V5KSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fc3RhdGVba2V5XTtcclxuXHR9XHJcblxyXG5cdHNldCAoa2V5LCB2YWx1ZSkge1xyXG5cdFx0dGhpcy5fc3RhdGVba2V5XSA9IHZhbHVlO1xyXG5cdH1cclxuXHRcclxufSIsImV4cG9ydCBjbGFzcyBVdGlscyB7XHJcblxyXG5cdHN0YXRpYyBtaXhpbihzb3VyY2UsIHRhcmdldCkge1xyXG5cdFx0Zm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcclxuXHRcdFx0aWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xyXG5cdFx0XHRcdHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRhcmdldDtcclxuXHR9XHJcbn0iLCJpbXBvcnQgeyBFdmVudERpc3BhdGNoZXIgfSBmcm9tICcuL2V2ZW50JztcclxuaW1wb3J0IFJlc2l6ZU9ic2VydmVyIGZyb20gJ3Jlc2l6ZS1vYnNlcnZlci1wb2x5ZmlsbCc7XHJcblxyXG5leHBvcnQgY2xhc3MgVmlldyBleHRlbmRzIEV2ZW50RGlzcGF0Y2hlciB7XHJcblxyXG5cdGNvbnN0cnVjdG9yIChtb2RlbCwgZXh0ZW5zaW9ucykge1xyXG5cdFx0c3VwZXIoKTtcclxuXHRcdHRoaXMuX21vZGVsID0gbW9kZWw7XHJcblx0XHR0aGlzLl9leHRlbnNpb25zID0gZXh0ZW5zaW9ucztcclxuXHRcdHRoaXMuX3RlbXBsYXRlID0gXHQnPGRpdiBjbGFzcz1cInBncmlkLWNvbnRlbnQtcGFuZVwiIHN0eWxlPVwicG9zaXRpb246IHJlbGF0aXZlO1wiPicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDxkaXYgY2xhc3M9XCJwZ3JpZC10b3AtbGVmdC1wYW5lXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XCI+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0XHQ8ZGl2IGNsYXNzPVwicGdyaWQtdG9wLWxlZnQtaW5uZXJcIiBzdHlsZT1cIndpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7IG92ZXJmbG93OiBoaWRkZW47IHBvc2l0aW9uOiByZWxhdGl2ZTtcIj48L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHQ8L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHQ8ZGl2IGNsYXNzPVwicGdyaWQtdG9wLXBhbmVcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcIj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHRcdDxkaXYgY2xhc3M9XCJwZ3JpZC10b3AtaW5uZXJcIiBzdHlsZT1cIndpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7IG92ZXJmbG93OiBoaWRkZW47IHBvc2l0aW9uOiByZWxhdGl2ZTtcIj48L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHQ8L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHQ8ZGl2IGNsYXNzPVwicGdyaWQtbGVmdC1wYW5lXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XCI+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0XHQ8ZGl2IGNsYXNzPVwicGdyaWQtbGVmdC1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgb3ZlcmZsb3c6IGhpZGRlbjsgcG9zaXRpb246IHJlbGF0aXZlO1wiPjwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDxkaXYgY2xhc3M9XCJwZ3JpZC1jZW50ZXItcGFuZVwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1wiPicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdFx0PGRpdiBjbGFzcz1cInBncmlkLWNlbnRlci1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgb3ZlcmZsb3c6IGhpZGRlbjsgcG9zaXRpb246IHJlbGF0aXZlO1wiPjwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDxkaXYgY2xhc3M9XCJwZ3JpZC1ib3R0b20tbGVmdC1wYW5lXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XCI+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0XHQ8ZGl2IGNsYXNzPVwicGdyaWQtYm90dG9tLWxlZnQtaW5uZXJcIiBzdHlsZT1cIndpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7IG92ZXJmbG93OiBoaWRkZW47IHBvc2l0aW9uOiByZWxhdGl2ZTtcIj48L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHQ8L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHQ8ZGl2IGNsYXNzPVwicGdyaWQtYm90dG9tLXBhbmVcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcIj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHRcdDxkaXYgY2xhc3M9XCJwZ3JpZC1ib3R0b20taW5uZXJcIiBzdHlsZT1cIndpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7IG92ZXJmbG93OiBoaWRkZW47IHBvc2l0aW9uOiByZWxhdGl2ZTtcIj48L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHQ8L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnPC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJwZ3JpZC1oc2Nyb2xsXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7IGJvdHRvbTogMHB4OyBvdmVyZmxvdy15OiBoaWRkZW47IG92ZXJmbG93LXg6IHNjcm9sbDtcIj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHQ8ZGl2IGNsYXNzPVwicGdyaWQtaHNjcm9sbC10aHVtYlwiPjwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCc8L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cInBncmlkLXZzY3JvbGxcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTsgcmlnaHQ6IDBweDsgdG9wOiAwcHg7IG92ZXJmbG93LXk6IHNjcm9sbDsgb3ZlcmZsb3cteDogaGlkZGVuO1wiPicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDxkaXYgY2xhc3M9XCJwZ3JpZC12c2Nyb2xsLXRodW1iXCI+PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0JzwvZGl2Pic7XHJcblx0fVxyXG5cclxuXHRyZW5kZXIgKGVsZW1lbnQpIHtcclxuXHRcdHRoaXMuX2VsZW1lbnQgPSBlbGVtZW50O1xyXG5cdFx0dGhpcy5fZWxlbWVudC5jbGFzc05hbWUgPSAncGdyaWQnO1xyXG5cdFx0dGhpcy5fZWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLl90ZW1wbGF0ZTtcclxuXHRcdHRoaXMuX2VsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xyXG5cdFx0dGhpcy5fZWxlbWVudC5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xyXG5cdFx0dGhpcy5fZWxlbWVudC50YWJJbmRleCA9IDE7XHJcblxyXG5cdFx0dGhpcy5fY29udGVudFBhbmUgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1jb250ZW50LXBhbmUnKTtcclxuXHRcdHRoaXMuX3RvcExlZnRQYW5lID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtdG9wLWxlZnQtcGFuZScpO1xyXG5cdFx0dGhpcy5fdG9wTGVmdElubmVyID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtdG9wLWxlZnQtaW5uZXInKTtcclxuXHRcdHRoaXMuX3RvcFBhbmUgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC10b3AtcGFuZScpO1xyXG5cdFx0dGhpcy5fdG9wSW5uZXIgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC10b3AtaW5uZXInKTtcclxuXHRcdHRoaXMuX2xlZnRQYW5lID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtbGVmdC1wYW5lJyk7XHJcblx0XHR0aGlzLl9sZWZ0SW5uZXIgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1sZWZ0LWlubmVyJyk7XHJcblx0XHR0aGlzLl9jZW50ZXJQYW5lID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtY2VudGVyLXBhbmUnKTtcclxuXHRcdHRoaXMuX2NlbnRlcklubmVyID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtY2VudGVyLWlubmVyJyk7XHJcblx0XHR0aGlzLl9ib3R0b21QYW5lID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtYm90dG9tLXBhbmUnKTtcclxuXHRcdHRoaXMuX2JvdHRvbUlubmVyID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtYm90dG9tLWlubmVyJyk7XHJcblx0XHR0aGlzLl9ib3R0b21MZWZ0UGFuZSA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLWJvdHRvbS1sZWZ0LXBhbmUnKTtcclxuXHRcdHRoaXMuX2JvdHRvbUxlZnRJbm5lciA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLWJvdHRvbS1sZWZ0LWlubmVyJyk7XHJcblxyXG5cdFx0dGhpcy5fc2Nyb2xsV2lkdGggPSB0aGlzLl9tZWFzdXJlU2Nyb2xsYmFyV2lkdGgoKTtcclxuXHJcblx0XHR0aGlzLl9oU2Nyb2xsID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtaHNjcm9sbCcpO1xyXG5cdFx0dGhpcy5fdlNjcm9sbCA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLXZzY3JvbGwnKTtcclxuXHRcdHRoaXMuX2hTY3JvbGxUaHVtYiA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLWhzY3JvbGwtdGh1bWInKTtcclxuXHRcdHRoaXMuX3ZTY3JvbGxUaHVtYiA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLXZzY3JvbGwtdGh1bWInKTtcclxuXHRcdHRoaXMuX2hTY3JvbGwuc3R5bGUuaGVpZ2h0ID0gdGhpcy5fc2Nyb2xsV2lkdGggKyAncHgnO1xyXG5cdFx0dGhpcy5fdlNjcm9sbC5zdHlsZS53aWR0aCA9IHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4JztcclxuXHRcdHRoaXMuX2hTY3JvbGxUaHVtYi5zdHlsZS5oZWlnaHQgPSB0aGlzLl9zY3JvbGxXaWR0aCArICdweCc7XHJcblx0XHR0aGlzLl92U2Nyb2xsVGh1bWIuc3R5bGUud2lkdGggPSB0aGlzLl9zY3JvbGxXaWR0aCArICdweCc7XHJcblxyXG5cdFx0dGhpcy5fb2JzZXJ2ZVNpemUoKTtcclxuXHRcdHRoaXMuX3Jlc3R1cmVjdHVyZSgpO1xyXG5cdFx0dGhpcy5fYXR0YWNoSGFuZGxlcnMoKTtcclxuXHJcblx0XHR0aGlzLl9leHRlbnNpb25zLmV4ZWN1dGVFeHRlbnNpb24oJ2dyaWRBZnRlclJlbmRlcicsIHtcclxuXHRcdFx0Z3JpZDogdGhpc1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRyZVJlbmRlciAoKSB7XHJcblx0XHR0aGlzLl90b3BMZWZ0SW5uZXIuaW5uZXJIVE1MID0gJyc7XHJcblx0XHR0aGlzLl90b3BJbm5lci5pbm5lckhUTUwgPSAnJztcclxuXHRcdHRoaXMuX2xlZnRJbm5lci5pbm5lckhUTUwgPSAnJztcclxuXHRcdHRoaXMuX2NlbnRlcklubmVyLmlubmVySFRNTCA9ICcnO1xyXG5cdFx0dGhpcy5fYm90dG9tTGVmdElubmVyLmlubmVySFRNTCA9ICcnO1xyXG5cdFx0dGhpcy5fYm90dG9tSW5uZXIuaW5uZXJIVE1MID0gJyc7XHJcblxyXG5cdFx0dGhpcy5fcmVzdHVyZWN0dXJlKCk7XHJcblx0fVxyXG5cclxuXHRnZXRFbGVtZW50ICgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9lbGVtZW50O1xyXG5cdH1cclxuXHJcblx0c2V0U2Nyb2xsWCAoeCwgYWRqdXN0U2Nyb2xsQmFyKSB7XHJcblx0XHR0aGlzLl90b3BJbm5lci5zY3JvbGxMZWZ0ID0geDtcclxuXHRcdHRoaXMuX2NlbnRlcklubmVyLnNjcm9sbExlZnQgPSB4O1xyXG5cdFx0dGhpcy5fYm90dG9tSW5uZXIuc2Nyb2xsTGVmdCA9IHg7XHJcblx0XHRpZiAoYWRqdXN0U2Nyb2xsQmFyIHx8IGFkanVzdFNjcm9sbEJhciA9PT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdHRoaXMuX2hTY3JvbGwuc2Nyb2xsTGVmdCA9IHg7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRnZXRTY3JvbGxYICgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9jZW50ZXJJbm5lci5zY3JvbGxMZWZ0O1xyXG5cdH1cclxuXHJcblx0c2V0U2Nyb2xsWSAoeSwgYWRqdXN0U2Nyb2xsQmFyKSB7XHJcblx0XHR0aGlzLl9jZW50ZXJJbm5lci5zY3JvbGxUb3AgPSB5O1xyXG5cdFx0dGhpcy5fbGVmdElubmVyLnNjcm9sbFRvcCA9IHk7XHJcblx0XHRpZiAoYWRqdXN0U2Nyb2xsQmFyIHx8IGFkanVzdFNjcm9sbEJhciA9PT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdHRoaXMuX3ZTY3JvbGwuc2Nyb2xsVG9wID0geTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldFNjcm9sbFkgKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2NlbnRlcklubmVyLnNjcm9sbFRvcDtcclxuXHR9XHJcblxyXG5cdHNjcm9sbFRvQ2VsbCAocm93SW5kZXgsIGNvbEluZGV4LCBhbGlnblRvcCkge1xyXG5cdFx0bGV0IGNlbGwgPSB0aGlzLmdldENlbGwocm93SW5kZXgsIGNvbEluZGV4KTtcclxuXHRcdGxldCBvcmlnU2Nyb2xsVG9wID0gY2VsbC5wYXJlbnRFbGVtZW50LnNjcm9sbFRvcDtcclxuXHRcdGxldCBvcmlnU2Nyb2xsTGVmdCA9IGNlbGwucGFyZW50RWxlbWVudC5zY3JvbGxMZWZ0O1xyXG5cclxuXHRcdGNlbGwuc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZChmYWxzZSk7XHJcblxyXG5cdFx0aWYgKG9yaWdTY3JvbGxUb3AgIT09IGNlbGwucGFyZW50RWxlbWVudC5zY3JvbGxUb3ApIHtcclxuXHRcdFx0dGhpcy5zZXRTY3JvbGxZKGNlbGwucGFyZW50RWxlbWVudC5zY3JvbGxUb3AsIHRydWUpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKG9yaWdTY3JvbGxMZWZ0ICE9PSBjZWxsLnBhcmVudEVsZW1lbnQuc2Nyb2xsTGVmdCkge1xyXG5cdFx0XHR0aGlzLnNldFNjcm9sbFgoY2VsbC5wYXJlbnRFbGVtZW50LnNjcm9sbExlZnQsIHRydWUpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Z2V0Q2VsbCAocm93SW5kZXgsIGNvbEluZGV4KSB7XHJcblx0XHRsZXQgY2VsbCA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtcm93LWluZGV4PVwiJytyb3dJbmRleCsnXCJdW2RhdGEtY29sLWluZGV4PVwiJytjb2xJbmRleCsnXCJdJyk7XHJcblx0XHRyZXR1cm4gY2VsbDtcclxuXHR9XHJcblxyXG5cdHVwZGF0ZUNlbGwgKHJvd0luZGV4LCBjb2xJbmRleCkge1xyXG5cdFx0bGV0IGNlbGwgPSB0aGlzLmdldENlbGwocm93SW5kZXgsIGNvbEluZGV4KTtcclxuXHRcdGlmIChjZWxsKSB7XHJcblx0XHRcdC8vQ3JlYXRlIGNlbGwgY29udGVudCB3cmFwcGVyIGlmIG5vdCBhbnlcclxuXHRcdFx0bGV0IGNlbGxDb250ZW50ID0gbnVsbDtcclxuXHRcdFx0aWYgKCFjZWxsLmZpcnN0Q2hpbGQgfHwgIWNlbGwuZmlyc3RDaGlsZC5jbGFzc0xpc3QuY29udGFpbnMoJ3BncmlkLWNlbGwtY29udGVudCcpKSB7XHJcblx0XHRcdFx0Ly9DbGVhciBjZWxsXHJcblx0XHRcdFx0Y2VsbC5pbm5lckhUTUwgPSAnJztcclxuXHJcblx0XHRcdFx0Ly9BZGQgbmV3IGNlbGwgY29udGVudFxyXG5cdFx0XHRcdGNlbGxDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRcdFx0Y2VsbENvbnRlbnQuY2xhc3NOYW1lID0gJ3BncmlkLWNlbGwtY29udGVudCc7XHJcblx0XHRcdFx0Y2VsbC5hcHBlbmRDaGlsZChjZWxsQ29udGVudCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0Y2VsbENvbnRlbnQgPSBjZWxsLmZpcnN0Q2hpbGQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vR2V0IGRhdGEgdG8gYmUgdXBkYXRlZFxyXG5cdFx0XHRsZXQgZGF0YSA9IHRoaXMuX21vZGVsLmdldERhdGFBdChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cclxuXHRcdFx0Ly9EYXRhIGNhbiBiZSB0cmFuc2Zvcm1lZCBiZWZvcmUgcmVuZGVyaW5nIHVzaW5nIGRhdGFCZWZvcmVSZW5kZXIgZXh0ZW5zaW9uXHJcblx0XHRcdGxldCBhcmcgPSB7ZGF0YTogZGF0YX07XHJcblx0XHRcdHRoaXMuX2V4dGVuc2lvbnMuZXhlY3V0ZUV4dGVuc2lvbignZGF0YUJlZm9yZVJlbmRlcicsIGFyZyk7XHJcblx0XHRcdGRhdGEgPSBhcmcuZGF0YTtcclxuXHJcblx0XHRcdC8vSWYgdGhlcmUncyBjZWxsVXBkYXRlIGV4dGVuc2lvbiwgdGhlbiBleGVjdXRlIGl0IHRvIHVwZGF0ZSB0aGUgY2VsbCBkYXRhXHJcblx0XHRcdC8vRWxzZSB1c2UgZGVmYXVsdCB3YXkgdG8gcHV0IHRoZSBkYXRhIGRpcmVjdGx5IHRvIHRoZSBjZWxsIGNvbnRlbnRcclxuXHRcdFx0bGV0IGhhbmRsZWRCeUV4dCA9IGZhbHNlO1xyXG5cdFx0XHRpZiAodGhpcy5fZXh0ZW5zaW9ucy5oYXNFeHRlbnNpb24oJ2NlbGxVcGRhdGUnKSkge1xyXG5cdFx0XHRcdGFyZyA9IHtcclxuXHRcdFx0XHRcdGRhdGEsXHJcblx0XHRcdFx0XHRjZWxsLFxyXG5cdFx0XHRcdFx0Y2VsbENvbnRlbnQsXHJcblx0XHRcdFx0XHRyb3dJbmRleCxcclxuXHRcdFx0XHRcdGNvbEluZGV4LFxyXG5cdFx0XHRcdFx0cm93SWQ6IHRoaXMuX21vZGVsLmdldFJvd0lkKHJvd0luZGV4KSxcclxuXHRcdFx0XHRcdGZpZWxkOiB0aGlzLl9tb2RlbC5nZXRDb2x1bW5GaWVsZChjb2xJbmRleCksXHJcblx0XHRcdFx0XHRoYW5kbGVkOiBmYWxzZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLl9leHRlbnNpb25zLmV4ZWN1dGVFeHRlbnNpb24oJ2NlbGxVcGRhdGUnLCBhcmcpO1xyXG5cdFx0XHRcdGhhbmRsZWRCeUV4dCA9IGFyZy5oYW5kbGVkO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoIWhhbmRsZWRCeUV4dCkge1xyXG5cdFx0XHRcdGlmIChkYXRhICE9PSB1bmRlZmluZWQgJiYgZGF0YSAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0Y2VsbENvbnRlbnQuaW5uZXJIVE1MID0gZGF0YTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0Y2VsbENvbnRlbnQuaW5uZXJIVE1MID0gJyc7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLl9leHRlbnNpb25zLmV4ZWN1dGVFeHRlbnNpb24oJ2NlbGxBZnRlclVwZGF0ZScsIHtcclxuXHRcdFx0XHRjZWxsOiBjZWxsLFxyXG5cdFx0XHRcdHJvd0luZGV4OiByb3dJbmRleCxcclxuXHRcdFx0XHRjb2xJbmRleDogY29sSW5kZXgsXHJcblx0XHRcdFx0ZGF0YTogZGF0YVxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdF9hdHRhY2hIYW5kbGVycyAoKSB7XHJcblxyXG5cdFx0dGhpcy5fdlNjcm9sbEhhbmRsZXIgPSAoZSkgPT4ge1xyXG5cdFx0XHR0aGlzLnNldFNjcm9sbFkoZS50YXJnZXQuc2Nyb2xsVG9wLCBmYWxzZSk7XHJcblx0XHRcdHRoaXMuZGlzcGF0Y2goJ3ZzY3JvbGwnLCBlKTtcclxuXHRcdH07XHJcblxyXG5cdFx0dGhpcy5faFNjcm9sbEhhbmRsZXIgPSAoZSkgPT4ge1xyXG5cdFx0XHR0aGlzLnNldFNjcm9sbFgoZS50YXJnZXQuc2Nyb2xsTGVmdCwgZmFsc2UpO1xyXG5cdFx0XHR0aGlzLmRpc3BhdGNoKCdoc2Nyb2xsJywgZSk7XHJcblx0XHR9O1xyXG5cclxuXHRcdHRoaXMuX3doZWVsSGFuZGxlciA9IChlKSA9PiB7XHJcblx0XHRcdGxldCBjdXJyZW50WCA9IHRoaXMuZ2V0U2Nyb2xsWCgpO1xyXG5cdFx0XHRsZXQgY3VycmVudFkgPSB0aGlzLmdldFNjcm9sbFkoKTtcclxuXHRcdFx0dGhpcy5zZXRTY3JvbGxYKGN1cnJlbnRYICsgZS5kZWx0YVgpO1xyXG5cdFx0XHR0aGlzLnNldFNjcm9sbFkoY3VycmVudFkgKyBlLmRlbHRhWSk7XHJcblx0XHRcdGlmIChlLmRlbHRhWCAhPT0gMCkge1xyXG5cdFx0XHRcdHRoaXMuZGlzcGF0Y2goJ2hzY3JvbGwnLCBlKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoZS5kZWx0YVkgIT09IDApIHtcclxuXHRcdFx0XHR0aGlzLmRpc3BhdGNoKCd2c2Nyb2xsJywgZSk7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblxyXG5cdFx0dGhpcy5fa2V5RG93bkhhbmRsZXIgPSAoZSkgPT4ge1xyXG5cdFx0XHR0aGlzLl9leHRlbnNpb25zLmV4ZWN1dGVFeHRlbnNpb24oJ2tleURvd24nLCBlKTtcclxuXHRcdH07XHJcblxyXG5cdFx0dGhpcy5fdlNjcm9sbC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLl92U2Nyb2xsSGFuZGxlcik7XHJcblx0XHR0aGlzLl9oU2Nyb2xsLmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMuX2hTY3JvbGxIYW5kbGVyKTtcclxuXHRcdHRoaXMuX2NvbnRlbnRQYW5lLmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgdGhpcy5fd2hlZWxIYW5kbGVyKTtcclxuXHRcdHRoaXMuX2VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2tleURvd25IYW5kbGVyKTtcclxuXHJcblx0fVxyXG5cclxuXHRfcmVzdHVyZWN0dXJlICgpIHtcclxuXHRcdHRoaXMuX2NvbnRlbnRQYW5lLnN0eWxlLndpZHRoID0gJ2NhbGMoMTAwJSAtICcgKyB0aGlzLl9zY3JvbGxXaWR0aCArICdweCknO1xyXG5cdFx0dGhpcy5fY29udGVudFBhbmUuc3R5bGUuaGVpZ2h0ID0gJ2NhbGMoMTAwJSAtICcgKyB0aGlzLl9zY3JvbGxXaWR0aCArICdweCknO1xyXG5cclxuXHRcdGxldCB0b3BGcmVlemVTaXplID0gdGhpcy5fbW9kZWwuZ2V0VG9wRnJlZXplU2l6ZSgpO1xyXG5cdFx0bGV0IGJvdHRvbUZyZWV6ZVNpemUgPSB0aGlzLl9tb2RlbC5nZXRCb3R0b21GcmVlemVTaXplKCk7XHJcblx0XHRsZXQgbGVmdEZyZWV6ZVNpemUgPSB0aGlzLl9tb2RlbC5nZXRMZWZ0RnJlZXplU2l6ZSgpO1xyXG5cclxuXHRcdHRoaXMuX3RvcExlZnRQYW5lLnN0eWxlLmxlZnQgPSAnMHB4JztcclxuXHRcdHRoaXMuX3RvcExlZnRQYW5lLnN0eWxlLnRvcCA9ICcwcHgnO1xyXG5cdFx0dGhpcy5fdG9wTGVmdFBhbmUuc3R5bGUud2lkdGggPSBsZWZ0RnJlZXplU2l6ZSArICdweCc7XHJcblx0XHR0aGlzLl90b3BMZWZ0UGFuZS5zdHlsZS5oZWlnaHQgPSB0b3BGcmVlemVTaXplICsgJ3B4JztcclxuXHRcdHRoaXMuX3RvcFBhbmUuc3R5bGUubGVmdCA9IGxlZnRGcmVlemVTaXplICsgJ3B4JztcclxuXHRcdHRoaXMuX3RvcFBhbmUuc3R5bGUudG9wID0gJzBweCc7XHJcblx0XHR0aGlzLl90b3BQYW5lLnN0eWxlLndpZHRoID0gJ2NhbGMoMTAwJSAtICcgKyBsZWZ0RnJlZXplU2l6ZSArICdweCknO1xyXG5cdFx0dGhpcy5fdG9wUGFuZS5zdHlsZS5oZWlnaHQgPSB0b3BGcmVlemVTaXplICsgJ3B4JztcclxuXHRcdHRoaXMuX2xlZnRQYW5lLnN0eWxlLmxlZnQgPSAnMHB4JztcclxuXHRcdHRoaXMuX2xlZnRQYW5lLnN0eWxlLnRvcCA9IHRvcEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fbGVmdFBhbmUuc3R5bGUud2lkdGggPSBsZWZ0RnJlZXplU2l6ZSArICdweCc7XHJcblx0XHR0aGlzLl9sZWZ0UGFuZS5zdHlsZS5oZWlnaHQgPSAnY2FsYygxMDAlIC0gJyArICh0b3BGcmVlemVTaXplICsgYm90dG9tRnJlZXplU2l6ZSkgKyAncHgpJztcclxuXHRcdHRoaXMuX2NlbnRlclBhbmUuc3R5bGUubGVmdCA9IGxlZnRGcmVlemVTaXplICsgJ3B4JztcclxuXHRcdHRoaXMuX2NlbnRlclBhbmUuc3R5bGUudG9wID0gdG9wRnJlZXplU2l6ZSArICdweCc7XHJcblx0XHR0aGlzLl9jZW50ZXJQYW5lLnN0eWxlLndpZHRoID0gJ2NhbGMoMTAwJSAtICcgKyBsZWZ0RnJlZXplU2l6ZSArICdweCknO1xyXG5cdFx0dGhpcy5fY2VudGVyUGFuZS5zdHlsZS5oZWlnaHQgPSAnY2FsYygxMDAlIC0gJyArICh0b3BGcmVlemVTaXplICsgYm90dG9tRnJlZXplU2l6ZSkgKyAncHgpJztcclxuXHRcdHRoaXMuX2JvdHRvbUxlZnRQYW5lLnN0eWxlLmxlZnQgPSAnMHB4JztcclxuXHRcdHRoaXMuX2JvdHRvbUxlZnRQYW5lLnN0eWxlLmJvdHRvbSA9ICcwcHgnO1xyXG5cdFx0dGhpcy5fYm90dG9tTGVmdFBhbmUuc3R5bGUud2lkdGggPSBsZWZ0RnJlZXplU2l6ZSArICdweCc7XHJcblx0XHR0aGlzLl9ib3R0b21MZWZ0UGFuZS5zdHlsZS5oZWlnaHQgPSBib3R0b21GcmVlemVTaXplICsgJ3B4JztcclxuXHRcdHRoaXMuX2JvdHRvbVBhbmUuc3R5bGUubGVmdCA9IGxlZnRGcmVlemVTaXplICsgJ3B4JztcclxuXHRcdHRoaXMuX2JvdHRvbVBhbmUuc3R5bGUuYm90dG9tID0gJzBweCc7XHJcblx0XHR0aGlzLl9ib3R0b21QYW5lLnN0eWxlLndpZHRoID0gJ2NhbGMoMTAwJSAtICcgKyBsZWZ0RnJlZXplU2l6ZSArICdweCknO1xyXG5cdFx0dGhpcy5fYm90dG9tUGFuZS5zdHlsZS5oZWlnaHQgPSBib3R0b21GcmVlemVTaXplICsgJ3B4JztcclxuXHJcblx0XHR0aGlzLl9yZW5kZXJDZWxscygpO1xyXG5cdFx0dGhpcy5fdXBkYXRlU2Nyb2xsQmFyKCk7XHJcblx0fVxyXG5cclxuXHRfb2JzZXJ2ZVNpemUgKCkge1xyXG5cdFx0dGhpcy5fcmVzaXplT2JzZXJ2ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIoKGVudHJpZXMsIG9ic2VydmVyKSA9PiB7XHJcblx0XHRcdHRoaXMuX3VwZGF0ZVNjcm9sbEJhcigpO1xyXG5cdFx0fSk7XHJcblx0XHR0aGlzLl9yZXNpemVPYnNlcnZlci5vYnNlcnZlKHRoaXMuX2VsZW1lbnQpO1xyXG5cdH1cclxuXHJcblx0X3VwZGF0ZVNjcm9sbEJhciAoKSB7XHJcblx0XHRsZXQgdG90YWxXaWR0aCA9IHRoaXMuX21vZGVsLmdldFRvdGFsV2lkdGgoKTtcclxuXHRcdGxldCB0b3RhbEhlaWdodCA9IHRoaXMuX21vZGVsLmdldFRvdGFsSGVpZ2h0KCk7XHJcblx0XHR0aGlzLl9oU2Nyb2xsVGh1bWIuc3R5bGUud2lkdGggPSB0b3RhbFdpZHRoICsgJ3B4JztcclxuXHRcdHRoaXMuX3ZTY3JvbGxUaHVtYi5zdHlsZS5oZWlnaHQgPSB0b3RhbEhlaWdodCArICdweCc7XHJcblxyXG5cdFx0bGV0IGdyaWRSZWN0ID0gdGhpcy5fZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHRcdGxldCBzY3JvbGxCYXJTdGF0ZSA9IHRoaXMuX21vZGVsLmRldGVybWluZVNjcm9sbGJhclN0YXRlKGdyaWRSZWN0LndpZHRoLCBncmlkUmVjdC5oZWlnaHQsIHRoaXMuX3Njcm9sbFdpZHRoKTtcclxuXHJcblx0XHRzd2l0Y2ggKHNjcm9sbEJhclN0YXRlKSB7XHJcblx0XHRcdGNhc2UgJ24nOlxyXG5cdFx0XHRcdHRoaXMuX2hTY3JvbGwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHRcdFx0XHR0aGlzLl92U2Nyb2xsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0XHRcdFx0dGhpcy5fY29udGVudFBhbmUuc3R5bGUud2lkdGggPSAnMTAwJSc7XHJcblx0XHRcdFx0dGhpcy5fY29udGVudFBhbmUuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICdoJzpcclxuXHRcdFx0XHR0aGlzLl9oU2Nyb2xsLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG5cdFx0XHRcdHRoaXMuX3ZTY3JvbGwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHRcdFx0XHR0aGlzLl9oU2Nyb2xsLnN0eWxlLndpZHRoID0gJzEwMCUnO1xyXG5cdFx0XHRcdHRoaXMuX2NvbnRlbnRQYW5lLnN0eWxlLndpZHRoID0gJzEwMCUnO1xyXG5cdFx0XHRcdHRoaXMuX2NvbnRlbnRQYW5lLnN0eWxlLmhlaWdodCA9ICdjYWxjKDEwMCUgLSAnICsgdGhpcy5fc2Nyb2xsV2lkdGggKyAncHgpJztcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAndic6XHJcblx0XHRcdFx0dGhpcy5faFNjcm9sbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cdFx0XHRcdHRoaXMuX3ZTY3JvbGwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcblx0XHRcdFx0dGhpcy5fdlNjcm9sbC5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XHJcblx0XHRcdFx0dGhpcy5fY29udGVudFBhbmUuc3R5bGUud2lkdGggPSAnY2FsYygxMDAlIC0gJyArIHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4KSc7XHJcblx0XHRcdFx0dGhpcy5fY29udGVudFBhbmUuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlICdiJzpcclxuXHRcdFx0XHR0aGlzLl9oU2Nyb2xsLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG5cdFx0XHRcdHRoaXMuX3ZTY3JvbGwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcblx0XHRcdFx0dGhpcy5faFNjcm9sbC5zdHlsZS53aWR0aCA9ICdjYWxjKDEwMCUgLSAnICsgdGhpcy5fc2Nyb2xsV2lkdGggKyAncHgpJztcclxuXHRcdFx0XHR0aGlzLl92U2Nyb2xsLnN0eWxlLmhlaWdodCA9ICdjYWxjKDEwMCUgLSAnICsgdGhpcy5fc2Nyb2xsV2lkdGggKyAncHgpJztcclxuXHRcdFx0XHR0aGlzLl9jb250ZW50UGFuZS5zdHlsZS53aWR0aCA9ICdjYWxjKDEwMCUgLSAnICsgdGhpcy5fc2Nyb2xsV2lkdGggKyAncHgpJztcclxuXHRcdFx0XHR0aGlzLl9jb250ZW50UGFuZS5zdHlsZS5oZWlnaHQgPSAnY2FsYygxMDAlIC0gJyArIHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4KSc7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRfcmVuZGVyQ2VsbHMgKCkge1xyXG5cdFx0bGV0IHRvcEZyZWV6ZSA9IHRoaXMuX21vZGVsLmdldFRvcEZyZWV6ZVJvd3MoKTtcclxuXHRcdGxldCBsZWZ0RnJlZXplID0gdGhpcy5fbW9kZWwuZ2V0TGVmdEZyZWV6ZVJvd3MoKTtcclxuXHRcdGxldCBib3R0b21GcmVlemUgPSB0aGlzLl9tb2RlbC5nZXRCb3R0b21GcmVlemVSb3dzKCk7XHJcblx0XHRsZXQgcm93Q291bnQgPSB0aGlzLl9tb2RlbC5nZXRSb3dDb3VudCgpO1xyXG5cdFx0bGV0IGNvbHVtbkNvdW50ID0gdGhpcy5fbW9kZWwuZ2V0Q29sdW1uQ291bnQoKTtcclxuXHRcdGxldCB0b3BSdW5uZXIgPSAwO1xyXG5cdFx0bGV0IGxlZnRSdW5uZXIgPSAwO1xyXG5cdFx0bGV0IGNvbFdpZHRoID0gW107XHJcblxyXG5cdFx0Ly9SZW5kZXIgdG9wIHJvd3NcclxuXHRcdHRvcFJ1bm5lciA9IDA7XHJcblx0XHRmb3IgKGxldCBqPTA7IGo8dG9wRnJlZXplOyBqKyspIHtcclxuXHRcdFx0bGV0IHJvd0hlaWdodCA9IHRoaXMuX21vZGVsLmdldFJvd0hlaWdodChqKTtcclxuXHRcdFx0Ly9SZW5kZXIgdG9wIGxlZnQgY2VsbHNcclxuXHRcdFx0bGVmdFJ1bm5lciA9IDA7XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTxsZWZ0RnJlZXplOyBpKyspIHtcclxuXHRcdFx0XHRjb2xXaWR0aFtpXSA9IHRoaXMuX21vZGVsLmdldENvbHVtbldpZHRoKGkpO1xyXG5cdFx0XHRcdHRoaXMuX3JlbmRlckNlbGwoaiwgaSwgdGhpcy5fdG9wTGVmdElubmVyLCBsZWZ0UnVubmVyLCB0b3BSdW5uZXIsIGNvbFdpZHRoW2ldLCByb3dIZWlnaHQpO1xyXG5cdFx0XHRcdGxlZnRSdW5uZXIgKz0gY29sV2lkdGhbaV07XHJcblx0XHRcdH1cclxuXHRcdFx0Ly9SZW5kZXIgdG9wIGNlbGxzXHJcblx0XHRcdGxlZnRSdW5uZXIgPSAwO1xyXG5cdFx0XHRmb3IgKGxldCBpPWxlZnRGcmVlemU7IGk8Y29sdW1uQ291bnQ7IGkrKykge1xyXG5cdFx0XHRcdGNvbFdpZHRoW2ldID0gdGhpcy5fbW9kZWwuZ2V0Q29sdW1uV2lkdGgoaSk7XHJcblx0XHRcdFx0dGhpcy5fcmVuZGVyQ2VsbChqLCBpLCB0aGlzLl90b3BJbm5lciwgbGVmdFJ1bm5lciwgdG9wUnVubmVyLCBjb2xXaWR0aFtpXSwgcm93SGVpZ2h0KTtcclxuXHRcdFx0XHRsZWZ0UnVubmVyICs9IGNvbFdpZHRoW2ldO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRvcFJ1bm5lciArPSByb3dIZWlnaHQ7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly9SZW5kZXIgbWlkZGxlIHJvd3NcclxuXHRcdHRvcFJ1bm5lciA9IDA7XHJcblx0XHRmb3IgKGxldCBqPXRvcEZyZWV6ZTsgajwocm93Q291bnQtYm90dG9tRnJlZXplKTsgaisrKSB7XHJcblx0XHRcdGxldCByb3dIZWlnaHQgPSB0aGlzLl9tb2RlbC5nZXRSb3dIZWlnaHQoaik7XHJcblx0XHRcdC8vUmVuZGVyIGxlZnQgY2VsbHNcclxuXHRcdFx0bGVmdFJ1bm5lciA9IDA7XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTxsZWZ0RnJlZXplOyBpKyspIHtcclxuXHRcdFx0XHR0aGlzLl9yZW5kZXJDZWxsKGosIGksIHRoaXMuX2xlZnRJbm5lciwgbGVmdFJ1bm5lciwgdG9wUnVubmVyLCBjb2xXaWR0aFtpXSwgcm93SGVpZ2h0KTtcclxuXHRcdFx0XHRsZWZ0UnVubmVyICs9IGNvbFdpZHRoW2ldO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vUmVuZGVyIGNlbnRlciBjZWxsc1xyXG5cdFx0XHRsZWZ0UnVubmVyID0gMDtcclxuXHRcdFx0Zm9yIChsZXQgaT1sZWZ0RnJlZXplOyBpPGNvbHVtbkNvdW50OyBpKyspIHtcclxuXHRcdFx0XHR0aGlzLl9yZW5kZXJDZWxsKGosIGksIHRoaXMuX2NlbnRlcklubmVyLCBsZWZ0UnVubmVyLCB0b3BSdW5uZXIsIGNvbFdpZHRoW2ldLCByb3dIZWlnaHQpO1xyXG5cdFx0XHRcdGxlZnRSdW5uZXIgKz0gY29sV2lkdGhbaV07XHJcblx0XHRcdH1cclxuXHRcdFx0dG9wUnVubmVyICs9IHJvd0hlaWdodDtcclxuXHRcdH1cclxuXHJcblx0XHQvL1JlbmRlciBib3R0b20gcm93c1xyXG5cdFx0dG9wUnVubmVyID0gMDtcclxuXHRcdGZvciAobGV0IGo9KHJvd0NvdW50LWJvdHRvbUZyZWV6ZSk7IGo8cm93Q291bnQ7IGorKykge1xyXG5cdFx0XHRsZXQgcm93SGVpZ2h0ID0gdGhpcy5fbW9kZWwuZ2V0Um93SGVpZ2h0KGopO1xyXG5cdFx0XHQvL1JlbmRlciBsZWZ0IGNlbGxzXHJcblx0XHRcdGxlZnRSdW5uZXIgPSAwO1xyXG5cdFx0XHRmb3IgKGxldCBpPTA7IGk8bGVmdEZyZWV6ZTsgaSsrKSB7XHJcblx0XHRcdFx0dGhpcy5fcmVuZGVyQ2VsbChqLCBpLCB0aGlzLl9ib3R0b21MZWZ0SW5uZXIsIGxlZnRSdW5uZXIsIHRvcFJ1bm5lciwgY29sV2lkdGhbaV0sIHJvd0hlaWdodCk7XHJcblx0XHRcdFx0bGVmdFJ1bm5lciArPSBjb2xXaWR0aFtpXTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvL1JlbmRlciBjZW50ZXIgY2VsbHNcclxuXHRcdFx0bGVmdFJ1bm5lciA9IDA7XHJcblx0XHRcdGZvciAobGV0IGk9bGVmdEZyZWV6ZTsgaTxjb2x1bW5Db3VudDsgaSsrKSB7XHJcblx0XHRcdFx0dGhpcy5fcmVuZGVyQ2VsbChqLCBpLCB0aGlzLl9ib3R0b21Jbm5lciwgbGVmdFJ1bm5lciwgdG9wUnVubmVyLCBjb2xXaWR0aFtpXSwgcm93SGVpZ2h0KTtcclxuXHRcdFx0XHRsZWZ0UnVubmVyICs9IGNvbFdpZHRoW2ldO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRvcFJ1bm5lciArPSByb3dIZWlnaHQ7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRfcmVuZGVyQ2VsbCAocm93SW5kZXgsIGNvbEluZGV4LCBwYW5lLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XHJcblx0XHRsZXQgZGF0YSA9IHRoaXMuX21vZGVsLmdldERhdGFBdChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cclxuXHRcdC8vRGF0YSBjYW4gYmUgdHJhbnNmb3JtZWQgYmVmb3JlIHJlbmRlcmluZyB1c2luZyBkYXRhQmVmb3JlUmVuZGVyIGV4dGVuc2lvblxyXG5cdFx0bGV0IGFyZyA9IHtkYXRhOiBkYXRhfTtcclxuXHRcdHRoaXMuX2V4dGVuc2lvbnMuZXhlY3V0ZUV4dGVuc2lvbignZGF0YUJlZm9yZVJlbmRlcicsIGFyZyk7XHJcblx0XHRkYXRhID0gYXJnLmRhdGE7XHJcblxyXG5cdFx0bGV0IGNlbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHRcdGxldCBjZWxsQ2xhc3NlcyA9IHRoaXMuX21vZGVsLmdldENlbGxDbGFzc2VzKHJvd0luZGV4LCBjb2xJbmRleCk7XHJcblx0XHRjZWxsLmNsYXNzTmFtZSA9ICdwZ3JpZC1jZWxsICcgKyBjZWxsQ2xhc3Nlcy5qb2luKCcgJyk7XHJcblx0XHRjZWxsLnN0eWxlLmxlZnQgPSB4ICsgJ3B4JztcclxuXHRcdGNlbGwuc3R5bGUudG9wID0geSArICdweCc7XHJcblx0XHRjZWxsLnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xyXG5cdFx0Y2VsbC5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xyXG5cdFx0Y2VsbC5kYXRhc2V0LnJvd0luZGV4ID0gcm93SW5kZXg7XHJcblx0XHRjZWxsLmRhdGFzZXQuY29sSW5kZXggPSBjb2xJbmRleDtcclxuXHJcblx0XHRsZXQgY2VsbENvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHRcdGNlbGxDb250ZW50LmNsYXNzTmFtZSA9ICdwZ3JpZC1jZWxsLWNvbnRlbnQnO1xyXG5cdFx0Y2VsbC5hcHBlbmRDaGlsZChjZWxsQ29udGVudCk7XHJcblx0XHRwYW5lLmFwcGVuZENoaWxkKGNlbGwpO1xyXG5cclxuXHRcdGxldCBldmVudEFyZyA9IHtcclxuXHRcdFx0Y2VsbCxcclxuXHRcdFx0Y2VsbENvbnRlbnQsXHJcblx0XHRcdHJvd0luZGV4LFxyXG5cdFx0XHRjb2xJbmRleCxcclxuXHRcdFx0ZGF0YSxcclxuXHRcdFx0cm93SWQ6IHRoaXMuX21vZGVsLmdldFJvd0lkKHJvd0luZGV4KSxcclxuXHRcdFx0ZmllbGQ6IHRoaXMuX21vZGVsLmdldENvbHVtbkZpZWxkKGNvbEluZGV4KSxcclxuXHRcdFx0aGFuZGxlZDogZmFsc2VcclxuXHRcdH07XHJcblxyXG5cdFx0Ly9JZiB0aGVyZSdzIGNlbGxSZW5kZXIgZXh0ZW5zaW9uLCB1c2UgY2VsbFJlbmRlciBleHRlbnNpb24gdG8gcmVuZGVyIHRoZSBjZWxsXHJcblx0XHQvL0Vsc2UganVzdCBzZXQgdGhlIGRhdGEgdG8gdGhlIGNlbGxDb250ZW50IGRpcmVjdGx5XHJcblx0XHRsZXQgaGFuZGxlZEJ5RXh0ID0gZmFsc2U7XHJcblx0XHRpZiAodGhpcy5fZXh0ZW5zaW9ucy5oYXNFeHRlbnNpb24oJ2NlbGxSZW5kZXInKSkge1xyXG5cdFx0XHR0aGlzLl9leHRlbnNpb25zLmV4ZWN1dGVFeHRlbnNpb24oJ2NlbGxSZW5kZXInLCBldmVudEFyZyk7XHJcblx0XHRcdGhhbmRsZWRCeUV4dCA9IGV2ZW50QXJnLmhhbmRsZWQ7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCFoYW5kbGVkQnlFeHQpIHtcclxuXHRcdFx0aWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdGNlbGxDb250ZW50LmlubmVySFRNTCA9IGRhdGE7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLl9leHRlbnNpb25zLmV4ZWN1dGVFeHRlbnNpb24oJ2NlbGxBZnRlclJlbmRlcicsIGV2ZW50QXJnKTtcclxuXHRcdHRoaXMuX2V4dGVuc2lvbnMuZXhlY3V0ZUV4dGVuc2lvbignY2VsbEFmdGVyVXBkYXRlJywgZXZlbnRBcmcpO1xyXG5cclxuXHRcdGV2ZW50QXJnID0gbnVsbDtcclxuXHR9XHJcblxyXG5cdF9tZWFzdXJlU2Nyb2xsYmFyV2lkdGggKCkge1xyXG5cdFx0dmFyIGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG5cdFx0aW5uZXIuc3R5bGUud2lkdGggPSAnMTAwJSc7XHJcblx0XHRpbm5lci5zdHlsZS5oZWlnaHQgPSAnMjAwcHgnO1xyXG5cdFx0dmFyIG91dG1vc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHRcdG91dG1vc3QuY2xhc3NOYW1lID0gJ3BncmlkJztcclxuXHRcdHZhciBvdXRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cdFx0b3V0ZXIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG5cdFx0b3V0ZXIuc3R5bGUudG9wID0gJzBweCc7XHJcblx0XHRvdXRlci5zdHlsZS5sZWZ0ID0gJzBweCc7XHJcblx0XHRvdXRlci5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XHJcblx0XHRvdXRlci5zdHlsZS53aWR0aCA9ICcyMDBweCc7XHJcblx0XHRvdXRlci5zdHlsZS5oZWlnaHQgPSAnMTUwcHgnO1xyXG5cdFx0b3V0ZXIuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcclxuXHRcdG91dGVyLmFwcGVuZENoaWxkKGlubmVyKTtcclxuXHRcdG91dG1vc3QuYXBwZW5kQ2hpbGQob3V0ZXIpO1xyXG5cdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChvdXRtb3N0KTtcclxuXHRcdHZhciB3MSA9IGlubmVyLm9mZnNldFdpZHRoO1xyXG5cdFx0b3V0ZXIuc3R5bGUub3ZlcmZsb3cgPSAnc2Nyb2xsJztcclxuXHRcdHZhciB3MiA9IGlubmVyLm9mZnNldFdpZHRoO1xyXG5cdFx0aWYgKHcxID09IHcyKSB3MiA9IG91dGVyLmNsaWVudFdpZHRoO1xyXG5cdFx0ZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCAob3V0bW9zdCk7XHJcblx0XHRyZXR1cm4gKHcxIC0gdzIpICsgKHRoaXMuX2RldGVjdElFKCk/MTowKTtcclxuXHR9XHJcblxyXG5cclxuXHRfZGV0ZWN0SUUgKCkge1xyXG5cdCAgdmFyIHVhID0gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQ7XHJcblx0ICB2YXIgbXNpZSA9IHVhLmluZGV4T2YoJ01TSUUgJyk7XHJcblx0ICBpZiAobXNpZSA+IDApIHtcclxuXHQgICAgLy8gSUUgMTAgb3Igb2xkZXIgPT4gcmV0dXJuIHZlcnNpb24gbnVtYmVyXHJcblx0ICAgIHJldHVybiBwYXJzZUludCh1YS5zdWJzdHJpbmcobXNpZSArIDUsIHVhLmluZGV4T2YoJy4nLCBtc2llKSksIDEwKTtcclxuXHQgIH1cclxuXHJcblx0ICB2YXIgdHJpZGVudCA9IHVhLmluZGV4T2YoJ1RyaWRlbnQvJyk7XHJcblx0ICBpZiAodHJpZGVudCA+IDApIHtcclxuXHQgICAgLy8gSUUgMTEgPT4gcmV0dXJuIHZlcnNpb24gbnVtYmVyXHJcblx0ICAgIHZhciBydiA9IHVhLmluZGV4T2YoJ3J2OicpO1xyXG5cdCAgICByZXR1cm4gcGFyc2VJbnQodWEuc3Vic3RyaW5nKHJ2ICsgMywgdWEuaW5kZXhPZignLicsIHJ2KSksIDEwKTtcclxuXHQgIH1cclxuXHJcblx0ICB2YXIgZWRnZSA9IHVhLmluZGV4T2YoJ0VkZ2UvJyk7XHJcblx0ICBpZiAoZWRnZSA+IDApIHtcclxuXHQgICAgLy8gRWRnZSAoSUUgMTIrKSA9PiByZXR1cm4gdmVyc2lvbiBudW1iZXJcclxuXHQgICAgcmV0dXJuIHBhcnNlSW50KHVhLnN1YnN0cmluZyhlZGdlICsgNSwgdWEuaW5kZXhPZignLicsIGVkZ2UpKSwgMTApO1xyXG5cdCAgfVxyXG5cdCAgLy8gb3RoZXIgYnJvd3NlclxyXG5cdCAgcmV0dXJuIGZhbHNlO1xyXG5cdH1cclxufSIsImltcG9ydCB7IFBHcmlkIH0gZnJvbSAnLi9ncmlkL2dyaWQnO1xyXG5cclxud2luZG93LlBHcmlkID0gUEdyaWQ7XHJcblxyXG4vLyBQb2x5ZmlsbCAtIEVsZW1lbnQuc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZFxyXG5cclxuaWYgKCFFbGVtZW50LnByb3RvdHlwZS5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKSB7XHJcbiAgICBFbGVtZW50LnByb3RvdHlwZS5zY3JvbGxJbnRvVmlld0lmTmVlZGVkID0gZnVuY3Rpb24gKGNlbnRlcklmTmVlZGVkKSB7XHJcbiAgICAgICAgY2VudGVySWZOZWVkZWQgPSBhcmd1bWVudHMubGVuZ3RoID09PSAwID8gdHJ1ZSA6ICEhY2VudGVySWZOZWVkZWQ7XHJcblxyXG4gICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLnBhcmVudE5vZGUsXHJcbiAgICAgICAgICAgIHBhcmVudENvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShwYXJlbnQsIG51bGwpLFxyXG4gICAgICAgICAgICBwYXJlbnRCb3JkZXJUb3BXaWR0aCA9IHBhcnNlSW50KHBhcmVudENvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnYm9yZGVyLXRvcC13aWR0aCcpKSxcclxuICAgICAgICAgICAgcGFyZW50Qm9yZGVyTGVmdFdpZHRoID0gcGFyc2VJbnQocGFyZW50Q29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdib3JkZXItbGVmdC13aWR0aCcpKSxcclxuICAgICAgICAgICAgb3ZlclRvcCA9IHRoaXMub2Zmc2V0VG9wIC0gcGFyZW50Lm9mZnNldFRvcCA8IHBhcmVudC5zY3JvbGxUb3AsXHJcbiAgICAgICAgICAgIG92ZXJCb3R0b20gPSAodGhpcy5vZmZzZXRUb3AgLSBwYXJlbnQub2Zmc2V0VG9wICsgdGhpcy5jbGllbnRIZWlnaHQgLSBwYXJlbnRCb3JkZXJUb3BXaWR0aCkgPiAocGFyZW50LnNjcm9sbFRvcCArIHBhcmVudC5jbGllbnRIZWlnaHQpLFxyXG4gICAgICAgICAgICBvdmVyTGVmdCA9IHRoaXMub2Zmc2V0TGVmdCAtIHBhcmVudC5vZmZzZXRMZWZ0IDwgcGFyZW50LnNjcm9sbExlZnQsXHJcbiAgICAgICAgICAgIG92ZXJSaWdodCA9ICh0aGlzLm9mZnNldExlZnQgLSBwYXJlbnQub2Zmc2V0TGVmdCArIHRoaXMuY2xpZW50V2lkdGggLSBwYXJlbnRCb3JkZXJMZWZ0V2lkdGgpID4gKHBhcmVudC5zY3JvbGxMZWZ0ICsgcGFyZW50LmNsaWVudFdpZHRoKSxcclxuICAgICAgICAgICAgYWxpZ25XaXRoVG9wID0gb3ZlclRvcCAmJiAhb3ZlckJvdHRvbTtcclxuXHJcbiAgICAgICAgaWYgKChvdmVyVG9wIHx8IG92ZXJCb3R0b20pICYmIGNlbnRlcklmTmVlZGVkKSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5zY3JvbGxUb3AgPSB0aGlzLm9mZnNldFRvcCAtIHBhcmVudC5vZmZzZXRUb3AgLSBwYXJlbnQuY2xpZW50SGVpZ2h0IC8gMiAtIHBhcmVudEJvcmRlclRvcFdpZHRoICsgdGhpcy5jbGllbnRIZWlnaHQgLyAyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKChvdmVyTGVmdCB8fCBvdmVyUmlnaHQpICYmIGNlbnRlcklmTmVlZGVkKSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5zY3JvbGxMZWZ0ID0gdGhpcy5vZmZzZXRMZWZ0IC0gcGFyZW50Lm9mZnNldExlZnQgLSBwYXJlbnQuY2xpZW50V2lkdGggLyAyIC0gcGFyZW50Qm9yZGVyTGVmdFdpZHRoICsgdGhpcy5jbGllbnRXaWR0aCAvIDI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoKG92ZXJUb3AgfHwgb3ZlckJvdHRvbSB8fCBvdmVyTGVmdCB8fCBvdmVyUmlnaHQpICYmICFjZW50ZXJJZk5lZWRlZCkge1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbEludG9WaWV3KGFsaWduV2l0aFRvcCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufSJdfQ==

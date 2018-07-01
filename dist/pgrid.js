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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CopyPasteExtension = function () {
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

exports.default = CopyPasteExtension;

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EditorExtension = function () {
	function EditorExtension() {
		_classCallCheck(this, EditorExtension);
	}

	_createClass(EditorExtension, [{
		key: 'init',
		value: function init(grid, config) {
			this._grid = grid;
			this._config = config;
		}
	}, {
		key: 'keyDown',
		value: function keyDown(e) {
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
				var data = this._grid.data.getDataAt(actualRow, actualCol);

				//If there's custom editor, use custom editor to attach the editor
				var customEditor = this._grid.model.getCascadedCellProp(actualCell.dataset.rowIndex, actualCell.dataset.colIndex, 'editor');
				if (customEditor && customEditor.attach) {
					customEditor.attach(actualCell, data, this._done.bind(this));
				} else {
					this._attachEditor(actualCell, data, this._done.bind(this));
				}
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
				this._inputElement.style.width = cellBound.width - 3 + 'px';
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
				this._grid.data.setDataAt(this._editingRow, this._editingCol, result);
			}
			this._grid.view.updateCell(this._editingRow, this._editingCol);
			this._editingRow = -1;
			this._editingCol = -1;

			//Re-focus at the grid
			this._grid.view.getElement().focus();
		}
	}]);

	return EditorExtension;
}();

exports.default = EditorExtension;

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SelectionExtension = function () {
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
					var rowModel = this._grid.model.getRowModel(rowIndex);
					var colModel = this._grid.model.getColumnModel(colIndex);
					if ((!rowModel || rowModel.type !== 'header') && (!colModel || colModel.type !== 'header')) {

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
				if (!rowModel || rowModel.type !== 'header') {
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

exports.default = SelectionExtension;

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _event = require('./event');

var _event2 = _interopRequireDefault(_event);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Data = function (_EventDispatcher) {
	_inherits(Data, _EventDispatcher);

	function Data(dataModel, extension) {
		_classCallCheck(this, Data);

		var _this = _possibleConstructorReturn(this, (Data.__proto__ || Object.getPrototypeOf(Data)).call(this));

		_this._dataModel = dataModel;
		_this._extension = extension;
		_this._blockEvent = false;
		return _this;
	}

	_createClass(Data, [{
		key: 'getDataAt',
		value: function getDataAt(rowIndex, colIndex) {
			if (this._dataModel.data[rowIndex]) {
				return this._dataModel.data[rowIndex][colIndex];
			}
			return undefined;
		}
	}, {
		key: 'setDataAt',
		value: function setDataAt(rowIndex, colIndex, data) {
			var beforeUpdateArg = {
				rowIndex: rowIndex,
				colIndex: colIndex,
				data: data,
				cancel: false
			};
			if (!this._blockEvent) {
				this._blockEvent = true;
				this._extension.executeExtension('dataBeforeUpdate', beforeUpdateArg);
				this._blockEvent = false;
			}
			if (!beforeUpdateArg.cancel) {
				if (!this._dataModel.data[rowIndex]) {
					this._dataModel.data[rowIndex] = [];
				}
				this._dataModel.data[rowIndex][colIndex] = beforeUpdateArg.data;
				if (!this._blockEvent) {
					this._blockEvent = true;
					this._extension.executeExtension('dataAfterUpdate', beforeUpdateArg);
					this._blockEvent = false;
				}
			}
			this._updating = false;
		}
	}, {
		key: 'getRowCount',
		value: function getRowCount() {
			if (this._dataModel.data) {
				return this._dataModel.data.length;
			} else {
				return 0;
			}
		}
	}, {
		key: 'getAllData',
		value: function getAllData() {
			return this._dataModel.data;
		}
	}, {
		key: 'addRow',
		value: function addRow(rowData) {
			this.insertRow(this.getRowCount(), rowData);
		}
	}, {
		key: 'insertRow',
		value: function insertRow(atIndex, rowData) {
			this._dataModel.data.splice(atIndex, 0, rowData);
		}
	}]);

	return Data;
}(_event2.default);

exports.default = Data;

},{"./event":6}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EventDispatcher = function () {
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

exports.default = EventDispatcher;

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Extension = function () {
	function Extension(grid, config) {
		_classCallCheck(this, Extension);

		this._grid = grid;
		this._config = config;

		this._extensions = {
			cellAfterRender: [],
			cellAfterUpdate: [],
			keyDown: [],
			gridAfterRender: [],
			dataBeforeRender: [],
			dataBeforeUpdate: [],
			dataAfterUpdate: []
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

exports.default = Extension;

},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.PGrid = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _view = require('./view');

var _view2 = _interopRequireDefault(_view);

var _model = require('./model');

var _model2 = _interopRequireDefault(_model);

var _data = require('./data');

var _data2 = _interopRequireDefault(_data);

var _extension = require('./extension');

var _extension2 = _interopRequireDefault(_extension);

var _state = require('./state');

var _state2 = _interopRequireDefault(_state);

var _event = require('./event');

var _event2 = _interopRequireDefault(_event);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

var _selection = require('../extensions/selection');

var _selection2 = _interopRequireDefault(_selection);

var _editor = require('../extensions/editor');

var _editor2 = _interopRequireDefault(_editor);

var _copypaste = require('../extensions/copypaste');

var _copypaste2 = _interopRequireDefault(_copypaste);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
			columnCount: 0,
			rowHeight: 32,
			columnWidth: 100
		};
		_this._config = _utils2.default.mixin(config, defaultConfig);

		//Extensions Store
		_this._extensions = new _extension2.default(_this, _this._config);

		_this._data = new _data2.default(_this._config.dataModel, _this._extensions);
		_this._model = new _model2.default(_this._config, _this._data);
		_this._view = new _view2.default(_this._model, _this._data, _this._extensions);
		_this._state = new _state2.default();

		//Load default extensions
		if (_this._config.selection) {
			_this._extensions.loadExtension(new _selection2.default());
		}
		if (_this._config.editing) {
			_this._extensions.loadExtension(new _editor2.default());
		}
		if (_this._config.copypaste) {
			_this._extensions.loadExtension(new _copypaste2.default());
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
		key: 'addRow',
		value: function addRow(rowData) {
			this.insertRow(this.data.getRowCount(), rowData);
		}
	}, {
		key: 'insertRow',
		value: function insertRow(atIndex, rowData) {
			this.data.insertRow(atindex, rowData);

			var modelRowCount = this.model.getRowCount();
			var dataRowCount = this.data.getRowCount();
			if (modelRowCount < dataRowCount) {
				var diff = dataRowCount - modelRowCount;
			}
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
}(_event2.default);

},{"../extensions/copypaste":2,"../extensions/editor":3,"../extensions/selection":4,"./data":5,"./event":6,"./extension":7,"./model":9,"./state":10,"./utils":11,"./view":12}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _event = require('./event');

var _event2 = _interopRequireDefault(_event);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Model = function (_EventDispatcher) {
	_inherits(Model, _EventDispatcher);

	function Model(config, data) {
		_classCallCheck(this, Model);

		var _this = _possibleConstructorReturn(this, (Model.__proto__ || Object.getPrototypeOf(Model)).call(this));

		_this._config = config;
		_this._data = data;

		_this._columnModel = {};
		_this._rowModel = {};
		_this._cellModel = {};

		if (_this._config.columns) {
			for (var i = 0; i < _this._config.columns.length; i++) {
				_this._columnModel[_this._config.columns[i].i] = _this._config.columns[i];
			}
		}
		if (_this._config.rows) {
			for (var _i = 0; _i < _this._config.rows.length; _i++) {
				_this._rowModel[_this._config.rows[_i].i] = _this._config.rows[_i];
			}
		}
		if (_this._config.cells) {
			for (var _i2 = 0; _i2 < _this._config.cells.length; _i2++) {
				var model = _this._config.cells[_i2];
				if (!_this._cellModel[model.c]) {
					_this._cellModel[model.c] = {};
				}
				_this._cellModel[model.c][model.r] = model;
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
			var rowModel = this._rowModel[rowIndex];
			if (rowIndex && rowIndex.height !== undefined) {
				return rowModel.height;
			} else {
				return this._config.rowHeight;
			}
		}
	}, {
		key: 'getColumnCount',
		value: function getColumnCount() {
			return this._config.columnCount;
		}
	}, {
		key: 'getRowCount',
		value: function getRowCount() {
			if (this._config.rowCount) {
				return this._config.rowCount;
			} else {
				return this._data.getRowCount();
			}
		}
	}, {
		key: 'getTopFreezeRows',
		value: function getTopFreezeRows() {
			if (this._config.freezePane && this._config.freezePane.top > 0) {
				return this._config.freezePane.top;
			}
			return 0;
		}
	}, {
		key: 'getTopFreezeSize',
		value: function getTopFreezeSize() {
			if (this._config.freezePane && this._config.freezePane.top > 0) {
				var sum = 0;
				for (var i = 0; i < this._config.freezePane.top; i++) {
					sum += this.getRowHeight(i);
				}
				return sum;
			}
			return 0;
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
			return this._rowModel[rowIndex];
		}
	}, {
		key: 'getColumnModel',
		value: function getColumnModel(colIndex) {
			return this._columnModel[colIndex];
		}
	}, {
		key: 'getCellModel',
		value: function getCellModel(rowIndex, colIndex) {
			if (this._cellModel[colIndex]) {
				return this._cellModel[colIndex][rowIndex];
			}
		}
	}, {
		key: 'getCascadedCellProp',
		value: function getCascadedCellProp(rowIndex, colIndex, propName) {
			if (this._cellModel[colIndex] && this._cellModel[colIndex][rowIndex] && this._cellModel[colIndex][rowIndex][propName]) {
				return this._cellModel[colIndex][rowIndex];
			} else if (this._rowModel[rowIndex] && this._rowModel[rowIndex][propName]) {
				return this._rowModel[rowIndex][propName];
			} else if (this._columnModel[colIndex] && this._columnModel[colIndex][propName]) {
				return this._columnModel[colIndex][propName];
			}
			return undefined;
		}
	}, {
		key: 'getCellClasses',
		value: function getCellClasses(rowIndex, colIndex) {
			var output = [];
			var colModel = this._columnModel[colIndex];
			if (colModel) {
				if (colModel.type == 'header') {
					output.unshift('pgrid-column-header');
				}
				if (colModel.cssClass) {
					output.unshift(colModel.cssClass);
				}
			}
			var rowModel = this._rowModel[rowIndex];
			if (rowModel) {
				if (rowModel.type == 'header') {
					output.unshift('pgrid-row-header');
				} else if (rowModel.type == 'footer') {
					output.unshift('pgrid-row-footer');
				}
				if (rowModel.cssClass) {
					output.unshift(rowModel.cssClass);
				}
			}
			if (this._cellModel[colIndex] && this._cellModel[colIndex][rowIndex]) {
				var cellModel = this._cellModel[colIndex][rowIndex];
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
		key: '_calcTotalSize',
		value: function _calcTotalSize() {
			this._calcTotalWidth();
			this._calcTotalHeight();
			this._calcBottomFreezeSize();
		}
	}, {
		key: '_calcTotalWidth',
		value: function _calcTotalWidth() {
			var colModelCount = Object.keys(this._columnModel);
			this._totalWidth = this._config.columnWidth * (this._config.columnCount - colModelCount.length);
			for (var index in this._columnModel) {
				if (this._columnModel[index].width !== undefined) {
					this._totalWidth += this._columnModel[index].width;
				} else {
					this._totalWidth += this._config.columnWidth;
				}
			}
		}
	}, {
		key: '_calcTotalHeight',
		value: function _calcTotalHeight() {
			var rowModelCount = Object.keys(this._rowModel);
			this._totalHeight = this._config.rowHeight * (this._config.rowCount - rowModelCount.length);
			for (var index in this._rowModel) {
				if (this._rowModel[index].height !== undefined) {
					this._totalHeight += this._rowModel[index].height;
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
}(_event2.default);

exports.default = Model;

},{"./event":6}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var State = function () {
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

exports.default = State;

},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Utils = function () {
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

exports.default = Utils;

},{}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _event = require('./event');

var _event2 = _interopRequireDefault(_event);

var _resizeObserverPolyfill = require('resize-observer-polyfill');

var _resizeObserverPolyfill2 = _interopRequireDefault(_resizeObserverPolyfill);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var View = function (_EventDispatcher) {
	_inherits(View, _EventDispatcher);

	function View(model, data, extensions) {
		_classCallCheck(this, View);

		var _this = _possibleConstructorReturn(this, (View.__proto__ || Object.getPrototypeOf(View)).call(this));

		_this._model = model;
		_this._data = data;
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
				} else {
					cellContent = cell.firstChild;
				}

				//Render data
				var data = this._data.getDataAt(rowIndex, colIndex);

				//Data cab be transformed before rendering using dataBeforeRender extension
				var arg = { data: data };
				this._extensions.executeExtension('dataBeforeRender', arg);
				data = arg.data;

				if (data !== undefined && data !== null) {
					cellContent.innerHTML = data;
				} else {
					cellContent.innerHTML = '';
				}

				cell.appendChild(cellContent);

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
			var data = this._data.getDataAt(rowIndex, colIndex);

			//Data cab be transformed before rendering using dataBeforeRender extension
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
			if (data !== undefined) {
				cellContent.innerHTML = data;
			}
			cell.appendChild(cellContent);
			pane.appendChild(cell);

			var eventArg = {
				cell: cell,
				rowIndex: rowIndex,
				colIndex: colIndex,
				data: data
			};

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
}(_event2.default);

exports.default = View;

},{"./event":6,"resize-observer-polyfill":1}],13:[function(require,module,exports){
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

},{"./grid/grid":8}]},{},[13])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcmVzaXplLW9ic2VydmVyLXBvbHlmaWxsL2Rpc3QvUmVzaXplT2JzZXJ2ZXIuanMiLCJzcmNcXGV4dGVuc2lvbnNcXGNvcHlwYXN0ZS5qcyIsInNyY1xcZXh0ZW5zaW9uc1xcZWRpdG9yLmpzIiwic3JjXFxleHRlbnNpb25zXFxzZWxlY3Rpb24uanMiLCJzcmNcXGdyaWRcXGRhdGEuanMiLCJzcmNcXGdyaWRcXGV2ZW50LmpzIiwic3JjXFxncmlkXFxleHRlbnNpb24uanMiLCJzcmNcXGdyaWRcXGdyaWQuanMiLCJzcmNcXGdyaWRcXG1vZGVsLmpzIiwic3JjXFxncmlkXFxzdGF0ZS5qcyIsInNyY1xcZ3JpZFxcdXRpbHMuanMiLCJzcmNcXGdyaWRcXHZpZXcuanMiLCJzcmNcXG1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QWMsS0FBSyxTQUFMLEdBQWlCLE9BQU8sU0FBeEIsR0FBb0MsS0FBSyxZQUF6QyxHQUF3RCxvQkFBekQsR0FBa0YsT0FBTyxTQUFQLEdBQW1CLE9BQU8sWUFMN0g7QUFBQSxZQU1JLFdBQVcsS0FBSyxVQUFMLEdBQWtCLE9BQU8sVUFBekIsR0FBc0MsT0FBTyxVQU41RDtBQUFBLFlBT0ksWUFBYSxLQUFLLFVBQUwsR0FBa0IsT0FBTyxVQUF6QixHQUFzQyxLQUFLLFdBQTNDLEdBQXlELHFCQUExRCxHQUFvRixPQUFPLFVBQVAsR0FBb0IsT0FBTyxXQVAvSDtBQUFBLFlBUUksZUFBZSxXQUFXLENBQUMsVUFSL0I7O0FBVUEsWUFBSSxDQUFDLFdBQVcsVUFBWixLQUEyQixjQUEvQixFQUErQztBQUMzQyxtQkFBTyxTQUFQLEdBQW1CLEtBQUssU0FBTCxHQUFpQixPQUFPLFNBQXhCLEdBQW9DLE9BQU8sWUFBUCxHQUFzQixDQUExRCxHQUE4RCxvQkFBOUQsR0FBcUYsS0FBSyxZQUFMLEdBQW9CLENBQTVIO0FBQ0g7O0FBRUQsWUFBSSxDQUFDLFlBQVksU0FBYixLQUEyQixjQUEvQixFQUErQztBQUMzQyxtQkFBTyxVQUFQLEdBQW9CLEtBQUssVUFBTCxHQUFrQixPQUFPLFVBQXpCLEdBQXNDLE9BQU8sV0FBUCxHQUFxQixDQUEzRCxHQUErRCxxQkFBL0QsR0FBdUYsS0FBSyxXQUFMLEdBQW1CLENBQTlIO0FBQ0g7O0FBRUQsWUFBSSxDQUFDLFdBQVcsVUFBWCxJQUF5QixRQUF6QixJQUFxQyxTQUF0QyxLQUFvRCxDQUFDLGNBQXpELEVBQXlFO0FBQ3JFLGlCQUFLLGNBQUwsQ0FBb0IsWUFBcEI7QUFDSDtBQUNKLEtBeEJEO0FBeUJIIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG5cdHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpIDpcblx0dHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKGZhY3RvcnkpIDpcblx0KGdsb2JhbC5SZXNpemVPYnNlcnZlciA9IGZhY3RvcnkoKSk7XG59KHRoaXMsIChmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0JztcblxuLyoqXHJcbiAqIEEgY29sbGVjdGlvbiBvZiBzaGltcyB0aGF0IHByb3ZpZGUgbWluaW1hbCBmdW5jdGlvbmFsaXR5IG9mIHRoZSBFUzYgY29sbGVjdGlvbnMuXHJcbiAqXHJcbiAqIFRoZXNlIGltcGxlbWVudGF0aW9ucyBhcmUgbm90IG1lYW50IHRvIGJlIHVzZWQgb3V0c2lkZSBvZiB0aGUgUmVzaXplT2JzZXJ2ZXJcclxuICogbW9kdWxlcyBhcyB0aGV5IGNvdmVyIG9ubHkgYSBsaW1pdGVkIHJhbmdlIG9mIHVzZSBjYXNlcy5cclxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSByZXF1aXJlLWpzZG9jLCB2YWxpZC1qc2RvYyAqL1xudmFyIE1hcFNoaW0gPSAoZnVuY3Rpb24gKCkge1xuICAgIGlmICh0eXBlb2YgTWFwICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gTWFwO1xuICAgIH1cblxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBpbmRleCBpbiBwcm92aWRlZCBhcnJheSB0aGF0IG1hdGNoZXMgdGhlIHNwZWNpZmllZCBrZXkuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtBcnJheTxBcnJheT59IGFyclxyXG4gICAgICogQHBhcmFtIHsqfSBrZXlcclxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRJbmRleChhcnIsIGtleSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gLTE7XG5cbiAgICAgICAgYXJyLnNvbWUoZnVuY3Rpb24gKGVudHJ5LCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKGVudHJ5WzBdID09PSBrZXkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBpbmRleDtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIGFub255bW91cygpIHtcbiAgICAgICAgICAgIHRoaXMuX19lbnRyaWVzX18gPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcm90b3R5cGVBY2Nlc3NvcnMgPSB7IHNpemU6IHsgY29uZmlndXJhYmxlOiB0cnVlIH0gfTtcblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAgICAgKi9cbiAgICAgICAgcHJvdG90eXBlQWNjZXNzb3JzLnNpemUuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX19lbnRyaWVzX18ubGVuZ3RoO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7Kn0ga2V5XHJcbiAgICAgICAgICogQHJldHVybnMgeyp9XHJcbiAgICAgICAgICovXG4gICAgICAgIGFub255bW91cy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gZ2V0SW5kZXgodGhpcy5fX2VudHJpZXNfXywga2V5KTtcbiAgICAgICAgICAgIHZhciBlbnRyeSA9IHRoaXMuX19lbnRyaWVzX19baW5kZXhdO1xuXG4gICAgICAgICAgICByZXR1cm4gZW50cnkgJiYgZW50cnlbMV07XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHsqfSBrZXlcclxuICAgICAgICAgKiBAcGFyYW0geyp9IHZhbHVlXHJcbiAgICAgICAgICogQHJldHVybnMge3ZvaWR9XHJcbiAgICAgICAgICovXG4gICAgICAgIGFub255bW91cy5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGdldEluZGV4KHRoaXMuX19lbnRyaWVzX18sIGtleSk7XG5cbiAgICAgICAgICAgIGlmICh+aW5kZXgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9fZW50cmllc19fW2luZGV4XVsxXSA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9fZW50cmllc19fLnB1c2goW2tleSwgdmFsdWVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcGFyYW0geyp9IGtleVxyXG4gICAgICAgICAqIEByZXR1cm5zIHt2b2lkfVxyXG4gICAgICAgICAqL1xuICAgICAgICBhbm9ueW1vdXMucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHZhciBlbnRyaWVzID0gdGhpcy5fX2VudHJpZXNfXztcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGdldEluZGV4KGVudHJpZXMsIGtleSk7XG5cbiAgICAgICAgICAgIGlmICh+aW5kZXgpIHtcbiAgICAgICAgICAgICAgICBlbnRyaWVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHBhcmFtIHsqfSBrZXlcclxuICAgICAgICAgKiBAcmV0dXJucyB7dm9pZH1cclxuICAgICAgICAgKi9cbiAgICAgICAgYW5vbnltb3VzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gISF+Z2V0SW5kZXgodGhpcy5fX2VudHJpZXNfXywga2V5KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAcmV0dXJucyB7dm9pZH1cclxuICAgICAgICAgKi9cbiAgICAgICAgYW5vbnltb3VzLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX19lbnRyaWVzX18uc3BsaWNlKDApO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXHJcbiAgICAgICAgICogQHBhcmFtIHsqfSBbY3R4PW51bGxdXHJcbiAgICAgICAgICogQHJldHVybnMge3ZvaWR9XHJcbiAgICAgICAgICovXG4gICAgICAgIGFub255bW91cy5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChjYWxsYmFjaywgY3R4KSB7XG4gICAgICAgICAgICB2YXIgdGhpcyQxID0gdGhpcztcbiAgICAgICAgICAgIGlmICggY3R4ID09PSB2b2lkIDAgKSBjdHggPSBudWxsO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGlzdCA9IHRoaXMkMS5fX2VudHJpZXNfXzsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICB2YXIgZW50cnkgPSBsaXN0W2ldO1xuXG4gICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjdHgsIGVudHJ5WzFdLCBlbnRyeVswXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoIGFub255bW91cy5wcm90b3R5cGUsIHByb3RvdHlwZUFjY2Vzc29ycyApO1xuXG4gICAgICAgIHJldHVybiBhbm9ueW1vdXM7XG4gICAgfSgpKTtcbn0pKCk7XG5cbi8qKlxyXG4gKiBEZXRlY3RzIHdoZXRoZXIgd2luZG93IGFuZCBkb2N1bWVudCBvYmplY3RzIGFyZSBhdmFpbGFibGUgaW4gY3VycmVudCBlbnZpcm9ubWVudC5cclxuICovXG52YXIgaXNCcm93c2VyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuZG9jdW1lbnQgPT09IGRvY3VtZW50O1xuXG4vLyBSZXR1cm5zIGdsb2JhbCBvYmplY3Qgb2YgYSBjdXJyZW50IGVudmlyb25tZW50LlxudmFyIGdsb2JhbCQxID0gKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgJiYgZ2xvYmFsLk1hdGggPT09IE1hdGgpIHtcbiAgICAgICAgcmV0dXJuIGdsb2JhbDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnICYmIHNlbGYuTWF0aCA9PT0gTWF0aCkge1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lk1hdGggPT09IE1hdGgpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdztcbiAgICB9XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmV3LWZ1bmNcbiAgICByZXR1cm4gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbn0pKCk7XG5cbi8qKlxyXG4gKiBBIHNoaW0gZm9yIHRoZSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgd2hpY2ggZmFsbHMgYmFjayB0byB0aGUgc2V0VGltZW91dCBpZlxyXG4gKiBmaXJzdCBvbmUgaXMgbm90IHN1cHBvcnRlZC5cclxuICpcclxuICogQHJldHVybnMge251bWJlcn0gUmVxdWVzdHMnIGlkZW50aWZpZXIuXHJcbiAqL1xudmFyIHJlcXVlc3RBbmltYXRpb25GcmFtZSQxID0gKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBJdCdzIHJlcXVpcmVkIHRvIHVzZSBhIGJvdW5kZWQgZnVuY3Rpb24gYmVjYXVzZSBJRSBzb21ldGltZXMgdGhyb3dzXG4gICAgICAgIC8vIGFuIFwiSW52YWxpZCBjYWxsaW5nIG9iamVjdFwiIGVycm9yIGlmIHJBRiBpcyBpbnZva2VkIHdpdGhvdXQgdGhlIGdsb2JhbFxuICAgICAgICAvLyBvYmplY3Qgb24gdGhlIGxlZnQgaGFuZCBzaWRlLlxuICAgICAgICByZXR1cm4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lLmJpbmQoZ2xvYmFsJDEpO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAoY2FsbGJhY2spIHsgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyByZXR1cm4gY2FsbGJhY2soRGF0ZS5ub3coKSk7IH0sIDEwMDAgLyA2MCk7IH07XG59KSgpO1xuXG4vLyBEZWZpbmVzIG1pbmltdW0gdGltZW91dCBiZWZvcmUgYWRkaW5nIGEgdHJhaWxpbmcgY2FsbC5cbnZhciB0cmFpbGluZ1RpbWVvdXQgPSAyO1xuXG4vKipcclxuICogQ3JlYXRlcyBhIHdyYXBwZXIgZnVuY3Rpb24gd2hpY2ggZW5zdXJlcyB0aGF0IHByb3ZpZGVkIGNhbGxiYWNrIHdpbGwgYmVcclxuICogaW52b2tlZCBvbmx5IG9uY2UgZHVyaW5nIHRoZSBzcGVjaWZpZWQgZGVsYXkgcGVyaW9kLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIGJlIGludm9rZWQgYWZ0ZXIgdGhlIGRlbGF5IHBlcmlvZC5cclxuICogQHBhcmFtIHtudW1iZXJ9IGRlbGF5IC0gRGVsYXkgYWZ0ZXIgd2hpY2ggdG8gaW52b2tlIGNhbGxiYWNrLlxyXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259XHJcbiAqL1xudmFyIHRocm90dGxlID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBkZWxheSkge1xuICAgIHZhciBsZWFkaW5nQ2FsbCA9IGZhbHNlLFxuICAgICAgICB0cmFpbGluZ0NhbGwgPSBmYWxzZSxcbiAgICAgICAgbGFzdENhbGxUaW1lID0gMDtcblxuICAgIC8qKlxyXG4gICAgICogSW52b2tlcyB0aGUgb3JpZ2luYWwgY2FsbGJhY2sgZnVuY3Rpb24gYW5kIHNjaGVkdWxlcyBuZXcgaW52b2NhdGlvbiBpZlxyXG4gICAgICogdGhlIFwicHJveHlcIiB3YXMgY2FsbGVkIGR1cmluZyBjdXJyZW50IHJlcXVlc3QuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge3ZvaWR9XHJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZXNvbHZlUGVuZGluZygpIHtcbiAgICAgICAgaWYgKGxlYWRpbmdDYWxsKSB7XG4gICAgICAgICAgICBsZWFkaW5nQ2FsbCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRyYWlsaW5nQ2FsbCkge1xuICAgICAgICAgICAgcHJveHkoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxyXG4gICAgICogQ2FsbGJhY2sgaW52b2tlZCBhZnRlciB0aGUgc3BlY2lmaWVkIGRlbGF5LiBJdCB3aWxsIGZ1cnRoZXIgcG9zdHBvbmVcclxuICAgICAqIGludm9jYXRpb24gb2YgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGRlbGVnYXRpbmcgaXQgdG8gdGhlXHJcbiAgICAgKiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge3ZvaWR9XHJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0aW1lb3V0Q2FsbGJhY2soKSB7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSQxKHJlc29sdmVQZW5kaW5nKTtcbiAgICB9XG5cbiAgICAvKipcclxuICAgICAqIFNjaGVkdWxlcyBpbnZvY2F0aW9uIG9mIHRoZSBvcmlnaW5hbCBmdW5jdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7dm9pZH1cclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHByb3h5KCkge1xuICAgICAgICB2YXIgdGltZVN0YW1wID0gRGF0ZS5ub3coKTtcblxuICAgICAgICBpZiAobGVhZGluZ0NhbGwpIHtcbiAgICAgICAgICAgIC8vIFJlamVjdCBpbW1lZGlhdGVseSBmb2xsb3dpbmcgY2FsbHMuXG4gICAgICAgICAgICBpZiAodGltZVN0YW1wIC0gbGFzdENhbGxUaW1lIDwgdHJhaWxpbmdUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTY2hlZHVsZSBuZXcgY2FsbCB0byBiZSBpbiBpbnZva2VkIHdoZW4gdGhlIHBlbmRpbmcgb25lIGlzIHJlc29sdmVkLlxuICAgICAgICAgICAgLy8gVGhpcyBpcyBpbXBvcnRhbnQgZm9yIFwidHJhbnNpdGlvbnNcIiB3aGljaCBuZXZlciBhY3R1YWxseSBzdGFydFxuICAgICAgICAgICAgLy8gaW1tZWRpYXRlbHkgc28gdGhlcmUgaXMgYSBjaGFuY2UgdGhhdCB3ZSBtaWdodCBtaXNzIG9uZSBpZiBjaGFuZ2VcbiAgICAgICAgICAgIC8vIGhhcHBlbnMgYW1pZHMgdGhlIHBlbmRpbmcgaW52b2NhdGlvbi5cbiAgICAgICAgICAgIHRyYWlsaW5nQ2FsbCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZWFkaW5nQ2FsbCA9IHRydWU7XG4gICAgICAgICAgICB0cmFpbGluZ0NhbGwgPSBmYWxzZTtcblxuICAgICAgICAgICAgc2V0VGltZW91dCh0aW1lb3V0Q2FsbGJhY2ssIGRlbGF5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxhc3RDYWxsVGltZSA9IHRpbWVTdGFtcDtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJveHk7XG59O1xuXG4vLyBNaW5pbXVtIGRlbGF5IGJlZm9yZSBpbnZva2luZyB0aGUgdXBkYXRlIG9mIG9ic2VydmVycy5cbnZhciBSRUZSRVNIX0RFTEFZID0gMjA7XG5cbi8vIEEgbGlzdCBvZiBzdWJzdHJpbmdzIG9mIENTUyBwcm9wZXJ0aWVzIHVzZWQgdG8gZmluZCB0cmFuc2l0aW9uIGV2ZW50cyB0aGF0XG4vLyBtaWdodCBhZmZlY3QgZGltZW5zaW9ucyBvZiBvYnNlcnZlZCBlbGVtZW50cy5cbnZhciB0cmFuc2l0aW9uS2V5cyA9IFsndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbScsICdsZWZ0JywgJ3dpZHRoJywgJ2hlaWdodCcsICdzaXplJywgJ3dlaWdodCddO1xuXG4vLyBDaGVjayBpZiBNdXRhdGlvbk9ic2VydmVyIGlzIGF2YWlsYWJsZS5cbnZhciBtdXRhdGlvbk9ic2VydmVyU3VwcG9ydGVkID0gdHlwZW9mIE11dGF0aW9uT2JzZXJ2ZXIgIT09ICd1bmRlZmluZWQnO1xuXG4vKipcclxuICogU2luZ2xldG9uIGNvbnRyb2xsZXIgY2xhc3Mgd2hpY2ggaGFuZGxlcyB1cGRhdGVzIG9mIFJlc2l6ZU9ic2VydmVyIGluc3RhbmNlcy5cclxuICovXG52YXIgUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jb25uZWN0ZWRfID0gZmFsc2U7XG4gICAgdGhpcy5tdXRhdGlvbkV2ZW50c0FkZGVkXyA9IGZhbHNlO1xuICAgIHRoaXMubXV0YXRpb25zT2JzZXJ2ZXJfID0gbnVsbDtcbiAgICB0aGlzLm9ic2VydmVyc18gPSBbXTtcblxuICAgIHRoaXMub25UcmFuc2l0aW9uRW5kXyA9IHRoaXMub25UcmFuc2l0aW9uRW5kXy5iaW5kKHRoaXMpO1xuICAgIHRoaXMucmVmcmVzaCA9IHRocm90dGxlKHRoaXMucmVmcmVzaC5iaW5kKHRoaXMpLCBSRUZSRVNIX0RFTEFZKTtcbn07XG5cbi8qKlxyXG4gKiBBZGRzIG9ic2VydmVyIHRvIG9ic2VydmVycyBsaXN0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge1Jlc2l6ZU9ic2VydmVyU1BJfSBvYnNlcnZlciAtIE9ic2VydmVyIHRvIGJlIGFkZGVkLlxyXG4gKiBAcmV0dXJucyB7dm9pZH1cclxuICovXG5cblxuLyoqXHJcbiAqIEhvbGRzIHJlZmVyZW5jZSB0byB0aGUgY29udHJvbGxlcidzIGluc3RhbmNlLlxyXG4gKlxyXG4gKiBAcHJpdmF0ZSB7UmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyfVxyXG4gKi9cblxuXG4vKipcclxuICogS2VlcHMgcmVmZXJlbmNlIHRvIHRoZSBpbnN0YW5jZSBvZiBNdXRhdGlvbk9ic2VydmVyLlxyXG4gKlxyXG4gKiBAcHJpdmF0ZSB7TXV0YXRpb25PYnNlcnZlcn1cclxuICovXG5cbi8qKlxyXG4gKiBJbmRpY2F0ZXMgd2hldGhlciBET00gbGlzdGVuZXJzIGhhdmUgYmVlbiBhZGRlZC5cclxuICpcclxuICogQHByaXZhdGUge2Jvb2xlYW59XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLnByb3RvdHlwZS5hZGRPYnNlcnZlciA9IGZ1bmN0aW9uIChvYnNlcnZlcikge1xuICAgIGlmICghfnRoaXMub2JzZXJ2ZXJzXy5pbmRleE9mKG9ic2VydmVyKSkge1xuICAgICAgICB0aGlzLm9ic2VydmVyc18ucHVzaChvYnNlcnZlcik7XG4gICAgfVxuXG4gICAgLy8gQWRkIGxpc3RlbmVycyBpZiB0aGV5IGhhdmVuJ3QgYmVlbiBhZGRlZCB5ZXQuXG4gICAgaWYgKCF0aGlzLmNvbm5lY3RlZF8pIHtcbiAgICAgICAgdGhpcy5jb25uZWN0XygpO1xuICAgIH1cbn07XG5cbi8qKlxyXG4gKiBSZW1vdmVzIG9ic2VydmVyIGZyb20gb2JzZXJ2ZXJzIGxpc3QuXHJcbiAqXHJcbiAqIEBwYXJhbSB7UmVzaXplT2JzZXJ2ZXJTUEl9IG9ic2VydmVyIC0gT2JzZXJ2ZXIgdG8gYmUgcmVtb3ZlZC5cclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLnByb3RvdHlwZS5yZW1vdmVPYnNlcnZlciA9IGZ1bmN0aW9uIChvYnNlcnZlcikge1xuICAgIHZhciBvYnNlcnZlcnMgPSB0aGlzLm9ic2VydmVyc187XG4gICAgdmFyIGluZGV4ID0gb2JzZXJ2ZXJzLmluZGV4T2Yob2JzZXJ2ZXIpO1xuXG4gICAgLy8gUmVtb3ZlIG9ic2VydmVyIGlmIGl0J3MgcHJlc2VudCBpbiByZWdpc3RyeS5cbiAgICBpZiAofmluZGV4KSB7XG4gICAgICAgIG9ic2VydmVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZSBsaXN0ZW5lcnMgaWYgY29udHJvbGxlciBoYXMgbm8gY29ubmVjdGVkIG9ic2VydmVycy5cbiAgICBpZiAoIW9ic2VydmVycy5sZW5ndGggJiYgdGhpcy5jb25uZWN0ZWRfKSB7XG4gICAgICAgIHRoaXMuZGlzY29ubmVjdF8oKTtcbiAgICB9XG59O1xuXG4vKipcclxuICogSW52b2tlcyB0aGUgdXBkYXRlIG9mIG9ic2VydmVycy4gSXQgd2lsbCBjb250aW51ZSBydW5uaW5nIHVwZGF0ZXMgaW5zb2ZhclxyXG4gKiBpdCBkZXRlY3RzIGNoYW5nZXMuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHt2b2lkfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5wcm90b3R5cGUucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2hhbmdlc0RldGVjdGVkID0gdGhpcy51cGRhdGVPYnNlcnZlcnNfKCk7XG5cbiAgICAvLyBDb250aW51ZSBydW5uaW5nIHVwZGF0ZXMgaWYgY2hhbmdlcyBoYXZlIGJlZW4gZGV0ZWN0ZWQgYXMgdGhlcmUgbWlnaHRcbiAgICAvLyBiZSBmdXR1cmUgb25lcyBjYXVzZWQgYnkgQ1NTIHRyYW5zaXRpb25zLlxuICAgIGlmIChjaGFuZ2VzRGV0ZWN0ZWQpIHtcbiAgICAgICAgdGhpcy5yZWZyZXNoKCk7XG4gICAgfVxufTtcblxuLyoqXHJcbiAqIFVwZGF0ZXMgZXZlcnkgb2JzZXJ2ZXIgZnJvbSBvYnNlcnZlcnMgbGlzdCBhbmQgbm90aWZpZXMgdGhlbSBvZiBxdWV1ZWRcclxuICogZW50cmllcy5cclxuICpcclxuICogQHByaXZhdGVcclxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgXCJ0cnVlXCIgaWYgYW55IG9ic2VydmVyIGhhcyBkZXRlY3RlZCBjaGFuZ2VzIGluXHJcbiAqICBkaW1lbnNpb25zIG9mIGl0J3MgZWxlbWVudHMuXHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVPYnNlcnZlcnNfID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIENvbGxlY3Qgb2JzZXJ2ZXJzIHRoYXQgaGF2ZSBhY3RpdmUgb2JzZXJ2YXRpb25zLlxuICAgIHZhciBhY3RpdmVPYnNlcnZlcnMgPSB0aGlzLm9ic2VydmVyc18uZmlsdGVyKGZ1bmN0aW9uIChvYnNlcnZlcikge1xuICAgICAgICByZXR1cm4gb2JzZXJ2ZXIuZ2F0aGVyQWN0aXZlKCksIG9ic2VydmVyLmhhc0FjdGl2ZSgpO1xuICAgIH0pO1xuXG4gICAgLy8gRGVsaXZlciBub3RpZmljYXRpb25zIGluIGEgc2VwYXJhdGUgY3ljbGUgaW4gb3JkZXIgdG8gYXZvaWQgYW55XG4gICAgLy8gY29sbGlzaW9ucyBiZXR3ZWVuIG9ic2VydmVycywgZS5nLiB3aGVuIG11bHRpcGxlIGluc3RhbmNlcyBvZlxuICAgIC8vIFJlc2l6ZU9ic2VydmVyIGFyZSB0cmFja2luZyB0aGUgc2FtZSBlbGVtZW50IGFuZCB0aGUgY2FsbGJhY2sgb2Ygb25lXG4gICAgLy8gb2YgdGhlbSBjaGFuZ2VzIGNvbnRlbnQgZGltZW5zaW9ucyBvZiB0aGUgb2JzZXJ2ZWQgdGFyZ2V0LiBTb21ldGltZXNcbiAgICAvLyB0aGlzIG1heSByZXN1bHQgaW4gbm90aWZpY2F0aW9ucyBiZWluZyBibG9ja2VkIGZvciB0aGUgcmVzdCBvZiBvYnNlcnZlcnMuXG4gICAgYWN0aXZlT2JzZXJ2ZXJzLmZvckVhY2goZnVuY3Rpb24gKG9ic2VydmVyKSB7IHJldHVybiBvYnNlcnZlci5icm9hZGNhc3RBY3RpdmUoKTsgfSk7XG5cbiAgICByZXR1cm4gYWN0aXZlT2JzZXJ2ZXJzLmxlbmd0aCA+IDA7XG59O1xuXG4vKipcclxuICogSW5pdGlhbGl6ZXMgRE9NIGxpc3RlbmVycy5cclxuICpcclxuICogQHByaXZhdGVcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLnByb3RvdHlwZS5jb25uZWN0XyA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBEbyBub3RoaW5nIGlmIHJ1bm5pbmcgaW4gYSBub24tYnJvd3NlciBlbnZpcm9ubWVudCBvciBpZiBsaXN0ZW5lcnNcbiAgICAvLyBoYXZlIGJlZW4gYWxyZWFkeSBhZGRlZC5cbiAgICBpZiAoIWlzQnJvd3NlciB8fCB0aGlzLmNvbm5lY3RlZF8pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmlwdGlvbiB0byB0aGUgXCJUcmFuc2l0aW9uZW5kXCIgZXZlbnQgaXMgdXNlZCBhcyBhIHdvcmthcm91bmQgZm9yXG4gICAgLy8gZGVsYXllZCB0cmFuc2l0aW9ucy4gVGhpcyB3YXkgaXQncyBwb3NzaWJsZSB0byBjYXB0dXJlIGF0IGxlYXN0IHRoZVxuICAgIC8vIGZpbmFsIHN0YXRlIG9mIGFuIGVsZW1lbnQuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIHRoaXMub25UcmFuc2l0aW9uRW5kXyk7XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5yZWZyZXNoKTtcblxuICAgIGlmIChtdXRhdGlvbk9ic2VydmVyU3VwcG9ydGVkKSB7XG4gICAgICAgIHRoaXMubXV0YXRpb25zT2JzZXJ2ZXJfID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIodGhpcy5yZWZyZXNoKTtcblxuICAgICAgICB0aGlzLm11dGF0aW9uc09ic2VydmVyXy5vYnNlcnZlKGRvY3VtZW50LCB7XG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgICAgY2hhcmFjdGVyRGF0YTogdHJ1ZSxcbiAgICAgICAgICAgIHN1YnRyZWU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NU3VidHJlZU1vZGlmaWVkJywgdGhpcy5yZWZyZXNoKTtcblxuICAgICAgICB0aGlzLm11dGF0aW9uRXZlbnRzQWRkZWRfID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbm5lY3RlZF8gPSB0cnVlO1xufTtcblxuLyoqXHJcbiAqIFJlbW92ZXMgRE9NIGxpc3RlbmVycy5cclxuICpcclxuICogQHByaXZhdGVcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLnByb3RvdHlwZS5kaXNjb25uZWN0XyA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBEbyBub3RoaW5nIGlmIHJ1bm5pbmcgaW4gYSBub24tYnJvd3NlciBlbnZpcm9ubWVudCBvciBpZiBsaXN0ZW5lcnNcbiAgICAvLyBoYXZlIGJlZW4gYWxyZWFkeSByZW1vdmVkLlxuICAgIGlmICghaXNCcm93c2VyIHx8ICF0aGlzLmNvbm5lY3RlZF8pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCB0aGlzLm9uVHJhbnNpdGlvbkVuZF8pO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLnJlZnJlc2gpO1xuXG4gICAgaWYgKHRoaXMubXV0YXRpb25zT2JzZXJ2ZXJfKSB7XG4gICAgICAgIHRoaXMubXV0YXRpb25zT2JzZXJ2ZXJfLmRpc2Nvbm5lY3QoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5tdXRhdGlvbkV2ZW50c0FkZGVkXykge1xuICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdET01TdWJ0cmVlTW9kaWZpZWQnLCB0aGlzLnJlZnJlc2gpO1xuICAgIH1cblxuICAgIHRoaXMubXV0YXRpb25zT2JzZXJ2ZXJfID0gbnVsbDtcbiAgICB0aGlzLm11dGF0aW9uRXZlbnRzQWRkZWRfID0gZmFsc2U7XG4gICAgdGhpcy5jb25uZWN0ZWRfID0gZmFsc2U7XG59O1xuXG4vKipcclxuICogXCJUcmFuc2l0aW9uZW5kXCIgZXZlbnQgaGFuZGxlci5cclxuICpcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtIHtUcmFuc2l0aW9uRXZlbnR9IGV2ZW50XHJcbiAqIEByZXR1cm5zIHt2b2lkfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5wcm90b3R5cGUub25UcmFuc2l0aW9uRW5kXyA9IGZ1bmN0aW9uIChyZWYpIHtcbiAgICAgICAgdmFyIHByb3BlcnR5TmFtZSA9IHJlZi5wcm9wZXJ0eU5hbWU7IGlmICggcHJvcGVydHlOYW1lID09PSB2b2lkIDAgKSBwcm9wZXJ0eU5hbWUgPSAnJztcblxuICAgIC8vIERldGVjdCB3aGV0aGVyIHRyYW5zaXRpb24gbWF5IGFmZmVjdCBkaW1lbnNpb25zIG9mIGFuIGVsZW1lbnQuXG4gICAgdmFyIGlzUmVmbG93UHJvcGVydHkgPSB0cmFuc2l0aW9uS2V5cy5zb21lKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgcmV0dXJuICEhfnByb3BlcnR5TmFtZS5pbmRleE9mKGtleSk7XG4gICAgfSk7XG5cbiAgICBpZiAoaXNSZWZsb3dQcm9wZXJ0eSkge1xuICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICB9XG59O1xuXG4vKipcclxuICogUmV0dXJucyBpbnN0YW5jZSBvZiB0aGUgUmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7UmVzaXplT2JzZXJ2ZXJDb250cm9sbGVyfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5nZXRJbnN0YW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuaW5zdGFuY2VfKSB7XG4gICAgICAgIHRoaXMuaW5zdGFuY2VfID0gbmV3IFJlc2l6ZU9ic2VydmVyQ29udHJvbGxlcigpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmluc3RhbmNlXztcbn07XG5cblJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5pbnN0YW5jZV8gPSBudWxsO1xuXG4vKipcclxuICogRGVmaW5lcyBub24td3JpdGFibGUvZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIHRoZSBwcm92aWRlZCB0YXJnZXQgb2JqZWN0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0IC0gT2JqZWN0IGZvciB3aGljaCB0byBkZWZpbmUgcHJvcGVydGllcy5cclxuICogQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gUHJvcGVydGllcyB0byBiZSBkZWZpbmVkLlxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBUYXJnZXQgb2JqZWN0LlxyXG4gKi9cbnZhciBkZWZpbmVDb25maWd1cmFibGUgPSAoZnVuY3Rpb24gKHRhcmdldCwgcHJvcHMpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGlzdCA9IE9iamVjdC5rZXlzKHByb3BzKTsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIGtleSA9IGxpc3RbaV07XG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCB7XG4gICAgICAgICAgICB2YWx1ZTogcHJvcHNba2V5XSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB0YXJnZXQ7XG59KTtcblxuLyoqXHJcbiAqIFJldHVybnMgdGhlIGdsb2JhbCBvYmplY3QgYXNzb2NpYXRlZCB3aXRoIHByb3ZpZGVkIGVsZW1lbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXRcclxuICogQHJldHVybnMge09iamVjdH1cclxuICovXG52YXIgZ2V0V2luZG93T2YgPSAoZnVuY3Rpb24gKHRhcmdldCkge1xuICAgIC8vIEFzc3VtZSB0aGF0IHRoZSBlbGVtZW50IGlzIGFuIGluc3RhbmNlIG9mIE5vZGUsIHdoaWNoIG1lYW5zIHRoYXQgaXRcbiAgICAvLyBoYXMgdGhlIFwib3duZXJEb2N1bWVudFwiIHByb3BlcnR5IGZyb20gd2hpY2ggd2UgY2FuIHJldHJpZXZlIGFcbiAgICAvLyBjb3JyZXNwb25kaW5nIGdsb2JhbCBvYmplY3QuXG4gICAgdmFyIG93bmVyR2xvYmFsID0gdGFyZ2V0ICYmIHRhcmdldC5vd25lckRvY3VtZW50ICYmIHRhcmdldC5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3O1xuXG4gICAgLy8gUmV0dXJuIHRoZSBsb2NhbCBnbG9iYWwgb2JqZWN0IGlmIGl0J3Mgbm90IHBvc3NpYmxlIGV4dHJhY3Qgb25lIGZyb21cbiAgICAvLyBwcm92aWRlZCBlbGVtZW50LlxuICAgIHJldHVybiBvd25lckdsb2JhbCB8fCBnbG9iYWwkMTtcbn0pO1xuXG4vLyBQbGFjZWhvbGRlciBvZiBhbiBlbXB0eSBjb250ZW50IHJlY3RhbmdsZS5cbnZhciBlbXB0eVJlY3QgPSBjcmVhdGVSZWN0SW5pdCgwLCAwLCAwLCAwKTtcblxuLyoqXHJcbiAqIENvbnZlcnRzIHByb3ZpZGVkIHN0cmluZyB0byBhIG51bWJlci5cclxuICpcclxuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSB2YWx1ZVxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gKi9cbmZ1bmN0aW9uIHRvRmxvYXQodmFsdWUpIHtcbiAgICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZSkgfHwgMDtcbn1cblxuLyoqXHJcbiAqIEV4dHJhY3RzIGJvcmRlcnMgc2l6ZSBmcm9tIHByb3ZpZGVkIHN0eWxlcy5cclxuICpcclxuICogQHBhcmFtIHtDU1NTdHlsZURlY2xhcmF0aW9ufSBzdHlsZXNcclxuICogQHBhcmFtIHsuLi5zdHJpbmd9IHBvc2l0aW9ucyAtIEJvcmRlcnMgcG9zaXRpb25zICh0b3AsIHJpZ2h0LCAuLi4pXHJcbiAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAqL1xuZnVuY3Rpb24gZ2V0Qm9yZGVyc1NpemUoc3R5bGVzKSB7XG4gICAgdmFyIHBvc2l0aW9ucyA9IFtdLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoIC0gMTtcbiAgICB3aGlsZSAoIGxlbi0tID4gMCApIHBvc2l0aW9uc1sgbGVuIF0gPSBhcmd1bWVudHNbIGxlbiArIDEgXTtcblxuICAgIHJldHVybiBwb3NpdGlvbnMucmVkdWNlKGZ1bmN0aW9uIChzaXplLCBwb3NpdGlvbikge1xuICAgICAgICB2YXIgdmFsdWUgPSBzdHlsZXNbJ2JvcmRlci0nICsgcG9zaXRpb24gKyAnLXdpZHRoJ107XG5cbiAgICAgICAgcmV0dXJuIHNpemUgKyB0b0Zsb2F0KHZhbHVlKTtcbiAgICB9LCAwKTtcbn1cblxuLyoqXHJcbiAqIEV4dHJhY3RzIHBhZGRpbmdzIHNpemVzIGZyb20gcHJvdmlkZWQgc3R5bGVzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0NTU1N0eWxlRGVjbGFyYXRpb259IHN0eWxlc1xyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBQYWRkaW5ncyBib3guXHJcbiAqL1xuZnVuY3Rpb24gZ2V0UGFkZGluZ3Moc3R5bGVzKSB7XG4gICAgdmFyIHBvc2l0aW9ucyA9IFsndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbScsICdsZWZ0J107XG4gICAgdmFyIHBhZGRpbmdzID0ge307XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbGlzdCA9IHBvc2l0aW9uczsgaSA8IGxpc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIHBvc2l0aW9uID0gbGlzdFtpXTtcblxuICAgICAgICB2YXIgdmFsdWUgPSBzdHlsZXNbJ3BhZGRpbmctJyArIHBvc2l0aW9uXTtcblxuICAgICAgICBwYWRkaW5nc1twb3NpdGlvbl0gPSB0b0Zsb2F0KHZhbHVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFkZGluZ3M7XG59XG5cbi8qKlxyXG4gKiBDYWxjdWxhdGVzIGNvbnRlbnQgcmVjdGFuZ2xlIG9mIHByb3ZpZGVkIFNWRyBlbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge1NWR0dyYXBoaWNzRWxlbWVudH0gdGFyZ2V0IC0gRWxlbWVudCBjb250ZW50IHJlY3RhbmdsZSBvZiB3aGljaCBuZWVkc1xyXG4gKiAgICAgIHRvIGJlIGNhbGN1bGF0ZWQuXHJcbiAqIEByZXR1cm5zIHtET01SZWN0SW5pdH1cclxuICovXG5mdW5jdGlvbiBnZXRTVkdDb250ZW50UmVjdCh0YXJnZXQpIHtcbiAgICB2YXIgYmJveCA9IHRhcmdldC5nZXRCQm94KCk7XG5cbiAgICByZXR1cm4gY3JlYXRlUmVjdEluaXQoMCwgMCwgYmJveC53aWR0aCwgYmJveC5oZWlnaHQpO1xufVxuXG4vKipcclxuICogQ2FsY3VsYXRlcyBjb250ZW50IHJlY3RhbmdsZSBvZiBwcm92aWRlZCBIVE1MRWxlbWVudC5cclxuICpcclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0IC0gRWxlbWVudCBmb3Igd2hpY2ggdG8gY2FsY3VsYXRlIHRoZSBjb250ZW50IHJlY3RhbmdsZS5cclxuICogQHJldHVybnMge0RPTVJlY3RJbml0fVxyXG4gKi9cbmZ1bmN0aW9uIGdldEhUTUxFbGVtZW50Q29udGVudFJlY3QodGFyZ2V0KSB7XG4gICAgLy8gQ2xpZW50IHdpZHRoICYgaGVpZ2h0IHByb3BlcnRpZXMgY2FuJ3QgYmVcbiAgICAvLyB1c2VkIGV4Y2x1c2l2ZWx5IGFzIHRoZXkgcHJvdmlkZSByb3VuZGVkIHZhbHVlcy5cbiAgICB2YXIgY2xpZW50V2lkdGggPSB0YXJnZXQuY2xpZW50V2lkdGg7XG4gICAgdmFyIGNsaWVudEhlaWdodCA9IHRhcmdldC5jbGllbnRIZWlnaHQ7XG5cbiAgICAvLyBCeSB0aGlzIGNvbmRpdGlvbiB3ZSBjYW4gY2F0Y2ggYWxsIG5vbi1yZXBsYWNlZCBpbmxpbmUsIGhpZGRlbiBhbmRcbiAgICAvLyBkZXRhY2hlZCBlbGVtZW50cy4gVGhvdWdoIGVsZW1lbnRzIHdpdGggd2lkdGggJiBoZWlnaHQgcHJvcGVydGllcyBsZXNzXG4gICAgLy8gdGhhbiAwLjUgd2lsbCBiZSBkaXNjYXJkZWQgYXMgd2VsbC5cbiAgICAvL1xuICAgIC8vIFdpdGhvdXQgaXQgd2Ugd291bGQgbmVlZCB0byBpbXBsZW1lbnQgc2VwYXJhdGUgbWV0aG9kcyBmb3IgZWFjaCBvZlxuICAgIC8vIHRob3NlIGNhc2VzIGFuZCBpdCdzIG5vdCBwb3NzaWJsZSB0byBwZXJmb3JtIGEgcHJlY2lzZSBhbmQgcGVyZm9ybWFuY2VcbiAgICAvLyBlZmZlY3RpdmUgdGVzdCBmb3IgaGlkZGVuIGVsZW1lbnRzLiBFLmcuIGV2ZW4galF1ZXJ5J3MgJzp2aXNpYmxlJyBmaWx0ZXJcbiAgICAvLyBnaXZlcyB3cm9uZyByZXN1bHRzIGZvciBlbGVtZW50cyB3aXRoIHdpZHRoICYgaGVpZ2h0IGxlc3MgdGhhbiAwLjUuXG4gICAgaWYgKCFjbGllbnRXaWR0aCAmJiAhY2xpZW50SGVpZ2h0KSB7XG4gICAgICAgIHJldHVybiBlbXB0eVJlY3Q7XG4gICAgfVxuXG4gICAgdmFyIHN0eWxlcyA9IGdldFdpbmRvd09mKHRhcmdldCkuZ2V0Q29tcHV0ZWRTdHlsZSh0YXJnZXQpO1xuICAgIHZhciBwYWRkaW5ncyA9IGdldFBhZGRpbmdzKHN0eWxlcyk7XG4gICAgdmFyIGhvcml6UGFkID0gcGFkZGluZ3MubGVmdCArIHBhZGRpbmdzLnJpZ2h0O1xuICAgIHZhciB2ZXJ0UGFkID0gcGFkZGluZ3MudG9wICsgcGFkZGluZ3MuYm90dG9tO1xuXG4gICAgLy8gQ29tcHV0ZWQgc3R5bGVzIG9mIHdpZHRoICYgaGVpZ2h0IGFyZSBiZWluZyB1c2VkIGJlY2F1c2UgdGhleSBhcmUgdGhlXG4gICAgLy8gb25seSBkaW1lbnNpb25zIGF2YWlsYWJsZSB0byBKUyB0aGF0IGNvbnRhaW4gbm9uLXJvdW5kZWQgdmFsdWVzLiBJdCBjb3VsZFxuICAgIC8vIGJlIHBvc3NpYmxlIHRvIHV0aWxpemUgdGhlIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBpZiBvbmx5IGl0J3MgZGF0YSB3YXNuJ3RcbiAgICAvLyBhZmZlY3RlZCBieSBDU1MgdHJhbnNmb3JtYXRpb25zIGxldCBhbG9uZSBwYWRkaW5ncywgYm9yZGVycyBhbmQgc2Nyb2xsIGJhcnMuXG4gICAgdmFyIHdpZHRoID0gdG9GbG9hdChzdHlsZXMud2lkdGgpLFxuICAgICAgICBoZWlnaHQgPSB0b0Zsb2F0KHN0eWxlcy5oZWlnaHQpO1xuXG4gICAgLy8gV2lkdGggJiBoZWlnaHQgaW5jbHVkZSBwYWRkaW5ncyBhbmQgYm9yZGVycyB3aGVuIHRoZSAnYm9yZGVyLWJveCcgYm94XG4gICAgLy8gbW9kZWwgaXMgYXBwbGllZCAoZXhjZXB0IGZvciBJRSkuXG4gICAgaWYgKHN0eWxlcy5ib3hTaXppbmcgPT09ICdib3JkZXItYm94Jykge1xuICAgICAgICAvLyBGb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgcmVxdWlyZWQgdG8gaGFuZGxlIEludGVybmV0IEV4cGxvcmVyIHdoaWNoXG4gICAgICAgIC8vIGRvZXNuJ3QgaW5jbHVkZSBwYWRkaW5ncyBhbmQgYm9yZGVycyB0byBjb21wdXRlZCBDU1MgZGltZW5zaW9ucy5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gV2UgY2FuIHNheSB0aGF0IGlmIENTUyBkaW1lbnNpb25zICsgcGFkZGluZ3MgYXJlIGVxdWFsIHRvIHRoZSBcImNsaWVudFwiXG4gICAgICAgIC8vIHByb3BlcnRpZXMgdGhlbiBpdCdzIGVpdGhlciBJRSwgYW5kIHRodXMgd2UgZG9uJ3QgbmVlZCB0byBzdWJ0cmFjdFxuICAgICAgICAvLyBhbnl0aGluZywgb3IgYW4gZWxlbWVudCBtZXJlbHkgZG9lc24ndCBoYXZlIHBhZGRpbmdzL2JvcmRlcnMgc3R5bGVzLlxuICAgICAgICBpZiAoTWF0aC5yb3VuZCh3aWR0aCArIGhvcml6UGFkKSAhPT0gY2xpZW50V2lkdGgpIHtcbiAgICAgICAgICAgIHdpZHRoIC09IGdldEJvcmRlcnNTaXplKHN0eWxlcywgJ2xlZnQnLCAncmlnaHQnKSArIGhvcml6UGFkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKE1hdGgucm91bmQoaGVpZ2h0ICsgdmVydFBhZCkgIT09IGNsaWVudEhlaWdodCkge1xuICAgICAgICAgICAgaGVpZ2h0IC09IGdldEJvcmRlcnNTaXplKHN0eWxlcywgJ3RvcCcsICdib3R0b20nKSArIHZlcnRQYWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGb2xsb3dpbmcgc3RlcHMgY2FuJ3QgYmUgYXBwbGllZCB0byB0aGUgZG9jdW1lbnQncyByb290IGVsZW1lbnQgYXMgaXRzXG4gICAgLy8gY2xpZW50W1dpZHRoL0hlaWdodF0gcHJvcGVydGllcyByZXByZXNlbnQgdmlld3BvcnQgYXJlYSBvZiB0aGUgd2luZG93LlxuICAgIC8vIEJlc2lkZXMsIGl0J3MgYXMgd2VsbCBub3QgbmVjZXNzYXJ5IGFzIHRoZSA8aHRtbD4gaXRzZWxmIG5laXRoZXIgaGFzXG4gICAgLy8gcmVuZGVyZWQgc2Nyb2xsIGJhcnMgbm9yIGl0IGNhbiBiZSBjbGlwcGVkLlxuICAgIGlmICghaXNEb2N1bWVudEVsZW1lbnQodGFyZ2V0KSkge1xuICAgICAgICAvLyBJbiBzb21lIGJyb3dzZXJzIChvbmx5IGluIEZpcmVmb3gsIGFjdHVhbGx5KSBDU1Mgd2lkdGggJiBoZWlnaHRcbiAgICAgICAgLy8gaW5jbHVkZSBzY3JvbGwgYmFycyBzaXplIHdoaWNoIGNhbiBiZSByZW1vdmVkIGF0IHRoaXMgc3RlcCBhcyBzY3JvbGxcbiAgICAgICAgLy8gYmFycyBhcmUgdGhlIG9ubHkgZGlmZmVyZW5jZSBiZXR3ZWVuIHJvdW5kZWQgZGltZW5zaW9ucyArIHBhZGRpbmdzXG4gICAgICAgIC8vIGFuZCBcImNsaWVudFwiIHByb3BlcnRpZXMsIHRob3VnaCB0aGF0IGlzIG5vdCBhbHdheXMgdHJ1ZSBpbiBDaHJvbWUuXG4gICAgICAgIHZhciB2ZXJ0U2Nyb2xsYmFyID0gTWF0aC5yb3VuZCh3aWR0aCArIGhvcml6UGFkKSAtIGNsaWVudFdpZHRoO1xuICAgICAgICB2YXIgaG9yaXpTY3JvbGxiYXIgPSBNYXRoLnJvdW5kKGhlaWdodCArIHZlcnRQYWQpIC0gY2xpZW50SGVpZ2h0O1xuXG4gICAgICAgIC8vIENocm9tZSBoYXMgYSByYXRoZXIgd2VpcmQgcm91bmRpbmcgb2YgXCJjbGllbnRcIiBwcm9wZXJ0aWVzLlxuICAgICAgICAvLyBFLmcuIGZvciBhbiBlbGVtZW50IHdpdGggY29udGVudCB3aWR0aCBvZiAzMTQuMnB4IGl0IHNvbWV0aW1lcyBnaXZlc1xuICAgICAgICAvLyB0aGUgY2xpZW50IHdpZHRoIG9mIDMxNXB4IGFuZCBmb3IgdGhlIHdpZHRoIG9mIDMxNC43cHggaXQgbWF5IGdpdmVcbiAgICAgICAgLy8gMzE0cHguIEFuZCBpdCBkb2Vzbid0IGhhcHBlbiBhbGwgdGhlIHRpbWUuIFNvIGp1c3QgaWdub3JlIHRoaXMgZGVsdGFcbiAgICAgICAgLy8gYXMgYSBub24tcmVsZXZhbnQuXG4gICAgICAgIGlmIChNYXRoLmFicyh2ZXJ0U2Nyb2xsYmFyKSAhPT0gMSkge1xuICAgICAgICAgICAgd2lkdGggLT0gdmVydFNjcm9sbGJhcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChNYXRoLmFicyhob3JpelNjcm9sbGJhcikgIT09IDEpIHtcbiAgICAgICAgICAgIGhlaWdodCAtPSBob3JpelNjcm9sbGJhcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjcmVhdGVSZWN0SW5pdChwYWRkaW5ncy5sZWZ0LCBwYWRkaW5ncy50b3AsIHdpZHRoLCBoZWlnaHQpO1xufVxuXG4vKipcclxuICogQ2hlY2tzIHdoZXRoZXIgcHJvdmlkZWQgZWxlbWVudCBpcyBhbiBpbnN0YW5jZSBvZiB0aGUgU1ZHR3JhcGhpY3NFbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCAtIEVsZW1lbnQgdG8gYmUgY2hlY2tlZC5cclxuICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAqL1xudmFyIGlzU1ZHR3JhcGhpY3NFbGVtZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICAvLyBTb21lIGJyb3dzZXJzLCBuYW1lbHkgSUUgYW5kIEVkZ2UsIGRvbid0IGhhdmUgdGhlIFNWR0dyYXBoaWNzRWxlbWVudFxuICAgIC8vIGludGVyZmFjZS5cbiAgICBpZiAodHlwZW9mIFNWR0dyYXBoaWNzRWxlbWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQpIHsgcmV0dXJuIHRhcmdldCBpbnN0YW5jZW9mIGdldFdpbmRvd09mKHRhcmdldCkuU1ZHR3JhcGhpY3NFbGVtZW50OyB9O1xuICAgIH1cblxuICAgIC8vIElmIGl0J3Mgc28sIHRoZW4gY2hlY2sgdGhhdCBlbGVtZW50IGlzIGF0IGxlYXN0IGFuIGluc3RhbmNlIG9mIHRoZVxuICAgIC8vIFNWR0VsZW1lbnQgYW5kIHRoYXQgaXQgaGFzIHRoZSBcImdldEJCb3hcIiBtZXRob2QuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWV4dHJhLXBhcmVuc1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0KSB7IHJldHVybiB0YXJnZXQgaW5zdGFuY2VvZiBnZXRXaW5kb3dPZih0YXJnZXQpLlNWR0VsZW1lbnQgJiYgdHlwZW9mIHRhcmdldC5nZXRCQm94ID09PSAnZnVuY3Rpb24nOyB9O1xufSkoKTtcblxuLyoqXHJcbiAqIENoZWNrcyB3aGV0aGVyIHByb3ZpZGVkIGVsZW1lbnQgaXMgYSBkb2N1bWVudCBlbGVtZW50ICg8aHRtbD4pLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCAtIEVsZW1lbnQgdG8gYmUgY2hlY2tlZC5cclxuICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAqL1xuZnVuY3Rpb24gaXNEb2N1bWVudEVsZW1lbnQodGFyZ2V0KSB7XG4gICAgcmV0dXJuIHRhcmdldCA9PT0gZ2V0V2luZG93T2YodGFyZ2V0KS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG59XG5cbi8qKlxyXG4gKiBDYWxjdWxhdGVzIGFuIGFwcHJvcHJpYXRlIGNvbnRlbnQgcmVjdGFuZ2xlIGZvciBwcm92aWRlZCBodG1sIG9yIHN2ZyBlbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCAtIEVsZW1lbnQgY29udGVudCByZWN0YW5nbGUgb2Ygd2hpY2ggbmVlZHMgdG8gYmUgY2FsY3VsYXRlZC5cclxuICogQHJldHVybnMge0RPTVJlY3RJbml0fVxyXG4gKi9cbmZ1bmN0aW9uIGdldENvbnRlbnRSZWN0KHRhcmdldCkge1xuICAgIGlmICghaXNCcm93c2VyKSB7XG4gICAgICAgIHJldHVybiBlbXB0eVJlY3Q7XG4gICAgfVxuXG4gICAgaWYgKGlzU1ZHR3JhcGhpY3NFbGVtZW50KHRhcmdldCkpIHtcbiAgICAgICAgcmV0dXJuIGdldFNWR0NvbnRlbnRSZWN0KHRhcmdldCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGdldEhUTUxFbGVtZW50Q29udGVudFJlY3QodGFyZ2V0KTtcbn1cblxuLyoqXHJcbiAqIENyZWF0ZXMgcmVjdGFuZ2xlIHdpdGggYW4gaW50ZXJmYWNlIG9mIHRoZSBET01SZWN0UmVhZE9ubHkuXHJcbiAqIFNwZWM6IGh0dHBzOi8vZHJhZnRzLmZ4dGYub3JnL2dlb21ldHJ5LyNkb21yZWN0cmVhZG9ubHlcclxuICpcclxuICogQHBhcmFtIHtET01SZWN0SW5pdH0gcmVjdEluaXQgLSBPYmplY3Qgd2l0aCByZWN0YW5nbGUncyB4L3kgY29vcmRpbmF0ZXMgYW5kIGRpbWVuc2lvbnMuXHJcbiAqIEByZXR1cm5zIHtET01SZWN0UmVhZE9ubHl9XHJcbiAqL1xuZnVuY3Rpb24gY3JlYXRlUmVhZE9ubHlSZWN0KHJlZikge1xuICAgIHZhciB4ID0gcmVmLng7XG4gICAgdmFyIHkgPSByZWYueTtcbiAgICB2YXIgd2lkdGggPSByZWYud2lkdGg7XG4gICAgdmFyIGhlaWdodCA9IHJlZi5oZWlnaHQ7XG5cbiAgICAvLyBJZiBET01SZWN0UmVhZE9ubHkgaXMgYXZhaWxhYmxlIHVzZSBpdCBhcyBhIHByb3RvdHlwZSBmb3IgdGhlIHJlY3RhbmdsZS5cbiAgICB2YXIgQ29uc3RyID0gdHlwZW9mIERPTVJlY3RSZWFkT25seSAhPT0gJ3VuZGVmaW5lZCcgPyBET01SZWN0UmVhZE9ubHkgOiBPYmplY3Q7XG4gICAgdmFyIHJlY3QgPSBPYmplY3QuY3JlYXRlKENvbnN0ci5wcm90b3R5cGUpO1xuXG4gICAgLy8gUmVjdGFuZ2xlJ3MgcHJvcGVydGllcyBhcmUgbm90IHdyaXRhYmxlIGFuZCBub24tZW51bWVyYWJsZS5cbiAgICBkZWZpbmVDb25maWd1cmFibGUocmVjdCwge1xuICAgICAgICB4OiB4LCB5OiB5LCB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICB0b3A6IHksXG4gICAgICAgIHJpZ2h0OiB4ICsgd2lkdGgsXG4gICAgICAgIGJvdHRvbTogaGVpZ2h0ICsgeSxcbiAgICAgICAgbGVmdDogeFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlY3Q7XG59XG5cbi8qKlxyXG4gKiBDcmVhdGVzIERPTVJlY3RJbml0IG9iamVjdCBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgZGltZW5zaW9ucyBhbmQgdGhlIHgveSBjb29yZGluYXRlcy5cclxuICogU3BlYzogaHR0cHM6Ly9kcmFmdHMuZnh0Zi5vcmcvZ2VvbWV0cnkvI2RpY3RkZWYtZG9tcmVjdGluaXRcclxuICpcclxuICogQHBhcmFtIHtudW1iZXJ9IHggLSBYIGNvb3JkaW5hdGUuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gWSBjb29yZGluYXRlLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gd2lkdGggLSBSZWN0YW5nbGUncyB3aWR0aC5cclxuICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIFJlY3RhbmdsZSdzIGhlaWdodC5cclxuICogQHJldHVybnMge0RPTVJlY3RJbml0fVxyXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVJlY3RJbml0KHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcbiAgICByZXR1cm4geyB4OiB4LCB5OiB5LCB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0IH07XG59XG5cbi8qKlxyXG4gKiBDbGFzcyB0aGF0IGlzIHJlc3BvbnNpYmxlIGZvciBjb21wdXRhdGlvbnMgb2YgdGhlIGNvbnRlbnQgcmVjdGFuZ2xlIG9mXHJcbiAqIHByb3ZpZGVkIERPTSBlbGVtZW50IGFuZCBmb3Iga2VlcGluZyB0cmFjayBvZiBpdCdzIGNoYW5nZXMuXHJcbiAqL1xudmFyIFJlc2l6ZU9ic2VydmF0aW9uID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgdGhpcy5icm9hZGNhc3RXaWR0aCA9IDA7XG4gICAgdGhpcy5icm9hZGNhc3RIZWlnaHQgPSAwO1xuICAgIHRoaXMuY29udGVudFJlY3RfID0gY3JlYXRlUmVjdEluaXQoMCwgMCwgMCwgMCk7XG5cbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbn07XG5cbi8qKlxyXG4gKiBVcGRhdGVzIGNvbnRlbnQgcmVjdGFuZ2xlIGFuZCB0ZWxscyB3aGV0aGVyIGl0J3Mgd2lkdGggb3IgaGVpZ2h0IHByb3BlcnRpZXNcclxuICogaGF2ZSBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IGJyb2FkY2FzdC5cclxuICpcclxuICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAqL1xuXG5cbi8qKlxyXG4gKiBSZWZlcmVuY2UgdG8gdGhlIGxhc3Qgb2JzZXJ2ZWQgY29udGVudCByZWN0YW5nbGUuXHJcbiAqXHJcbiAqIEBwcml2YXRlIHtET01SZWN0SW5pdH1cclxuICovXG5cblxuLyoqXHJcbiAqIEJyb2FkY2FzdGVkIHdpZHRoIG9mIGNvbnRlbnQgcmVjdGFuZ2xlLlxyXG4gKlxyXG4gKiBAdHlwZSB7bnVtYmVyfVxyXG4gKi9cblJlc2l6ZU9ic2VydmF0aW9uLnByb3RvdHlwZS5pc0FjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVjdCA9IGdldENvbnRlbnRSZWN0KHRoaXMudGFyZ2V0KTtcblxuICAgIHRoaXMuY29udGVudFJlY3RfID0gcmVjdDtcblxuICAgIHJldHVybiByZWN0LndpZHRoICE9PSB0aGlzLmJyb2FkY2FzdFdpZHRoIHx8IHJlY3QuaGVpZ2h0ICE9PSB0aGlzLmJyb2FkY2FzdEhlaWdodDtcbn07XG5cbi8qKlxyXG4gKiBVcGRhdGVzICdicm9hZGNhc3RXaWR0aCcgYW5kICdicm9hZGNhc3RIZWlnaHQnIHByb3BlcnRpZXMgd2l0aCBhIGRhdGFcclxuICogZnJvbSB0aGUgY29ycmVzcG9uZGluZyBwcm9wZXJ0aWVzIG9mIHRoZSBsYXN0IG9ic2VydmVkIGNvbnRlbnQgcmVjdGFuZ2xlLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7RE9NUmVjdEluaXR9IExhc3Qgb2JzZXJ2ZWQgY29udGVudCByZWN0YW5nbGUuXHJcbiAqL1xuUmVzaXplT2JzZXJ2YXRpb24ucHJvdG90eXBlLmJyb2FkY2FzdFJlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlY3QgPSB0aGlzLmNvbnRlbnRSZWN0XztcblxuICAgIHRoaXMuYnJvYWRjYXN0V2lkdGggPSByZWN0LndpZHRoO1xuICAgIHRoaXMuYnJvYWRjYXN0SGVpZ2h0ID0gcmVjdC5oZWlnaHQ7XG5cbiAgICByZXR1cm4gcmVjdDtcbn07XG5cbnZhciBSZXNpemVPYnNlcnZlckVudHJ5ID0gZnVuY3Rpb24odGFyZ2V0LCByZWN0SW5pdCkge1xuICAgIHZhciBjb250ZW50UmVjdCA9IGNyZWF0ZVJlYWRPbmx5UmVjdChyZWN0SW5pdCk7XG5cbiAgICAvLyBBY2NvcmRpbmcgdG8gdGhlIHNwZWNpZmljYXRpb24gZm9sbG93aW5nIHByb3BlcnRpZXMgYXJlIG5vdCB3cml0YWJsZVxuICAgIC8vIGFuZCBhcmUgYWxzbyBub3QgZW51bWVyYWJsZSBpbiB0aGUgbmF0aXZlIGltcGxlbWVudGF0aW9uLlxuICAgIC8vXG4gICAgLy8gUHJvcGVydHkgYWNjZXNzb3JzIGFyZSBub3QgYmVpbmcgdXNlZCBhcyB0aGV5J2QgcmVxdWlyZSB0byBkZWZpbmUgYVxuICAgIC8vIHByaXZhdGUgV2Vha01hcCBzdG9yYWdlIHdoaWNoIG1heSBjYXVzZSBtZW1vcnkgbGVha3MgaW4gYnJvd3NlcnMgdGhhdFxuICAgIC8vIGRvbid0IHN1cHBvcnQgdGhpcyB0eXBlIG9mIGNvbGxlY3Rpb25zLlxuICAgIGRlZmluZUNvbmZpZ3VyYWJsZSh0aGlzLCB7IHRhcmdldDogdGFyZ2V0LCBjb250ZW50UmVjdDogY29udGVudFJlY3QgfSk7XG59O1xuXG52YXIgUmVzaXplT2JzZXJ2ZXJTUEkgPSBmdW5jdGlvbihjYWxsYmFjaywgY29udHJvbGxlciwgY2FsbGJhY2tDdHgpIHtcbiAgICB0aGlzLmFjdGl2ZU9ic2VydmF0aW9uc18gPSBbXTtcbiAgICB0aGlzLm9ic2VydmF0aW9uc18gPSBuZXcgTWFwU2hpbSgpO1xuXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgY2FsbGJhY2sgcHJvdmlkZWQgYXMgcGFyYW1ldGVyIDEgaXMgbm90IGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuXG4gICAgdGhpcy5jYWxsYmFja18gPSBjYWxsYmFjaztcbiAgICB0aGlzLmNvbnRyb2xsZXJfID0gY29udHJvbGxlcjtcbiAgICB0aGlzLmNhbGxiYWNrQ3R4XyA9IGNhbGxiYWNrQ3R4O1xufTtcblxuLyoqXHJcbiAqIFN0YXJ0cyBvYnNlcnZpbmcgcHJvdmlkZWQgZWxlbWVudC5cclxuICpcclxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXQgLSBFbGVtZW50IHRvIGJlIG9ic2VydmVkLlxyXG4gKiBAcmV0dXJucyB7dm9pZH1cclxuICovXG5cblxuLyoqXHJcbiAqIFJlZ2lzdHJ5IG9mIHRoZSBSZXNpemVPYnNlcnZhdGlvbiBpbnN0YW5jZXMuXHJcbiAqXHJcbiAqIEBwcml2YXRlIHtNYXA8RWxlbWVudCwgUmVzaXplT2JzZXJ2YXRpb24+fVxyXG4gKi9cblxuXG4vKipcclxuICogUHVibGljIFJlc2l6ZU9ic2VydmVyIGluc3RhbmNlIHdoaWNoIHdpbGwgYmUgcGFzc2VkIHRvIHRoZSBjYWxsYmFja1xyXG4gKiBmdW5jdGlvbiBhbmQgdXNlZCBhcyBhIHZhbHVlIG9mIGl0J3MgXCJ0aGlzXCIgYmluZGluZy5cclxuICpcclxuICogQHByaXZhdGUge1Jlc2l6ZU9ic2VydmVyfVxyXG4gKi9cblxuLyoqXHJcbiAqIENvbGxlY3Rpb24gb2YgcmVzaXplIG9ic2VydmF0aW9ucyB0aGF0IGhhdmUgZGV0ZWN0ZWQgY2hhbmdlcyBpbiBkaW1lbnNpb25zXHJcbiAqIG9mIGVsZW1lbnRzLlxyXG4gKlxyXG4gKiBAcHJpdmF0ZSB7QXJyYXk8UmVzaXplT2JzZXJ2YXRpb24+fVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyU1BJLnByb3RvdHlwZS5vYnNlcnZlID0gZnVuY3Rpb24gKHRhcmdldCkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCcxIGFyZ3VtZW50IHJlcXVpcmVkLCBidXQgb25seSAwIHByZXNlbnQuJyk7XG4gICAgfVxuXG4gICAgLy8gRG8gbm90aGluZyBpZiBjdXJyZW50IGVudmlyb25tZW50IGRvZXNuJ3QgaGF2ZSB0aGUgRWxlbWVudCBpbnRlcmZhY2UuXG4gICAgaWYgKHR5cGVvZiBFbGVtZW50ID09PSAndW5kZWZpbmVkJyB8fCAhKEVsZW1lbnQgaW5zdGFuY2VvZiBPYmplY3QpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoISh0YXJnZXQgaW5zdGFuY2VvZiBnZXRXaW5kb3dPZih0YXJnZXQpLkVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3BhcmFtZXRlciAxIGlzIG5vdCBvZiB0eXBlIFwiRWxlbWVudFwiLicpO1xuICAgIH1cblxuICAgIHZhciBvYnNlcnZhdGlvbnMgPSB0aGlzLm9ic2VydmF0aW9uc187XG5cbiAgICAvLyBEbyBub3RoaW5nIGlmIGVsZW1lbnQgaXMgYWxyZWFkeSBiZWluZyBvYnNlcnZlZC5cbiAgICBpZiAob2JzZXJ2YXRpb25zLmhhcyh0YXJnZXQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBvYnNlcnZhdGlvbnMuc2V0KHRhcmdldCwgbmV3IFJlc2l6ZU9ic2VydmF0aW9uKHRhcmdldCkpO1xuXG4gICAgdGhpcy5jb250cm9sbGVyXy5hZGRPYnNlcnZlcih0aGlzKTtcblxuICAgIC8vIEZvcmNlIHRoZSB1cGRhdGUgb2Ygb2JzZXJ2YXRpb25zLlxuICAgIHRoaXMuY29udHJvbGxlcl8ucmVmcmVzaCgpO1xufTtcblxuLyoqXHJcbiAqIFN0b3BzIG9ic2VydmluZyBwcm92aWRlZCBlbGVtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCAtIEVsZW1lbnQgdG8gc3RvcCBvYnNlcnZpbmcuXHJcbiAqIEByZXR1cm5zIHt2b2lkfVxyXG4gKi9cblJlc2l6ZU9ic2VydmVyU1BJLnByb3RvdHlwZS51bm9ic2VydmUgPSBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJzEgYXJndW1lbnQgcmVxdWlyZWQsIGJ1dCBvbmx5IDAgcHJlc2VudC4nKTtcbiAgICB9XG5cbiAgICAvLyBEbyBub3RoaW5nIGlmIGN1cnJlbnQgZW52aXJvbm1lbnQgZG9lc24ndCBoYXZlIHRoZSBFbGVtZW50IGludGVyZmFjZS5cbiAgICBpZiAodHlwZW9mIEVsZW1lbnQgPT09ICd1bmRlZmluZWQnIHx8ICEoRWxlbWVudCBpbnN0YW5jZW9mIE9iamVjdCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghKHRhcmdldCBpbnN0YW5jZW9mIGdldFdpbmRvd09mKHRhcmdldCkuRWxlbWVudCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigncGFyYW1ldGVyIDEgaXMgbm90IG9mIHR5cGUgXCJFbGVtZW50XCIuJyk7XG4gICAgfVxuXG4gICAgdmFyIG9ic2VydmF0aW9ucyA9IHRoaXMub2JzZXJ2YXRpb25zXztcblxuICAgIC8vIERvIG5vdGhpbmcgaWYgZWxlbWVudCBpcyBub3QgYmVpbmcgb2JzZXJ2ZWQuXG4gICAgaWYgKCFvYnNlcnZhdGlvbnMuaGFzKHRhcmdldCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG9ic2VydmF0aW9ucy5kZWxldGUodGFyZ2V0KTtcblxuICAgIGlmICghb2JzZXJ2YXRpb25zLnNpemUpIHtcbiAgICAgICAgdGhpcy5jb250cm9sbGVyXy5yZW1vdmVPYnNlcnZlcih0aGlzKTtcbiAgICB9XG59O1xuXG4vKipcclxuICogU3RvcHMgb2JzZXJ2aW5nIGFsbCBlbGVtZW50cy5cclxuICpcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJTUEkucHJvdG90eXBlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5jbGVhckFjdGl2ZSgpO1xuICAgIHRoaXMub2JzZXJ2YXRpb25zXy5jbGVhcigpO1xuICAgIHRoaXMuY29udHJvbGxlcl8ucmVtb3ZlT2JzZXJ2ZXIodGhpcyk7XG59O1xuXG4vKipcclxuICogQ29sbGVjdHMgb2JzZXJ2YXRpb24gaW5zdGFuY2VzIHRoZSBhc3NvY2lhdGVkIGVsZW1lbnQgb2Ygd2hpY2ggaGFzIGNoYW5nZWRcclxuICogaXQncyBjb250ZW50IHJlY3RhbmdsZS5cclxuICpcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJTUEkucHJvdG90eXBlLmdhdGhlckFjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRoaXMkMSA9IHRoaXM7XG5cbiAgICB0aGlzLmNsZWFyQWN0aXZlKCk7XG5cbiAgICB0aGlzLm9ic2VydmF0aW9uc18uZm9yRWFjaChmdW5jdGlvbiAob2JzZXJ2YXRpb24pIHtcbiAgICAgICAgaWYgKG9ic2VydmF0aW9uLmlzQWN0aXZlKCkpIHtcbiAgICAgICAgICAgIHRoaXMkMS5hY3RpdmVPYnNlcnZhdGlvbnNfLnB1c2gob2JzZXJ2YXRpb24pO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vKipcclxuICogSW52b2tlcyBpbml0aWFsIGNhbGxiYWNrIGZ1bmN0aW9uIHdpdGggYSBsaXN0IG9mIFJlc2l6ZU9ic2VydmVyRW50cnlcclxuICogaW5zdGFuY2VzIGNvbGxlY3RlZCBmcm9tIGFjdGl2ZSByZXNpemUgb2JzZXJ2YXRpb25zLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7dm9pZH1cclxuICovXG5SZXNpemVPYnNlcnZlclNQSS5wcm90b3R5cGUuYnJvYWRjYXN0QWN0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIERvIG5vdGhpbmcgaWYgb2JzZXJ2ZXIgZG9lc24ndCBoYXZlIGFjdGl2ZSBvYnNlcnZhdGlvbnMuXG4gICAgaWYgKCF0aGlzLmhhc0FjdGl2ZSgpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgY3R4ID0gdGhpcy5jYWxsYmFja0N0eF87XG5cbiAgICAvLyBDcmVhdGUgUmVzaXplT2JzZXJ2ZXJFbnRyeSBpbnN0YW5jZSBmb3IgZXZlcnkgYWN0aXZlIG9ic2VydmF0aW9uLlxuICAgIHZhciBlbnRyaWVzID0gdGhpcy5hY3RpdmVPYnNlcnZhdGlvbnNfLm1hcChmdW5jdGlvbiAob2JzZXJ2YXRpb24pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNpemVPYnNlcnZlckVudHJ5KG9ic2VydmF0aW9uLnRhcmdldCwgb2JzZXJ2YXRpb24uYnJvYWRjYXN0UmVjdCgpKTtcbiAgICB9KTtcblxuICAgIHRoaXMuY2FsbGJhY2tfLmNhbGwoY3R4LCBlbnRyaWVzLCBjdHgpO1xuICAgIHRoaXMuY2xlYXJBY3RpdmUoKTtcbn07XG5cbi8qKlxyXG4gKiBDbGVhcnMgdGhlIGNvbGxlY3Rpb24gb2YgYWN0aXZlIG9ic2VydmF0aW9ucy5cclxuICpcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJTUEkucHJvdG90eXBlLmNsZWFyQWN0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuYWN0aXZlT2JzZXJ2YXRpb25zXy5zcGxpY2UoMCk7XG59O1xuXG4vKipcclxuICogVGVsbHMgd2hldGhlciBvYnNlcnZlciBoYXMgYWN0aXZlIG9ic2VydmF0aW9ucy5cclxuICpcclxuICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAqL1xuUmVzaXplT2JzZXJ2ZXJTUEkucHJvdG90eXBlLmhhc0FjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5hY3RpdmVPYnNlcnZhdGlvbnNfLmxlbmd0aCA+IDA7XG59O1xuXG4vLyBSZWdpc3RyeSBvZiBpbnRlcm5hbCBvYnNlcnZlcnMuIElmIFdlYWtNYXAgaXMgbm90IGF2YWlsYWJsZSB1c2UgY3VycmVudCBzaGltXG4vLyBmb3IgdGhlIE1hcCBjb2xsZWN0aW9uIGFzIGl0IGhhcyBhbGwgcmVxdWlyZWQgbWV0aG9kcyBhbmQgYmVjYXVzZSBXZWFrTWFwXG4vLyBjYW4ndCBiZSBmdWxseSBwb2x5ZmlsbGVkIGFueXdheS5cbnZhciBvYnNlcnZlcnMgPSB0eXBlb2YgV2Vha01hcCAhPT0gJ3VuZGVmaW5lZCcgPyBuZXcgV2Vha01hcCgpIDogbmV3IE1hcFNoaW0oKTtcblxuLyoqXHJcbiAqIFJlc2l6ZU9ic2VydmVyIEFQSS4gRW5jYXBzdWxhdGVzIHRoZSBSZXNpemVPYnNlcnZlciBTUEkgaW1wbGVtZW50YXRpb25cclxuICogZXhwb3Npbmcgb25seSB0aG9zZSBtZXRob2RzIGFuZCBwcm9wZXJ0aWVzIHRoYXQgYXJlIGRlZmluZWQgaW4gdGhlIHNwZWMuXHJcbiAqL1xudmFyIFJlc2l6ZU9ic2VydmVyID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUmVzaXplT2JzZXJ2ZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbi4nKTtcbiAgICB9XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJzEgYXJndW1lbnQgcmVxdWlyZWQsIGJ1dCBvbmx5IDAgcHJlc2VudC4nKTtcbiAgICB9XG5cbiAgICB2YXIgY29udHJvbGxlciA9IFJlc2l6ZU9ic2VydmVyQ29udHJvbGxlci5nZXRJbnN0YW5jZSgpO1xuICAgIHZhciBvYnNlcnZlciA9IG5ldyBSZXNpemVPYnNlcnZlclNQSShjYWxsYmFjaywgY29udHJvbGxlciwgdGhpcyk7XG5cbiAgICBvYnNlcnZlcnMuc2V0KHRoaXMsIG9ic2VydmVyKTtcbn07XG5cbi8vIEV4cG9zZSBwdWJsaWMgbWV0aG9kcyBvZiBSZXNpemVPYnNlcnZlci5cblsnb2JzZXJ2ZScsICd1bm9ic2VydmUnLCAnZGlzY29ubmVjdCddLmZvckVhY2goZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgIFJlc2l6ZU9ic2VydmVyLnByb3RvdHlwZVttZXRob2RdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKHJlZiA9IG9ic2VydmVycy5nZXQodGhpcykpW21ldGhvZF0uYXBwbHkocmVmLCBhcmd1bWVudHMpO1xuICAgICAgICB2YXIgcmVmO1xuICAgIH07XG59KTtcblxudmFyIGluZGV4ID0gKGZ1bmN0aW9uICgpIHtcbiAgICAvLyBFeHBvcnQgZXhpc3RpbmcgaW1wbGVtZW50YXRpb24gaWYgYXZhaWxhYmxlLlxuICAgIGlmICh0eXBlb2YgZ2xvYmFsJDEuUmVzaXplT2JzZXJ2ZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBnbG9iYWwkMS5SZXNpemVPYnNlcnZlcjtcbiAgICB9XG5cbiAgICByZXR1cm4gUmVzaXplT2JzZXJ2ZXI7XG59KSgpO1xuXG5yZXR1cm4gaW5kZXg7XG5cbn0pKSk7XG4iLCJjbGFzcyBDb3B5UGFzdGVFeHRlbnNpb24ge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuX2dsb2JhbENsaXBib2FyZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuXHRpbml0IChncmlkLCBjb25maWcpIHtcclxuXHRcdHRoaXMuX2dyaWQgPSBncmlkO1xyXG5cdFx0dGhpcy5fY29uZmlnID0gY29uZmlnO1xyXG5cdH1cclxuXHJcblx0a2V5RG93biAoZSkge1xyXG4gICAgICAgIGlmICh0aGlzLl9nbG9iYWxDbGlwYm9hcmQgJiYgZS5jdHJsS2V5KSB7XHJcbiAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ2MnKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZGF0YSA9IHRoaXMuX2NvcHkoKTtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmNsaXBib2FyZERhdGEuc2V0RGF0YSgndGV4dCcsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgaWYgKGUua2V5ID09PSAndicpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Bhc3RlKHdpbmRvdy5jbGlwYm9hcmREYXRhLmdldERhdGEoJ3RleHQnKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ3JpZEFmdGVyUmVuZGVyKGUpIHtcclxuICAgICAgICBpZiAoIXdpbmRvdy5jbGlwYm9hcmREYXRhKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2dyaWQudmlldy5nZXRFbGVtZW50KCkuYWRkRXZlbnRMaXN0ZW5lcigncGFzdGUnLCAocGFzdGVFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcGFzdGUocGFzdGVFdmVudC5jbGlwYm9hcmREYXRhLmdldERhdGEoJ3RleHQnKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLl9ncmlkLnZpZXcuZ2V0RWxlbWVudCgpLmFkZEV2ZW50TGlzdGVuZXIoJ2NvcHknLCAoY29weUV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZGF0YSA9IHRoaXMuX2NvcHkoKTtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29weUV2ZW50LmNsaXBib2FyZERhdGEuc2V0RGF0YSgndGV4dC9wbGFpbicsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvcHlFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5fZ2xvYmFsQ2xpcGJvYXJkID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fZ2xvYmFsQ2xpcGJvYXJkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NvcHkoY2xpcGJvYXJkRGF0YSkge1xyXG4gICAgICAgIGxldCBzZWxlY3Rpb24gPSB0aGlzLl9ncmlkLnN0YXRlLmdldCgnc2VsZWN0aW9uJyk7XHJcbiAgICAgICAgaWYgKHNlbGVjdGlvbiAmJiBzZWxlY3Rpb24ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBsZXQgcyA9IHNlbGVjdGlvblswXTtcclxuICAgICAgICAgICAgbGV0IHJvd3MgPSBbXTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaT0wOyBpPHMuaDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY29scyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaj0wOyBqPHMudzsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29scy5wdXNoKHRoaXMuX2dyaWQuZGF0YS5nZXREYXRhQXQocy5yICsgaSwgcy5jICsgaikpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcm93cy5wdXNoKGNvbHMuam9pbignXFx0JykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByb3dzLmpvaW4oJ1xcbicpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfcGFzdGUoZGF0YSkge1xyXG4gICAgICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgICAgIGRhdGEgPSBkYXRhLnJlcGxhY2UoL1xcbiQvZywgJycpO1xyXG4gICAgICAgICAgICBsZXQgc2VsZWN0aW9uID0gdGhpcy5fZ3JpZC5zdGF0ZS5nZXQoJ3NlbGVjdGlvbicpO1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0aW9uICYmIHNlbGVjdGlvbi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcyA9IHNlbGVjdGlvblswXTtcclxuICAgICAgICAgICAgICAgIGxldCByb3dzID0gZGF0YS5zcGxpdCgnXFxuJyk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpPTA7IGk8cm93cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjb2xzID0gcm93c1tpXS5zcGxpdCgnXFx0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaj0wOyBqPGNvbHMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHBhc3RlUm93ID0gIHMuciArIGk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwYXN0ZUNvbCA9IHMuYyArIGo7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9ncmlkLm1vZGVsLmNhbkVkaXQocGFzdGVSb3csIHBhc3RlQ29sKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ3JpZC5kYXRhLnNldERhdGFBdChwYXN0ZVJvdywgcGFzdGVDb2wsIGNvbHNbal0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ3JpZC52aWV3LnVwZGF0ZUNlbGwocGFzdGVSb3csIHBhc3RlQ29sKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IENvcHlQYXN0ZUV4dGVuc2lvbjsiLCJjbGFzcyBFZGl0b3JFeHRlbnNpb24ge1xyXG5cclxuXHRpbml0IChncmlkLCBjb25maWcpIHtcclxuXHRcdHRoaXMuX2dyaWQgPSBncmlkO1xyXG5cdFx0dGhpcy5fY29uZmlnID0gY29uZmlnO1xyXG5cdH1cclxuXHJcblx0a2V5RG93biAoZSkge1xyXG5cdFx0aWYgKCFlLmN0cmxLZXkpIHtcclxuXHRcdFx0bGV0IHNlbGVjdGlvbiA9IHRoaXMuX2dyaWQuc3RhdGUuZ2V0KCdzZWxlY3Rpb24nKTtcclxuXHRcdFx0aWYgKHNlbGVjdGlvbiAmJiBzZWxlY3Rpb24ubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRcdGxldCByb3dJbmRleCA9IHNlbGVjdGlvblswXS5yO1xyXG5cdFx0XHRcdGxldCBjb2xJbmRleCA9IHNlbGVjdGlvblswXS5jO1xyXG5cdFx0XHRcdGxldCBlZGl0ID0gZmFsc2U7XHJcblx0XHRcdFx0aWYgKGUua2V5Q29kZSA9PT0gMTMgfHwgKGUua2V5Q29kZSA+IDMxICYmICEoZS5rZXlDb2RlID49IDM3ICYmIGUua2V5Q29kZSA8PSA0MCkpKSB7XHJcblx0XHRcdFx0XHRlZGl0ID0gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGVkaXQgJiZcclxuXHRcdFx0XHRcdHJvd0luZGV4ID49IDAgJiYgcm93SW5kZXggPCB0aGlzLl9ncmlkLm1vZGVsLmdldFJvd0NvdW50KCkgJiZcclxuXHRcdFx0XHRcdGNvbEluZGV4ID49IDAgJiYgY29sSW5kZXggPCB0aGlzLl9ncmlkLm1vZGVsLmdldENvbHVtbkNvdW50KCkpIHtcclxuXHRcdFx0XHRcdGxldCBjZWxsID0gdGhpcy5fZ3JpZC52aWV3LmdldENlbGwocm93SW5kZXgsIGNvbEluZGV4KTtcclxuXHRcdFx0XHRcdGlmIChjZWxsKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMuX2VkaXRDZWxsKGNlbGwpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Y2VsbEFmdGVyUmVuZGVyIChlKSB7XHJcblx0XHRlLmNlbGwuYWRkRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCAoZSkgPT4ge1xyXG5cdFx0XHRsZXQgYWN0dWFsQ2VsbCA9IGUudGFyZ2V0O1xyXG5cdFx0XHRpZiAoYWN0dWFsQ2VsbCkge1xyXG5cdFx0XHRcdHRoaXMuX2VkaXRDZWxsKGFjdHVhbENlbGwpO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdF9lZGl0Q2VsbCAoY2VsbCkge1xyXG5cdFx0bGV0IGFjdHVhbENlbGwgPSBjZWxsO1xyXG5cdFx0bGV0IGFjdHVhbFJvdyA9IHBhcnNlSW50KGFjdHVhbENlbGwuZGF0YXNldC5yb3dJbmRleCk7XHJcblx0XHRsZXQgYWN0dWFsQ29sID0gcGFyc2VJbnQoYWN0dWFsQ2VsbC5kYXRhc2V0LmNvbEluZGV4KTtcclxuXHRcdGlmICh0aGlzLl9ncmlkLm1vZGVsLmNhbkVkaXQoYWN0dWFsUm93LCBhY3R1YWxDb2wpKSB7XHJcblx0XHRcdC8vR2V0IGRhdGEgdG8gYmUgZWRpdGVkXHJcblx0XHRcdGxldCBkYXRhID0gdGhpcy5fZ3JpZC5kYXRhLmdldERhdGFBdChhY3R1YWxSb3csIGFjdHVhbENvbCk7XHJcblxyXG5cdFx0XHQvL0lmIHRoZXJlJ3MgY3VzdG9tIGVkaXRvciwgdXNlIGN1c3RvbSBlZGl0b3IgdG8gYXR0YWNoIHRoZSBlZGl0b3JcclxuXHRcdFx0bGV0IGN1c3RvbUVkaXRvciA9IHRoaXMuX2dyaWQubW9kZWwuZ2V0Q2FzY2FkZWRDZWxsUHJvcChhY3R1YWxDZWxsLmRhdGFzZXQucm93SW5kZXgsIGFjdHVhbENlbGwuZGF0YXNldC5jb2xJbmRleCwgJ2VkaXRvcicpO1xyXG5cdFx0XHRpZiAoY3VzdG9tRWRpdG9yICYmIGN1c3RvbUVkaXRvci5hdHRhY2gpIHtcclxuXHRcdFx0XHRjdXN0b21FZGl0b3IuYXR0YWNoKGFjdHVhbENlbGwsIGRhdGEsIHRoaXMuX2RvbmUuYmluZCh0aGlzKSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5fYXR0YWNoRWRpdG9yKGFjdHVhbENlbGwsIGRhdGEsIHRoaXMuX2RvbmUuYmluZCh0aGlzKSk7XHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy5fZWRpdGluZ0NvbCA9IGFjdHVhbENvbDtcclxuXHRcdFx0dGhpcy5fZWRpdGluZ1JvdyA9IGFjdHVhbFJvdztcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdF9hdHRhY2hFZGl0b3IgKGNlbGwsIGRhdGEsIGRvbmUpIHtcclxuXHRcdGlmICghdGhpcy5faW5wdXRFbGVtZW50KSB7XHJcblx0XHRcdGxldCBjZWxsQm91bmQgPSBjZWxsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQudHlwZSA9ICd0ZXh0JztcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LnZhbHVlID0gZGF0YTtcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LnN0eWxlLndpZHRoID0gKGNlbGxCb3VuZC53aWR0aC0zKSArICdweCc7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5zdHlsZS5oZWlnaHQgPSAoY2VsbEJvdW5kLmhlaWdodC0zKSArICdweCc7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5jbGFzc05hbWUgPSAncGdyaWQtY2VsbC10ZXh0LWVkaXRvcic7XHJcblx0XHRcdGNlbGwuaW5uZXJIVE1MID0gJyc7XHJcblx0XHRcdGNlbGwuYXBwZW5kQ2hpbGQodGhpcy5faW5wdXRFbGVtZW50KTtcclxuXHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5mb2N1cygpO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQuc2VsZWN0KCk7XHJcblxyXG5cdFx0XHR0aGlzLl9hcnJvd0tleUxvY2tlZCA9IGZhbHNlO1xyXG5cclxuXHRcdFx0dGhpcy5fa2V5ZG93bkhhbmRsZXIgPSAoZSkgPT4ge1xyXG5cdFx0XHRcdHN3aXRjaCAoZS5rZXlDb2RlKSB7XHJcblx0XHRcdFx0XHRjYXNlIDEzOiAvL0VudGVyXHJcblx0XHRcdFx0XHRcdGRvbmUoZS50YXJnZXQudmFsdWUpO1xyXG5cdFx0XHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdFx0Y2FzZSAyNzogLy9FU0NcclxuXHRcdFx0XHRcdFx0ZG9uZSgpO1xyXG5cdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblx0XHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdFx0Y2FzZSA0MDogLy9Eb3duXHJcblx0XHRcdFx0XHRjYXNlIDM4OiAvL1VwXHJcblx0XHRcdFx0XHRjYXNlIDM3OiAvL0xlZnRcclxuXHRcdFx0XHRcdGNhc2UgMzk6IC8vUmlnaHRcclxuXHRcdFx0XHRcdFx0aWYgKCF0aGlzLl9hcnJvd0tleUxvY2tlZCkge1xyXG5cdFx0XHRcdFx0XHRcdGRvbmUoZS50YXJnZXQudmFsdWUpO1xyXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fTtcclxuXHRcdFx0dGhpcy5fa2V5ZG93bkhhbmRsZXIgPSB0aGlzLl9rZXlkb3duSGFuZGxlci5iaW5kKHRoaXMpO1xyXG5cclxuXHRcdFx0dGhpcy5fYmx1ckhhbmRsZXIgPSAoZSkgPT4ge1xyXG5cdFx0XHRcdGRvbmUoZS50YXJnZXQudmFsdWUpO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHR0aGlzLl9ibHVySGFuZGxlciA9IHRoaXMuX2JsdXJIYW5kbGVyLmJpbmQodGhpcyk7XHJcblxyXG5cdFx0XHR0aGlzLl9jbGlja0hhbmRsZXIgPSAoZSkgPT4ge1xyXG5cdFx0XHRcdHRoaXMuX2Fycm93S2V5TG9ja2VkID0gdHJ1ZTtcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fa2V5ZG93bkhhbmRsZXIpO1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMuX2JsdXJIYW5kbGVyKTtcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fY2xpY2tIYW5kbGVyKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdF9kZXRhY2hFZGl0b3IgKCkge1xyXG5cdFx0aWYgKHRoaXMuX2lucHV0RWxlbWVudCkge1xyXG5cdFx0XHR0aGlzLl9pbnB1dEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2tleWRvd25IYW5kbGVyKTtcclxuXHRcdFx0dGhpcy5faW5wdXRFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLl9ibHVySGFuZGxlcik7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX2NsaWNrSGFuZGxlcik7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudC5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuX2lucHV0RWxlbWVudCk7XHJcblx0XHRcdHRoaXMuX2lucHV0RWxlbWVudCA9IG51bGw7XHJcblx0XHRcdHRoaXMuX2tleWRvd25IYW5kbGVyID0gbnVsbDtcclxuXHRcdFx0dGhpcy5fYmx1ckhhbmRsZXIgPSBudWxsO1xyXG5cdFx0XHR0aGlzLl9jbGlja0hhbmRsZXIgPSBudWxsO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0X2RvbmUgKHJlc3VsdCkge1xyXG5cdFx0dGhpcy5fZGV0YWNoRWRpdG9yKCk7XHJcblx0XHRpZiAocmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0dGhpcy5fZ3JpZC5kYXRhLnNldERhdGFBdCh0aGlzLl9lZGl0aW5nUm93LCB0aGlzLl9lZGl0aW5nQ29sLCByZXN1bHQpO1xyXG5cdFx0fVxyXG5cdFx0dGhpcy5fZ3JpZC52aWV3LnVwZGF0ZUNlbGwodGhpcy5fZWRpdGluZ1JvdywgdGhpcy5fZWRpdGluZ0NvbCk7XHJcblx0XHR0aGlzLl9lZGl0aW5nUm93ID0gLTE7XHJcblx0XHR0aGlzLl9lZGl0aW5nQ29sID0gLTE7XHJcblxyXG5cdFx0Ly9SZS1mb2N1cyBhdCB0aGUgZ3JpZFxyXG5cdFx0dGhpcy5fZ3JpZC52aWV3LmdldEVsZW1lbnQoKS5mb2N1cygpO1xyXG5cdH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEVkaXRvckV4dGVuc2lvbjsiLCJjbGFzcyBTZWxlY3Rpb25FeHRlbnNpb24ge1xyXG5cclxuXHRpbml0IChncmlkLCBjb25maWcpIHtcclxuXHRcdHRoaXMuX2dyaWQgPSBncmlkO1xyXG5cdFx0dGhpcy5fY29uZmlnID0gY29uZmlnO1xyXG5cdFx0dGhpcy5fY3VycmVudFNlbGVjdGlvbiA9IG51bGw7XHJcblx0XHR0aGlzLl9zZWxlY3Rpb25DbGFzcyA9ICh0aGlzLl9jb25maWcuc2VsZWN0aW9uICYmIHRoaXMuX2NvbmZpZy5zZWxlY3Rpb24uY3NzQ2xhc3MpP3RoaXMuX2NvbmZpZy5zZWxlY3Rpb24uY3NzQ2xhc3M6J3BncmlkLWNlbGwtc2VsZWN0aW9uJztcclxuXHR9XHJcblxyXG5cdGtleURvd24gKGUpIHtcclxuXHRcdGxldCBzZWxlY3Rpb24gPSB0aGlzLl9ncmlkLnN0YXRlLmdldCgnc2VsZWN0aW9uJyk7XHJcblx0XHRpZiAoc2VsZWN0aW9uICYmIHNlbGVjdGlvbi5sZW5ndGggPiAwKSB7XHJcblx0XHRcdGxldCByb3dJbmRleCA9IHNlbGVjdGlvblswXS5yO1xyXG5cdFx0XHRsZXQgY29sSW5kZXggPSBzZWxlY3Rpb25bMF0uYztcclxuXHRcdFx0bGV0IGFsaWduVG9wID0gdHJ1ZTtcclxuXHRcdFx0c3dpdGNoIChlLmtleUNvZGUpIHtcclxuXHRcdFx0XHRjYXNlIDQwOiAvL0Rvd25cclxuXHRcdFx0XHRcdHJvd0luZGV4Kys7XHJcblx0XHRcdFx0XHRhbGlnblRvcCA9IGZhbHNlO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0Y2FzZSAzODogLy9VcFxyXG5cdFx0XHRcdFx0cm93SW5kZXgtLTtcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdGNhc2UgMzc6IC8vTGVmdFxyXG5cdFx0XHRcdFx0Y29sSW5kZXgtLTtcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdGNhc2UgMzk6IC8vUmlnaHRcclxuXHRcdFx0XHRjYXNlIDk6IC8vVGFiXHJcblx0XHRcdFx0XHRjb2xJbmRleCsrO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAocm93SW5kZXggPj0gMCAmJiByb3dJbmRleCA8IHRoaXMuX2dyaWQubW9kZWwuZ2V0Um93Q291bnQoKSAmJlxyXG5cdFx0XHRcdGNvbEluZGV4ID49IDAgJiYgY29sSW5kZXggPCB0aGlzLl9ncmlkLm1vZGVsLmdldENvbHVtbkNvdW50KCkpIHtcclxuXHRcdFx0XHRsZXQgcm93TW9kZWwgPSB0aGlzLl9ncmlkLm1vZGVsLmdldFJvd01vZGVsKHJvd0luZGV4KTtcclxuXHRcdFx0XHRsZXQgY29sTW9kZWwgPSB0aGlzLl9ncmlkLm1vZGVsLmdldENvbHVtbk1vZGVsKGNvbEluZGV4KTtcclxuXHRcdFx0XHRpZiAoKCFyb3dNb2RlbCB8fCByb3dNb2RlbC50eXBlICE9PSAnaGVhZGVyJykgJiZcclxuXHRcdFx0XHRcdCghY29sTW9kZWwgfHwgY29sTW9kZWwudHlwZSAhPT0gJ2hlYWRlcicpKSB7XHJcblxyXG5cdFx0XHRcdFx0bGV0IGNlbGwgPSB0aGlzLl9ncmlkLnZpZXcuZ2V0Q2VsbChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cdFx0XHRcdFx0aWYgKGNlbGwpIHtcclxuXHRcdFx0XHRcdFx0dGhpcy5fc2VsZWN0Q2VsbChjZWxsLCByb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cdFx0XHRcdFx0XHR0aGlzLl9ncmlkLnZpZXcuc2Nyb2xsVG9DZWxsKHJvd0luZGV4LCBjb2xJbmRleCwgYWxpZ25Ub3ApO1xyXG5cdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRjZWxsQWZ0ZXJSZW5kZXIgKGUpIHtcclxuXHRcdGUuY2VsbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZSkgPT4ge1xyXG5cdFx0XHRsZXQgYWN0dWFsQ2VsbCA9IGUudGFyZ2V0O1xyXG5cdFx0XHRsZXQgYWN0dWFsUm93ID0gcGFyc2VJbnQoYWN0dWFsQ2VsbC5kYXRhc2V0LnJvd0luZGV4KTtcclxuXHRcdFx0bGV0IGFjdHVhbENvbCA9IHBhcnNlSW50KGFjdHVhbENlbGwuZGF0YXNldC5jb2xJbmRleCk7XHJcblx0XHRcdGxldCByb3dNb2RlbCA9IHRoaXMuX2dyaWQubW9kZWwuZ2V0Um93TW9kZWwoYWN0dWFsUm93KTtcclxuXHRcdFx0aWYgKCFyb3dNb2RlbCB8fCByb3dNb2RlbC50eXBlICE9PSAnaGVhZGVyJykge1xyXG5cdFx0XHRcdGlmIChhY3R1YWxDZWxsLmNsYXNzTGlzdC5jb250YWlucygncGdyaWQtY2VsbCcpKSB7XHJcblx0XHRcdFx0XHR0aGlzLl9zZWxlY3RDZWxsKGFjdHVhbENlbGwsIGFjdHVhbFJvdywgYWN0dWFsQ29sKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0X3NlbGVjdENlbGwgKGNlbGwsIHJvd0luZGV4LCBjb2xJbmRleCkge1xyXG5cdFx0Ly9DbGVhciBvbGQgc2VsZWN0aW9uXHJcblx0XHRpZiAodGhpcy5fY3VycmVudFNlbGVjdGlvbiAmJiB0aGlzLl9jdXJyZW50U2VsZWN0aW9uICE9PSBjZWxsKSB7XHJcblx0XHRcdHRoaXMuX2N1cnJlbnRTZWxlY3Rpb24uY2xhc3NMaXN0LnJlbW92ZSh0aGlzLl9zZWxlY3Rpb25DbGFzcyk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly9TZXQgc2VsZWN0aW9uXHJcblx0XHR0aGlzLl9jdXJyZW50U2VsZWN0aW9uID0gY2VsbDtcclxuXHRcdHRoaXMuX2N1cnJlbnRTZWxlY3Rpb24uY2xhc3NMaXN0LmFkZCh0aGlzLl9zZWxlY3Rpb25DbGFzcyk7XHJcblx0XHR0aGlzLl9ncmlkLnZpZXcuZ2V0RWxlbWVudCgpLmZvY3VzKCk7XHJcblxyXG5cdFx0Ly9TdG9yZSBzZWxlY3Rpb24gc3RhdGVcclxuXHRcdGxldCBzZWxlY3Rpb24gPSB0aGlzLl9ncmlkLnN0YXRlLmdldCgnc2VsZWN0aW9uJyk7XHJcblx0XHRpZiAoIXNlbGVjdGlvbikge1xyXG5cdFx0XHRzZWxlY3Rpb24gPSBbXTtcclxuXHRcdFx0dGhpcy5fZ3JpZC5zdGF0ZS5zZXQoJ3NlbGVjdGlvbicsIHNlbGVjdGlvbik7XHJcblx0XHR9XHJcblx0XHRzZWxlY3Rpb24ubGVuZ3RoID0gMDtcclxuXHRcdHNlbGVjdGlvbi5wdXNoKHtcclxuXHRcdFx0cjogcm93SW5kZXgsXHJcblx0XHRcdGM6IGNvbEluZGV4LFxyXG5cdFx0XHR3OiAxLFxyXG5cdFx0XHRoOiAxXHJcblx0XHR9KTtcclxuXHJcblx0fVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgU2VsZWN0aW9uRXh0ZW5zaW9uOyIsImltcG9ydCBFdmVudERpc3BhdGNoZXIgZnJvbSAnLi9ldmVudCc7XHJcblxyXG5jbGFzcyBEYXRhIGV4dGVuZHMgRXZlbnREaXNwYXRjaGVyIHtcclxuXHJcblx0Y29uc3RydWN0b3IgKGRhdGFNb2RlbCwgZXh0ZW5zaW9uKSB7XHJcblx0XHRzdXBlcigpO1xyXG5cdFx0dGhpcy5fZGF0YU1vZGVsID0gZGF0YU1vZGVsO1xyXG5cdFx0dGhpcy5fZXh0ZW5zaW9uID0gZXh0ZW5zaW9uO1xyXG5cdFx0dGhpcy5fYmxvY2tFdmVudCA9IGZhbHNlO1xyXG5cdH1cclxuXHJcblx0Z2V0RGF0YUF0IChyb3dJbmRleCwgY29sSW5kZXgpIHtcclxuXHRcdGlmICh0aGlzLl9kYXRhTW9kZWwuZGF0YVtyb3dJbmRleF0pIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2RhdGFNb2RlbC5kYXRhW3Jvd0luZGV4XVtjb2xJbmRleF07XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xyXG5cdH1cclxuXHJcblx0c2V0RGF0YUF0IChyb3dJbmRleCwgY29sSW5kZXgsIGRhdGEpIHtcclxuXHRcdGNvbnN0IGJlZm9yZVVwZGF0ZUFyZyA9IHtcclxuXHRcdFx0cm93SW5kZXg6IHJvd0luZGV4LFxyXG5cdFx0XHRjb2xJbmRleDogY29sSW5kZXgsXHJcblx0XHRcdGRhdGE6IGRhdGEsXHJcblx0XHRcdGNhbmNlbDogZmFsc2VcclxuXHRcdH07XHJcblx0XHRpZiAoIXRoaXMuX2Jsb2NrRXZlbnQpIHtcclxuXHRcdFx0dGhpcy5fYmxvY2tFdmVudCA9IHRydWU7XHJcblx0XHRcdHRoaXMuX2V4dGVuc2lvbi5leGVjdXRlRXh0ZW5zaW9uKCdkYXRhQmVmb3JlVXBkYXRlJywgYmVmb3JlVXBkYXRlQXJnKTtcclxuXHRcdFx0dGhpcy5fYmxvY2tFdmVudCA9IGZhbHNlO1xyXG5cdFx0fVxyXG5cdFx0aWYgKCFiZWZvcmVVcGRhdGVBcmcuY2FuY2VsKSB7XHJcblx0XHRcdGlmICghdGhpcy5fZGF0YU1vZGVsLmRhdGFbcm93SW5kZXhdKSB7XHJcblx0XHRcdFx0dGhpcy5fZGF0YU1vZGVsLmRhdGFbcm93SW5kZXhdID0gW107XHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy5fZGF0YU1vZGVsLmRhdGFbcm93SW5kZXhdW2NvbEluZGV4XSA9IGJlZm9yZVVwZGF0ZUFyZy5kYXRhO1xyXG5cdFx0XHRpZiAoIXRoaXMuX2Jsb2NrRXZlbnQpIHtcclxuXHRcdFx0XHR0aGlzLl9ibG9ja0V2ZW50ID0gdHJ1ZTtcclxuXHRcdFx0XHR0aGlzLl9leHRlbnNpb24uZXhlY3V0ZUV4dGVuc2lvbignZGF0YUFmdGVyVXBkYXRlJywgYmVmb3JlVXBkYXRlQXJnKTtcclxuXHRcdFx0XHR0aGlzLl9ibG9ja0V2ZW50ID0gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHRoaXMuX3VwZGF0aW5nID0gZmFsc2U7XHJcblx0fVxyXG5cclxuXHRnZXRSb3dDb3VudCAoKSB7XHJcblx0XHRpZiAodGhpcy5fZGF0YU1vZGVsLmRhdGEpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2RhdGFNb2RlbC5kYXRhLmxlbmd0aDtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiAwO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Z2V0QWxsRGF0YSAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fZGF0YU1vZGVsLmRhdGE7XHJcblx0fVxyXG5cclxuXHRhZGRSb3cgKHJvd0RhdGEpIHtcclxuXHRcdHRoaXMuaW5zZXJ0Um93KHRoaXMuZ2V0Um93Q291bnQoKSwgcm93RGF0YSk7XHJcblx0fVxyXG5cclxuXHRpbnNlcnRSb3cgKGF0SW5kZXgsIHJvd0RhdGEpIHtcclxuXHRcdHRoaXMuX2RhdGFNb2RlbC5kYXRhLnNwbGljZShhdEluZGV4LCAwLCByb3dEYXRhKTtcclxuXHR9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IERhdGE7IiwiY2xhc3MgRXZlbnREaXNwYXRjaGVyIHtcclxuXHJcblx0Y29uc3RydWN0b3IoKSB7XHJcblx0XHR0aGlzLl9oYW5kbGVycyA9IHt9O1xyXG5cdH1cclxuXHJcblx0bGlzdGVuKGV2ZW50TmFtZSwgaGFuZGxlcikge1xyXG5cdFx0aWYgKCF0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdKSB7XHJcblx0XHRcdHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0gPSBbXTtcclxuXHRcdH1cclxuXHRcdHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0ucHVzaChoYWRubGVyKTtcclxuXHR9XHJcblxyXG5cdHVubGlzdGVuKGV2ZW50TmFtZSwgaGFuZGxlcikge1xyXG5cdFx0aWYgKHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0pIHtcclxuXHRcdFx0bGV0IGluZGV4ID0gdGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXS5pbmRleE9mKGhhbmRsZXIpO1xyXG5cdFx0XHRpZiAoaW5kZXggPiAtMSkge1xyXG5cdFx0XHRcdHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0aGFzTGlzdGVuZXIoZXZlbnROYW1lKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXSAmJiB0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdLmxlbmd0aCA+IDA7XHJcblx0fVxyXG5cclxuXHRkaXNwYXRjaChldmVudE5hbWUsIGV2ZW50QXJnKSB7XHJcblx0XHRpZiAodGhpcy5oYXNMaXN0ZW5lcihldmVudE5hbWUpKSB7XHJcblx0XHRcdGxldCBsaXN0ZW5lcnMgPSB0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdO1xyXG5cdFx0XHRmb3IgKGxldCBpPTA7IGk8bGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0bGlzdGVuZXJzW2ldKGV2ZW50QXJnKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEV2ZW50RGlzcGF0Y2hlcjsiLCJjbGFzcyBFeHRlbnNpb24ge1xyXG5cclxuXHRjb25zdHJ1Y3RvciAoZ3JpZCwgY29uZmlnKSB7XHJcblx0XHR0aGlzLl9ncmlkID0gZ3JpZDtcclxuXHRcdHRoaXMuX2NvbmZpZyA9IGNvbmZpZztcclxuXHJcblx0XHR0aGlzLl9leHRlbnNpb25zID0ge1xyXG5cdFx0XHRjZWxsQWZ0ZXJSZW5kZXI6IFtdLFxyXG5cdFx0XHRjZWxsQWZ0ZXJVcGRhdGU6IFtdLFxyXG5cdFx0XHRrZXlEb3duOiBbXSxcclxuXHRcdFx0Z3JpZEFmdGVyUmVuZGVyOiBbXSxcclxuXHRcdFx0ZGF0YUJlZm9yZVJlbmRlcjogW10sXHJcblx0XHRcdGRhdGFCZWZvcmVVcGRhdGU6IFtdLFxyXG5cdFx0XHRkYXRhQWZ0ZXJVcGRhdGU6IFtdXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRsb2FkRXh0ZW5zaW9uIChleHQpIHtcclxuXHRcdGlmIChleHRbJ2luaXQnXSkge1xyXG5cdFx0XHRleHRbJ2luaXQnXSh0aGlzLl9ncmlkLCB0aGlzLl9jb25maWcpO1xyXG5cdFx0fVxyXG5cdFx0Zm9yIChsZXQgZXh0UG9pbnQgaW4gdGhpcy5fZXh0ZW5zaW9ucykge1xyXG5cdFx0XHRpZiAoZXh0W2V4dFBvaW50XSkge1xyXG5cdFx0XHRcdHRoaXMuX2V4dGVuc2lvbnNbZXh0UG9pbnRdLnB1c2goZXh0KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cXVlcnlFeHRlbnNpb24gKGV4dFBvaW50KSB7XHJcblx0XHRpZiAodGhpcy5fZXh0ZW5zaW9uc1tleHRQb2ludF0pIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2V4dGVuc2lvbnNbZXh0UG9pbnRdO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIFtdO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZXhlY3V0ZUV4dGVuc2lvbiAoZXh0UG9pbnQpIHtcclxuXHRcdHRoaXMucXVlcnlFeHRlbnNpb24oZXh0UG9pbnQpLmZvckVhY2goKGV4dCkgPT4ge1xyXG5cdFx0XHRleHRbZXh0UG9pbnRdLmFwcGx5KGV4dCwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBFeHRlbnNpb247IiwiaW1wb3J0IFZpZXcgZnJvbSAnLi92aWV3JztcclxuaW1wb3J0IE1vZGVsIGZyb20gJy4vbW9kZWwnO1xyXG5pbXBvcnQgRGF0YSBmcm9tICcuL2RhdGEnO1xyXG5pbXBvcnQgRXh0ZW5zaW9uIGZyb20gJy4vZXh0ZW5zaW9uJztcclxuaW1wb3J0IFN0YXRlIGZyb20gJy4vc3RhdGUnO1xyXG5pbXBvcnQgRXZlbnREaXNwYXRjaGVyIGZyb20gJy4vZXZlbnQnO1xyXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi91dGlscyc7XHJcblxyXG5pbXBvcnQgU2VsZWN0aW9uRXh0ZW5zaW9uIGZyb20gJy4uL2V4dGVuc2lvbnMvc2VsZWN0aW9uJztcclxuaW1wb3J0IEVkaXRvckV4dGVuc2lvbiBmcm9tICcuLi9leHRlbnNpb25zL2VkaXRvcic7XHJcbmltcG9ydCBDb3B5UGFzdGVFeHRlbnNpb24gZnJvbSAnLi4vZXh0ZW5zaW9ucy9jb3B5cGFzdGUnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFBHcmlkIGV4dGVuZHMgRXZlbnREaXNwYXRjaGVyIHtcclxuXHJcblx0Y29uc3RydWN0b3IoY29uZmlnKSB7XHJcblx0XHRzdXBlcigpO1xyXG5cclxuXHRcdC8vTWVyZ2UgY29uZmlnIHdpdGggZGVmYXVsdCBjb25maWdcclxuXHRcdGxldCBkZWZhdWx0Q29uZmlnID0ge1xyXG5cdFx0XHRyb3dDb3VudDogMCxcclxuXHRcdFx0Y29sdW1uQ291bnQ6IDAsXHJcblx0XHRcdHJvd0hlaWdodDogMzIsXHJcblx0XHRcdGNvbHVtbldpZHRoOiAxMDBcclxuXHRcdH07XHJcblx0XHR0aGlzLl9jb25maWcgPSBVdGlscy5taXhpbihjb25maWcsIGRlZmF1bHRDb25maWcpO1xyXG5cclxuXHRcdC8vRXh0ZW5zaW9ucyBTdG9yZVxyXG5cdFx0dGhpcy5fZXh0ZW5zaW9ucyA9IG5ldyBFeHRlbnNpb24odGhpcywgdGhpcy5fY29uZmlnKTtcclxuXHJcblx0XHR0aGlzLl9kYXRhID0gbmV3IERhdGEodGhpcy5fY29uZmlnLmRhdGFNb2RlbCwgdGhpcy5fZXh0ZW5zaW9ucyk7XHJcblx0XHR0aGlzLl9tb2RlbCA9IG5ldyBNb2RlbCh0aGlzLl9jb25maWcsIHRoaXMuX2RhdGEpO1xyXG5cdFx0dGhpcy5fdmlldyA9IG5ldyBWaWV3KHRoaXMuX21vZGVsLCB0aGlzLl9kYXRhLCB0aGlzLl9leHRlbnNpb25zKTtcclxuXHRcdHRoaXMuX3N0YXRlID0gbmV3IFN0YXRlKCk7XHJcblxyXG5cdFx0Ly9Mb2FkIGRlZmF1bHQgZXh0ZW5zaW9uc1xyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5zZWxlY3Rpb24pIHtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5sb2FkRXh0ZW5zaW9uKG5ldyBTZWxlY3Rpb25FeHRlbnNpb24oKSk7XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmVkaXRpbmcpIHtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5sb2FkRXh0ZW5zaW9uKG5ldyBFZGl0b3JFeHRlbnNpb24oKSk7XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmNvcHlwYXN0ZSkge1xyXG5cdFx0XHR0aGlzLl9leHRlbnNpb25zLmxvYWRFeHRlbnNpb24obmV3IENvcHlQYXN0ZUV4dGVuc2lvbigpKTtcclxuXHRcdH1cclxuXHJcblx0XHQvL0xvYWQgaW5pdGlhbCBleHRlcm5hbCBleHRlbnNpb25zXHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmV4dGVuc2lvbnMgJiYgdGhpcy5fY29uZmlnLmV4dGVuc2lvbnMubGVuZ3RoID4gMCkge1xyXG5cdFx0XHR0aGlzLl9jb25maWcuZXh0ZW5zaW9ucy5mb3JFYWNoKChleHQpID0+IHtcclxuXHRcdFx0XHR0aGlzLl9leHRlbnNpb25zLmxvYWRFeHRlbnNpb24oZXh0KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRnZXQgdmlldygpIHtcclxuXHRcdHJldHVybiB0aGlzLl92aWV3O1xyXG5cdH1cclxuXHJcblx0Z2V0IG1vZGVsKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX21vZGVsO1xyXG5cdH1cclxuXHJcblx0Z2V0IGRhdGEoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fZGF0YTtcclxuXHR9XHJcblxyXG5cdGdldCBleHRlbnNpb24oKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fZXh0ZW5zaW9ucztcclxuXHR9XHJcblxyXG5cdGdldCBzdGF0ZSAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fc3RhdGU7XHJcblx0fVxyXG5cclxuXHRyZW5kZXIoZWxlbWVudCkge1xyXG5cdFx0dGhpcy5fdmlldy5yZW5kZXIoZWxlbWVudCk7XHJcblx0fVxyXG5cclxuXHRhZGRSb3cocm93RGF0YSkge1xyXG5cdFx0dGhpcy5pbnNlcnRSb3codGhpcy5kYXRhLmdldFJvd0NvdW50KCksIHJvd0RhdGEpO1xyXG5cdH1cclxuXHJcblx0aW5zZXJ0Um93KGF0SW5kZXgsIHJvd0RhdGEpIHtcclxuXHRcdHRoaXMuZGF0YS5pbnNlcnRSb3coYXRpbmRleCwgcm93RGF0YSk7XHJcblx0XHRcclxuXHRcdGxldCBtb2RlbFJvd0NvdW50ID0gdGhpcy5tb2RlbC5nZXRSb3dDb3VudCgpO1xyXG5cdFx0bGV0IGRhdGFSb3dDb3VudCA9IHRoaXMuZGF0YS5nZXRSb3dDb3VudCgpO1xyXG5cdFx0aWYgKG1vZGVsUm93Q291bnQgPCBkYXRhUm93Q291bnQpIHtcclxuXHRcdFx0bGV0IGRpZmYgPSBkYXRhUm93Q291bnQgLSBtb2RlbFJvd0NvdW50O1xyXG5cdFx0XHRcclxuXHRcdH1cclxuXHR9XHJcblxyXG59IiwiaW1wb3J0IEV2ZW50RGlzcGF0Y2hlciBmcm9tICcuL2V2ZW50JztcclxuXHJcbmNsYXNzIE1vZGVsIGV4dGVuZHMgRXZlbnREaXNwYXRjaGVyIHtcclxuXHJcblx0Y29uc3RydWN0b3IgKGNvbmZpZywgZGF0YSkge1xyXG5cdFx0c3VwZXIoKTtcclxuXHRcdHRoaXMuX2NvbmZpZyA9IGNvbmZpZztcclxuXHRcdHRoaXMuX2RhdGEgPSBkYXRhO1xyXG5cclxuXHRcdHRoaXMuX2NvbHVtbk1vZGVsID0ge307XHJcblx0XHR0aGlzLl9yb3dNb2RlbCA9IHt9O1xyXG5cdFx0dGhpcy5fY2VsbE1vZGVsID0ge307XHJcblxyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5jb2x1bW5zKSB7XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTx0aGlzLl9jb25maWcuY29sdW1ucy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdHRoaXMuX2NvbHVtbk1vZGVsW3RoaXMuX2NvbmZpZy5jb2x1bW5zW2ldLmldID0gdGhpcy5fY29uZmlnLmNvbHVtbnNbaV07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmICh0aGlzLl9jb25maWcucm93cykge1xyXG5cdFx0XHRmb3IgKGxldCBpPTA7IGk8dGhpcy5fY29uZmlnLnJvd3MubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHR0aGlzLl9yb3dNb2RlbFt0aGlzLl9jb25maWcucm93c1tpXS5pXSA9IHRoaXMuX2NvbmZpZy5yb3dzW2ldO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmNlbGxzKSB7XHJcblx0XHRcdGZvciAobGV0IGk9MDsgaTx0aGlzLl9jb25maWcuY2VsbHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRsZXQgbW9kZWwgPSB0aGlzLl9jb25maWcuY2VsbHNbaV07XHJcblx0XHRcdFx0aWYgKCF0aGlzLl9jZWxsTW9kZWxbbW9kZWwuY10pIHtcclxuXHRcdFx0XHRcdHRoaXMuX2NlbGxNb2RlbFttb2RlbC5jXSA9IHt9O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLl9jZWxsTW9kZWxbbW9kZWwuY11bbW9kZWwucl0gPSBtb2RlbDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuX2NhbGNUb3RhbFNpemUoKTtcclxuXHR9XHJcblxyXG5cdGNhbkVkaXQgKHJvd0luZGV4LCBjb2xJbmRleCkge1xyXG5cdFx0bGV0IHJvd01vZGVsID0gdGhpcy5nZXRSb3dNb2RlbChyb3dJbmRleCk7XHJcblx0XHRsZXQgY29sTW9kZWwgPSB0aGlzLmdldENvbHVtbk1vZGVsKGNvbEluZGV4KTtcclxuXHRcdGxldCBjZWxsTW9kZWwgPSB0aGlzLmdldENlbGxNb2RlbChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cclxuXHRcdGlmICgocm93TW9kZWwgJiYgcm93TW9kZWwuZWRpdGFibGUpIHx8XHJcblx0XHRcdChjb2xNb2RlbCAmJiBjb2xNb2RlbC5lZGl0YWJsZSkgfHxcclxuXHRcdFx0KGNlbGxNb2RlbCAmJiBjZWxsTW9kZWwuZWRpdGFibGUpKSB7XHJcblx0XHRcdGlmICgocm93TW9kZWwgJiYgcm93TW9kZWwuZWRpdGFibGUgPT09IGZhbHNlKSB8fFxyXG5cdFx0XHRcdChjb2xNb2RlbCAmJiBjb2xNb2RlbC5lZGl0YWJsZSA9PT0gZmFsc2UpIHx8XHJcblx0XHRcdFx0KGNlbGxNb2RlbCAmJiBjZWxsTW9kZWwuZWRpdGFibGUgPT09IGZhbHNlKSkge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9XHJcblxyXG5cdGdldENvbHVtbldpZHRoIChjb2xJbmRleCkge1xyXG5cdFx0bGV0IGNvbE1vZGVsID0gdGhpcy5fY29sdW1uTW9kZWxbY29sSW5kZXhdO1xyXG5cdFx0aWYgKGNvbE1vZGVsICYmIGNvbE1vZGVsLndpZHRoICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0cmV0dXJuIGNvbE1vZGVsLndpZHRoO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2NvbmZpZy5jb2x1bW5XaWR0aDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldFJvd0hlaWdodCAocm93SW5kZXgpIHtcclxuXHRcdGxldCByb3dNb2RlbCA9IHRoaXMuX3Jvd01vZGVsW3Jvd0luZGV4XTtcclxuXHRcdGlmIChyb3dJbmRleCAmJiByb3dJbmRleC5oZWlnaHQgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRyZXR1cm4gcm93TW9kZWwuaGVpZ2h0O1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2NvbmZpZy5yb3dIZWlnaHQ7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRnZXRDb2x1bW5Db3VudCAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLmNvbHVtbkNvdW50O1xyXG5cdH1cclxuXHJcblx0Z2V0Um93Q291bnQgKCkge1xyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5yb3dDb3VudCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLnJvd0NvdW50O1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2RhdGEuZ2V0Um93Q291bnQoKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldFRvcEZyZWV6ZVJvd3MgKCkge1xyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lICYmIHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lLnRvcCA+IDApIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lLnRvcDtcclxuXHRcdH1cclxuXHRcdHJldHVybiAwO1xyXG5cdH1cclxuXHJcblx0Z2V0VG9wRnJlZXplU2l6ZSAoKSB7XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUgJiYgdGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUudG9wID4gMCkge1xyXG5cdFx0XHRsZXQgc3VtID0gMDtcclxuXHRcdFx0Zm9yIChsZXQgaT0wOyBpPHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lLnRvcDsgaSsrKSB7XHJcblx0XHRcdFx0c3VtICs9IHRoaXMuZ2V0Um93SGVpZ2h0KGkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBzdW07XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gMDtcclxuXHR9XHJcblxyXG5cdGdldExlZnRGcmVlemVSb3dzICgpIHtcclxuXHRcdGlmICh0aGlzLl9jb25maWcuZnJlZXplUGFuZSAmJiB0aGlzLl9jb25maWcuZnJlZXplUGFuZS5sZWZ0ID4gMCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUubGVmdDtcclxuXHRcdH1cclxuXHRcdHJldHVybiAwO1xyXG5cdH1cclxuXHJcblx0Z2V0TGVmdEZyZWV6ZVNpemUgKCkge1xyXG5cdFx0aWYgKHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lICYmIHRoaXMuX2NvbmZpZy5mcmVlemVQYW5lLmxlZnQgPiAwKSB7XHJcblx0XHRcdGxldCBzdW0gPSAwO1xyXG5cdFx0XHRmb3IgKGxldCBpPTA7IGk8dGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUubGVmdDsgaSsrKSB7XHJcblx0XHRcdFx0c3VtICs9IHRoaXMuZ2V0Q29sdW1uV2lkdGgoaSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHN1bTtcclxuXHRcdH1cclxuXHRcdHJldHVybiAwO1xyXG5cdH1cclxuXHJcblx0Z2V0Qm90dG9tRnJlZXplUm93cyAoKSB7XHJcblx0XHRpZiAodGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUgJiYgdGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUuYm90dG9tID4gMCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUuYm90dG9tO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIDA7XHJcblx0fVxyXG5cclxuXHRnZXRCb3R0b21GcmVlemVTaXplICgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9ib3R0b21GcmVlemVTaXplO1xyXG5cdH1cclxuXHJcblx0Z2V0Q29sdW1uV2lkdGggKGluZGV4KSB7XHJcblx0XHRpZiAodGhpcy5fY29sdW1uTW9kZWxbaW5kZXhdICYmIHRoaXMuX2NvbHVtbk1vZGVsW2luZGV4XS53aWR0aCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLl9jb2x1bW5Nb2RlbFtpbmRleF0ud2lkdGg7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLmNvbHVtbldpZHRoO1xyXG5cdH1cclxuXHJcblx0Z2V0Um93SGVpZ2h0IChpbmRleCkge1xyXG5cdFx0aWYgKHRoaXMuX3Jvd01vZGVsW2luZGV4XSAmJiB0aGlzLl9yb3dNb2RlbFtpbmRleF0uaGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX3Jvd01vZGVsW2luZGV4XS5oZWlnaHQ7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcy5fY29uZmlnLnJvd0hlaWdodDtcclxuXHR9XHJcblxyXG5cdGdldFRvdGFsV2lkdGggKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX3RvdGFsV2lkdGg7XHJcblx0fVxyXG5cclxuXHRnZXRUb3RhbEhlaWdodCAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fdG90YWxIZWlnaHQ7XHJcblx0fVxyXG5cclxuXHRnZXRSb3dNb2RlbCAocm93SW5kZXgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9yb3dNb2RlbFtyb3dJbmRleF07XHJcblx0fVxyXG5cclxuXHRnZXRDb2x1bW5Nb2RlbCAoY29sSW5kZXgpIHtcclxuXHRcdHJldHVybiB0aGlzLl9jb2x1bW5Nb2RlbFtjb2xJbmRleF07XHJcblx0fVxyXG5cclxuXHRnZXRDZWxsTW9kZWwgKHJvd0luZGV4LCBjb2xJbmRleCkge1xyXG5cdFx0aWYgKHRoaXMuX2NlbGxNb2RlbFtjb2xJbmRleF0pIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2NlbGxNb2RlbFtjb2xJbmRleF1bcm93SW5kZXhdO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Z2V0Q2FzY2FkZWRDZWxsUHJvcCAocm93SW5kZXgsIGNvbEluZGV4LCBwcm9wTmFtZSkge1xyXG5cdFx0aWYgKHRoaXMuX2NlbGxNb2RlbFtjb2xJbmRleF0gJiYgdGhpcy5fY2VsbE1vZGVsW2NvbEluZGV4XVtyb3dJbmRleF0gJiYgdGhpcy5fY2VsbE1vZGVsW2NvbEluZGV4XVtyb3dJbmRleF1bcHJvcE5hbWVdKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLl9jZWxsTW9kZWxbY29sSW5kZXhdW3Jvd0luZGV4XTtcclxuXHRcdH0gZWxzZVxyXG5cdFx0aWYgKHRoaXMuX3Jvd01vZGVsW3Jvd0luZGV4XSAmJiB0aGlzLl9yb3dNb2RlbFtyb3dJbmRleF1bcHJvcE5hbWVdKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLl9yb3dNb2RlbFtyb3dJbmRleF1bcHJvcE5hbWVdO1xyXG5cdFx0fSBlbHNlXHJcblx0XHRpZiAodGhpcy5fY29sdW1uTW9kZWxbY29sSW5kZXhdICYmIHRoaXMuX2NvbHVtbk1vZGVsW2NvbEluZGV4XVtwcm9wTmFtZV0pIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2NvbHVtbk1vZGVsW2NvbEluZGV4XVtwcm9wTmFtZV07XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xyXG5cdH0gXHJcblxyXG5cdGdldENlbGxDbGFzc2VzIChyb3dJbmRleCwgY29sSW5kZXgpIHtcclxuXHRcdGxldCBvdXRwdXQgPSBbXTtcclxuXHRcdGxldCBjb2xNb2RlbCA9IHRoaXMuX2NvbHVtbk1vZGVsW2NvbEluZGV4XTtcclxuXHRcdGlmIChjb2xNb2RlbCkge1xyXG5cdFx0XHRpZiAoY29sTW9kZWwudHlwZSA9PSAnaGVhZGVyJykge1xyXG5cdFx0XHRcdG91dHB1dC51bnNoaWZ0KCdwZ3JpZC1jb2x1bW4taGVhZGVyJyk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGNvbE1vZGVsLmNzc0NsYXNzKSB7XHJcblx0XHRcdFx0b3V0cHV0LnVuc2hpZnQoY29sTW9kZWwuY3NzQ2xhc3MpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRsZXQgcm93TW9kZWwgPSB0aGlzLl9yb3dNb2RlbFtyb3dJbmRleF07XHJcblx0XHRpZiAocm93TW9kZWwpIHtcclxuXHRcdFx0aWYgKHJvd01vZGVsLnR5cGUgPT0gJ2hlYWRlcicpIHtcclxuXHRcdFx0XHRvdXRwdXQudW5zaGlmdCgncGdyaWQtcm93LWhlYWRlcicpO1xyXG5cdFx0XHR9IGVsc2VcclxuXHRcdFx0aWYgKHJvd01vZGVsLnR5cGUgPT0gJ2Zvb3RlcicpIHtcclxuXHRcdFx0XHRvdXRwdXQudW5zaGlmdCgncGdyaWQtcm93LWZvb3RlcicpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChyb3dNb2RlbC5jc3NDbGFzcykge1xyXG5cdFx0XHRcdG91dHB1dC51bnNoaWZ0KHJvd01vZGVsLmNzc0NsYXNzKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKHRoaXMuX2NlbGxNb2RlbFtjb2xJbmRleF0gJiYgdGhpcy5fY2VsbE1vZGVsW2NvbEluZGV4XVtyb3dJbmRleF0pIHtcclxuXHRcdFx0bGV0IGNlbGxNb2RlbCA9IHRoaXMuX2NlbGxNb2RlbFtjb2xJbmRleF1bcm93SW5kZXhdO1xyXG5cdFx0XHRpZiAoY2VsbE1vZGVsLmNzc0NsYXNzKSB7XHJcblx0XHRcdFx0b3V0cHV0LnVuc2hpZnQoY2VsbE1vZGVsLmNzc0NsYXNzKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIG91dHB1dDtcclxuXHR9XHJcblxyXG5cdGRldGVybWluZVNjcm9sbGJhclN0YXRlICh2aWV3V2lkdGgsIHZpZXdIZWlnaHQsIHNjcm9sbGJhclNpemUpIHtcclxuXHRcdGxldCBuZWVkSCA9IHRoaXMuX3RvdGFsV2lkdGggPiB2aWV3V2lkdGg7XHJcblx0XHRsZXQgbmVlZFYgPSB0aGlzLl90b3RhbEhlaWdodCA+IHZpZXdIZWlnaHQ7XHJcblxyXG5cdFx0aWYgKG5lZWRIICYmICFuZWVkVikge1xyXG5cdFx0XHRuZWVkViA9IHRoaXMuX3RvdGFsSGVpZ2h0ID4gKHZpZXdIZWlnaHQgLSBzY3JvbGxiYXJTaXplKTtcclxuXHRcdH0gZWxzZVxyXG5cdFx0aWYgKCFuZWVkSCAmJiBuZWVkVikge1xyXG5cdFx0XHRuZWVkSCA9IHRoaXMuX3RvdGFsV2lkdGggPiAodmlld1dpZHRoIC0gc2Nyb2xsYmFyU2l6ZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKG5lZWRIICYmIG5lZWRWKSB7XHJcblx0XHRcdHJldHVybiAnYic7XHJcblx0XHR9IGVsc2VcclxuXHRcdGlmICghbmVlZEggJiYgbmVlZFYpIHtcclxuXHRcdFx0cmV0dXJuICd2JztcclxuXHRcdH0gZWxzZVxyXG5cdFx0aWYgKG5lZWRIICYmICFuZWVkVikge1xyXG5cdFx0XHRyZXR1cm4gJ2gnO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuICduJztcclxuXHR9XHJcblxyXG5cdF9jYWxjVG90YWxTaXplKCkge1xyXG5cdFx0dGhpcy5fY2FsY1RvdGFsV2lkdGgoKTtcclxuXHRcdHRoaXMuX2NhbGNUb3RhbEhlaWdodCgpO1xyXG5cdFx0dGhpcy5fY2FsY0JvdHRvbUZyZWV6ZVNpemUoKTtcclxuXHR9XHJcblxyXG5cdF9jYWxjVG90YWxXaWR0aCAoKSB7XHJcblx0XHRsZXQgY29sTW9kZWxDb3VudCA9IE9iamVjdC5rZXlzKHRoaXMuX2NvbHVtbk1vZGVsKTtcclxuXHRcdHRoaXMuX3RvdGFsV2lkdGggPSB0aGlzLl9jb25maWcuY29sdW1uV2lkdGggKiAodGhpcy5fY29uZmlnLmNvbHVtbkNvdW50IC0gY29sTW9kZWxDb3VudC5sZW5ndGgpO1xyXG5cdFx0Zm9yIChsZXQgaW5kZXggaW4gdGhpcy5fY29sdW1uTW9kZWwpIHtcclxuXHRcdFx0aWYgKHRoaXMuX2NvbHVtbk1vZGVsW2luZGV4XS53aWR0aCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0dGhpcy5fdG90YWxXaWR0aCArPSB0aGlzLl9jb2x1bW5Nb2RlbFtpbmRleF0ud2lkdGg7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5fdG90YWxXaWR0aCArPSB0aGlzLl9jb25maWcuY29sdW1uV2lkdGg7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdF9jYWxjVG90YWxIZWlnaHQgKCkge1xyXG5cdFx0bGV0IHJvd01vZGVsQ291bnQgPSBPYmplY3Qua2V5cyh0aGlzLl9yb3dNb2RlbCk7XHJcblx0XHR0aGlzLl90b3RhbEhlaWdodCA9IHRoaXMuX2NvbmZpZy5yb3dIZWlnaHQgKiAodGhpcy5fY29uZmlnLnJvd0NvdW50IC0gcm93TW9kZWxDb3VudC5sZW5ndGgpO1xyXG5cdFx0Zm9yIChsZXQgaW5kZXggaW4gdGhpcy5fcm93TW9kZWwpIHtcclxuXHRcdFx0aWYgKHRoaXMuX3Jvd01vZGVsW2luZGV4XS5oZWlnaHQgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdHRoaXMuX3RvdGFsSGVpZ2h0ICs9IHRoaXMuX3Jvd01vZGVsW2luZGV4XS5oZWlnaHQ7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5fdG90YWxIZWlnaHQgKz0gdGhpcy5fY29uZmlnLnJvd0hlaWdodDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0X2NhbGNCb3R0b21GcmVlemVTaXplICgpIHtcclxuXHRcdGlmICh0aGlzLl9jb25maWcuZnJlZXplUGFuZSAmJiB0aGlzLl9jb25maWcuZnJlZXplUGFuZS5ib3R0b20gPiAwKSB7XHJcblx0XHRcdGxldCBzdW0gPSAwO1xyXG5cdFx0XHRmb3IgKGxldCBpPTA7IGk8dGhpcy5fY29uZmlnLmZyZWV6ZVBhbmUuYm90dG9tOyBpKyspIHtcclxuXHRcdFx0XHRzdW0gKz0gdGhpcy5nZXRSb3dIZWlnaHQoKHRoaXMuX2NvbmZpZy5yb3dDb3VudC0xKS1pKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLl9ib3R0b21GcmVlemVTaXplID0gc3VtO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy5fYm90dG9tRnJlZXplU2l6ZSA9IDA7XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBNb2RlbDsiLCJjbGFzcyBTdGF0ZSB7XHJcblxyXG5cdGNvbnN0cnVjdG9yICgpIHtcclxuXHRcdHRoaXMuX3N0YXRlID0ge307XHJcblx0fVxyXG5cclxuXHRleGlzdHMgKGtleSkge1xyXG5cdFx0cmV0dXJuICh0aGlzLl9zdGF0ZVtrZXldICE9PSB1bmRlZmluZWQpO1xyXG5cdH1cclxuXHJcblx0Z2V0IChrZXkpIHtcclxuXHRcdHJldHVybiB0aGlzLl9zdGF0ZVtrZXldO1xyXG5cdH1cclxuXHJcblx0c2V0IChrZXksIHZhbHVlKSB7XHJcblx0XHR0aGlzLl9zdGF0ZVtrZXldID0gdmFsdWU7XHJcblx0fVxyXG5cdFxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBTdGF0ZTsiLCJjbGFzcyBVdGlscyB7XHJcblxyXG5cdHN0YXRpYyBtaXhpbihzb3VyY2UsIHRhcmdldCkge1xyXG5cdFx0Zm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcclxuXHRcdFx0aWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xyXG5cdFx0XHRcdHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRhcmdldDtcclxuXHR9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFV0aWxzOyIsImltcG9ydCBFdmVudERpc3BhdGNoZXIgZnJvbSAnLi9ldmVudCc7XHJcbmltcG9ydCBSZXNpemVPYnNlcnZlciBmcm9tICdyZXNpemUtb2JzZXJ2ZXItcG9seWZpbGwnO1xyXG5cclxuY2xhc3MgVmlldyBleHRlbmRzIEV2ZW50RGlzcGF0Y2hlciB7XHJcblxyXG5cdGNvbnN0cnVjdG9yIChtb2RlbCwgZGF0YSwgZXh0ZW5zaW9ucykge1xyXG5cdFx0c3VwZXIoKTtcclxuXHRcdHRoaXMuX21vZGVsID0gbW9kZWw7XHJcblx0XHR0aGlzLl9kYXRhID0gZGF0YTtcclxuXHRcdHRoaXMuX2V4dGVuc2lvbnMgPSBleHRlbnNpb25zO1xyXG5cdFx0dGhpcy5fdGVtcGxhdGUgPSBcdCc8ZGl2IGNsYXNzPVwicGdyaWQtY29udGVudC1wYW5lXCIgc3R5bGU9XCJwb3NpdGlvbjogcmVsYXRpdmU7XCI+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PGRpdiBjbGFzcz1cInBncmlkLXRvcC1sZWZ0LXBhbmVcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcIj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHRcdDxkaXYgY2xhc3M9XCJwZ3JpZC10b3AtbGVmdC1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgb3ZlcmZsb3c6IGhpZGRlbjsgcG9zaXRpb246IHJlbGF0aXZlO1wiPjwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDxkaXYgY2xhc3M9XCJwZ3JpZC10b3AtcGFuZVwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1wiPicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdFx0PGRpdiBjbGFzcz1cInBncmlkLXRvcC1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgb3ZlcmZsb3c6IGhpZGRlbjsgcG9zaXRpb246IHJlbGF0aXZlO1wiPjwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDxkaXYgY2xhc3M9XCJwZ3JpZC1sZWZ0LXBhbmVcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcIj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHRcdDxkaXYgY2xhc3M9XCJwZ3JpZC1sZWZ0LWlubmVyXCIgc3R5bGU9XCJ3aWR0aDogMTAwJTsgaGVpZ2h0OiAxMDAlOyBvdmVyZmxvdzogaGlkZGVuOyBwb3NpdGlvbjogcmVsYXRpdmU7XCI+PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PGRpdiBjbGFzcz1cInBncmlkLWNlbnRlci1wYW5lXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XCI+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0XHQ8ZGl2IGNsYXNzPVwicGdyaWQtY2VudGVyLWlubmVyXCIgc3R5bGU9XCJ3aWR0aDogMTAwJTsgaGVpZ2h0OiAxMDAlOyBvdmVyZmxvdzogaGlkZGVuOyBwb3NpdGlvbjogcmVsYXRpdmU7XCI+PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PGRpdiBjbGFzcz1cInBncmlkLWJvdHRvbS1sZWZ0LXBhbmVcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcIj4nICtcclxuXHRcdFx0XHRcdFx0XHQnXHRcdDxkaXYgY2xhc3M9XCJwZ3JpZC1ib3R0b20tbGVmdC1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgb3ZlcmZsb3c6IGhpZGRlbjsgcG9zaXRpb246IHJlbGF0aXZlO1wiPjwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDxkaXYgY2xhc3M9XCJwZ3JpZC1ib3R0b20tcGFuZVwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1wiPicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdFx0PGRpdiBjbGFzcz1cInBncmlkLWJvdHRvbS1pbm5lclwiIHN0eWxlPVwid2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgb3ZlcmZsb3c6IGhpZGRlbjsgcG9zaXRpb246IHJlbGF0aXZlO1wiPjwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCc8L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cInBncmlkLWhzY3JvbGxcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTsgYm90dG9tOiAwcHg7IG92ZXJmbG93LXk6IGhpZGRlbjsgb3ZlcmZsb3cteDogc2Nyb2xsO1wiPicgK1xyXG5cdFx0XHRcdFx0XHRcdCdcdDxkaXYgY2xhc3M9XCJwZ3JpZC1oc2Nyb2xsLXRodW1iXCI+PC9kaXY+JyArXHJcblx0XHRcdFx0XHRcdFx0JzwvZGl2PicgK1xyXG5cdFx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwicGdyaWQtdnNjcm9sbFwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlOyByaWdodDogMHB4OyB0b3A6IDBweDsgb3ZlcmZsb3cteTogc2Nyb2xsOyBvdmVyZmxvdy14OiBoaWRkZW47XCI+JyArXHJcblx0XHRcdFx0XHRcdFx0J1x0PGRpdiBjbGFzcz1cInBncmlkLXZzY3JvbGwtdGh1bWJcIj48L2Rpdj4nICtcclxuXHRcdFx0XHRcdFx0XHQnPC9kaXY+JztcclxuXHR9XHJcblxyXG5cdHJlbmRlciAoZWxlbWVudCkge1xyXG5cdFx0dGhpcy5fZWxlbWVudCA9IGVsZW1lbnQ7XHJcblx0XHR0aGlzLl9lbGVtZW50LmNsYXNzTmFtZSA9ICdwZ3JpZCc7XHJcblx0XHR0aGlzLl9lbGVtZW50LmlubmVySFRNTCA9IHRoaXMuX3RlbXBsYXRlO1xyXG5cdFx0dGhpcy5fZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XHJcblx0XHR0aGlzLl9lbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XHJcblx0XHR0aGlzLl9lbGVtZW50LnRhYkluZGV4ID0gMTtcclxuXHJcblx0XHR0aGlzLl9jb250ZW50UGFuZSA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLWNvbnRlbnQtcGFuZScpO1xyXG5cdFx0dGhpcy5fdG9wTGVmdFBhbmUgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC10b3AtbGVmdC1wYW5lJyk7XHJcblx0XHR0aGlzLl90b3BMZWZ0SW5uZXIgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC10b3AtbGVmdC1pbm5lcicpO1xyXG5cdFx0dGhpcy5fdG9wUGFuZSA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLXRvcC1wYW5lJyk7XHJcblx0XHR0aGlzLl90b3BJbm5lciA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLXRvcC1pbm5lcicpO1xyXG5cdFx0dGhpcy5fbGVmdFBhbmUgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1sZWZ0LXBhbmUnKTtcclxuXHRcdHRoaXMuX2xlZnRJbm5lciA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcignLnBncmlkLWxlZnQtaW5uZXInKTtcclxuXHRcdHRoaXMuX2NlbnRlclBhbmUgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1jZW50ZXItcGFuZScpO1xyXG5cdFx0dGhpcy5fY2VudGVySW5uZXIgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1jZW50ZXItaW5uZXInKTtcclxuXHRcdHRoaXMuX2JvdHRvbVBhbmUgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1ib3R0b20tcGFuZScpO1xyXG5cdFx0dGhpcy5fYm90dG9tSW5uZXIgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1ib3R0b20taW5uZXInKTtcclxuXHRcdHRoaXMuX2JvdHRvbUxlZnRQYW5lID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtYm90dG9tLWxlZnQtcGFuZScpO1xyXG5cdFx0dGhpcy5fYm90dG9tTGVmdElubmVyID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtYm90dG9tLWxlZnQtaW5uZXInKTtcclxuXHJcblx0XHR0aGlzLl9zY3JvbGxXaWR0aCA9IHRoaXMuX21lYXN1cmVTY3JvbGxiYXJXaWR0aCgpO1xyXG5cclxuXHRcdHRoaXMuX2hTY3JvbGwgPSB0aGlzLl9lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wZ3JpZC1oc2Nyb2xsJyk7XHJcblx0XHR0aGlzLl92U2Nyb2xsID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtdnNjcm9sbCcpO1xyXG5cdFx0dGhpcy5faFNjcm9sbFRodW1iID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtaHNjcm9sbC10aHVtYicpO1xyXG5cdFx0dGhpcy5fdlNjcm9sbFRodW1iID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucGdyaWQtdnNjcm9sbC10aHVtYicpO1xyXG5cdFx0dGhpcy5faFNjcm9sbC5zdHlsZS5oZWlnaHQgPSB0aGlzLl9zY3JvbGxXaWR0aCArICdweCc7XHJcblx0XHR0aGlzLl92U2Nyb2xsLnN0eWxlLndpZHRoID0gdGhpcy5fc2Nyb2xsV2lkdGggKyAncHgnO1xyXG5cdFx0dGhpcy5faFNjcm9sbFRodW1iLnN0eWxlLmhlaWdodCA9IHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4JztcclxuXHRcdHRoaXMuX3ZTY3JvbGxUaHVtYi5zdHlsZS53aWR0aCA9IHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4JztcclxuXHJcblx0XHR0aGlzLl9vYnNlcnZlU2l6ZSgpO1xyXG5cdFx0dGhpcy5fcmVzdHVyZWN0dXJlKCk7XHJcblx0XHR0aGlzLl9hdHRhY2hIYW5kbGVycygpO1xyXG5cclxuXHRcdHRoaXMuX2V4dGVuc2lvbnMuZXhlY3V0ZUV4dGVuc2lvbignZ3JpZEFmdGVyUmVuZGVyJywge1xyXG5cdFx0XHRncmlkOiB0aGlzXHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGdldEVsZW1lbnQgKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2VsZW1lbnQ7XHJcblx0fVxyXG5cclxuXHRzZXRTY3JvbGxYICh4LCBhZGp1c3RTY3JvbGxCYXIpIHtcclxuXHRcdHRoaXMuX3RvcElubmVyLnNjcm9sbExlZnQgPSB4O1xyXG5cdFx0dGhpcy5fY2VudGVySW5uZXIuc2Nyb2xsTGVmdCA9IHg7XHJcblx0XHR0aGlzLl9ib3R0b21Jbm5lci5zY3JvbGxMZWZ0ID0geDtcclxuXHRcdGlmIChhZGp1c3RTY3JvbGxCYXIgfHwgYWRqdXN0U2Nyb2xsQmFyID09PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0dGhpcy5faFNjcm9sbC5zY3JvbGxMZWZ0ID0geDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldFNjcm9sbFggKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX2NlbnRlcklubmVyLnNjcm9sbExlZnQ7XHJcblx0fVxyXG5cclxuXHRzZXRTY3JvbGxZICh5LCBhZGp1c3RTY3JvbGxCYXIpIHtcclxuXHRcdHRoaXMuX2NlbnRlcklubmVyLnNjcm9sbFRvcCA9IHk7XHJcblx0XHR0aGlzLl9sZWZ0SW5uZXIuc2Nyb2xsVG9wID0geTtcclxuXHRcdGlmIChhZGp1c3RTY3JvbGxCYXIgfHwgYWRqdXN0U2Nyb2xsQmFyID09PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0dGhpcy5fdlNjcm9sbC5zY3JvbGxUb3AgPSB5O1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Z2V0U2Nyb2xsWSAoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fY2VudGVySW5uZXIuc2Nyb2xsVG9wO1xyXG5cdH1cclxuXHJcblx0c2Nyb2xsVG9DZWxsIChyb3dJbmRleCwgY29sSW5kZXgsIGFsaWduVG9wKSB7XHJcblx0XHRsZXQgY2VsbCA9IHRoaXMuZ2V0Q2VsbChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cdFx0bGV0IG9yaWdTY3JvbGxUb3AgPSBjZWxsLnBhcmVudEVsZW1lbnQuc2Nyb2xsVG9wO1xyXG5cdFx0bGV0IG9yaWdTY3JvbGxMZWZ0ID0gY2VsbC5wYXJlbnRFbGVtZW50LnNjcm9sbExlZnQ7XHJcblxyXG5cdFx0Y2VsbC5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKGZhbHNlKTtcclxuXHJcblx0XHRpZiAob3JpZ1Njcm9sbFRvcCAhPT0gY2VsbC5wYXJlbnRFbGVtZW50LnNjcm9sbFRvcCkge1xyXG5cdFx0XHR0aGlzLnNldFNjcm9sbFkoY2VsbC5wYXJlbnRFbGVtZW50LnNjcm9sbFRvcCwgdHJ1ZSk7XHJcblx0XHR9XHJcblx0XHRpZiAob3JpZ1Njcm9sbExlZnQgIT09IGNlbGwucGFyZW50RWxlbWVudC5zY3JvbGxMZWZ0KSB7XHJcblx0XHRcdHRoaXMuc2V0U2Nyb2xsWChjZWxsLnBhcmVudEVsZW1lbnQuc2Nyb2xsTGVmdCwgdHJ1ZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRnZXRDZWxsIChyb3dJbmRleCwgY29sSW5kZXgpIHtcclxuXHRcdGxldCBjZWxsID0gdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1yb3ctaW5kZXg9XCInK3Jvd0luZGV4KydcIl1bZGF0YS1jb2wtaW5kZXg9XCInK2NvbEluZGV4KydcIl0nKTtcclxuXHRcdHJldHVybiBjZWxsO1xyXG5cdH1cclxuXHJcblx0dXBkYXRlQ2VsbCAocm93SW5kZXgsIGNvbEluZGV4KSB7XHJcblx0XHRsZXQgY2VsbCA9IHRoaXMuZ2V0Q2VsbChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cdFx0aWYgKGNlbGwpIHtcclxuXHRcdFx0Ly9DcmVhdGUgY2VsbCBjb250ZW50IHdyYXBwZXIgaWYgbm90IGFueVxyXG5cdFx0XHRsZXQgY2VsbENvbnRlbnQgPSBudWxsO1xyXG5cdFx0XHRpZiAoIWNlbGwuZmlyc3RDaGlsZCB8fCAhY2VsbC5maXJzdENoaWxkLmNsYXNzTGlzdC5jb250YWlucygncGdyaWQtY2VsbC1jb250ZW50JykpIHtcclxuXHRcdFx0XHQvL0NsZWFyIGNlbGxcclxuXHRcdFx0XHRjZWxsLmlubmVySFRNTCA9ICcnO1xyXG5cclxuXHRcdFx0XHQvL0FkZCBuZXcgY2VsbCBjb250ZW50XHJcblx0XHRcdFx0Y2VsbENvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHRcdFx0XHRjZWxsQ29udGVudC5jbGFzc05hbWUgPSAncGdyaWQtY2VsbC1jb250ZW50JztcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRjZWxsQ29udGVudCA9IGNlbGwuZmlyc3RDaGlsZDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly9SZW5kZXIgZGF0YVxyXG5cdFx0XHRsZXQgZGF0YSA9IHRoaXMuX2RhdGEuZ2V0RGF0YUF0KHJvd0luZGV4LCBjb2xJbmRleCk7XHJcblxyXG5cdFx0XHQvL0RhdGEgY2FiIGJlIHRyYW5zZm9ybWVkIGJlZm9yZSByZW5kZXJpbmcgdXNpbmcgZGF0YUJlZm9yZVJlbmRlciBleHRlbnNpb25cclxuXHRcdFx0bGV0IGFyZyA9IHtkYXRhOiBkYXRhfTtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5leGVjdXRlRXh0ZW5zaW9uKCdkYXRhQmVmb3JlUmVuZGVyJywgYXJnKTtcclxuXHRcdFx0ZGF0YSA9IGFyZy5kYXRhO1xyXG5cclxuXHRcdFx0aWYgKGRhdGEgIT09IHVuZGVmaW5lZCAmJiBkYXRhICE9PSBudWxsKSB7XHJcblx0XHRcdFx0Y2VsbENvbnRlbnQuaW5uZXJIVE1MID0gZGF0YTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRjZWxsQ29udGVudC5pbm5lckhUTUwgPSAnJztcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2VsbC5hcHBlbmRDaGlsZChjZWxsQ29udGVudCk7XHJcblxyXG5cdFx0XHR0aGlzLl9leHRlbnNpb25zLmV4ZWN1dGVFeHRlbnNpb24oJ2NlbGxBZnRlclVwZGF0ZScsIHtcclxuXHRcdFx0XHRjZWxsOiBjZWxsLFxyXG5cdFx0XHRcdHJvd0luZGV4OiByb3dJbmRleCxcclxuXHRcdFx0XHRjb2xJbmRleDogY29sSW5kZXgsXHJcblx0XHRcdFx0ZGF0YTogZGF0YVxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdFxyXG5cclxuXHRfYXR0YWNoSGFuZGxlcnMgKCkge1xyXG5cclxuXHRcdHRoaXMuX3ZTY3JvbGxIYW5kbGVyID0gKGUpID0+IHtcclxuXHRcdFx0dGhpcy5zZXRTY3JvbGxZKGUudGFyZ2V0LnNjcm9sbFRvcCwgZmFsc2UpO1xyXG5cdFx0fTtcclxuXHJcblx0XHR0aGlzLl9oU2Nyb2xsSGFuZGxlciA9IChlKSA9PiB7XHJcblx0XHRcdHRoaXMuc2V0U2Nyb2xsWChlLnRhcmdldC5zY3JvbGxMZWZ0LCBmYWxzZSk7XHJcblx0XHR9O1xyXG5cclxuXHRcdHRoaXMuX3doZWVsSGFuZGxlciA9IChlKSA9PiB7XHJcblx0XHRcdGxldCBjdXJyZW50WCA9IHRoaXMuZ2V0U2Nyb2xsWCgpO1xyXG5cdFx0XHRsZXQgY3VycmVudFkgPSB0aGlzLmdldFNjcm9sbFkoKTtcclxuXHRcdFx0dGhpcy5zZXRTY3JvbGxYKGN1cnJlbnRYICsgZS5kZWx0YVgpO1xyXG5cdFx0XHR0aGlzLnNldFNjcm9sbFkoY3VycmVudFkgKyBlLmRlbHRhWSk7XHJcblx0XHR9O1xyXG5cclxuXHRcdHRoaXMuX2tleURvd25IYW5kbGVyID0gKGUpID0+IHtcclxuXHRcdFx0dGhpcy5fZXh0ZW5zaW9ucy5leGVjdXRlRXh0ZW5zaW9uKCdrZXlEb3duJywgZSk7XHJcblx0XHR9O1xyXG5cclxuXHRcdHRoaXMuX3ZTY3JvbGwuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcy5fdlNjcm9sbEhhbmRsZXIpO1xyXG5cdFx0dGhpcy5faFNjcm9sbC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLl9oU2Nyb2xsSGFuZGxlcik7XHJcblx0XHR0aGlzLl9jb250ZW50UGFuZS5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIHRoaXMuX3doZWVsSGFuZGxlcik7XHJcblx0XHR0aGlzLl9lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9rZXlEb3duSGFuZGxlcik7XHJcblxyXG5cdH1cclxuXHJcblx0X3Jlc3R1cmVjdHVyZSAoKSB7XHJcblx0XHR0aGlzLl9jb250ZW50UGFuZS5zdHlsZS53aWR0aCA9ICdjYWxjKDEwMCUgLSAnICsgdGhpcy5fc2Nyb2xsV2lkdGggKyAncHgpJztcclxuXHRcdHRoaXMuX2NvbnRlbnRQYW5lLnN0eWxlLmhlaWdodCA9ICdjYWxjKDEwMCUgLSAnICsgdGhpcy5fc2Nyb2xsV2lkdGggKyAncHgpJztcclxuXHJcblx0XHRsZXQgdG9wRnJlZXplU2l6ZSA9IHRoaXMuX21vZGVsLmdldFRvcEZyZWV6ZVNpemUoKTtcclxuXHRcdGxldCBib3R0b21GcmVlemVTaXplID0gdGhpcy5fbW9kZWwuZ2V0Qm90dG9tRnJlZXplU2l6ZSgpO1xyXG5cdFx0bGV0IGxlZnRGcmVlemVTaXplID0gdGhpcy5fbW9kZWwuZ2V0TGVmdEZyZWV6ZVNpemUoKTtcclxuXHJcblx0XHR0aGlzLl90b3BMZWZ0UGFuZS5zdHlsZS5sZWZ0ID0gJzBweCc7XHJcblx0XHR0aGlzLl90b3BMZWZ0UGFuZS5zdHlsZS50b3AgPSAnMHB4JztcclxuXHRcdHRoaXMuX3RvcExlZnRQYW5lLnN0eWxlLndpZHRoID0gbGVmdEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fdG9wTGVmdFBhbmUuc3R5bGUuaGVpZ2h0ID0gdG9wRnJlZXplU2l6ZSArICdweCc7XHJcblx0XHR0aGlzLl90b3BQYW5lLnN0eWxlLmxlZnQgPSBsZWZ0RnJlZXplU2l6ZSArICdweCc7XHJcblx0XHR0aGlzLl90b3BQYW5lLnN0eWxlLnRvcCA9ICcwcHgnO1xyXG5cdFx0dGhpcy5fdG9wUGFuZS5zdHlsZS53aWR0aCA9ICdjYWxjKDEwMCUgLSAnICsgbGVmdEZyZWV6ZVNpemUgKyAncHgpJztcclxuXHRcdHRoaXMuX3RvcFBhbmUuc3R5bGUuaGVpZ2h0ID0gdG9wRnJlZXplU2l6ZSArICdweCc7XHJcblx0XHR0aGlzLl9sZWZ0UGFuZS5zdHlsZS5sZWZ0ID0gJzBweCc7XHJcblx0XHR0aGlzLl9sZWZ0UGFuZS5zdHlsZS50b3AgPSB0b3BGcmVlemVTaXplICsgJ3B4JztcclxuXHRcdHRoaXMuX2xlZnRQYW5lLnN0eWxlLndpZHRoID0gbGVmdEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fbGVmdFBhbmUuc3R5bGUuaGVpZ2h0ID0gJ2NhbGMoMTAwJSAtICcgKyAodG9wRnJlZXplU2l6ZSArIGJvdHRvbUZyZWV6ZVNpemUpICsgJ3B4KSc7XHJcblx0XHR0aGlzLl9jZW50ZXJQYW5lLnN0eWxlLmxlZnQgPSBsZWZ0RnJlZXplU2l6ZSArICdweCc7XHJcblx0XHR0aGlzLl9jZW50ZXJQYW5lLnN0eWxlLnRvcCA9IHRvcEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fY2VudGVyUGFuZS5zdHlsZS53aWR0aCA9ICdjYWxjKDEwMCUgLSAnICsgbGVmdEZyZWV6ZVNpemUgKyAncHgpJztcclxuXHRcdHRoaXMuX2NlbnRlclBhbmUuc3R5bGUuaGVpZ2h0ID0gJ2NhbGMoMTAwJSAtICcgKyAodG9wRnJlZXplU2l6ZSArIGJvdHRvbUZyZWV6ZVNpemUpICsgJ3B4KSc7XHJcblx0XHR0aGlzLl9ib3R0b21MZWZ0UGFuZS5zdHlsZS5sZWZ0ID0gJzBweCc7XHJcblx0XHR0aGlzLl9ib3R0b21MZWZ0UGFuZS5zdHlsZS5ib3R0b20gPSAnMHB4JztcclxuXHRcdHRoaXMuX2JvdHRvbUxlZnRQYW5lLnN0eWxlLndpZHRoID0gbGVmdEZyZWV6ZVNpemUgKyAncHgnO1xyXG5cdFx0dGhpcy5fYm90dG9tTGVmdFBhbmUuc3R5bGUuaGVpZ2h0ID0gYm90dG9tRnJlZXplU2l6ZSArICdweCc7XHJcblx0XHR0aGlzLl9ib3R0b21QYW5lLnN0eWxlLmxlZnQgPSBsZWZ0RnJlZXplU2l6ZSArICdweCc7XHJcblx0XHR0aGlzLl9ib3R0b21QYW5lLnN0eWxlLmJvdHRvbSA9ICcwcHgnO1xyXG5cdFx0dGhpcy5fYm90dG9tUGFuZS5zdHlsZS53aWR0aCA9ICdjYWxjKDEwMCUgLSAnICsgbGVmdEZyZWV6ZVNpemUgKyAncHgpJztcclxuXHRcdHRoaXMuX2JvdHRvbVBhbmUuc3R5bGUuaGVpZ2h0ID0gYm90dG9tRnJlZXplU2l6ZSArICdweCc7XHJcblxyXG5cdFx0dGhpcy5fcmVuZGVyQ2VsbHMoKTtcclxuXHRcdHRoaXMuX3VwZGF0ZVNjcm9sbEJhcigpO1xyXG5cdH1cclxuXHJcblx0X29ic2VydmVTaXplICgpIHtcclxuXHRcdHRoaXMuX3Jlc2l6ZU9ic2VydmVyID0gbmV3IFJlc2l6ZU9ic2VydmVyKChlbnRyaWVzLCBvYnNlcnZlcikgPT4ge1xyXG5cdFx0XHR0aGlzLl91cGRhdGVTY3JvbGxCYXIoKTtcclxuXHRcdH0pO1xyXG5cdFx0dGhpcy5fcmVzaXplT2JzZXJ2ZXIub2JzZXJ2ZSh0aGlzLl9lbGVtZW50KTtcclxuXHR9XHJcblxyXG5cdF91cGRhdGVTY3JvbGxCYXIgKCkge1xyXG5cdFx0bGV0IHRvdGFsV2lkdGggPSB0aGlzLl9tb2RlbC5nZXRUb3RhbFdpZHRoKCk7XHJcblx0XHRsZXQgdG90YWxIZWlnaHQgPSB0aGlzLl9tb2RlbC5nZXRUb3RhbEhlaWdodCgpO1xyXG5cdFx0dGhpcy5faFNjcm9sbFRodW1iLnN0eWxlLndpZHRoID0gdG90YWxXaWR0aCArICdweCc7XHJcblx0XHR0aGlzLl92U2Nyb2xsVGh1bWIuc3R5bGUuaGVpZ2h0ID0gdG90YWxIZWlnaHQgKyAncHgnO1xyXG5cclxuXHRcdGxldCBncmlkUmVjdCA9IHRoaXMuX2VsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblx0XHRsZXQgc2Nyb2xsQmFyU3RhdGUgPSB0aGlzLl9tb2RlbC5kZXRlcm1pbmVTY3JvbGxiYXJTdGF0ZShncmlkUmVjdC53aWR0aCwgZ3JpZFJlY3QuaGVpZ2h0LCB0aGlzLl9zY3JvbGxXaWR0aCk7XHJcblxyXG5cdFx0c3dpdGNoIChzY3JvbGxCYXJTdGF0ZSkge1xyXG5cdFx0XHRjYXNlICduJzpcclxuXHRcdFx0XHR0aGlzLl9oU2Nyb2xsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0XHRcdFx0dGhpcy5fdlNjcm9sbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cdFx0XHRcdHRoaXMuX2NvbnRlbnRQYW5lLnN0eWxlLndpZHRoID0gJzEwMCUnO1xyXG5cdFx0XHRcdHRoaXMuX2NvbnRlbnRQYW5lLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAnaCc6XHJcblx0XHRcdFx0dGhpcy5faFNjcm9sbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuXHRcdFx0XHR0aGlzLl92U2Nyb2xsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblx0XHRcdFx0dGhpcy5faFNjcm9sbC5zdHlsZS53aWR0aCA9ICcxMDAlJztcclxuXHRcdFx0XHR0aGlzLl9jb250ZW50UGFuZS5zdHlsZS53aWR0aCA9ICcxMDAlJztcclxuXHRcdFx0XHR0aGlzLl9jb250ZW50UGFuZS5zdHlsZS5oZWlnaHQgPSAnY2FsYygxMDAlIC0gJyArIHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4KSc7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGNhc2UgJ3YnOlxyXG5cdFx0XHRcdHRoaXMuX2hTY3JvbGwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHRcdFx0XHR0aGlzLl92U2Nyb2xsLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG5cdFx0XHRcdHRoaXMuX3ZTY3JvbGwuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xyXG5cdFx0XHRcdHRoaXMuX2NvbnRlbnRQYW5lLnN0eWxlLndpZHRoID0gJ2NhbGMoMTAwJSAtICcgKyB0aGlzLl9zY3JvbGxXaWR0aCArICdweCknO1xyXG5cdFx0XHRcdHRoaXMuX2NvbnRlbnRQYW5lLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAnYic6XHJcblx0XHRcdFx0dGhpcy5faFNjcm9sbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuXHRcdFx0XHR0aGlzLl92U2Nyb2xsLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG5cdFx0XHRcdHRoaXMuX2hTY3JvbGwuc3R5bGUud2lkdGggPSAnY2FsYygxMDAlIC0gJyArIHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4KSc7XHJcblx0XHRcdFx0dGhpcy5fdlNjcm9sbC5zdHlsZS5oZWlnaHQgPSAnY2FsYygxMDAlIC0gJyArIHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4KSc7XHJcblx0XHRcdFx0dGhpcy5fY29udGVudFBhbmUuc3R5bGUud2lkdGggPSAnY2FsYygxMDAlIC0gJyArIHRoaXMuX3Njcm9sbFdpZHRoICsgJ3B4KSc7XHJcblx0XHRcdFx0dGhpcy5fY29udGVudFBhbmUuc3R5bGUuaGVpZ2h0ID0gJ2NhbGMoMTAwJSAtICcgKyB0aGlzLl9zY3JvbGxXaWR0aCArICdweCknO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0X3JlbmRlckNlbGxzICgpIHtcclxuXHRcdGxldCB0b3BGcmVlemUgPSB0aGlzLl9tb2RlbC5nZXRUb3BGcmVlemVSb3dzKCk7XHJcblx0XHRsZXQgbGVmdEZyZWV6ZSA9IHRoaXMuX21vZGVsLmdldExlZnRGcmVlemVSb3dzKCk7XHJcblx0XHRsZXQgYm90dG9tRnJlZXplID0gdGhpcy5fbW9kZWwuZ2V0Qm90dG9tRnJlZXplUm93cygpO1xyXG5cdFx0bGV0IHJvd0NvdW50ID0gdGhpcy5fbW9kZWwuZ2V0Um93Q291bnQoKTtcclxuXHRcdGxldCBjb2x1bW5Db3VudCA9IHRoaXMuX21vZGVsLmdldENvbHVtbkNvdW50KCk7XHJcblx0XHRsZXQgdG9wUnVubmVyID0gMDtcclxuXHRcdGxldCBsZWZ0UnVubmVyID0gMDtcclxuXHRcdGxldCBjb2xXaWR0aCA9IFtdO1xyXG5cclxuXHRcdC8vUmVuZGVyIHRvcCByb3dzXHJcblx0XHR0b3BSdW5uZXIgPSAwO1xyXG5cdFx0Zm9yIChsZXQgaj0wOyBqPHRvcEZyZWV6ZTsgaisrKSB7XHJcblx0XHRcdGxldCByb3dIZWlnaHQgPSB0aGlzLl9tb2RlbC5nZXRSb3dIZWlnaHQoaik7XHJcblx0XHRcdC8vUmVuZGVyIHRvcCBsZWZ0IGNlbGxzXHJcblx0XHRcdGxlZnRSdW5uZXIgPSAwO1xyXG5cdFx0XHRmb3IgKGxldCBpPTA7IGk8bGVmdEZyZWV6ZTsgaSsrKSB7XHJcblx0XHRcdFx0Y29sV2lkdGhbaV0gPSB0aGlzLl9tb2RlbC5nZXRDb2x1bW5XaWR0aChpKTtcclxuXHRcdFx0XHR0aGlzLl9yZW5kZXJDZWxsKGosIGksIHRoaXMuX3RvcExlZnRJbm5lciwgbGVmdFJ1bm5lciwgdG9wUnVubmVyLCBjb2xXaWR0aFtpXSwgcm93SGVpZ2h0KTtcclxuXHRcdFx0XHRsZWZ0UnVubmVyICs9IGNvbFdpZHRoW2ldO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vUmVuZGVyIHRvcCBjZWxsc1xyXG5cdFx0XHRsZWZ0UnVubmVyID0gMDtcclxuXHRcdFx0Zm9yIChsZXQgaT1sZWZ0RnJlZXplOyBpPGNvbHVtbkNvdW50OyBpKyspIHtcclxuXHRcdFx0XHRjb2xXaWR0aFtpXSA9IHRoaXMuX21vZGVsLmdldENvbHVtbldpZHRoKGkpO1xyXG5cdFx0XHRcdHRoaXMuX3JlbmRlckNlbGwoaiwgaSwgdGhpcy5fdG9wSW5uZXIsIGxlZnRSdW5uZXIsIHRvcFJ1bm5lciwgY29sV2lkdGhbaV0sIHJvd0hlaWdodCk7XHJcblx0XHRcdFx0bGVmdFJ1bm5lciArPSBjb2xXaWR0aFtpXTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0b3BSdW5uZXIgKz0gcm93SGVpZ2h0O1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vUmVuZGVyIG1pZGRsZSByb3dzXHJcblx0XHR0b3BSdW5uZXIgPSAwO1xyXG5cdFx0Zm9yIChsZXQgaj10b3BGcmVlemU7IGo8KHJvd0NvdW50LWJvdHRvbUZyZWV6ZSk7IGorKykge1xyXG5cdFx0XHRsZXQgcm93SGVpZ2h0ID0gdGhpcy5fbW9kZWwuZ2V0Um93SGVpZ2h0KGopO1xyXG5cdFx0XHQvL1JlbmRlciBsZWZ0IGNlbGxzXHJcblx0XHRcdGxlZnRSdW5uZXIgPSAwO1xyXG5cdFx0XHRmb3IgKGxldCBpPTA7IGk8bGVmdEZyZWV6ZTsgaSsrKSB7XHJcblx0XHRcdFx0dGhpcy5fcmVuZGVyQ2VsbChqLCBpLCB0aGlzLl9sZWZ0SW5uZXIsIGxlZnRSdW5uZXIsIHRvcFJ1bm5lciwgY29sV2lkdGhbaV0sIHJvd0hlaWdodCk7XHJcblx0XHRcdFx0bGVmdFJ1bm5lciArPSBjb2xXaWR0aFtpXTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvL1JlbmRlciBjZW50ZXIgY2VsbHNcclxuXHRcdFx0bGVmdFJ1bm5lciA9IDA7XHJcblx0XHRcdGZvciAobGV0IGk9bGVmdEZyZWV6ZTsgaTxjb2x1bW5Db3VudDsgaSsrKSB7XHJcblx0XHRcdFx0dGhpcy5fcmVuZGVyQ2VsbChqLCBpLCB0aGlzLl9jZW50ZXJJbm5lciwgbGVmdFJ1bm5lciwgdG9wUnVubmVyLCBjb2xXaWR0aFtpXSwgcm93SGVpZ2h0KTtcclxuXHRcdFx0XHRsZWZ0UnVubmVyICs9IGNvbFdpZHRoW2ldO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRvcFJ1bm5lciArPSByb3dIZWlnaHQ7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly9SZW5kZXIgYm90dG9tIHJvd3NcclxuXHRcdHRvcFJ1bm5lciA9IDA7XHJcblx0XHRmb3IgKGxldCBqPShyb3dDb3VudC1ib3R0b21GcmVlemUpOyBqPHJvd0NvdW50OyBqKyspIHtcclxuXHRcdFx0bGV0IHJvd0hlaWdodCA9IHRoaXMuX21vZGVsLmdldFJvd0hlaWdodChqKTtcclxuXHRcdFx0Ly9SZW5kZXIgbGVmdCBjZWxsc1xyXG5cdFx0XHRsZWZ0UnVubmVyID0gMDtcclxuXHRcdFx0Zm9yIChsZXQgaT0wOyBpPGxlZnRGcmVlemU7IGkrKykge1xyXG5cdFx0XHRcdHRoaXMuX3JlbmRlckNlbGwoaiwgaSwgdGhpcy5fYm90dG9tTGVmdElubmVyLCBsZWZ0UnVubmVyLCB0b3BSdW5uZXIsIGNvbFdpZHRoW2ldLCByb3dIZWlnaHQpO1xyXG5cdFx0XHRcdGxlZnRSdW5uZXIgKz0gY29sV2lkdGhbaV07XHJcblx0XHRcdH1cclxuXHRcdFx0Ly9SZW5kZXIgY2VudGVyIGNlbGxzXHJcblx0XHRcdGxlZnRSdW5uZXIgPSAwO1xyXG5cdFx0XHRmb3IgKGxldCBpPWxlZnRGcmVlemU7IGk8Y29sdW1uQ291bnQ7IGkrKykge1xyXG5cdFx0XHRcdHRoaXMuX3JlbmRlckNlbGwoaiwgaSwgdGhpcy5fYm90dG9tSW5uZXIsIGxlZnRSdW5uZXIsIHRvcFJ1bm5lciwgY29sV2lkdGhbaV0sIHJvd0hlaWdodCk7XHJcblx0XHRcdFx0bGVmdFJ1bm5lciArPSBjb2xXaWR0aFtpXTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0b3BSdW5uZXIgKz0gcm93SGVpZ2h0O1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0X3JlbmRlckNlbGwgKHJvd0luZGV4LCBjb2xJbmRleCwgcGFuZSwgeCwgeSwgd2lkdGgsIGhlaWdodCkge1xyXG5cdFx0bGV0IGRhdGEgPSB0aGlzLl9kYXRhLmdldERhdGFBdChyb3dJbmRleCwgY29sSW5kZXgpO1xyXG5cclxuXHRcdC8vRGF0YSBjYWIgYmUgdHJhbnNmb3JtZWQgYmVmb3JlIHJlbmRlcmluZyB1c2luZyBkYXRhQmVmb3JlUmVuZGVyIGV4dGVuc2lvblxyXG5cdFx0bGV0IGFyZyA9IHtkYXRhOiBkYXRhfTtcclxuXHRcdHRoaXMuX2V4dGVuc2lvbnMuZXhlY3V0ZUV4dGVuc2lvbignZGF0YUJlZm9yZVJlbmRlcicsIGFyZyk7XHJcblx0XHRkYXRhID0gYXJnLmRhdGE7XHJcblxyXG5cdFx0bGV0IGNlbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHRcdGxldCBjZWxsQ2xhc3NlcyA9IHRoaXMuX21vZGVsLmdldENlbGxDbGFzc2VzKHJvd0luZGV4LCBjb2xJbmRleCk7XHJcblx0XHRjZWxsLmNsYXNzTmFtZSA9ICdwZ3JpZC1jZWxsICcgKyBjZWxsQ2xhc3Nlcy5qb2luKCcgJyk7XHJcblx0XHRjZWxsLnN0eWxlLmxlZnQgPSB4ICsgJ3B4JztcclxuXHRcdGNlbGwuc3R5bGUudG9wID0geSArICdweCc7XHJcblx0XHRjZWxsLnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xyXG5cdFx0Y2VsbC5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xyXG5cdFx0Y2VsbC5kYXRhc2V0LnJvd0luZGV4ID0gcm93SW5kZXg7XHJcblx0XHRjZWxsLmRhdGFzZXQuY29sSW5kZXggPSBjb2xJbmRleDtcclxuXHJcblx0XHRsZXQgY2VsbENvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHRcdGNlbGxDb250ZW50LmNsYXNzTmFtZSA9ICdwZ3JpZC1jZWxsLWNvbnRlbnQnO1xyXG5cdFx0aWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRjZWxsQ29udGVudC5pbm5lckhUTUwgPSBkYXRhO1xyXG5cdFx0fVxyXG5cdFx0Y2VsbC5hcHBlbmRDaGlsZChjZWxsQ29udGVudCk7XHJcblx0XHRwYW5lLmFwcGVuZENoaWxkKGNlbGwpO1xyXG5cclxuXHRcdGxldCBldmVudEFyZyA9IHtcclxuXHRcdFx0Y2VsbDogY2VsbCxcclxuXHRcdFx0cm93SW5kZXg6IHJvd0luZGV4LFxyXG5cdFx0XHRjb2xJbmRleDogY29sSW5kZXgsXHJcblx0XHRcdGRhdGE6IGRhdGFcclxuXHRcdH07XHJcblxyXG5cdFx0dGhpcy5fZXh0ZW5zaW9ucy5leGVjdXRlRXh0ZW5zaW9uKCdjZWxsQWZ0ZXJSZW5kZXInLCBldmVudEFyZyk7XHJcblx0XHR0aGlzLl9leHRlbnNpb25zLmV4ZWN1dGVFeHRlbnNpb24oJ2NlbGxBZnRlclVwZGF0ZScsIGV2ZW50QXJnKTtcclxuXHJcblx0XHRldmVudEFyZyA9IG51bGw7XHJcblx0fVxyXG5cclxuXHRfbWVhc3VyZVNjcm9sbGJhcldpZHRoICgpIHtcclxuXHRcdHZhciBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuXHRcdGlubmVyLnN0eWxlLndpZHRoID0gJzEwMCUnO1xyXG5cdFx0aW5uZXIuc3R5bGUuaGVpZ2h0ID0gJzIwMHB4JztcclxuXHRcdHZhciBvdXRtb3N0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0XHRvdXRtb3N0LmNsYXNzTmFtZSA9ICdwZ3JpZCc7XHJcblx0XHR2YXIgb3V0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHRcdG91dGVyLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcclxuXHRcdG91dGVyLnN0eWxlLnRvcCA9ICcwcHgnO1xyXG5cdFx0b3V0ZXIuc3R5bGUubGVmdCA9ICcwcHgnO1xyXG5cdFx0b3V0ZXIuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xyXG5cdFx0b3V0ZXIuc3R5bGUud2lkdGggPSAnMjAwcHgnO1xyXG5cdFx0b3V0ZXIuc3R5bGUuaGVpZ2h0ID0gJzE1MHB4JztcclxuXHRcdG91dGVyLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XHJcblx0XHRvdXRlci5hcHBlbmRDaGlsZChpbm5lcik7XHJcblx0XHRvdXRtb3N0LmFwcGVuZENoaWxkKG91dGVyKTtcclxuXHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQob3V0bW9zdCk7XHJcblx0XHR2YXIgdzEgPSBpbm5lci5vZmZzZXRXaWR0aDtcclxuXHRcdG91dGVyLnN0eWxlLm92ZXJmbG93ID0gJ3Njcm9sbCc7XHJcblx0XHR2YXIgdzIgPSBpbm5lci5vZmZzZXRXaWR0aDtcclxuXHRcdGlmICh3MSA9PSB3MikgdzIgPSBvdXRlci5jbGllbnRXaWR0aDtcclxuXHRcdGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQgKG91dG1vc3QpO1xyXG5cdFx0cmV0dXJuICh3MSAtIHcyKSArICh0aGlzLl9kZXRlY3RJRSgpPzE6MCk7XHJcblx0fVxyXG5cclxuXHJcblx0X2RldGVjdElFICgpIHtcclxuXHQgIHZhciB1YSA9IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50O1xyXG5cdCAgdmFyIG1zaWUgPSB1YS5pbmRleE9mKCdNU0lFICcpO1xyXG5cdCAgaWYgKG1zaWUgPiAwKSB7XHJcblx0ICAgIC8vIElFIDEwIG9yIG9sZGVyID0+IHJldHVybiB2ZXJzaW9uIG51bWJlclxyXG5cdCAgICByZXR1cm4gcGFyc2VJbnQodWEuc3Vic3RyaW5nKG1zaWUgKyA1LCB1YS5pbmRleE9mKCcuJywgbXNpZSkpLCAxMCk7XHJcblx0ICB9XHJcblxyXG5cdCAgdmFyIHRyaWRlbnQgPSB1YS5pbmRleE9mKCdUcmlkZW50LycpO1xyXG5cdCAgaWYgKHRyaWRlbnQgPiAwKSB7XHJcblx0ICAgIC8vIElFIDExID0+IHJldHVybiB2ZXJzaW9uIG51bWJlclxyXG5cdCAgICB2YXIgcnYgPSB1YS5pbmRleE9mKCdydjonKTtcclxuXHQgICAgcmV0dXJuIHBhcnNlSW50KHVhLnN1YnN0cmluZyhydiArIDMsIHVhLmluZGV4T2YoJy4nLCBydikpLCAxMCk7XHJcblx0ICB9XHJcblxyXG5cdCAgdmFyIGVkZ2UgPSB1YS5pbmRleE9mKCdFZGdlLycpO1xyXG5cdCAgaWYgKGVkZ2UgPiAwKSB7XHJcblx0ICAgIC8vIEVkZ2UgKElFIDEyKykgPT4gcmV0dXJuIHZlcnNpb24gbnVtYmVyXHJcblx0ICAgIHJldHVybiBwYXJzZUludCh1YS5zdWJzdHJpbmcoZWRnZSArIDUsIHVhLmluZGV4T2YoJy4nLCBlZGdlKSksIDEwKTtcclxuXHQgIH1cclxuXHQgIC8vIG90aGVyIGJyb3dzZXJcclxuXHQgIHJldHVybiBmYWxzZTtcclxuXHR9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFZpZXc7IiwiaW1wb3J0IHsgUEdyaWQgfSBmcm9tICcuL2dyaWQvZ3JpZCc7XHJcblxyXG53aW5kb3cuUEdyaWQgPSBQR3JpZDtcclxuXHJcbi8vIFBvbHlmaWxsIC0gRWxlbWVudC5zY3JvbGxJbnRvVmlld0lmTmVlZGVkXHJcblxyXG5pZiAoIUVsZW1lbnQucHJvdG90eXBlLnNjcm9sbEludG9WaWV3SWZOZWVkZWQpIHtcclxuICAgIEVsZW1lbnQucHJvdG90eXBlLnNjcm9sbEludG9WaWV3SWZOZWVkZWQgPSBmdW5jdGlvbiAoY2VudGVySWZOZWVkZWQpIHtcclxuICAgICAgICBjZW50ZXJJZk5lZWRlZCA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDAgPyB0cnVlIDogISFjZW50ZXJJZk5lZWRlZDtcclxuXHJcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50Tm9kZSxcclxuICAgICAgICAgICAgcGFyZW50Q29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHBhcmVudCwgbnVsbCksXHJcbiAgICAgICAgICAgIHBhcmVudEJvcmRlclRvcFdpZHRoID0gcGFyc2VJbnQocGFyZW50Q29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdib3JkZXItdG9wLXdpZHRoJykpLFxyXG4gICAgICAgICAgICBwYXJlbnRCb3JkZXJMZWZ0V2lkdGggPSBwYXJzZUludChwYXJlbnRDb21wdXRlZFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2JvcmRlci1sZWZ0LXdpZHRoJykpLFxyXG4gICAgICAgICAgICBvdmVyVG9wID0gdGhpcy5vZmZzZXRUb3AgLSBwYXJlbnQub2Zmc2V0VG9wIDwgcGFyZW50LnNjcm9sbFRvcCxcclxuICAgICAgICAgICAgb3ZlckJvdHRvbSA9ICh0aGlzLm9mZnNldFRvcCAtIHBhcmVudC5vZmZzZXRUb3AgKyB0aGlzLmNsaWVudEhlaWdodCAtIHBhcmVudEJvcmRlclRvcFdpZHRoKSA+IChwYXJlbnQuc2Nyb2xsVG9wICsgcGFyZW50LmNsaWVudEhlaWdodCksXHJcbiAgICAgICAgICAgIG92ZXJMZWZ0ID0gdGhpcy5vZmZzZXRMZWZ0IC0gcGFyZW50Lm9mZnNldExlZnQgPCBwYXJlbnQuc2Nyb2xsTGVmdCxcclxuICAgICAgICAgICAgb3ZlclJpZ2h0ID0gKHRoaXMub2Zmc2V0TGVmdCAtIHBhcmVudC5vZmZzZXRMZWZ0ICsgdGhpcy5jbGllbnRXaWR0aCAtIHBhcmVudEJvcmRlckxlZnRXaWR0aCkgPiAocGFyZW50LnNjcm9sbExlZnQgKyBwYXJlbnQuY2xpZW50V2lkdGgpLFxyXG4gICAgICAgICAgICBhbGlnbldpdGhUb3AgPSBvdmVyVG9wICYmICFvdmVyQm90dG9tO1xyXG5cclxuICAgICAgICBpZiAoKG92ZXJUb3AgfHwgb3ZlckJvdHRvbSkgJiYgY2VudGVySWZOZWVkZWQpIHtcclxuICAgICAgICAgICAgcGFyZW50LnNjcm9sbFRvcCA9IHRoaXMub2Zmc2V0VG9wIC0gcGFyZW50Lm9mZnNldFRvcCAtIHBhcmVudC5jbGllbnRIZWlnaHQgLyAyIC0gcGFyZW50Qm9yZGVyVG9wV2lkdGggKyB0aGlzLmNsaWVudEhlaWdodCAvIDI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoKG92ZXJMZWZ0IHx8IG92ZXJSaWdodCkgJiYgY2VudGVySWZOZWVkZWQpIHtcclxuICAgICAgICAgICAgcGFyZW50LnNjcm9sbExlZnQgPSB0aGlzLm9mZnNldExlZnQgLSBwYXJlbnQub2Zmc2V0TGVmdCAtIHBhcmVudC5jbGllbnRXaWR0aCAvIDIgLSBwYXJlbnRCb3JkZXJMZWZ0V2lkdGggKyB0aGlzLmNsaWVudFdpZHRoIC8gMjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICgob3ZlclRvcCB8fCBvdmVyQm90dG9tIHx8IG92ZXJMZWZ0IHx8IG92ZXJSaWdodCkgJiYgIWNlbnRlcklmTmVlZGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsSW50b1ZpZXcoYWxpZ25XaXRoVG9wKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59Il19

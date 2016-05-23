(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.OnScreen = factory());
}(this, function () { 'use strict';

  /**
   * Attaches the scroll event handler
   *
   * @return {void}
   */
  function attach() {
      var container = this.options.container;

      if (container instanceof HTMLElement) {
          var style = window.getComputedStyle(container);

          if (style.position === 'static') {
              container.style.position = 'relative';
          }
      }

      container.addEventListener('scroll', this._scroll);
      window.addEventListener('resize', this._scroll);
      this._scroll();
      this.attached = true;
  }

  /**
   * Checks an element's position in respect to the viewport
   * and determines wether it's inside the viewport.
   *
   * @param {node} element The DOM node you want to check
   * @return {boolean} A boolean value that indicates wether is on or off the viewport.
   */
  function insideViewport(el) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? { tolerance: 0, container: window } : arguments[1];

      if (!el) return false;

      if (typeof el === 'string') {
          el = document.querySelector(el);
      }
      if (typeof options === 'string') {
          options = { container: document.querySelector(options) };
      }

      var visible = void 0;
      var elRect = el.getBoundingClientRect();

      if (options.container === window) {
          visible =
          // Check bottom boundary
          elRect.bottom - options.tolerance > 0 &&

          // Check right boundary
          elRect.right - options.tolerance > 0 &&

          // Check left boundary
          elRect.left + options.tolerance < (window.innerWidth || document.documentElement.clientWidth) &&

          // Check top boundary
          elRect.top + options.tolerance < (window.innerHeight || document.documentElement.clientHeight);
      } else {
          var containerRect = options.container.getBoundingClientRect();

          visible =
          // // Check bottom boundary
          el.offsetTop + el.clientHeight - options.tolerance > options.container.scrollTop &&

          // Check right boundary
          el.offsetLeft + el.clientWidth - options.tolerance > options.container.scrollLeft &&

          // Check left boundary
          el.offsetLeft + options.tolerance < containerRect.width + options.container.scrollLeft &&

          // // Check top boundary
          el.offsetTop + options.tolerance < containerRect.height + options.container.scrollTop;
      }

      return visible;
  }

  function eventHandler() {
      var trackedElements = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
      var options = arguments.length <= 1 || arguments[1] === undefined ? { tolerance: 0 } : arguments[1];

      var selectors = Object.keys(trackedElements);

      if (!selectors.length) return;

      selectors.forEach(function (selector) {
          trackedElements[selector].nodes.forEach(function (item) {
              if (insideViewport(item.node, options)) {
                  item.wasVisible = item.isVisible;
                  item.isVisible = true;
              } else {
                  item.wasVisible = item.isVisible;
                  item.isVisible = false;
              }
              if (item.isVisible === true && item.wasVisible === false) {
                  if (typeof trackedElements[selector].enter === 'function') {
                      trackedElements[selector].enter(item.node);
                  }
              }
              if (item.isVisible === false && item.wasVisible === true) {
                  if (typeof trackedElements[selector].leave === 'function') {
                      trackedElements[selector].leave(item.node);
                  }
              }
          });
      });
  }

  /**
   * Debounces the scroll event to avoid performance issues
   *
   * @return {void}
   */
  function debouncedScroll() {
      var _this = this;

      var timeout = void 0;

      return function () {
          clearTimeout(timeout);

          timeout = setTimeout(function () {
              eventHandler(_this.trackedElements, _this.options);
          }, _this.options.throttle);
      };
  }

  /**
   * Removes the scroll event handler
   *
   * @return {void}
   */
  function destroy() {
    this.options.container.removeEventListener('scroll', this._scroll);
    window.removeEventListener('resize', this._scroll);
    this.attached = false;
  }

  /**
   * Stops tracking elements matching a CSS selector. If a selector has no
   * callbacks it gets removed.
   *
   * @param {string} event The event you want to stop tracking (enter or leave)
   * @param {string} selector The CSS selector you want to stop tracking
   * @return {void}
   */
  function off(event, selector) {
      if (this.trackedElements.hasOwnProperty(selector)) {
          if (this.trackedElements[selector][event]) {
              delete this.trackedElements[selector][event];
          }
      }
      if (!this.trackedElements[selector].enter && !this.trackedElements[selector].leave) {
          delete this.trackedElements[selector];
      }
  }

  /**
   * Starts tracking elements matching a CSS selector
   *
   * @param {string} event The event you want to track (enter or leave)
   * @param {string} selector The element you want to track
   * @param {function} callback The callback function to handle the event
   * @return {void}
   */
  function on(event, selector, callback) {
      var allowed = ['enter', 'leave'];

      if (!event) throw new Error('No event given. Choose either enter or leave');
      if (!selector) throw new Error('No selector to track');
      if (allowed.indexOf(event) < 0) throw new Error(event + ' event is not supported');

      if (!this.trackedElements.hasOwnProperty(selector)) {
          this.trackedElements[selector] = {};
      }

      this.trackedElements[selector].nodes = [];

      for (var i = 0; i < document.querySelectorAll(selector).length; i++) {
          var item = {
              isVisible: false,
              wasVisible: false,
              node: document.querySelectorAll(selector)[i]
          };

          this.trackedElements[selector].nodes.push(item);
      }

      if (typeof callback === 'function') {
          this.trackedElements[selector][event] = callback;
      }
  }

  /**
   * Observes DOM mutations and runs a callback function when
   * detecting one.
   *
   * @param {node} obj The DOM node you want to observe
   * @param {function} callback The callback function you want to call
   * @return {void}
   */
  function observeDOM(obj, callback) {
      var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
      var eventListenerSupported = window.addEventListener;

      if (MutationObserver) {
          var obs = new MutationObserver(function (mutations) {
              if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) callback();
          });

          obs.observe(obj, {
              childList: true,
              subtree: true
          });
      } else if (eventListenerSupported) {
          obj.addEventListener('DOMNodeInserted', callback, false);
          obj.addEventListener('DOMNodeRemoved', callback, false);
      }
  }

  /**
   * Detects wether DOM nodes enter or leave the viewport
   *
   * @constructor
   * @param {object} options The configuration object
   */
  function OnScreen() {
      var _this = this;

      var options = arguments.length <= 0 || arguments[0] === undefined ? { tolerance: 0, debounce: 100, container: window } : arguments[0];

      this.options = {};
      this.trackedElements = {};

      Object.defineProperties(this.options, {
          container: {
              configurable: false,
              enumerable: false,
              get: function get() {
                  var container = void 0;

                  if (typeof options.container === 'string') {
                      container = document.querySelector(options.container);
                  } else if (options.container instanceof HTMLElement) {
                      container = options.container;
                  }

                  return container || window;
              },
              set: function set(value) {
                  options.container = value;
              }
          },
          debounce: {
              get: function get() {
                  return parseInt(options.debounce, 10) || 100;
              },
              set: function set(value) {
                  options.debounce = value;
              }
          },
          tolerance: {
              get: function get() {
                  return parseInt(options.tolerance, 10) || 0;
              },
              set: function set(value) {
                  options.tolerance = value;
              }
          }
      });

      Object.defineProperty(this, '_scroll', {
          enumerable: false,
          configurable: false,
          writable: false,
          value: this._debouncedScroll.call(this)
      });

      observeDOM(document.querySelector('body'), function () {
          Object.keys(_this.trackedElements).forEach(function (element) {
              _this.on('enter', element);
              _this.on('leave', element);
          });
      });

      this.attach();
  }

  Object.defineProperties(OnScreen.prototype, {
      _debouncedScroll: {
          configurable: false,
          writable: false,
          enumerable: false,
          value: debouncedScroll
      },
      attach: {
          configurable: false,
          writable: false,
          enumerable: false,
          value: attach
      },
      destroy: {
          configurable: false,
          writable: false,
          enumerable: false,
          value: destroy
      },
      off: {
          configurable: false,
          writable: false,
          enumerable: false,
          value: off
      },
      on: {
          configurable: false,
          writable: false,
          enumerable: false,
          value: on
      }
  });

  OnScreen.check = insideViewport;

  return OnScreen;

}));

},{}],2:[function(require,module,exports){
'use strict';

var _onscreen = require('onscreen');

var _onscreen2 = _interopRequireDefault(_onscreen);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function destroy() {
    os.destroy();
    osVertical.destroy();
    osHorizontal.destroy();
}

function attach() {
    os.attach();
    osVertical.attach();
    osHorizontal.attach();
}

// Document ready
document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('.js-destroy').addEventListener('click', destroy);
    document.querySelector('.js-attach').addEventListener('click', attach);
}, false);

// Container is window
var os = new _onscreen2.default({
    tolerance: 50
});

os.on('enter', '.target', function (element) {
    // Using jQuery: $(element).addClass('onScreen');
    element.classList.add('onScreen');
});

os.on('leave', '.target', function (element) {
    // Using jQuery: $(element).removeClass('onScreen');
    element.classList.remove('onScreen');
});

// Container is element (vertical orientation)
var osVertical = new _onscreen2.default({
    container: '.container .vertical',
    tolerance: 20
});

osVertical.on('enter', '.vertical .contained', function (element) {
    // You can use jQuery with $(element)
    element.classList.add('onScreen');
});

osVertical.on('leave', '.vertical .contained', function (element) {
    // You can use jQuery with $(element)
    element.classList.remove('onScreen');
});

// Container is element (horizontal orientation)
var osHorizontal = new _onscreen2.default({
    container: '.container .horizontal',
    tolerance: 20
});

osHorizontal.on('enter', '.horizontal .contained', function (element) {
    // You can use jQuery with $(element)
    element.classList.add('onScreen');
});

osHorizontal.on('leave', '.horizontal .contained', function (element) {
    // You can use jQuery with $(element)
    element.classList.remove('onScreen');
});

},{"onscreen":1}]},{},[2])


//# sourceMappingURL=build.js.map

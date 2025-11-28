// Browser-compatible prelude for yaml-reference-parser
// This replaces the Node.js ingy-prelude module with browser equivalents

(function() {
  // Lodash-like utilities (only the functions used by the parser)
  var _ = {
    last: function(arr) { return arr[arr.length - 1]; },
    keys: Object.keys,
    map: function(arr, fn) { return arr.map(fn); },
    join: function(arr, sep) { return arr.join(sep); },
    repeat: function(str, n) { return str.repeat(n); },
    isNull: function(v) { return v === null; },
    isBoolean: function(v) { return typeof v === 'boolean'; },
    isNumber: function(v) { return typeof v === 'number'; },
    isString: function(v) { return typeof v === 'string'; },
    isFunction: function(v) { return typeof v === 'function'; },
    isArray: Array.isArray,
    isPlainObject: function(v) { return typeof v === 'object' && v !== null && !Array.isArray(v); },
  };

  // Set up globals
  window._ = _;
  window.ENV = {};

  window.name_ = function(name, func, trace) {
    func.trace = trace || name;
    return func;
  };

  window.isNull = _.isNull;
  window.isBoolean = _.isBoolean;
  window.isNumber = _.isNumber;
  window.isString = _.isString;
  window.isFunction = _.isFunction;
  window.isArray = _.isArray;
  window.isObject = _.isPlainObject;

  window.typeof_ = function(value) {
    if (_.isNull(value)) return 'null';
    if (_.isBoolean(value)) return 'boolean';
    if (_.isNumber(value)) return 'number';
    if (_.isString(value)) return 'string';
    if (_.isFunction(value)) return 'function';
    if (_.isArray(value)) return 'array';
    if (_.isPlainObject(value)) return 'object';
    return typeof value;
  };

  window.stringify = function(o) {
    if (o === "\ufeff") return "\\uFEFF";
    if (isFunction(o)) return "@" + (o.trace || o.name);
    if (isObject(o)) return JSON.stringify(_.keys(o));
    if (isArray(o)) return "[" + _.map(o, function(e) { return stringify(e); }).join(",") + "]";
    return JSON.stringify(o).replace(/^"(.*)"$/, '$1');
  };

  window.hex_char = function(chr) {
    return chr.charCodeAt(0).toString(16);
  };

  window.die = function(msg) {
    throw new Error("Died: " + msg);
  };

  window.warn = function() {
    console.warn.apply(console, arguments);
  };

  window.debug = function(msg) {
    console.log(">>> " + msg);
  };

  window.debug_rule = function() {};  // No-op in browser

  window.FAIL = function() {
    var args = Array.prototype.slice.call(arguments);
    console.error('FAIL:', args);
    throw new Error("FAIL: " + (args[0] || '???'));
  };

  window.XXX = function() {
    var args = Array.prototype.slice.call(arguments);
    console.error('XXX:', args);
    throw new Error('XXX');
  };

  window.WWW = function() {
    var args = Array.prototype.slice.call(arguments);
    console.warn('WWW:', args);
    return args[0];
  };

})();

/*!
 * xsloader.js v1.1.0
 * home:https://github.com/gzxishan/xsloader#readme
 * (c) 2018-2019 gzxishan
 * Released under the Apache-2.0 License.
 * build time:Sun, 08 Sep 2019 15:36:29 GMT
 */
(function () {
  'use strict';

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
      keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};

      if (i % 2) {
        ownKeys(source, true).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys(source).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }

    return target;
  }

  var JSON = {};
  var rx_one = /^[\],:{}\s]*$/;
  var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
  var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
  var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
  var rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
  var rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

  function f(n) {
    return n < 10 ? "0" + n : n;
  }

  function this_value() {
    return this.valueOf();
  }

  if (typeof Date.prototype.toJSON !== "function") {
    Date.prototype.toJSON = function () {
      return isFinite(this.valueOf()) ? this.getUTCFullYear() + "-" + f(this.getUTCMonth() + 1) + "-" + f(this.getUTCDate()) + "T" + f(this.getUTCHours()) + ":" + f(this.getUTCMinutes()) + ":" + f(this.getUTCSeconds()) + "Z" : null;
    };

    Boolean.prototype.toJSON = this_value;
    Number.prototype.toJSON = this_value;
    String.prototype.toJSON = this_value;
  }

  var gap;
  var indent;
  var meta;
  var rep;

  function quote(string) {
    rx_escapable.lastIndex = 0;
    return rx_escapable.test(string) ? "\"" + string.replace(rx_escapable, function (a) {
      var c = meta[a];
      return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
    }) + "\"" : "\"" + string + "\"";
  }

  function str(key, holder) {
    var i;
    var k;
    var v;
    var length;
    var mind = gap;
    var partial;
    var value = holder[key];

    if (value && _typeof(value) === "object" && typeof value.toJSON === "function") {
      value = value.toJSON(key);
    }

    if (typeof rep === "function") {
      value = rep.call(holder, key, value);
    }

    switch (_typeof(value)) {
      case "string":
        return quote(value);

      case "number":
        return isFinite(value) ? String(value) : "null";

      case "boolean":
      case "null":
        return String(value);

      case "object":
        if (!value) {
          return "null";
        }

        gap += indent;
        partial = [];

        if (Object.prototype.toString.apply(value) === "[object Array]") {
          length = value.length;

          for (i = 0; i < length; i += 1) {
            partial[i] = str(i, value) || "null";
          }

          v = partial.length === 0 ? "[]" : gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : "[" + partial.join(",") + "]";
          gap = mind;
          return v;
        }

        if (rep && _typeof(rep) === "object") {
          length = rep.length;

          for (i = 0; i < length; i += 1) {
            if (typeof rep[i] === "string") {
              k = rep[i];
              v = str(k, value);

              if (v) {
                partial.push(quote(k) + (gap ? ": " : ":") + v);
              }
            }
          }
        } else {
          for (k in value) {
            if (Object.prototype.hasOwnProperty.call(value, k)) {
              v = str(k, value);

              if (v) {
                partial.push(quote(k) + (gap ? ": " : ":") + v);
              }
            }
          }
        }

        v = partial.length === 0 ? "{}" : gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : "{" + partial.join(",") + "}";
        gap = mind;
        return v;
    }
  }

  if (typeof JSON.stringify !== "function") {
    meta = {
      "\b": "\\b",
      "\t": "\\t",
      "\n": "\\n",
      "\f": "\\f",
      "\r": "\\r",
      "\"": "\\\"",
      "\\": "\\\\"
    };

    JSON.stringify = function (value, replacer, space) {
      var i;
      gap = "";
      indent = "";

      if (typeof space === "number") {
        for (i = 0; i < space; i += 1) {
          indent += " ";
        }
      } else if (typeof space === "string") {
        indent = space;
      }

      rep = replacer;

      if (replacer && typeof replacer !== "function" && (_typeof(replacer) !== "object" || typeof replacer.length !== "number")) {
        throw new Error("JSON.stringify");
      }

      return str("", {
        "": value
      });
    };
  }

  if (typeof JSON.parse !== "function") {
    JSON.parse = function (text, reviver) {
      var j;

      function walk(holder, key) {
        var k;
        var v;
        var value = holder[key];

        if (value && _typeof(value) === "object") {
          for (k in value) {
            if (Object.prototype.hasOwnProperty.call(value, k)) {
              v = walk(value, k);

              if (v !== undefined) {
                value[k] = v;
              } else {
                delete value[k];
              }
            }
          }
        }

        return reviver.call(holder, key, value);
      }

      text = String(text);
      rx_dangerous.lastIndex = 0;

      if (rx_dangerous.test(text)) {
        text = text.replace(rx_dangerous, function (a) {
          return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
        });
      }

      if (rx_one.test(text.replace(rx_two, "@").replace(rx_three, "]").replace(rx_four, ""))) {
        j = eval("(" + text + ")");
        return typeof reviver === "function" ? walk({
          "": j
        }, "") : j;
      }

      throw new SyntaxError("JSON.parse");
    };
  }

  var g;

  if ((typeof window === "undefined" ? "undefined" : _typeof(window)) !== undefined) {
    g = window;
  } else if ((typeof self === "undefined" ? "undefined" : _typeof(self)) !== undefined) {
    g = self;
  } else if ((typeof global === "undefined" ? "undefined" : _typeof(global)) !== undefined) {
    g = global;
  } else {
    throw new Error("not found global var!");
  }

  function InVar$1(val) {
    this.get = function () {
      return val;
    };

    this.set = function (newVal) {
      var old = val;
      val = newVal;
      return old;
    };
  }

  g.InVar = InVar$1;
  var global$1 = g;

  var _loaderFun;

  var xsloader = global$1.xsloader = function () {
    return _loaderFun.apply(this, arguments);
  };

  var loader = {
    loaderFun: function loaderFun(fun) {
      _loaderFun = fun;
    }
  };

  var ABSOLUTE_PROTOCOL_REG = /^(([a-zA-Z0-9_]*:\/\/)|(\/)|(\/\/))/;
  var ABSOLUTE_PROTOCOL_REG2 = /^([a-zA-Z0-9_]+:)\/\/([^/\s]+)/;
  var defaultJsExts = [".js", ".js+", ".js++", ".es", "es6", ".jsx", ".vue"];
  var xsloader$1 = global$1.xsloader;

  function isJsFile(path) {
    if (!xsloader$1.isString(path) || path.indexOf(".") == -1) {
      return false;
    }

    var pluginIndex = path.indexOf("!");

    if (pluginIndex > 0) {
      path = path.substring(0, pluginIndex);
    }

    var index = path.indexOf("?");

    if (index > 0) {
      path = path.substring(0, index);
    }

    index = path.indexOf("#");

    if (index > 0) {
      path = path.substring(0, index);
    }

    var theConfig = xsloader$1.config();
    var jsExts = theConfig && theConfig.jsExts || defaultJsExts;

    for (var i = 0; i < jsExts.length; i++) {
      if (xsloader$1.endsWith(path, jsExts[i])) {
        return {
          ext: jsExts[i],
          path: path
        };
      }
    }

    return false;
  }

  function dealPathMayAbsolute(path, currentUrl) {
    currentUrl = currentUrl || location.href;
    var rs = ABSOLUTE_PROTOCOL_REG.exec(path);
    var finalPath;
    var absolute;

    if (rs) {
      var protocol = rs[1];
      absolute = true;
      rs = ABSOLUTE_PROTOCOL_REG2.exec(currentUrl);

      var _protocol = rs && rs[1] || location.protocol;

      var _host = rs && rs[2] || location.host;

      if (protocol == "//") {
        finalPath = _protocol + "//" + path;
      } else if (protocol == "/") {
        finalPath = _protocol + "//" + _host + path;
      } else {
        finalPath = path;
      }
    } else {
      absolute = false;
      finalPath = path;
    }

    return {
      absolute: absolute,
      path: finalPath
    };
  }

  function getPathWithRelative(path, relative, isPathDir) {
    var relativeQuery = "";
    var qIndex = path.lastIndexOf("?");

    if (qIndex >= 0) {
      path = path.substring(0, qIndex);
    } else {
      qIndex = path.lastIndexOf("#");

      if (qIndex >= 0) {
        path = path.substring(0, qIndex);
      }
    }

    qIndex = relative.lastIndexOf("?");

    if (qIndex >= 0) {
      relativeQuery = relative.substring(qIndex);
      relative = relative.substring(0, qIndex);
    } else {
      qIndex = relative.lastIndexOf("#");

      if (qIndex >= 0) {
        relativeQuery = relative.substring(qIndex);
        relative = relative.substring(0, qIndex);
      }
    }

    var absolute = dealPathMayAbsolute(relative);

    if (absolute.absolute) {
      return absolute.path + relativeQuery;
    }

    if (isPathDir === undefined) {
      var _index = path.lastIndexOf("/");

      if (_index == path.length - 1) {
        isPathDir = true;
      } else {
        if (_index == -1) {
          _index = 0;
        } else {
          _index++;
        }

        isPathDir = path.indexOf(".", _index) == -1;
      }
    }

    if (xsloader$1.endsWith(path, "/")) {
      path = path.substring(0, path.length - 1);
    }

    var isRelativeDir = false;

    if (relative == "." || xsloader$1.endsWith(relative, "/")) {
      relative = relative.substring(0, relative.length - 1);
      isRelativeDir = true;
    } else if (relative == "." || relative == ".." || xsloader$1.endsWith("/.") || xsloader$1.endsWith("/..")) {
      isRelativeDir = true;
    }

    var prefix = "";
    var index = -1;
    var absolute2 = dealPathMayAbsolute(path);

    if (absolute2.absolute) {
      path = absolute2.path;
      var index2 = path.indexOf("//");
      index = path.indexOf("/", index2 + 2);

      if (index == -1) {
        index = path.length;
      }
    }

    prefix = path.substring(0, index + 1);
    path = path.substring(index + 1);
    var stack = path.split("/");

    if (!isPathDir && stack.length > 0) {
      stack.pop();
    }

    var relatives = relative.split("/");

    for (var i = 0; i < relatives.length; i++) {
      var str = relatives[i];

      if (".." == str) {
        if (stack.length == 0) {
          throw new Error("no more upper path!");
        }

        stack.pop();
      } else if ("." != str) {
        stack.push(str);
      }
    }

    if (stack.length == 0) {
      return "";
    }

    var result = prefix + stack.join("/");

    if (isRelativeDir && !xsloader$1.endsWith(result, "/")) {
      result += "/";
    }

    result = xsloader$1.appendArgs2Url(result, relativeQuery);
    return result;
  }

  function getNodeAbsolutePath(node) {
    var src = node.src || node.getAttribute("src");
    return getPathWithRelative(location.href, src);
  }

  function removeQueryHash(url) {
    if (url) {
      var index = url.indexOf("?");

      if (index >= 0) {
        url = url.substring(0, index);
      }

      index = url.indexOf("#");

      if (index >= 0) {
        url = url.substring(0, index);
      }
    }

    return url;
  }

  var REPLACE_STRING_PROPERTIES_EXP = new RegExp("\\$\\{([^\\{]+)\\}");
  var ALL_TYPE_PROPERTIES_EXP = new RegExp("^\\$\\[([^\\[\\]]+)\\]$");

  function propertiesDeal(configObject, properties) {
    if (!properties) {
      return configObject;
    }

    function replaceStringProperties(string, properties, property) {
      var rs;
      var str = string;
      rs = ALL_TYPE_PROPERTIES_EXP.exec(str);

      if (rs) {
        var propKey = rs[1];
        var propValue = xsloader$1.getObjectAttr(properties, propKey);

        if (propValue === undefined) {
          return str;
        } else {
          return propValue;
        }
      }

      var result = "";

      while (true) {
        rs = REPLACE_STRING_PROPERTIES_EXP.exec(str);

        if (!rs) {
          result += str;
          break;
        } else {
          var _propKey = rs[1];

          if (property !== undefined && property.propertyKey == _propKey) {
            throw new Error("replace property error:propertyKey=" + _propKey);
          } else if (property) {
            property.has = true;
          }

          result += str.substring(0, rs.index);
          result += xsloader$1.getObjectAttr(properties, _propKey);
          str = str.substring(rs.index + rs[0].length);
        }
      }

      return result;
    }

    function replaceProperties(obj, property, enableKeyAttr) {
      if (!obj) {
        return obj;
      }

      if (xsloader$1.isFunction(obj)) {
        return obj;
      } else if (xsloader$1.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
          obj[i] = replaceProperties(obj[i], property, enableKeyAttr);
        }
      } else if (xsloader$1.isString(obj)) {
        obj = replaceStringProperties(obj, properties, property);
      } else if (xsloader$1.isObject(obj)) {
        if (property) {
          property.has = false;
        }

        var replaceKeyMap = {};

        for (var x in obj) {
          if (property) {
            property.propertyKey = x;
          }

          obj[x] = replaceProperties(obj[x], property, enableKeyAttr);

          if (enableKeyAttr) {
            var _x = replaceStringProperties(x, properties, property);

            if (_x !== x) {
              replaceKeyMap[x] = _x;
            }
          }
        }

        for (var _x2 in replaceKeyMap) {
          var objx = obj[_x2];
          delete obj[_x2];
          obj[replaceKeyMap[_x2]] = objx;
        }
      }

      return obj;
    }

    if (!properties.__dealt__) {
      var property = {
        has: false
      };

      for (var x in properties) {
        var fun = properties[x];

        if (xsloader$1.isFunction(fun)) {
          properties[x] = fun.call(properties);
        }
      }

      do {
        replaceProperties(properties, property);
      } while (property.has);

      properties.__dealt__ = true;
    }

    return replaceProperties(configObject, undefined, true);
  }

  function replaceModulePrefix(config, deps) {
    if (!deps || deps.length == 0) {
      return;
    }

    for (var i = 0; i < deps.length; i++) {
      var m = deps[i];

      if (typeof m == "string") {
        var index = m.indexOf("!");
        var pluginParam = index > 0 ? m.substring(index) : "";
        m = index > 0 ? m.substring(0, index) : m;
        index = m.indexOf("?");
        var query = index > 0 ? m.substring(index) : "";
        m = index > 0 ? m.substring(0, index) : m;
        var is = isJsFile(m);

        if (!is && !/\.[^\/\s]*$/.test(m) && (xsloader$1.startsWith(m, ".") || dealPathMayAbsolute(m).absolute)) {
          deps[i] = m + ".js" + query + pluginParam;
        }
      }
    }

    if (config.modulePrefixCount) {
      for (var prefix in config.modulePrefix) {
        var replaceStr = config.modulePrefix[prefix].replace;
        var len = prefix.length;

        for (var _i = 0; _i < deps.length; _i++) {
          var _m = deps[_i];

          if (typeof _m == "string") {
            var pluginIndex = _m.indexOf("!");

            var pluginName = null;

            if (pluginIndex >= 0) {
              pluginName = _m.substring(0, pluginIndex + 1);
              _m = _m.substring(pluginIndex + 1);
            }

            if (xsloader$1.startsWith(_m, prefix)) {
              var dep = replaceStr + _m.substring(len);

              deps[_i] = pluginName ? pluginName + dep : dep;
            }
          }
        }
      }
    }
  }

  function getScriptBySubname(subname) {
    var ss = document.getElementsByTagName('script');

    if (subname) {
      for (var i = 0; i < ss.length; i++) {
        var script = ss[i];
        var src = script.src;
        src = src.substring(src.lastIndexOf("/"));

        if (src.indexOf(subname) >= 0) {
          return script;
        }
      }
    } else {
      return ss;
    }
  }

  var urls = {
    getPathWithRelative: getPathWithRelative,
    getNodeAbsolutePath: getNodeAbsolutePath,
    dealPathMayAbsolute: dealPathMayAbsolute,
    removeQueryHash: removeQueryHash,
    propertiesDeal: propertiesDeal,
    replaceModulePrefix: replaceModulePrefix,
    isJsFile: isJsFile,
    getScriptBySubname: getScriptBySubname
  };

  var xsloader$2 = global$1.xsloader;
  var commentRegExp = /\/\*[\s\S]*?\*\/|([^:"'=]|^)\/\/.*$/mg;
  var cjsRequireRegExp = /[^.]require\s*\(\s*["']([^'"\r\n]+)["']\s*\)/g;

  function GraphPath() {
    var pathEdges = {};
    var vertexMap = {};
    var depMap = {};

    this.addEdge = function (begin, end) {
      depMap[begin + "|" + end] = true;

      if (!pathEdges[begin]) {
        pathEdges[begin] = [];
      }

      if (!vertexMap[begin]) {
        vertexMap[begin] = true;
      }

      if (!vertexMap[end]) {
        vertexMap[end] = true;
      }

      pathEdges[begin].push({
        begin: begin,
        end: end
      });
    };

    this.hasDep = function (name, dep) {
      return depMap[name + "|" + dep];
    };

    this.tryAddEdge = function (begin, end) {
      this.addEdge(begin, end);
      var paths = this.hasLoop();

      if (paths.length > 0) {
        pathEdges[begin].pop();
      }

      return paths;
    };

    this.hasLoop = function () {
      var visited = {};
      var recursionStack = {};

      for (var x in vertexMap) {
        visited[x] = false;
        recursionStack[x] = false;
      }

      var has = false;
      var paths = [];

      for (var name in vertexMap) {
        paths = [];

        if (checkLoop(name, visited, recursionStack, paths)) {
          has = true;
          break;
        }
      }

      return has ? paths : [];
    };

    function checkLoop(v, visited, recursionStack, paths) {
      if (!visited[v]) {
        visited[v] = true;
        recursionStack[v] = true;
        paths.push(v);

        if (pathEdges[v]) {
          var edges = pathEdges[v];

          for (var i = 0; i < edges.length; i++) {
            var edge = edges[i];

            if (!visited[edge.end] && checkLoop(edge.end, visited, recursionStack, paths)) {
              return true;
            } else if (recursionStack[edge.end]) {
              paths.push(edge.end);
              return true;
            }
          }
        }
      }

      recursionStack[v] = false;
      return false;
    }
  }

  function strValue2Arr(obj) {
    if (!obj || xsloader$2.isArray(obj)) {
      return;
    }

    for (var x in obj) {
      if (xsloader$2.isString(obj[x])) {
        obj[x] = [obj[x]];
      }
    }
  }

  function each(ary, func, isSync, fromEnd) {
    if (ary) {
      if (isSync) {
        var fun = function fun(index) {
          if (fromEnd ? index < 0 : index >= ary.length) {
            return;
          }

          var handle = function handle(rs) {
            if (rs) {
              return;
            }

            fun(fromEnd ? index - 1 : index + 1);
          };

          func(ary[index], index, ary, handle);
        };

        fun(fromEnd ? ary.length - 1 : 0);
      } else {
        if (fromEnd) {
          for (var i = ary.length - 1; i >= 0; i--) {
            if (func(ary[i], i, ary) === false) {
              break;
            }
          }
        } else {
          for (var _i = 0; _i < ary.length; _i++) {
            if (func(ary[_i], _i, ary) === false) {
              break;
            }
          }
        }
      }
    }
  }

  function __commentReplace(match, singlePrefix) {
    return singlePrefix || '';
  }

  function appendInnerDeps(deps, callback) {
    if (xsloader$2.isFunction(callback)) {
      callback.toString().replace(commentRegExp, __commentReplace).replace(cjsRequireRegExp, function (match, dep) {
        if (xsloader$2.indexInArray(deps, dep) == -1) {
          deps.push(dep);
        }
      });
    }
  }

  var idCount = 2019;

  function getAndIncIdCount() {
    return idCount++;
  }

  var PluginError = function PluginError(err, invoker) {
    _classCallCheck(this, PluginError);

    if (err instanceof PluginError) {
      this.err = err.err;
      this.invoker = err.invoker;
    } else {
      this.err = err;
      this.invoker = invoker;
    }
  };

  var isXsLoaderEnd = false;

  var IE_VERSION = function getIEVersion() {
    var userAgent = navigator.userAgent;
    var isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1;
    var isEdge = userAgent.indexOf("Edge") > -1 && !isIE;
    var isIE11 = userAgent.indexOf('Trident') > -1 && userAgent.indexOf("rv:11.0") > -1;

    if (isIE) {
      var reIE = new RegExp("MSIE[\\s]+([0-9.]+);").exec(userAgent);
      var fIEVersion = parseInt(reIE && reIE[1] || -1);
      return fIEVersion == -1 ? -1 : fIEVersion;
    } else if (isEdge) {
      return 'edge';
    } else if (isIE11) {
      return 11;
    } else {
      return -1;
    }
  }();

  var base = {
    graphPath: new GraphPath(),
    strValue2Arr: strValue2Arr,
    each: each,
    appendInnerDeps: appendInnerDeps,
    getAndIncIdCount: getAndIncIdCount,
    PluginError: PluginError,
    loaderEnd: function loaderEnd() {
      isXsLoaderEnd = true;
    },
    isLoaderEnd: function isLoaderEnd() {
      return isXsLoaderEnd;
    },
    IE_VERSION: IE_VERSION
  };

  var utils = _objectSpread2({}, urls, {
    global: global$1
  }, base);

  var global$2 = utils.global;
  var xsloader$3 = global$2.xsloader;

  try {
    if (Function.prototype.bind && console && _typeof(console['log']) == "object") {
      utils.each(["log", "info", "warn", "error", "assert", "dir", "clear", "profile", "profileEnd"], function (method) {
        var thiz = Function.prototype.bind;
        console[method] = thiz.call(console[method], console);
      });
    }
  } catch (e) {
    global$2.console = {
      log: function log() {},
      error: function error() {},
      warn: function warn() {}
    };
  }

  try {
    if (!Array.prototype.indexOf) {
      Array.prototype.indexOf = function (elem, offset) {
        for (var i = offset === undefined ? 0 : offset; i < this.length; i++) {
          if (this[i] == elem) {
            return i;
          }
        }

        return -1;
      };
    }

    if (!Array.pushAll) {
      Array.pushAll = function (thiz, arr) {
        if (!xsloader$3.isArray(arr)) {
          throw new Error("not array:" + arr);
        }

        for (var i = 0; i < arr.length; i++) {
          thiz.push(arr[i]);
        }

        return thiz;
      };
    }
  } catch (e) {
    console.error(e);
  }

  function startsWith(str, starts) {
    if (!(typeof str == "string")) {
      return false;
    }

    return str.indexOf(starts) == 0;
  }

  function endsWith(str, ends) {
    if (!(typeof str == "string")) {
      return false;
    }

    var index = str.lastIndexOf(ends);

    if (index >= 0 && str.length - ends.length == index) {
      return true;
    } else {
      return false;
    }
  }

  function _indexInArray(array, ele) {
    var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var compare = arguments.length > 3 ? arguments[3] : undefined;
    var index = -1;

    if (array) {
      for (var i = offset || 0; i < array.length; i++) {
        if (compare) {
          if (compare(array[i], ele, i, array)) {
            index = i;
            break;
          }
        } else {
          if (array[i] == ele) {
            index = i;
            break;
          }
        }
      }
    }

    return index;
  }

  function indexInArray(array, ele, compare) {
    return _indexInArray(array, ele, 0, compare);
  }

  function indexInArrayFrom(array, ele, offset, compare) {
    return _indexInArray(array, ele, offset, compare);
  }

  var deprecated = {
    startsWith: startsWith,
    endsWith: endsWith,
    indexInArray: indexInArray,
    indexInArrayFrom: indexInArrayFrom
  };

  var global$3 = utils.global;
  var xsloader$4 = global$3.xsloader;
  var IE_VERSION$1 = utils.IE_VERSION;

  if (!String.prototype.trim) {
    String.prototype.trim = function () {
      return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    };
  }

  function randId(suffix) {
    var id = "r" + parseInt(new Date().getTime() / 1000) + "_" + parseInt(Math.random() * 1000) + "_" + utils.getAndIncIdCount();

    if (suffix !== undefined) {
      id += suffix;
    }

    return id;
  }

  function xsEval(scriptString) {
    try {
      var rs = IE_VERSION$1 > 0 && IE_VERSION$1 < 9 ? eval("[" + scriptString + "][0]") : eval("(" + scriptString + ")");
      return rs;
    } catch (e) {
      throw e;
    }
  }

  function xsParseJson(str, option) {
    if (str === "" || str === null || str === undefined || !xsloader$4.isString(str)) {
      return str;
    }

    option = xsloader$4.extend({
      fnStart: "",
      fnEnd: "",
      rcomment: "\\/\\/#\\/\\/"
    }, option);
    var fnMap = {};
    var fnOffset = 0;
    var replacer = undefined;

    if (option.fnStart && option.fnEnd) {
      while (true) {
        var indexStart = str.indexOf(option.fnStart, fnOffset);
        var indexEnd = str.indexOf(option.fnEnd, indexStart == -1 ? fnOffset : indexStart + option.fnStart.length);

        if (indexStart == -1 && indexEnd == -1) {
          break;
        } else if (indexStart == -1) {
          console.warn("found end:" + option.fnEnd + ",may lack start:" + option.fnStart);
          break;
        } else if (indexEnd == -1) {
          console.warn("found start:" + option.fnStart + ",may lack end:" + option.fnEnd);
          break;
        }

        var fnId = "_[_" + randId() + "_]_";
        var fnStr = str.substring(indexStart + option.fnStart.length, indexEnd).trim();

        if (!xsloader$4.startsWith(fnStr, "function(")) {
          throw "not a function:" + fnStr;
        }

        try {
          str = str.substring(0, indexStart) + '"' + fnId + '"' + str.substring(indexEnd + option.fnEnd.length);
          var fn = xsloader$4.xsEval(fnStr);
          fnMap[fnId] = fn;
        } catch (e) {
          console.error(fnStr);
          throw e;
        }

        fnOffset = indexStart + fnId.length;
      }

      replacer = function replacer(key, val) {
        if (xsloader$4.isString(val) && fnMap[val]) {
          return fnMap[val];
        } else {
          return val;
        }
      };
    }

    if (option.rcomment) {
      str = str.replace(/(\r\n)|\r/g, "\n");
      str = str.replace(new RegExp(option.rcomment + "[^\\n]*(\\n|$)", "g"), "");
    }

    try {
      var jsonObj = JSON;
      return jsonObj.parse(str, replacer);
    } catch (e) {
      try {
        var reg = new RegExp('position[\\s]*([0-9]+)[\\s]*$');

        if (e.message && reg.test(e.message)) {
          var posStr = e.message.substring(e.message.lastIndexOf("position") + 8);
          var pos = parseInt(posStr.trim());

          var _str = str.substring(pos);

          console.error(e.message + ":" + _str.substring(0, _str.length > 100 ? 100 : _str.length));
        }
      } catch (e2) {
        console.warn(e2);
      }

      throw e;
    }
  }

  function xsJson2String(obj) {
    var jsonObj = JSON;
    return jsonObj.stringify(obj);
  }

  var getPathWithRelative$1 = utils.getPathWithRelative;

  function _toParamsMap(argsStr) {
    var decode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    if (xsloader$4.isObject(argsStr)) {
      return argsStr;
    }

    if (!argsStr) {
      argsStr = location.search;
    }

    var index = argsStr.indexOf("?");

    if (index >= 0) {
      argsStr = argsStr.substring(index + 1);
    } else {
      if (utils.dealPathMayAbsolute(argsStr).absolute) {
        return {};
      }
    }

    index = argsStr.lastIndexOf("#");

    if (index >= 0) {
      argsStr = argsStr.substring(0, index);
    }

    var ret = {},
        seg = argsStr.split('&'),
        s;

    for (var i = 0; i < seg.length; i++) {
      if (!seg[i]) {
        continue;
      }

      s = seg[i].split('=');
      var name = decode ? decodeURIComponent(s[0]) : s[0];
      ret[name] = decode ? decodeURIComponent(s[1]) : s[1];
    }

    return ret;
  }

  function appendArgs2Url(url, urlArgs) {
    if (url === undefined || url === null || !urlArgs) {
      return url;
    }

    var index = url.lastIndexOf("?");
    var hashIndex = url.lastIndexOf("#");

    if (hashIndex < 0) {
      hashIndex = url.length;
    }

    var oldParams = index < 0 ? {} : _toParamsMap(url.substring(index + 1, hashIndex), false);

    var newParams = _toParamsMap(urlArgs, false);

    var has = false;

    for (var k in newParams) {
      if (oldParams[k] != newParams[k]) {
        oldParams[k] = newParams[k];
        has = true;
      }
    }

    if (!has) {
      return url;
    }

    var paramKeys = [];

    for (var _k in oldParams) {
      paramKeys.push(_k);
    }

    paramKeys.sort();
    var path = index < 0 ? url.substring(0, hashIndex) : url.substring(0, index);
    var params = [];

    for (var i = 0; i < paramKeys.length; i++) {
      var _k2 = paramKeys[i];
      params.push(_k2 + "=" + oldParams[_k2]);
    }

    params = params.join("&");
    var hash = "";

    if (hashIndex >= 0 && hashIndex < url.length) {
      hash = url.substring(hashIndex);
    }

    return path + (params ? "?" + params : "") + (hash ? hash : "");
  }

  function queryString2ParamsMap(argsStr, decode) {
    return _toParamsMap(argsStr, decode);
  }

  var base$1 = {
    randId: randId,
    xsEval: xsEval,
    xsParseJson: xsParseJson,
    xsJson2String: xsJson2String,
    getPathWithRelative: getPathWithRelative$1,
    appendArgs2Url: appendArgs2Url,
    queryString2ParamsMap: queryString2ParamsMap,
    IE_VERSION: IE_VERSION$1
  };

  var ostring = Object.prototype.toString;

  function isArray(it) {
    return it && it instanceof Array || ostring.call(it) === '[object Array]';
  }

  function isFunction(it) {
    return it && typeof it == "function" || ostring.call(it) === '[object Function]';
  }

  function isObject(it) {
    if (it === null || it === undefined) {
      return false;
    }

    return _typeof(it) == "object" || ostring.call(it) === '[object Object]';
  }

  function isString(it) {
    return it && typeof it == "string" || ostring.call(it) === '[object String]';
  }

  function isDate(it) {
    return it && it instanceof Date || ostring.call(it) === '[object Date]';
  }

  function isRegExp(it) {
    return it && it instanceof RegExp || ostring.call(it) === '[object RegExp]';
  }

  var is = {
    isArray: isArray,
    isFunction: isFunction,
    isObject: isObject,
    isString: isString,
    isDate: isDate,
    isRegExp: isRegExp
  };

  var global$4 = utils.global;
  var xsloader$5 = global$4.xsloader;

  function queryParam(name, otherValue, optionUrl) {
    var search;

    if (optionUrl) {
      var index = optionUrl.indexOf('?');

      if (index < 0) {
        index = 0;
      } else {
        index += 1;
      }

      search = optionUrl.substr(index);
    } else {
      search = window.location.search.substr(1);
    }

    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = search.match(reg);
    if (r != null) return decodeURIComponent(r[2]);
    return otherValue !== undefined ? otherValue : null;
  }

  function getUrl(relativeUrl, appendArgs, optionalAbsUrl) {
    if (optionalAbsUrl && !utils.dealPathMayAbsolute(optionalAbsUrl).absolute) {
      throw new Error("expected absolute url:" + optionalAbsUrl);
    }

    if (appendArgs === undefined) {
      appendArgs = true;
    }

    var theConfig = xsloader$5.config();
    var thePageUrl = xsloader$5.pageUrl();
    var url;

    if (relativeUrl === undefined) {
      url = thePageUrl;
    } else if (xsloader$5.startsWith(relativeUrl, ".") || utils.dealPathMayAbsolute(relativeUrl).absolute) {
      url = utils.getPathWithRelative(optionalAbsUrl || thePageUrl, relativeUrl);
    } else {
      url = theConfig.baseUrl + relativeUrl;
    }

    if (appendArgs) {
      if (url == thePageUrl) {
        url += location.search + location.hash;
      }

      return theConfig.dealUrl({}, url);
    } else {
      return url;
    }
  }

  function tryCall(fun, defaultReturn, thiz, exCallback) {
    var rs;

    try {
      thiz = thiz === undefined ? this : thiz;
      rs = fun.call(thiz);
    } catch (e) {
      if (xsloader$5.isFunction(exCallback)) {
        exCallback(e);
      } else {
        console.warn(e);
      }
    }

    if (rs === undefined || rs === null) {
      rs = defaultReturn;
    }

    return rs;
  }

  function dealProperties(obj, properties) {
    return utils.propertiesDeal(obj, properties);
  }

  function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
      var obj = arguments[i];

      if (!obj) {
        continue;
      }

      for (var x in obj) {
        var value = obj[x];

        if (value === undefined) {
          continue;
        }

        target[x] = obj[x];
      }
    }

    return target;
  }

  function extendDeep(target) {
    if (!target) {
      return target;
    }

    for (var i = 1; i < arguments.length; i++) {
      var obj = arguments[i];

      if (!obj) {
        continue;
      }

      for (var x in obj) {
        var value = obj[x];

        if (value === undefined) {
          continue;
        }

        if (xsloader$5.isObject(value) && xsloader$5.isObject(target[x])) {
          target[x] = xsloader$5.extendDeep(target[x], value);
        } else {
          target[x] = obj[x];
        }
      }
    }

    return target;
  }

  function _AsyncCall(useTimer) {
    var thiz = this;
    var count = 0;
    var ctrlCallbackMap = {};

    function initCtrlCallback(callbackObj) {
      var mineCount = count + "";

      if (!ctrlCallbackMap[mineCount]) {
        var ctrlCallback = function ctrlCallback() {
          count++;
          var asyncCallQueue = ctrlCallbackMap[mineCount];
          delete ctrlCallbackMap[mineCount];

          while (asyncCallQueue.length) {
            var _callbackObj = asyncCallQueue.shift();

            var lastReturn = undefined;

            try {
              if (_callbackObj.callback) {
                lastReturn = _callbackObj.callback.call(_callbackObj.handle, _callbackObj.obj, mineCount);
              }
            } catch (e) {
              console.error(e);
            }

            var handle = void 0;

            while (_callbackObj.nextCallback.length) {
              var nextObj = _callbackObj.nextCallback.shift();

              if (!handle) {
                handle = thiz.pushTask(nextObj.callback, lastReturn);
              } else {
                handle.next(nextObj.callback);
              }
            }
          }
        };

        ctrlCallbackMap[mineCount] = [];

        if (!useTimer && global$4.Promise && global$4.Promise.resolve) {
          global$4.Promise.resolve().then(ctrlCallback);
        } else {
          setTimeout(ctrlCallback, 0);
        }
      }

      var queue = ctrlCallbackMap[mineCount];
      queue.push(callbackObj);
    }

    this.pushTask = function (callback, obj) {
      var callbackObj;
      var handle = {
        next: function next(nextCallback, lastReturn) {
          callbackObj.nextCallback.push({
            callback: nextCallback,
            lastReturn: lastReturn
          });
          return this;
        }
      };
      callbackObj = {
        callback: callback,
        obj: obj,
        nextCallback: [],
        handle: handle
      };
      initCtrlCallback(callbackObj);
      return handle;
    };
  }

  var theAsyncCall = new _AsyncCall();
  var theAsyncCallOfTimer = new _AsyncCall(true);

  var asyncCall = function asyncCall(callback, useTimer) {
    if (useTimer) {
      return theAsyncCallOfTimer.pushTask(callback);
    } else {
      return theAsyncCall.pushTask(callback);
    }
  };

  function getObjectAttr(obj, attrNames, defaultValue) {
    if (!obj || !attrNames) {
      return undefined;
    }

    var attrs = attrNames.split(".");
    var rs = defaultValue;
    var i = 0;

    for (; i < attrs.length && obj; i++) {
      var k = attrs[i];
      obj = obj[k];
    }

    if (i == attrs.length) {
      rs = obj;
    }

    return rs;
  }

  function setObjectAttr(obj, attrNames, value) {
    var _obj = obj;
    var attrs = attrNames.split(".");

    for (var i = 0; i < attrs.length; i++) {
      var k = attrs[i];

      if (i == attrs.length - 1) {
        obj[k] = value;
        break;
      }

      var o = obj[k];

      if (!o) {
        o = {};
        obj[k] = o;
      }

      obj = o;
    }

    return _obj;
  }

  function clone(obj, isDeep) {
    if (!obj || xsloader$5.isFunction(obj) || xsloader$5.isString(obj)) return obj;

    if (xsloader$5.isRegExp(obj)) {
      return new RegExp(obj.source, obj.flags);
    }

    if (xsloader$5.isDate(obj)) {
      var copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
    }

    if (xsloader$5.isArray(obj) || xsloader$5.isObject(obj)) {
      var _copy = xsloader$5.isArray(obj) ? [] : {};

      for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) _copy[attr] = isDeep ? clone(obj[attr]) : obj[attr];
      }

      return _copy;
    }

    return obj;
  }

  var funs = {
    queryParam: queryParam,
    getUrl: getUrl,
    tryCall: tryCall,
    dealProperties: dealProperties,
    extend: extend,
    extendDeep: extendDeep,
    asyncCall: asyncCall,
    getObjectAttr: getObjectAttr,
    setObjectAttr: setObjectAttr,
    clone: clone
  };

  var global$5 = utils.global;
  var xsloader$6 = global$5.xsloader;
  var isDOM = (typeof HTMLElement === "undefined" ? "undefined" : _typeof(HTMLElement)) === 'object' ? function (obj) {
    return obj && obj instanceof HTMLElement;
  } : function (obj) {
    return obj && _typeof(obj) === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string';
  };

  var onReadyFun = function () {
    var isGlobalReady = false;
    var bindReadyQueue = [];

    function BindReady(callback) {
      if (isGlobalReady) {
        callback();
        return;
      }

      var isReady = false;

      function ready() {
        if (isReady) return;
        isReady = true;
        isGlobalReady = true;
        callback();
      }

      if (document.addEventListener) {
        var _fun;

        _fun = function fun() {
          document.removeEventListener("DOMContentLoaded", _fun);
          ready();
        };

        document.addEventListener("DOMContentLoaded", _fun);
      } else if (document.attachEvent) {
        var _fun2;

        _fun2 = function fun() {
          if (document.readyState === "complete") {
            document.detachEvent("onreadystatechange", _fun2);
            ready();
          }
        };

        document.attachEvent("onreadystatechange", _fun2);

        var _fun3;

        _fun3 = function fun2() {
          if (isReady) return;

          try {
            document.documentElement.doScroll("left");
          } catch (error) {
            setTimeout(_fun3, 0);
            return;
          }

          ready();
        };

        if (document.documentElement.doScroll && typeof global$5.frameElement === "undefined") _fun3();
      } else {
        xsloader$6.asyncCall(null, true).next(function () {
          ready();
        });
      }

      this.readyCall = ready;
    }

    var onReady = function onReady(callback) {
      if (document.readyState === "complete") {
        isGlobalReady = true;
      }

      var br = new BindReady(callback);

      if (!isGlobalReady) {
        bindReadyQueue.push(br);
      }
    };

    onReady(function () {
      isGlobalReady = true;
    });

    if (document.readyState === "complete") {
      isGlobalReady = true;
    } else {
      var addEventHandle;

      if (global$5.addEventListener) {
        addEventHandle = function addEventHandle(type, callback) {
          global$5.addEventListener(type, callback, false);
        };
      } else if (global$5.attachEvent) {
        addEventHandle = function addEventHandle(type, callback) {
          global$5.attachEvent("on" + type, callback);
        };
      } else {
        addEventHandle = function addEventHandle(type, callback) {
          xsloader$6.asyncCall(null, true).next(function () {
            callback();
          });
        };
      }

      addEventHandle("load", function () {
        isGlobalReady = true;

        while (bindReadyQueue.length) {
          bindReadyQueue.shift().readyCall();
        }
      });
    }

    return onReady;
  }();

  var browser = {
    isDOM: isDOM,
    onReady: onReadyFun
  };

  var global$6 = utils.global;
  var xsloader$7 = global$6.xsloader;

  var toGlobal = _objectSpread2({}, deprecated, {}, base$1);

  for (var k in toGlobal) {
    xsloader$7[k] = toGlobal[k];
    global$6[k] = toGlobal[k];
  }

  var justLoader = _objectSpread2({}, is, {}, funs, {}, browser, {
    _ignoreAspect_: {}
  });

  for (var _k in justLoader) {
    xsloader$7[_k] = justLoader[_k];
  }

  var global$7 = utils.global;
  var xsloader$8 = global$7.xsloader;
  var theDefinedMap = {};
  var lastDefinObjectMap = {};

  var ModuleDef = function () {
    function ModuleDef(src) {
      var isPreDependOn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      _classCallCheck(this, ModuleDef);

      _defineProperty(this, "src", void 0);

      _defineProperty(this, "defaultModule", void 0);

      _defineProperty(this, "modules", void 0);

      _defineProperty(this, "isPreDependOn", void 0);

      _defineProperty(this, "_preModule", void 0);

      _defineProperty(this, "targetDef", void 0);

      this.src = src;
      this.isPreDependOn = isPreDependOn;
      this.modules = {};
      this.defaultModule = null;
      this.targetDef = null;

      if (isPreDependOn) {
        this._preModule = {
          relyQueue: [],
          get: function get() {
            return this;
          },
          relyIt: function relyIt() {
            var args = [];

            for (var i = 0; i < arguments.length; i++) {
              args.push(arguments[i]);
            }

            this.relyQueue.push(args);
          }
        };
      }
    }

    _createClass(ModuleDef, [{
      key: "giveRelys",
      value: function giveRelys(module) {
        var queue = this._preModule.relyQueue;
        this._preModule = null;

        while (queue.length) {
          var args = queue.shift();
          module.relyIt.apply(module, args);
        }
      }
    }]);

    return ModuleDef;
  }();

  function _isSrc(nameOrUrl) {
    var isSrc = /^[a-zA-Z0-9]+:\/\//.test(nameOrUrl);
    return isSrc;
  }

  function setLastDefineObject(src, defineObject) {
    src = utils.removeQueryHash(src);
    lastDefinObjectMap[src] = defineObject;
  }

  function getLastDefineObject(src) {
    src = utils.removeQueryHash(src);
    return lastDefinObjectMap[src];
  }

  function appendLoadingModuleDeps(defineObject) {
    var src = defineObject.src;
    var deps = defineObject.deps;
    var moduleDef = theDefinedMap[src];

    if (moduleDef) {
      var mod = moduleDef.defaultModule && moduleDef.defaultModule.state == "loading" && moduleDef.defaultModule;

      var _deps = mod && mod.deps;

      utils.each(_deps, function (dep) {
        if (xsloader$8.indexInArray(deps, dep) == -1) {
          deps.push(dep);
        }
      });

      if (mod) {
        defineObject.pushName(mod.selfname);
      }

      for (var k in moduleDef.modules) {
        mod = moduleDef.modules[k].state == "loading" && moduleDef.modules[k];
        _deps = mod && mod.deps;

        if (mod) {
          defineObject.pushName(mod.selfname);
        }

        utils.each(_deps, function (dep) {
          if (xsloader$8.indexInArray(deps, dep) == -1) {
            deps.push(dep);
          }
        });
      }
    }
  }

  function getModule(nameOrUrl) {
    var selfname = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var ifoneThenGet = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    nameOrUrl = utils.removeQueryHash(nameOrUrl);

    var isSrc = _isSrc(nameOrUrl);

    var moduleDef = theDefinedMap[nameOrUrl];

    if (moduleDef) {
      var module;

      if (isSrc) {
        if (selfname) {
          module = moduleDef.modules[selfname];
        } else {
          module = moduleDef.defaultModule;
        }
      } else {
        if (moduleDef.isPreDependOn) {
          module = moduleDef._preModule;
        } else {
          module = moduleDef.modules[nameOrUrl];
        }
      }

      if (module == ifoneThenGet) {
        module = null;
      }

      if (!module && ifoneThenGet) {
        var count = 0;
        var mod = moduleDef.defaultModule;
        mod && mod != ifoneThenGet && count++;

        for (var k in moduleDef.modules) {
          mod = moduleDef.modules[k];
          mod != ifoneThenGet && count++;
        }

        if (count == 1 && (mod.state == "loaded" || mod.state == "defined")) {
          module = mod;
        }
      }

      return module ? module.get() : null;
    } else {
      return null;
    }
  }

  function preDependOn(name) {
    var isSrc = _isSrc(name);

    if (isSrc) {
      throw new Error("expected name,but src:" + name);
    } else if (theDefinedMap[name]) {
      throw new Error("already defined:" + name);
    } else {
      var def = new ModuleDef(null, !!name);
      theDefinedMap[name] = def;
    }
  }

  function replaceModuleSrc(oldSrc, module) {
    var moduleDef = theDefinedMap[oldSrc];

    if (!moduleDef) {
      throw new Error("not found module:src=" + oldSrc);
    } else if (theDefinedMap[module.src]) {
      throw new Error("already exists module:src=" + module.src);
    } else {
      moduleDef.src = module.src;
      delete theDefinedMap[oldSrc];
      theDefinedMap[module.src] = moduleDef;
    }
  }

  function clearEmptyModuleBySrc(src) {
    var moduleDef = theDefinedMap[src];

    if (moduleDef && !moduleDef.defaultModule) {
      if (moduleDef.defaultModule) {
        throw new Error("not empty module:src=" + src);
      } else {
        for (var x in moduleDef.modules) {
          throw new Error("not empty module:src=" + src);
        }
      }

      delete theDefinedMap[src];
    }
  }

  function setModule(name, module) {
    var src = module.src;

    if (!src) {
      throw new Error("expected module src!");
    }

    var moduleDef = theDefinedMap[src];

    if (moduleDef) {
      if (name) {
        var lasfDef = theDefinedMap[name];

        if (theDefinedMap[name] && lasfDef != moduleDef && !lasfDef.isPreDependOn) {
          throw new Error("already define module:\n\tname=" + name + ",current.src=" + src + ",\n\tthat.src=" + theDefinedMap[name].src);
        } else {
          moduleDef.modules[name] = module;
          theDefinedMap[name] = moduleDef;

          if (lasfDef && lasfDef.isPreDependOn) {
            lasfDef.giveRelys(module);
          }
        }
      } else {
        if (moduleDef.defaultModule && moduleDef.defaultModule != module) {
          throw new Error("already define default module:src=" + src);
        } else {
          moduleDef.defaultModule = module;
        }
      }
    } else {
      moduleDef = new ModuleDef(src);
      theDefinedMap[src] = moduleDef;

      if (name) {
        moduleDef.modules[name] = module;
        var _lasfDef = theDefinedMap[name];

        if (_lasfDef && !_lasfDef.isPreDependOn) {
          throw new Error("already define module:\n\tname=" + name + ",current.src=" + src + ",\n\tthat.src=" + theDefinedMap[name].src);
        } else {
          theDefinedMap[name] = moduleDef;

          if (_lasfDef && _lasfDef.isPreDependOn) {
            _lasfDef.giveRelys(module);
          }
        }
      } else {
        moduleDef.defaultModule = module;
      }
    }
  }

  var moduleDef = {
    getModule: getModule,
    setModule: setModule,
    replaceModuleSrc: replaceModuleSrc,
    clearEmptyModuleBySrc: clearEmptyModuleBySrc,
    preDependOn: preDependOn,
    setLastDefineObject: setLastDefineObject,
    getLastDefineObject: getLastDefineObject,
    appendLoadingModuleDeps: appendLoadingModuleDeps
  };

  var global$8 = utils.global;
  var xsloader$9 = global$8.xsloader;

  function newModuleInstance(module, thatInvoker, relyCallback, pluginArgs) {
    var instanceModule = {
      relyCallback: relyCallback,
      _invoker: thatInvoker,
      _module_: null,
      initInvoker: function initInvoker() {
        var _this = this;

        if (module.ignoreAspect) {
          return;
        }

        var obj = this._object;
        var invoker = this._invoker;

        var addTheAttrs = function addTheAttrs(theObj) {
          theObj._invoker_ = invoker;

          if (theObj._module_) {
            theObj._modules_ = theObj._modules_ || [];

            theObj._modules_.push(theObj._module_);
          }

          theObj._module_ = _this._module_;
          return theObj;
        };

        var isSingle = module.instanceType != "clone";

        if (xsloader$9.isObject(obj)) {
          if (module.loopObject && !isSingle) {
            throw new Error("loop dependency not support single option:" + module.description());
          }

          this._object = addTheAttrs(isSingle ? obj : xsloader$9.clone(obj));
        } else if (xsloader$9.isFunction(obj)) {
          this._object = addTheAttrs(obj);
        }
      },
      _object: null,
      _setDepModuleObjectGen: function _setDepModuleObjectGen(obj) {
        this._object = obj;
        this.initInvoker();
      },
      module: module,
      moduleObject: function moduleObject() {
        return this._object;
      },
      genExports: function genExports() {
        this._setDepModuleObjectGen({});

        return this._object;
      },
      _getCacheKey: function _getCacheKey(pluginArgs) {
        if (this._object.getCacheKey) {
          return this._object.getCacheKey.call(this.thiz, pluginArgs);
        }

        var id = this._invoker.getUrl();

        return id;
      },
      _willCache: function _willCache(pluginArgs, cacheResult) {
        if (this._object.willCache) {
          return this._object.willCache.call(this.thiz, pluginArgs, cacheResult);
        }

        return true;
      },
      lastSinglePluginResult: function lastSinglePluginResult(pluginArgs) {
        var id = this._getCacheKey(pluginArgs);

        return this.module.lastSinglePluginResult(id, pluginArgs);
      },
      setSinglePluginResult: function setSinglePluginResult(pluginArgs, obj) {
        var id = this._getCacheKey(pluginArgs);

        var willCache = this._willCache(pluginArgs, obj);

        return this.module.setSinglePluginResult(willCache, id, pluginArgs, obj);
      },
      init: function init(justForSingle) {
        var _this2 = this;

        var relyCallback = this.relyCallback;
        this._module_ = this.module.dealInstance(this);

        this._setDepModuleObjectGen(this.module.loopObject || this.module.moduleObject);

        if (pluginArgs !== undefined) {
          if (!this._object) {
            throw new Error("pulgin error:" + this.module.description());
          }

          if (this._object.isSingle === undefined) {
            this._object.isSingle = true;
          }

          if (justForSingle && !this._object.isSingle) {
            throw new Error("just for single plugin");
          }

          var hasFinished = false;

          var onload = function onload(result, ignoreAspect) {
            if (result == undefined) {
              result = {
                __default: true
              };
            }

            hasFinished = true;

            if (_this2._object.isSingle) {
              _this2.setSinglePluginResult(pluginArgs, {
                result: result,
                ignoreAspect: ignoreAspect
              });
            }

            _this2.module.ignoreAspect = ignoreAspect === undefined || ignoreAspect;

            _this2._setDepModuleObjectGen(result);

            relyCallback(_this2);
          };

          var onerror = function onerror(err) {
            hasFinished = true;
            relyCallback(_this2, new utils.PluginError(err || false));
          };

          try {
            var cacheResult;

            if (this._object.isSingle && (cacheResult = this.lastSinglePluginResult(pluginArgs)) !== undefined) {
              var last = cacheResult;
              onload(last.result, last.ignoreAspect);
            } else {
              var args = [pluginArgs, onload, onerror, xsloader$9.config()].concat(this.module.args);

              this._object.pluginMain.apply(this.thiz, args);
            }
          } catch (e) {
            console.warn(e);
            onerror(e);
          }

          if (!hasFinished) {
            setTimeout(function () {
              if (!hasFinished) {
                console.warn("invoke plugin may failed:page=" + location.href + ",plugin=" + module.selfname + "!" + pluginArgs);
              }
            }, xsloader$9.config().waitSeconds * 1000);
          }
        } else {
          relyCallback(this);
        }
      }
    };
    var moduleMap = {
      module: module,
      src: module.src,
      absUrl: function absUrl() {
        return module.thiz.absUrl();
      },
      selfname: module.thiz.getName(),
      invoker: instanceModule._invoker
    };
    instanceModule.thiz = new script.Invoker(moduleMap);
    return instanceModule;
  }

  function _newModule(name, src, thatInvoker, callback) {
    src = utils.removeQueryHash(src);
    var defineObject = new script.DefineObject(src, null, [name, null, callback]);
    defineObject.thatInvoker = thatInvoker;
    defineObject.appendConfigDepsAndEmbedDeps();
    return newModule(defineObject);
  }

  function newModule(defineObject) {
    var instances = [];
    var moduleMap = {
      id: utils.getAndIncIdCount(),
      selfname: defineObject.selfname,
      parent: defineObject.parentDefine,
      description: function description() {
        return "selfname=" + (this.selfname || "") + ",src=" + this.src;
      },
      deps: defineObject.deps || [],
      relys: [],
      otherModule: undefined,
      ignoreAspect: false,
      args: null,
      src: defineObject.src,
      absUrl: function absUrl() {
        return defineObject.absUrl();
      },
      callback: defineObject.callback,
      _dealApplyArgs: function _dealApplyArgs(args) {
        return args;
      },
      _loadCallback: null,
      moduleObject: undefined,
      loopObject: undefined,
      invoker: defineObject.thatInvoker,
      instanceType: "single",
      reinitByDefineObject: function reinitByDefineObject(defineObject) {
        this.deps = defineObject.deps || [];
        this.callback = defineObject.callback;
      },
      setInstanceType: function setInstanceType(instanceType) {
        this.instanceType = instanceType;
      },
      _singlePluginResult: {},
      lastSinglePluginResult: function lastSinglePluginResult(id, pluginArgs) {
        if (this._singlePluginResult[id]) {
          return this._singlePluginResult[id][pluginArgs];
        }
      },
      setSinglePluginResult: function setSinglePluginResult(willCache, id, pluginArgs, obj) {
        if (willCache) {
          if (!this._singlePluginResult[id]) {
            this._singlePluginResult[id] = {};
          }

          this._singlePluginResult[id][pluginArgs] = obj;
        } else {
          if (this._singlePluginResult[id]) {
            delete this._singlePluginResult[id][pluginArgs];
          }
        }
      },
      finish: function finish(args) {
        args = this._dealApplyArgs(args);
        this.args = args;
        var obj;

        if (xsloader$9.isFunction(this.callback)) {
          try {
            script.currentDefineModuleQueue.push(this);
            obj = this.callback.apply(this.thiz, args);
            script.currentDefineModuleQueue.pop();
          } catch (e) {
            script.currentDefineModuleQueue.pop();
            console.error("error occured,invoker.url=", this.invoker ? this.invoker.getUrl() : "");
            console.error(e);
            this.setState("error", e);
            return;
          }
        } else {
          obj = this.callback;

          if (this.moduleObject !== undefined) {
            console.warn("ignore moudule:" + moduleMap.description());
          }
        }

        var isDefault = false;

        if (obj === undefined) {
          isDefault = true;
          obj = {
            __default: true
          };
        }

        if (this.loopObject) {
          if (!xsloader$9.isObject(obj)) {
            throw new Error("循环依赖的模块必须是对象：" + this.description());
          }

          for (var x in obj) {
            this.loopObject[x] = obj[x];
          }

          obj = this.loopObject;
        }

        if (this.moduleObject === undefined || !isDefault && obj !== undefined) {
            this.moduleObject = obj;
          }

        this.setState("defined");
      },
      state: "init",
      errinfo: null,
      _callback: function _callback(fun) {
        var thiz = this;
        var _state = thiz.state;

        if (_state == 'defined' || thiz.loopObject) {
          var theCallback = function theCallback() {
            if (fun) {
              var depModule = newModuleInstance(thiz, fun.thatInvoker, fun.relyCallback, fun.pluginArgs);
              depModule.init();
            }
          };

          var deps = !thiz.loopObject && xsloader$9.config().getDeps(thiz.selfname);

          if (deps && deps.length > 0) {
            xsloader$9.require(deps, function () {
              theCallback();
            }).then({
              defined_module_for_deps: this.selfname
            });
          } else {
            theCallback();
          }

          return false;
        } else if (_state == "timeout" || _state == "error") {
          if (fun) {
            fun.relyCallback(this, this.errinfo);
          }

          return false;
        } else {
          return true;
        }
      },
      setState: function setState(_state, errinfo) {
        this.state = _state;
        this.errinfo = errinfo;

        if (!this._callback()) {
          while (this.relys.length) {
            var fun = this.relys.shift();

            this._callback(fun);
          }
        }
      },
      get: function get() {
        if (this.otherModule) {
          this.state = this.otherModule.state;
          return this.otherModule;
        }

        return this;
      },
      toOtherModule: function toOtherModule(otherModule) {
        this.otherModule = otherModule;
        this.get();
        var theRelys = this.relys;
        this.relys = [];

        while (theRelys.length) {
          var fun = theRelys.shift();
          otherModule.relyIt(fun.thatInvoker, fun.relyCallback, fun.pluginArgs);
        }
      },
      whenNeed: function whenNeed(loadCallback) {
        if (this.relys.length || this.otherModule && this.otherModule.relys.length) {
          loadCallback();
        } else {
          this._loadCallback = loadCallback;
        }
      },
      relyIt: function relyIt(thatInvoker, callbackFun, pluginArgs) {
        if (this.otherModule) {
          this.get();
          this.otherModule.relyIt(thatInvoker, callbackFun, pluginArgs);
          return;
        }

        var fun = {
          thatInvoker: thatInvoker,
          relyCallback: callbackFun,
          pluginArgs: pluginArgs
        };

        if (this._callback(fun)) {
          this.relys.push(fun);
        }

        if (this._loadCallback) {
          var loadCallback = this._loadCallback;
          this._loadCallback = null;
          loadCallback();
        }
      }
    };
    new script.Invoker(moduleMap);

    moduleMap.dealInstance = function (moduleInstance) {
      instances.push(moduleInstance);
      var _module_ = {
        opId: null,
        setToAll: function setToAll(name, value, opId) {
          if (opId !== undefined && opId == this.opId) {
            return;
          }

          opId = opId || getModuleId();
          this.opId = opId;
          var obj = {};

          if (xsloader$9.isString(name)) {
            obj[name] = value;
          } else if (xsloader$9.isObject(name)) {
            for (var k in name) {
              obj[k] = name[k];
            }
          } else {
            throw new Error("unknown param:" + name);
          }

          utils.each(instances, function (ins) {
            var mobj = ins.moduleObject();

            for (var _k in obj) {
              mobj[_k] = obj[_k];
            }

            if (mobj._modules_) {
              utils.each(mobj._modules_, function (_m_) {
                _m_.setToAll(name, value, opId);
              });
            }
          });
        }
      };
      return _module_;
    };

    moduleMap.printOnNotDefined = function () {
      var root = {
        nodes: []
      };

      this._printOnNotDefined(root);

      var leafs = [];

      function findLeaf(node) {
        if (node.nodes.length) {
          utils.each(node.nodes, function (item) {
            findLeaf(item);
          });
        } else {
          leafs.push(node);
        }
      }

      findLeaf(root);

      function genErrs(node, infos) {
        infos.push(node.err);

        if (node.parent) {
          genErrs(node.parent, infos);
        }
      }

      utils.each(leafs, function (leaf) {
        var infos = [];
        genErrs(leaf, infos);
        infos = infos.reverse();
        console.error("load module error stack:my page=" + location.href);

        for (var i = 1; i < infos.length;) {
          var as = [];

          for (var k = 0; k < 3 && i < infos.length; k++) {
            as.push(infos[i++]);
          }

          console.warn(as.join("\n\t--->"));
        }

        var errModule = leaf.module;

        if (leaf.module && leaf.module.state == "defined") {
          errModule = leaf.parent.module;
        }

        if (errModule) {
          var _as = [];

          for (var _i = 0; _i < errModule.deps.length; _i++) {
            var dep = errModule.deps[_i];
            var index = dep.lastIndexOf("!");

            if (index != -1) {
              dep = dep.substring(0, index);
            }

            var depMod = moduleDef.getModule(dep);

            if (depMod) {
              _as.push(dep + ":" + depMod.state);
            } else {
              _as.push(dep + ":null");
            }
          }

          console.warn("failed module:" + errModule.description() + ",\n\tdeps state infos [" + _as.join(",") + "]");

          for (var _i2 = 0; _i2 < errModule.deps.length; _i2++) {
            var _dep = errModule.deps[_i2];

            var _index = _dep.lastIndexOf("!");

            if (_index != -1) {
              _dep = _dep.substring(0, _index);
            }

            var _depMod = moduleDef.getModule(_dep);

            if (_depMod) {
              console.warn("\t" + _dep + ":src=" + _depMod.src + ",absUrl=" + (_depMod.thiz && _depMod.thiz.absUrl()));
            } else {
              console.warn(_dep + ":");
            }
          }
        }
      });
    };

    moduleMap._printOnNotDefined = function (parentNode) {
      var node = {
        err: "[" + this.description() + "].state=" + this.state,
        module: this,
        parent: parentNode,
        nodes: []
      };
      parentNode.nodes.push(node);

      if (this.state == "defined") {
        return;
      }

      utils.each(this.deps, function (dep) {
        var indexPlguin = dep.indexOf("!");

        if (indexPlguin > 0) {
          dep = dep.substring(0, indexPlguin);
        }

        var mod = moduleDef.getModule(dep);

        if (mod && mod.state == "defined") {
          mod._printOnNotDefined(node);

          return;
        }

        if (mod) {
          mod._printOnNotDefined && mod._printOnNotDefined(node);
        } else {
          node.nodes.push({
            parent: parentNode,
            nodes: [],
            err: "[" + dep + "] has not module"
          });
        }
      });
    };

    moduleDef.setModule(moduleMap.selfname, moduleMap);
    return moduleMap;
  }

  var randModuleIndex = 0;

  function getModuleId() {
    return "_xs_req_2019_" + randModuleIndex++;
  }

  function everyRequired(defineObject, module, everyOkCallback, errCallback) {
    if (defineObject.isError) {
      return;
    }

    defineObject.dealRelative(module);
    var config = xsloader$9.config();
    var isError = false,
        hasCallErr = false,
        theExports;
    var depCount = module.deps.length;
    var depModules = new Array(depCount);
    var invoker_of_module = module.thiz;

    function checkFinish(index, dep_name, depModule, syncHandle) {
      depModules[index] = depModule;

      if (depCount <= 0 && !isError) {
        everyOkCallback(depModules, module);
      } else if (isError) {
        module.setState('error', isError);

        if (!hasCallErr) {
          hasCallErr = true;
          errCallback({
            err: isError,
            index: index,
            dep_name: dep_name
          }, invoker_of_module);
        }
      }

      !isError && syncHandle && syncHandle();
    }

    utils.each(module.deps, function (dep, index, ary, syncHandle) {
      var originDep = dep;
      var pluginArgs = undefined;
      var pluginIndex = dep.indexOf("!");

      if (pluginIndex > 0) {
        pluginArgs = dep.substring(pluginIndex + 1);
        dep = dep.substring(0, pluginIndex);
      }

      var relyItFun = function relyItFun() {
        moduleDef.getModule(dep).relyIt(invoker_of_module, function (depModule, err) {
          if (!err) {
            depCount--;

            if (dep == "exports") {
              if (theExports) {
                module.moduleObject = theExports;
              } else {
                theExports = module.moduleObject = depModule.genExports();
              }
            }
          } else {
            isError = err;
          }

          checkFinish(index, originDep, depModule, syncHandle);
        }, pluginArgs);
      };

      if (!moduleDef.getModule(dep)) {
        var isJsFile = utils.isJsFile(dep);

        var _loop = function _loop() {
          var urls = void 0;

          if (!isJsFile && dep.indexOf("/") < 0 && dep.indexOf(":") >= 0) {
            var i1 = dep.indexOf(":");
            var i2 = dep.indexOf(":", i1 + 1);
            var i3 = i2 > 0 ? dep.indexOf(":", i2 + 1) : -1;

            if (i2 == -1) {
              isError = "illegal module:" + dep;
              errCallback(isError, invoker_of_module);
              return "break";
            }

            var version;
            var groupModule;

            if (i3 == -1) {
              version = config.defaultVersion[dep];
              groupModule = dep + ":" + version;
            } else {
              version = dep.substring(i3 + 1);
              groupModule = dep;
            }

            if (version === undefined) {
              isError = "unknown version for:" + dep;
              errCallback(isError, invoker_of_module);
              return "break";
            }

            var _url = xsloader$9._resUrlBuilder(groupModule);

            urls = xsloader$9.isArray(_url) ? _url : [_url];
          } else if (config.isInUrls(dep)) {
            urls = config.getUrls(dep);
          } else if (isJsFile) {
            urls = [dep];
          } else {
            urls = [];
          }

          if (urls.length == 0) {
            moduleDef.preDependOn(dep);
          } else {
            utils.each(urls, function (url, index) {
              if (xsloader$9.startsWith(url, ".") || xsloader$9.startsWith(url, "/")) {
                if (!invoker_of_module.rurl(defineObject)) {
                  isError = "script url is null:'" + module.description();
                  errCallback(isError, invoker_of_module);
                }

                url = utils.getPathWithRelative(invoker_of_module.rurl(defineObject), url);
              } else {
                var absolute = utils.dealPathMayAbsolute(url);

                if (absolute.absolute) {
                  url = absolute.path;
                } else {
                  url = config.baseUrl + url;
                }
              }

              urls[index] = config.dealUrl(dep, url);
            });
          }

          if (!isError && urls.length) {
            var loadModule = function loadModule() {
              var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

              if (index >= urls.length) {
                return;
              }

              var url = urls[index];
              moduleDef.setLastDefineObject(url, defineObject);

              if (index > 0) {
                var oldSrc = module2.src;
                module2.src = url;
                moduleDef.replaceModuleSrc(oldSrc, module2);
              }

              script.loadScript(module2.selfname, url, function (scriptData) {
                if (module2.state == "loading") {
                  var defaultMod = moduleDef.getModule(module2.src, null, module2);

                  if (defaultMod && module2 != defaultMod) {
                    module2.toOtherModule(defaultMod);
                  }
                }

                if (module2.state == "loading") {
                  module2.finish([]);
                }
              }, function (err) {
                if (index + 1 < urls.length) {
                  loadModule(index + 1);
                } else {
                  isError = err;
                  errCallback(isError, invoker_of_module);
                }
              });
            };

            utils.replaceModulePrefix(config, urls);
            var m2Name = isJsFile ? null : dep;

            var module2 = _newModule(m2Name, urls[0], invoker_of_module);

            module2.setState("loading");
            var configDeps = [];

            if (m2Name) {
              var _deps = config.getDeps(m2Name);

              utils.each(_deps, function (d) {
                if (xsloader$9.indexInArray(configDeps, d) == -1) {
                  configDeps.push(d);
                }
              });
            }

            utils.each(urls, function (url) {
              var _deps = config.getDeps(url);

              utils.each(_deps, function (d) {
                if (xsloader$9.indexInArray(configDeps, d) == -1) {
                  configDeps.push(d);
                }
              });
            });

            if (configDeps.length) {
              xsloader$9.require(configDeps, function () {
                loadModule();
              });
            } else {
              loadModule();
            }
          }
        };

        do {
          var _ret = _loop();

          if (_ret === "break") break;
        } while (false);
      }

      if (!isError) {
        relyItFun();
      }
    }, defineObject.handle.orderDep);
  }

  var moduleScript = _objectSpread2({}, moduleDef, {
    newModule: newModule,
    everyRequired: everyRequired,
    newModuleInstance: newModuleInstance,
    getModuleId: getModuleId
  });

  var global$9 = utils.global;
  var xsloader$a = global$9.xsloader;
  var defContextName = "xsloader1.1.x";
  var DATA_ATTR_MODULE = 'data-xsloader-module';
  var DATA_ATTR_CONTEXT = "data-xsloader-context";
  var INNER_DEPS_PLUGIN = "__inner_deps__";
  var innerDepsMap = {};
  var globalDefineQueue = [];
  var isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]';

  var safariVersion = function () {
    var ua = navigator.userAgent.toLowerCase();
    var s = ua.match(/version\/([\d.]+).*safari/);
    return s ? parseInt(s[1]) : -1;
  }();

  var readyRegExp = navigator.platform === 'PLAYSTATION 3' ? /^complete$/ : /^(complete|loaded)$/;
  var theLoaderScript = document.currentScript || utils.getScriptBySubname("xsloader.js");
  var theLoaderUrl = utils.getNodeAbsolutePath(theLoaderScript);

  var thePageUrl = function () {
    var url = location.href;
    url = utils.removeQueryHash(url);
    return url;
  }();

  var head = document.head || document.getElementsByTagName('head')[0];
  var currentDefineModuleQueue = [];

  currentDefineModuleQueue.peek = function () {
    if (this.length > 0) {
      return this[this.length - 1];
    }
  };

  var lastAppendHeadDom = theLoaderScript;
  var isSrcFromScriptLoad;
  var lastScriptSrc = thePageUrl;
  var theRealDefine;

  if (safariVersion > 0 && safariVersion <= 7) {
    isSrcFromScriptLoad = true;
  }

  function _dealEmbedDeps(deps) {
    for (var i = 0; i < deps.length; i++) {
      var dep = deps[i];

      if (xsloader$a.isArray(dep)) {
        var modName = "inner_order_" + moduleScript.getModuleId();
        var isOrderDep = !(dep.length > 0 && dep[0] === false);

        if (dep.length > 0 && (dep[0] === false || dep[0] === true)) {
          dep = dep.slice(1);
        }

        innerDepsMap[modName] = {
          deps: dep,
          orderDep: isOrderDep
        };
        deps[i] = INNER_DEPS_PLUGIN + "!" + modName;
      }
    }
  }

  function _getPluginParam(path) {
    var pluginIndex = path.indexOf("!");

    if (pluginIndex > 0) {
      return path.substring(pluginIndex);
    } else {
      return "";
    }
  }

  var Handle = function () {
    function Handle(defineObject) {
      _classCallCheck(this, Handle);

      _defineProperty(this, "defineObject", void 0);

      this.defineObject = defineObject;
    }

    _createClass(Handle, [{
      key: "then",
      value: function then(option) {
        var defineObject = this.defineObject;
        defineObject.handle = xsloader$a.extend(defineObject.handle, option);
        return this;
      }
    }, {
      key: "error",
      value: function error(onError) {
        var defineObject = this.defineObject;
        defineObject.handle.onError = onError;
        return this;
      }
    }]);

    return Handle;
  }();

  var ThisInvoker = function ThisInvoker(invoker) {
    _classCallCheck(this, ThisInvoker);

    _defineProperty(this, "invoker", void 0);

    this.invoker = invoker;
  };

  function _buildInvoker(module) {
    var invoker = module["thiz"];
    module = module.module || module;
    var id = xsloader$a.randId();

    invoker.getId = function () {
      return id;
    };

    invoker.getUrl = function (relativeUrl) {
      var appendArgs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var optionalAbsUrl = arguments.length > 2 ? arguments[2] : undefined;

      if (optionalAbsUrl && !utils.dealPathMayAbsolute(optionalAbsUrl).absolute) {
        throw new Error(-1, "expected absolute url:" + optionalAbsUrl);
      }

      var url;

      if (relativeUrl === undefined) {
        url = this.src();
      } else if (xsloader$a.startsWith(relativeUrl, ".") || utils.dealPathMayAbsolute(relativeUrl).absolute) {
        url = utils.getPathWithRelative(optionalAbsUrl || this.absUrl(), relativeUrl);
      } else {
        url = xsloader$a.config().baseUrl + relativeUrl;
      }

      if (appendArgs) {
        if (url == thePageUrl) {
          url += location.search + location.hash;
        }

        return xsloader$a.config().dealUrl(module, url);
      } else {
        return url;
      }
    };

    invoker.require = function () {
      console.log("this.require:absolute=" + invoker.src() + ",args[0]=" + arguments[0]);

      var h = xsloader$a.require.apply(new ThisInvoker(invoker), arguments);

      if (h instanceof Handle) {
        h.then({
          absUrl: invoker.src()
        });
      }

      return h;
    };

    invoker.define = function () {
      var h = xsloader$a.define.apply(new ThisInvoker(invoker), arguments);

      if (h instanceof Handle) {
        h.then({
          absUrl: invoker.src()
        });
      }

      return h;
    };

    invoker.rurl = function (defineObject) {
      return defineObject && defineObject.absUrl() || this.absUrl();
    };

    invoker.defineAsync = function () {
      var h = invoker.define.apply(invoker, arguments);
      return h;
    };

    invoker.withAbsUrl = function (absUrlStr) {
      var moduleMap = {
        module: module,
        src: module.src,
        absUrl: function absUrl() {
          return absUrlStr;
        },
        name: invoker.getName(),
        invoker: invoker.invoker()
      };
      return new Invoker(moduleMap);
    };
  }

  var Invoker = function () {
    function Invoker(moduleMap) {
      _classCallCheck(this, Invoker);

      _defineProperty(this, "_im", void 0);

      this._im = new InVar(moduleMap);
      moduleMap.thiz = this;

      _buildInvoker(moduleMap);
    }

    _createClass(Invoker, [{
      key: "getAbsoluteUrl",
      value: function getAbsoluteUrl() {
        return this._im.get().src;
      }
    }, {
      key: "src",
      value: function src() {
        return this._im.get().src;
      }
    }, {
      key: "getName",
      value: function getName() {
        return this._im.get().selfname;
      }
    }, {
      key: "invoker",
      value: function invoker() {
        return this._im.get().invoker;
      }
    }, {
      key: "absUrl",
      value: function absUrl() {
        return this._im.get().absUrl();
      }
    }]);

    return Invoker;
  }();

  function getInvoker(thiz) {
    var nullNew = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (thiz instanceof ThisInvoker) {
      return thiz.invoker;
    } else if (thiz instanceof Invoker) {
      return thiz;
    } else if (thiz instanceof DefineObject) {
      return thiz.thatInvoker;
    } else {
      var parentModule = currentDefineModuleQueue.peek();

      if (parentModule) {
        return parentModule.thiz;
      } else if (nullNew) {
        var moduleMap = {
          module: "",
          src: thePageUrl,
          absUrl: function absUrl() {
            return thePageUrl;
          },
          name: "__root__",
          invoker: null
        };
        return new Invoker(moduleMap);
      }
    }
  }

  var DefineObject = function () {
    function DefineObject(src, thiz) {
      var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
      var isRequire = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      _classCallCheck(this, DefineObject);

      _defineProperty(this, "thiz", void 0);

      _defineProperty(this, "isRequire", void 0);

      _defineProperty(this, "src", void 0);

      _defineProperty(this, "parentDefine", void 0);

      _defineProperty(this, "handle", void 0);

      _defineProperty(this, "selfname", void 0);

      _defineProperty(this, "deps", void 0);

      _defineProperty(this, "callback", void 0);

      _defineProperty(this, "thatInvoker", void 0);

      _defineProperty(this, "_directDepLength", 0);

      _defineProperty(this, "directDepLength", 0);

      _defineProperty(this, "names", []);

      this.parentDefine = currentDefineModuleQueue.peek();
      this.thatInvoker = getInvoker(thiz);

      if (thiz instanceof ThisInvoker) {
        src = thiz.invoker.src();
      }

      this.src = src;
      this.thiz = thiz;
      this.isRequire = isRequire;
      this.handle = {
        onError: function onError(err) {
          console.warn(err);
        },
        before: function before(deps) {},
        depBefore: function depBefore(index, dep, depDeps) {},
        orderDep: false,
        absoluteUrl: undefined,
        absUrl: undefined,
        instance: undefined
      };
      var selfname = args[0];
      var deps = args[1];
      var callback = args[2];

      if (args.length == 1) {
        callback = selfname;
        selfname = null;
        deps = null;
      } else if (typeof selfname !== 'string') {
        callback = deps;
        deps = selfname;
        selfname = null;
      }

      if (deps && !xsloader$a.isArray(deps)) {
        callback = deps;
        deps = null;
      }

      if (!deps) {
        deps = [];
      }

      utils.appendInnerDeps(deps, callback);
      this.selfname = selfname;
      this.deps = deps;
      this.pushName(selfname);
      this.callback = callback;
      this._directDepLength = deps.length;
      this.directDepLength = deps.length;
    }

    _createClass(DefineObject, [{
      key: "pushName",
      value: function pushName(name) {
        if (name && xsloader$a.indexInArray(this.names, name) == -1) {
          this.names.push(name);
        }
      }
    }, {
      key: "appendConfigDepsAndEmbedDeps",
      value: function appendConfigDepsAndEmbedDeps(module) {
        var config = xsloader$a.config();
        var src = this.src;
        var deps = this.deps;

        var _deps = config.getDeps(src);

        utils.each(_deps, function (dep) {
          if (xsloader$a.indexInArray(deps, dep) == -1) {
            deps.push(dep);
          }
        });
        utils.each(this.names, function (name) {
          _deps = config.getDeps(name);
          utils.each(_deps, function (dep) {
            if (xsloader$a.indexInArray(deps, dep) == -1) {
              deps.push(dep);
            }
          });
        });

        if (this.handle.orderDep && this._directDepLength > 1 && deps.length > this._directDepLength) {
          var odeps = [true];

          while (this._directDepLength-- > 0) {
            odeps.push(deps.shift());
          }

          deps.unshift(odeps);
          this.handle.orderDep = false;
        }

        _dealEmbedDeps(deps);

        utils.replaceModulePrefix(config, deps);

        if (module) {
          module.deps = deps;

          module._dealApplyArgs = function (directDepLength, hasOrderDep) {
            return function (applyArgs) {
              if (directDepLength == 0) {
                return [];
              }

              var args = new Array(directDepLength + 1);

              if (hasOrderDep) {
                args = applyArgs[0];
              } else {
                for (var i = 0; i < directDepLength; i++) {
                  args[i] = applyArgs[i];
                }

                args[directDepLength] = applyArgs[applyArgs.length - 1].slice(0, directDepLength);
              }

              return args;
            };
          }(this.directDepLength, this.directDepLength > 0 && this._directDepLength <= 0);
        }
      }
    }, {
      key: "dealRelative",
      value: function dealRelative(module) {
        var deps = this.deps;

        for (var i = 0; i < deps.length; i++) {
          var m = deps[i];
          var jsFilePath = utils.isJsFile(m);

          if (jsFilePath && xsloader$a.startsWith(m, ".")) {
            m = utils.getPathWithRelative(module.thiz.rurl(this), jsFilePath.path) + _getPluginParam(m);
            deps[i] = m;
          }

          var paths = utils.graphPath.tryAddEdge(this.handle.defined_module_for_deps || module.selfname, m);

          if (paths.length > 0) {
            var moduleLoop = moduleScript.getModule(m);
            moduleLoop.loopObject = {};
          }
        }
      }
    }, {
      key: "absUrl",
      value: function absUrl() {
        return this.handle.absUrl || this.handle.absoluteUrl || this.src;
      }
    }]);

    return DefineObject;
  }();

  function getCurrentScript() {
    var isRemoveQueryHash = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    function _getCurrentScriptOrSrc() {
      if (document.currentScript !== undefined) {
        var node = document.currentScript && document.currentScript.src && document.currentScript;

        if (node) {
          return {
            node: node,
            src: node.src
          };
        }
      }

      if (utils.IE_VERSION > 0 && utils.IE_VERSION <= 10) {
        var nodes = document.getElementsByTagName("script");

        for (var i = nodes.length - 1; i >= 0; i--) {
          var _node = nodes[i];

          if (_node.readyState === "interactive" && _node.src) {
            return {
              node: _node,
              src: _node.src
            };
          }
        }
      }

      var stack;

      try {
        var a = undefined;
        a.b.c();
      } catch (e) {
        stack = e.stack || e.sourceURL || e.stacktrace || '';

        if (!stack && window.opera) {
          stack = (String(e).match(/of linked script \S+/g) || []).join(" ");
        }
      }

      if (stack) {
        stack = stack.split(/[@ ]/g).pop();
        stack = stack[0] == "(" ? stack.slice(1, -1) : stack;
        var s = stack.replace(/(:\d+)?:\d+$/i, "");
        return {
          src: s
        };
      }
    }

    var rs;
    var parentDefine = currentDefineModuleQueue.peek();

    if (parentDefine) {
      rs = {
        src: parentDefine.src
      };
    } else {
      rs = _getCurrentScriptOrSrc();
    }

    if (!rs) {
      rs = {
        src: thePageUrl
      };
    }

    if (utils.isLoaderEnd() && rs.src == theLoaderUrl) {
      rs.src = thePageUrl;
      rs.node = null;
    }

    if (!rs.node && rs.src != thePageUrl) {
      var src = utils.removeQueryHash(rs.src);
      var nodes = document.getElementsByTagName("script");

      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];

        if (src == utils.removeQueryHash(node.src)) {
          rs.node = node;
          break;
        }
      }
    }

    if (rs.node) {
      rs.src = utils.getNodeAbsolutePath(rs.node);
    }

    if (isRemoveQueryHash) {
      rs.src = utils.removeQueryHash(rs.src);
    }

    return rs;
  }

  function __createNode() {
    var node = document.createElement('script');
    node.type = 'text/javascript';
    node.charset = 'utf-8';
    node.async = "async";
    return node;
  }

  function __removeListener(node, func, name, ieName) {
    if (node.detachEvent && !isOpera) {
      if (ieName) {
        node.detachEvent(ieName, func);
      }
    } else {
      node.removeEventListener(name, func, false);
    }
  }

  function __browserLoader(moduleName, url, callbackObj) {
    var node = __createNode();

    moduleName && node.setAttribute(DATA_ATTR_MODULE, moduleName);
    node.setAttribute(DATA_ATTR_CONTEXT, defContextName);
    var useAttach = !xsloader$a.isFunction(node.addEventListener) && node.attachEvent && !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) && !isOpera;

    if (useAttach) {
      node.attachEvent('onreadystatechange', callbackObj.onScriptLoad);
    } else {
      node.addEventListener('load', callbackObj.onScriptLoad, true);

      var errListen = function errListen() {
        __removeListener(node, errListen, 'error');

        callbackObj.onScriptError.apply(this, arguments);
      };

      callbackObj.errListen = errListen;
      node.addEventListener('error', errListen, true);
    }

    appendHeadDom(node);
    node.src = url;
  }

  function __getScriptData(evt, callbackObj) {
    var node = evt.currentTarget || evt.srcElement;

    __removeListener(node, callbackObj.onScriptLoad, 'load', 'onreadystatechange');

    __removeListener(node, callbackObj.errListen, 'error');

    return {
      node: node,
      name: node && node.getAttribute(DATA_ATTR_MODULE),
      src: utils.removeQueryHash(node && utils.getNodeAbsolutePath(node))
    };
  }

  function appendHeadDom(dom) {
    if (!xsloader$a.isDOM(dom)) {
      throw new Error("expected dom object,but provided:" + dom);
    }

    var nextDom = lastAppendHeadDom.nextSibling;
    head.insertBefore(dom, nextDom);
    lastAppendHeadDom = dom;
  }

  function loadScript(moduleName, url, onload, onerror) {
    var callbackObj = {};

    callbackObj.onScriptLoad = function (evt) {
      if (callbackObj.removed) {
        return;
      }

      if (evt.type === 'load' || readyRegExp.test((evt.currentTarget || evt.srcElement).readyState)) {
        callbackObj.removed = true;

        var scriptData = __getScriptData(evt, callbackObj);

        if (isSrcFromScriptLoad) {
          lastScriptSrc = scriptData.src;
          xsloader$a.asyncCall(function () {
            onload(scriptData);
          });
        } else {
          if (utils.IE_VERSION > 0 || utils.IE_VERSION == "edge") {
            xsloader$a.asyncCall(function () {
              onload(scriptData);
            });
          } else {
            onload(scriptData);
          }
        }
      }
    };

    callbackObj.onScriptError = function (evt) {
      if (callbackObj.removed) {
        return;
      }

      callbackObj.removed = true;

      var scriptData = __getScriptData(evt, callbackObj);

      onerror(scriptData);
    };

    __browserLoader(moduleName, url, callbackObj);
  }

  function doDefine(thiz, args, isRequire) {
    var rs = getCurrentScript();
    var src = rs.src;
    var defineObject = new DefineObject(src, thiz, args, isRequire);

    if (!isSrcFromScriptLoad) {
      try {
        if (defineObject.src) {
          var node = document.currentScript;

          if (node && node.getAttribute("src") && node.getAttribute(DATA_ATTR_CONTEXT) != defContextName && defineObject.src != theLoaderUrl && defineObject.src != thePageUrl) {
            console.error("unknown js script module:" + xsloader$a.xsJson2String(defineObject.src));
            console.error(node);
            return;
          }
        }
      } catch (e) {
        xsloader$a.config().error(e);
      }
    }

    var handle = new Handle(defineObject);
    var isLoaderEnd = utils.isLoaderEnd();
    xsloader$a.asyncCall(function () {
      if (isSrcFromScriptLoad && isLoaderEnd) {
        defineObject.src = lastScriptSrc;
      }

      theRealDefine([defineObject]);
    });
    return handle;
  }

  function predefine() {
    var args = [];

    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }

    return doDefine(this, args, false);
  }

  function prerequire(deps, callback) {
    if (!xsloader$a.config()) {
      throw new Error("not config");
    }

    if (arguments.length == 1 && xsloader$a.isString(deps)) {
      var originDeps = deps;
      var pluginArgs = undefined;
      var pluginIndex = deps.indexOf("!");

      if (pluginIndex > 0) {
        pluginArgs = deps.substring(pluginIndex + 1);
        deps = deps.substring(0, pluginIndex);

        if (pluginArgs) {
          var argArr = [pluginArgs];
          utils.replaceModulePrefix(xsloader$a.config(), argArr);
          pluginArgs = argArr[0];
        }
      }

      var module = moduleScript.getModule(deps);
      var thatInvoker = getInvoker(this, true);

      if (!module) {
        deps = thatInvoker.getUrl(deps, false);
        module = moduleScript.getModule(deps);
      }

      if (!module) {
        throw new Error("the module '" + originDeps + "' is not load!");
      } else if (module.state != "defined") {
        throw new Error("the module '" + originDeps + "' is not defined:" + module.state);
      }

      var theMod;
      moduleScript.newModuleInstance(module, thatInvoker, function (depModule) {
        theMod = depModule.moduleObject();
      }, pluginArgs).init(true);

      if (theMod === undefined) {
        throw Error("the module '" + originDeps + "' is not load!");
      }

      return theMod;
    }

    var selfname = xsloader$a.randId("_require");

    if (xsloader$a.isFunction(deps)) {
      callback = deps;
      deps = [];
    }

    utils.appendInnerDeps(deps, callback);
    var timeid;
    var handle = doDefine(this, [selfname, deps, function () {
      if (timeid !== undefined) {
        clearTimeout(timeid);
        timeid = undefined;
      }

      if (xsloader$a.isFunction(callback)) {
        callback.apply(this, arguments);
      }
    }], true);
    var customerErrCallback;
    var isErr;
    handle.error(function (err, invoker) {
      isErr = err;

      if (timeid !== undefined) {
        clearTimeout(timeid);
        timeid = undefined;
      }

      if (customerErrCallback) {
        customerErrCallback(err, invoker);
      } else {
        console.warn("invoker.url:" + invoker.getUrl());
        console.warn(err);
      }
    });

    handle.error = function (errCallback) {
      customerErrCallback = errCallback;
      return this;
    };

    var checkResultFun = function checkResultFun() {
      timeid = undefined;
      var ifmodule = moduleScript.getModule(selfname);
      console.log(isErr);

      if ((!ifmodule || ifmodule.state != 'defined') && !isErr) {
        var _module = ifmodule;

        if (_module) {
          utils.each(_module.deps, function (dep) {
            var mod = moduleScript.getModule(dep);

            if (mod && mod.printOnNotDefined) {
              mod.printOnNotDefined();
            }
          });
        }

        console.error("require timeout:[" + (deps ? deps.join(",") : "") + "]");
      }
    };

    timeid = setTimeout(checkResultFun, xsloader$a.config().waitSeconds * 1000);
    return handle;
  }

  var initDefine = function initDefine(theDefine) {
    theRealDefine = function theRealDefine(defines, loaded) {
      if (!xsloader$a.config()) {
        globalDefineQueue.push(defines);
      } else {
        theDefine(defines, loaded);
      }
    };

    return {
      predefine: predefine,
      prerequire: prerequire
    };
  };

  var onConfigedCallback = function onConfigedCallback() {
    while (globalDefineQueue.length) {
      var defines = globalDefineQueue.shift();
      theRealDefine(defines);
    }
  };

  var script = {
    defContextName: defContextName,
    theLoaderScript: theLoaderScript,
    theLoaderUrl: theLoaderUrl,
    thePageUrl: thePageUrl,
    appendHeadDom: appendHeadDom,
    initDefine: initDefine,
    Handle: Handle,
    Invoker: Invoker,
    DefineObject: DefineObject,
    loadScript: loadScript,
    currentDefineModuleQueue: currentDefineModuleQueue,
    onConfigedCallback: onConfigedCallback,
    INNER_DEPS_PLUGIN: INNER_DEPS_PLUGIN,
    innerDepsMap: innerDepsMap
  };

  var global$a = utils.global;
  var xsloader$b = global$a.xsloader;
  var theContext;
  var theConfig;
  var argsObject = {};

  xsloader$b.config = function () {
    return theConfig;
  };

  xsloader$b.script = function () {
    return script.theLoaderScript;
  };

  xsloader$b.scriptSrc = function () {
    return script.theLoaderUrl;
  };

  xsloader$b.putUrlArgs = function (argsObj) {
    argsObject = xsloader$b.extend(argsObject, argsObj);
  };

  xsloader$b.getUrlArgs = function () {
    var obj = xsloader$b.extend({}, argsObject);
    return obj;
  };

  xsloader$b.clearUrlArgs = function () {
    argsObject = {};
  };

  xsloader$b.appendHeadDom = script.appendHeadDom;

  xsloader$b.hasDefine = function (name) {
    var has = false;
    var module = moduleScript.getModule(name);

    if (!module || module.state == "init") ; else {
      has = true;
    }

    return has;
  };

  xsloader$b._resUrlBuilder = function (groupName) {
    throw new Error('resUrlBuilder not found!');
  };

  xsloader$b.clear_module_ = function () {
    var modules = arguments;

    for (var i = 0; i < modules.length; i++) {
      if (modules[i]) {
        delete modules[i]._module_;
        delete modules[i]._modules_;
      }
    }
  };

  function _newContext() {
    var context = {
      contextName: script.contextName,
      defQueue: []
    };
    return context;
  }

  loader.loaderFun(function (option) {
    if (theContext) {
      throw new Error("already configed!");
    }

    option = xsloader$b.extend({
      baseUrl: utils.getPathWithRelative(location.pathname, "./", xsloader$b.endsWith(location.pathname, "/")),
      urlArgs: {},
      ignoreProperties: false,
      paths: {},
      depsPaths: {},
      deps: {},
      jsExts: undefined,
      properties: {},
      modulePrefix: {},
      defineFunction: {},
      modulePrefixCount: 0,
      waitSeconds: 10,
      autoUrlArgs: function autoUrlArgs() {
        return false;
      },
      instance: "single",
      dealtDeps: {},
      dealProperties: function dealProperties(obj) {
        return utils.propertiesDeal(obj, option.properties);
      },
      isInUrls: function isInUrls(m) {
        return !!this.getUrls(m);
      },
      getUrls: function getUrls(m) {
        return this.paths[m] || this.depsPaths[m];
      },
      getDeps: function getDeps(m) {
        var as = this.dealtDeps[m] || [];
        var deps = [];
        var hasOrderDep = undefined;

        if (as.length > 0 && (as[0] === true || as[0] === false)) {
          if (as[0]) {
            deps = [[]];
            hasOrderDep = true;
          } else {
            as.splice(0, 1);
          }
        }

        for (var i = 0; i < as.length; i++) {
          if (hasOrderDep === true) {
            deps[0].push(as[i]);
          } else {
            deps.push(as[i]);
          }
        }

        return deps;
      },
      dealUrl: function dealUrl(module, url) {
        var urlArg;
        var nameOrUrl;

        if (this.autoUrlArgs()) {
          urlArg = "_t=" + new Date().getTime();
        } else if (xsloader$b.isString(module)) {
          urlArg = this.urlArgs[module];

          if (urlArg) {
            nameOrUrl = module;
          } else {
            nameOrUrl = module;
            urlArg = this.forPrefixSuffix(module);
          }

          if (!urlArg) {
            nameOrUrl = "*";
            urlArg = this.urlArgs["*"];
          }
        } else {
          urlArg = this.urlArgs[url];

          if (urlArg) {
            nameOrUrl = url;
          } else {
            urlArg = this.forPrefixSuffix(url);
          }

          if (!urlArg) {
            nameOrUrl = module.selfname;
            urlArg = this.urlArgs[nameOrUrl];
          }

          if (!urlArg) {
            nameOrUrl = module.aurl;
            urlArg = this.forPrefixSuffix(nameOrUrl);
          }

          if (!urlArg) {
            nameOrUrl = "*";
            urlArg = this.urlArgs["*"];
          }
        }

        if (xsloader$b.isFunction(urlArg)) {
          urlArg = urlArg.call(this, nameOrUrl);
        }

        for (var k in argsObject) {
          urlArg += "&" + k + "=" + encodeURIComponent(argsObject[k]);
        }

        return xsloader$b.appendArgs2Url(url, urlArg);
      },
      dealUrlArgs: function dealUrlArgs(url) {
        url = utils.getPathWithRelative(location.href, url);
        return this.dealUrl(url, url);
      },
      defaultVersion: {}
    }, option);

    if (!xsloader$b.endsWith(option.baseUrl, "/")) {
      option.baseUrl += "/";
    }

    option.baseUrl = utils.getPathWithRelative(location.href, option.baseUrl);

    if (!option.ignoreProperties) {
      option = option.dealProperties(option);
    }

    utils.strValue2Arr(option.paths);
    utils.strValue2Arr(option.depsPaths);
    utils.strValue2Arr(option.deps);

    if (!xsloader$b.isFunction(option.autoUrlArgs)) {
      var isAutoUrlArgs = option.autoUrlArgs;

      option.autoUrlArgs = function () {
        return isAutoUrlArgs;
      };
    }

    var modulePrefixCount = 0;

    for (var prefix in option.modulePrefix) {
      if (xsloader$b.startsWith(prefix, ".") || xsloader$b.startsWith(prefix, "/")) {
        throw new Error("modulePrefix can not start with '.' or '/'(" + prefix + ")");
      }

      modulePrefixCount++;
    }

    option.modulePrefixCount = modulePrefixCount;

    if (modulePrefixCount > 0) {
      var star = option.urlArgs["*"];
      delete option.urlArgs["*"];
      var urlArgsArr = [];

      for (var k in option.urlArgs) {
        var url = k;

        if (utils.isJsFile(url)) {
          if (xsloader$b.startsWith(url, ".") || xsloader$b.startsWith(url, "/") && !xsloader$b.startsWith(url, "//")) {
            url = utils.getPathWithRelative(script.theLoaderUrl, url);
          } else {
            var absolute = utils.dealPathMayAbsolute(url);

            if (absolute.absolute) {
              url = absolute.path;
            } else if (!xsloader$b.startsWith(url, "*]")) {
              url = option.baseUrl + url;
            }
          }
        }

        urlArgsArr.push({
          url: url,
          args: option.urlArgs[k]
        });
      }

      for (var _prefix in option.modulePrefix) {
        var replaceStr = option.modulePrefix[_prefix].replace;

        for (var i = 0; i < urlArgsArr.length; i++) {
          var urlArgObj = urlArgsArr[i];
          var starP = "";

          if (xsloader$b.startsWith(urlArgObj.url, "*[")) {
            starP = "*[";
            urlArgObj.url = urlArgObj.url.substring(2);
          }

          if (xsloader$b.startsWith(urlArgObj.url, _prefix)) {
            urlArgObj.url = replaceStr + urlArgObj.url.substring(_prefix.length);
          }

          starP && (urlArgObj.url = starP + urlArgObj.url);
        }
      }

      option.urlArgs = {};
      option.urlArgs["*"] = star;

      for (var _i = 0; _i < urlArgsArr.length; _i++) {
        var _urlArgObj = urlArgsArr[_i];
        option.urlArgs[_urlArgObj.url] = _urlArgObj.args;
      }
    }

    var _urlArgs_prefix = [];
    var _urlArgs_suffix = [];
    option._urlArgs_prefix = _urlArgs_prefix;
    option._urlArgs_suffix = _urlArgs_suffix;

    for (var _k in option.urlArgs) {
      var _url = _k;

      if (xsloader$b.startsWith(_url, "*[")) {
        var strfix = _url.substring(2);

        if (xsloader$b.startsWith(strfix, ".") || xsloader$b.startsWith(strfix, "/") && !xsloader$b.startsWith(strfix, "//")) {
          strfix = utils.getPathWithRelative(script.theLoaderUrl, strfix);
        } else {
          var _absolute = utils.dealPathMayAbsolute(strfix);

          if (_absolute.absolute) {
            strfix = _absolute.path;
          } else {
            _url = option.baseUrl + _url;
          }
        }

        _urlArgs_prefix.push({
          strfix: strfix,
          value: option.urlArgs[_k]
        });

        delete option.urlArgs[_k];
      } else if (xsloader$b.startsWith(_url, "*]")) {
        _urlArgs_suffix.push({
          strfix: _url.substring(2),
          value: option.urlArgs[_k]
        });

        delete option.urlArgs[_k];
      }
    }

    option.forPrefixSuffix = function (urlOrName) {
      for (var _i2 = 0; _i2 < _urlArgs_prefix.length; _i2++) {
        var strfixObj = _urlArgs_prefix[_i2];

        if (xsloader$b.startsWith(urlOrName, strfixObj.strfix)) {
          var value = void 0;

          if (xsloader$b.isFunction(strfixObj.value)) {
            value = strfixObj.value.call(this, urlOrName);
          } else {
            value = strfixObj.value;
          }

          return value;
        }
      }

      for (var _i3 = 0; _i3 < _urlArgs_suffix.length; _i3++) {
        var _strfixObj = _urlArgs_suffix[_i3];

        if (xsloader$b.endsWith(urlOrName, _strfixObj.strfix)) {
          var _value = void 0;

          if (xsloader$b.isFunction(_strfixObj.value)) {
            _value = _strfixObj.value.call(this, urlOrName);
          } else {
            _value = _strfixObj.value;
          }

          return _value;
        }
      }
    };

    for (var name in option.paths) {
      utils.replaceModulePrefix(option, option.paths[name]);
    }

    for (var _name in option.depsPaths) {
      utils.replaceModulePrefix(option, option.depsPaths[_name]);
    }

    var dealtDeps = option.dealtDeps;

    var pushDeps = function pushDeps(dealtDepArray, depsArray) {
      utils.each(depsArray, function (dep) {
        dealtDepArray.push(dep);
      });
    };

    var _loop = function _loop(keyName) {
      var paths = keyName.split('::');
      var depsArray = option.deps[keyName];
      utils.each(paths, function (path) {
        if (path == '*') {
          for (var m in option.depsPaths) {
            var dealtDepArray = dealtDeps[m] = dealtDeps[m] || [];
            pushDeps(dealtDepArray, depsArray);
          }
        } else {
          var _dealtDepArray = dealtDeps[path] = dealtDeps[path] || [];

          pushDeps(_dealtDepArray, depsArray);
        }
      });
    };

    for (var keyName in option.deps) {
      _loop(keyName);
    }

    theConfig = option;
    theContext = _newContext();
    script.onConfigedCallback();
    return theConfig;
  });

  var global$b = utils.global;
  var xsloader$c = global$b.xsloader;
  var defineHandle = script.initDefine(function theRealDefine(defines) {
    var loaded = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};
    utils.each(defines, function (defineObject) {
      if (xsloader$c.isFunction(defineObject.callback)) {
        var originCallback = defineObject.callback;

        defineObject.callback = function () {
          var config = xsloader$c.config();
          var rt;
          var defineFun;
          utils.each(defineObject.names, function (name) {
            var fun = config.defineFunction[name];

            if (xsloader$c.isFunction(fun)) {
              defineFun = fun;
              return false;
            }
          });

          if (defineFun) {
            var args = [];

            for (var i = 0; i < arguments.length; i++) {
              args.push(arguments[i]);
            }

            rt = defineFun.apply(this, [originCallback, this, args]);
          } else {
            rt = originCallback.apply(this, arguments);
          }

          originCallback = null;
          return rt;
        };

        defineObject.callback.originCallback = originCallback;
      }

      onModuleLoaded(defineObject, moduleScript.getLastDefineObject(defineObject.src));
      loaded();
    });
  });

  function onModuleLoaded(defineObject, lastDefineObject) {
    moduleScript.appendLoadingModuleDeps(defineObject);
    var ifmodule = moduleScript.getModule(defineObject.src, defineObject.selfname);

    if (ifmodule) {
      if (ifmodule.state == "loading") {
        ifmodule.reinitByDefineObject(defineObject);
      }
    } else {
      ifmodule = moduleScript.newModule(defineObject);
    }

    if (defineObject.selfname != defineObject.src) {
      defineObject.pushName(defineObject.selfname);
    }

    if (ifmodule.selfname != defineObject.src) {
      defineObject.pushName(ifmodule.selfname);
    }

    utils.each(defineObject.names, function (name) {
      moduleScript.setModule(name, ifmodule);

      if (xsloader$c._ignoreAspect_[name]) {
        ifmodule.ignoreAspect = true;
      }
    });
    defineObject.appendConfigDepsAndEmbedDeps(ifmodule);
    var module = ifmodule;

    if (defineObject.handle.before) {
      defineObject.handle.before(module.deps);
    }

    if (lastDefineObject && lastDefineObject.handle.depBefore) {
      lastDefineObject.handle.depBefore(lastDefineObject.index, module.selfname, module.deps, 2);
    }

    module.setState("loaded");
    module.setInstanceType(defineObject.handle.instance || xsloader$c.config().instance);

    if (module.deps.length == 0) {
      module.finish([]);
    } else {
      var needCallback = function needCallback() {
        moduleScript.everyRequired(defineObject, module, function (depModules) {
          var args = [];
          var depModuleArgs = [];
          utils.each(depModules, function (depModule) {
            depModuleArgs.push(depModule);
            args.push(depModule && depModule.moduleObject());
          });
          args.push(depModuleArgs);
          module.finish(args);
        }, function (err, invoker) {
          defineObject.handle.onError(err, invoker);
        });
      };

      if (defineObject.isRequire) {
        needCallback();
      } else {
        module.whenNeed(needCallback);
      }
    }
  }

  var define = function define() {
    return defineHandle.predefine.apply(this, arguments);
  };

  var require = function require() {
    return defineHandle.prerequire.apply(this, arguments);
  };

  require.has = function () {
    var args = arguments;

    if (args.length == 0) {
      return false;
    }

    for (var i = 0; i < args.length; i++) {
      var module = moduleScript.getModule(args[i]);

      if (!module || module.state != "defined") {
        return false;
      }
    }

    return true;
  };

  xsloader$c.define = define;
  xsloader$c.defineAsync = define;
  xsloader$c.require = require;
  global$b.define = define;
  global$b.require = require;
  define.amd = true;
  define("exports", function () {});

  var global$c = utils.global;
  var xsloader$d = global$c.xsloader;
  xsloader$d.define(script.INNER_DEPS_PLUGIN, {
    pluginMain: function pluginMain(depId, onload, onerror, config) {
      var depsObj = script.innerDepsMap[depId];
      var deps = depsObj.deps;

      this.invoker().require(deps, function () {
        var args = [];

        for (var k = 0; k < arguments.length; k++) {
          args.push(arguments[k]);
        }

        onload(args);
      }).then({
        orderDep: depsObj.orderDep,
        error: function error(err, invoker) {
          onerror(new utils.PluginError(err, invoker));
        }
      });
    },
    getCacheKey: function getCacheKey(depId) {
      return depId;
    }
  });

  var global$d = utils.global;
  var xsloader$e = global$d.xsloader;
  xsloader$e.define("ready", {
    pluginMain: function pluginMain(depId, onload, onerror, config) {
      xsloader$e.onReady(function () {
        onload();
      });
    }
  });

  var global$e = utils.global;
  var xsloader$f = global$e.xsloader;
  xsloader$f.define("nodeps", {
    isSingle: true,
    pluginMain: function pluginMain(arg, onload, onerror, config) {
      this.invoker().require([arg], function (mod, depModuleArgs) {
        onload(mod);
      }).then({
        depBefore: function depBefore(index, dep, depDeps) {
          depDeps.splice(0, depDeps.length);
        }
      }).error(function (e) {
        onerror(e);
      });
    }
  });

  var global$f = utils.global;
  var xsloader$g = global$f.xsloader;
  xsloader$g.define("exists", {
    isSingle: true,
    pluginMain: function pluginMain(arg, onload, onerror, config) {
      var vars = arg.split("|");

      for (var i = 0; i < vars.length; i++) {
        vars[i] = vars[i].trim();
      }

      if (vars.length == 0) {
        onerror("args error for exists!");
      } else {
        var moduleName = vars[0];
        var module = moduleScript.getModule(moduleName);

        if (module) {
          this.invoker().require([moduleName], function (mod, depModuleArgs) {
            onload(mod);
          }).error(function (e) {
            onerror(e);
          });
        } else {
          var obj = undefined;

          for (var _i = 1; _i < vars.length; _i++) {
            if (window[vars[_i]]) {
              obj = window[vars[_i]];
              break;
            }
          }

          if (obj === undefined) {
            onerror("not found:" + arg);
          } else {
            onload(obj);
          }
        }
      }
    }
  });

  var global$g = utils.global;
  var xsloader$h = global$g.xsloader;
  xsloader$h.define("name", {
    isSingle: true,
    pluginMain: function pluginMain(arg, onload, onerror, config) {
      var index = arg.indexOf("=>>");

      if (index == -1) {
        onerror("expected:=>>");
        return;
      }

      var moduleName = arg.substring(0, index);
      moduleName = moduleName.replace(/，/g, ',');
      var names = moduleName.split(",");
      var dep = arg.substring(index + 3);

      this.invoker().require([dep], function (mod, depModuleArgs) {
        var existsMods = [];

        for (var i = 0; i < names.length; i++) {
          var newName = names[i];
          var lastM = moduleScript.getModule(newName);

          if (lastM && lastM.state != "init") {
            existsMods.push(newName);
            continue;
          }

          var module = depModuleArgs[0].module;

          if (lastM) {
            lastM.toOtherModule(module);
          } else {
            moduleScript.setModule(newName, module);
          }
        }

        if (existsMods.length) {
          console.warn("already exists:", existsMods.join(','));
        }

        onload(mod);
      }).error(function (e) {
        onerror(e);
      });
    }
  });

  var global$h = utils.global;
  var xsloader$i = global$h.xsloader;
  xsloader$i.define("css", function () {
    if (typeof window == 'undefined') return {
      load: function load(n, r, _load) {
        _load();
      }
    };
    var engine = window.navigator.userAgent.match(/Trident\/([^ ;]*)|AppleWebKit\/([^ ;]*)|Opera\/([^ ;]*)|rv\:([^ ;]*)(.*?)Gecko\/([^ ;]*)|MSIE\s([^ ;]*)|AndroidWebKit\/([^ ;]*)/) || 0;
    var useImportLoad = false;
    var useOnload = true;
    if (engine[1] || engine[7]) useImportLoad = parseInt(engine[1]) < 6 || parseInt(engine[7]) <= 9;else if (engine[2] || engine[8] || 'WebkitAppearance' in document.documentElement.style) useOnload = false;else if (engine[4]) useImportLoad = parseInt(engine[4]) < 18;
    var cssAPI = {};
    var curStyle, curSheet;

    var createStyle = function createStyle() {
      curStyle = document.createElement('style');
      xsloader$i.appendHeadDom(curStyle);
      curSheet = curStyle.styleSheet || curStyle.sheet;
    };

    var ieCnt = 0;
    var ieLoads = [];
    var ieCurCallback;

    var createIeLoad = function createIeLoad(url) {
      curSheet.addImport(url);

      curStyle.onload = function () {
        processIeLoad();
      };

      ieCnt++;

      if (ieCnt == 31) {
        createStyle();
        ieCnt = 0;
      }
    };

    var processIeLoad = function processIeLoad() {
      ieCurCallback();
      var nextLoad = ieLoads.shift();

      if (!nextLoad) {
        ieCurCallback = null;
        return;
      }

      ieCurCallback = nextLoad[1];
      createIeLoad(nextLoad[0]);
    };

    var importLoad = function importLoad(url, callback) {
      callback = callback || function () {};

      if (!curSheet || !curSheet.addImport) createStyle();

      if (curSheet && curSheet.addImport) {
        if (ieCurCallback) {
          ieLoads.push([url, callback]);
        } else {
          createIeLoad(url);
          ieCurCallback = callback;
        }
      } else {
        curStyle.textContent = '@import "' + url + '";';
        var loadInterval = setInterval(function () {
          try {
            curStyle.sheet.cssRules;
            clearInterval(loadInterval);
            callback();
          } catch (e) {
            console.warn(e);
          }
        }, 10);
      }
    };

    var linkLoad = function linkLoad(url, callback) {
      callback = callback || function () {};

      var link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      if (useOnload) link.onload = function () {
        link.onload = function () {};

        setTimeout(callback, 7);
      };else {
        var loadInterval = setInterval(function () {
          for (var i = 0; i < document.styleSheets.length; i++) {
            var sheet = document.styleSheets[i];

            if (sheet.href == link.href) {
              clearInterval(loadInterval);
              return callback();
            }
          }
        }, 10);
      }
      link.href = url;
      xsloader$i.appendHeadDom(link);
    };

    cssAPI.pluginMain = function (cssId, onload, onerror, config) {
      (useImportLoad ? importLoad : linkLoad)(this.invoker().getUrl(cssId, true), onload);
    };

    cssAPI.getCacheKey = function (cssId) {
      var invoker = this.invoker();
      return invoker ? invoker.getUrl(cssId, true) : cssId;
    };

    cssAPI.loadCss = function (cssPath, callback) {
      (useImportLoad ? importLoad : linkLoad)(xsloader$i.getUrl(cssPath), callback);
    };

    cssAPI.loadCsses = function () {
      var args = arguments;

      for (var i = 0; i < args.length; i++) {
        (useImportLoad ? importLoad : linkLoad)(xsloader$i.getUrl(args[i]), null);
      }
    };

    return cssAPI;
  });

  var global$i = utils.global;
  var xsloader$j = global$i.xsloader;
  xsloader$j.define("text", ["xshttp"], {
    isSingle: true,
    pluginMain: function pluginMain(name, onload, onerror, config, http) {
      var url = this.invoker().getUrl(name, true);
      http().url(url).handleAs("text").ok(function (text) {
        onload(text);
      }).fail(function (err) {
        onerror(err);
      }).done();
    }
  });

  var global$j = utils.global;
  var xsloader$k = global$j.xsloader;
  xsloader$k.define("window", {
    isSingle: true,
    pluginMain: function pluginMain(arg, onload, onerror, config, http) {
      var index = arg.indexOf("=>>");

      if (index == -1) {
        onerror("expected:=>>");
        return;
      }

      var moduleName = arg.substring(0, index);
      var dep = arg.substring(index + 3);

      this.invoker().require([dep], function (mod, depModuleArgs) {
        window[moduleName] = mod;
        onload(mod);
      });
    }
  });

  var global$k = utils.global;
  var xsloader$l = global$k.xsloader;
  xsloader$l.define("withdeps", {
    pluginMain: function pluginMain(arg, onload, onerror, config) {
      var index = arg.indexOf("=>>");

      if (index == -1) {
        onerror("expected:=>>");
        return;
      }

      var moduleName = arg.substring(0, index);
      var depsStr = arg.substring(index + 3);
      var deps;

      try {
        deps = xsloader$l.xsParseJson(depsStr);

        if (!xsloader$l.isArray(deps)) {
          onerror("deps is not Array:" + depsStr);
          return;
        }
      } catch (e) {
        onerror("deps error:" + depsStr);
        return;
      }

      this.invoker().require([[false].concat(deps), moduleName], function (_deps, mod, depModuleArgs) {
        onload(mod);
      }).then({
        orderDep: true
      });
    }
  });

  var global$l = utils.global;
  var xsloader$m = global$l.xsloader;
  xsloader$m.define("json", ["xshttp"], {
    isSingle: true,
    pluginMain: function pluginMain(name, onload, onerror, config, http) {
      var url = this.invoker().getUrl(name, true);
      http().url(url).handleAs("json").ok(function (json) {
        onload(json);
      }).fail(function (err) {
        onerror(err);
      }).done();
    }
  });

  var global$m = utils.global;
  var xsloader$n = global$m.xsloader;
  var progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'];

  function httpRequest(option) {
    if (!option) {
      option = {};
    }

    function prop(obj, varName, defaultVal) {
      if (obj[varName] === undefined) {
        return defaultVal;
      } else {
        return obj[varName];
      }
    }

    function putProp(obj, varName, toObj) {
      if (obj[varName]) {
        for (var x in obj[varName]) {
          var value = obj[varName][x];

          if (value === null || value === undefined) {
            continue;
          }

          toObj[x] = value;
        }
      }
    }

    var _url = prop(option, "url", ""),
        _method = prop(option, "method", "GET"),
        _params = {},
        _headers = {
      "X-Requested-With": "XMLHttpRequest"
    },
        _async = prop(option, "async", true),
        _multiPart = prop(option, "multiPart", false),
        _handleType = prop(option, "handleType", "json");

    var _timeout = option.timeout;
    putProp(option, "params", _params);
    putProp(option, "headers", _headers);
    var okCallback = option.ok;
    var failCallback = option.fail;
    var uploadStartCallback = option.uploadStart;
    var uploadProgressCallback = option.uploadProgress;
    var uploadOkCallback = option.uploadOk;
    var uploadErrorCallback = option.uploadError;
    var uploadEndCallback = option.uploadEnd;

    var _beforeOpenHook2 = option._beforeOpenHook || httpRequest._beforeOpenHook;

    var _onOkResponseHook2 = option._onOkResponseHook || httpRequest._onOkResponseHook;

    var _onFailResponseHook2 = option._onFailResponseHook || httpRequest._onFailResponseHook;

    function createXhr() {
      var xhr, i, progId;

      if (typeof XMLHttpRequest !== "undefined") {
        return new XMLHttpRequest();
      } else if (typeof ActiveXObject !== "undefined") {
        for (i = 0; i < 3; i += 1) {
          progId = progIds[i];

          try {
            xhr = new ActiveXObject(progId);
          } catch (e) {
            console.warn(e);
          }

          if (xhr) {
            progIds = [progId];
            break;
          }
        }
      }

      return xhr;
    }

    function conn() {
      _conn(createXhr());
    }

    function _conn(xhr) {
      var option = {
        url: _url,
        method: _method.toUpperCase(),
        params: _params,
        headers: _headers,
        handleType: _handleType,
        async: _async,
        multiPart: _multiPart,
        timeout: _timeout
      };

      _beforeOpenHook2(option, function () {
        _connAfterOpenHook(option, xhr);
      }, xhr);
    }

    function _doOnFailResponseHook(option, xhr, err, extraErr) {
      _onFailResponseHook2(option, function (result) {
        if (result !== false && result !== undefined) {
          if (typeof okCallback == "function") {
            okCallback(result, xhr);
          }

          return;
        } else if (typeof failCallback == "function") {
          failCallback(err);
        } else {
          console.error(err);
        }
      }, xhr, extraErr);
    }

    function _connAfterOpenHook(option, xhr) {
      var body;

      if (option.multiPart) {
        var formData = new FormData();

        for (var x in option.params) {
          var value = option.params[x];

          if (xsloader$n.isArray(value)) {
            formData.append(x, xsloader$n.xsJson2String(value));
          } else {
            formData.append(x, value);
          }
        }

        body = formData;
      } else {
        body = "";

        for (var _x in option.params) {
          var _value = option.params[_x];

          if (_value === null || _value === undefined) {
            continue;
          }

          if (_typeof(_value) == "object") {
            _value = xsloader$n.xsJson2String(_value);
          }

          body += "&" + encodeURIComponent(_x) + "=" + encodeURIComponent(_value);
        }

        if (!(option.method == "POST" || option.method == "PUT")) {
          if (option.url.lastIndexOf("?") < 0 && body.length > 0) {
            option.url += "?";
          }

          option.url += body;
          option.url = option.url.replace("?&", "?");
          body = null;
        }
      }

      xhr.open(option.method, option.url, option.async);

      if ((option.method == "POST" || option.method == "PUT") && !option.multiPart && !option.headers.hasOwnProperty("Content-Type")) {
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');
      }

      for (var header in option.headers) {
        xhr.setRequestHeader(header, option.headers[header]);
      }

      if (typeof uploadStartCallback == "function") {
        xhr.upload.onloadstart = uploadStartCallback;
      }

      if (typeof uploadProgressCallback == "function") {
        xhr.upload.onprogress = uploadProgressCallback;
      }

      if (typeof uploadOkCallback == "function") {
        xhr.upload.onload = uploadOkCallback;
      }

      if (typeof uploadErrorCallback == "function") {
        xhr.upload.onerror = uploadErrorCallback;
      }

      if (typeof uploadEndCallback == "function") {
        xhr.upload.onloadend = uploadEndCallback;
      }

      var timeoutTimer;
      var isTimeout = false;

      if (option.timeout) {
        timeoutTimer = setTimeout(function () {
          isTimeout = true;
          xhr.abort();
          clearTimeout(timeoutTimer);
        }, option.timeout);
      }

      xhr.onreadystatechange = function (evt) {
        var status;

        if (xhr.readyState === 4) {
          status = xhr.status || 0;

          if (status > 399 && status < 600 || !status) {
            var _err = new Error(option.url + ' HTTP status: ' + status);

            _err.xhr = xhr;

            _doOnFailResponseHook(option, xhr, _err);
          } else {
            var result;

            if (option.handleType === "json") {
              try {
                result = xsloader$n.xsParseJson(xhr.responseText);
              } catch (e) {
                _doOnFailResponseHook(option, xhr, new Error("parse-json-error:" + e), "parse-json-error");

                return;
              }
            } else if (option.handleType === "text") {
              result = xhr.responseText;
            }

            _onOkResponseHook2(result, option, function (result) {
              if (typeof okCallback == "function") {
                okCallback(result, xhr);
              }
            }, xhr);
          }
        } else {
          if (timeoutTimer && isTimeout) {
            var _err2 = new Error(option.url + ' timeout status: ' + status);

            _err2.xhr = xhr;

            _doOnFailResponseHook(option, xhr, _err2);
          }
        }
      };

      xhr.send(body);
    }

    var requestObj = {
      multiPart: function multiPart(_multiPart2) {
        _multiPart = _multiPart2;
        return this;
      },
      uploadStart: function uploadStart(_uploadStart) {
        uploadStartCallback = _uploadStart;
        return this;
      },
      uploadProgress: function uploadProgress(_uploadProgress) {
        uploadProgressCallback = _uploadProgress;
        return this;
      },
      uploadOk: function uploadOk(callback) {
        uploadOkCallback = callback;
        return this;
      },
      uploadError: function uploadError(callback) {
        uploadErrorCallback = callback;
        return this;
      },
      uploadEnd: function uploadEnd(_uploadEnd) {
        uploadEndCallback = _uploadEnd;
        return this;
      },
      url: function url(urlStr) {
        _url = urlStr;
        return this;
      },
      method: function method(methodStr) {
        _method = methodStr;
        return this;
      },
      timeout: function timeout(_timeout2) {
        _timeout = _timeout2;
        return this;
      },
      async: function async(isAsync) {
        _async = isAsync;
        return this;
      },
      params: function params(paramsObj) {
        if (paramsObj) {
          for (var x in paramsObj) {
            var value = paramsObj[x];

            if (value === null || value === undefined) {
              continue;
            }

            _params[x] = value;
          }
        }

        return this;
      },
      headers: function headers(headersObj) {
        if (headersObj) {
          for (var x in headersObj) {
            _headers[x] = headersObj[x];
          }
        }

        return this;
      },
      handleType: function handleType(_handleType) {
        return this.handleAs(_handleType);
      },
      handleAs: function handleAs(handleType) {
        if (handleType !== "json" && handleType !== "text") {
          throw "unknown handleType:" + handleType;
        }

        _handleType = handleType;
        return this;
      },
      ok: function ok(callback) {
        okCallback = callback;
        return this;
      },
      fail: function fail(callback) {
        failCallback = callback;
        return this;
      },
      _beforeOpenHook: function _beforeOpenHook(callback) {
        _beforeOpenHook2 = callback;
        return this;
      },
      _onOkResponseHook: function _onOkResponseHook(callback) {
        _onOkResponseHook2 = callback;
        return this;
      },
      _onFailResponseHook: function _onFailResponseHook(callback) {
        _onFailResponseHook2 = callback;
        return this;
      },
      done: function done() {
        try {
          conn();
        } catch (e) {
          if (typeof failCallback == "function") {
            failCallback(e);
          } else {
            console.error(e);
          }
        }
      }
    };
    return requestObj;
  }

  httpRequest._beforeOpenHook = function (option, callback, xhr) {
    callback();
  };

  httpRequest._onOkResponseHook = function (result, option, callback, xhr) {
    callback(result);
  };

  httpRequest._onFailResponseHook = function (option, callback, xhr, extraErrorType) {
    callback(undefined);
  };

  window._xshttp_request_ = httpRequest;
  xsloader$n.define("xshttp", [], function () {
    return httpRequest;
  });

  var global$n = utils.global;
  var xsloader$o = global$n.xsloader;
  xsloader$o.define("xsrequest", ["xshttp"], function (http) {
    var xsRequest = function xsRequest(option) {
      option = xsloader$o.extend({
        params: undefined,
        headers: undefined,
        method: undefined,
        url: undefined,
        callback: undefined
      }, option);
      var isResponsed = false;
      var callbacksQueue = [function (rs) {
        return rs;
      }];

      if (option.callback) {
        callbacksQueue.push(option.callback);
      }

      callbacksQueue.callback = function (rs) {
        isResponsed = true;

        for (var i = 0; i < this.length; i++) {
          var callback = this[i];
          rs = callback(rs);

          if (rs === false) {
            return;
          }
        }
      };

      option.ok = function (rs) {
        callbacksQueue.callback(rs);
      };

      option.fail = function (err) {
        callbacksQueue.callback({
          code: -1,
          desc: err
        });
      };

      option.async = true;

      function newHandle() {
        var handle = {
          then: function then(callback) {
            if (isResponsed) {
              throw new Error("already responsed!");
            }

            callbacksQueue.push(callback);
            return newHandle();
          }
        };
        return handle;
      }

      http(option).done();
      return newHandle();
    };

    return xsRequest;
  });

  var global$o = utils.global;
  var xsloader$p = global$o.xsloader;

  try {
    var isDebug = function isDebug(type) {
      return isXsMsgDebug;
    };

    var LinkedList = function LinkedList() {
      function newNode(element) {
        var node = {
          element: element,
          next: null,
          pre: null
        };
        return node;
      }

      var length = 0;
      var headNode = newNode(),
          lastNode = headNode;

      this.append = function (element) {
        var current = newNode(element);
        lastNode.next = current;
        current.pre = lastNode;
        lastNode = current;
        length++;
      };

      this.insert = function (position, element) {
        if (position >= 0 && position <= length) {
          var node = newNode(element);
          var pNode = headNode;

          while (position--) {
            pNode = pNode.next;
          }

          if (pNode.next) {
            pNode.next.pre = node;
            node.next = pNode.next;
          }

          pNode.next = node;
          node.pre = pNode;
          length++;
          return true;
        } else {
          return false;
        }
      };

      this.elementAt = function (position) {
        return getElement(position);
      };

      function getElement(position, willRemove) {
        if (position >= 0 && position < length) {
          var pNode = headNode;

          while (position--) {
            pNode = pNode.next;
          }

          if (pNode.next) {
            var currentNode = pNode.next;

            if (willRemove) {
              var nextCurrentNode = currentNode.next;

              if (nextCurrentNode) {
                nextCurrentNode.pre = pNode;
                pNode.next = nextCurrentNode;
              } else {
                pNode.next = null;
                lastNode = pNode;
              }

              length--;
            }

            return currentNode.element;
          } else {
            return undefined;
          }
        } else {
          return undefined;
        }
      }

      this.eachForRemove = function (callback) {
        var pNode = headNode.next;

        while (pNode) {
          var currentNode = pNode;

          if (callback(currentNode)) {
            var nextCurrentNode = currentNode.next;

            if (nextCurrentNode) {
              nextCurrentNode.pre = pNode;
              pNode.next = nextCurrentNode;
            } else {
              pNode.next = null;
              lastNode = pNode;
            }

            length--;
            pNode = nextCurrentNode;
          } else {
            pNode = pNode.next;
          }
        }
      };

      this.removeAt = function (position) {
        return getElement(position, true);
      };

      this.pop = function (callback) {
        return this.removeAt(0);
      };

      this.indexOf = function (element) {
        var pNode = headNode.next;
        var index = 0;

        while (pNode) {
          if (typeof element == "function") {
            if (element(pNode.element)) {
              return index;
            }
          } else if (pNode.element === element) {
            return index;
          }

          index++;
          pNode = pNode.next;
        }

        return -1;
      };

      this.find = function (element) {
        var index = this.indexOf(element);
        return index >= 0 ? this.elementAt(index) : undefined;
      };

      this.remove = function (element) {
        var index = this.indexOf(element);
        return this.removeAt(index);
      };

      this.isEmpty = function () {
        return length === 0;
      };

      this.size = function () {
        return length;
      };
    };

    var isXsMsgDebug = false;
    var api = {};

    api.linkedList = function () {
      return new LinkedList();
    };

    if (window.addEventListener) {
      var CommunicationUnit = function CommunicationUnit(cmd, source, connectingSource, onfailed, isActive, conndata) {
        var msgQueue = new LinkedList();
        var MAX_TRY = 100,
            SLEEP = 500;
        var isConnected = false,
            connectCount = 0;
        var isCanceled = false;
        var thiz = this;
        var handleId;
        this.onConnectedListener = null;
        this.onReceiveListener = null;

        this.send = function (data) {
          var msg = {
            id: xsloader$p.randId(),
            data: data
          };
          msgQueue.append(msg);
          sendTop();
        };

        this.send.release = function () {
          postMessageBridge.remove(handleId);
        };

        function _onConned(_source, data) {
          thiz.onConnectedListener.call(thiz, data);
          isConnected = true;
          sendTop();
        }

        function _onMsg(data, msgid) {
          try {
            thiz.onReceiveListener.call(thiz, data);
          } catch (e) {
            console.warn(e);
          }

          postMessageBridge.sendResponse({
            id: msgid
          }, handleId);
        }

        function _onResponse(data) {
          msgQueue.remove(function (elem) {
            return elem.id = data.id;
          });
          sendTop();
        }

        function _onElse(type) {
          if (type == "binded") {
            isCanceled = true;
            console.error("connect failed,that page already binded:" + cmd + ",my page:" + location.href);
            onfailed("canceled");
          }
        }

        function initListen() {
          handleId = postMessageBridge.listen(cmd, conndata, connectingSource, source, isActive, _onConned, _onMsg, _onResponse, _onElse);
        }

        function sendTop() {
          if (isConnected) {
            var msg;

            while (msg = msgQueue.pop()) {
              postMessageBridge.send(msg.data, handleId, msg.id);
            }
          }
        }

        function init() {
          if (isConnected || connectCount > MAX_TRY || isCanceled) {
            if (!isConnected && !isCanceled) {
              onfailed("timeout");
            }

            return;
          }

          postMessageBridge.sendConn(handleId);
          connectCount++;
          postMessageBridge.runAfter(SLEEP, init);
        }

        if (source) {
          initListen();
          init();
        } else if (!isActive) {
          initListen();
        }

        this.setSource = function (_source) {
          source = _source;

          if (source) {
            initListen();
            init();
          }
        };
      };

      var _connectWindow = function _connectWindow(winObjOrCallback, option, notActive) {
        option = xsloader$p.extendDeep({
          cmd: "default-cmd",
          listener: null,
          connected: null,
          conndata: null,
          connectingSource: function connectingSource(source, origin, conndata, callback) {
            var mine = location.protocol + "//" + location.host;
            callback(mine == origin, "default");
          },
          onfailed: function onfailed(errtype) {
            if (errtype == "timeout") {
              console.warn("connect may timeout:cmd=" + option.cmd + ",my page=" + location.href);
            }
          }
        }, option);
        var cmd = option.cmd;
        var connectedCallback = option.connected;
        var receiveCallback = option.listener;
        var conndata = option.conndata;
        var onfailed = option.onfailed;
        var isActive = !notActive;
        var connectingSource = option.connectingSource;
        var unit;

        if (typeof winObjOrCallback == "function") {
          unit = new CommunicationUnit(cmd, null, connectingSource, onfailed, isActive, conndata);
        } else {
          unit = new CommunicationUnit(cmd, winObjOrCallback, connectingSource, onfailed, isActive, conndata);
        }

        connectedCallback = connectedCallback || function (sender, conndata) {
          console.log((isActive ? "active" : "") + " connected:" + cmd);
        };

        if (connectedCallback) {
          unit.onConnectedListener = function (conndata) {
            try {
              connectedCallback(this.send, conndata);
            } catch (e) {
              console.error(e);
            }
          };
        }

        if (receiveCallback) {
          unit.onReceiveListener = function (data) {
            try {
              receiveCallback(data, this.send);
            } catch (e) {
              console.error(e);
            }
          };
        }

        if (typeof winObjOrCallback == "function") {
          winObjOrCallback(function (winObj) {
            unit.setSource(winObj);
          });
        }

        return unit.send;
      };

      var _connectIFrame = function _connectIFrame(iframe, option) {
        var winObj;

        if (typeof iframe == "string") {
          winObj = function winObj(callback) {
            iframe.onload = function () {
              callback(this.contentWindow);
            };
          };
        } else {
          winObj = iframe.contentWindow;
        }

        return _connectWindow(winObj, option);
      };

      var postMessageBridge = function () {
        var handle = {};
        var instanceMap = {};
        var cmd2ListenerMap = {};
        var instanceBindMap = {};
        var oinstanceidMap = {};

        handle.listen = function (cmd, conndata, connectingSource, source, isActive, _onConned, _onMsg, _onResponse, _onElse) {
          var listener = {
            cmd: cmd,
            _onConned: _onConned,
            _onMsg: _onMsg,
            _onResponse: _onResponse,
            _onElse: _onElse,
            conndata: conndata,
            osource: source,
            active: isActive,
            connectingSource: connectingSource,
            id: xsloader$p.randId(),
            refused: {}
          };

          if (!cmd2ListenerMap[cmd]) {
            cmd2ListenerMap[cmd] = [];
          }

          cmd2ListenerMap[cmd].push(listener);
          var instanceid = listener.id;
          instanceMap[instanceid] = listener;
          return instanceid;
        };

        handle.remove = function (instanceid) {};

        handle.send = function (data, instanceid, msgid) {
          var listener = instanceMap[instanceid];

          _sendData("msg", listener.cmd, listener.osource, data, instanceid, msgid);
        };

        handle.sendConn = function (instanceid) {
          var listener = instanceMap[instanceid];

          _sendData("conn", listener.cmd, listener.osource, listener.conndata, instanceid);
        };

        handle.sendResponse = function (data, instanceid) {
          var listener = instanceMap[instanceid];

          _sendData("response", listener.cmd, listener.osource, data, instanceid);
        };

        function handleConn(cmd, fromSource, originStr, data, oinstanceid) {
          if (oinstanceidMap[oinstanceid]) {
            return;
          }

          var listeners = cmd2ListenerMap[cmd];

          if (!listeners) {
            return;
          }

          function Callback(instanceid) {
            return function (isAccept, msg) {
              if (!isAccept) {
                var listener = instanceMap[instanceid];
                listener.refused[oinstanceid] = true;
                return;
              }

              if (oinstanceidMap[oinstanceid]) {
                console.warn("already bind other:" + cmd + ",my page:" + location.href);
              } else if (instanceBindMap[instanceid]) {
                console.warn("already self bind:" + cmd + ",my page:" + location.href);

                _sendData("binded", cmd, fromSource, oinstanceid);
              } else {
                oinstanceidMap[oinstanceid] = instanceid;
                instanceBindMap[instanceid] = true;
                var _listener = instanceMap[instanceid];
                _listener.osource = fromSource;
                _listener.origin = originStr;

                _sendData("accept", cmd, fromSource, _listener.conndata, instanceid, oinstanceid);
              }
            };
          }

          for (var i = 0; i < listeners.length; i++) {
            var listener = listeners[i];

            if (!listener.refused[oinstanceid]) {
              listener.connectingSource(fromSource, originStr, data, Callback(listener.id));
            }
          }
        }

        function handleAccept(cmd, fromSource, originStr, data, oinstanceid, minstanceid) {
          var listeners = cmd2ListenerMap[cmd];

          if (!listeners) {
            return;
          }

          function Callback(instanceid) {
            return function (isAccept, msg) {
              if (!isAccept) {
                var listener = instanceMap[instanceid];
                listener.refused[oinstanceid] = true;
                return;
              }

              if (oinstanceidMap[oinstanceid]) {
                console.warn("already bind:" + cmd + ",my page:" + location.href);
              } else if (instanceBindMap[instanceid]) {
                console.warn("already self bind:" + cmd + ",my page:" + location.href);

                _sendData("binded", cmd, fromSource, oinstanceid);
              } else {
                oinstanceidMap[oinstanceid] = instanceid;
                instanceBindMap[instanceid] = true;
                var _listener2 = instanceMap[instanceid];
                _listener2.osource = fromSource;
                _listener2.origin = originStr;

                _sendData("conned", cmd, fromSource, _listener2.conndata, instanceid);

                _listener2._onConned(fromSource, data);
              }
            };
          }

          for (var i = 0; i < listeners.length; i++) {
            var listener = listeners[i];

            if (listener.id == minstanceid && !listener.refused[oinstanceid]) {
              listener.connectingSource(fromSource, originStr, data, Callback(listener.id));
            }
          }
        }

        function handleBinded(cmd, fromSource, originStr, minstanceid) {
          var listener = instanceMap[minstanceid];

          listener._onElse("binded");
        }

        function checkSource(listener, fromSource, originStr) {
          if (listener.osource != fromSource && listener.origin != originStr) {
            console.warn("expected:" + listener.origin + ",but:" + originStr);
            throw new Error("source changed!");
          }
        }

        function handleConned(cmd, fromSource, originStr, data, oinstanceid) {
          var instanceid = oinstanceidMap[oinstanceid];
          var listener = instanceMap[instanceid];
          checkSource(listener, fromSource, originStr);

          listener._onConned(listener.osource, data);
        }

        function handleMsg(cmd, fromSource, originStr, data, oinstanceid, msgid) {
          var instanceid = oinstanceidMap[oinstanceid];
          var listener = instanceMap[instanceid];
          checkSource(listener, fromSource, originStr);

          listener._onMsg(data, msgid);
        }

        function handleResponse(cmd, fromSource, originStr, data, oinstanceid) {
          var instanceid = oinstanceidMap[oinstanceid];
          var listener = instanceMap[instanceid];
          checkSource(listener, fromSource, originStr);

          listener._onResponse(data);
        }

        function _sendData(type, cmd, source, data, instanceid, msgid) {
          var msg = {
            type: type,
            data: data,
            cmd: cmd,
            id: instanceid,
            msgid: msgid
          };

          if (isDebug("postMessageBridge")) {
            console.log("send from:" + location.href);
            console.log(msg);
          }

          source.postMessage(xsloader$p.xsJson2String(msg), "*");
        }

        window.addEventListener('message', function (event) {
          if (isDebug("postMessageBridge")) {
            console.log("receive from:" + event.origin + ",my page:" + location.href);
            console.log(event.data);
          }

          var data;

          try {
            data = xsloader$p.xsParseJson(event.data);
          } catch (e) {
            console.warn(e);
          }

          if (!data || !(data.cmd && data.type)) {
            return;
          }

          var cmd = data.cmd;
          var oinstanceid = data.id;
          var rdata = data.data;
          var type = data.type;
          var msgid = data.msgid;

          if (type == "conn") {
            handleConn(cmd, event.source, event.origin, rdata, oinstanceid);
          } else if (type == "accept") {
            handleAccept(cmd, event.source, event.origin, rdata, oinstanceid, msgid);
          } else if (type == "conned") {
            handleConned(cmd, event.source, event.origin, rdata, oinstanceid);
          } else if (type == "msg") {
            handleMsg(cmd, event.source, event.origin, rdata, oinstanceid, msgid);
          } else if (type == "response") {
            handleResponse(cmd, event.source, event.origin, rdata, oinstanceid);
          } else if (type == "binded") {
            handleBinded(cmd, event.source, event.origin, rdata);
          }
        });

        handle.runAfter = function (time, callback) {
          setTimeout(callback, time);
        };

        return handle;
      }();

      var handleApi = api;

      handleApi.connectIFrame = function (iframe, option) {
        return _connectIFrame(iframe, option);
      };

      handleApi.connectParent = function (option) {
        return _connectWindow(window.parent, option);
      };

      handleApi.connectTop = function (option) {
        return _connectWindow(window.top, option);
      };

      handleApi.connectOpener = function (option) {
        return _connectWindow(window.opener, option);
      };

      handleApi.listenMessage = function (option) {
        return _connectWindow(null, option, true);
      };

      handleApi.debug = function (isDebug) {
        isXsMsgDebug = isDebug;
      };

      xsloader$p.define("xsmsg", handleApi);
    }

    xsloader$p.define("XsLinkedList", function () {
      return LinkedList;
    });
  } catch (e) {
    console.error(e);
  }

  var global$p = utils.global;
  var xsloader$q = global$p.xsloader;
  var http = global$p._xshttp_request_;
  var DATA_CONF = "data-conf",
      DATA_CONFX = "data-xsloader-conf";
  var DATA_CONF2 = "data-conf2",
      DATA_CONF2X = "data-xsloader-conf2";
  var DATA_MAIN = "data-main",
      DATA_MAINX = "data-xsloader-main";
  var DATA_CONF_TYPE = "data-conf-type";
  var serviceConfigUrl;
  var dataConf = xsloader$q.script().getAttribute(DATA_CONF) || xsloader$q.script().getAttribute(DATA_CONFX);
  var dataMain = xsloader$q.script().getAttribute(DATA_MAIN) || xsloader$q.script().getAttribute(DATA_MAINX);
  var dataConfType = xsloader$q.script().getAttribute(DATA_CONF_TYPE);

  if (dataConfType !== "json" && dataConfType != "js") {
    dataConfType = "auto";
  }

  var initFun = function initFun() {
    function getMainPath(config) {
      var mainPath = config.main.getPath.call(config, dataMain);
      var path = location.pathname;
      var index = path.lastIndexOf("/");
      var name = path.substring(index + 1);

      if (name === "") {
        name = "index";
      }

      if (xsloader$q.endsWith(name, ".html")) {
        name = name.substring(0, name.length - 5);
      }

      if (!mainPath) {
        mainPath = "./main/{name}.js";
      }

      mainPath = mainPath.replace("{name}", name);
      return mainPath;
    }

    function extendConfig(config) {
      config = xsloader$q.extendDeep({
        properties: {},
        main: {
          getPath: function getPath() {
            return dataMain || "./main/{name}.js";
          },
          name: "main",
          localConfigVar: "lconfig",
          globalConfigVar: "gconfig",
          before: function before(name) {
            console.log("before:" + name);
          },
          after: function after(name) {
            console.log("after:" + name);
          }
        },
        service: {
          hasGlobal: false,
          resUrls: []
        },
        chooseLoader: function chooseLoader(localConfig) {
          return "default";
        },
        loader: {
          "default": {
            autoUrlArgs: true
          }
        }
      }, config);
      return config;
    }

    function loadServiceConfig(tag, url, callback, isLocal) {
      http({
        url: url,
        method: "get",
        timeout: 20000,
        handleType: "text",
        ok: function ok(confText) {
          var conf;

          if (dataConfType == "js") {
            conf = xsloader$q.xsEval(confText);
          } else if (dataConfType == "json") {
            conf = xsloader$q.xsParseJson(confText);
          } else {
            if (xsloader$q.startsWith(url, location.protocol + "//" + location.host + "/")) {
              conf = xsloader$q.xsEval(confText);
            } else {
              conf = xsloader$q.xsParseJson(confText);
            }
          }

          conf = extendConfig(conf);

          if (conf.beforeDealProperties) {
            conf.beforeDealProperties();
          }

          conf = xsloader$q.dealProperties(conf, conf.properties);

          if (isLocal && conf.service.hasGlobal) {
            loadServiceConfig("global servie", conf.service.confUrl, function (globalConfig) {
              var localConfig = conf;
              global$p[globalConfig.main && globalConfig.main.localConfigVar || localConfig.main.localConfigVar] = localConfig;
              global$p[globalConfig.main && globalConfig.main.globalConfigVar || localConfig.main.globalConfigVar] = globalConfig;
              var mainName, mainPath, loaderName;
              loaderName = globalConfig.chooseLoader.call(globalConfig, localConfig);
              var conf;
              var loader;

              if (loaderName != null) {
                mainName = globalConfig.main.name;
                mainPath = utils.getPathWithRelative(location.href, getMainPath(globalConfig));
                loader = globalConfig.loader[loaderName];
                conf = globalConfig;
              }

              if (!loader) {
                loaderName = localConfig.chooseLoader.call(localConfig, null);
                mainName = localConfig.main.name;
                mainPath = utils.getPathWithRelative(location.href, getMainPath(localConfig));
                loader = localConfig.loader[loaderName];
                conf = localConfig;
              }

              if (!loader) {
                console.error("unknown loader:" + loaderName + "");
                return;
              }

              initXsloader(mainName, mainPath, loader, conf, localConfig);
            });
          } else {
            callback(conf);
          }
        },
        fail: function fail(err) {
          console.error("load " + tag + " config err:url=" + url + ",errinfo=" + err);
        }
      }).done();
    }

    function startLoad() {
      loadServiceConfig("local", serviceConfigUrl, function (localConfig) {
        global$p[localConfig.main.localConfigVar] = localConfig;
        var mainName = localConfig.main.name;
        var href = location.href;
        var index = href.lastIndexOf("?");

        if (index >= 0) {
          href = href.substring(0, index);
        }

        var mainPath = getMainPath(localConfig);
        mainPath = mainPath.indexOf("!") == -1 ? utils.getPathWithRelative(href, mainPath) : mainPath;
        var loaderName = localConfig.chooseLoader.call(localConfig, null);
        var loader = localConfig.loader[loaderName];

        if (!loader) {
          console.error("unknown local loader:" + loaderName);
          return;
        }

        initXsloader(href, mainName, mainPath, loader, localConfig, localConfig);
      }, true);
    }

    function initXsloader(pageHref, mainName, mainPath, loader, conf, localConfig) {
      var resUrls = [];
      conf.service.resUrl && resUrls.push(conf.service.resUrl);
      localConfig !== conf && localConfig.service.resUrl && resUrls.push(localConfig.service.resUrl);
      conf.service.resUrls && Array.pushAll(resUrls, conf.service.resUrls);
      localConfig !== conf && localConfig.service.resUrls && Array.pushAll(resUrls, localConfig.service.resUrls);

      xsloader$q._resUrlBuilder = function (groupModule) {
        var as = [];
        utils.each(resUrls, function (url) {
          as.push(xsloader$q.appendArgs2Url(url, "m=" + encodeURIComponent(groupModule)));
        });
        return as;
      };

      loader.ignoreProperties = true;
      loader.defineFunction = loader.defineFunction || {};
      loader.depsPaths = loader.depsPaths || {};

      if (mainPath.indexOf("!") != -1) {
        var theConfig = xsloader$q(loader);
        mainName = "_plugin_main_";
        var deps = [];

        if (theConfig.deps) {
          if (theConfig.deps["*"]) {
            Array.pushAll(deps, theConfig.deps["*"]);
          }

          if (theConfig.deps[mainName]) {
            Array.pushAll(deps, theConfig.deps[mainName]);
          }
        }

        deps.push(mainPath);
        xsloader$q.define(mainName, deps, function () {}).then({
          absUrl: pageHref
        });
      } else if (!xsloader$q.hasDefine(mainName)) {
        loader.depsPaths[mainName] = mainPath;
        xsloader$q(loader);
      } else {
        xsloader$q(loader);
      }

      loader.defineFunction[mainName] = function (originCallback, originThis, originArgs) {
        if (xsloader$q.isFunction(conf.main.before)) {
          conf.main.before.call(conf, mainName);
        }

        var rt = originCallback.apply(originThis, originArgs);

        if (xsloader$q.isFunction(conf.main.after)) {
          conf.main.after.call(conf, mainName);
        }

        return rt;
      };

      xsloader$q.require([mainName], function (main) {}).then({
        onError: function onError(err, invoker) {
          if (invoker) {
            console.error("error occured:invoker.url=", invoker.getUrl());
          }

          console.error("invoke main err:");
          console.error(err);
        }
      });
    }

    xsloader$q.asyncCall(startLoad, true);
  };

  if (dataConf) {
    serviceConfigUrl = utils.getPathWithRelative(location.href, dataConf);
  } else if (dataConf = xsloader$q.script().getAttribute(DATA_CONF2) || xsloader$q.script().getAttribute(DATA_CONF2X)) {
    serviceConfigUrl = utils.getPathWithRelative(xsloader$q.scriptSrc(), dataConf);
  } else {
    initFun = null;
  }

  initFun && initFun();

  utils.loaderEnd();

}());
//# sourceMappingURL=xsloader.js.map

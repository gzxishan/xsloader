/*!
 * xsloader.js v1.1.0
 * home:https://github.com/gzxishan/xsloader#readme
 * (c) 2018-2019 gzxishan
 * Released under the Apache-2.0 License.
 * build time:Wed, 04 Sep 2019 05:40:33 GMT
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

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    }
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _iterableToArrayLimit(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance");
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

  var global$1 = {
    global: g
  };

  var ABSOLUTE_PROTOCOL_REG = /^(([a-zA-Z0-9_]*:\/\/)|(\/)|(\/\/))/;
  var ABSOLUTE_PROTOCOL_REG2 = /^([a-zA-Z0-9_]+:)\/\/([^/\s]+)/;
  var defaultJsExts = [".js", ".js+", ".js++", ".es", "es6", ".jsx", ".vue"];
  var xsloader = global$1.xsloader;

  function isJsFile(path) {
    if (!xsloader.isString(path)) {
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

    var theConfig = xsloader.config();
    var jsExts = theConfig && theConfig.jsExts || defaultJsExts;

    for (var i = 0; i < jsExts.length; i++) {
      if (xsloader.endsWith(path, jsExts[i])) {
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

    if (xsloader.endsWith(path, "/")) {
      path = path.substring(0, path.length - 1);
    }

    var isRelativeDir = false;

    if (relative == "." || xsloader.endsWith(relative, "/")) {
      relative = relative.substring(0, relative.length - 1);
      isRelativeDir = true;
    } else if (relative == "." || relative == ".." || xsloader.endsWith("/.") || xsloader.endsWith("/..")) {
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

    if (isRelativeDir && !xsloader.endsWith(result, "/")) {
      result += "/";
    }

    result = xsloader.appendArgs2Url(result, relativeQuery);
    return result;
  }

  function getNodeAbsolutePath(node) {
    var src = node.src;
    return getPathWithRelative(location.href, src);
  } //去掉url的query参数和#参数


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
        var propValue = xsloader.getObjectAttr(properties, propKey);

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
          result += xsloader.getObjectAttr(properties, _propKey);
          str = str.substring(rs.index + rs[0].length);
        }
      }

      return result;
    } //处理属性引用


    function replaceProperties(obj, property, enableKeyAttr) {
      if (!obj) {
        return obj;
      }

      if (xsloader.isFunction(obj)) {
        return obj;
      } else if (xsloader.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
          obj[i] = replaceProperties(obj[i], property, enableKeyAttr);
        }
      } else if (xsloader.isString(obj)) {
        obj = replaceStringProperties(obj, properties, property);
      } else if (xsloader.isObject(obj)) {
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

        if (xsloader.isFunction(fun)) {
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
    if (!deps) {
      return;
    }

    for (var i = 0; i < deps.length; i++) {
      var m = deps[i];
      var index = m.indexOf("!");
      var pluginParam = index > 0 ? m.substring(index) : "";
      m = index > 0 ? m.substring(0, index) : m;
      index = m.indexOf("?");
      var query = index > 0 ? m.substring(index) : "";
      m = index > 0 ? m.substring(0, index) : m;

      var _isJsFile = _isJsFile(m);

      if (!_isJsFile && (xsloader.startsWith(m, ".") || dealPathMayAbsolute(m).absolute)) {
        deps[i] = m + ".js" + query + pluginParam;
      }
    }

    if (config.modulePrefixCount) {
      //模块地址的前缀替换
      for (var prefix in config.modulePrefix) {
        var replaceStr = config.modulePrefix[prefix].replace;
        var len = prefix.length;

        for (var _i = 0; _i < deps.length; _i++) {
          var _m = deps[_i];

          var pluginIndex = _m.indexOf("!");

          var pluginName = null;

          if (pluginIndex >= 0) {
            pluginName = _m.substring(0, pluginIndex + 1);
            _m = _m.substring(pluginIndex + 1);
          }

          if (xsloader.startsWith(_m, prefix)) {
            var dep = replaceStr + _m.substring(len);

            deps[_i] = pluginName ? pluginName + dep : dep;
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

  var xsloader$1 = global$1.xsloader;
  var commentRegExp = /\/\*[\s\S]*?\*\/|([^:"'=]|^)\/\/.*$/mg;
  var cjsRequireRegExp = /[^.]require\s*\(\s*["']([^'"\r\n]+)["']\s*\)/g; //基于有向图进行循环依赖检测

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
  } //使得内部的字符串变成数组


  function strValue2Arr(obj) {
    if (!obj || xsloader$1.isArray(obj)) {
      return;
    }

    for (var x in obj) {
      if (xsloader$1.isString(obj[x])) {
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
            if (func(ary[i], i, ary)) {
              break;
            }
          }
        } else {
          for (var _i = 0; _i < ary.length; _i++) {
            if (func(ary[_i], _i, ary)) {
              break;
            }
          }
        }
      }
    }
  }

  function __commentReplace(match, singlePrefix) {
    return singlePrefix || '';
  } //添加内部直接require('...')的模块


  function appendInnerDeps(deps, callback) {
    if (xsloader$1.isFunction(callback)) {
      callback.toString().replace(commentRegExp, __commentReplace).replace(cjsRequireRegExp, function (match, dep) {
        deps.push(dep);
      });
    }
  }

  var idCount = 2019;

  function getAndIncIdCount() {
    return idCount++;
  }

  var base = {
    graphPath: new GraphPath(),
    strValue2Arr: strValue2Arr,
    each: each,
    appendInnerDeps: appendInnerDeps,
    getAndIncIdCount: getAndIncIdCount
  };

  var utils = _objectSpread2({}, urls, {}, global$1, {}, base);

  var global$2 = utils.global;
  var xsloader$2 = global$2.xsloader;
  var defContextName = "xsloader1.1.x";
  var DATA_ATTR_MODULE = 'data-xsloader-module';
  var DATA_ATTR_CONTEXT = "data-xsloader-context";
  var isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]';
  var readyRegExp = navigator.platform === 'PLAYSTATION 3' ? /^complete$/ : /^(complete|loaded)$/;
  var theLoaderScript = document.currentScript || utils.getScriptBySubname("xsloader.js");
  var theLoaderUrl$1 = utils.getNodeAbsolutePath(theLoaderScript);

  var thePageUrl = function () {
    var url = location.href;
    url = utils.removeQueryHash(url);
    return url;
  }();

  var currentDefineModuleQueue = []; //当前回调的模块

  currentDefineModuleQueue.peek = function () {
    if (this.length > 0) {
      return this[this.length - 1];
    }
  };

  var lastAppendHeadDom = theLoaderScript;
  var useDefineQueue;
  var theRealDefine;

  if (utils.safariVersion > 0 && utils.safariVersion <= 7) {
    useDefineQueue = [];
  } /////////////////////////////


  var Invoker =
  /*#__PURE__*/
  function () {
    function Invoker(moduleMap) {
      _classCallCheck(this, Invoker);

      _defineProperty(this, "moduleMap", void 0);

      this.moduleMap = moduleMap;
    }

    _createClass(Invoker, [{
      key: "getAbsoluteUrl",
      value: function getAbsoluteUrl() {
        return this.moduleMap.src;
      }
    }, {
      key: "getName",
      value: function getName() {
        return this.moduleMap.name;
      }
    }, {
      key: "invoker",
      value: function invoker() {
        return this.moduleMap.invoker;
      }
    }, {
      key: "absUrl",
      value: function absUrl() {
        //用于获取其他模块地址的参考路径
        return this.moduleMap.absoluteUrl;
      }
    }]);

    return Invoker;
  }();

  var DefineObject = function DefineObject(thiz, args) {
    var _this = this;

    var isRequire = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    _classCallCheck(this, DefineObject);

    _defineProperty(this, "thiz", void 0);

    _defineProperty(this, "args", void 0);

    _defineProperty(this, "isRequire", void 0);

    _defineProperty(this, "src", void 0);

    _defineProperty(this, "parentDefine", void 0);

    _defineProperty(this, "handle", void 0);

    _defineProperty(this, "selfname", void 0);

    _defineProperty(this, "deps", void 0);

    _defineProperty(this, "callback", void 0);

    _defineProperty(this, "thatInvoker", void 0);

    this.thiz = thiz;
    this.args = args;
    this.isRequire = isRequire;
    this.parentDefine = currentDefineModuleQueue.peek();
    this.handle = {
      onError: function onError(err) {},
      before: function before(deps) {},
      depBefore: function depBefore(index, dep, depDeps) {},
      orderDep: false,
      absoluteUrl: undefined,
      instance: undefined,
      absUrl: function absUrl() {
        return _this.handle.absoluteUrl || (_this.thatInvoker ? _this.thatInvoker.absUrl() : null);
      }
    };

    if (thiz instanceof Invoker) {
      this.thatInvoker = thiz;
    } else if (thiz instanceof DefineObject) {
      this.thatInvoker = thiz.thatInvoker;
    }

    if (!isRequire && (this.parentDefine || this.thatInvoker) && (args.length == 0 || !xsloader$2.isString(args[0]))) {
      throw new Error("define:expected selfname");
    }
  }; ////////////////////////

  /**
   * 获取当前脚本，返回对象：
   * src:脚本绝对地址，不含参数
   * node:脚本dom对象
   * @param {Object} isRemoveQueryHash
   */


  function getCurrentScript() {
    var isRemoveQueryHash = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    function _getCurrentScriptOrSrc() {
      //兼容获取正在运行的js
      //取得正在解析的script节点
      if (document.currentScript !== undefined) {
        //firefox 4+
        var node = document.currentScript && document.currentScript.src && document.currentScript;

        if (node) {
          return {
            node: node,
            src: node.src
          };
        }
      }

      if (utils.IE_VERSION > 0 && utils.IE_VERSION <= 10) {
        var nodes = document.getElementsByTagName("script"); //只在head标签中寻找

        for (var i = 0; i < nodes.length; i++) {
          var _node = nodes[i];

          if (_node.readyState === "interactive") {
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
        a.b.c(); //强制报错,以便捕获e.stack
      } catch (e) {
        //safari的错误对象只有line,sourceId,sourceURL
        stack = e.stack || e.sourceURL || e.stacktrace || '';

        if (!stack && window.opera) {
          //opera 9没有e.stack,但有e.Backtrace,但不能直接取得,需要对e对象转字符串进行抽取
          stack = (String(e).match(/of linked script \S+/g) || []).join(" ");
        }
      }

      if (stack) {
        /**e.stack最后一行在所有支持的浏览器大致如下:
         *chrome23:
         * at http://113.93.50.63/data.js:4:1
         *firefox17:
         *@http://113.93.50.63/query.js:4
         *opera12:
         *@http://113.93.50.63/data.js:4
         *IE10:
         *  at Global code (http://113.93.50.63/data.js:4:1)
         */
        stack = stack.split(/[@ ]/g).pop(); //取得最后一行,最后一个空格或@之后的部分

        stack = stack[0] == "(" ? stack.slice(1, -1) : stack;
        var s = stack.replace(/(:\d+)?:\d+$/i, ""); //去掉行号与或许存在的出错字符起始位置

        return {
          src: s
        };
      }
    }

    var rs = _getCurrentScriptOrSrc();

    if (rs) {
      if (!rs.node) {
        var src = utils.removeQueryHash(rs.src);
        var nodes = document.getElementsByTagName("script"); //只在head标签中寻找

        for (var i = 0; i < nodes.length; i++) {
          var node = nodes[i];

          if (src == utils.removeQueryHash(node.src)) {
            rs.node = node;
            break;
          }
        }
      }

      rs.src = utils.getNodeAbsolutePath(rs.src);

      if (isRemoveQueryHash) {
        rs.src = utils.removeQueryHash(rs.src);
      }
    }

    return rs;
  }

  function __createNode() {
    var node = document.createElement('script');
    node.type = 'text/javascript';
    node.charset = 'utf-8';
    node.async = true;
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
  /**
   * callbackObj.onScriptLoad
   * callbackObj.onScriptError
   *
   */


  function __browserLoader(moduleName, url, callbackObj) {
    var node = __createNode();

    node.setAttribute(DATA_ATTR_MODULE, moduleName);
    node.setAttribute(DATA_ATTR_CONTEXT, defContextName);

    if (node.attachEvent && !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) && !isOpera) {
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

    node.src = url;
    appendHeadDom(node);
  }

  function __getScriptData(evt, callbackObj) {
    var node = evt.currentTarget || evt.srcElement;

    __removeListener(node, callbackObj.onScriptLoad, 'load', 'onreadystatechange');

    __removeListener(node, callbackObj.errListen, 'error');

    return {
      node: node,
      name: node && node.getAttribute(DATA_ATTR_MODULE),
      src: node && utils.getNodeAbsolutePath(node.src || node.getAttribute("src"))
    };
  }

  function appendHeadDom(dom) {
    if (!xsloader$2.isDOM(dom)) {
      throw new Error("expected dom object,but provided:" + dom);
    }

    var nextDom = lastAppendHeadDom.nextSibling;
    utils.head.insertBefore(dom, nextDom); //			head.appendChild(dom);

    lastAppendHeadDom = dom;
  } /////////////////////////


  function loadScript(moduleName, url, onload, onerror) {
    var callbackObj = {};

    callbackObj.onScriptLoad = function (evt) {
      if (callbackObj.removed) {
        return;
      }

      if (evt.type === 'load' || readyRegExp.test((evt.currentTarget || evt.srcElement).readyState)) {
        callbackObj.removed = true;

        var scriptData = __getScriptData(evt, callbackObj);

        if (useDefineQueue) {
          utils.each(useDefineQueue, function (defineObject) {
            defineObject.src = scriptData.src;
          });
          theRealDefine.define(_toConsumableArray(useDefineQueue));
        }

        onload(scriptData);
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
    var defineObject = new DefineObject(thiz, args, isRequire);

    if (!useDefineQueue) {
      defineObject.src = getCurrentScript().src;

      try {
        //防止执行其他脚本
        if (defineObject.src) {
          var node = document.currentScript;

          if (node && node.getAttribute("src") && node.getAttribute(DATA_ATTR_CONTEXT) != defContextName && defineObject.src != theLoaderUrl$1 && defineObject.src != thePageUrl) {
            console.error("unknown js script module:" + xsloader$2.xsJson2String(defineObject.src));
            console.error(node);
            return;
          }
        }
      } catch (e) {
        xsloader$2.config().error(e);
      }
    }

    var handle = {
      then: function then(option) {
        defineObject.handle = xsloader$2.extend(defineObject.handle, option);
        return this;
      },
      error: function error(onError) {
        defineObject.handle.onError = onError;
        return this;
      }
    };
    xsloader$2.asyncCall(function () {
      if (useDefineQueue) {
        useDefineQueue.push(defineObject);
      } else {
        theRealDefine.define([defineObject]);
      }
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

  function prerequire() {
    throw 'todo...';
  } //对于safari7-:在脚本加载事件中可获得正确的脚本地址


  var initDefine = function initDefine(theDefine) {
    theRealDefine = theDefine;
    return {
      predefine: predefine,
      prerequire: prerequire
    };
  };

  var script = {
    defContextName: defContextName,
    theLoaderScript: theLoaderScript,
    theLoaderUrl: theLoaderUrl$1,
    thePageUrl: thePageUrl,
    appendHeadDom: appendHeadDom,
    initDefine: initDefine,
    Invoker: Invoker,
    DefineObject: DefineObject,
    loadScript: loadScript,
    currentDefineModuleQueue: currentDefineModuleQueue
  };

  var global$3 = utils.global;
  var xsloader$3 = global$3.xsloader;
  var theDefinedMap = {};
  var INNER_DEPS_PLUGIN = "__inner_deps__";
  var innerDepsMap = {}; //内部依赖加载插件用于保存依赖的临时map

  function getModule(nameOrUrl) {
    nameOrUrl = utils.removeUrlParam(nameOrUrl);
    var m = theDefinedMap[nameOrUrl];
    return m ? m.get() : null;
  }

  function setModule(nameOrUrl, m) {
    nameOrUrl = utils.removeUrlParam(nameOrUrl);
    var last = theDefinedMap[nameOrUrl];
    theDefinedMap[nameOrUrl] = m;
    return last;
  }

  function buildInvoker(obj) {
    var invoker = obj["thiz"];
    var module = obj.module || obj;
    var id = xsloader$3.randId();

    invoker.getId = function () {
      return id;
    };

    invoker.getUrl = function (relativeUrl, appendArgs, optionalAbsUrl) {
      if (optionalAbsUrl && !utils.dealPathMayAbsolute(optionalAbsUrl).absolute) {
        throw new Error(-1, "expected absolute url:" + optionalAbsUrl);
      }

      if (appendArgs === undefined) {
        appendArgs = true;
      }

      var url;

      if (relativeUrl === undefined) {
        url = this.getAbsoluteUrl();
      } else if (xsloader$3.startsWith(relativeUrl, ".") || utils.dealPathMayAbsolute(relativeUrl).absolute) {
        url = utils.getPathWithRelative(optionalAbsUrl || this.rurl(), relativeUrl);
      } else {
        url = xsloader$3.config().baseUrl + relativeUrl;
      }

      if (appendArgs) {
        if (url == script.thePageUrl) {
          url += location.search + location.hash;
        }

        return xsloader$3.config().dealUrl(module, url);
      } else {
        return url;
      }
    };

    invoker.require = function () {
      var h = xsloader$3.require.apply(invoker, arguments);

      return h;
    };

    invoker.define = function () {
      var h = xsloader$3.define.apply(invoker, arguments);
      return h;
    };

    invoker.rurl = function (thenHandle) {
      return thenHandle && thenHandle.absUrl() || this.absUrl() || this.getAbsoluteUrl();
    };

    invoker.defineAsync = function () {
      var h = this.define.apply(this, arguments);
      return h;
    };

    invoker.withAbsUrl = function (absoluteUrl) {
      var moduleMap = {
        module: module,
        src: absoluteUrl,
        absoluteUrl: absoluteUrl,
        name: invoker.getName(),
        invoker: invoker.invoker()
      };
      moduleMap.thiz = new script.Invoker(moduleMap);
      buildInvoker(moduleMap);
      return moduleMap.thiz;
    };
  }

  function _newModule(name, absoluteUrl, thatInvoker, callback) {
    var defineObject = new script.DefineObject(null, null, false);
    defineObject.selfname = name;
    defineObject.src = null;
    defineObject.deps = null;
    defineObject.thatInvoker = thatInvoker;
    defineObject.callback = callback;
    defineObject.handle = {
      absUrl: function absUrl() {
        return null;
      }
    };
    return newModule(defineObject);
  } //
  //模块依赖来源：
  //1、define里声明的
  //2、define或require里直接require('...')
  //3、config里配置的
  //4、手动通过handle.before或depBefore进行修改的

  /*
   *模块的名字来源：
   * 1、模块url地址:一定存在
   * 2、模块define时提供的：可选
   * 3、paths或depsPaths提供的：可选
   * 4、name!提供的：可选
   */


  function newModule(defineObject) {
    var instances = []; //所有模块实例

    var moduleMap = {
      id: utils.getAndIncIdCount(),
      name: defineObject.selfname || defineObject.src,
      deps: defineObject.deps || [],
      relys: [],
      otherModule: undefined,
      directDefineIndex: 0,
      //模块直接声明的依赖开始索引
      ignoreAspect: false,
      depModules: null,
      src: null,
      //绝对路径,可能等于当前页面路径
      absoluteUrl: defineObject.absoluteUrl,
      callback: defineObject.callback,
      _loadCallback: null,
      moduleObject: undefined,
      //依赖模块对应的对象
      loopObject: undefined,
      //循环依赖对象
      invoker: defineObject.thatInvoker,
      instanceType: "single",
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
        if (this.directDefineIndex != 0) {
          var _directArgs = [];

          for (var i = this.directDefineIndex; i < args.length; i++) {
            _directArgs.push(args[i]);
          }

          args = _directArgs;
        }

        this.depModules = args;
        var obj;

        if (xsloader$3.isFunction(this.callback)) {
          try {
            script.currentDefineModuleQueue.push(this);
            script.obj = this.callback.apply(this.thiz, args);
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
            console.log("ignore moudule named '" + moduleMap.name + "':" + obj);
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
          if (!xsloader$3.isObject(obj)) {
            throw new Error("循环依赖的模块必须是对象：" + this.name);
          }

          for (var x in obj) {
            this.loopObject[x] = obj[x];
          }

          obj = this.loopObject;
        } //this.moduleObject不为undefined，则使用了exports


        if (this.moduleObject === undefined || !isDefault && obj !== undefined //如果使用了return、则优先使用
        ) {
            this.moduleObject = obj;
          }

        this.setState("defined");
      },
      state: "init",
      //init,loading,loaded,defined,error,
      errinfo: null,
      _callback: function _callback(fun) {
        var thiz = this;
        var _state = thiz.state;

        if (_state == 'defined' || thiz.loopObject) {
          var theCallback = function theCallback() {
            if (fun) {
              var depModule = _newDepModule(thiz, fun.thatInvoker, fun.relyCallback, fun.pluginArgs);

              depModule.init();
            }
          }; //已经加载了模块，仍然需要判断为其另外设置的依赖模块是否已被加载


          var deps = !thiz.loopObject && xsloader$3.config().getDeps(thiz.name); //console.log(this.name,":",deps);
          //deps=null;

          if (deps && deps.length > 0) {
            xsloader$3.require(deps, function () {
              theCallback();
            }).then({
              defined_module_for_deps: thiz.name
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
          this.state = this.otherModule.state; //状态同步,保持与otherModule状态相同

          return this.otherModule;
        }

        return this;
      },

      /**
       * 依赖当前模块、表示依赖otherModule模块，当前模块为别名或引用。
       * @param {Object} otherModule
       */
      toOtherModule: function toOtherModule(otherModule) {
        this.otherModule = otherModule;
        this.get(); //状态同步

        var theRelys = this.relys;
        this.relys = [];

        while (theRelys.length) {
          var fun = theRelys.shift();
          otherModule.relyIt(fun.thatInvoker, fun.relyCallback, fun.pluginArgs);
        }
      },
      whenNeed: function whenNeed(loadCallback) {
        if (this.relys.length || this.otherModule && this.otherModule.relys.length) {
          loadCallback(); //已经被依赖了
        } else {
          this._loadCallback = loadCallback;
        }
      },

      /**
       * 
       * @param {Object} thatInvoker
       * @param {Object} callbackFun function(depModule,err)
       * @param {Object} pluginArgs
       */
      relyIt: function relyIt(thatInvoker, callbackFun, pluginArgs) {
        if (this.otherModule) {
          this.get(); //状态同步

          this.otherModule.relyIt(thatInvoker, callbackFun, pluginArgs); //传递给otherModule

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
          //将会加载此模块及其依赖的模块
          var loadCallback = this._loadCallback;
          this._loadCallback = null;
          loadCallback();
        }
      }
    };
    moduleMap.thiz = new script.Invoker(moduleMap); //返回_module_

    moduleMap.dealInstance = function (moduleInstance) {
      instances.push(moduleInstance);
      var _module_ = {
        opId: null,
        setToAll: function setToAll(name, value, opId) {
          if (opId !== undefined && opId == this.opId) {
            return; //防止循环
          }

          opId = opId || _getModuleId();
          this.opId = opId;
          var obj = {};

          if (xsloader$3.isString(name)) {
            obj[name] = value;
          } else if (xsloader$3.isObject(name)) {
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
    }; //添加到前面
    //提供的参数deps为define里声明的


    moduleMap.mayAddDeps = function (deps) {
      var moduleDeps = this.deps;
      utils.each(moduleDeps, function (dep) {
        if (xsloader$3.indexInArray(deps, dep) < 0) {
          deps.push(dep);
        }
      }, false, true);
      this.deps = deps;
      return deps;
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
          as.push("");

          for (var k = 0; k < 3 && i < infos.length; k++) {
            as.push(infos[i++]);
          }

          console.info(as.join("--->"));
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

            var depMod = theDefinedMap[dep];

            if (depMod) {
              _as.push(dep + ":" + depMod.state);
            } else {
              _as.push(dep + ":null");
            }
          }

          console.info("failed module '" + errModule.name + "' deps state infos [" + _as.join(",") + "]");
        }
      });
    };

    moduleMap._printOnNotDefined = function (parentNode) {
      var node = {
        err: "[" + this.name + "].state=" + this.state,
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

        var mod = getModule(dep);

        if (mod && mod.state == "defined") {
          mod._printOnNotDefined(node);

          return;
        } //只打印一个错误栈


        if (mod) {
          mod._printOnNotDefined(node);
        } else {
          node.nodes.push({
            parent: parentNode,
            nodes: [],
            err: "[" + dep + "] has not module"
          });
        }
      });
    };

    setModule(moduleMap.name, moduleMap);
    buildInvoker(moduleMap);
    return moduleMap;
  }

  var randModuleIndex = 0;

  function _getModuleId() {
    return "_xs_req_2019_" + randModuleIndex++;
  } //处理嵌套依赖


  function _dealEmbedDeps(deps) {
    for (var i = 0; i < deps.length; i++) {
      var dep = deps[i];

      if (xsloader$3.isArray(dep)) {
        //内部的模块顺序加载
        var modName = "inner_order_" + _getModuleId();

        var isOrderDep = !(dep.length > 0 && dep[0] === false);

        if (dep.length > 0 && (dep[0] === false || dep[0] === true)) {
          dep = dep.slice(1);
        }

        innerDepsMap[modName] = {
          deps: dep,
          orderDep: isOrderDep
        }; //console.log(innerDepsMap[modName]);

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
  } //everyOkCallback(depModules,module),errCallback(err,invoker)


  function everyRequired(defineObject, module, everyOkCallback, errCallback) {
    if (defineObject.isError) {
      return;
    }

    var config = xsloader$3.config();
    var deps = module.deps;
    utils.replaceModulePrefix(config, deps); //前缀替换

    _dealEmbedDeps(deps); //处理嵌套依赖


    for (var i = 0; i < deps.length; i++) {
      //console.log(module.name+("("+defineObject.hanle.defined_module_for_deps+")"), ":", deps);
      var m = deps[i];
      var jsFilePath = utils.isJsFile(m);

      if (module.thiz.rurl(defineObject.hanle)) {
        //替换相对路径为绝对路径
        if (jsFilePath && xsloader$3.startsWith(m, ".")) {
          m = utils.getPathWithRelative(module.thiz.rurl(defineObject.hanle), jsFilePath.path) + _getPluginParam(m);
          deps[i] = m;
        }
      }

      var paths = utils.graphPath.tryAddEdge(defineObject.hanle.defined_module_for_deps || module.name, m);

      if (paths.length > 0) {
        var moduleLoop = getModule(m); //该模块必定已经被定义过

        moduleLoop.loopObject = {};
      }
    }

    var isError = false,
        hasCallErr = false,
        theExports;
    var depCount = deps.length; //module.jsScriptCount = 0;

    var depModules = new Array(depCount);
    var invoker_the_module = module.thiz;

    function checkFinish(index, dep_name, depModule, syncHandle) {
      depModules[index] = depModule;

      if (
      /*(depCount == 0 || depCount - module.jsScriptCount == 0)*/
      depCount <= 0 && !isError) {
        everyOkCallback(depModules, module);
      } else if (isError) {
        module.setState('error', isError);

        if (!hasCallErr) {
          hasCallErr = true;
          errCallback({
            err: isError,
            index: index,
            dep_name: dep_name
          }, invoker_the_module);
        }
      }

      !isError && syncHandle && syncHandle();
    }

    utils.each(deps, function (dep, index, ary, syncHandle) {
      var originDep = dep;
      var pluginArgs = undefined;
      var pluginIndex = dep.indexOf("!");

      if (pluginIndex > 0) {
        pluginArgs = dep.substring(pluginIndex + 1);
        dep = dep.substring(0, pluginIndex);
      }

      var relyItFun = function relyItFun() {
        getModule(dep).relyIt(invoker_the_module, function (depModule, err) {
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

      if (!getModule(dep)) {
        var isJsFile = utils.isJsFile(dep);

        var _loop = function _loop() {
          var urls = void 0;

          if (!isJsFile && dep.indexOf("/") < 0 && dep.indexOf(":") >= 0) {
            var i1 = dep.indexOf(":");
            var i2 = dep.indexOf(":", i1 + 1);
            var i3 = i2 > 0 ? dep.indexOf(":", i2 + 1) : -1;

            if (i2 == -1) {
              isError = "illegal module:" + dep;
              errCallback(isError, invoker_the_module);
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
              errCallback(isError, invoker_the_module);
              return "break";
            }

            var _url = xsloader$3._resUrlBuilder(groupModule);

            urls = xsloader$3.isArray(_url) ? _url : [_url];
          } else if (config.isInUrls(dep)) {
            urls = config.getUrls(dep);
          } else if (isJsFile) {
            urls = [dep];
          } else {
            urls = [];
          }

          var module2 = _newModule(dep, module.absoluteUrl, module.thiz);

          module2.setState("loading");
          utils.each(urls, function (url, index) {
            if (xsloader$3.startsWith(url, ".") || xsloader$3.startsWith(url, "/")) {
              if (!module2.thiz.rurl(defineObject.hanle)) {
                isError = "script url is null:'" + module2.name;
                throw new Error(isError);
              }

              url = utils.getPathWithRelative(module2.thiz.rurl(defineObject.hanle), url);
            } else {
              var absolute = utils.dealPathMayAbsolute(url);

              if (absolute.absolute) {
                url = absolute.path;
              } else {
                url = config.baseUrl + url;
              }
            }

            urls[index] = config.dealUrl(module2, url);
          });
          mayAsyncCallLoadModule();

          function mayAsyncCallLoadModule() {
            //					if(IE_VERSION > 0 && IE_VERSION <= 10) {
            //						asyncCall(function() {
            //							loadModule();
            //						});
            //					} else {
            //						loadModule();
            //					}
            loadModule();
          } //加载模块dep:module2


          function loadModule() {
            var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

            if (index >= urls.length) {
              return;
            }

            var url = urls[index];
            module2.src = url;
            script.loadScript(module2.name, url, function (scriptData) {}, function (err) {
              isError = err;
              errCallback(isError, invoker_the_module);
            });
          }
        };

        do {
          var _ret = _loop();

          if (_ret === "break") break;
        } while (false);
      }

      relyItFun();
    }, defineObject.handle.orderDep); //TODO STRONG ie10及以下版本，js文件一个一个加载，从而解决缓存等造成的混乱问题
  }

  var moduleScript = {
    setModule: setModule,
    newModule: newModule,
    getModule: getModule,
    everyRequired: everyRequired,
    INNER_DEPS_PLUGIN: INNER_DEPS_PLUGIN,
    innerDepsMap: innerDepsMap
  };

  var global$4 = utils.global;
  var xsloader$4 = global$4.xsloader;
  var defineHandle = script.initDefine(function theRealDefine(defines) {
    utils.each(defines, function (defineObject) {
      var thiz = defineObject.thiz,
          args = defineObject.args,
          isRequire = defineObject.isRequire,
          src = defineObject.src,
          parentDefine = defineObject.parentDefine,
          thatInvoker = defineObject.thatInvoker,
          _defineObject$handle = defineObject.handle,
          onError = _defineObject$handle.onError,
          before = _defineObject$handle.before,
          depBefore = _defineObject$handle.depBefore,
          orderDep = _defineObject$handle.orderDep,
          absoluteUrl = _defineObject$handle.absoluteUrl,
          instance = _defineObject$handle.instance;

      var _args = _slicedToArray(args, 3),
          selfname = _args[0],
          deps = _args[1],
          callback = _args[2];

      if (typeof selfname !== 'string') {
        callback = deps;
        deps = selfname;
        selfname = src;
      }

      if (!utils.isArray(deps)) {
        callback = deps;
        deps = null;
      }

      if (!deps) {
        deps = [];
      } //获取函数体里直接require('...')的依赖
      //if(!isRequire) {


      utils.appendInnerDeps(deps, callback); //}
      //获取配置里配置的依赖

      var _deps = xsloader$4.script().getDeps(src);

      utils.each(_deps, function (dep) {
        deps.push(dep);
      });

      if (selfname && selfname != src) {
        deps = xsloader$4.script().getDeps(selfname);
        utils.each(_deps, function (dep) {
          deps.push(dep);
        });
      }

      if (xsloader$4.isFunction(callback)) {
        var originCallback = callback;

        callback = function callback() {
          var config = xsloader$4.script();
          var rt;

          if (xsloader$4.isFunction(config.defineFunction[cache.name])) {
            var _args2 = [];

            for (var i = 0; i < arguments.length; i++) {
              _args2.push(arguments[i]);
            }

            rt = config.defineFunction[cache.name].apply(this, [originCallback, this, _args2]);
          } else {
            rt = originCallback.apply(this, arguments);
          }

          originCallback = null;
          return rt;
        };

        callback.originCallback = originCallback;
      }

      defineObject.selfname = selfname;
      defineObject.deps = deps;
      defineObject.callback = callback;
      onModuleLoaded(defineObject);
    });
  });
  /**
   * 当前模块脚本已经完成加载、但其依赖的模块可能需要加载。
   * 当前模块：src、selfname已经确定。
   * 若当前模块依赖为0、则可以直接finish；若当前模块存在其他依赖、则设置回调，等待被其他地方依赖时再触发。
   * @param {Object} defineObject 当前模块
   * @param {Object} lastDefineObject 第一次加载当前模块的模块
   */

  function onModuleLoaded(defineObject, lastDefineObject) {
    //先根据src获取模块
    var ifmodule = moduleScript.getModule(defineObject.src);

    if (ifmodule) {
      if (ifmodule.state != 'loading' && ifmodule.state != 'init') ; else if (ifmodule.state == "defined") {
        throw new Error("already define '" + ifmodule.selfname + "'(src=" + ifmodule.src + ")");
      } else {
        throw new Error("already define failed '" + ifmodule.selfname + "'(src=" + ifmodule.src + ")");
      }
    } else {
      ifmodule = moduleScript.newModule(defineObject);
    }

    if (ifmodule.selfname != ifmodule.src) {
      //此处的名字可能由配置指定
      var moduleSelf = moduleScript.getModule(ifmodule.selfname);

      if (moduleSelf) {
        //让配置的名字也最终指向src的
        if (moduleSelf != ifmodule) {
          if (moduleSelf.state == "init") {
            moduleScript.setModule(ifmodule.selfname, module);
            moduleSelf.toOtherModule(module);
          } else {
            throw Error("already define '" + ifmodule.selfname + "'");
          }
        }
      } else {
        moduleScript.setModule(ifmodule.selfname, module);
      }
    }

    if (defineObject.selfname != defineObject.src && defineObject.selfname != ifmodule.selfname) {
      //此处的名字一定是define时指定
      var _moduleSelf = moduleScript.getModule(defineObject.selfname);

      if (_moduleSelf) {
        //让define的名字也最终指向src的
        if (_moduleSelf != ifmodule) {
          if (_moduleSelf.state == "init") {
            moduleScript.setModule(ifmodule.selfname, module);

            _moduleSelf.toOtherModule(module);
          } else {
            throw Error("already define '" + ifmodule.selfname + "'");
          }
        }
      } else {
        moduleScript.setModule(ifmodule.selfname, module);
      }
    }

    var module = ifmodule; //defineObject里的deps最初是直接声明的依赖,应该出现在最前面

    module.mayAddDeps(defineObject.deps);

    if (defineObject.handle.before) {
      defineObject.before(module.deps);
    }

    if (lastDefineObject && lastDefineObject.handle.depBefore) {
      lastDefineObject.handle.depBefore(lastDefineObject.index, module.name, module.deps, 2);
    }

    if (xsloader$4._ignoreAspect_[module.name]) {
      module.ignoreAspect = true;
    }

    module.setState("loaded");
    module.setInstanceType(defineObject.handle.instance || xsloader$4.config().instance);

    if (deps.length == 0) {
      module.finish([]); //递归结束
    } else {
      //在其他模块依赖此模块时进行加载
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
          define.handle.onError(err, invoker);
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

  xsloader$4.define = define;
  xsloader$4.defineAsync = define;
  xsloader$4.require = require;
  global$4.define = define;
  global$4.require = require;

  var global$5 = utils.global;
  var xsloader$5 = global$5.xsloader;
  xsloader$5.define(moduleScript.INNER_DEPS_PLUGIN, {
    pluginMain: function pluginMain(depId, onload, onerror, config) {
      var depsObj = moduleScript.innerDepsMap[depId];
      var deps = depsObj.deps; //delete innerDepsMap[depId];

      this.invoker().require(deps, function () {
        var args = [];

        for (var k = 0; k < arguments.length; k++) {
          args.push(arguments[k]);
        }

        onload(args);
      }).then({
        orderDep: depsObj.orderDep
      });
    },
    getCacheKey: function getCacheKey(depId) {
      return depId;
    }
  });

  var global$6 = utils.global;
  var theContext;
  var theConfig;
  var globalDefineQueue = []; //在config之前，可以调用define来定义模块

  var requiresQueueBeforeConf = []; //配置前的require

  var argsObject = {};

  function _newContext() {
    var context = {
      contextName: script.contextName,
      defQueue: []
    };
    return context;
  }

  var xsloader$6 = global$6.xsloader = function (option) {
    if (theContext) {
      throw new Error("already configed!");
    }

    option = xsloader$6.extend({
      baseUrl: utils.getPathWithRelative(location.pathname, "./", xsloader$6.endsWith(location.pathname, "/")),
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
        } else if (xsloader$6.isString(module)) {
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
            nameOrUrl = module.name;
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

        if (xsloader$6.isFunction(urlArg)) {
          urlArg = urlArg.call(this, nameOrUrl);
        }

        for (var k in argsObject) {
          //加入全局的参数
          urlArg += "&" + k + "=" + encodeURIComponent(argsObject[k]);
        }

        return xsloader$6.appendArgs2Url(url, urlArg);
      },
      dealUrlArgs: function dealUrlArgs(url) {
        url = utils.getPathWithRelative(location.href, url);
        return this.dealUrl(url, url);
      },
      defaultVersion: {}
    }, option);

    if (!xsloader$6.endsWith(option.baseUrl, "/")) {
      option.baseUrl += "/";
    }

    option.baseUrl = utils.getPathWithRelative(location.href, option.baseUrl);

    if (!option.ignoreProperties) {
      option = option.dealProperties(option);
    }

    utils.strValue2Arr(option.paths);
    utils.strValue2Arr(option.depsPaths);
    utils.strValue2Arr(option.deps);

    if (!xsloader$6.isFunction(option.autoUrlArgs)) {
      var isAutoUrlArgs = option.autoUrlArgs;

      option.autoUrlArgs = function () {
        return isAutoUrlArgs;
      };
    }

    var modulePrefixCount = 0;

    for (var prefix in option.modulePrefix) {
      if (xsloader$6.startsWith(prefix, ".") || xsloader$6.startsWith(prefix, "/")) {
        throw new Error("modulePrefix can not start with '.' or '/'(" + prefix + ")");
      }

      modulePrefixCount++;
    }

    option.modulePrefixCount = modulePrefixCount;

    if (modulePrefixCount > 0) {
      //替换urlArgs中地址前缀
      var star = option.urlArgs["*"];
      delete option.urlArgs["*"];
      var urlArgsArr = [];

      for (var k in option.urlArgs) {
        var url = k;

        if (utils.isJsFile(url)) {
          //处理相对
          if (xsloader$6.startsWith(url, ".") || xsloader$6.startsWith(url, "/") && !xsloader$6.startsWith(url, "//")) {
            url = utils.getPathWithRelative(theLoaderUrl, url);
          } else {
            var absolute = utils.dealPathMayAbsolute(url);

            if (absolute.absolute) {
              url = absolute.path;
            } else if (!xsloader$6.startsWith(url, "*]")) {
              //排除*]；单*[可以有前缀
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

          if (xsloader$6.startsWith(urlArgObj.url, "*[")) {
            starP = "*[";
            urlArgObj.url = urlArgObj.url.substring(2);
          }

          if (xsloader$6.startsWith(urlArgObj.url, _prefix)) {
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
    } //预处理urlArgs中的*[与*]


    var _urlArgs_prefix = [];
    var _urlArgs_suffix = [];
    option._urlArgs_prefix = _urlArgs_prefix;
    option._urlArgs_suffix = _urlArgs_suffix;

    for (var _k in option.urlArgs) {
      var _url = _k;

      if (xsloader$6.startsWith(_url, "*[")) {
        var strfix = _url.substring(2);

        if (xsloader$6.startsWith(strfix, ".") || xsloader$6.startsWith(strfix, "/") && !xsloader$6.startsWith(strfix, "//")) {
          strfix = utils.getPathWithRelative(theLoaderUrl, strfix);
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
      } else if (xsloader$6.startsWith(_url, "*]")) {
        _urlArgs_suffix.push({
          strfix: _url.substring(2),
          value: option.urlArgs[_k]
        });

        delete option.urlArgs[_k];
      }
    }

    option.forPrefixSuffix = function (urlOrName) {
      //前缀判断
      for (var _i2 = 0; _i2 < _urlArgs_prefix.length; _i2++) {
        var strfixObj = _urlArgs_prefix[_i2];

        if (xsloader$6.startsWith(urlOrName, strfixObj.strfix)) {
          var value = void 0;

          if (xsloader$6.isFunction(strfixObj.value)) {
            value = strfixObj.value.call(this, urlOrName);
          } else {
            value = strfixObj.value;
          }

          return value;
        }
      } //后缀判断


      for (var _i3 = 0; _i3 < _urlArgs_suffix.length; _i3++) {
        var _strfixObj = _urlArgs_suffix[_i3];

        if (xsloader$6.endsWith(urlOrName, _strfixObj.strfix)) {
          var _value = void 0;

          if (xsloader$6.isFunction(_strfixObj.value)) {
            _value = _strfixObj.value.call(this, urlOrName);
          } else {
            _value = _strfixObj.value;
          }

          return _value;
        }
      }
    };

    for (var name in option.paths) {
      utils.replaceModulePrefix(option, option.paths[name]); //前缀替换
    }

    for (var _name in option.depsPaths) {
      utils.replaceModulePrefix(option, option.depsPaths[_name]); //前缀替换
    } //处理依赖


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
    var arr = globalDefineQueue;
    globalDefineQueue = null; //定义config之前的模块

    utils.each(arr, function (elem) {
      elem.data.isGlobal = true;

      __define(elem.data, elem.name, elem.deps, elem.callback, elem.src).then(elem.thenOption);
    });

    if (requiresQueueBeforeConf && requiresQueueBeforeConf.length) {
      while (requiresQueueBeforeConf.length) {
        requiresQueueBeforeConf.shift()();
      }
    }

    return theConfig;
  };

  xsloader$6.config = function () {
    return theConfig;
  };

  xsloader$6.script = function () {
    return script.theLoaderScript;
  };

  xsloader$6.scriptSrc = function () {
    return script.theLoaderUrl;
  };

  xsloader$6.putUrlArgs = function (argsObj) {
    argsObject = xsloader$6.extend(argsObject, argsObj);
  };

  xsloader$6.getUrlArgs = function (argsObj) {
    var obj = xsloader$6.extend({}, argsObject);
    return obj;
  };

  xsloader$6.clearUrlArgs = function () {
    argsObject = {};
  };

  var global$7 = utils.global;
  var xsloader$7 = global$7.xsloader; //ie9

  try {
    if (Function.prototype.bind && console && _typeof(console['log']) == "object") {
      utils.each(["log", "info", "warn", "error", "assert", "dir", "clear", "profile", "profileEnd"], function (method) {
        var thiz = Function.prototype.bind;
        console[method] = thiz.call(console[method], console);
      });
    }
  } catch (e) {
    global$7.console = {
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
        if (!xsloader$7.isArray(arr)) {
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

  //https://github.com/douglascrockford/JSON-js
  //  json2.js
  //  2017-06-12
  //  Public Domain.
  //  NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
  //  USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
  //  NOT CONTROL.
  var JSON = {};
  var rx_one = /^[\],:{}\s]*$/;
  var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
  var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
  var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
  var rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
  var rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

  function f(n) {
    // Format integers to have at least two digits.
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
    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.
    rx_escapable.lastIndex = 0;
    return rx_escapable.test(string) ? "\"" + string.replace(rx_escapable, function (a) {
      var c = meta[a];
      return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
    }) + "\"" : "\"" + string + "\"";
  }

  function str(key, holder) {
    // Produce a string from holder[key].
    var i; // The loop counter.

    var k; // The member key.

    var v; // The member value.

    var length;
    var mind = gap;
    var partial;
    var value = holder[key]; // If the value has a toJSON method, call it to obtain a replacement value.

    if (value && _typeof(value) === "object" && typeof value.toJSON === "function") {
      value = value.toJSON(key);
    } // If we were called with a replacer function, then call the replacer to
    // obtain a replacement value.


    if (typeof rep === "function") {
      value = rep.call(holder, key, value);
    } // What happens next depends on the value's type.


    switch (_typeof(value)) {
      case "string":
        return quote(value);

      case "number":
        // JSON numbers must be finite. Encode non-finite numbers as null.
        return isFinite(value) ? String(value) : "null";

      case "boolean":
      case "null":
        // If the value is a boolean or null, convert it to a string. Note:
        // typeof null does not produce "null". The case is included here in
        // the remote chance that this gets fixed someday.
        return String(value);
      // If the type is "object", we might be dealing with an object or an array or
      // null.

      case "object":
        // Due to a specification blunder in ECMAScript, typeof null is "object",
        // so watch out for that case.
        if (!value) {
          return "null";
        } // Make an array to hold the partial results of stringifying this object value.


        gap += indent;
        partial = []; // Is the value an array?

        if (Object.prototype.toString.apply(value) === "[object Array]") {
          // The value is an array. Stringify every element. Use null as a placeholder
          // for non-JSON values.
          length = value.length;

          for (i = 0; i < length; i += 1) {
            partial[i] = str(i, value) || "null";
          } // Join all of the elements together, separated with commas, and wrap them in
          // brackets.


          v = partial.length === 0 ? "[]" : gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : "[" + partial.join(",") + "]";
          gap = mind;
          return v;
        } // If the replacer is an array, use it to select the members to be stringified.


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
          // Otherwise, iterate through all of the keys in the object.
          for (k in value) {
            if (Object.prototype.hasOwnProperty.call(value, k)) {
              v = str(k, value);

              if (v) {
                partial.push(quote(k) + (gap ? ": " : ":") + v);
              }
            }
          }
        } // Join all of the member texts together, separated with commas,
        // and wrap them in braces.


        v = partial.length === 0 ? "{}" : gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : "{" + partial.join(",") + "}";
        gap = mind;
        return v;
    }
  } // If the JSON object does not yet have a stringify method, give it one.


  if (typeof JSON.stringify !== "function") {
    meta = {
      // table of character substitutions
      "\b": "\\b",
      "\t": "\\t",
      "\n": "\\n",
      "\f": "\\f",
      "\r": "\\r",
      "\"": "\\\"",
      "\\": "\\\\"
    };

    JSON.stringify = function (value, replacer, space) {
      // The stringify method takes a value and an optional replacer, and an optional
      // space parameter, and returns a JSON text. The replacer can be a function
      // that can replace values, or an array of strings that will select the keys.
      // A default replacer method can be provided. Use of the space parameter can
      // produce text that is more easily readable.
      var i;
      gap = "";
      indent = ""; // If the space parameter is a number, make an indent string containing that
      // many spaces.

      if (typeof space === "number") {
        for (i = 0; i < space; i += 1) {
          indent += " ";
        } // If the space parameter is a string, it will be used as the indent string.

      } else if (typeof space === "string") {
        indent = space;
      } // If there is a replacer, it must be a function or an array.
      // Otherwise, throw an error.


      rep = replacer;

      if (replacer && typeof replacer !== "function" && (_typeof(replacer) !== "object" || typeof replacer.length !== "number")) {
        throw new Error("JSON.stringify");
      } // Make a fake root object containing our value under the key of "".
      // Return the result of stringifying the value.


      return str("", {
        "": value
      });
    };
  } // If the JSON object does not yet have a parse method, give it one.


  if (typeof JSON.parse !== "function") {
    JSON.parse = function (text, reviver) {
      // The parse method takes a text and an optional reviver function, and returns
      // a JavaScript value if the text is a valid JSON text.
      var j;

      function walk(holder, key) {
        // The walk method is used to recursively walk the resulting structure so
        // that modifications can be made.
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
      } // Parsing happens in four stages. In the first stage, we replace certain
      // Unicode characters with escape sequences. JavaScript handles many characters
      // incorrectly, either silently deleting them, or treating them as line endings.


      text = String(text);
      rx_dangerous.lastIndex = 0;

      if (rx_dangerous.test(text)) {
        text = text.replace(rx_dangerous, function (a) {
          return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
        });
      } // In the second stage, we run the text against regular expressions that look
      // for non-JSON patterns. We are especially concerned with "()" and "new"
      // because they can cause invocation, and "=" because it can cause mutation.
      // But just to be safe, we want to reject all unexpected forms.
      // We split the second stage into 4 regexp operations in order to work around
      // crippling inefficiencies in IE's and Safari's regexp engines. First we
      // replace the JSON backslash pairs with "@" (a non-JSON character). Second, we
      // replace all simple value tokens with "]" characters. Third, we delete all
      // open brackets that follow a colon or comma or that begin the text. Finally,
      // we look to see that the remaining characters are only whitespace or "]" or
      // "," or ":" or "{" or "}". If that is so, then the text is safe for eval.


      if (rx_one.test(text.replace(rx_two, "@").replace(rx_three, "]").replace(rx_four, ""))) {
        // In the third stage we use the eval function to compile the text into a
        // JavaScript structure. The "{" operator is subject to a syntactic ambiguity
        // in JavaScript: it can begin a block or an object literal. We wrap the text
        // in parens to eliminate the ambiguity.
        j = eval("(" + text + ")"); // In the optional fourth stage, we recursively walk the new structure, passing
        // each name/value pair to a reviver function for possible transformation.

        return typeof reviver === "function" ? walk({
          "": j
        }, "") : j;
      } // If the text is not JSON parseable, then a SyntaxError is thrown.


      throw new SyntaxError("JSON.parse");
    };
  }

  var global$8 = utils.global;
  var xsloader$8 = global$8.xsloader;

  if (!String.prototype.trim) {
    String.prototype.trim = function () {
      return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    };
  } //生成一个随机的id，只保证在本页面是唯一的


  function randId(suffix) {
    var id = "r" + parseInt(new Date().getTime() / 1000) + "_" + parseInt(Math.random() * 1000) + "_" + utils.getAndIncIdCount();

    if (suffix !== undefined) {
      id += suffix;
    }

    return id;
  }

  function xsEval(scriptString) {
    try {
      var rs = xsloader$8.IE_VERSION > 0 && xsloader$8.IE_VERSION < 9 ? eval("[" + scriptString + "][0]") : eval("(" + scriptString + ")");
      return rs;
    } catch (e) {
      throw e;
    }
  }
  /**
   * 注意key需要用引号包裹
   * @param {Object} str
   * @param {Object} option
   */


  function xsParseJson(str, option) {
    if (str === "" || str === null || str === undefined || !xsloader$8.isString(str)) {
      return str;
    }

    option = xsloader$8.extend({
      fnStart: "",
      //"/*{f}*/",
      fnEnd: "",
      //"/*{f}*/",
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

        if (!xsloader$8.startsWith(fnStr, "function(")) {
          throw "not a function:" + fnStr;
        }

        try {
          str = str.substring(0, indexStart) + '"' + fnId + '"' + str.substring(indexEnd + option.fnEnd.length);
          var fn = xsloader$8.xsEval(fnStr);
          fnMap[fnId] = fn;
        } catch (e) {
          console.error(fnStr);
          throw e;
        }

        fnOffset = indexStart + fnId.length;
      }

      replacer = function replacer(key, val) {
        if (xsloader$8.isString(val) && fnMap[val]) {
          return fnMap[val];
        } else {
          return val;
        }
      };
    }

    if (option.rcomment) {
      str = str.replace(/(\r\n)|\r/g, "\n"); //统一换行符号

      str = str.replace(new RegExp(option.rcomment + "[^\\n]*(\\n|$)", "g"), ""); //去除行注释
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

    if (xsloader$8.isObject(argsStr)) {
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
      return url; //参数没有变化直接返回
    }

    var paramKeys = [];

    for (var _k in oldParams) {
      paramKeys.push(_k);
    }

    paramKeys.sort();
    var path = index < 0 ? url.substring(0, hashIndex) : url.substring(0, index);
    var params = [];

    for (var i = 0; i < paramKeys.length; i++) {
      //保证参数按照顺序
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
    queryString2ParamsMap: queryString2ParamsMap
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

  var global$9 = utils.globa;
  var xsloader$9 = global$9.xsloader;

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

    var theConfig = xsloader$9.config();
    var thePageUrl = xsloader$9.pageUrl();
    var url;

    if (relativeUrl === undefined) {
      url = thePageUrl;
    } else if (xsloader$9.startsWith(relativeUrl, ".") || utils.dealPathMayAbsolute(relativeUrl).absolute) {
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
      if (xsloader$9.isFunction(exCallback)) {
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

        if (xsloader$9.isObject(value) && xsloader$9.isObject(target[x])) {
          target[x] = xsloader$9.extendDeep(target[x], value);
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

        if (!useTimer && global$9.Promise && global$9.Promise.resolve) {
          global$9.Promise.resolve().then(ctrlCallback);
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
  /**
   * 得到属性
   * @param {Object} obj
   * @param {Object} attrNames "rs"、"rs.total"等
   */


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
  /**
   * 设置属性
   * @param {Object} obj
   * @param {Object} attrNames "rs"、"rs.total"等
   */


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
    // Handle the 3 simple types, and null or undefined or function
    if (!obj || xsloader$9.isFunction(obj) || xsloader$9.isString(obj)) return obj;

    if (xsloader$9.isRegExp(obj)) {
      return new RegExp(obj.source, obj.flags);
    } // Handle Date


    if (xsloader$9.isDate(obj)) {
      var copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
    } // Handle Array or Object


    if (xsloader$9.isArray(obj) || xsloader$9.isObject(obj)) {
      var _copy = xsloader$9.isArray(obj) ? [] : {};

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

  var global$a = utils.global;
  var xsloader$a = global$a.xsloader;
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
      } // Mozilla, Opera and webkit nightlies currently support this event


      if (document.addEventListener) {
        document.addEventListener("DOMContentLoaded", function () {
          document.removeEventListener("DOMContentLoaded", arguments.callee);
          ready();
        });
      } else if (document.attachEvent) {
        // ensure firing before onload,
        // maybe late but safe also for iframes
        document.attachEvent("onreadystatechange", function () {
          if (document.readyState === "complete") {
            document.detachEvent("onreadystatechange", arguments.callee);
            ready();
          }
        }); // If IE and not an iframe
        // continually check to see if the document is ready

        if (document.documentElement.doScroll && typeof global$a.frameElement === "undefined") (function () {
          if (isReady) return;

          try {
            // If IE is used, use the trick by Diego Perini
            // http://javascript.nwbox.com/IEContentLoaded/
            document.documentElement.doScroll("left");
          } catch (error) {
            setTimeout(arguments.callee, 0);
            return;
          } // and execute any waiting functions


          ready();
        })();
      } else {
        xsloader$a.asyncCall(null, true).next(function () {
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

      if (global$a.addEventListener) {
        addEventHandle = function addEventHandle(type, callback) {
          global$a.addEventListener(type, callback, false);
        };
      } else if (global$a.attachEvent) {
        addEventHandle = function addEventHandle(type, callback) {
          global$a.attachEvent("on" + type, callback);
        };
      } else {
        addEventHandle = function addEventHandle(type, callback) {
          xsloader$a.asyncCall(null, true).next(function () {
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

  var global$b = utils.global;
  var xsloader$b = global$b.xsloader;

  var toGlobal = _objectSpread2({}, deprecated, {}, base$1);

  for (var k in toGlobal) {
    xsloader$b[k] = toGlobal[k];
    global$b[k] = toGlobal[k];
  }

  var justLoader = _objectSpread2({}, is, {}, funs, {}, browser, {
    _ignoreAspect_: {}
  });

  for (var _k in justLoader) {
    xsloader$b[_k] = justLoader[_k];
  }

}());
//# sourceMappingURL=xsloader.js.map

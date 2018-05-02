/**
 * @license xsloader-1.0.0 Copyright 贵州溪山科技有限公司.
 * Apache License Version 2.0, https://github.com/gzxishan/xsloader/blob/master/LICENSE
 */

/**
 * 溪山科技浏览器端js模块加载器。
 * latest:2018-05-02 22:55
 * version:1.0.0
 * date:2018-1-25
 * 参数说明
 * config.xhtml
 * 
 * @param {Object} window
 * @param {Object} undefined
 */
var define, require, xsloader;
/////////////
var startsWith, endsWith, xsParseJson, xsJson2String;
var randId;
/**
 * function(array,ele,compare):得到ele在array中的位置，若array为空或没有找到返回-1；compare(arrayEle,ele)可选函数，默认为==比较.
 */
var indexInArray;
/**
 * function(path,relative,isPathDir):相对于path，获取relative的绝对路径
 */
var getPathWithRelative;

/**
 * function(url,args):args例子"a=1&b=2"
 */
var appendArgs2Url;

/**
 * function(urlQuery,decode):decode表示是否进行decodeURIComponent解码，默认为true。
 * 如:queryString2ParamsMap("?a=1&b=2")返回{a:"1",b:"2"}
 */
var queryString2ParamsMap;
//////
(function(global, setTimeout) {
	//ie9
	try {
		if(Function.prototype.bind && console && typeof console.log == "object") {
			["log", "info", "warn", "error", "assert", "dir", "clear", "profile", "profileEnd"]
			.forEach(function(method) {
				console[method] = this.call(console[method], console);
			}, Function.prototype.bind);
		}
	} catch(e) {
		try {
			window.console = {
				log: function() {},
				error: function() {}
			};
		} catch(e) {}
	}

	//-1表示不是ie，其余检测结果为ie6~ie11及edge
	function getIEVersion() {
		var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串  
		var isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1; //判断是否IE<11浏览器  
		var isEdge = userAgent.indexOf("Edge") > -1 && !isIE; //判断是否IE的Edge浏览器  
		var isIE11 = userAgent.indexOf('Trident') > -1 && userAgent.indexOf("rv:11.0") > -1;
		if(isIE) {
			var reIE = new RegExp("MSIE (\\d+\\.\\d+);");
			reIE.test(userAgent);
			var fIEVersion = parseFloat(RegExp["$1"]);
			if(fIEVersion == 7) {
				return 7;
			} else if(fIEVersion == 8) {
				return 8;
			} else if(fIEVersion == 9) {
				return 9;
			} else if(fIEVersion == 10) {
				return 10;
			} else {
				return 6; //IE版本<=7
			}
		} else if(isEdge) {
			return 'edge'; //edge
		} else if(isIE11) {
			return 11; //IE11  
		} else {
			return -1; //不是ie浏览器
		}
	}

	try {
		if(!String.prototype.indexOf) {
			String.prototype.indexOf = function(str, offset) {
				var i = offset === undefined ? 0 : offset;
				if(i >= this.length) {
					return -1;
				}
				if(!isString(str)) {
					return str !== false && str !== true && str !== undefined && str !== null && this.charAt(i) == str ? i : -1;
				}
				for(; i < this.length; i++) {
					if(this.length - i < str.length) return -1;
					var isFound = true;
					for(var k = 0; k < str.length; k++) {
						if(this.charAt(i + k) != str.charAt(k)) {
							isFound = false;
							break;
						}
					}
					if(isFound) return i;
				}
				return -1;
			}
		}

		if(!Array.prototype.indexOf) {
			Array.prototype.indexOf = function(elem, offset) {
				for(var i = offset === undefined ? 0 : offset; i < this.length; i++) {
					if(this[i] == elem) {
						return i;
					}
				}
				return -1;
			};
		}

		if(!Array.pushAll) {
			Array.pushAll = function(thiz, arr) {
				if(!isArray(arr)) {
					throw new Error("not array:" + arr);
				}
				for(var i = 0; i < arr.length; i++) {
					thiz.push(arr[i]);
				}
			};
		}
	} catch(e) {
		console.error(e);
	}

	function isArray(it) {
		return it && (it instanceof Array) || ostring.call(it) === '[object Array]';
	};

	function isFunction(it) {
		return it && (typeof it == "function") || ostring.call(it) === '[object Function]';
	};

	function isObject(it) {
		if(it === null || it === undefined) {
			return false;
		}
		return(typeof it == "object") || ostring.call(it) === '[object Object]';
	}

	function isString(it) {
		return it && (typeof it == "string") || ostring.call(it) === '[object String]';
	}

	function isDate(it) {
		return it && (it instanceof Date) || ostring.call(it) === '[object Date]';
	}

	function isRegExp(it) {
		return it && (it instanceof RegExp) || ostring.call(it) === '[object RegExp]';
	}

	xsParseJson = function(str) {
		if(str === "" || str === null || str === undefined) {
			return str;
		}
		try {
			return eval("(" + str + ")");
		} catch(e) {
			try {
				return JSON.parse(str);
			} catch(e) {
				//console.error(e);
				throw e;
			}
		}
	};
	xsJson2String = function(obj) {
		if(arguments.length == 0) {
			return undefined;
		} else if(arguments.length == 1) {
			return JSON.stringify(obj);
		} else {
			var as = new Array(arguments.length);
			for(var i = 0; i < arguments.length; i++) {
				as[i] = arguments[i];
			}
			return JSON.stringify(as);
		}

	};
	var idCount = 1991;
	//生成一个随机的id，只保证在本页面是唯一的
	function _randId(suffix) {
		var id = new Date().getTime() + "_" + parseInt(Math.random() * 100000) + "_rid" + (idCount++);
		if(suffix !== undefined) {
			id += suffix;
		}
		return id;
	};
	randId = _randId;
	try {
		window._xsloader_randid_2_ = _randId;
		var win = window;
		while(true) {
			if(win.parent && win != win.parent && win.parent._xsloader_randid_2_) {
				randId = win.parent._xsloader_randid_2_;
				win = win.parent;
			} else {
				break;
			}
		}
	} catch(e) {}

	function _startsWith(str, starts) {
		if(!(typeof str == "string")) {
			return false;
		}
		return str.indexOf(starts) == 0;
	};
	startsWith = _startsWith;

	function _endsWith(str, ends) {
		if(!(typeof str == "string")) {
			return false;
		}
		var index = str.lastIndexOf(ends);
		if(index >= 0 && (str.length - ends.length == index)) {
			return true;
		} else {
			return false;
		}
	};
	endsWith = _endsWith;

	function _indexInArray(array, ele, compare) {
		var index = -1;
		if(array) {
			for(var i = 0; i < array.length; i++) {
				if(compare) {
					if(compare(array[i], ele)) {
						index = i;
						break;
					}
				} else {
					if(array[i] == ele) {
						index = i;
						break;
					}
				}

			}
		}
		return index;
	};
	indexInArray = _indexInArray;

	function _getPathWithRelative(path, relative, isPathDir) {
		if(_startsWith(relative, "//") || _startsWith(relative, "http:") || _startsWith(relative, "https:")) {
			return relative;
		} else if(_startsWith(relative, "/")) {
			return location.protocol + "//" + location.host + relative;
		}

		var prefix = "";
		var index = -1;
		if(_startsWith(path, "http://")) {
			index = path.indexOf("/", 7);
		} else if(_startsWith(path, "https://")) {
			index = path.indexOf("/", 8);
		} else if(_startsWith(path, "//")) {
			index = path.indexOf("/", 2);
		}
		if(index == -1) {
			index = 0;
		}
		prefix = path.substring(0, index);
		path = path.substring(index);

		var stack = path.split("/");
		if(!isPathDir && stack.length > 0) {
			stack.pop();
		}
		var relatives = relative.split("/");
		for(var i = 0; i < relatives.length; i++) {
			var str = relatives[i];
			if(".." == str) {
				if(stack.length == 0) {
					throw new Error("no more upper path!");
				}
				stack.pop();
			} else if("." != str) {
				stack.push(str);
			}
		}
		if(stack.length == 0) {
			return "";
		}
		return prefix + stack.join("/");
	};
	getPathWithRelative = _getPathWithRelative;

	function toParamsMap(argsStr, decode) {
		if(!argsStr) {
			return {};
		}
		if(decode === undefined) {
			decode = true;
		}
		if(argsStr.length > 0 && argsStr.charAt(0) == "?") {
			argsStr = argsStr.substring(1);
		}
		var ret = {},
			seg = argsStr.split('&'),
			len = seg.length,
			i = 0,
			s;
		for(; i < len; i++) {
			if(!seg[i]) {
				continue;
			}
			s = seg[i].split('=');
			ret[s[0]] = decode ? decodeURIComponent(s[1]) : s[1];
		}
		return ret;
	}

	function _appendArgs2Url(url, urlArgs) {
		function replaceUrlParams(myUrl, newParams) {
			for(var x in newParams) {
				var hasInMyUrlParams = false;
				for(var y in myUrl.params) {
					if(x.toLowerCase() == y.toLowerCase()) {
						myUrl.params[y] = newParams[x];
						hasInMyUrlParams = true;
						break;
					}
				}
				//原来没有的参数则追加
				if(!hasInMyUrlParams) {
					myUrl.params[x] = newParams[x];
				}
			}
			var _result = myUrl.protocol + "://" + myUrl.host + (myUrl.port ? ":" + myUrl.port : "") + myUrl.path + "?";

			for(var p in myUrl.params) {
				_result += (p + "=" + myUrl.params[p] + "&");
			}

			if(_result.substring(_result.length - 1) == "&") {
				_result = _result.substring(0, _result.length - 1);
			}

			if(myUrl.hash != "") {
				_result += "#" + myUrl.hash;
			}
			return _result;
		}

		var index = url.lastIndexOf("?");
		var hashIndex = url.lastIndexOf("#");
		if(hashIndex < 0) {
			hashIndex = url.length;
		}
		var oldParams = index < 0 ? {} : toParamsMap(url.substring(index + 1, hashIndex), false);
		var newParams = toParamsMap(urlArgs, false);
		for(var k in newParams) {
			oldParams[k] = newParams[k];
		}

		var path = index < 0 ? url.substring(0, hashIndex) : url.substring(0, index);
		var params = [];

		for(var k in oldParams) {
			params.push(k + "=" + oldParams[k]);
		}
		params = params.join("&");
		var hash = "";
		if(hashIndex >= 0 && hashIndex < url.length) {
			hash = url.substring(hashIndex);
		}
		return path + (params ? "?" + params : "") + (hash ? hash : "");

	};
	appendArgs2Url = _appendArgs2Url;

	function _queryString2ParamsMap(argsStr, decode) {
		return toParamsMap(argsStr, decode);
	};
	queryString2ParamsMap = _queryString2ParamsMap;

	var DATA_ATTR_MODULE = 'data-xsloader-module';
	var DATA_ATTR_CONTEXT = "data-xsloader-context";
	var defContextName = "xsloader1.0.0";

	//来自于requirejs
	var head, baseElement,
		op = Object.prototype,
		ostring = op.toString,
		isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
		commentRegExp = /\/\*[\s\S]*?\*\/|([^:"'=]|^)\/\/.*$/mg,
		cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
		readyRegExp = navigator.platform === 'PLAYSTATION 3' ? /^complete$/ : /^(complete|loaded)$/;
	var IE_VERSION = getIEVersion();
	///////
	var theContext;
	var theConfig;
	var INNER_DEPS_PLUGIN = "__inner_deps__";
	var innerDepsMap = {}; //内部依赖加载插件用于保存依赖的临时map
	var globalDefineQueue = []; //在config之前，可以调用define来定义模块
	var theDefinedMap = {}; //存放原始模块
	var theLoaderScript = document.currentScript || scripts("xsloader");
	var theLoaderUrl = _getAbsolutePath(theLoaderScript);
	var currentDefineModuleQueue = []; //当前回调的模块
	currentDefineModuleQueue.peek = function() {
		if(this.length > 0) {
			return this[this.length - 1];
		}
	};
	var thePageUrl = (function() {
		var url = location.href;
		var index = url.indexOf("?");
		if(index > 0) {
			url = url.substring(0, index);
		}
		return url;
	})();

	var graphPath = new GraphPath(); //用于检测循环依赖
	var asyncCall = function(callback) {
		if(global.Promise && global.Promise.resolve) {
			global.Promise.resolve().then(callback);
		} else {
			setTimeout(callback, 0);
		}
	};
	///////////

	{
		head = document.getElementsByTagName('head')[0];
		baseElement = document.getElementsByTagName('base')[0];
		if(baseElement) {
			head = baseElement.parentNode;
		}
	}

	/////////////////////////

	function each(ary, func, isSync) {
		if(ary) {
			if(isSync) {
				function fun(index) {
					if(index >= ary.length) {
						return;
					}
					var handle = function(rs) {
						if(rs) {
							return;
						}
						fun(index + 1);
					};
					func(ary[index], index, ary, handle);
				}
				fun(0);
				return;
			}
			for(var i = 0; i < ary.length; i += 1) {
				if(func(ary[i], i, ary)) {
					break;
				}
			}
		}
	}

	//基于有向图进行循环依赖检测
	function GraphPath() {
		var pathEdges = {};
		var vertexMap = {};
		this.addEdge = function(begin, end) {
			if(!pathEdges[begin]) {
				pathEdges[begin] = [];
			}
			if(!vertexMap[begin]) {
				vertexMap[begin] = true;
			}
			if(!vertexMap[end]) {
				vertexMap[end] = true;
			}
			pathEdges[begin].push({
				begin: begin,
				end: end
			});
		};

		this.tryAddEdge = function(begin, end) {
			this.addEdge(begin, end);
			var paths = this.hasLoop();
			if(paths.length > 0) {
				pathEdges[begin].pop();
			}
			return paths;
		};

		this.hasLoop = function() {
			var visited = {};
			var recursionStack = {};

			for(var x in vertexMap) {
				visited[x] = false;
				recursionStack[x] = false;
			}

			var has = false;
			var paths = [];
			for(var name in vertexMap) {
				paths = [];
				if(checkLoop(name, visited, recursionStack, paths)) {
					has = true;
					break;
				}
			}
			return has ? paths : [];
		};

		function checkLoop(v, visited, recursionStack, paths) {
			if(!visited[v]) {
				visited[v] = true;
				recursionStack[v] = true;
				paths.push(v);

				if(pathEdges[v]) {
					var edges = pathEdges[v];
					for(var i = 0; i < edges.length; i++) {
						var edge = edges[i];
						if(!visited[edge.end] && checkLoop(edge.end, visited, recursionStack, paths)) {
							return true;
						} else if(recursionStack[edge.end]) {
							paths.push(edge.end);
							return true;
						}
					}
				}
			}
			recursionStack[v] = false;
			return false;
		}
	};

	function throwError(code, info) {
		if(xsloader.onError) {
			xsloader.onError(code, info);
		}
		throw info + ":" + code;
	}

	//Could match something like ')//comment', do not lose the prefix to comment.
	function __commentReplace(match, singlePrefix) {
		return singlePrefix || '';
	}

	function __createNode(config, moduleName, url) {
		var node = config.xhtml ?
			document.createElementNS('http://www.w3.org/1999/xhtml', 'html:script') :
			document.createElement('script');
		node.type = config.scriptType || 'text/javascript';
		node.charset = 'utf-8';
		node.async = true;
		return node;
	};

	/**
	 * context.contextName
	 * context.config
	 * callback.onScriptLoad
	 * callback.onScriptError
	 *
	 * @param {Object} context 
	 * @param {String} module
	 * @param {Array} urls
	 */
	function __browserLoader(context, module, urls, callback) {

		var moduleName = module.name;

		function load(index) {
			if(index >= urls.length) {
				return;
			}
			var url = urls[index];
			module.aurl = url;
			var config = (context && context.config) || {},
				node;
			node = __createNode(config, moduleName, url);
			node.setAttribute(DATA_ATTR_MODULE, moduleName);
			node.setAttribute(DATA_ATTR_CONTEXT, defContextName);

			if(node.attachEvent &&
				!(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
				!isOpera) {
				node.attachEvent('onreadystatechange', callback.onScriptLoad);
			} else {
				node.addEventListener('load', callback.onScriptLoad, false);
				var errListen = function() {
					__removeListener(node, errListen, 'error');
					if(index < urls.length - 1) {
						load(index + 1);
					} else {
						callback.onScriptError.apply(this, arguments);
					}
				}
				callback.errListen = errListen;
				node.addEventListener('error', errListen, false);
			}
			node.src = url;
			if(baseElement) {
				head.insertBefore(node, baseElement);
			} else {
				head.appendChild(node);
			}
		};
		if(urls.length == 0) {
			throwError(-9, "url is empty:" + moduleName);
		}
		load(0);

	};

	function scripts(subname) {
		var ss = document.getElementsByTagName('script');
		if(subname) {
			for(var i = 0; i < ss.length; i++) {
				var script = ss[i];
				var src = script.src;
				src = src.substring(src.lastIndexOf("/"));
				if(src.indexOf(subname) >= 0) {
					return script;
				}
			}
		} else {
			return ss;
		}
	}

	function _newContext(contextName) {
		var context = {
			contextName: contextName,
			defQueue: []
		};
		return context;
	};

	function __removeListener(node, func, name, ieName) {
		if(node.detachEvent && !isOpera) {
			if(ieName) {
				node.detachEvent(ieName, func);
			}
		} else {
			node.removeEventListener(name, func, false);
		}
	}

	function __getScriptData(evt, callbackObj) {

		var node = evt.currentTarget || evt.srcElement;
		__removeListener(node, callbackObj.onScriptLoad, 'load', 'onreadystatechange');
		__removeListener(node, callbackObj.errListen, 'error');
		return {
			node: node,
			name: node && node.getAttribute(DATA_ATTR_MODULE)
		};
	}

	function _onScriptComplete(moduleName, cache, aurl) {
		if(theDefinedMap[moduleName] &&
			theDefinedMap[moduleName].state != 'loading' &&
			theDefinedMap[moduleName].state != 'init') {
			throwError(-2, "already define '" + moduleName + "'");
		}

		var context = theContext;
		var data = cache.data;
		var deps = cache.deps;
		var callback = cache.callback;
		var thenOption = cache.thenOption;
		cache.name = moduleName || cache.name;

		var module = theDefinedMap[moduleName] ? theDefinedMap[moduleName] : _newModule(moduleName, null, callback, thenOption.thatInvoker);
		deps = cache.deps = module.mayAddDeps(deps);

		if(cache.name && xsloader._ignoreAspect_[cache.name] || cache.selfname && xsloader._ignoreAspect_[cache.selfname]) {
			module.ignoreAspect = true;
		}

		if(cache.selfname && cache.selfname != cache.name) {
			var moduleSelf = theDefinedMap[cache.selfname];
			if(moduleSelf) {
				if(moduleSelf.state == "init") {
					theDefinedMap[cache.selfname] = module;
					moduleSelf.toOtherModule(module);
				} else {
					throwError(-2, "already define '" + cache.selfname + "'");
				}
			} else {
				theDefinedMap[cache.selfname] = module;
			}
		}
		module.aurl = aurl;
		module.setState("loaded");
		module.callback = callback;
		module.setInstanceType(thenOption.instance || theConfig.instance);

		if(!module.aurl && data.isRequire) {
			module.aurl = theLoaderUrl;
		}

		if(deps.length == 0) {
			if(aurl) { //绑定绝对路径
				theDefinedMap[aurl] = module;
			}
			module.finish([]); //递归结束
		} else {

			for(var i = 0; i < deps.length; i++) {
				var dep = deps[i];
				if(isArray(dep)) {
					//内部的模块顺序加载
					var modName = "inner_order_" + randId();
					var isOrderDep = !(dep.length > 0 && dep[0] === false);
					if(dep.length > 0 && (dep[0] === false || dep[0] === true)) {
						dep = dep.slice(1);
					}
					innerDepsMap[modName] = {
						deps: dep,
						orderDep: isOrderDep
					};
					deps[i] = INNER_DEPS_PLUGIN + "!" + modName;
				}
			}
			_everyRequired(data, thenOption, module, deps, function(depModules) {
				var args = [];
				var depModuleArgs = [];
				each(depModules, function(depModule) {
					depModuleArgs.push(depModule);
					args.push(depModule && depModule.moduleObject());
				});
				if(aurl) { //绑定绝对路径
					theDefinedMap[aurl] = module;
				}
				args.push(depModuleArgs);
				module.finish(args);
			}, function(isError) {
				thenOption.onError(isError);
			});
		}

	};

	function _replaceModulePrefix(config, deps) {

		for(var i = 0; i < deps.length; i++) {
			var m = deps[i];
			var pluginIndex = m.indexOf("!");
			var pluginParam = pluginIndex > 0 ? m.substring(pluginIndex) : "";
			m = pluginIndex > 0 ? m.substring(0, pluginIndex) : m;
			var isJsFile = _endsWith(m, ".js");
			if(!isJsFile && (_startsWith(m, ".") || _startsWith(m, "/") || _startsWith(m, "https:") || _startsWith(m, "http:"))) {
				deps[i] = m + ".js" + pluginParam;
			}
		}

		if(config.modulePrefixCount) {
			//前缀替换
			for(var prefix in config.modulePrefix) {
				var replaceStr = config.modulePrefix[prefix].replace;
				var len = prefix.length;
				for(var i = 0; i < deps.length; i++) {
					var m = deps[i];
					var pluginIndex = m.indexOf("!");
					var pluginName = null;
					if(pluginIndex >= 0) {
						pluginName = m.substring(0, pluginIndex + 1);
						m = m.substring(pluginIndex + 1);
					}
					if(_startsWith(m, prefix)) {
						var dep = replaceStr + m.substring(len);
						deps[i] = pluginName ? pluginName + dep : dep;
					}
				}
			}
		}
	}

	//callback(depModules)
	function _everyRequired(data, thenOption, module, deps, callback, errCallback) {

		if(data.isError) {
			return;
		}

		var config = theConfig;
		var context = theContext;

		_replaceModulePrefix(config, deps); //前缀替换

		for(var i = 0; i < deps.length; i++) {
			var m = deps[i];
			if(module.aurl) { //替换相对路径为绝对路径
				var isJsFile = _endsWith(m, ".js");
				if(isJsFile && _startsWith(m, ".")) {
					m = _getPathWithRelative(module.aurl, m);
					deps[i] = m;
				}
			}
			var paths = graphPath.tryAddEdge(module.name, m);
			if(paths.length > 0) {
				var errinfo = "loop dependency:" + paths.join(" --> ");
				errCallback(errinfo);
				return;
				//throwError(-6, errinfo);
			}
		}

		var isError = false,
			hasCallErr = false,
			theExports;
		var depCount = deps.length;
		module.jsScriptCount = 0;
		var depModules = new Array(depCount);

		function checkFinish(index, dep, depModule, syncHandle) {
			depModules[index] = depModule;

			if((depCount == 0 || depCount - module.jsScriptCount == 0) && !isError) {
				callback(depModules);
			} else if(isError) {
				module.setState('error', isError);
				if(!hasCallErr) {
					hasCallErr = true;
					errCallback(isError);
				}
			}!isError && syncHandle && syncHandle();
		}

		each(deps, function(dep, index, ary, syncHandle) {
			var pluginArgs = undefined;
			var pluginIndex = dep.indexOf("!");
			if(pluginIndex > 0) {
				pluginArgs = dep.substring(pluginIndex + 1);
				dep = dep.substring(0, pluginIndex);
			}
			var relyItFun = function() {
				theDefinedMap[dep].relyIt(thenOption.thatInvoker || module.thiz, function(depModule, err) {
					if(!err) {
						depCount--;
						if(dep == "exports") {
							if(theExports) {
								module.moduleObject = theExports;
							} else {
								theExports = module.moduleObject = depModule.genExports();
							}
						}
					} else {
						isError = err;
					}
					checkFinish(index, depModule.name, depModule, syncHandle);
				}, pluginArgs);
			};

			var isJsFile = _endsWith(dep, ".js");
			if(!theDefinedMap[dep]) {
				do {

					var willDelay = false;
					var urls;
					var _deps = config.getDeps(dep);

					if(!isJsFile && dep.indexOf("/") < 0 && dep.indexOf(":") >= 0) {
						var i1 = dep.indexOf(":");
						var i2 = dep.indexOf(":", i1 + 1);
						var i3 = i2 > 0 ? dep.indexOf(":", i2 + 1) : -1;
						if(i2 == -1) {
							isError = "illegal module:" + dep;
							errCallback(isError);
							break;
						}
						var version;
						var groupModule;
						if(i3 == -1) {
							version = config.defaultVersion[dep];
							groupModule = dep + ":" + version;
						} else {
							version = dep.substring(i3 + 1);
							groupModule = dep;
						}
						if(version === undefined) {
							isError = "unknown version for:" + dep;
							errCallback(isError);
							break;
						}
						var _url = xsloader._resUrlBuilder(groupModule);
						urls = isArray(_url) ? _url : [_url];
					} else if(config.isInUrls(dep)) {
						urls = config.getUrls(dep);
						isJsFile = true;
					} else if(isJsFile) {
						urls = [dep];
					} else {
						willDelay = true; //延迟加载
					}

					var module2 = _newModule(dep, _deps, null);
					module2.invoker = thenOption.thatInvoker || module.thiz;
					if(willDelay && _deps.length == 0) {
						break;
					}
					module2.aurl = urls[0];

					if(_deps.length > 0) {
						_everyRequired(data, thenOption, module2, _deps, function(depModules) {
							var args = [];
							var hasExports = false;
							each(depModules, function(depModule) {
								args.push(depModule.moduleObject());
							});
							mayAsyncCallLoadScript();
						}, function(err) {
							isError = err;
							errCallback(err);
						});
					} else {
						mayAsyncCallLoadScript();
					}

					function mayAsyncCallLoadScript() {
						loadScript();
					};

					function loadScript() {
						var callbackObj = {
							module: module2
						};
						callbackObj.onScriptLoad = function(evt) {
							if(callbackObj.removed) {
								return;
							}
							if(evt.type === 'load' ||
								(readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {

								//TODO STRONG 直接认定队列里的模块全来自于该脚本
								var scriptData = __getScriptData(evt, callbackObj);
								callbackObj.removed = true;
								var hasAnonymous = false;
								var defQueue = context.defQueue;
								context.defQueue = [];
								var defineCount = defQueue.length;

								for(var i2 = 0; i2 < defQueue.length; i2++) {
									var cache = defQueue[i2];
									//									console.log(cache);
									//									console.log(scriptData);
									//									console.log("*************************:" + defQueue.length + ",ie=" + IE_VERSION + ",syncHandle=" + (typeof syncHandle));

									var isCurrentScriptDefine = true;
									scriptData.node.src;
									if(hasAnonymous || !isCurrentScriptDefine) {
										if(!cache.name) {
											var errinfo = "multi anonymous define in a script:" + (scriptData.node && scriptData.node.src) + "," + (cache.callback && cache.callback.originCallback || cache.callback);
											isError = errinfo;
											checkFinish(index, undefined, undefined, syncHandle);
											throwError(-10, errinfo);
										}
									} else {
										hasAnonymous = !cache.name;
									}

									var parentDefine = cache.data.parentDefine;
									if(parentDefine) {
										defineCount--;
									}
									var aurl = cache.src;
									if(isCurrentScriptDefine) {
										if(cache.src == theLoaderUrl) {
											aurl = _getAbsolutePath(scriptData.node); //获取脚本地址
										} else {
											aurl = cache.src || _getAbsolutePath(scriptData.node); //获取脚本地址
										}
									}

									if(aurl) {
										var i = aurl.indexOf("?");
										if(i >= 0) {
											aurl = aurl.substring(0, i);
										}
									}
									//对于只有一个define的脚本，优先使用外部指定的模块名称、同时也保留define提供的名称。
									if(defineCount == 1 && !parentDefine) {
										var name = scriptData.name || cache.name;
										cache.selfname = cache.name;
										cache.name = name;
									} else {
										cache.name = cache.name || scriptData.name;
									}

									//TODO STRONG 对应的脚本应该是先执行
									_onScriptComplete(cache.name, cache, aurl);
								}

								if(defineCount == 0) { //用于支持没有define的js库
									module.jsScriptCount++;
									checkFinish(index, scriptData.name, undefined, syncHandle);
								}

							}
						};
						callbackObj.onScriptError = function(evt) {
							if(callbackObj.removed) {
								return;
							}
							var scriptData = __getScriptData(evt, callbackObj);
							callbackObj.removed = true;
							var errinfo = "load module '" + scriptData.name + "' error:" + xsJson2String(evt);
							isError = errinfo;
							errCallback(errinfo);
						};
						theDefinedMap[dep].setState("loading");
						each(urls, function(url, index) {
							if(_startsWith(url, "https:") || _startsWith(url, "http:") || _startsWith(url, "//")) {
								url = url;
							} else if(_startsWith(url, ".") || _startsWith(url, "/") || _startsWith(url, "https:") || _startsWith(url, "http:")) {
								if(!module.aurl) {
									isError = "script url is null:'" + module.name + "'," + module.callback;
									throwError(-11, isError);
								}
								url = _getPathWithRelative(module.aurl, url);
							} else {
								url = config.baseUrl + url;
							}
							urls[index] = config.dealUrl(thenOption.thatInvoker && thenOption.thatInvoker.getName() || module2, url);
						});
						__browserLoader(context, module2, urls, callbackObj);
					}

				} while (false);
			}
			relyItFun();
		}, thenOption.orderDep || IE_VERSION > 0 && IE_VERSION <= 10);
		//TODO STRONG ie10及以下版本，js文件一个一个加载，从而解决缓存等造成的混乱问题
	}

	function _clone(obj, isDeep) {
		// Handle the 3 simple types, and null or undefined or function
		if(!obj || isFunction(obj) || isString(obj)) return obj;

		if(isRegExp(obj)) {
			return new RegExp(obj.source, obj.flags);
		}

		// Handle Date
		if(isDate(obj)) {
			var copy = new Date();
			copy.setTime(obj.getTime());
			return copy;
		}
		// Handle Array or Object
		if(isArray(obj) || isObject(obj)) {
			var copy = isArray(obj) ? [] : {};
			for(var attr in obj) {
				if(obj.hasOwnProperty(attr))
					copy[attr] = isDeep ? _clone(obj[attr]) : obj[attr];
			}
			return copy;
		}
		return obj;
		//throw new Error("Unable to clone obj[" + (typeof obj) + "]:" + obj);
	}

	function _buildInvoker(obj, name) {
		var invoker = obj[name || "thiz"];
		invoker.getUrl = function(relativeUrl, appendArgs) {
			var url;
			if(relativeUrl === undefined) {
				url = this.getAbsoluteUrl();
			} else if(_startsWith(relativeUrl, ".") ||
				_startsWith(relativeUrl, "/") ||
				_startsWith(relativeUrl, "http:") || _startsWith(relativeUrl, "https:")) {
				url = _getPathWithRelative(this.getAbsoluteUrl(), relativeUrl);
			} else {
				url = theConfig.baseUrl + relativeUrl;
			}
			if(appendArgs) {
				return theConfig.dealUrl(this.getName(), url);
			} else {
				return url;
			}
		};
		invoker.require = function() {
			return require.apply(invoker, arguments);
		};
	};

	function _newDepModule(module, thatInvoker, relyCallback, pluginArgs) {
		var depModule = {
			callback: relyCallback,
			_invoker: thatInvoker,
			_module_: null,
			initInvoker: function() {
				//确保正确的invoker
				if(module.ignoreAspect) {
					return;
				}
				var obj = this._object;
				var invoker = this._invoker
				var that = this;

				function addTheAttrs(theObj) {
					theObj._invoker_ = invoker;
					if(theObj._module_) {
						theObj._modules_ = theObj._modules_ || [];
						theObj._modules_.push(theObj._module_);
					}
					theObj._module_ = that._module_;
					return theObj;
				}

				var isSingle = module.instanceType != "clone";

				if(isObject(obj)) {
					this._object = addTheAttrs(isSingle ? obj : _clone(obj));
				} else if(isFunction(obj)) {
					var fun = (function(originFun) {
						var f = function() {
							return originFun.apply(invoker, arguments);
						};
						return f;
					})(obj);
					for(var x in obj) {
						fun[x] = obj[x];
					}
					this._object = fun;
				}

			},
			_object: null,
			_setDepModuleObjectGen: function(obj) {
				this._object = obj;
				this.initInvoker();
			},
			module: module,
			moduleObject: function() {
				return this._object;
			},
			genExports: function() {
				this._setDepModuleObjectGen({});
				return this._object;
			},
			init: function() {
				var that = this;
				var relyCallback = this.callback;
				this._module_ = module.dealInstance(this);
				this._setDepModuleObjectGen(module.moduleObject);
				if(pluginArgs !== undefined) {
					var that = this;
					var onload = function(result, ignoreAspect) {
						module.ignoreAspect = ignoreAspect === undefined || ignoreAspect;
						that._setDepModuleObjectGen(result);
						relyCallback(that);
					};
					var onerror = function(err) {
						relyCallback(that, err || false);
					};
					var args = [pluginArgs, onload, onerror, theConfig].concat(module.depModules);
					try {
						that._object.pluginMain.apply(this.thiz, args);
					} catch(e) {
						console.log(e);
						onerror(e);
					}
				} else {
					relyCallback(this);
				}
			},
			thiz: {
				getAbsoluteUrl: function() {
					return module.thiz.getAbsoluteUrl();
				},
				getName: function() {
					return module.thiz.getName();
				},
				invoker: function() {
					return depModule._invoker;
				}
			}
		};
		_buildInvoker(depModule);
		return depModule;
	}

	function _newModule(name, deps, callback, thatInvoker) {
		var relys = [];
		var moduleMap = {
			name: name,
			deps: deps || [],
			ignoreAspect: false,
			depModules: null,
			aurl: null, //绝对路径,可能等于当前页面路径
			callback: callback,
			moduleObject: undefined, //依赖模块对应的对象
			invoker: thatInvoker,
			instances: [], //所有模块实例
			instanceType: "single",
			setInstanceType: function(instanceType) {
				this.instanceType = instanceType;
			},
			finish: function(args, depModuleArgs) {
				this.depModules = args;
				var obj;
				if(isFunction(this.callback)) {
					try {
						currentDefineModuleQueue.push(this);
						obj = this.callback.apply(this.thiz, args);
						currentDefineModuleQueue.pop();
					} catch(e) {
						currentDefineModuleQueue.pop();
						console.log(e);
						this.setState("error", e);
						return;
					}
				} else {
					obj = this.callback;
					if(this.moduleObject !== undefined) {
						console.log("ignore moudule named '" + moduleMap.name + "':" + obj);
					}
				}
				if(this.moduleObject === undefined) { //用于支持exports
					this.moduleObject = obj;
				}
				this.setState("defined");
			},
			state: "init", //init,loading,loaded,defined,error,
			errinfo: null,
			_callback: function(fun) {
				var _state = this.state;
				if(_state == 'defined') {

					if(fun) {
						var depModule = _newDepModule(this, fun.thatInvoker, fun.relyCallback, fun.pluginArgs);
						depModule.init();
					}
					return false;
				} else if(_state == "timeout" || _state == "error") {
					if(fun) {
						fun.relyCallback(this, this.errinfo);
					}
					return false;
				} else {
					return true;
				}
			},
			setState: function(_state, errinfo) {
				this.state = _state;
				this.errinfo = errinfo;
				if(!this._callback()) {
					while(relys.length) {
						var fun = relys.shift();
						this._callback(fun);
					}
				}
			},
			toOtherModule: function(otherModule) {
				var theRelys = relys;
				relys = [];
				while(theRelys.length) {
					var fun = theRelys.shift();
					otherModule.relyIt(fun.thatInvoker, fun.relyCallback, fun.pluginArgs);
				}
			},
			/**
			 * 
			 * @param {Object} thatInvoker
			 * @param {Object} callbackFun function(depModule,err)
			 * @param {Object} pluginArgs
			 */
			relyIt: function(thatInvoker, callbackFun, pluginArgs) {
				var fun = {
					thatInvoker: thatInvoker,
					relyCallback: callbackFun,
					pluginArgs: pluginArgs
				};
				if(this._callback(fun)) {
					relys.push(fun);
				}
			},
			thiz: {
				getAbsoluteUrl: function() {
					return moduleMap.aurl;
				},
				getName: function() {
					return moduleMap.name;
				},
				invoker: function() {
					return moduleMap.invoker;
				}
			}
		};

		//返回_module_
		moduleMap.dealInstance = function(moduleInstance) {
			this.instances.push(moduleInstance);
			var _module_ = {
				opId: null,
				setToAll: function(name, value, opId) {
					if(opId !== undefined && opId == this.opId) {
						return; //防止循环
					}
					opId = opId || randId();
					this.opId = opId;

					var obj = {};
					if(isString(name)) {
						obj[name] = value;
					} else if(isObject(name)) {
						for(var k in name) {
							obj[k] = name[k];
						}
					} else {
						throw new Error("unknown param:" + name);
					}

					each(moduleMap.instances, function(ins) {
						var mobj = ins.moduleObject();
						for(var k in obj) {
							mobj[k] = obj[k];
						}
						if(mobj._modules_) {
							each(mobj._modules_, function(_m_) {
								_m_.setToAll(name, value, opId);
							});
						}
					});
				}

			};

			return _module_;
		};

		//添加到前面
		moduleMap.mayAddDeps = function(deps) {
			var moduleDeps = this.deps;
			each(moduleDeps, function(dep) {
				if(indexInArray(deps, dep) < 0) {
					deps.push(dep);
				}
			});
			this.deps = deps;
			return deps;
		};
		moduleMap.printOnNotDefined = function() {
			var root = {
				nodes: []
			};
			this._printOnNotDefined(root);

			var leafs = [];

			function findLeaf(node) {
				if(node.nodes.length) {
					each(node.nodes, function(item) {
						findLeaf(item);
					});
				} else {
					leafs.push(node);
				}
			}
			findLeaf(root);

			function genErrs(node, infos) {
				infos.push(node.err);
				if(node.parent) {
					genErrs(node.parent, infos);
				}
			}
			each(leafs, function(leaf) {
				var infos = [];
				genErrs(leaf, infos);
				console.error("load module error stack:" + infos.reverse().join("-->"));
			});

		};
		moduleMap._printOnNotDefined = function(parentNode) {
			if(this.state == "defined") {
				return;
			}
			var node = {
				err: "[" + this.name + "].state=" + this.state,
				parent: parentNode,
				nodes: []
			};
			parentNode.nodes.push(node);

			each(this.deps, function(dep) {
				var mod = theDefinedMap[dep];
				if(mod && mod.state == "defined") {
					return;
				}
				//只打印一个错误栈
				if(mod) {
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
		theDefinedMap[name] = moduleMap;
		_buildInvoker(moduleMap);
		return moduleMap;
	}

	function _appendInnerDeps(deps, callback) {
		if(isFunction(callback)) {
			callback
				.toString()
				.replace(commentRegExp, __commentReplace)
				.replace(cjsRequireRegExp, function(match, dep) {
					deps.push(dep);
				});
		}
	}

	//使得内部的字符串变成数组
	function _strValue2Arr(obj) {
		if(!obj || isArray(obj)) {
			return;
		}
		for(var x in obj) {
			if(isString(obj[x])) {
				obj[x] = [obj[x]];
			}
		}
	}

	function _getCurrentScriptSrc() {
		function getCurrentScriptSrc() { //兼容获取正在运行的js
			//取得正在解析的script节点
			if(document.currentScript !== undefined) { //firefox 4+
				return document.currentScript && document.currentScript.src || "";
			}
			var nodes = document.getElementsByTagName("script"); //只在head标签中寻找
			for(var i = 0, node; node = nodes[i++];) {
				if(node.readyState === "interactive") {
					return node.src;
				}
			}
			var stack, i;
			try {
				a.b.c(); //强制报错,以便捕获e.stack
			} catch(e) { //safari的错误对象只有line,sourceId,sourceURL
				stack = e.stack;
				if(!stack && window.opera) {
					//opera 9没有e.stack,但有e.Backtrace,但不能直接取得,需要对e对象转字符串进行抽取
					stack = (String(e).match(/of linked script \S+/g) || []).join(" ");
				}
			}
			if(stack) {
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
				return s;
			}
		}

		var src = getCurrentScriptSrc();
		if(src === '') {
			src = thePageUrl;
		}
		if(src) {
			var index = src.indexOf("?");
			if(index > 0) {
				src = src.substring(0, index);
			}
		}
		return src;

	};

	function _getAbsolutePath(node) {
		var src = node.src;
		return _getPathWithRelative(location.href, src);
	}

	//then.{}.thatInvoker用于修改模块的invoker对象
	var _define = function(data, name, deps, callback, src) {

		if(typeof name !== 'string') {
			callback = deps;
			deps = name;
			name = null;
		}

		if(!isArray(deps)) {
			callback = deps;
			deps = null;
		}

		if(!deps) {
			deps = [];
		}

		_appendInnerDeps(deps, callback);

		var context = theContext;

		if(isFunction(callback)) {
			var originCallback = callback;
			callback = function() {
				var config = theConfig;
				var rt;
				if(isFunction(config.defineFunction[cache.name])) {
					var args = [];
					for(var i = 0; i < arguments.length; i++) {
						args.push(arguments[i]);
					}
					rt = config.defineFunction[cache.name].apply(this, [originCallback, this, args]);
				} else {
					rt = originCallback.apply(this, arguments);
				}

				originCallback = null;
				return rt;
			};
			callback.originCallback = originCallback;

		}

		var customOnError;
		var onError = function(isErr) {
			data.isError = isErr;
			if(customOnError) {
				customOnError(isErr);
			} else if(xsloader.onError) {
				xsloader.onError(-17, isErr);
			} else {
				console.error(isErr);
			}
		}
		var cache = {
			data: data,
			name: name,
			deps: deps,
			callback: callback,
			thenOption: {
				onError: onError
			},
			src: src
		};
		var handle = {
			then: function(thenOption) {
				customOnError = thenOption.onError;
				thenOption.onError = undefined;
				cache.thenOption = xsloader.extend(cache.thenOption, thenOption);
			}
		};
		if(context) {
			cache.src = src || _getCurrentScriptSrc(cache) || null;

			try {
				if(cache.src) {
					var node = document.currentScript;
					if(node && node.getAttribute(DATA_ATTR_CONTEXT) != defContextName && cache.src != theLoaderUrl && cache.src != thePageUrl) {
						console.error("unknown js script module:" + xsJson2String(cache));
						console.error(node);
						return;
					}
				}
			} catch(e) {

			}

			if(data.isRequire || data.isNow) {
				asyncCall(function() {
					_onScriptComplete(name, cache, cache.src);
				});
			} else if(data.isGlobal) {
				_onScriptComplete(name, cache, cache.src);
			} else {
				context.defQueue.push(cache);
			}

		} else {
			if(!name) {
				throwError(-14, "global module can not be anonymous!");
			}
			globalDefineQueue.push(cache);
		}
		return handle;
	};

	function _propertiesDeal(configObject, properties) {

		if(!properties) {
			return configObject;
		}

		var REPLACE_STRING_PROPERTIES_EXP = new RegExp("\\$\\{([^\\{]+)\\}");
		var ALL_TYPE_PROPERTIES_EXP = new RegExp("^\\$\\[([^\\[\\]]+)\\]$");

		function replaceStringProperties(string, properties, property) {
			var rs;
			var str = string;
			rs = ALL_TYPE_PROPERTIES_EXP.exec(str);
			if(rs) {
				var propKey = rs[1];
				var propValue = properties[propKey];
				if(propValue === undefined) {
					return str;
				} else {
					return propValue;
				}
			}

			var result = "";
			while(true) {
				rs = REPLACE_STRING_PROPERTIES_EXP.exec(str);
				if(!rs) {
					result += str;
					break;
				} else {
					var propKey = rs[1];
					if(property !== undefined && property.propertyKey == propKey) {
						throw new Error("replace property error:propertyKey=" + propKey);
					} else if(property) {
						property.has = true;
					}
					result += str.substring(0, rs.index-1);
					result += properties[propKey];
					str = str.substring(rs.index + rs[0].length);
				}
			}
			return result;
		}

		//处理属性引用
		function replaceProperties(obj, property) {
			if(!obj) {
				return obj;
			}
			if(isFunction(obj)) {
				if(property) {
					return replaceProperties(obj.call(properties), property);
				} else {
					return obj;
				}
			} else if(isArray(obj)) {
				for(var i = 0; i < obj.length; i++) {
					obj[i] = replaceProperties(obj[i], property);
				}
			} else if(isString(obj)) {
				obj = replaceStringProperties(obj, properties, property);
			} else if(isObject(obj)) {
				if(property) {
					property.has = false;
				}
				for(var x in obj) {
					if(property) {
						//						if(typeof obj[x] !== "string") {
						//							throw new Error("property " + x + " only can be string!");
						//						}
						property.propertyKey = x;
					}
					obj[x] = replaceProperties(obj[x], property);
				}
			}

			return obj;

		}

		if(!properties.__dealt__) {
			var property = {
				has: false
			};
			do {
				replaceProperties(properties, property);
			} while (property.has);
			properties.__dealt__ = true;
		}

		return replaceProperties(configObject);
	}

	define = function(name, deps, callback) {
		var data = {
			parentDefine: currentDefineModuleQueue.peek()
		};
		return _define(data, name, deps, callback);
	};
	define.amd = true;
	define("exports", function() {});

	require = function(deps, callback) {
		var context = theContext;
		if(!context) { //require必须是在config之后
			throwError(-1, "not init,see 'xsloader({})'");
		}
		var thatInvoker = this && isFunction(this.invoker) && isFunction(this.getName) && isFunction(this.getUrl) && isFunction(this.getAbsoluteUrl) ? this : null;
		if(isString(deps)) {
			var module = theDefinedMap[deps];
			if(!module) {
				throwError(-12, "the module '" + deps + "' is not load!");
			} else if(module.state != "defined") {
				throwError(-12, "the module '" + deps + "' is not defined:" + module.state);
			}
			var theMod;
			_newDepModule(module, thatInvoker, function(depModule) {
				theMod = depModule.moduleObject();
			}).init();
			return theMod;
		}

		if(isFunction(deps)) {
			callback = deps;
			deps = [];
		}
		_appendInnerDeps(deps, callback);

		var customOnError;
		var isError;
		var data = {
			isRequire: true
		};
		var onError = function(isErr) {
			data.isError = isErr;
			isError = isErr;
			if(customOnError) {
				customOnError(isErr);
			}
		}
		var _thenOption = {
			onError: onError
		};
		var handle = {
			then: function(thenOption) {
				customOnError = thenOption.onError;
				thenOption.onError = undefined;
				_thenOption = xsloader.extend(_thenOption, thenOption);
			}
		};
		var moduleName = _randId("_require");
		var src = _getCurrentScriptSrc();

		var timeid;
		asyncCall(function() {
			if(thatInvoker) {
				src = thatInvoker.getUrl();
			}

			_define(data, moduleName, deps, function() {
				if(timeid !== undefined) {
					clearTimeout(timeid);
				}
				if(isFunction(callback)) {
					callback.apply(this, arguments);
				}
			}, src).then({
				onError: function(isError) {
					_thenOption.onError(isError);
				},
				orderDep: _thenOption.orderDep,
				thatInvoker: thatInvoker
			});
		});
		timeid = setTimeout(function() {
			if(!theDefinedMap[moduleName] || theDefinedMap[moduleName].state != 'defined' && !isError) {
				var module = theDefinedMap[moduleName];
				if(module) {
					each(module.deps, function(dep) {
						theDefinedMap[dep] && theDefinedMap[dep].printOnNotDefined();
					});
				}
				console.error("require timeout:'" + deps + "'," + callback);
			}
		}, theConfig.waitSeconds * 1000);

		return handle;
	};
	require.has = function() {
		var args = arguments;
		if(args.length == 0) {
			return false;
		}
		for(var i = 0; i < args.length; i++) {
			var module = theDefinedMap[args[i]];
			if(!module || module.state != "defined") {
				return false;
			}
		}
		return true;
	};

	/**
	 * 进行配置
	 * @param {Object} option
	 */
	xsloader = function(option) {
		if(theContext) {
			throwError(-1, "already configed!");
		}
		option = xsloader.extend({
			baseUrl: _getPathWithRelative(location.pathname, "./", _endsWith(location.pathname, "/")),
			urlArgs: {},
			ignoreProperties: false,
			paths: {},
			depsPaths: {},
			deps: {},
			properties: {},
			modulePrefix: {},
			defineFunction: {},
			modulePrefixCount: 0,
			waitSeconds: 10,
			autoUrlArgs: function() {
				return false;
			},
			instance: "single",
			dealtDeps: {},
			dealProperties: function(obj) {
				return _propertiesDeal(obj, option.properties);
			},
			isInUrls: function(m) {
				return !!this.getUrls(m);
			},
			getUrls: function(m) {
				return this.paths[m] || this.depsPaths[m];
			},
			getDeps: function(m) {
				var as = this.dealtDeps[m] || [];
				var deps = new Array(as.length);
				for(var i = 0; i < as.length; i++) {
					deps[i] = as[i];
				}
				return deps;
			},
			dealUrl: function(module, url) {
				var urlArg = this.autoUrlArgs() ? "_t=" + new Date().getTime() : this.urlArgs[isString(module) && module || module && module.name || "*"] || this.urlArgs["*"];
				return _appendArgs2Url(url, urlArg);
			},
			defaultVersion: {}
		}, option);
		if(!option.ignoreProperties) {
			option = option.dealProperties(option);
		}
		_strValue2Arr(option.paths);
		_strValue2Arr(option.depsPaths);
		_strValue2Arr(option.deps);
		if(!_endsWith(option.baseUrl, "/")) {
			option.baseUrl += "/";
		}
		if(!isFunction(option.autoUrlArgs)) {
			var isAutoUrlArgs = option.autoUrlArgs;
			option.autoUrlArgs = function() {
				return isAutoUrlArgs;
			};
		}

		var modulePrefixCount = 0;
		for(var prefix in option.modulePrefix) {
			if(_startsWith(prefix, ".") || _startsWith(prefix, "/")) {
				throwError(-16, "modulePrefix can not start with '.' or '/'(" + prefix + ")");
			}
			modulePrefixCount++;
		}
		option.modulePrefixCount = modulePrefixCount;

		for(var name in option.paths) {
			_replaceModulePrefix(option, option.paths[name]); //前缀替换
		}
		for(var name in option.depsPaths) {
			_replaceModulePrefix(option, option.depsPaths[name]); //前缀替换
		}

		//处理依赖
		var dealtDeps = option.dealtDeps;

		for(var keyName in option.deps) {
			var paths = keyName.split('::');
			var depsArray = option.deps[keyName];
			each(paths, function(path) {
				if(path == '*') {
					for(var m in option.depsPaths) {
						var dealtDepArray = dealtDeps[m] = dealtDeps[m] || [];
						each(depsArray, function(dep) {
							if(option.depsPaths[dep]) {
								dealtDepArray.push(dep);
								throwError(-8, "loop dependency error:" + dep + "=" + dealtDepArray.join("-->"));
							}
							dealtDepArray.push(dep);
						});
					}
				} else {
					var dealtDepArray = dealtDeps[path] = dealtDeps[path] || [];
					each(depsArray, function(dep) {
						if(option.depsPaths[dep]) {
							dealtDepArray.push(dep);
							throwError(-8, "loop dependency error:" + dep + "=" + dealtDepArray.join("-->"));
						}
						dealtDepArray.push(dep);
					});
				}
			});
		}

		theConfig = option;
		theContext = _newContext(defContextName);
		var arr = globalDefineQueue;
		globalDefineQueue = null;
		//定义config之前的模块
		each(arr, function(elem) {
			elem.data.isGlobal = true;
			_define(elem.data, elem.name, elem.deps, elem.callback, elem.src).then(elem.thenOption);
		});
	};
	xsloader.define=define;
	xsloader.require=require;
	xsloader.randId=randId;
	xsloader.tryCall = function(fun, defaultReturn) {
		var rs;
		try {
			rs = fun();
		} catch(e) {
			console.log(e);
		}
		if(rs === undefined || rs === null) {
			rs = defaultReturn;
		}
		return rs;
	};

	xsloader.IE_VERSION = IE_VERSION;

	//用于把"group:project:version"转换成url地址,返回一个String或包含多个url地址的数组
	xsloader._resUrlBuilder = function(groupName) {
		throwError(-22, 'resUrlBuilder not found!');
	};
	xsloader.dealProperties = function(obj, properties) {
		return _propertiesDeal(obj, properties);
	};

	xsloader.clear_module_ = function() {
		var modules = arguments;
		for(var i = 0; i < modules.length; i++) {
			if(modules[i]) {
				delete modules[i]._module_;
				delete modules[i]._modules_;
			}
		}
	}

	xsloader.extend = function(target) {
		for(var i = 1; i < arguments.length; i++) {
			var obj = arguments[i];
			if(!obj) {
				continue;
			}
			for(var x in obj) {
				var value = obj[x];
				if(value === undefined) {
					continue;
				}
				target[x] = obj[x];
			}
		}
		return target;
	};

	xsloader.extendDeep = function(target) {
		if(!target) {
			return target;
		}
		for(var i = 1; i < arguments.length; i++) {
			var obj = arguments[i];
			if(!obj) {
				continue;
			}

			for(var x in obj) {
				var value = obj[x];
				if(value === undefined) {
					continue;
				}
				if(isObject(value) && isObject(target[x])) {
					target[x] = xsloader.extendDeep(target[x], value);
				} else {
					target[x] = obj[x];
				}
			}
		}
		return target;
	};

	xsloader.config = function() {
		return theConfig;
	};
	xsloader.script = function() {
		return theLoaderScript;
	};
	xsloader.clone = _clone;
	xsloader.isArray = isArray;
	xsloader.isString = isString;
	xsloader.isObject = isObject;
	xsloader.isDate = isDate;
	xsloader.isRegExp = isRegExp;
	xsloader.isFunction = isFunction;
	xsloader.asyncCall = asyncCall;

	(function() { //TODO STRONG 内部依赖加载插件
		define(INNER_DEPS_PLUGIN, {
			pluginMain: function(depId, onload, onerror, config, http) {
				var depsObj = innerDepsMap[depId];
				var deps = depsObj.deps;
				delete innerDepsMap[depId];
				this.invoker().require(deps, function() {
					var args = [];
					for(var k = 0; k < arguments.length; k++) {
						args.push(arguments[k]);
					}
					onload(args);
				}).then({
					orderDep: depsObj.orderDep
				});
			}
		});
	})();

	/**
	 * 格式:name!moduleName=>>modulePath
	 */
	(function() { //TODO STRONG name插件
		define("name", {
			pluginMain: function(arg, onload, onerror, config, http) {
				var index = arg.indexOf("=>>");
				if(index == -1) {
					onerror("expected:=>>");
					return;
				}
				var moduleName = arg.substring(0, index);
				var dep = arg.substring(index + 3);
				this.invoker().require([dep], function(mod, depModuleArgs) {

					if(theDefinedMap[moduleName]) {
						onerror("already define:" + moduleName);
						return;
					}
					theDefinedMap[moduleName] = depModuleArgs[0].module;
					onload(mod);
				});
			}
		});

	})();

	/**
	 * 得到属性
	 * @param {Object} obj
	 * @param {Object} attrNames "rs"、"rs.total"等
	 */
	xsloader.getObjectAttr = function(obj, attrNames, defaultValue) {
		if(!obj || !attrNames) {
			return undefined;
		}
		var attrs = attrNames.split(".");
		var rs = defaultValue;
		var i = 0;
		for(; i < attrs.length && obj; i++) {
			var k = attrs[i];
			obj = obj[k];
		}
		if(i == attrs.length) {
			rs = obj;
		}

		return rs;
	};
	/**
	 * 设置属性
	 * @param {Object} obj
	 * @param {Object} attrNames "rs"、"rs.total"等
	 */
	xsloader.setObjectAttr = function(obj, attrNames, value) {
		var _obj = obj;
		var attrs = attrNames.split(".");
		var i = 0
		for(; i < attrs.length; i++) {
			var k = attrs[i];

			if(i == attrs.length - 1) {
				obj[k] = value;
				break;
			}
			var o = obj[k];
			if(!o) {
				o = {};
				obj[k] = o;
			}
			obj = o;
		}
		return _obj;
	};
	xsloader._ignoreAspect_ = {};

})(this, setTimeout);

(function() {
	//TODO STRONG 修复部分常用库
	xsloader._ignoreAspect_['jquery'] = true;
	xsloader._ignoreAspect_['xshttp'] = true;
})();

(function() { //TODO STRONG css插件
	/*
	 * Require-CSS RequireJS css! loader plugin
	 * 0.1.8
	 * Guy Bedford 2014
	 * MIT
	 */
	/*
	 *
	 * Usage:
	 *  require(['css!./mycssFile']);
	 *
	 * Tested and working in (up to latest versions as of March 2013):
	 * Android
	 * iOS 6
	 * IE 6 - 10
	 * Chome 3 - 26
	 * Firefox 3.5 - 19
	 * Opera 10 - 12
	 * 
	 * browserling.com used for virtual testing environment
	 *
	 * Credit to B Cavalier & J Hann for the IE 6 - 9 method,
	 * refined with help from Martin Cermak
	 * 
	 * Sources that helped along the way:
	 * - https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent
	 * - http://www.phpied.com/when-is-a-stylesheet-really-loaded/
	 * - https://github.com/cujojs/curl/blob/master/src/curl/plugin/css.js
	 *
	 */
	define("css", function() {
		if(typeof window == 'undefined')
			return {
				load: function(n, r, load) {
					load()
				}
			};
		var head = document.getElementsByTagName('head')[0];
		var engine = window.navigator.userAgent.match(/Trident\/([^ ;]*)|AppleWebKit\/([^ ;]*)|Opera\/([^ ;]*)|rv\:([^ ;]*)(.*?)Gecko\/([^ ;]*)|MSIE\s([^ ;]*)|AndroidWebKit\/([^ ;]*)/) || 0;
		var useImportLoad = false;
		var useOnload = true;
		if(engine[1] || engine[7])
			useImportLoad = parseInt(engine[1]) < 6 || parseInt(engine[7]) <= 9;
		else if(engine[2] || engine[8] || 'WebkitAppearance' in document.documentElement.style)
			useOnload = false;
		else if(engine[4])
			useImportLoad = parseInt(engine[4]) < 18;
		var cssAPI = {};
		cssAPI.pluginBuilder = './css-builder';
		var curStyle, curSheet;
		var createStyle = function() {
			curStyle = document.createElement('style');
			head.appendChild(curStyle);
			curSheet = curStyle.styleSheet || curStyle.sheet;
		}
		var ieCnt = 0;
		var ieLoads = [];
		var ieCurCallback;
		var createIeLoad = function(url) {
			curSheet.addImport(url);
			curStyle.onload = function() {
				processIeLoad()
			};

			ieCnt++;
			if(ieCnt == 31) {
				createStyle();
				ieCnt = 0;
			}
		}
		var processIeLoad = function() {
			ieCurCallback();
			var nextLoad = ieLoads.shift();
			if(!nextLoad) {
				ieCurCallback = null;
				return;
			}
			ieCurCallback = nextLoad[1];
			createIeLoad(nextLoad[0]);
		}
		var importLoad = function(url, callback) {
			if(!curSheet || !curSheet.addImport)
				createStyle();

			if(curSheet && curSheet.addImport) {
				if(ieCurCallback) {
					ieLoads.push([url, callback]);
				} else {
					createIeLoad(url);
					ieCurCallback = callback;
				}
			} else {
				curStyle.textContent = '@import "' + url + '";';
				var loadInterval = setInterval(function() {
					try {
						curStyle.sheet.cssRules;
						clearInterval(loadInterval);
						callback();
					} catch(e) {}
				}, 10);
			}
		}
		var linkLoad = function(url, callback) {
			var link = document.createElement('link');
			link.type = 'text/css';
			link.rel = 'stylesheet';
			if(useOnload)
				link.onload = function() {
					link.onload = function() {};
					setTimeout(callback, 7);
				}
			else
				var loadInterval = setInterval(function() {
					for(var i = 0; i < document.styleSheets.length; i++) {
						var sheet = document.styleSheets[i];
						if(sheet.href == link.href) {
							clearInterval(loadInterval);
							return callback();
						}
					}
				}, 10);
			link.href = url;
			head.appendChild(link);
		}
		cssAPI.pluginMain = function(cssId, onload, onerror, config) {
			if(cssId.indexOf(".css") != cssId.length - 4) {
				cssId += ".css";
			}
			(useImportLoad ? importLoad : linkLoad)(this.invoker().getUrl(cssId, true), onload);

		};
		return cssAPI;
	});
})();

(function() { //TODO STRONG text插件
	define("text", ["xshttp"], {
		pluginMain: function(name, onload, onerror, config, http) {
			var url = this.invoker().getUrl(name, true);
			http().url(url)
				.handleAs("text")
				.ok(function(text) {
					onload(text);
				})
				.fail(function(err) {
					onerror(err);
				})
				.done();
		}
	});

})();

/**
 * 格式：window!varNameInWindow=>>modulePath
 */
(function() { //TODO STRONG window插件,用于添加模块到window对象中
	define("window", {
		pluginMain: function(arg, onload, onerror, config, http) {
			var index = arg.indexOf("=>>");
			if(index == -1) {
				onerror("expected:=>>");
				return;
			}
			var moduleName = arg.substring(0, index);
			var dep = arg.substring(index + 3);
			this.invoker().require([dep], function(mod, depModuleArgs) {
				window[moduleName] = mod;
				onload(mod);
			});
		}
	});

})();

/**
 * 格式:withdeps!modulePath=>>[deps]
 */
(function() { //TODO STRONG withdeps插件,用于设置依赖
	define("withdeps", {
		pluginMain: function(arg, onload, onerror, config, http) {
			var index = arg.indexOf("=>>");
			if(index == -1) {
				onerror("expected:=>>");
				return;
			}
			var moduleName = arg.substring(0, index);
			var depsStr = arg.substring(index + 3);
			var deps;
			try {
				deps = xsParseJson(depsStr);
				if(!xsloader.isArray(deps)) {
					onerror("deps is not Array:" + depStr);
					return;
				}
			} catch(e) {
				onerror("deps error:" + depStr);
				return;
			}
			this.invoker().require([
				[false].concat(deps), moduleName
			], function(_deps, mod, depModuleArgs) {
				onload(mod);
			}).then({
				orderDep: true
			});
		}
	});

})();

(function() {
	/**
	 * 加载json对象
	 */
	define("json", ["xshttp"], {
		pluginMain: function(name, onload, onerror, config, http) {
			var url = this.invoker().getUrl(name, true);
			http().url(url)
				.handleAs("json")
				.ok(function(json) {
					onload(json);
				})
				.fail(function(err) {
					onerror(err);
				})
				.done();
		}
	});
})();

(function() { //TODO STRONG xshttp
	var progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'];
	/**
	 * option._beforeOpenHook
	 * option._onOkResponseHook
	 * option._onFailResponseHook
	 * 
	 * @param {Object} option
	 */
	function httpRequest(option) {
		if(!option) {
			option = {};
		}

		function prop(obj, varName, defaultVal) {
			if(obj[varName] === undefined) {
				return defaultVal;
			} else {
				return obj[varName];
			}
		}

		function putProp(obj, varName, toObj) {
			if(obj[varName]) {
				for(var x in obj[varName]) {
					var value = obj[varName][x];
					if(value === null || value === undefined) {
						continue;
					}
					toObj[x] = value;
				}
			}
		}
		var _url = prop(option, "url", ""),
			_method = prop(option, "method", "GET"),
			_params = {},
			_headers = {},
			_async = prop(option, "async", true),
			_multiPart = prop(option, "multiPart", false),
			_handleType = prop(option, "handleType", "json");
		_timeout = option.timeout;
		putProp(option, "params", _params);
		putProp(option, "headers", _headers);

		var okCallback = option.ok;
		var failCallback = option.fail;
		var uploadStartCallback = option.uploadStart;
		var uploadProgressCallback = option.uploadProgress;
		var uploadEndCallback = option.uploadEnd;

		var _beforeOpenHook = option._beforeOpenHook || httpRequest._beforeOpenHook;
		var _onOkResponseHook = option._onOkResponseHook || httpRequest._onOkResponseHook;
		var _onFailResponseHook = option._onFailResponseHook || httpRequest._onFailResponseHook;

		function createXhr() {
			var xhr, i, progId;
			if(typeof XMLHttpRequest !== "undefined") {
				return new XMLHttpRequest();
			} else if(typeof ActiveXObject !== "undefined") {
				for(i = 0; i < 3; i += 1) {
					progId = progIds[i];
					try {
						xhr = new ActiveXObject(progId);
					} catch(e) {}

					if(xhr) {
						progIds = [progId];
						break;
					}
				}
			}
			return xhr;
		};

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
			_beforeOpenHook(option, function() {
				_connAfterOpenHook(option, xhr);
			});
		};

		function _doOnFailResponseHook(option, xhr, err, extraErr) {
			_onFailResponseHook(option, xhr, function(result) {
				if(result !== false && result !== undefined) {
					if(typeof okCallback == "function") {
						okCallback(result, xhr);
					}
					return;
				} else if(typeof failCallback == "function") {
					failCallback(err);
				} else {
					console.error(err);
				}
			}, extraErr);
		};

		function _connAfterOpenHook(option, xhr) {
			var body;
			if(option.multiPart) {
				var formData = new FormData();
				for(var x in option.params) {
					var value = option.params[x];
					if(xsloader.isArray(value)) {
						formData.append(x, xsJson2String(value));
					} else {
						formData.append(x, value);
					}

				}
				body = formData;
			} else {
				body = "";
				for(var x in option.params) {
					var value = option.params[x];
					if(value === null || value === undefined) {
						continue;
					}
					if(typeof value == "object") {
						value = xsJson2String(value);
					}
					body += "&" + encodeURIComponent(x) + "=" + encodeURIComponent(value);
				}
				if(!(option.method == "POST" || option.method == "PUT")) {
					if(option.url.lastIndexOf("?") < 0 && body.length > 0) {
						option.url += "?";
					}
					option.url += body;
					body = null;
				}
			}

			xhr.open(option.method, option.url, option.async);
			if((option.method == "POST" || option.method == "PUT") && !option.multiPart && !option.headers.hasOwnProperty("Content-Type")) {

				xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');
			}
			for(var header in option.headers) {
				xhr.setRequestHeader(header, option.headers[header]);
			}

			if(typeof uploadStartCallback == "function") {
				xhr.upload.onloadstart = uploadStartCallback;
			}

			if(typeof uploadProgressCallback == "function") {
				xhr.upload.onprogress = uploadProgressCallback;
			}
			if(typeof uploadEndCallback == "function") {
				xhr.upload.onloadend = uploadEndCallback;
			}

			var timeoutTimer;
			var isTimeout = false;
			if(option.timeout) {
				timeoutTimer = setTimeout(function() {
					isTimeout = true;
					xhr.abort();
					clearTimeout(timeoutTimer);
				}, option.timeout);
			}

			xhr.onreadystatechange = function(evt) {
				var status, err;
				if(xhr.readyState === 4) {
					status = xhr.status || 0;
					if(status > 399 && status < 600 || !status) {
						var err = new Error(option.url + ' HTTP status: ' + status);
						err.xhr = xhr;
						_doOnFailResponseHook(option, xhr, err);
					} else {
						var result;
						if(option.handleType === "json") {
							try {
								result = xsParseJson(xhr.responseText);
							} catch(e) {
								_doOnFailResponseHook(option, xhr, new Error("parse-json-error:" + e), "parse-json-error");
								return;
							}
						} else if(option.handleType === "text") {
							result = xhr.responseText;
						}
						_onOkResponseHook(result, option, xhr, function(result) {
							if(typeof okCallback == "function") {
								okCallback(result, xhr);
							}
						});
					}

				} else {
					if(timeoutTimer && isTimeout) {
						var err = new Error(option.url + ' timeout status: ' + status);
						err.xhr = xhr;
						_doOnFailResponseHook(option, xhr, err);
					}
				}
			};
			xhr.send(body);

		};

		var requestObj = {
			multiPart: function(multiPart) {
				_multiPart = multiPart;
				return this;
			},
			uploadStart: function(uploadStart) {
				uploadStartCallback = uploadStart;
				return this;
			},
			uploadProgress: function(uploadProgress) {
				uploadProgressCallback = uploadProgress;
				return this;
			},
			uploadEnd: function(uploadEnd) {
				uploadEndCallback = uploadEnd;
				return this;
			},
			url: function(urlStr) {
				_url = urlStr;
				return this;
			},
			method: function(methodStr) {
				_method = methodStr;
				return this;
			},
			timeout: function(timeout) {
				_timeout = timeout;
				return this;
			},
			async: function(isAsync) {
				_async = isAsync;
				return this;
			},
			params: function(paramsObj) {
				if(paramsObj) {
					for(var x in paramsObj) {
						var value = paramsObj[x];
						if(value === null || value === undefined) {
							continue;
						}
						_params[x] = value;
					}
				}
				return this;
			},
			headers: function(headersObj) {
				if(headersObj) {
					for(var x in headersObj) {
						_headers[x] = headersObj[x];
					}
				}
				return this;
			},
			handleType: function(_handleType) {
				return this.handleAs(_handleType);
			},
			handleAs: function(handleType) {
				if(handleType !== "json" && handleType !== "text") {
					throw "unknown handleType:" + handleType;
				}
				_handleType = handleType;
				return this;
			},
			ok: function(callback) {
				okCallback = callback;
				return this;
			},
			fail: function(callback) {
				failCallback = callback;
				return this;
			},
			done: function() {
				try {
					conn();
				} catch(e) {
					if(typeof failCallback == "function") {
						failCallback(e);
					} else {
						console.error(e);
					}
				}
			}
		};
		return requestObj;
	};
	/**
	 */
	httpRequest._beforeOpenHook = function(option, callback) {
		callback();
	};

	/**
	 * function(result,option,xhr,callback),callback(result)的result为最终的结果
	 */
	httpRequest._onOkResponseHook = function(result, option, xhr, callback) {
		callback(result);
	};
	/**
	 * function(option,xhr,callback,extraErrorType),callback(result)的result为false则不会处理后面的,如果为非undefined则作为成功的结果。
	 * extraErrorType=="parse-json-error"表示转换成json时出错
	 */
	httpRequest._onFailResponseHook = function(option, xhr, callback) {
		callback(undefined);
	};

	window._xshttp_request_ = httpRequest;

	define("xshttp", [], function() {
		return httpRequest;
	});
})();

(function() { //TODO STRONG JSON对ie低版本的兼容
	//  json2.js
	//  2016-10-28
	//  Public Domain.
	//  NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
	//  See http://www.JSON.org/js.html
	//  This code should be minified before deployment.
	//  See http://javascript.crockford.com/jsmin.html
	if(typeof JSON !== "object") {
		JSON = {};
	}
	(function() {
		"use strict";
		var rx_one = /^[\],:{}\s]*$/;
		var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
		var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
		var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
		var rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
		var rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

		function f(n) {
			return n < 10 ?
				"0" + n :
				n;
		}

		function this_value() {
			return this.valueOf();
		}
		if(typeof Date.prototype.toJSON !== "function") {
			Date.prototype.toJSON = function() {
				return isFinite(this.valueOf()) ?
					this.getUTCFullYear() + "-" +
					f(this.getUTCMonth() + 1) + "-" +
					f(this.getUTCDate()) + "T" +
					f(this.getUTCHours()) + ":" +
					f(this.getUTCMinutes()) + ":" +
					f(this.getUTCSeconds()) + "Z" :
					null;
			};
			Boolean.prototype.toJSON = this_value;
			Number.prototype.toJSON = this_value;
			String.prototype.toJSON = this_value;
		}
		var gap, indent, meta, rep;

		function quote(string) {
			rx_escapable.lastIndex = 0;
			return rx_escapable.test(string) ?
				"\"" + string.replace(rx_escapable, function(a) {
					var c = meta[a];
					return typeof c === "string" ?
						c :
						"\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
				}) + "\"" :
				"\"" + string + "\"";
		}

		function str(key, holder) {
			var i; // The loop counter.
			var k; // The member key.
			var v; // The member value.
			var length;
			var mind = gap;
			var partial;
			var value = holder[key];
			if(value && typeof value === "object" &&
				typeof value.toJSON === "function") {
				value = value.toJSON(key);
			}
			if(typeof rep === "function") {
				value = rep.call(holder, key, value);
			}
			switch(typeof value) {
				case "string":
					return quote(value);
				case "number":
					return isFinite(value) ?
						String(value) :
						"null";

				case "boolean":
				case "null":
					return String(value);
				case "object":
					if(!value) {
						return "null";
					}
					gap += indent;
					partial = [];
					if(Object.prototype.toString.apply(value) === "[object Array]") {
						length = value.length;
						for(i = 0; i < length; i += 1) {
							partial[i] = str(i, value) || "null";
						}
						v = partial.length === 0 ?
							"[]" :
							gap ?
							"[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" :
							"[" + partial.join(",") + "]";
						gap = mind;
						return v;
					}
					if(rep && typeof rep === "object") {
						length = rep.length;
						for(i = 0; i < length; i += 1) {
							if(typeof rep[i] === "string") {
								k = rep[i];
								v = str(k, value);
								if(v) {
									partial.push(quote(k) + (
										gap ?
										": " :
										":"
									) + v);
								}
							}
						}
					} else {
						for(k in value) {
							if(Object.prototype.hasOwnProperty.call(value, k)) {
								v = str(k, value);
								if(v) {
									partial.push(quote(k) + (
										gap ?
										": " :
										":"
									) + v);
								}
							}
						}
					}
					v = partial.length === 0 ?
						"{}" :
						gap ?
						"{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" :
						"{" + partial.join(",") + "}";
					gap = mind;
					return v;
			}
		}
		if(typeof JSON.stringify !== "function") {
			meta = { // table of character substitutions
				"\b": "\\b",
				"\t": "\\t",
				"\n": "\\n",
				"\f": "\\f",
				"\r": "\\r",
				"\"": "\\\"",
				"\\": "\\\\"
			};
			JSON.stringify = function(value, replacer, space) {
				var i;
				gap = "";
				indent = "";
				if(typeof space === "number") {
					for(i = 0; i < space; i += 1) {
						indent += " ";
					}
				} else if(typeof space === "string") {
					indent = space;
				}
				rep = replacer;
				if(replacer && typeof replacer !== "function" &&
					(typeof replacer !== "object" ||
						typeof replacer.length !== "number")) {
					throw new Error("JSON.stringify");
				}
				return str("", {
					"": value
				});
			};
		}
		if(typeof JSON.parse !== "function") {
			JSON.parse = function(text, reviver) {
				var j;

				function walk(holder, key) {
					var k;
					var v;
					var value = holder[key];
					if(value && typeof value === "object") {
						for(k in value) {
							if(Object.prototype.hasOwnProperty.call(value, k)) {
								v = walk(value, k);
								if(v !== undefined) {
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
				if(rx_dangerous.test(text)) {
					text = text.replace(rx_dangerous, function(a) {
						return "\\u" +
							("0000" + a.charCodeAt(0).toString(16)).slice(-4);
					});
				}
				if(rx_one.test(
						text
						.replace(rx_two, "@")
						.replace(rx_three, "]")
						.replace(rx_four, ""))) {
					j = eval("(" + text + ")");
					return(typeof reviver === "function") ?
						walk({
							"": j
						}, "") : j;
				}
				throw new SyntaxError("JSON.parse");
			};
		}
	}());

})();

(function() {
	try {
		var isXsMsgDebug = false;
		var api = {};

		function isDebug(type) {
			return isXsMsgDebug;
		}

		api.linkedList = function() {
			return new LinkedList();
		};

		function LinkedList() {
			function newNode(element) {　　
				var node = {
					element: element,
					next: null,
					pre: null
				};
				return node;
			};
			var length = 0;
			var headNode = newNode(),
				lastNode = headNode;

			/**
			 * 在链表末尾添加元素
			 */
			this.append = function(element) {　　
				var current = newNode(element);　　　　

				lastNode.next = current;
				current.pre = lastNode;
				lastNode = current;　　
				length++;
			};

			//在链表的任意位置插入元素
			this.insert = function(position, element) {　　
				if(position >= 0 && position <= length) {

					var node = newNode(element);
					var pNode = headNode;
					while(position--) {
						pNode = pNode.next;
					}

					if(pNode.next) {
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

			this.elementAt = function(position) {
				return getElement(position);
			};

			function getElement(position, willRemove) {　　
				if(position >= 0 && position < length) {

					var pNode = headNode;
					while(position--) {
						pNode = pNode.next;
					}

					if(pNode.next) {
						var currentNode = pNode.next;
						if(willRemove) {
							var nextCurrentNode = currentNode.next;
							if(nextCurrentNode) {
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
			};

			/**
			 * @param callback function 返回true表示移除
			 */
			this.eachForRemove = function(callback) {
				var pNode = headNode.next;
				while(pNode) {
					var currentNode = pNode;
					if(callback(currentNode)) {
						var nextCurrentNode = currentNode.next;
						if(nextCurrentNode) {
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

			//从链表中移除元素
			this.removeAt = function(position) {　　
				return getElement(position, true);
			};

			/**
			 * 移除并获取第一个元素
			 * @param callback function(elem,index)
			 */
			this.pop = function(callback) {
				return this.removeAt(0)
			};

			/**
			 * 返回元素在链表中的位置
			 * @param element object|function(elem)
			 */
			this.indexOf = function(element) {　　
				var pNode = headNode.next;
				var index = 0;
				while(pNode) {
					if(typeof element == "function") {
						if(element(pNode.element)) {
							return index;
						}
					} else if(pNode.element === element) {
						return index;
					}
					index++;
					pNode = pNode.next;
				}
				return -1;
			};

			this.find = function(element) {
				var index = this.indexOf(element);
				return index >= 0 ? this.elementAt(index) : undefined;
			}

			//移除某个元素
			this.remove = function(element) {　　
				var index = this.indexOf(element);　　
				return this.removeAt(index);
			};

			//判断链表是否为空

			this.isEmpty = function() {　　
				return length === 0;
			};

			//返回链表的长度
			this.size = function() {
				return length;
			};

		};

		if(!window.addEventListener) {
			return;
		}

		var postMessageBridge = (function() {
			var handle = {};
			var listeners = {};
			var activeListenerMyIds = {}; //inactiveUniqueId:[id]

			//callback:function(data,source,type,optionData,originStr)
			//origin.originSend,origin.originReceive
			//isActive为false表示被动者,被动者是根据cmd发送、且发给所有的，主动者根据id发送.
			handle.listen = function(cmd, origin, callback, isActive) {
				var id = isActive ? randId() : cmd;
				var listener = {
					callback: callback,
					cmd: cmd,
					active: isActive,
					origin: origin
				};
				var originReceive;
				if(xsloader.isString(origin.originReceive)) {
					originReceive = function(originStr) {
						return origin.originReceive == '*' || origin.originReceive == originStr;
					};
				} else {
					originReceive = origin.originReceive;
				}
				listener.originReceive = originReceive;
				origin.originSend = xsloader.isString(origin.originSend) ? origin.originSend : origin.originSend();
				listeners[id] = listener;
				if(!isActive) {
					listener.uniqueId = randId();
				}
				return id;
			};

			handle.remove = function(id) {
				var listener = listeners[id];
				delete listeners[id];
				if(listener.active) {
					for(var x in activeListenerMyIds) {
						var as = activeListenerMyIds[x];
						var found = false;
						for(var k = 0; k < as.length; k++) {
							if(as[k] == id) {
								as.splice(k, 1);
								found = true;
								break;
							}
						}
						if(found) {
							break;
						}
					}
				}

			};
			handle.send = function(id, data, source, origin) {
				var listener = listeners[id];
				var optionData = {
					uniqueId: listener.uniqueId
				};
				_send(id, data, source, origin, "msg", optionData);
			};

			function _send(id, data, source, origin, type, optionData) {
				var listener = listeners[id];
				if(!listener) {
					return;
				}
				var msg = {
					data: data,
					cmd: listener.cmd,
					active: listener.active,
					optionData: optionData,
					uniqueId: listener.uniqueId
				};
				if(type) {
					msg.type = type;
				}
				if(isDebug("postMessageBridge")) {
					console.log("send from:" + location.href);
					console.log(msg);
				}
				var originStr = origin.originSend;
				source.postMessage(xsJson2String(msg), origin.originSend);
			};

			handle.sendConn = function(id, data, source, origin, conndata) {
				var optionData = {
					thatId: id,
					conndata: conndata
				};
				_send(id, data, source, origin, "conn", optionData);
			};

			handle.sendConned = function(id, data, source, origin, thatOptionData, conndata) {
				var listener = listeners[id];
				var optionData = {
					myId: thatOptionData.thatId,
					conndata: conndata
				};
				_send(id, data, source, origin, "conned", optionData);
			};

			handle.sendResponse = function(id, data, source, origin) {
				_send(id, data, source, origin, "response")
			};

			window.addEventListener('message', function(event) {
				if(isDebug("postMessageBridge")) {
					console.log("receive from:" + event.origin + ",current:" + location.href);
					console.log(event.data);
				}
				var data = xsParseJson(event.data);
				if(!data) {
					return;
				}

				var cmd = data.cmd;
				var cmdData = data.data;
				var active = data.active;
				var type = data.type;
				var optionData = data.optionData;

				if(type == "conned") {
					var uniqueId = data.uniqueId;
					var myId = data.optionData.myId;
					var as = activeListenerMyIds[uniqueId];
					if(!as) {
						as = [];
						activeListenerMyIds[uniqueId] = as;
					}
					as.push(myId);
				}

				var originStr = event.origin;
				var source = event.source;
				if(active) { //来自于主动者,则my:id==cmd
					var myId = cmd;
					try {
						var listener = listeners[myId];
						var callback = listener ? listener.callback : null;
						if(callback) {
							if(listener.originReceive(originStr, optionData)) {
								callback(cmdData, source, type, optionData,originStr);
							}
						}
					} catch(e) {
						console.error(e);
					}
				} else { //来自于被动者（后发消息者），则my:id要从activeListenerMyIds中取
					var ids = activeListenerMyIds[data.uniqueId];
					if(ids) {
						for(var i = 0; i < ids.length; i++) {
							var myId = ids[i];
							try {
								var listener = listeners[myId];
								var callback = listener ? listener.callback : null;
								if(callback) {
									if(listener.originReceive(originStr, optionData)) {
										callback(cmdData, source, type, optionData,originStr);
									}
								}
							} catch(e) {
								console.error(e);
							}
						}
					} else {
						if(isDebug("postMessageBridge")) {
							console.log("active handle for cmd '" + cmd + "' is null!");
						}
					}
				}

			}, false);

			handle.runAfter = function(time, callback) {
				setTimeout(callback, time);
			};

			return handle;
		})();

		function CommunicationUnit(cmd, source, origin, isActive, conndata) {
			var msgQueue = new LinkedList();
			var receiveCacheList = new LinkedList();

			var MAX_TRY = 100,
				SLEEP = 500;
			var RECEIVE_CACHE_TIME = 20 * SLEEP + MAX_TRY * SLEEP;
			var isChecking = false;
			var isConnected = false,
				connectCount = 0;

			/**
			 * 如果已经接收过,则返回true.
			 * @param {Object} msg
			 */
			function cacheReceive(msg) {
				var id = msg.id;
				var ele = receiveCacheList.find(function(element) {
					return element.id = id;
				});
				if(isDebug("CommunicationUnit")) {
					console.log("received before:");
					console.log(ele);
				}
				var cached = ele ? true : false;
				if(!cached) {
					receiveCacheList.append({
						id: id,
						time: new Date().getTime()
					});
				}

				var time = new Date().getTime();
				//移除超时的接收缓存
				receiveCacheList.eachForRemove(function(element) {
					var willRemove = time - element.time > RECEIVE_CACHE_TIME;
					return willRemove;
				});

				return cached;
			};

			var thiz = this;

			this.onConnectedListener = null;
			this.onReceiveListener = null;
			this.send = function(data) {
				var msg = {
					id: randId(),
					data: data
				};
				msgQueue.append(msg);
				sendTop();
			};

			this.send.release = function() {
				postMessageBridge.remove(handleId);
			};

			var handleId = postMessageBridge.listen(cmd, origin, function(msg, _source, type, optionData,originStr) {
				if(type == "conn") { //发起连接
					source = _source;
					isConnected = true;
					postMessageBridge.sendConned(handleId, { //确认连接
						conned: true
					}, source, origin, optionData, conndata);
					if(thiz.onConnectedListener) {
						thiz.onConnectedListener.call(thiz, optionData.conndata,{
							originStr:originStr
						});
					}
					sendTop();
				} else if(type == "conned") { //已经连接
					isConnected = true;
					if(thiz.onConnectedListener) {
						thiz.onConnectedListener.call(thiz, optionData.conndata,{
							originStr:originStr
						});
					}
					sendTop();
				} else if(type == "response") { //消息回复,移除消息
					msgQueue.remove(function(elem) {
						return elem.id = msg.id;
					});
					sendTop();
				} else { //收到消息

					//var receivedBefore = cacheReceive(msg);

					//if(!receivedBefore) { //防止重复接收
					if(thiz.onReceiveListener) {
						thiz.onReceiveListener.call(thiz, msg.data,{
							originStr:originStr
						});
					}
					//}

					postMessageBridge.sendResponse(handleId, { //回应已经收到
						response: true,
						id: msg.id
					}, source, origin);

				}
			}, isActive);

			function sendTop() {
				if(isConnected) {
					var msg = msgQueue.pop();
					if(msg) {
						postMessageBridge.send(handleId, msg, source, origin);
						postMessageBridge.runAfter(SLEEP, init);
					}
				}
			}

			function init() {
				if(isConnected || connectCount > MAX_TRY) {
					return;
				}
				postMessageBridge.sendConn(handleId, {
					conn: true
				}, source, origin, conndata);
				connectCount++;
				postMessageBridge.runAfter(SLEEP, init);
			}
			if(source) {
				init();
			}

			this.setSource = function(_source) {
				source = _source;
				if(source) {
					init();
				}
			};
		}

		var handle = api;

		/**
		 * 
		 * @param {Object} winObjOrCallback
		 * @param {Object} cmd
		 * @param {Object} connectedCallback function(sender,conndata)
		 * @param {Object} receiveCallback function(data,sender)|function(sender,data)
		 * @param {Object} notActive
		 */
		function _connectWindow(winObjOrCallback, option, notActive) {
			var currentOriginStr = location.protocol + "//" + location.host;
			option = xsloader.extendDeep({
				cmd: null,
				listener: null,
				connected: null,
				conndata: null,
				origin: {
					originSend: currentOriginStr,
					originReceive: currentOriginStr
				}
			}, option);

			var cmd = option.cmd;
			var connectedCallback = option.connected;
			var receiveCallback = option.listener;
			var conndata = option.conndata;

			var isActive = !notActive;
			var origin = option.origin;

			var unit;
			if(typeof winObjOrCallback == "function") {
				unit = new CommunicationUnit(cmd, null, origin, isActive, conndata);
			} else {
				unit = new CommunicationUnit(cmd, winObjOrCallback, origin, isActive, conndata);
			}

			connectedCallback = connectedCallback || function(sender, conndata) {
				console.log((isActive ? "active" : "") + " connected:" + cmd);
			};
			if(connectedCallback) {
				unit.onConnectedListener = function(conndata,extra) {
					try {
						connectedCallback(this.send, conndata,extra);
					} catch(e) {
						console.error(e);
					}
				};
			}
			if(receiveCallback) {
				unit.onReceiveListener = function(data,extra) {
					try {
						receiveCallback(data, this.send,extra);
					} catch(e) {
						console.error(e);
					}
				};
			}
			if(typeof winObjOrCallback == "function") {
				winObjOrCallback(function(winObj) {
					unit.setSource(winObj);
				});
			}

			return unit.send;
		}

		function _connectIFrame(iframe, option) {
			var winObj;
			if(typeof iframe == "string") {
				//iframe = $(iframe)[0];
				winObj = function(callback) {
					$(iframe).on("load", function() {
						callback(this.contentWindow);
					});
				};
			} else {
				winObj = iframe.contentWindow;
			}
			return _connectWindow(winObj, option);

		};

		/**
		 * 用于连接iframe.
		 * @param {Object} iframe iframe或selector
		 * @param {Object} option
		 * @return 返回sender
		 */
		handle.connectIFrame = function(iframe, option) {
			return _connectIFrame(iframe, option);
		};

		/**
		 * 用于连接父页面.
		 * @param {Object} option
		 * @return 返回sender
		 */
		handle.connectParent = function(option) {
			return _connectWindow(window.parent, option);
		};

		/**
		 * 用于连接顶层页面.
		 * @param {Object} option
		 * @return 返回sender
		 */
		handle.connectTop = function(option) {
			return _connectWindow(window.top, option);
		};

		/**
		 * 用于连接打开者.
		 * @param {Object} option
		 * @return 返回sender
		 */
		handle.connectOpener = function(option) {
			return _connectWindow(window.opener, option);
		};

		/**
		 * 用于监听其他页面发送消息.
		 * @param {Object} option
		 * @return 返回一个sender
		 */
		handle.listenMessage = function(option) {
			return _connectWindow(null, option, true);
		};

		api.debug = function(isDebug) {
			isXsMsgDebug = isDebug;
		};

		/**
		 * *******************
		 * option参数
		 *********************
		 * cmd:
		 * originSend:String||function(origin){}//默认只能是同域
		 * originReceive:String||function(origin,data){}//默认只能是同域
		 * listener: function(data,sender,extra)
		 * connected:function(sender,conndata,extra)
		 * conndata:
		 **************
		 * 回调的extra参数
		 **************
		 * originStr:对方页面的地址
		 */
		define("xsmsg", api); //TODO STRONG xsmsg
		define("XsLinkedList", function() {
			return LinkedList;
		});
	} catch(e) {
		console.error(e);
	}
})();

(function() { //TODO STRONG 静态资源服务
	var http = window._xshttp_request_;
	var DATA_CONF = "data-xsloader-conf";
	var DATA_CONF2 = "data-xsloader-conf2";
	var DATA_MAIN = "data-xsloader-main";

	var url;
	var dataConf = xsloader.script().getAttribute(DATA_CONF);
	var dataMain = xsloader.script().getAttribute(DATA_MAIN);
	if(dataConf) {
		url = getPathWithRelative(location.href, dataConf);
	} else if((dataConf = xsloader.script().getAttribute(DATA_CONF2))) {
		url = getPathWithRelative(xsloader.script().src, dataConf);
	} else {
		return;
	}

	function extendConfig(config) {
		config = xsloader.extendDeep({
			properties: {},
			main: {
				getPath: function() {
					var path = location.pathname;
					var index = path.lastIndexOf("/");
					var name = path.substring(index + 1);
					if(name === "") {
						name = "index";
					}
					if(endsWith(name, ".html")) {
						name = name.substring(0, name.length - 5);
					}
					return dataMain || "./main/" + name + ".js";
				},
				name: "main",
				localConfigVar: "lconfig",
				globalConfigVar: "gconfig",
				before: function(name) {
					console.log("before:" + name);
				},
				after: function(name) {
					console.log("after:" + name);
				}
			},
			service: {
				hasGlobal: false,
				resUrls: []
			},
			chooseLoader: function(localConfig) { //返回一个configName；当此函数为service全局配置的函数时，localConfig为应用的配置对象;本地配置调用时，localConfig为null。
				return "default";
			},
			loader: {
				"default": {
					autoUrlArgs: true
				}
			}
		}, config);

		return config;
	};

	function loadServiceConfig(tag, url, callback, isLocal) {
		http({
			url: url,
			method: "get",
			timeout: 20000,
			ok: function(conf) {
				conf = extendConfig(conf);
				conf = xsloader.dealProperties(conf, conf.properties); //参数处理

				if(isLocal && conf.service.hasGlobal) {
					loadServiceConfig("global servie", conf.service.confUrl,
						function(globalConfig) {
							var localConfig = conf;
							window[globalConfig.main && globalConfig.main.localConfigVar || localConfig.main.localConfigVar] = localConfig;
							window[globalConfig.main && globalConfig.main.globalConfigVar || localConfig.main.globalConfigVar] = globalConfig;

							var mainName, mainPath, loaderName;

							loaderName = globalConfig.chooseLoader.call(globalConfig, localConfig);
							var conf;
							if(loaderName != null) {
								mainName = globalConfig.main.name;
								mainPath = getPathWithRelative(location.href, globalConfig.main.getPath.call(globalConfig));
								loader = globalConfig.loader[loaderName];
								conf = globalConfig;
							}

							if(!loader) {
								loaderName = localConfig.chooseLoader.call(localConfig, null);
								mainName = localConfig.main.name;
								mainPath = getPathWithRelative(location.href, localConfig.main.getPath.call(localConfig));
								loader = localConfig.loader[loaderName];
								conf = localConfig;
							}

							if(!loader) {
								console.error("unknown loader:" + loaderName + "");
								return;
							}

							initXsloader(mainName, mainPath, loader, conf, localConfig);

						});
				} else {
					callback(conf);
				}
			},
			fail: function(err) {
				console.error("load " + tag + " config err:url=" + url + ",errinfo=" + err);
			}
		}).done();
	}

	function startLoad() {
		loadServiceConfig("local", url, function(localConfig) {
			window[localConfig.main.localConfigVar] = localConfig;

			var mainName = localConfig.main.name;
			var mainPath = getPathWithRelative(location.href, localConfig.main.getPath.call(localConfig));
			var loaderName = localConfig.chooseLoader.call(localConfig, null);

			var loader = localConfig.loader[loaderName];
			if(!loader) {
				console.error("unknown local loader:" + loaderName);
				return;
			}
			initXsloader(mainName, mainPath, loader, localConfig, localConfig);
		}, true);
	}

	function initXsloader(mainName, mainPath, loader, conf, localConfig) {
		var resUrls = [];
		conf.service.resUrl && resUrls.push(conf.service.resUrl);
		localConfig !== conf && localConfig.service.resUrl && resurls.push(localConfig.service.resUrl);

		conf.service.resUrls && Array.pushAll(resUrls, conf.service.resUrls);
		localConfig !== conf && localConfig.service.resUrls && Array.pushAll(resUrls, localConfig.service.resUrls);

		xsloader._resUrlBuilder = function(groupModule) {
			var as = [];
			each(resUrls, function(url) {
				as.push(appendArgs2Url(resUrl, "m=" + encodeURIComponent(groupModule)));
			});
			return as;
		};

		loader.defineFunction = loader.defineFunction || {};
		loader.depsPaths = loader.depsPaths || {};
		loader.depsPaths[mainName] = mainPath;

		loader.defineFunction[mainName] = function(originCallback, originThis, originArgs) {
			if(xsloader.isFunction(conf.main.before)) {
				conf.main.before.call(conf, mainName);
			}
			var rt = originCallback.apply(originThis, originArgs);

			if(xsloader.isFunction(conf.main.after)) {
				conf.main.after.call(conf, mainName);
			}
			return rt;
		};
		loader.ignoreProperties = true;
		xsloader(loader);
		require([mainName], function(main) {}).then({
			onError: function(err) {
				console.error("invoke main err:" + err);
			}
		});
	}
	startLoad();
})();
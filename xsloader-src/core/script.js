import U from "../util/index.js";
import moduleScript from "./module.js";

const L = U.global.xsloader;

const defContextName = "xsloader1.1.x";
const DATA_ATTR_MODULE = 'data-xsloader-module';
const DATA_ATTR_CONTEXT = "data-xsloader-context";
const INNER_DEPS_PLUGIN = "__inner_deps__";
const innerDepsMap = {}; //内部依赖加载插件用于保存依赖的临时map
const globalDefineQueue = []; //没有配置前的define

const isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]';
const safariVersion = (function() {
	let ua = navigator.userAgent.toLowerCase();
	let s = ua.match(/version\/([\d.]+)\s+safari/);
	return s ? parseInt(s[1]) : -1;
})();

const readyRegExp = navigator.platform === 'PLAYSTATION 3' ? /^complete$/ : /^(complete|loaded)$/;
const theLoaderScript = document.currentScript || U.getScriptBySubname("xsloader.js");
const theLoaderUrl = U.removeQueryHash(U.getNodeAbsolutePath(theLoaderScript));
const thePageUrl = U.thePageUrl;
const theHead = document.head || document.getElementsByTagName('head')[0];

const currentDefineModuleQueue = []; //当前回调的模块
currentDefineModuleQueue.peek = function() {
	if (this.length > 0) {
		return this[this.length - 1];
	}
};

let lastAppendHeadDom = theLoaderScript;
let isSrcFromScriptLoad; //获取脚本的src是否在load事件阶段
let lastSrc = thePageUrl;
let lastScriptSrc = location.href;

let theRealDefine;
if (safariVersion > 0 && safariVersion <= 7) {
	isSrcFromScriptLoad = true;
}

//处理嵌套依赖
function _dealEmbedDeps(deps, defineObject) {
	for (let i = 0; i < deps.length; i++) {
		let dep = deps[i];
		if (L.isArray(dep)) {
			//内部的模块顺序加载
			let modName = "inner_order_" + moduleScript.getModuleId();
			let isOrderDep = !(dep.length > 0 && dep[0] === false);
			if (dep.length > 0 && (dep[0] === false || dep[0] === true)) {
				dep = dep.slice(1);
			}
			innerDepsMap[modName] = {
				deps: dep,
				absUrl: defineObject.absUrlFromDefineObject(),
				orderDep: isOrderDep,
				src: defineObject.src,
			};

			//console.log(innerDepsMap[modName]);
			deps[i] = INNER_DEPS_PLUGIN + "!" + modName;
		}
	}
}

function _getPluginParam(path) {
	let pluginIndex = path.indexOf("!");
	if (pluginIndex > 0) {
		return path.substring(pluginIndex);
	} else {
		return "";
	}
}

/////////////////////////////
class Handle {
	defineObject;
	constructor(defineObject) {
		this.defineObject = defineObject;
	}

	then(option) {
		let defineObject = this.defineObject;
		defineObject.handle = L.extend(defineObject.handle, option);
		return this;
	}
	error(onError) {
		let defineObject = this.defineObject;
		defineObject.handle.onError = onError;
		return this;
	}
	onError(err, invoker) {
		return this.defineObject.handle.onError(err, invoker);
	}
}

class ThisInvoker {
	invoker;
	constructor(invoker) {
		this.invoker = invoker;
	}
}

function _buildInvoker(module) {
	let invoker = module["thiz"];
	module = module.module || module;
	let id = L.randId();
	invoker.getId = function() {
		return id;
	};
	invoker.getUrl = function(relativeUrl, appendArgs = true, optionalAbsUrl) {
		if (optionalAbsUrl && !U.dealPathMayAbsolute(optionalAbsUrl).absolute) {
			throw new Error(-1, "expected absolute url:" + optionalAbsUrl);
		}

		let url;
		if (relativeUrl === undefined) {
			url = this.src();
		} else if (L.startsWith(relativeUrl, ".") || U.dealPathMayAbsolute(relativeUrl).absolute) {
			url = U.getPathWithRelative(optionalAbsUrl || this.absUrl(), relativeUrl);
		} else {
			let config = L.config();
			let argArr = [relativeUrl];
			U.replaceModulePrefix(config, argArr); //前缀替换

			if (L.startsWith(argArr[0], relativeUrl)) {
				url = L.config().baseUrl + relativeUrl;
			} else {
				url = argArr[0];
			}
		}
		if (appendArgs) {
			if (url == thePageUrl) {
				url += location.search + location.hash;
			}
			return L.config().dealUrl(module, url);
		} else {
			return url;
		}
	};

	invoker.getUrl2 = function(relativeUrl, appendArgs = true, optionalAbsUrl) {
		let url = this.getUrl(relativeUrl, false, optionalAbsUrl);
		if (appendArgs) {
			return L.config().dealUrl(module, url);
		} else {
			return url;
		}
	};

	invoker.appendArgs = function(url, forArgsUrl = U.global.location.href) {
		let urlArgs = L.config().getUrlArgs(module, forArgsUrl);
		return L.appendArgs2Url(url, urlArgs);
	};

	invoker.require = function() {
		//		console.log("this.require:absolute=" + invoker.src() + ",args[0]=" + arguments[0]);
		let h = L.require.apply(new ThisInvoker(invoker), arguments);
		if (h instanceof Handle) {
			h.then({
				absUrl: invoker.src()
			});
		}
		return h;
	};

	invoker.require.get = function(name) {
		return L.require.get.apply(new ThisInvoker(invoker), [name]);
	};

	invoker.define = function() {
		//		console.log("this.define:absolute=" + invoker.src() + ",args[0]=" + arguments[0] + (typeof arguments[0] == "string" ? (",args[1]=" + arguments[1]) : ""));
		let h = L.define.apply(new ThisInvoker(invoker), arguments);
		if (h instanceof Handle) {
			h.then({
				absUrl: invoker.src()
			});
		}
		return h;
	};
	invoker.rurl = function(defineObject) {
		return defineObject && defineObject.absUrlFromDefineObject() || this.absUrl();
	};

	//deprecated
	invoker.defineAsync = function() {
		let h = invoker.define.apply(invoker, arguments);
		return h;
	};

	invoker.withAbsUrl = function(absUrlStr) {

		let moduleMap = {
			module: module,
			get src() {
				return invoker.src();
			},
			set src(val) {
				throw "not support!";
			},
			get scriptSrc() {
				return invoker.scriptSrc();
			},
			set scriptSrc(val) {
				throw "not support!";
			},
			absUrl: () => {
				let url = absUrlStr || invoker.absUrl();
				return url;
			},
			absUrlFromModule() {
				return this.absUrl();
			},
			name: invoker.getName(),
			invoker: invoker.invoker()
		};
		return new Invoker(moduleMap);
	};
}

class Invoker {
	_im;
	_id;
	constructor(moduleMap) {
		this._im = new L.InVar(moduleMap);
		this._id = U.getAndIncIdCount();
		moduleMap.thiz = this;
		_buildInvoker(moduleMap);
	}

	getId() {
		return this._id;
	}

	/**
	 * 获取绝对地址（弃用）
	 */
	getAbsoluteUrl() {
		return this._im.get().src;
	}

	/**
	 * 获取绝对地址(不含地址参数)
	 */
	src() {
		return this._im.get().src;
	}

	/**
	 * 获取绝对地址(含地址参数)
	 */
	scriptSrc() {
		return this._im.get().scriptSrc;
	}

	getName() {
		return this._im.get().selfname;
	}

	/**
	 * 获取在上级依赖数组中的索引位置
	 */
	getIndex() {
		return this._im.get().index;
	}

	/**
	 * 获取当前调用者的调用者
	 */
	invoker() {
		return this._im.get().invoker;
	}

	absUrl() { //用于获取其他模块地址的参考路径
		return this._im.get().absUrlFromModule();
	}

	exports() {
		return this._im.get().exports;
	}

	root() {
		let p = this.invoker();
		return p ? p.invoker() : this;
	}
}

function getMineInvoker(thiz) {
	if (thiz instanceof ThisInvoker) {
		return thiz.invoker;
	} else if (thiz instanceof Invoker) {
		return thiz;
	} else if (thiz instanceof DefineObject) {
		return thiz.thiz;
	}
}

function getInvoker(thiz, nullNew = true) {
	if (thiz instanceof ThisInvoker) {
		return thiz.invoker;
	} else if (thiz instanceof Invoker) {
		return thiz;
	} else if (thiz instanceof DefineObject) {
		return thiz.thatInvoker;
	} else {
		let parentModule = currentDefineModuleQueue.peek();
		if (parentModule) {
			return parentModule.thiz;
		} else if (nullNew) {
			let moduleMap = {
				module: "",
				src: thePageUrl,
				scriptSrc: location.href,
				absUrl: () => thePageUrl,
				name: "__root__",
				invoker: null
			};
			return new Invoker(moduleMap);
		}
	}
}

class DefineObject {
	id = U.getAndIncIdCount();
	thiz;
	isRequire;
	_scriptSrc;
	_src;
	parentDefine;
	handle;
	selfname;
	deps;
	callback;
	thatInvoker;
	_directDepLength = 0;
	directDepLength = 0;
	names = [];
	index;
	ignoreCurrentRequireDep;
	constructor(scriptSrc, src, thiz, args = [], isRequire = false /*, willDealConfigDeps = false*/ ) {
		let config = L.config();

		this.parentDefine = currentDefineModuleQueue.peek();
		this.thatInvoker = getInvoker(thiz);

		this.ignoreCurrentRequireDep = !U.isLoaderEnd() || L.__ignoreCurrentRequireDep || this.parentDefine && this
			.parentDefine.ignoreCurrentRequireDep() || false;

		this.scriptSrc = scriptSrc;
		this.src = src;
		this.thiz = thiz;
		this.isRequire = isRequire;
		this.handle = {
			onError(err, invoker) {
				console.error(U.unwrapError(err));
			},
			before(deps) {},
			depBefore(index, dep, depDeps) {},
			orderDep: false,
			absoluteUrl: undefined, //弃用
			absUrl: undefined,
			instance: undefined,
		};

		if (thiz instanceof ThisInvoker) {
			//this.handle.absUrl = thiz.invoker.src(); //设置默认参考地址
			this.src = thiz.invoker.src();
		}

		let selfname = args[0];
		let deps = args[1];
		let callback = args[2];
		if (args.length == 1) {
			//直接定义模块，且没有依赖
			callback = selfname;
			selfname = null;
			deps = null;
		} else if (typeof selfname !== 'string') {
			callback = deps;
			deps = selfname;
			selfname = null; //为空的、表示定义默认模块
		}

		if (deps && !L.isArray(deps)) {
			callback = deps;
			deps = null;
		}

		if (!deps) {
			deps = [];
		} else {
			deps = L.clone(deps);
		}

		//获取函数体里直接require('...')的依赖
		if (!this.ignoreCurrentRequireDep) {
			U.appendInnerDeps(deps, callback);
		}

		//对于css,scss,sass,less等自动添加css!
		config && config.plugins.css.autoCssDeal(deps);

		this.selfname = selfname;
		this.deps = deps;
		this.pushName(selfname);
		this.callback = callback;
		this._directDepLength = deps.length;
		this.directDepLength = deps.length;
	}

	get src() {
		return this._src;
	}
	set src(val) {
		this._src = val;
	}

	get scriptSrc() {
		return this._scriptSrc;
	}

	set scriptSrc(val) {
		this._scriptSrc = val;
	}

	pushName(name) {
		if (name && L.indexInArray(this.names, name) == -1) {
			this.names.push(name);
		}
	}

	/**
	 * 处理配置依赖及嵌套依赖,同时会替换前缀
	 */
	appendConfigDepsAndEmbedDeps(module) {
		let config = L.config();
		let src = this.src;
		let deps = this.deps;

		let _deps = config.getDeps(src);
		U.each(_deps, (dep) => {
			if (L.indexInArray(deps, dep) == -1) {
				deps.push(dep);
			}
		});

		U.each(this.names, (name) => {
			_deps = config.getDeps(name);
			U.each(_deps, (dep) => {
				if (L.indexInArray(deps, dep) == -1) {
					deps.push(dep);
				}
			});
		});

		if (this.handle.orderDep && this._directDepLength > 1 && deps.length > this._directDepLength) {
			let odeps = [true]; //第一个true表示顺序依赖
			while (this._directDepLength-- > 0) {
				odeps.push(deps.shift());
			}
			deps.unshift(odeps);
			this.handle.orderDep = false;
		}

		_dealEmbedDeps(deps, this); //处理嵌套依赖

		//替换项目别名；另见：prerequire
		for (let i = 0; i < deps.length; i++) {
			let dep = deps[i];
			deps[i] = config.replaceDepAlias(deps[i]);
		}

		U.replaceModulePrefix(config, deps); //前缀替换

		if (module) {
			module.deps = deps;
			module._dealApplyArgs = (function(directDepLength, hasOrderDep) {
				return function(applyArgs) {
					if (directDepLength == 0 || applyArgs.length == 0) {
						return [];
					}
					//顺序依赖,还原成最初的顺序,移除额外的依赖。
					let args = new Array(directDepLength + 1);
					if (hasOrderDep) {
						args = applyArgs[0];
					} else {
						for (var i = 0; i < directDepLength; i++) {
							args[i] = applyArgs[i];
						}
						args[directDepLength] = applyArgs[applyArgs.length - 1].slice(0,
							directDepLength);
					}
					return args;
				};
			})(this.directDepLength, this.directDepLength > 0 && this._directDepLength <= 0);
		}

	}

	dealRelative(module) {
		let deps = this.deps;
		//处理相对路径
		for (let i = 0; i < deps.length; i++) {
			//console.log(module.selfname+("("+defineObject.handle.defined_module_for_deps+")"), ":", deps);
			let m = deps[i];
			let jsFilePath = U.isJsFile(m);

			//替换相对路径为绝对路径
			if (jsFilePath && L.startsWith(m, ".")) {
				m = U.getPathWithRelative(module.thiz.rurl(this), jsFilePath.path) + _getPluginParam(m);
				deps[i] = m;
			}

			let paths = U.graphPath.tryAddEdge(this.handle.defined_module_for_deps || module.selfname, m);
			if (paths.length > 0) {
				let moduleLoop = moduleScript.getModule(m); //该模块必定已经被定义过
				moduleLoop.loopObject = {};
			}
		}
	}

	absUrlFromDefineObject() {
		return this.handle.absUrl || this.handle.absoluteUrl || this.src;
	}

}

////////////////////////

/**
 * 获取当前脚本，返回对象：
 * src:脚本绝对地址，不含参数
 * node:脚本dom对象
 */
let hasCurrentPath = false;

function getCurrentScript() {
	function _getCurrentScriptOrSrc() { //兼容获取正在运行的js
		//取得正在解析的script节点
		if (document.currentScript !== undefined) { //firefox 4+
			let node = document.currentScript && document.currentScript.src && document.currentScript;
			if (node) {
				return {
					node,
					src: node.src
				};
			}
		}
		if (U.IE_VERSION > 0 && U.IE_VERSION <= 10) {
			let nodes = document.getElementsByTagName("script"); //只在head标签中寻找
			//			U.each(nodes, (node) => {
			//				console.log("node.src=" + node.src + ",node.readyState=" + node.readyState);
			//			});
			for (let i = nodes.length - 1; i >= 0; i--) {
				let node = nodes[i];
				if (node.readyState === "interactive" && node.src) {
					return {
						node,
						src: node.src
					};
				}
			}
		}
		let stack;
		try {
			let a = undefined;
			a.b.c(); //强制报错,以便捕获e.stack
		} catch (e) { //safari的错误对象只有line,sourceId,sourceURL
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
			let s = stack.replace(/(:\d+)?:\d+$/i, ""); //去掉行号与或许存在的出错字符起始位置
			return {
				src: s
			};
		}
	}

	let rs;
	let parentDefine = currentDefineModuleQueue.peek();
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

	if (U.isLoaderEnd() && rs.src == theLoaderUrl) {
		rs.src = thePageUrl;
		rs.node = null;
	}

	if (!rs.node && rs.src != thePageUrl) {
		let src = U.removeQueryHash(rs.src);
		let nodes = document.getElementsByTagName("script"); //只在head标签中寻找
		for (let i = 0; i < nodes.length; i++) {
			let node = nodes[i];
			if (src == U.removeQueryHash(node.src)) {
				rs.node = node;
				break;
			}
		}
	}

	if (rs.node) {
		let __src = rs.node.getAttribute("_current_path_src_");
		rs.src = __src || U.getNodeAbsolutePath(rs.node);
	}

	hasCurrentPath = !!L.__currentPath;

	if (hasCurrentPath) {
		let oldSrc = rs.src;
		rs.srcBeforeCurrentPath = U.removeQueryHash(oldSrc);
		rs.__currentPath = L.__currentPath;
		rs.src = L.getPathWithRelative(oldSrc, L.__currentPath, false);
		rs.src = L.appendArgs2Url(rs.src, oldSrc);
		L.__currentPath = undefined;

		if (rs.srcBeforeCurrentPath != U.removeQueryHash(rs.src)) {
			rs.node.setAttribute("_current_path_src_", rs.src);
		}
	}

	rs.scriptSrc = rs.src;
	rs.src = U.removeQueryHash(rs.src);

	return rs;

}

function __createNode() {
	let node = document.createElement('script');
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

/**
 * callbackObj.onScriptLoad
 * callbackObj.onScriptError
 *
 */
function __browserLoader(moduleName, url, callbackObj) {
	let node = __createNode();
	moduleName && node.setAttribute(DATA_ATTR_MODULE, moduleName);
	node.setAttribute(DATA_ATTR_CONTEXT, defContextName);

	let useAttach = !L.isFunction(node.addEventListener) && node.attachEvent &&
		!(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
		!isOpera;

	if (useAttach) {
		node.attachEvent('onreadystatechange', callbackObj.onScriptLoad);
	} else {
		node.addEventListener('load', callbackObj.onScriptLoad, true);
		let errListen = function() {
			__removeListener(node, errListen, 'error');
			callbackObj.onScriptError.apply(this, arguments);
		};
		callbackObj.errListen = errListen;
		node.addEventListener('error', errListen, true);
	}
	appendHeadDom(node);
	if (U.IE_VERSION > 0 && U.IE_VERSION <= 10) {
		L.asyncCall(() => {
			node.src = url; //在ie10-以下，必须在脚本插入head后再进行src的设置、且需要异步设置。
		});
	} else {
		node.src = url;
	}
}

function __getScriptData(evt, callbackObj) {
	let node = evt.currentTarget || evt.srcElement;
	__removeListener(node, callbackObj.onScriptLoad, 'load', 'onreadystatechange');
	__removeListener(node, callbackObj.errListen, 'error');
	let scriptSrc = node && U.getNodeAbsolutePath(node);
	return {
		node: node,
		name: node && node.getAttribute(DATA_ATTR_MODULE),
		src: U.removeQueryHash(scriptSrc),
		scriptSrc,
	};
}

function appendHeadDom(dom) {
	if (!L.isDOM(dom)) {
		throw new Error("expected dom object,but provided:" + dom);
	}
	let nextDom = lastAppendHeadDom.nextSibling;
	theHead.insertBefore(dom, nextDom);
	//			head.appendChild(dom);
	lastAppendHeadDom = dom;
}

/////////////////////////

function loadScript(moduleName, url, onload, onerror) {
	let callbackObj = {};
	callbackObj.onScriptLoad = function(evt) {
		if (callbackObj.removed) {
			return;
		}
		if (evt.type === 'load' || (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
			callbackObj.removed = true;
			let scriptData = __getScriptData(evt, callbackObj);
			if (isSrcFromScriptLoad) {
				lastSrc = scriptData.src; //已经不含参数
				lastScriptSrc = scriptData.lastScriptSrc;
				L.asyncCall(() => {
					onload(scriptData);
				});
			} else {
				if (U.IE_VERSION > 0 || U.IE_VERSION == "edge") { //ie下确保此事件在脚本之后执行。
					L.asyncCall(() => {
						onload(scriptData);
						L.__ignoreCurrentRequireDep = false;
					});
				} else {
					onload(scriptData);
					L.__ignoreCurrentRequireDep = false;
				}
			}
		}
	};
	callbackObj.onScriptError = function(evt) {
		if (callbackObj.removed) {
			return;
		}
		callbackObj.removed = true;
		let scriptData = __getScriptData(evt, callbackObj);
		onerror(scriptData);
	};
	__browserLoader(moduleName, url, callbackObj);
}

function doDefine(thiz, args, isRequire) {
	//	console.log("**********************************[");
	let rs = getCurrentScript(); //已经不含参数

	//	if(typeof args[0] == "string") {
	//		console.log("args[0]=" + args[0] + ",args[1]=" + args[1] + ",src=" + rs.src);
	//	} else {
	//		console.log("args[0]=" + args[0] + ",src=" + rs.src);
	//	}
	//	console.log(rs.node);
	//	console.log("**********************************]\n");
	let src = rs.src;
	let scriptSrc = rs.scriptSrc;
	let defineObject = new DefineObject(scriptSrc, src, thiz, args, isRequire);
	defineObject.srcBeforeCurrentPath = rs.srcBeforeCurrentPath; //处理__currentPath前的

	if (!isSrcFromScriptLoad) {
		try { //防止执行其他脚本
			if (defineObject.src) {
				let node = document.currentScript;
				if (node && node.getAttribute("src") && node.getAttribute(DATA_ATTR_CONTEXT) != defContextName &&
					defineObject.src != theLoaderUrl && defineObject.src != thePageUrl) {
					console.error("unknown js script module:" + L.xsJson2String(defineObject.src));
					console.error(node);
					return;
				}
			}
		} catch (e) {
			L.config().error(e);
		}
	}

	let handle = new Handle(defineObject);

	let isLoaderEnd = U.isLoaderEnd();
	L.asyncCall(() => {
		if (isSrcFromScriptLoad && isLoaderEnd && !hasCurrentPath) {
			//执行顺序：当前脚本define>load事件(获取lastSrc)>当前位置>onload
			defineObject.src = lastSrc;
			defineObject.lastScriptSrc = lastScriptSrc;
		}
		hasCurrentPath = false;
		theRealDefine([defineObject]);
	});
	return handle;
}

function predefine() {
	let args = [];
	for (let i = 0; i < arguments.length; i++) {
		args.push(arguments[i]);
	}
	return doDefine(this, args, false);
}

let isFirstRequire = true;

function prerequire(deps, callback) {
	let config = L.config();
	if (!config) { //require必须是在config之后
		throw new Error("not config");
	}

	let thatInvoker = getInvoker(this);
	if (arguments.length == 1 && L.isString(deps)) { //获取已经加载的模块
		if (deps == "exports") { //当require("exports")时，必须依赖了exports
			let mineInvoker = getMineInvoker(this);
			let exports = mineInvoker && mineInvoker.exports();
			if (!exports) {
				throw new Error("not found exports");
			} else {
				return exports;
			}
		}

		let originDep = deps;
		let oneDep = deps;
		let pluginArgs = undefined;
		let pluginIndex = oneDep.indexOf("!");
		if (pluginIndex > 0) {
			pluginArgs = oneDep.substring(pluginIndex + 1);
			oneDep = oneDep.substring(0, pluginIndex);
		}

		oneDep = config.replaceDepAlias(oneDep);

		let arr = [oneDep];
		//对于css,scss,sass,less等自动添加css!
		config && config.plugins.css.autoCssDeal(arr);
		oneDep = arr[0];

		let module = moduleScript.getModule(oneDep);
		if (!module) {
			oneDep = thatInvoker.getUrl(oneDep, false);
			module = moduleScript.getModule(oneDep);
		}

		if (!module) {
			throw new Error("the module '" + originDep + "' is not load!");
		} else if (module.state != "defined") {
			throw new Error("the module '" + originDep + "' is not defined:" + module.state);
		}

		let theMod;
		moduleScript.newModuleInstance(module, thatInvoker, (depModule) => {
			theMod = depModule.moduleObject();
		}).initInstance(true, pluginArgs);

		if (theMod === undefined) {
			throw Error("the module '" + originDep + "' is not load!");
		}
		return theMod;
	}

	let selfname = L.randId("_require");
	if (L.isFunction(deps)) {
		callback = deps;
		deps = [];
	} else if (!L.isArray(deps)) {
		throw new Error("unexpected argument:" + deps);
	}
	U.appendInnerDeps(deps, callback);

	let timeid;
	let tagString;
	let loading;
	let isOk = false;
	let customerErrCallback;
	let isErr;
	if (isFirstRequire && config.plugins.loading.enable) {
		isFirstRequire = false;
		setTimeout(() => {
			if (!isOk) {
				loading = new U.ToProgress(config.plugins.loading);
				loading.autoIncrement();
				if (isErr) {
					loading.toError(config.plugins.loading.errColor);
					loading = null;
				}
			}
		}, config.plugins.loading.delay);
	}
	let clearTimer = function(isErr = false) {
		if (loading) {
			if (isErr) {
				loading.toError(config.plugins.loading.errColor);
			} else {
				loading.stopAuto();
				loading.finish();
			}
			loading = null;
		}
		if (timeid !== undefined) {
			clearTimeout(timeid);
			timeid = undefined;
		}
	};

	let handle = doDefine(this, [selfname, deps, function() {
		isOk = true;
		clearTimer();
		//		console.log("2======require:"+selfname);
		//		console.log(callback);
		if (L.isFunction(callback)) {
			try {
				callback.apply(this, arguments);
			} catch (e) {
				handle.onError(e);
			}
		}
	}], true);
	handle.waitTime = config.waitSeconds * 1000;

	handle.logError = function(err, invoker, logFun = "error") {
		invoker && console[logFun]("invoker.url=", invoker.getUrl());
		thatInvoker && console[logFun]("require.invoker.url=", thatInvoker.getUrl());
		console[logFun](U.unwrapError(err));
	};

	let checkResultFun = (forTimeout = false) => {
		try {
			if (!checkResultFun) {
				return;
			}

			let ifmodule = moduleScript.getModule(selfname);
			//console.log(isErr)
			if ((!ifmodule || ifmodule.state != 'defined') && (isErr || forTimeout)) {

				if (forTimeout) {
					handle.onError(
						`require timeout:${tagString?'tag='+tagString:''},\n` +
						`\tdeps=[${deps ? deps.join(",") : ""}]\n` +
						`${thatInvoker?'\tinvokerSrc='+thatInvoker.src():''}`
					);
				}

				if (ifmodule) {
					U.each(ifmodule.deps, (dep) => {
						if (thatInvoker) {
							dep = thatInvoker.getUrl(dep, false);
						}

						let mod = moduleScript.getModule(dep);
						if (mod && mod.printOnNotDefined) {
							mod.printOnNotDefined();
						}
					});
				}
			}
		} catch (e) {
			console.error(e);
		}
		clearTimer();
	};

	handle.error(function(err, invoker) {
		clearTimer(true);
		if (customerErrCallback) {
			let result = customerErrCallback.call(handle, err, invoker);
			if (result && result.ignoreErrState) {
				return result;
			}
		}

		isErr = !!err;
		try {
			handle.logError(err, invoker);
		} catch (e) {
			console.warn(e);
		}

		if (checkResultFun) {
			let fun = checkResultFun;
			checkResultFun = null;
			fun();
		}
	});

	handle.error = function(errCallback) {
		customerErrCallback = errCallback;
		return this;
	};

	handle.setTag = function(tag) {
		tagString = tag;
		return this;
	};

	if (handle.waitTime) {
		timeid = setTimeout(() => {
			checkResultFun(true)
		}, handle.waitTime);
	}

	if (typeof Promise != "undefined" && arguments.length == 1 && !callback) {
		let promise = new Promise((resolve, inject) => {
			callback = function() {
				if (deps.length == 1) {
					resolve(arguments[0]);
				} else {
					let args = [];
					for (var i = 0; i < deps.length; i++) {
						args.push(arguments[i]);
					}
					resolve(args);
				}
			};
			handle.error((err) => {
				callback = null;
				inject(err);
			});
		});
		return promise;
	}

	return handle;
}

//对于safari7-:在脚本加载事件中可获得正确的脚本地址

//initDefine在../define.js里进行初始化
const initDefine = function(theDefine) {
	theRealDefine = (defines, loaded) => {
		if (!L.config()) { //还没有配置
			globalDefineQueue.push(defines);
		} else {
			theDefine(defines, loaded);
		}
	};
	return {
		predefine,
		prerequire,
	};
};

const onConfigedCallback = function() {
	while (globalDefineQueue.length) {
		let defines = globalDefineQueue.shift();
		theRealDefine(defines);
	}
};

export default {
	defContextName,
	theLoaderScript,
	lastAppendHeadDom: function() {
		return lastAppendHeadDom;
	},
	theLoaderUrl,
	thePageUrl,
	head: function() {
		return theHead;
	},
	appendHeadDom,
	initDefine,
	Handle,
	Invoker,
	DefineObject,
	loadScript,
	currentDefineModuleQueue,
	onConfigedCallback,
	INNER_DEPS_PLUGIN,
	innerDepsMap,
};

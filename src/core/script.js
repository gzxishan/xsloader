import utils from "../util/index.js";
import moduleScript from "./module.js";

const global = utils.global;
const xsloader = global.xsloader;

const defContextName = "xsloader1.1.x";
const DATA_ATTR_MODULE = 'data-xsloader-module';
const DATA_ATTR_CONTEXT = "data-xsloader-context";
const INNER_DEPS_PLUGIN = "__inner_deps__";
const innerDepsMap = {}; //内部依赖加载插件用于保存依赖的临时map
const globalDefineQueue = []; //没有配置前的define

const isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]';
const safariVersion = (function() {
	let ua = navigator.userAgent.toLowerCase();
	let s = ua.match(/version\/([\d.]+).*safari/);
	return s ? parseInt(s[1]) : -1;
})();

const readyRegExp = navigator.platform === 'PLAYSTATION 3' ? /^complete$/ : /^(complete|loaded)$/;
const theLoaderScript = document.currentScript || utils.getScriptBySubname("xsloader.js");
const theLoaderUrl = utils.getNodeAbsolutePath(theLoaderScript);
const thePageUrl = (function() {
	let url = location.href;
	url = utils.removeQueryHash(url);
	return url;
})();
const head = document.head || document.getElementsByTagName('head')[0];

const currentDefineModuleQueue = []; //当前回调的模块
currentDefineModuleQueue.peek = function() {
	if(this.length > 0) {
		return this[this.length - 1];
	}
};

let lastAppendHeadDom = theLoaderScript;
let isSrcFromScriptLoad; //获取脚本的src是否在load事件阶段
let lastScriptSrc = thePageUrl;
let theRealDefine;
if(safariVersion > 0 && safariVersion <= 7) {
	isSrcFromScriptLoad = true;
}

//处理嵌套依赖
function _dealEmbedDeps(deps) {
	for(let i = 0; i < deps.length; i++) {
		let dep = deps[i];
		if(xsloader.isArray(dep)) {
			//内部的模块顺序加载
			let modName = "inner_order_" + moduleScript.getModuleId();
			let isOrderDep = !(dep.length > 0 && dep[0] === false);
			if(dep.length > 0 && (dep[0] === false || dep[0] === true)) {
				dep = dep.slice(1);
			}
			innerDepsMap[modName] = {
				deps: dep,
				orderDep: isOrderDep
			};

			//console.log(innerDepsMap[modName]);
			deps[i] = INNER_DEPS_PLUGIN + "!" + modName;
		}
	}
}

function _getPluginParam(path) {
	let pluginIndex = path.indexOf("!");
	if(pluginIndex > 0) {
		return path.substring(pluginIndex);
	} else {
		return "";
	}
}

/////////////////////////////

class Invoker {
	_im;
	constructor(moduleMap) {
		this._im = new InVar(moduleMap);
	}
	/**
	 * 获取绝对地址
	 */
	getAbsoluteUrl() {
		return this._im.get().src;
	}
	getName() {
		return this._im.get().selfname;
	}
	invoker() {
		return this._im.get().invoker;
	}
	absUrl() { //用于获取其他模块地址的参考路径
		return this._im.get().absUrl();
	}
}

function getInvoker(thiz, nullNew = true) {
	if(thiz instanceof Invoker) {
		return thiz;
	} else if(thiz instanceof DefineObject) {
		return thiz.thatInvoker;
	} else if(nullNew) {
		let moduleMap = {
			module: "",
			src: thePageUrl,
			absUrl: () => thePageUrl,
			name: "__root__",
			invoker: null
		};
		moduleMap.thiz = new Invoker(moduleMap);
		moduleScript.buildInvoker(moduleMap);
		moduleMap.thiz.invoker = function() {
			return this;
		};
		return moduleMap.thiz;
	}
}

class DefineObject {
	thiz;
	isRequire;
	src;
	parentDefine;
	handle;
	selfname;
	deps;
	callback;
	thatInvoker;
	constructor(src, thiz, args = [], isRequire = false, willDealConfigDeps = true) {
		this.src = src;
		this.thiz = thiz;
		this.isRequire = isRequire;
		this.parentDefine = currentDefineModuleQueue.peek();
		this.handle = {
			onError(err) {
				console.warn(err);
			},
			before(deps) {},
			depBefore(index, dep, depDeps) {},
			orderDep: false,
			absoluteUrl: undefined, //弃用
			absUrl: undefined,
			instance: undefined,
		};
		this.thatInvoker = getInvoker(thiz);

		let selfname = args[0];
		let deps = args[1];
		let callback = args[2];
		if(args.length == 1) {
			//直接定义模块，且没有依赖
			callback = selfname;
			selfname = null;
			deps = null;
		} else if(typeof selfname !== 'string') {
			callback = deps;
			deps = selfname;
			selfname = null; //为空的、表示定义默认模块
		}

		if(deps && !xsloader.isArray(deps)) {
			callback = deps;
			deps = null;
		}

		if(!deps) {
			deps = [];
		}

		//获取函数体里直接require('...')的依赖
		//if(!isRequire) {
		utils.appendInnerDeps(deps, callback);
		//}

		this.selfname = selfname;
		this.deps = deps;
		this.callback = callback;

		if(willDealConfigDeps) {
			//处理配置依赖及嵌套依赖
			this.dealConfigDeps();
		}

	}

	dealConfigDeps() {
		let src = this.src;
		let selfname = this.selfname;
		let deps = this.deps;
		let config = xsloader.config();
		if(config) {
			//获取配置里配置的依赖
			let _deps = config.getDeps(src);
			utils.each(_deps, (dep) => {
				deps.push(dep);
			});
			if(selfname && selfname != src) {
				_deps = config.getDeps(selfname);
				utils.each(_deps, (dep) => {
					deps.push(dep);
				});
			}
			//前缀替换
			utils.replaceModulePrefix(config, deps);
		}

		//处理嵌套依赖
		_dealEmbedDeps(deps);
	}

	dealRelative(module) {
		let deps = this.deps;
		//处理相对路径
		for(let i = 0; i < deps.length; i++) {
			//console.log(module.selfname+("("+defineObject.handle.defined_module_for_deps+")"), ":", deps);
			let m = deps[i];
			let jsFilePath = utils.isJsFile(m);

			if(module.thiz.rurl(this)) { //替换相对路径为绝对路径
				if(jsFilePath && xsloader.startsWith(m, ".")) {
					m = utils.getPathWithRelative(module.thiz.rurl(this), jsFilePath.path) + _getPluginParam(m);
					deps[i] = m;
				}
			}
			let paths = utils.graphPath.tryAddEdge(this.handle.defined_module_for_deps || module.selfname, m);
			if(paths.length > 0) {
				let moduleLoop = moduleScript.getModule(m); //该模块必定已经被定义过
				moduleLoop.loopObject = {};
			}
		}
	}

	absUrl() {
		return this.getMineAbsUrl() || this.src; //(this.thatInvoker ? this.thatInvoker.absUrl() : null);
	}

	getMineAbsUrl() {
		return this.handle.absUrl || this.handle.absoluteUrl;
	}
}

////////////////////////

/**
 * 获取当前脚本，返回对象：
 * src:脚本绝对地址，不含参数
 * node:脚本dom对象
 * @param {Object} isRemoveQueryHash
 */
function getCurrentScript(isRemoveQueryHash = true) {
	function _getCurrentScriptOrSrc() { //兼容获取正在运行的js
		//取得正在解析的script节点
		if(document.currentScript !== undefined) { //firefox 4+
			let node = document.currentScript && document.currentScript.src && document.currentScript;
			if(node) {
				return {
					node,
					src: node.src
				};
			}
		}
		if(utils.IE_VERSION > 0 && utils.IE_VERSION <= 10) {
			let nodes = document.getElementsByTagName("script"); //只在head标签中寻找
			for(let i = 0; i < nodes.length; i++) {
				let node = nodes[i];
				if(node.readyState === "interactive") {
					if(node.src) {
						return {
							node,
							src: node.src
						};
					} else {
						return {
							src: thePageUrl
						};
					}
				}
			}
		}
		let stack;
		try {
			let a = undefined;
			a.b.c(); //强制报错,以便捕获e.stack
		} catch(e) { //safari的错误对象只有line,sourceId,sourceURL
			stack = e.stack || e.sourceURL || e.stacktrace || '';
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
			let s = stack.replace(/(:\d+)?:\d+$/i, ""); //去掉行号与或许存在的出错字符起始位置
			return {
				src: s
			};
		}
	}

	let rs = _getCurrentScriptOrSrc();
	if(!rs) {
		rs = {
			src: thePageUrl
		};
	}

	if(utils.isLoaderEnd() && rs.src == theLoaderUrl) {
		rs.src = thePageUrl;
		rs.node = null;
	}

	if(!rs.node && rs.src != thePageUrl) {
		let src = utils.removeQueryHash(rs.src);
		let nodes = document.getElementsByTagName("script"); //只在head标签中寻找
		for(let i = 0; i < nodes.length; i++) {
			let node = nodes[i];
			if(src == utils.removeQueryHash(node.src)) {
				rs.node = node;
				break;
			}
		}
	}

	if(rs.node) {
		rs.src = utils.getNodeAbsolutePath(rs.node);
	}
	if(isRemoveQueryHash) {
		rs.src = utils.removeQueryHash(rs.src);
	}
	return rs;

}

function __createNode() {
	let node = document.createElement('script');
	node.type = 'text/javascript';
	node.charset = 'utf-8';
	node.async = true;
	return node;
}

function __removeListener(node, func, name, ieName) {
	if(node.detachEvent && !isOpera) {
		if(ieName) {
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

	let useAttach = !xsloader.isFunction(node.addEventListener) && node.attachEvent &&
		!(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
		!isOpera;

	if(useAttach) {
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
	node.src = url;
	appendHeadDom(node);
}

function __getScriptData(evt, callbackObj) {
	let node = evt.currentTarget || evt.srcElement;
	__removeListener(node, callbackObj.onScriptLoad, 'load', 'onreadystatechange');
	__removeListener(node, callbackObj.errListen, 'error');
	return {
		node: node,
		name: node && node.getAttribute(DATA_ATTR_MODULE),
		src: utils.removeQueryHash(node && utils.getNodeAbsolutePath(node))
	};
}

function appendHeadDom(dom) {
	if(!xsloader.isDOM(dom)) {
		throw new Error("expected dom object,but provided:" + dom);
	}
	let nextDom = lastAppendHeadDom.nextSibling;
	head.insertBefore(dom, nextDom);
	//			head.appendChild(dom);
	lastAppendHeadDom = dom;
}

/////////////////////////

function loadScript(moduleName, url, onload, onerror) {
	let callbackObj = {};
	callbackObj.onScriptLoad = function(evt) {
		if(callbackObj.removed) {
			return;
		}
		if(evt.type === 'load' || (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
			callbackObj.removed = true;
			let scriptData = __getScriptData(evt, callbackObj);
			if(isSrcFromScriptLoad) {
				lastScriptSrc = scriptData.src; //已经不含参数
				xsloader.asyncCall(() => {
					onload(scriptData);
				});
			} else {
				if(utils.IE_VERSION > 0) { //ie下确保此事件在脚本之后执行。
					xsloader.asyncCall(() => {
						onload(scriptData);
					});
				} else {
					onload(scriptData);
				}
			}
		}
	};
	callbackObj.onScriptError = function(evt) {
		if(callbackObj.removed) {
			return;
		}
		callbackObj.removed = true;
		let scriptData = __getScriptData(evt, callbackObj);
		onerror(scriptData);
	};
	__browserLoader(moduleName, url, callbackObj);
}

function doDefine(thiz, args, isRequire) {
	let src = getCurrentScript().src; //已经不含参数
	let defineObject = new DefineObject(src, thiz, args, isRequire, !isSrcFromScriptLoad);
	if(!isSrcFromScriptLoad) {
		try { //防止执行其他脚本
			if(defineObject.src) {
				let node = document.currentScript;
				if(node && node.getAttribute("src") && node.getAttribute(DATA_ATTR_CONTEXT) != defContextName &&
					defineObject.src != theLoaderUrl && defineObject.src != thePageUrl) {
					console.error("unknown js script module:" + xsloader.xsJson2String(defineObject.src));
					console.error(node);
					return;
				}
			}
		} catch(e) {
			xsloader.config().error(e);
		}

	}

	let handle = {
		then(option) {
			defineObject.handle = xsloader.extend(defineObject.handle, option);
			return this;
		},
		error(onError) {
			defineObject.handle.onError = onError;
			return this;
		}
	};

	let isLoaderEnd = utils.isLoaderEnd();
	xsloader.asyncCall(() => {
		if(isSrcFromScriptLoad && isLoaderEnd) {
			//执行顺序：当前脚本define>load事件(获取lastScriptSrc)>当前位置>onload
			defineObject.src = lastScriptSrc;
			defineObject.dealConfigDeps();
			theRealDefine([defineObject]);
		} else {
			theRealDefine([defineObject]);
		}
	});
	return handle;
}

function predefine() {
	let args = [];
	for(let i = 0; i < arguments.length; i++) {
		args.push(arguments[i]);
	}
	return doDefine(this, args, false);
}

function prerequire(deps, callback) {

	if(!xsloader.config()) { //require必须是在config之后
		throw new Error("not config");
	}
	let thatInvoker = getInvoker(this, true);
	if(arguments.length == 1 && xsloader.isString(deps)) { //获取已经加载的模块
		let originDeps = deps;
		let pluginArgs = undefined;
		let pluginIndex = deps.indexOf("!");
		if(pluginIndex > 0) {
			pluginArgs = deps.substring(pluginIndex + 1);
			deps = deps.substring(0, pluginIndex);
			if(pluginArgs) {
				let argArr = [pluginArgs];
				utils.replaceModulePrefix(xsloader.config(), argArr); //前缀替换
				pluginArgs = argArr[0];
			}
		}
		let module = moduleScript.getModule(deps);
		if(!module) {
			deps = thatInvoker.getUrl(deps, false);
			module = moduleScript.getModule(deps);
		}
		if(!module) {
			throw new Error("the module '" + originDeps + "' is not load!");
		} else if(module.state != "defined") {
			throw new Error("the module '" + originDeps + "' is not defined:" + module.state);
		}
		let theMod;
		moduleScript.newModuleInstance(module, thatInvoker, (depModule) => {
			theMod = depModule.moduleObject();
		}, pluginArgs).init(true);
		if(theMod === undefined) {
			throw Error("the module '" + originDeps + "' is not load!");
		}
		return theMod;
	}

	let selfname = xsloader.randId("_require");
	if(xsloader.isFunction(deps)) {
		callback = deps;
		deps = [];
	}
	utils.appendInnerDeps(deps, callback);
	let timeid;
	let handle = doDefine(this, [selfname, deps, function() {
		if(timeid !== undefined) {
			clearTimeout(timeid);
			timeid = undefined;
		}
		if(xsloader.isFunction(callback)) {
			callback.apply(this, arguments);
		}
	}], true);
	let customerErrCallback;
	let isErr;

	handle.error(function(err, invoker) {
		isErr = err;
		if(timeid !== undefined) {
			clearTimeout(timeid);
			timeid = undefined;
		}
		if(customerErrCallback) {
			customerErrCallback(err, invoker);
		} else {
			console.warn("invoker.url:" + invoker.getUrl());
			console.warn(err);
		}
	});
	handle.error = function(errCallback) {
		customerErrCallback = errCallback;
		return this;
	};

	let checkResultFun = function() {
		timeid = undefined;
		let ifmodule = moduleScript.getModule(selfname);
		if((!ifmodule || ifmodule.state != 'defined') && !isErr) {
			let module = ifmodule;
			if(module) {
				utils.each(module.deps, function(dep) {
					let mod = moduleScript.getModule(dep);
					if(mod && mod.printOnNotDefined) {
						mod.printOnNotDefined();
					}
				});
			}
			console.error("require timeout:[" + (deps ? deps.join(",") : "") + "]");
		}
	};
	timeid = setTimeout(checkResultFun, xsloader.config().waitSeconds * 1000);
	return handle;
}

//对于safari7-:在脚本加载事件中可获得正确的脚本地址

const initDefine = function(theDefine) {
	theRealDefine = (defines, loaded) => {
		if(!xsloader.config()) { //还没有配置
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
	while(globalDefineQueue.length) {
		let defines = globalDefineQueue.shift();
		theRealDefine(defines);
	}
};

export default {
	defContextName,
	theLoaderScript,
	theLoaderUrl,
	thePageUrl,
	appendHeadDom,
	initDefine,
	Invoker,
	DefineObject,
	loadScript,
	currentDefineModuleQueue,
	onConfigedCallback,
	INNER_DEPS_PLUGIN,
	innerDepsMap,
};
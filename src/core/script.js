import utils from "../util/index.js";
const global = utils.global;
const xsloader = global.xsloader;

const defContextName = "xsloader1.1.x";
const DATA_ATTR_MODULE = 'data-xsloader-module';
const DATA_ATTR_CONTEXT = "data-xsloader-context";

const isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]';
const readyRegExp = navigator.platform === 'PLAYSTATION 3' ? /^complete$/ : /^(complete|loaded)$/;
const theLoaderScript = document.currentScript || utils.getScriptBySubname("xsloader.js");
const theLoaderUrl = utils.getNodeAbsolutePath(theLoaderScript);
const thePageUrl = (function() {
	let url = location.href;
	url = utils.removeQueryHash(url);
	return url;
})();

const currentDefineModuleQueue = []; //当前回调的模块
currentDefineModuleQueue.peek = function() {
	if(this.length > 0) {
		return this[this.length - 1];
	}
};

let lastAppendHeadDom = theLoaderScript;
let useDefineQueue;
let theRealDefine;
if(utils.safariVersion > 0 && utils.safariVersion <= 7) {
	useDefineQueue = [];
}
/////////////////////////////

class Invoker {
	moduleMap;
	constructor(moduleMap) {
		this.moduleMap = moduleMap;
	}
	getAbsoluteUrl() {
		return this.moduleMap.src;
	}
	getName() {
		return this.moduleMap.name;
	}
	invoker() {
		return this.moduleMap.invoker;
	}
	absUrl() { //用于获取其他模块地址的参考路径
		return this.moduleMap.absoluteUrl;
	}
}

class DefineObject {
	thiz;
	args;
	isRequire;
	src;
	parentDefine;
	handle;
	selfname;
	deps;
	callback;
	thatInvoker;
	constructor(thiz, args, isRequire = false) {
		this.thiz = thiz;
		this.args = args;
		this.isRequire = isRequire;
		this.parentDefine = currentDefineModuleQueue.peek();
		this.handle = {
			onError(err) {

			},
			before(deps) {},
			depBefore(index, dep, depDeps) {},
			orderDep: false,
			absoluteUrl: undefined,
			instance: undefined,
			absUrl: () => {
				return this.handle.absoluteUrl || (this.thatInvoker ? this.thatInvoker.absUrl() : null);
			}

		};
		if(thiz instanceof Invoker) {
			this.thatInvoker = thiz;
		} else if(thiz instanceof DefineObject) {
			this.thatInvoker = thiz.thatInvoker;
		}
		if(!isRequire && (this.parentDefine || this.thatInvoker) && (args.length == 0 || !xsloader.isString(args[0]))) {
			throw new Error("define:expected selfname");
		}
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
	if(rs) {
		if(!rs.node) {
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
		rs.src = utils.getNodeAbsolutePath(rs.src);
		if(isRemoveQueryHash) {
			rs.src = utils.removeQueryHash(rs.src);
		}
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
	node.setAttribute(DATA_ATTR_MODULE, moduleName);
	node.setAttribute(DATA_ATTR_CONTEXT, defContextName);
	if(node.attachEvent &&
		!(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
		!isOpera) {
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
		src: node && utils.getNodeAbsolutePath(node.src || node.getAttribute("src"))
	};
}

function appendHeadDom(dom) {
	if(!xsloader.isDOM(dom)) {
		throw new Error("expected dom object,but provided:" + dom);
	}
	let nextDom = lastAppendHeadDom.nextSibling;
	utils.head.insertBefore(dom, nextDom);
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
			if(useDefineQueue) {
				utils.each(useDefineQueue, (defineObject) => {
					defineObject.src = scriptData.src;
				});
				theRealDefine.define([...useDefineQueue]);
			}
			onload(scriptData);
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

	let defineObject = new DefineObject(thiz, args, isRequire);
	if(!useDefineQueue) {
		defineObject.src = getCurrentScript().src;
		try { //防止执行其他脚本
			if(defineObject.src) {
				var node = document.currentScript;
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

	xsloader.asyncCall(() => {
		if(useDefineQueue) {
			useDefineQueue.push(defineObject);
		} else {
			theRealDefine.define([defineObject]);
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

function prerequire() {
	throw 'todo...';
}

//对于safari7-:在脚本加载事件中可获得正确的脚本地址

const initDefine = function(theDefine) {
	theRealDefine = theDefine;
	return {
		predefine,
		prerequire,
	};
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
	currentDefineModuleQueue
};
import {
	scripts,
	safariVersion,
	isOpera,
	IE_VERSION,
	getPathWithRelative,
	getNodeAbsolutePath,
	isDom,
	head,
	removeQueryHash,
} from "../utils.js"

const readyRegExp = navigator.platform === 'PLAYSTATION 3' ? /^complete$/ : /^(complete|loaded)$/;
const theLoaderScript = document.currentScript || scripts("xsloader.js");
const theLoaderUrl = getNodeAbsolutePath(theLoaderScript);

const DATA_ATTR_MODULE = 'data-xsloader-module';
const DATA_ATTR_CONTEXT = "data-xsloader-context";
const defContextName = "xsloader1.1.0";
let lastAppendHeadDom = theLoaderScript;
let useDefineQueue;
let theRealDefine;
if(safariVersion > 0 && safariVersion <= 7) {
	useDefineQueue = [];
}

const thePageUrl = (function() {
	let url = location.href;
	url = removeQueryHash(url);
	return url;
})();

function getCurrentScriptSrc(isRemoveQueryHash = true) {
	function _getCurrentScriptSrc() { //兼容获取正在运行的js
		//取得正在解析的script节点
		if(document.currentScript !== undefined) { //firefox 4+
			return document.currentScript && document.currentScript.src || "";
		}
		if(IE_VERSION > 0 && IE_VERSION <= 10) {
			let nodes = document.getElementsByTagName("script"); //只在head标签中寻找
			for(let i = 0, node; node = nodes[i++];) {
				if(node.readyState === "interactive") {
					return node.src;
				}
			}
		}
		let stack, i;
		try {
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
			return s;
		}
	}

	let src = _getCurrentScriptSrc();
	if(isRemoveQueryHash) {
		src = removeQueryHash(src);
	}
	if(src) {
		src = getPathWithRelative(location.href, src);
	}
	return src;

};

function __createNode() {
	let node = document.createElement('script');
	node.type = 'text/javascript';
	node.charset = 'utf-8';
	node.async = true;
	if(useDefineQueue) {
		node.defer = true;
	}
	return node;
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
		}
		callbackObj.errListen = errListen;
		node.addEventListener('error', errListen, true);
	}
	node.src = url;
	appendHeadDom(node);
};

function __getScriptData(evt, callbackObj) {
	let node = evt.currentTarget || evt.srcElement;
	__removeListener(node, callbackObj.onScriptLoad, 'load', 'onreadystatechange');
	__removeListener(node, callbackObj.errListen, 'error');
	return {
		node: node,
		name: node && node.getAttribute(DATA_ATTR_MODULE),
		src: node && (node.src || node.getAttribute("src"))
	};
}

const appendHeadDom = function(dom) {
	if(!isDOM(dom)) {
		throw new Error("expected dom object,but provided:" + dom);
	}
	let nextDom = lastAppendHeadDom.nextSibling;
	head.insertBefore(dom, nextDom);
	//			head.appendChild(dom);
	lastAppendHeadDom = dom;
}

function loaderScript(moduleName, url, onload, onerror) {
	let callbackObj = {};
	callbackObj.onScriptLoad = function(evt) {
		if(callbackObj.removed) {
			return;
		}
		if(evt.type === 'load' || (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
			callbackObj.removed = true;
			let scriptData = __getScriptData(evt, callbackObj);

			if(useDefineQueue) {
				try {
					document.currentScript = scriptData.node;
					while(useDefineQueue.length) {
						let obj = useDefineQueue.shift();
						theRealDefinetheRealDefine.apply(obj.thiz, obj.args);
					}
				} catch(e) {}
				document.currentScript = undefined;
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

function throwError(code, info, invoker) {
	if(xsloader.onError) {
		xsloader.onError(info, invoker);
	}
	throw code + ":" + info;
}

//对于safari7-:可采用一个一个加载的方式
//
function getDefineObject(theDefine) {
	theRealDefine = theDefine;
	let define = function() {
		if(useDefineQueue) {
			//then的处理
			let args = [];
			for(let i = 0; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			useDefineQueue.push({
				thiz: this,
				args: args
			});
		} else {
			return theRealDefine.apply(this, arguments);
		}
	};
	let thisDefine = function() {
		return theRealDefine.apply(this, arguments);
	};
	return define;
}

export {
	DATA_ATTR_MODULE,
	DATA_ATTR_CONTEXT,
	defContextName,
	appendHeadDom,
	theLoaderScript,
	theLoaderUrl,
	thePageUrl,
	loaderScript,
	getCurrentScriptSrc,
	throwError,
}
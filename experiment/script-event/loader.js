console.log("this is loader.");
(function() {

	var safariVersion = (function() {
		var ua = navigator.userAgent.toLowerCase();
		var s;
		return(s = ua.match(/version\/([\d.]+)\s+safari/)) ? parseInt(s[1]) : -1;
	})();
	console.log("safari:",safariVersion)
	
	//-1表示不是ie，其余检测结果为6~11及edge
	var IE_VERSION = (function() {
		var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串  
		var isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1; //判断是否IE<11浏览器  
		var isEdge = userAgent.indexOf("Edge") > -1 && !isIE; //判断是否IE的Edge浏览器  
		var isIE11 = userAgent.indexOf('Trident') > -1 && userAgent.indexOf("rv:11.0") > -1;
		if(isIE) {
			var reIE = new RegExp("MSIE[\\s]+([0-9.]+);").exec(userAgent);
			var fIEVersion = parseInt(reIE && reIE[1] || -1);
			return fIEVersion == -1 ? -1 : fIEVersion;
		} else if(isEdge) {
			return 'edge'; //edge
		} else if(isIE11) {
			return 11; //IE11  
		} else {
			return -1; //不是ie浏览器
		}
	})();



	var isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]';
	var readyRegExp = navigator.platform === 'PLAYSTATION 3' ? /^complete$/ : /^(complete|loaded)$/;
	var head = document.head || document.getElementsByTagName('head')[0];

	var useDefineQueue, theDefineQueue;
	if(safariVersion > 0 && safariVersion <= 7) {
		useDefineQueue = true;
		theDefineQueue = [];
	}

	function __createNode() {
		var node = document.createElement('script');
		node.type = 'text/javascript';
		node.charset = 'utf-8';
		node.async = true;
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

	(function() {
		var node = head;
		if(node.attachEvent &&
			!(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
			!isOpera) {
			console.log("use attachEvent");
		} else {
			console.log("use addEventListener");
		}
	})();

	/**
	 * callbackObj.onScriptLoad
	 * callbackObj.onScriptError
	 *
	 */
	function __browserLoader(url, callbackObj) {
		var node = __createNode();
		if(node.attachEvent &&
			!(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
			!isOpera) {
			node.attachEvent('onreadystatechange', callbackObj.onScriptLoad);
		} else {
			node.addEventListener('load', callbackObj.onScriptLoad, true);
			var errListen = function() {
				__removeListener(node, errListen, 'error');
				callbackObj.onScriptError.apply(this, arguments);
			}
			callbackObj.errListen = errListen;
			node.addEventListener('error', errListen, true);
		}
		node.src = url;
		head.appendChild(node);
	};

	function __getScriptData(evt, callbackObj) {

		var node = evt.currentTarget || evt.srcElement;
		__removeListener(node, callbackObj.onScriptLoad, 'load', 'onreadystatechange');
		__removeListener(node, callbackObj.errListen, 'error');
		return {
			node: node
		};
	}

	function _getCurrentScriptSrc() {
		function getCurrentScriptSrc() { //兼容获取正在运行的js
			//取得正在解析的script节点
			if(document.currentScript !== undefined) { //firefox 4+
				return document.currentScript && document.currentScript.src || "";
			}
			if(IE_VERSION > 0 && IE_VERSION <= 10) {
				var nodes = document.getElementsByTagName("script"); //只在head标签中寻找
				for(var i = 0, node; node = nodes[i++];) {
					if(node.readyState === "interactive") {
						return node.src;
					}
				}
			}
			var stack;
			try {
				throw new Error();
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
				var s = stack.replace(/(:\d+)?:\d+$/i, ""); //去掉行号与或许存在的出错字符起始位置
				return s;
			}
		}

		var src = getCurrentScriptSrc();
		return src;

	};

	///////////////////////////////////

	var loaderScript = function(url) {
		var callbackObj = {};
		callbackObj.onScriptLoad = function(evt) {
			if(callbackObj.removed) {
				return;
			}
			if(evt.type === 'load' ||
				(readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {

				var scriptData = __getScriptData(evt, callbackObj);

				if(useDefineQueue) {
					try {
						document.currentScript = scriptData.node;
						while(theDefineQueue.length) {
							var obj = theDefineQueue.shift();
							theDefine.apply(obj.thiz, obj.args);
						}
					} catch(e) {}
					document.currentScript = undefined;
				}

				console.log("script load src:", scriptData.node.src);
				console.log("\tcurrent.src:", currentScript())
			}
		};
		callbackObj.onScriptError = function(evt) {
			if(callbackObj.removed) {
				return;
			}
			var scriptData = __getScriptData(evt, callbackObj);
			console.log("script error src:", scriptData.node.src);
		};

		__browserLoader(url, callbackObj);
	}

	loaderScript("a.js");
	loaderScript("b.js");

	window.loaderScript = loaderScript;
	window.currentScript = _getCurrentScriptSrc;
	var theDefine = function(callback) {
		console.log("define.current.src:", currentScript())
		callback();
	}
	window.define = function(callback) {
		if(useDefineQueue) {
			console.log("__define.current.src:", currentScript())
			var args = [];
			for(var i = 0; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			theDefineQueue.push({
				thiz: this,
				args: args
			});
		} else {
			theDefine.apply(this, arguments);
		}
	}

})();
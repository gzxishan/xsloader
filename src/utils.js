import xsJSON from './core/json.js';

//-1表示不是ie，其余检测结果为ie6~ie11及edge
const IE_VERSION = (() => {
	let userAgent = navigator.userAgent; //取得浏览器的userAgent字符串  
	let isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1; //判断是否IE<11浏览器  
	let isEdge = userAgent.indexOf("Edge") > -1 && !isIE; //判断是否IE的Edge浏览器  
	let isIE11 = userAgent.indexOf('Trident') > -1 && userAgent.indexOf("rv:11.0") > -1;
	if(isIE) {
		let reIE = new RegExp("MSIE[\\s]+([0-9.]+);").exec(userAgent);
		let fIEVersion = parseInt(reIE && reIE[1] || -1);
		return fIEVersion == -1 ? -1 : fIEVersion;
	} else if(isEdge) {
		return 'edge'; //edge
	} else if(isIE11) {
		return 11; //IE11  
	} else {
		return -1; //不是ie浏览器
	}
})();
const op = Object.prototype;
const ostring = op.toString;

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
			error: function() {},
			warn: function() {}
		};
	} catch(e) {}
}

try {
	if(!String.prototype.trim) {
		String.prototype.trim = function(str) {
			return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
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
			return thiz;
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

const global = window;
const tglobal = (() => {
	let win = window;
	try {
		while(true) {
			if(win.parent && win != win.parent && (win.location.hostname == win.parent.hostname)) {
				win = win.parent;
			} else {
				break;
			}
		}
	} catch(e) {}
	return win;
})();

const setTimeout = global.setTimeout;

function scripts(subname) {
	let ss = document.getElementsByTagName('script');
	if(subname) {
		for(let i = 0; i < ss.length; i++) {
			let script = ss[i];
			let src = script.src;
			src = src.substring(src.lastIndexOf("/"));
			if(src.indexOf(subname) >= 0) {
				return script;
			}
		}
	} else {
		return ss;
	}
}

function dealPathMayAbsolute(path, currentUrl) {
	currentUrl = currentUrl || location.href;
	let rs = ABSOLUTE_PROTOCOL_REG.exec(path);

	let finalPath;
	let absolute;
	if(rs) {
		let protocol = rs[1];
		absolute = true;

		rs = ABSOLUTE_PROTOCOL_REG2.exec(currentUrl);
		let _protocol = rs && rs[1] || location.protocol;
		let _host = rs && rs[2] || location.host;

		if(protocol == "//") {
			finalPath = _protocol + "//" + path;
		} else if(protocol == "/") {
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

	let pathQuery = "";
	let relativeQuery = "";
	let qIndex = path.lastIndexOf("?");
	if(qIndex >= 0) {
		pathQuery = path.substring(qIndex);
		path = path.substring(0, qIndex);
	} else {
		qIndex = path.lastIndexOf("#");
		if(qIndex >= 0) {
			pathQuery = path.substring(qIndex);
			path = path.substring(0, qIndex);
		}
	}

	qIndex = relative.lastIndexOf("?");
	if(qIndex >= 0) {
		relativeQuery = relative.substring(qIndex);
		relative = relative.substring(0, qIndex);
	} else {
		qIndex = relative.lastIndexOf("#");
		if(qIndex >= 0) {
			relativeQuery = relative.substring(qIndex);
			relative = relative.substring(0, qIndex);
		}
	}

	let absolute = dealPathMayAbsolute(relative);
	if(absolute.absolute) {
		return absolute.path + relativeQuery;
	}

	if(isPathDir === undefined) {
		let index = path.lastIndexOf("/");
		if(index == path.length - 1) {
			isPathDir = true;
		} else {
			if(index == -1) {
				index = 0;
			} else {
				index++;
			}
			isPathDir = path.indexOf(".", index) == -1;
		}
	}

	if(_endsWith(path, "/")) {
		path = path.substring(0, path.length - 1);
	}

	let isRelativeDir = false;
	if(relative == "." || relative.endsWith("/")) {
		relative = relative.substring(0, relative.length - 1);
		isRelativeDir = true;
	} else if(relative == "." || relative == ".." || relative.endsWith("/.") || relative.endsWith("/..")) {
		isRelativeDir = true;
	}

	let prefix = "";
	let index = -1;
	let absolute2 = dealPathMayAbsolute(path);
	if(absolute2.absolute) {
		path = absolute2.path;
		let index2 = path.indexOf("//");
		index = path.indexOf("/", index2 + 2);
		if(index == -1) {
			index = path.length;
		}
	}

	prefix = path.substring(0, index + 1);
	path = path.substring(index + 1);

	let stack = path.split("/");
	if(!isPathDir && stack.length > 0) {
		stack.pop();
	}
	let relatives = relative.split("/");
	for(let i = 0; i < relatives.length; i++) {
		let str = relatives[i];
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
	let result = prefix + stack.join("/");
	if(isRelativeDir && !result.endsWith("/")) {
		result += "/";
	}
	//		result += pathQuery;
	result = appendArgs2Url(result, relativeQuery);
	return result;
};

function getNodeAbsolutePath(node) {
	let src = node.src;
	return getPathWithRelative(location.href, src);
}

function toParamsMap(argsStr, decode = true) {
	if(isObject(argsStr)) {
		return argsStr;
	}
	if(!argsStr) {
		argsStr = location.search;
	}

	let index = argsStr.indexOf("?");
	if(index >= 0) {
		argsStr = argsStr.substring(index + 1);
	} else {
		if(_dealAbsolute(argsStr)) {
			return {};
		}
	}
	index = argsStr.lastIndexOf("#");
	if(index >= 0) {
		argsStr = argsStr.substring(0, index);
	}

	let ret = {},
		seg = argsStr.split('&'),
		len = seg.length,
		i = 0,
		s;
	for(; i < len; i++) {
		if(!seg[i]) {
			continue;
		}
		s = seg[i].split('=');
		let name = decode ? decodeURIComponent(s[0]) : s[0];
		ret[name] = decode ? decodeURIComponent(s[1]) : s[1];
	}
	return ret;
}

function appendArgs2Url(url, urlArgs) {
	if(url === undefined || url === null || !urlArgs) {
		return url;
	}

	function replaceUrlParams(myUrl, newParams) {
		for(let x in newParams) {
			let hasInMyUrlParams = false;
			for(let y in myUrl.params) {
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
		let _result = myUrl.protocol + "://" + myUrl.host + (myUrl.port ? ":" + myUrl.port : "") + myUrl.path + "?";

		for(let p in myUrl.params) {
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

	let index = url.lastIndexOf("?");
	let hashIndex = url.lastIndexOf("#");
	if(hashIndex < 0) {
		hashIndex = url.length;
	}
	let oldParams = index < 0 ? {} : toParamsMap(url.substring(index + 1, hashIndex), false);
	let newParams = toParamsMap(urlArgs, false);
	let has = false;
	for(let k in newParams) {
		if(oldParams[k] != newParams[k]) {
			oldParams[k] = newParams[k];
			has = true;
		}
	}
	if(!has) {
		return url; //参数没有变化直接返回
	}

	let paramKeys = [];
	for(let k in oldParams) {
		paramKeys.push(k);
	}
	paramKeys.sort();

	let path = index < 0 ? url.substring(0, hashIndex) : url.substring(0, index);
	let params = [];

	for(let i = 0; i < paramKeys.length; i++) { //保证参数按照顺序
		let k = paramKeys[i];
		params.push(k + "=" + oldParams[k]);
	}
	params = params.join("&");
	let hash = "";
	if(hashIndex >= 0 && hashIndex < url.length) {
		hash = url.substring(hashIndex);
	}
	return path + (params ? "?" + params : "") + (hash ? hash : "");

};

//去掉url的query参数和#参数
function removeQueryHash(url) {
	if(url) {
		let index = url.indexOf("?");
		if(index >= 0) {
			url = url.substring(0, index);
		}

		index = url.indexOf("#");
		if(index >= 0) {
			url = url.substring(0, index);
		}
	}
	return url;
};

function isDom = ((typeof HTMLElement === 'object') ?
	function(obj) {
		return obj && (obj instanceof HTMLElement);
	} :
	function(obj) {
		return obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string';
	});

const head = document.head || document.getElementsByTagName('head')[0];

const REPLACE_STRING_PROPERTIES_EXP = new RegExp("\\$\\{([^\\{]+)\\}");
const ALL_TYPE_PROPERTIES_EXP = new RegExp("^\\$\\[([^\\[\\]]+)\\]$");

function propertiesDeal(configObject, properties) {
	if(!properties) {
		return configObject;
	}

	function replaceStringProperties(string, properties, property) {
		let rs;
		let str = string;
		rs = ALL_TYPE_PROPERTIES_EXP.exec(str);
		if(rs) {
			let propKey = rs[1];
			let propValue = xsloader.getObjectAttr(properties, propKey);
			if(propValue === undefined) {
				return str;
			} else {
				return propValue;
			}
		}

		let result = "";
		while(true) {
			rs = REPLACE_STRING_PROPERTIES_EXP.exec(str);
			if(!rs) {
				result += str;
				break;
			} else {
				let propKey = rs[1];
				if(property !== undefined && property.propertyKey == propKey) {
					throw new Error("replace property error:propertyKey=" + propKey);
				} else if(property) {
					property.has = true;
				}
				result += str.substring(0, rs.index);
				result += xsloader.getObjectAttr(properties, propKey);
				str = str.substring(rs.index + rs[0].length);
			}
		}
		return result;
	}

	//处理属性引用
	function replaceProperties(obj, property, enableKeyAttr) {
		if(!obj) {
			return obj;
		}
		if(isFunction(obj)) {
			return obj;
		} else if(isArray(obj)) {
			for(let i = 0; i < obj.length; i++) {
				obj[i] = replaceProperties(obj[i], property, enableKeyAttr);
			}
		} else if(isString(obj)) {
			obj = replaceStringProperties(obj, properties, property);
		} else if(isObject(obj)) {
			if(property) {
				property.has = false;
			}
			let replaceKeyMap = {};
			for(let x in obj) {
				if(property) {
					property.propertyKey = x;
				}
				obj[x] = replaceProperties(obj[x], property, enableKeyAttr);
				if(enableKeyAttr) {
					let _x = replaceStringProperties(x, properties, property);
					if(_x !== x) {
						replaceKeyMap[x] = _x;
					}
				}
			}
			for(let x in replaceKeyMap) {
				let objx = obj[x];
				delete obj[x];
				obj[replaceKeyMap[x]] = objx;
			}
		}

		return obj;

	}

	if(!properties.__dealt__) {
		let property = {
			has: false
		};

		for(let x in properties) {
			let fun = properties[x];
			if(isFunction(fun)) {
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

	if(!deps) {
		return;
	}

	for(var i = 0; i < deps.length; i++) {
		var m = deps[i];
		var index = m.indexOf("!");
		var pluginParam = index > 0 ? m.substring(index) : "";
		m = index > 0 ? m.substring(0, index) : m;

		index = m.indexOf("?");
		var query = index > 0 ? m.substring(index) : "";
		m = index > 0 ? m.substring(0, index) : m;

		var isJsFile = _isJsFile(m);
		if(!isJsFile && (global.startsWith(m, ".") || dealPathMayAbsolute(m).absolute)) {
			deps[i] = m + ".js" + query + pluginParam;
		}
	}

	if(config.modulePrefixCount) {
		//模块地址的前缀替换
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


function queryParam(name, otherValue, optionUrl) {
	var search;
	if(optionUrl) {
		var index = optionUrl.indexOf('?');
		if(index < 0) {
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
	if(r != null) return decodeURIComponent(r[2]);
	return otherValue !== undefined ? otherValue : null;
}

function tryCall(fun, defaultReturn, thiz, exCallback) {
	var rs;
	try {
		thiz = thiz === undefined ? this : thiz;
		rs = fun.call(thiz);
	} catch(e) {
		if(exCallback) {
			exCallback(e);
		} else {
			console.log(e);
		}
	}
	if(rs === undefined || rs === null) {
		rs = defaultReturn;
	}
	return rs;
};

function getUrl(relativeUrl, appendArgs, optionalAbsUrl) {
	if(optionalAbsUrl && !dealPathMayAbsolute(optionalAbsUrl).absolute) {
		throwError(-1, "expected absolute url:" + optionalAbsUrl)
	}
	if(appendArgs === undefined) {
		appendArgs = true;
	}
	let theConfig = xsloader.config();
	let thePageUrl = xsloader.pageUrl();
	var url;
	if(relativeUrl === undefined) {
		url = thePageUrl;
	} else if(global.startsWith(relativeUrl, ".") || dealPathMayAbsolute(relativeUrl).absolute) {
		url = getPathWithRelative(optionalAbsUrl || thePageUrl, relativeUrl);
	} else {
		url = theConfig.baseUrl + relativeUrl;
	}
	if(appendArgs) {
		if(url == thePageUrl) {
			url += location.search + location.hash;
		}
		return theConfig.dealUrl({}, url);
	} else {
		return url;
	}
};

function extend(target) {
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
}

function extendDeep(target) {
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
				target[x] = extendDeep(target[x], value);
			} else {
				target[x] = obj[x];
			}
		}
	}
	return target;
}

export {
	setTimeout,
	scripts,
	IE_VERSION,
	global,
	tglobal,
	xsJSON,
	getNodeAbsolutePath,
	getPathWithRelative,
	dealPathMayAbsolute,
	appendArgs2Url,
	removeQueryHash,
	isDom,
	head,
	propertiesDeal,
	replaceModulePrefix,
	queryParam,
	tryCall,
	getUrl,
	extend,
	extendDeep,
	isArray,
	isFunction,
	isObject,
	isString,
	isRegExp,
	isDate,
}
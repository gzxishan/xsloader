import {
	JSON as xsJSON,
	polyfillInit
} from "../polyfill/index.js";
import utils from "../util/index.js";

const global = utils.global;
const xsloader = global.xsloader;
const IE_VERSION = utils.IE_VERSION;

polyfillInit(global, xsloader);

if(!String.prototype.trim) {
	String.prototype.trim = function() {
		return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	};
}

//生成一个随机的id，只保证在本页面是唯一的
function randId(suffix) {
	let id = "r" + parseInt(new Date().getTime() / 1000) + "_" + parseInt(Math.random() * 1000) + "_" + utils.getAndIncIdCount();
	if(suffix !== undefined) {
		id += suffix;
	}
	return id;
}

function xsEval(scriptString) {
	try {
		let rs = IE_VERSION > 0 && IE_VERSION < 9 ? eval("[" + scriptString + "][0]") : eval("(" + scriptString + ")");
		return rs;
	} catch(e) {
		throw e;
	}
}

/**
 * 注意key需要用引号包裹
 * @param {Object} str
 * @param {Object} option
 */
function xsParseJson(str, option) {
	try {
		if(str === "" || str === null || str === undefined || !xsloader.isString(str)) {
			return str;
		}

		option = xsloader.extend({
			fnStart: "", //"/*{f}*/",
			fnEnd: "", //"/*{f}*/",
			rcomment: "\\/\\/#\\/\\/"
		}, option);

		let fnMap = {};
		let fnOffset = 0;
		let replacer = undefined;
		if(option.fnStart && option.fnEnd) {
			while(true) {
				let indexStart = str.indexOf(option.fnStart, fnOffset);
				let indexEnd = str.indexOf(option.fnEnd, indexStart == -1 ? fnOffset : indexStart + option.fnStart.length);
				if(indexStart == -1 && indexEnd == -1) {
					break;
				} else if(indexStart == -1) {
					console.warn("found end:" + option.fnEnd + ",may lack start:" + option.fnStart);
					break;
				} else if(indexEnd == -1) {
					console.warn("found start:" + option.fnStart + ",may lack end:" + option.fnEnd);
					break;
				}
				let fnId = "_[_" + randId() + "_]_";
				let fnStr = str.substring(indexStart + option.fnStart.length, indexEnd).trim();
				if(!xsloader.startsWith(fnStr, "function(")) {
					throw "not a function:" + fnStr;
				}
				try {
					str = str.substring(0, indexStart) + '"' + fnId + '"' + str.substring(indexEnd + option.fnEnd.length);
					let fn = xsloader.xsEval(fnStr);
					fnMap[fnId] = fn;
				} catch(e) {
					console.error(fnStr);
					throw e;
				}
				fnOffset = indexStart + fnId.length;
			}
			replacer = function(key, val) {
				if(xsloader.isString(val) && fnMap[val]) {
					return fnMap[val];
				} else {
					return val;
				}
			};
		}

		if(option.rcomment) {
			str = str.replace(/(\r\n)|\r/g, "\n"); //统一换行符号
			str = str.replace(new RegExp(option.rcomment + "[^\\n]*(\\n|$)", "g"), ""); //去除行注释
		}

		let jsonObj = xsJSON;
		return jsonObj.parse(str, replacer);
	} catch(e) {
		try {
			let reg = new RegExp('position[\\s]*([0-9]+)[\\s]*$');
			if(e.message && reg.test(e.message)) {
				let posStr = e.message.substring(e.message.lastIndexOf("position") + 8);
				let pos = parseInt(posStr.trim());
				let _str = str.substring(pos);
				console.error(e.message + ":" + _str.substring(0, _str.length > 100 ? 100 : _str.length));
			}
		} catch(e2) {
			console.warn(e2);
		}
		throw e;
	}
}

function xsJson2String(obj) {
	let jsonObj = xsJSON;
	return jsonObj.stringify(obj);
}

const getPathWithRelative = utils.getPathWithRelative;

function _toParamsMap(argsStr, decode = true) {
	if(xsloader.isObject(argsStr)) {
		return argsStr;
	}
	if(!argsStr) {
		argsStr = location.search;
	}

	let index = argsStr.indexOf("?");
	if(index >= 0) {
		argsStr = argsStr.substring(index + 1);
	} else {
		if(utils.dealPathMayAbsolute(argsStr).absolute) {
			return {};
		}
	}
	index = argsStr.lastIndexOf("#");
	if(index >= 0) {
		argsStr = argsStr.substring(0, index);
	}

	let ret = {},
		seg = argsStr.split('&'),
		s;
	for(let i = 0; i < seg.length; i++) {
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

	let index = url.lastIndexOf("?");
	let hashIndex = url.lastIndexOf("#");
	if(hashIndex < 0) {
		hashIndex = url.length;
	}
	let oldParams = index < 0 ? {} : _toParamsMap(url.substring(index + 1, hashIndex), false);
	let newParams = _toParamsMap(urlArgs, false);
	let has = false;
	for(let k in newParams) {
		if(oldParams[k] != newParams[k]) {
			oldParams[k] = newParams[k];
			has = true;
		}
	}
	//	if(!has) {
	//		return url; //参数没有变化直接返回
	//	}

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
	if(urlArgs.lastIndexOf("#") >= 0) {
		hash = urlArgs.substring(urlArgs.lastIndexOf("#"));
	} else if(hashIndex >= 0 && hashIndex < url.length) {
		hash = url.substring(hashIndex);
	}
	return path + (params ? "?" + params : "") + (hash ? hash : "");

}

function queryString2ParamsMap(argsStr, decode) {
	return _toParamsMap(argsStr, decode);
}

export default {
	randId,
	xsEval,
	xsParseJson,
	xsJson2String,
	getPathWithRelative,
	appendArgs2Url,
	queryString2ParamsMap,
	IE_VERSION
};
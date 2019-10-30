import utils from "../util/index.js";

const global = utils.global;
const xsloader = global.xsloader;

function queryParam(name, otherValue, optionUrl) {
	let search;
	if(optionUrl) {
		let index = optionUrl.indexOf('?');
		if(index < 0) {
			index = 0;
		} else {
			index += 1;
		}
		search = optionUrl.substr(index);
	} else {
		search = window.location.search.substr(1);
	}

	let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
	let r = search.match(reg);
	if(r != null) return decodeURIComponent(r[2]);
	return otherValue !== undefined ? otherValue : null;
}

function getUrl(relativeUrl, appendArgs, optionalAbsUrl) {
	if(optionalAbsUrl && !utils.dealPathMayAbsolute(optionalAbsUrl).absolute) {
		throw new Error("expected absolute url:" + optionalAbsUrl);
	}
	if(appendArgs === undefined) {
		appendArgs = true;
	}
	let theConfig = xsloader.config();
	let thePageUrl = utils.thePageUrl;
	let url;
	if(relativeUrl === undefined) {
		url = thePageUrl;
	} else if(xsloader.startsWith(relativeUrl, ".") || utils.dealPathMayAbsolute(relativeUrl).absolute) {
		url = utils.getPathWithRelative(optionalAbsUrl || thePageUrl, relativeUrl);
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
}

function tryCall(fun, defaultReturn, thiz, exCallback) {
	let rs;
	try {
		thiz = thiz === undefined ? this : thiz;
		rs = fun.call(thiz);
	} catch(e) {
		if(xsloader.isFunction(exCallback)) {
			exCallback(e);
		} else {
			console.warn(e);
		}
	}
	if(rs === undefined || rs === null) {
		rs = defaultReturn;
	}
	return rs;
}

function dealProperties(obj, properties) {
	return utils.propertiesDeal(obj, properties);
}

function extend(target) {
	for(let i = 1; i < arguments.length; i++) {
		let obj = arguments[i];
		if(!obj) {
			continue;
		}
		for(let x in obj) {
			let value = obj[x];
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
	for(let i = 1; i < arguments.length; i++) {
		let obj = arguments[i];
		if(!obj) {
			continue;
		}

		for(let x in obj) {
			let value = obj[x];
			if(value === undefined) {
				continue;
			}
			if(xsloader.isObject(value) && xsloader.isObject(target[x])) {
				target[x] = xsloader.extendDeep(target[x], value);
			} else {
				target[x] = obj[x];
			}
		}
	}
	return target;
}

function _AsyncCall(useTimer) {
	let thiz = this;
	let count = 0;
	let ctrlCallbackMap = {};

	function initCtrlCallback(callbackObj) {
		let mineCount = count + "";
		if(!ctrlCallbackMap[mineCount]) {
			let ctrlCallback = function() {
				count++;
				let asyncCallQueue = ctrlCallbackMap[mineCount];
				delete ctrlCallbackMap[mineCount];
				while(asyncCallQueue.length) {
					let callbackObj = asyncCallQueue.shift();
					let lastReturn = undefined;
					try {
						if(callbackObj.callback) {
							lastReturn = callbackObj.callback.call(callbackObj.handle, callbackObj.obj, mineCount);
						}
					} catch(e) {
						console.error(e);
					}
					let handle;
					while(callbackObj.nextCallback.length) {
						let nextObj = callbackObj.nextCallback.shift();
						if(!handle) {
							handle = thiz.pushTask(nextObj.callback, lastReturn);
						} else {
							handle.next(nextObj.callback);
						}
					}
				}
			};
			ctrlCallbackMap[mineCount] = [];
			if(!useTimer && global.Promise && global.Promise.resolve) {
				global.Promise.resolve().then(ctrlCallback);
			} else {
				setTimeout(ctrlCallback, 0);
			}
		}
		let queue = ctrlCallbackMap[mineCount];
		queue.push(callbackObj);
	}

	this.pushTask = function(callback, obj) {
		let callbackObj;
		let handle = {
			next: function(nextCallback, lastReturn) {
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

const theAsyncCall = new _AsyncCall();
const theAsyncCallOfTimer = new _AsyncCall(true);

let asyncCall = function(callback, useTimer) {
	if(useTimer) {
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
	if(!obj || !attrNames) {
		return undefined;
	}
	let attrs = attrNames.split(".");
	let rs = defaultValue;
	let i = 0;
	for(; i < attrs.length && obj; i++) {
		let k = attrs[i];
		obj = obj[k];
	}
	if(i == attrs.length) {
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
	let _obj = obj;
	let attrs = attrNames.split(".");

	for(let i = 0; i < attrs.length; i++) {
		let k = attrs[i];

		if(i == attrs.length - 1) {
			obj[k] = value;
			break;
		}
		let o = obj[k];
		if(!o) {
			o = {};
			obj[k] = o;
		}
		obj = o;
	}
	return _obj;
}

function clone(obj, isDeep=false) {
	// Handle the 3 simple types, and null or undefined or function
	if(!obj || xsloader.isFunction(obj) || xsloader.isString(obj)) return obj;

	if(xsloader.isRegExp(obj)) {
		return new RegExp(obj.source, obj.flags);
	}

	// Handle Date
	if(xsloader.isDate(obj)) {
		let copy = new Date();
		copy.setTime(obj.getTime());
		return copy;
	}
	// Handle Array or Object
	if(xsloader.isArray(obj) || xsloader.isObject(obj)) {
		let copy = xsloader.isArray(obj) ? [] : {};
		for(let attr in obj) {
			if(obj.hasOwnProperty(attr)) {
				copy[attr] = isDeep ? clone(obj[attr]) : obj[attr];
			}
		}
		return copy;
	}
	return obj;
}

export default {
	queryParam,
	getUrl,
	tryCall,
	dealProperties,
	extend,
	extendDeep,
	asyncCall,
	getObjectAttr,
	setObjectAttr,
	clone
};
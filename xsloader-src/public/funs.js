import U from "../util/index.js";

const G = U.global;
const L = G.xsloader;

function queryParam(name, otherValue, optionUrl) {
	let search;
	if (optionUrl) {
		let index = optionUrl.indexOf('?');
		if (index < 0) {
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
	let result = null;
	if (r != null) {
		result = decodeURIComponent(r[2]);
	}

	if ((result === null || result === "") && otherValue !== undefined) {
		result = otherValue;
	}

	return result;
}

function getUrl(relativeUrl, appendArgs = true, optionalAbsUrl) {
	if (optionalAbsUrl && !U.dealPathMayAbsolute(optionalAbsUrl).absolute) {
		throw new Error("expected absolute url:" + optionalAbsUrl);
	}
	//	if(appendArgs === undefined) {
	//		appendArgs = true;
	//	}
	let theConfig = L.config();
	let thePageUrl = U.thePageUrl;
	let url;
	if (relativeUrl === undefined) {
		url = thePageUrl;
	} else if (L.startsWith(relativeUrl, ".") || U.dealPathMayAbsolute(relativeUrl).absolute) {
		url = U.getPathWithRelative(optionalAbsUrl || thePageUrl, relativeUrl);
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

function getUrl2(relativeUrl, appendArgs = true, optionalAbsUrl) {
	let url = getUrl(relativeUrl, false, optionalAbsUrl);
	if (appendArgs) {
		return L.config().dealUrl({}, url);
	} else {
		return url;
	}
}

function tryCall(fun, defaultReturn, thiz, exCallback) {
	let rs;
	try {
		thiz = thiz === undefined ? this : thiz;
		rs = fun.call(thiz);
	} catch (e) {
		if (L.isFunction(exCallback)) {
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
	return U.propertiesDeal(obj, properties);
}

function extend(target) {
	for (let i = 1; i < arguments.length; i++) {
		let obj = arguments[i];
		if (!obj) {
			continue;
		}
		for (let x in obj) {
			let value = obj[x];
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
	for (let i = 1; i < arguments.length; i++) {
		let obj = arguments[i];
		if (!obj) {
			continue;
		}

		for (let x in obj) {
			let value = obj[x];
			if (value === undefined) {
				continue;
			}
			if (L.isObject(value) && L.isObject(target[x])) {
				target[x] = L.extendDeep(target[x], value);
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
		if (!ctrlCallbackMap[mineCount]) {
			let ctrlCallback = function() {
				count++;
				let asyncCallQueue = ctrlCallbackMap[mineCount];
				delete ctrlCallbackMap[mineCount];
				while (asyncCallQueue.length) {
					let callbackObj = asyncCallQueue.shift();
					let lastReturn = undefined;
					try {
						if (callbackObj.callback) {
							lastReturn = callbackObj.callback.call(callbackObj.handle, callbackObj.obj, mineCount);
						}
					} catch (e) {
						console.error(e);
					}
					let handle;
					while (callbackObj.nextCallback.length) {
						let nextObj = callbackObj.nextCallback.shift();
						if (!handle) {
							handle = thiz.pushTask(nextObj.callback, lastReturn);
						} else {
							handle.next(nextObj.callback);
						}
					}
				}
			};
			ctrlCallbackMap[mineCount] = [];
			if (!useTimer && G.Promise && G.Promise.resolve) {
				G.Promise.resolve().then(ctrlCallback);
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
	let attrs = attrNames.split(".");
	let rs = defaultValue;
	let i = 0;
	for (; i < attrs.length && obj; i++) {
		let k = attrs[i];
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
	let _obj = obj;
	let attrs = attrNames.split(".");

	for (let i = 0; i < attrs.length; i++) {
		let k = attrs[i];

		if (i == attrs.length - 1) {
			obj[k] = value;
			break;
		}
		let o = obj[k];
		if (!o) {
			o = {};
			obj[k] = o;
		}
		obj = o;
	}
	return _obj;
}

function clone(obj, isDeep = false) {
	// Handle the 3 simple types, and null or undefined or function
	if (!obj || L.isFunction(obj) || L.isString(obj)) return obj;

	if (L.isRegExp(obj)) {
		return new RegExp(obj.source, obj.flags);
	}

	// Handle Date
	if (L.isDate(obj)) {
		let copy = new Date();
		copy.setTime(obj.getTime());
		return copy;
	}
	// Handle Array or Object
	if (L.isArray(obj) || L.isObject(obj)) {
		let copy = L.isArray(obj) ? [] : {};
		for (let attr in obj) {
			let v = obj[attr];
			copy[attr] = isDeep ? clone(v) : v;
		}
		return copy;
	}
	return obj;
}

function sortObject(obj) {
	if (!obj || !L.isObject(obj)) {
		return obj;
	} else {
		let keys = [];
		for (let k in obj) {
			keys.push(k);
		}
		keys.sort();
		let newObj = {};
		for (let i = 0; i < keys.length; i++) {
			newObj[keys[i]] = obj[keys[i]];
		}
		return newObj;
	}
}

export default {
	queryParam,
	getUrl,
	getUrl2,
	tryCall,
	dealProperties,
	extend,
	extendDeep,
	asyncCall,
	getObjectAttr,
	setObjectAttr,
	clone,
	sortObject,
};

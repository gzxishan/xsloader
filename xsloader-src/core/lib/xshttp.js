import U from "../../util/index.js";
const L = U.global.xsloader;
const G = U.global;

let progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'];
/**
 * option._beforeOpenHook
 * option._onOkResponseHook
 * option._onFailResponseHook
 * 
 * @param {Object} option
 */
function httpRequest(option) {
	if (!option) {
		option = {};
	}

	function prop(obj, varName, defaultVal) {
		if (obj[varName] === undefined) {
			return defaultVal;
		} else {
			return obj[varName];
		}
	}

	function putProp(obj, varName, toObj) {
		if (obj[varName]) {
			for (let x in obj[varName]) {
				let value = obj[varName][x];
				if (value === null || value === undefined) {
					continue;
				}
				toObj[x] = value;
			}
		}
	}
	let _url = prop(option, "url", ""),
		_method = prop(option, "method", "GET"),
		_params = {},
		_headers = {
			"X-Requested-With": "XMLHttpRequest"
		},
		_async = prop(option, "async", true),
		_multiPart = prop(option, "multiPart", false),
		_handleType = prop(option, "handleType", "json");
	let _timeout = option.timeout;
	putProp(option, "params", _params);
	putProp(option, "headers", _headers);

	let okCallback = option.ok;
	let failCallback = option.fail;
	let uploadStartCallback = option.uploadStart;
	let uploadProgressCallback = option.uploadProgress;
	let uploadOkCallback = option.uploadOk;
	let uploadErrorCallback = option.uploadError;
	let uploadEndCallback = option.uploadEnd;

	let _beforeOpenHook = option._beforeOpenHook || httpRequest._beforeOpenHook;
	let _onOkResponseHook = option._onOkResponseHook || httpRequest._onOkResponseHook;
	let _onFailResponseHook = option._onFailResponseHook || httpRequest._onFailResponseHook;

	function createXhr() {
		let xhr, i, progId;
		if (typeof XMLHttpRequest !== "undefined") {
			return new XMLHttpRequest();
		} else if (typeof ActiveXObject !== "undefined") {
			for (i = 0; i < 3; i += 1) {
				progId = progIds[i];
				try {
					xhr = new ActiveXObject(progId);
				} catch (e) {
					console.warn(e);
				}

				if (xhr) {
					progIds = [progId];
					break;
				}
			}
		}
		return xhr;
	}

	function conn() {
		_conn(createXhr());
	}

	function _conn(xhr) {
		let option = {
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
		}, xhr);
	}

	function _doOnFailResponseHook(option, xhr, err, extraErr) {
		_onFailResponseHook(option, function(result) {
			if (result !== false && result !== undefined) {
				if (typeof okCallback == "function") {
					okCallback(result, xhr);
				}
				return;
			} else if (typeof failCallback == "function") {
				failCallback(err);
			} else {
				console.error(err);
			}
		}, xhr, extraErr);
	}

	function _connAfterOpenHook(option, xhr) {
		let body;
		if (option.multiPart) {
			let formData = new FormData();
			for (let x in option.params) {
				let value = option.params[x];
				if(value === null || value === undefined) {
					value = "";
				}
				
				if (L.isArray(value)) {
					formData.append(x, L.xsJson2String(value));
				} else {
					if (G.File && value instanceof G.File || G.Blob && value instanceof G.Blob) {
						formData.append(x, value);
					} else if(L.isObject(value)){
						formData.append(x, L.xsJson2String(value));
					}else{
						formData.append(x, value);
					}
				}

			}
			body = formData;
		} else {
			body = "";
			for (let x in option.params) {
				let value = option.params[x];
				if (value === null || value === undefined) {
					value = "";
				}
				
				if (L.isArray(value) || L.isObject(value)) {
					value = L.xsJson2String(value);
				}
				
				body += "&" + encodeURIComponent(x) + "=" + encodeURIComponent(value);
			}
			
			if (!(option.method == "POST" || option.method == "PUT")) {
				if (option.url.lastIndexOf("?") < 0 && body.length > 0) {
					option.url += "?";
				}
				option.url += body;
				option.url = option.url.replace("?&", "?");
				body = null;
			}
		}

		xhr.open(option.method, option.url, option.async);
		if ((option.method == "POST" || option.method == "PUT") && !option.multiPart && option.headers["Content-Type"] ===
			undefined) {

			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');
		}
		for (let header in option.headers) {
			xhr.setRequestHeader(header, option.headers[header]);
		}

		if (typeof uploadStartCallback == "function") {
			xhr.upload.onloadstart = uploadStartCallback;
		}

		if (typeof uploadProgressCallback == "function") {
			xhr.upload.onprogress = uploadProgressCallback;
		}

		if (typeof uploadOkCallback == "function") {
			xhr.upload.onload = uploadOkCallback;
		}

		if (typeof uploadErrorCallback == "function") {
			xhr.upload.onerror = uploadErrorCallback;
		}

		if (typeof uploadEndCallback == "function") {
			xhr.upload.onloadend = uploadEndCallback;
		}

		let timeoutTimer;
		let isTimeout = false;
		if (option.timeout) {
			timeoutTimer = setTimeout(function() {
				isTimeout = true;
				xhr.abort();
				clearTimeout(timeoutTimer);
			}, option.timeout);
		}

		xhr.onreadystatechange = function(evt) {
			let status, err;
			if (xhr.readyState === 4) {
				status = xhr.status || 0;
				if (status > 399 && status < 600 || !status) {
					let err = new Error(option.url + ' HTTP status: ' + status);
					err.xhr = xhr;
					_doOnFailResponseHook(option, xhr, err);
				} else {
					let result;
					if (option.handleType === "json") {
						try {
							result = L.xsParseJson(xhr.responseText);
						} catch (e) {
							_doOnFailResponseHook(option, xhr, new Error("parse-json-error:" + e), "parse-json-error");
							return;
						}
					} else if (option.handleType === "text") {
						result = xhr.responseText;
					}
					_onOkResponseHook(result, option, function(result) {
						if (typeof okCallback == "function") {
							okCallback(result, xhr);
						}
					}, xhr);
				}

			} else {
				if (timeoutTimer && isTimeout) {
					let err = new Error(option.url + ' timeout status: ' + status);
					err.xhr = xhr;
					_doOnFailResponseHook(option, xhr, err);
				}
			}
		};
		xhr.send(body);
	}

	let requestObj = {
		multiPart(multiPart) {
			_multiPart = multiPart;
			return this;
		},
		uploadStart(uploadStart) {
			uploadStartCallback = uploadStart;
			return this;
		},
		uploadProgress(uploadProgress) {
			uploadProgressCallback = uploadProgress;
			return this;
		},
		uploadOk(callback) {
			uploadOkCallback = callback;
			return this;
		},
		uploadError(callback) {
			uploadErrorCallback = callback;
			return this;
		},
		uploadEnd(uploadEnd) {
			uploadEndCallback = uploadEnd;
			return this;
		},
		url(urlStr) {
			_url = urlStr;
			return this;
		},
		method(methodStr) {
			_method = methodStr;
			return this;
		},
		timeout(timeout) {
			_timeout = timeout;
			return this;
		},
		async (isAsync) {
			_async = isAsync;
			return this;
		},
		params(paramsObj) {
			if (paramsObj) {
				for (let x in paramsObj) {
					let value = paramsObj[x];
					if (value === null || value === undefined) {
						continue;
					}
					_params[x] = value;
				}
			}
			return this;
		},
		headers(headersObj) {
			if (headersObj) {
				for (let x in headersObj) {
					_headers[x] = headersObj[x];
				}
			}
			return this;
		},
		handleType(_handleType) {
			return this.handleAs(_handleType);
		},
		handleAs(handleType) {
			if (handleType !== "json" && handleType !== "text") {
				throw "unknown handleType:" + handleType;
			}
			_handleType = handleType;
			return this;
		},
		ok(callback) {
			okCallback = callback;
			return this;
		},
		fail(callback) {
			failCallback = callback;
			return this;
		},
		_beforeOpenHook(callback) {
			_beforeOpenHook = callback;
			return this;
		},
		_onOkResponseHook(callback) {
			_onOkResponseHook = callback;
			return this;
		},
		_onFailResponseHook(callback) {
			_onFailResponseHook = callback;
			return this;
		},
		done() {
			try {
				conn();
			} catch (e) {
				if (typeof failCallback == "function") {
					failCallback(e);
				} else {
					console.error(e);
				}
			}
		}
	};
	return requestObj;
}
/**
 */
httpRequest._beforeOpenHook = function(option, callback, xhr) {
	callback();
};

/**
 * function(result,option,xhr,callback),callback(result)的result为最终的结果
 */
httpRequest._onOkResponseHook = function(result, option, callback, xhr) {
	callback(result);
};
/**
 * function(option,xhr,callback,extraErrorType),callback(result)的result为false则不会处理后面的,如果为非undefined则作为成功的结果。
 * extraErrorType=="parse-json-error"表示转换成json时出错
 */
httpRequest._onFailResponseHook = function(option, callback, xhr, extraErrorType) {
	callback(undefined);
};

window._xshttp_request_ = httpRequest;

L.define("xshttp", [], function() {
	return httpRequest;
});

import {
	setTimeout,
	scripts,
	IE_VERSION,
	global,
	tglobal,
	xsJSON,
	isDom,
	getNodeAbsolutePath,
	getPathWithRelative,
	dealPathMayAbsolute,
	appendArgs2Url,
	propertiesDeal,
	replaceModulePrefix,
	queryParam,
	tryCall,
	getUrl,
	extend,
	extendDeep,
} from '../utils.js';

import {
	defContextName,
	appendHeadDom,
	theLoaderScript,
	theLoaderUrl,
	thePageUrl,
	loaderScript,
	getCurrentScriptSrc,
	throwError,
} from './script-loader.js';

const defaultJsExts = [".js", ".js+", ".js++", ".es", "es6", ".jsx", ".vue"];
let theContext;
let theConfig;
let argsObject = {};

function isJsFile(path) {
	if(!isString(path)) {
		return false;
	}
	let pluginIndex = path.indexOf("!");
	if(pluginIndex > 0) {
		path = path.substring(0, pluginIndex);
	}
	let index = path.indexOf("?");
	if(index > 0) {
		path = path.substring(0, index);
	}
	index = path.indexOf("#");
	if(index > 0) {
		path = path.substring(0, index);
	}
	let jsExts = theConfig && theConfig.jsExts || defaultJsExts;
	for(let i = 0; i < jsExts.length; i++) {
		if(global.endsWith(path, jsExts[i])) {
			return {
				ext: jsExts[i],
				path: path
			};
		}
	}
	return false;
}

const xsloader = function(option) {
	if(theContext) {
		throwError(-1, "already configed!");
	}
	option = xsloader.extend({
		baseUrl: getPathWithRelative(location.pathname, "./", _endsWith(location.pathname, "/")),
		urlArgs: {},
		ignoreProperties: false,
		paths: {},
		depsPaths: {},
		deps: {},
		jsExts: defaultJsExts,
		properties: {},
		modulePrefix: {},
		defineFunction: {},
		modulePrefixCount: 0,
		waitSeconds: 10,
		autoUrlArgs: function() {
			return false;
		},
		instance: "single",
		dealtDeps: {},
		dealProperties: function(obj) {
			return propertiesDeal(obj, option.properties);
		},
		isInUrls: function(m) {
			return !!this.getUrls(m);
		},
		getUrls: function(m) {
			return this.paths[m] || this.depsPaths[m];
		},
		getDeps: function(m) {
			let as = this.dealtDeps[m] || [];
			let deps = [];
			let hasOrderDep = undefined;

			if(as.length > 0 && (as[0] === true || as[0] === false)) {
				if(as[0]) {
					deps = [
						[]
					];
					hasOrderDep = true;
				} else {
					as.splice(0, 1);
				}
			}
			for(let i = 0; i < as.length; i++) {
				if(hasOrderDep === true) {
					deps[0].push(as[i]);
				} else {
					deps.push(as[i]);
				}
			}
			return deps;
		},
		dealUrl: function(module, url) {
			let urlArg;
			let nameOrUrl;
			if(this.autoUrlArgs()) {
				urlArg = "_t=" + new Date().getTime();
			} else if(isString(module)) {
				urlArg = this.urlArgs[module];
				if(urlArg) {
					nameOrUrl = module;
				} else {
					nameOrUrl = module;
					urlArg = this.forPrefixSuffix(module);
				}

				if(!urlArg) {
					nameOrUrl = "*";
					urlArg = this.urlArgs["*"];
				}

			} else {

				urlArg = this.urlArgs[url];
				if(urlArg) {
					nameOrUrl = url;
				} else {
					urlArg = this.forPrefixSuffix(url);
				}

				if(!urlArg) {
					nameOrUrl = module.name;
					urlArg = this.urlArgs[nameOrUrl];
				}

				if(!urlArg) {
					nameOrUrl = module.aurl;
					urlArg = this.forPrefixSuffix(nameOrUrl);
				}

				if(!urlArg) {
					nameOrUrl = "*";
					urlArg = this.urlArgs["*"]
				}

			}
			if(isFunction(urlArg)) {
				urlArg = urlArg.call(this, nameOrUrl);
			}
			for(let k in argsObject) { //加入全局的参数
				urlArg += "&" + k + "=" + encodeURIComponent(argsObject[k]);
			}
			return _appendArgs2Url(url, urlArg);
		},
		dealUrlArgs: function(url) {
			url = getPathWithRelative(location.href, url);
			return this.dealUrl(url, url);
		},
		defaultVersion: {}
	}, option);
	if(!option.ignoreProperties) {
		option = option.dealProperties(option);
	}
	_strValue2Arr(option.paths);
	_strValue2Arr(option.depsPaths);
	_strValue2Arr(option.deps);
	if(!_endsWith(option.baseUrl, "/")) {
		option.baseUrl += "/";
	}
	option.baseUrl = getPathWithRelative(location.href, option.baseUrl);

	if(!isFunction(option.autoUrlArgs)) {
		let isAutoUrlArgs = option.autoUrlArgs;
		option.autoUrlArgs = function() {
			return isAutoUrlArgs;
		};
	}

	let modulePrefixCount = 0;
	for(let prefix in option.modulePrefix) {
		if(_startsWith(prefix, ".") || _startsWith(prefix, "/")) {
			throwError(-16, "modulePrefix can not start with '.' or '/'(" + prefix + ")");
		}
		modulePrefixCount++;
	}
	option.modulePrefixCount = modulePrefixCount;
	if(modulePrefixCount > 0) {
		//替换urlArgs中地址前缀
		let star = option.urlArgs["*"];
		delete option.urlArgs["*"];

		let urlArgsArr = [];
		for(let k in option.urlArgs) {
			let url = k;
			if(_isJsFile(url)) { //处理相对
				if(_startsWith(url, ".") || _startsWith(url, "/") && !_startsWith(url, "//")) {
					url = getPathWithRelative(theLoaderUrl, url);
				} else {
					let absolute = dealPathMayAbsolute(url);
					if(absolute.absolute) {
						url = absolute.path;
					} else if(!_startsWith(url, "*]")) { //排除*]；单*[可以有前缀
						url = option.baseUrl + url;
					}
				}

			}
			urlArgsArr.push({
				url: url,
				args: option.urlArgs[k]
			});
		}

		for(let prefix in option.modulePrefix) {
			let replaceStr = option.modulePrefix[prefix].replace;
			for(let i = 0; i < urlArgsArr.length; i++) {
				let urlArgObj = urlArgsArr[i];
				let starP = "";
				if(_startsWith(urlArgObj.url, "*[")) {
					starP = "*[";
					urlArgObj.url = urlArgObj.url.substring(2);
				}
				if(_startsWith(urlArgObj.url, prefix)) {
					urlArgObj.url = replaceStr + urlArgObj.url.substring(prefix.length);
				}
				starP && (urlArgObj.url = starP + urlArgObj.url);
			}
		}
		option.urlArgs = {};
		option.urlArgs["*"] = star;
		for(let i = 0; i < urlArgsArr.length; i++) {
			let urlArgObj = urlArgsArr[i];
			option.urlArgs[urlArgObj.url] = urlArgObj.args;
		}
	}
	//预处理urlArgs中的*[与*]
	let _urlArgs_prefix = [];
	let _urlArgs_suffix = [];
	option._urlArgs_prefix = _urlArgs_prefix;
	option._urlArgs_suffix = _urlArgs_suffix;

	for(let k in option.urlArgs) {
		let url = k;
		if(_startsWith(url, "*[")) {

			let strfix = url.substring(2);
			if(_startsWith(strfix, ".") || _startsWith(strfix, "/") && !_startsWith(strfix, "//")) {
				strfix = getPathWithRelative(theLoaderUrl, strfix);
			} else {
				let absolute = dealPathMayAbsolute(strfix);
				if(absolute.absolute) {
					strfix = absolute.path;
				} else {
					url = option.baseUrl + url;
				}
			}

			_urlArgs_prefix.push({
				strfix: strfix,
				value: option.urlArgs[k]
			});
			delete option.urlArgs[k];
		} else if(_startsWith(url, "*]")) {
			_urlArgs_suffix.push({
				strfix: url.substring(2),
				value: option.urlArgs[k]
			});
			delete option.urlArgs[k];
		}
	}

	option.forPrefixSuffix = function(urlOrName) {
		//前缀判断
		for(let i = 0; i < _urlArgs_prefix.length; i++) {
			let strfixObj = _urlArgs_prefix[i];
			if(global.startsWith(urlOrName, strfixObj.strfix)) {
				let value;
				if(isFunction(strfixObj.value)) {
					value = urlArg.call(this, urlOrName);
				} else {
					value = strfixObj.value;
				}
				return value;
			}
		}

		//后缀判断
		for(let i = 0; i < _urlArgs_suffix.length; i++) {
			let strfixObj = _urlArgs_suffix[i];
			if(global.endsWith(urlOrName, strfixObj.strfix)) {
				let value;
				if(isFunction(strfixObj.value)) {
					value = urlArg.call(this, urlOrName);
				} else {
					value = strfixObj.value;
				}
				return value;
			}
		}
	};

	for(let name in option.paths) {
		replaceModulePrefix(option, option.paths[name]); //前缀替换
	}
	for(let name in option.depsPaths) {
		replaceModulePrefix(option, option.depsPaths[name]); //前缀替换
	}

	//处理依赖
	let dealtDeps = option.dealtDeps;

	let pushDeps = function(dealtDepArray, depsArray) {
		//			if(depsArray.length > 0 && (depsArray[0] !== true && depsArray[0] !== false)) {
		//				depsArray.splice(0, 0, false);
		//			}
		each(depsArray, function(dep) {
			dealtDepArray.push(dep);
		});
	}

	for(let keyName in option.deps) {
		let paths = keyName.split('::');
		let depsArray = option.deps[keyName];
		each(paths, function(path) {
			if(path == '*') {
				for(let m in option.depsPaths) {
					let dealtDepArray = dealtDeps[m] = dealtDeps[m] || [];
					pushDeps(dealtDepArray, depsArray);
				}
			} else {
				let dealtDepArray = (dealtDeps[path] = dealtDeps[path] || []);
				pushDeps(dealtDepArray, depsArray);
			}
		});
	}

	theConfig = option;
	theContext = _newContext(defContextName);
	let arr = globalDefineQueue;
	globalDefineQueue = null;
	//定义config之前的模块
	each(arr, function(elem) {
		elem.data.isGlobal = true;
		__define(elem.data, elem.name, elem.deps, elem.callback, elem.src).then(elem.thenOption);
	});
	if(requiresQueueBeforeConf && requiresQueueBeforeConf.length) {
		while(requiresQueueBeforeConf.length) {
			requiresQueueBeforeConf.shift()();
		}
	}
	return theConfig;
};
/////////////////////
xsloader.putUrlArgs = function(argsObj) {
	argsObject = xsloader.extend(argsObject, argsObj);
};

xsloader.getUrlArgs = function(argsObj) {
	let obj = xsloader.extend({}, argsObject);
	return obj;
};

xsloader.clearUrlArgs = function(argsObj) {
	argsObject = {};
};
xsloader.define = define;
xsloader.defineAsync = defineAsync;
xsloader.require = require;
xsloader.randId = randId;
xsloader.tryCall = tryCall;
xsloader.isJsFile=isJsFile;
xsloader.PluginError = function(_err) {
	this.err = _err;
};
xsloader.getUrl = getUrl;
xsloader.isDOM = isDom;
xsloader.appendHeadDom = appendHeadDom;
xsloader.IE_VERSION = IE_VERSION;
xsloader.queryParam = queryParam;
xsloader.extend = extend;
xsloader.extendDeep = extendDeep;

//用于把"group:project:version"转换成url地址,返回一个String或包含多个url地址的数组
xsloader._resUrlBuilder = function(groupName) {
	throwError(-22, 'resUrlBuilder not found!');
};
xsloader.dealProperties = function(obj, properties) {
	return _propertiesDeal(obj, properties);
};

xsloader.clear_module_ = function() {
	let modules = arguments;
	for(let i = 0; i < modules.length; i++) {
		if(modules[i]) {
			delete modules[i]._module_;
			delete modules[i]._modules_;
		}
	}
}

xsloader.config = function() {
	return theConfig;
};
xsloader.script = function() {
	return theLoaderScript;
};

xsloader.scriptSrc = function() {
	return theLoaderUrl;
};

xsloader.pageUrl = function() {
	return thePageUrl;
}

xsloader.hasDefine = function(name) {
	let has = false;
	let module = getModule(name);
	if(!module || module.state == "init") {
		if(globalDefineQueue) {
			for(let i = 0; i < globalDefineQueue.length; i++) {
				let cache = globalDefineQueue[i];
				if(cache.name === name) {
					has = true;
					break;
				}
			}
		}
		if(!has && theContext) {
			let defQueue = theContext.defQueue;
			for(let i = 0; i < defQueue.length; i++) {
				let cache = defQueue[i];
				if(cache.name === name) {
					has = true;
					break;
				}
			}
		}
	} else {
		has = true;
	}
	return has;
}

export {
	xsloader,
}
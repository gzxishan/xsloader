import * as utils from '../utils/index.js';
import * as defineObject from './define.js';

const defaultJsExts = [".js", ".js+", ".js++", ".es", "es6", ".jsx", ".vue"];
let theContext;
let theConfig;
let argsObject = {};

function _newContext(contextName) {
	let context = {
		contextName: contextName,
	};
	return context;
};

function isJsFile(path) {
	if(!utils.isString(path)) {
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
		if(utils.endsWith(path, jsExts[i])) {
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
		baseUrl: utils.getPathWithRelative(location.pathname, "./", utils.endsWith(location.pathname, "/")),
		urlArgs: {},
		ignoreProperties: false,
		paths: {},
		depsPaths: {},
		deps: {},
		jsExts: [...defaultJsExts],
		properties: {},
		modulePrefix: {},
		defineFunction: {},
		modulePrefixCount: 0,
		waitSeconds: 10,
		autoUrlArgs() {
			return false;
		},
		instance: "single",
		dealtDeps: {},
		dealProperties(obj) {
			return utils.propertiesDeal(obj, option.properties);
		},
		isInUrls(m) {
			return !!this.getUrls(m);
		},
		getUrls(m) {
			return this.paths[m] || this.depsPaths[m];
		},
		getDeps(m) {
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
		dealUrl(module, url) {
			let urlArg;
			let nameOrUrl;
			if(this.autoUrlArgs()) {
				urlArg = "_t=" + new Date().getTime();
			} else if(utils.isString(module)) {
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
			if(utils.isFunction(urlArg)) {
				urlArg = urlArg.call(this, nameOrUrl);
			}
			for(let k in argsObject) { //加入全局的参数
				urlArg += "&" + k + "=" + encodeURIComponent(argsObject[k]);
			}
			return utils.appendArgs2Url(url, urlArg);
		},
		dealUrlArgs(url) {
			url = utils.getPathWithRelative(location.href, url);
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
	if(!utilsendsWith(option.baseUrl, "/")) {
		option.baseUrl += "/";
	}
	option.baseUrl = utilsgetPathWithRelative(location.href, option.baseUrl);

	if(!utilsisFunction(option.autoUrlArgs)) {
		let isAutoUrlArgs = option.autoUrlArgs;
		option.autoUrlArgs = function() {
			return isAutoUrlArgs;
		};
	}

	let modulePrefixCount = 0;
	for(let prefix in option.modulePrefix) {
		if(utils.startsWith(prefix, ".") || utils.startsWith(prefix, "/")) {
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
				if(utils.startsWith(url, ".") || utils.startsWith(url, "/") && !utils.startsWith(url, "//")) {
					url = utils.getPathWithRelative(theLoaderUrl, url);
				} else {
					let absolute = utils.dealPathMayAbsolute(url);
					if(absolute.absolute) {
						url = absolute.path;
					} else if(!utils.startsWith(url, "*]")) { //排除*]；单*[可以有前缀
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
				if(utils.startsWith(urlArgObj.url, "*[")) {
					starP = "*[";
					urlArgObj.url = urlArgObj.url.substring(2);
				}
				if(utils.startsWith(urlArgObj.url, prefix)) {
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
		if(utils.startsWith(url, "*[")) {

			let strfix = url.substring(2);
			if(utils.startsWith(strfix, ".") || utils.startsWith(strfix, "/") && !utils.startsWith(strfix, "//")) {
				strfix = utils.getPathWithRelative(theLoaderUrl, strfix);
			} else {
				let absolute = utils.dealPathMayAbsolute(strfix);
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
		} else if(utils.startsWith(url, "*]")) {
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
			if(utils.startsWith(urlOrName, strfixObj.strfix)) {
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
			if(utils.endsWith(urlOrName, strfixObj.strfix)) {
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
		utils.replaceModulePrefix(option, option.paths[name]); //前缀替换
	}
	for(let name in option.depsPaths) {
		utils.replaceModulePrefix(option, option.depsPaths[name]); //前缀替换
	}

	//处理依赖
	let dealtDeps = option.dealtDeps;

	let pushDeps = function(dealtDepArray, depsArray) {
		utils.each(depsArray, function(dep) {
			dealtDepArray.push(dep);
		});
	}

	for(let keyName in option.deps) {
		let paths = keyName.split('::');
		let depsArray = option.deps[keyName];
		utils.each(paths, function(path) {
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
	utils.each(arr, function(elem) {
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

xsloader.randId = utils.randId;
xsloader.tryCall = utils.tryCall;
xsloader.isJsFile = isJsFile;
xsloader.PluginError = function(_err) {
	this.err = _err;
};
xsloader.getUrl = utils.getUrl;
xsloader.isDOM = utils.isDom;
xsloader.appendHeadDom = utils.appendHeadDom;
xsloader.IE_VERSION = utils.IE_VERSION;
xsloader.queryParam = utils.queryParam;
xsloader.extend = utils.extend;
xsloader.extendDeep = utils.extendDeep;

//用于把"group:project:version"转换成url地址,返回一个String或包含多个url地址的数组
xsloader._resUrlBuilder = function(groupName) {
	throwError(-22, 'resUrlBuilder not found!');
};
xsloader.dealProperties = function(obj, properties) {
	return utils.propertiesDeal(obj, properties);
};

xsloader.config = function() {
	return theConfig;
};
xsloader.script = function() {
	return utils.theLoaderScript;
};

xsloader.scriptSrc = function() {
	return utils.theLoaderUrl;
};

xsloader.pageUrl = function() {
	return utils.thePageUrl;
}

const commentRegExp = /\/\*[\s\S]*?\*\/|([^:"'=]|^)\/\/.*$/mg;
const cjsRequireRegExp = /[^.]require\s*\(\s*["']([^'"\r\n]+)["']\s*\)/g;

//添加内部直接require('...')的模块
function appendInnerDeps(deps, callback) {
	if(utils.isFunction(callback)) {
		callback
			.toString()
			.replace(commentRegExp, __commentReplace)
			.replace(cjsRequireRegExp, function(match, dep) {
				deps.push(dep);
			});
	}
}

export {
	xsloader,
	appendInnerDeps,
	getContext() {
		return theContext;
	},
	getConfig(){
		return theConfig;
	}
}
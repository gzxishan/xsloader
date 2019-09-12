import loader from './loader.js';
import "../public/index.js";
import utils from "../util/index.js";

const global = utils.global;
const xsloader = global.xsloader;

import script from "./script.js";
import moduleScript from "./module.js";

let theContext;
let theConfig;
let argsObject = {};

xsloader.config = function() {
	return theConfig;
};
xsloader.script = function() {
	return script.theLoaderScript;
};
xsloader.scriptSrc = function() {
	return script.theLoaderUrl;
};

xsloader.putUrlArgs = function(argsObj) {
	argsObject = xsloader.extend(argsObject, argsObj);
};

xsloader.getUrlArgs = function() {
	let obj = xsloader.extend({}, argsObject);
	return obj;
};

xsloader.clearUrlArgs = function() {
	argsObject = {};
};

xsloader.appendHeadDom = script.appendHeadDom;

xsloader.hasDefine = function(name) {
	let has = false;
	let module = moduleScript.getModule(name);
	if(!module || module.state == "init") {

	} else {
		has = true;
	}
	return has;
};

//用于把"group:project:version"转换成url地址,返回一个String或包含多个url地址的数组
xsloader._resUrlBuilder = function(groupName) {
	throw new Error('resUrlBuilder not found!');
};

xsloader.clear_module_ = function() {
	let modules = arguments;
	for(let i = 0; i < modules.length; i++) {
		if(modules[i]) {
			delete modules[i]._module_;
			delete modules[i]._modules_;
		}
	}
};

function _newContext() {
	let context = {
		contextName: script.contextName,
		defQueue: []
	};
	return context;
}

loader.loaderFun((option) => {
	if(theContext) {
		throw new Error("already configed!");
	}
	option = xsloader.extend({
		baseUrl: utils.getPathWithRelative(location.pathname, "./", xsloader.endsWith(location.pathname, "/")),
		urlArgs: {},
		ignoreProperties: false,
		paths: {},
		depsPaths: {},
		deps: {},
		jsExts: undefined,
		properties: {},
		loading: { //顶部加载进度条

		},
		modulePrefix: {},
		defineFunction: {},
		modulePrefixCount: 0,
		waitSeconds: 20,
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
			} else if(xsloader.isString(module)) {
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
					nameOrUrl = module.selfname;
					urlArg = this.urlArgs[nameOrUrl];
				}

				if(!urlArg) {
					nameOrUrl = module.aurl;
					urlArg = this.forPrefixSuffix(nameOrUrl);
				}

				if(!urlArg) {
					nameOrUrl = "*";
					urlArg = this.urlArgs["*"];
				}

			}
			if(xsloader.isFunction(urlArg)) {
				urlArg = urlArg.call(this, nameOrUrl);
			}
			for(let k in argsObject) { //加入全局的参数
				urlArg += "&" + k + "=" + encodeURIComponent(argsObject[k]);
			}
			return xsloader.appendArgs2Url(url, urlArg);
		},
		dealUrlArgs(url) {
			url = utils.getPathWithRelative(location.href, url);
			return this.dealUrl(url, url);
		},
		defaultVersion: {}
	}, option);

	option.loading = xsloader.extend({
        enable: true,
        color: '#2196f3',
        bgColor:'rgba(0,0,0,0.1)',
        errColor: '#f5222d',
        duration: 0.2,
        height: 1,
        delay: 500,
	}, option.loading);

	if(!xsloader.endsWith(option.baseUrl, "/")) {
		option.baseUrl += "/";
	}
	option.baseUrl = utils.getPathWithRelative(location.href, option.baseUrl);

	if(!option.ignoreProperties) {
		option = option.dealProperties(option);
	}

	utils.strValue2Arr(option.paths);
	utils.strValue2Arr(option.depsPaths);
	utils.strValue2Arr(option.deps);

	if(!xsloader.isFunction(option.autoUrlArgs)) {
		let isAutoUrlArgs = option.autoUrlArgs;
		option.autoUrlArgs = function() {
			return isAutoUrlArgs;
		};
	}

	let modulePrefixCount = 0;
	for(let prefix in option.modulePrefix) {
		if(xsloader.startsWith(prefix, ".") || xsloader.startsWith(prefix, "/")) {
			throw new Error("modulePrefix can not start with '.' or '/'(" + prefix + ")");
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
			if(utils.isJsFile(url)) { //处理相对
				if(xsloader.startsWith(url, ".") || xsloader.startsWith(url, "/") && !xsloader.startsWith(url, "//")) {
					url = utils.getPathWithRelative(script.theLoaderUrl, url);
				} else {
					let absolute = utils.dealPathMayAbsolute(url);
					if(absolute.absolute) {
						url = absolute.path;
					} else if(!xsloader.startsWith(url, "*]")) { //排除*]；单*[可以有前缀
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
				if(xsloader.startsWith(urlArgObj.url, "*[")) {
					starP = "*[";
					urlArgObj.url = urlArgObj.url.substring(2);
				}
				if(xsloader.startsWith(urlArgObj.url, prefix)) {
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
		if(xsloader.startsWith(url, "*[")) {
			let strfix = url.substring(2);
			if(xsloader.startsWith(strfix, ".") || xsloader.startsWith(strfix, "/") && !xsloader.startsWith(strfix, "//")) {
				strfix = utils.getPathWithRelative(script.theLoaderUrl, strfix);
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
		} else if(xsloader.startsWith(url, "*]")) {
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
			if(xsloader.startsWith(urlOrName, strfixObj.strfix)) {
				let value;
				if(xsloader.isFunction(strfixObj.value)) {
					value = strfixObj.value.call(this, urlOrName);
				} else {
					value = strfixObj.value;
				}
				return value;
			}
		}

		//后缀判断
		for(let i = 0; i < _urlArgs_suffix.length; i++) {
			let strfixObj = _urlArgs_suffix[i];
			if(xsloader.endsWith(urlOrName, strfixObj.strfix)) {
				let value;
				if(xsloader.isFunction(strfixObj.value)) {
					value = strfixObj.value.call(this, urlOrName);
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

	let pushDeps = (dealtDepArray, depsArray) => {
		utils.each(depsArray, (dep) => {
			dealtDepArray.push(dep);
		});
	};

	for(let keyName in option.deps) {
		let paths = keyName.split('::');
		let depsArray = option.deps[keyName];
		utils.each(paths, (path) => {
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
	theContext = _newContext();
	script.onConfigedCallback(); //完成配置回调
	return theConfig;
});
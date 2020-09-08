import loader from './loader.js';
import "../public/index.js";
import U from "../util/index.js";

const L = U.global.xsloader;

import script from "./script.js";
import moduleScript from "./module.js";

let theContext;
let theConfig;
let argsObject = {};

L.config = function() {
	return theConfig;
};
L.script = function() {
	return script.theLoaderScript;
};

L.lastAppendHeadDom = function() {
	return script.lastAppendHeadDom();
};

L.scriptSrc = function() {
	return script.theLoaderUrl;
};

L.putUrlArgs = function(argsObj) {
	argsObject = L.extend(argsObject, argsObj);
};

L.getUrlArgs = function() {
	let obj = L.extend({}, argsObject);
	return obj;
};

L.clearUrlArgs = function() {
	argsObject = {};
};

L.appendHeadDom = script.appendHeadDom;

L.hasDefine = function(name) {
	let has = false;
	let module = moduleScript.getModule(name);
	if (!module || module.state === undefined //可能是preDependModule：预依赖模块
		||
		module.state == "init") {
		has = false;
	} else {
		has = true;
	}
	return has;
};

L.hasDefined = function(name) {
	let has = false;
	let module = moduleScript.getModule(name);
	if (module && module.state == "defined") {
		has = true;
	}
	return has;
};

//用于把"group:project:version"转换成url地址,返回一个String或包含多个url地址的数组
L.resUrlBuilder = function(groupName) {
	throw new Error('resUrlBuilder not found!');
};

L.clear_module_ = function() {
	let modules = arguments;
	for (let i = 0; i < modules.length; i++) {
		if (modules[i]) {
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
	if (theContext) {
		throw new Error("already configed!");
	}
	option = L.extend({
		baseUrl: U.getPathWithRelative(location.pathname, "./", L.endsWith(location.pathname, "/")),
		urlArgs: {},
		ignoreProperties: false,
		paths: {},
		depsPaths: {},
		deps: {},
		jsExts: undefined,
		autoExt: true,
		autoExtSuffix: ".*",
		properties: {},
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
			return U.propertiesDeal(obj, option.properties);
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

			if (as.length > 0 && (as[0] === true || as[0] === false)) {
				if (as[0]) {
					deps = [
						[]
					];
					hasOrderDep = true;
				} else {
					as.splice(0, 1);
				}
			}
			for (let i = 0; i < as.length; i++) {
				if (hasOrderDep === true) {
					deps[0].push(as[i]);
				} else {
					deps.push(as[i]);
				}
			}
			return deps;
		},
		dealUrl(module, url, addVersion = false) {
			let urlArgs = this.getUrlArgs(module, url, addVersion);
			return L.appendArgs2Url(url, urlArgs);
		},
		/**
		 * 获取待添加的参数
		 */
		getUrlArgs(module, url, addVersion = false) {
			let urlArg;
			let nameOrUrl;
			if (this.autoUrlArgs()) {
				urlArg = "_t=" + new Date().getTime();
			} else {
				let moduleName;
				let src;
				if (L.isString(module)) {
					moduleName = module;
				} else {
					moduleName = module.selfname;
					src = module.src;
				}

				//精确匹配优先

				//先尝试模块名
				urlArg = this.urlArgs[moduleName];
				if (!urlArg) {
					urlArg = this.forPrefixSuffix(moduleName);
				}

				//再尝试提供的url
				if (!urlArg && url) {
					urlArg = this.urlArgs[url];
					if (!urlArg) {
						urlArg = this.forPrefixSuffix(url);
					}
				}

				//接着尝试模块src
				if (!urlArg && src) {
					urlArg = this.urlArgs[src];
					if (!urlArg) {
						urlArg = this.forPrefixSuffix(src);
					}
				}

				//最后尝试通用的
				if (!urlArg) {
					urlArg = this.urlArgs["*"];
				}

			}

			if (L.isFunction(urlArg)) {
				urlArg = urlArg.call(this, nameOrUrl);
			}

			if (!urlArg) {
				urlArg = "";
			}

			for (let k in argsObject) { //加入全局的参数
				urlArg += "&" + k + "=" + encodeURIComponent(argsObject[k]);
			}

			if (addVersion && this.props.addVersion) {
				urlArg += "&_xsv=" + encodeURIComponent(L.env.version);
			}

			return urlArg;
		},
		dealUrlArgs(url) {
			url = U.getPathWithRelative(location.href, url);
			return this.dealUrl(url, url);
		},
		defaultVersion: {},
		plugins: {},
		props: {},
	}, option);

	option.props = L.extend({
		addVersion: true,
		innerDepType: "auto", //auto,require.get,require,disable
	}, option.props);

	option.plugins.loading = L.extend({
		enable: true,
		color: '#2196f3',
		bgColor: 'rgba(0,0,0,0.1)',
		errColor: '#f5222d',
		duration: 0.2,
		height: 1,
		delay: 500,
	}, option.plugins.loading);

	if (L.domAttr(script.theLoaderScript, "disable-loading") !== undefined) {
		option.plugins.loading.enable = false;
	}

	option.plugins.image = L.extend({
		timeout: 10000, //超时时间，毫秒
	}, option.plugins.image);

	option.plugins.xsmsg = L.extend({
		timeout: 30000, //连接超时时间，毫秒
		sleep: 500, //连接检测的休眠时间，毫秒
	}, option.plugins.xsmsg);

	option.plugins.ifmsg = L.extend({
		connTimeout: 30000, //连接超时时间，毫秒
		sleepTimeout: 20, //连接检测的休眠时间，毫秒
	}, option.plugins.ifmsg);

	if (!L.endsWith(option.baseUrl, "/")) {
		option.baseUrl += "/";
	}
	option.baseUrl = U.getPathWithRelative(location.href, option.baseUrl);

	if (!option.ignoreProperties) {
		option = option.dealProperties(option);
	}

	U.strValue2Arr(option.paths);
	U.strValue2Arr(option.depsPaths);
	U.strValue2Arr(option.deps);

	if (!L.isFunction(option.autoUrlArgs)) {
		let isAutoUrlArgs = option.autoUrlArgs;
		option.autoUrlArgs = function() {
			return isAutoUrlArgs;
		};
	}

	let modulePrefixCount = 0;
	for (let prefix in option.modulePrefix) {
		if (L.startsWith(prefix, ".") || L.startsWith(prefix, "/")) {
			throw new Error("modulePrefix can not start with '.' or '/'(" + prefix + ")");
		}
		modulePrefixCount++;
	}
	option.modulePrefixCount = modulePrefixCount;
	if (modulePrefixCount > 0) {
		//替换urlArgs中地址前缀
		let star = option.urlArgs["*"];
		delete option.urlArgs["*"];

		let urlArgsArr = [];
		for (let k in option.urlArgs) {
			let url = k;
			if (U.isJsFile(url)) { //处理相对
				if (L.startsWith(url, ".") || L.startsWith(url, "/") && !L.startsWith(url, "//")) {
					url = U.getPathWithRelative(script.theLoaderUrl, url);
				} else {
					let absolute = U.dealPathMayAbsolute(url);
					if (absolute.absolute) {
						url = absolute.path;
					} else if (!L.startsWith(url, "*]")) { //排除*]；单*[可以有前缀
						url = option.baseUrl + url;
					}
				}

			}
			urlArgsArr.push({
				url: url,
				args: option.urlArgs[k]
			});
		}

		for (let prefix in option.modulePrefix) {
			let replaceStr = option.modulePrefix[prefix].replace;
			for (let i = 0; i < urlArgsArr.length; i++) {
				let urlArgObj = urlArgsArr[i];
				let starP = "";
				if (L.startsWith(urlArgObj.url, "*[")) {
					starP = "*[";
					urlArgObj.url = urlArgObj.url.substring(2);
				}
				if (L.startsWith(urlArgObj.url, prefix)) {
					urlArgObj.url = replaceStr + urlArgObj.url.substring(prefix.length);
				}
				starP && (urlArgObj.url = starP + urlArgObj.url);
			}
		}
		option.urlArgs = {};
		option.urlArgs["*"] = star;
		for (let i = 0; i < urlArgsArr.length; i++) {
			let urlArgObj = urlArgsArr[i];
			option.urlArgs[urlArgObj.url] = urlArgObj.args;
		}
	}

	//预处理urlArgs中的*[与*]
	let _urlArgs_prefix = [];
	let _urlArgs_suffix = [];
	option._urlArgs_prefix = _urlArgs_prefix;
	option._urlArgs_suffix = _urlArgs_suffix;

	for (let k in option.urlArgs) {
		let url = k;
		if (L.startsWith(url, "*[")) {
			let strfix = url.substring(2);
			if (L.startsWith(strfix, ".") || L.startsWith(strfix, "/") && !L.startsWith(strfix, "//")) {
				strfix = U.getPathWithRelative(script.theLoaderUrl, strfix);
			} else {
				let absolute = U.dealPathMayAbsolute(strfix);
				if (absolute.absolute) {
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
		} else if (L.startsWith(url, "*]")) {
			_urlArgs_suffix.push({
				strfix: url.substring(2),
				value: option.urlArgs[k]
			});
			delete option.urlArgs[k];
		}
	}

	option.forPrefixSuffix = function(urlOrName) {
		//前缀判断
		for (let i = 0; i < _urlArgs_prefix.length; i++) {
			let strfixObj = _urlArgs_prefix[i];
			if (L.startsWith(urlOrName, strfixObj.strfix)) {
				let value;
				if (L.isFunction(strfixObj.value)) {
					value = strfixObj.value.call(this, urlOrName);
				} else {
					value = strfixObj.value;
				}
				return value;
			}
		}

		//后缀判断
		for (let i = 0; i < _urlArgs_suffix.length; i++) {
			let strfixObj = _urlArgs_suffix[i];
			if (L.endsWith(urlOrName, strfixObj.strfix)) {
				let value;
				if (L.isFunction(strfixObj.value)) {
					value = strfixObj.value.call(this, urlOrName);
				} else {
					value = strfixObj.value;
				}
				return value;
			}
		}
	};

	for (let name in option.paths) {
		U.replaceModulePrefix(option, option.paths[name]); //前缀替换
	}
	for (let name in option.depsPaths) {
		U.replaceModulePrefix(option, option.depsPaths[name]); //前缀替换
	}

	//处理依赖
	let dealtDeps = option.dealtDeps;

	let pushDeps = (dealtDepArray, depsArray) => {
		U.each(depsArray, (dep) => {
			dealtDepArray.push(dep);
		});
	};

	for (let keyName in option.deps) {
		let paths = keyName.split('::');
		let depsArray = option.deps[keyName];
		U.each(paths, (path) => {
			if (path == '*') {
				for (let m in option.depsPaths) {
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

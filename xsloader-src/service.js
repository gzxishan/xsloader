// 静态资源服务
import utils from "./util/index.js";

const global = utils.global;
const xsloader = global.xsloader;

const http = global._xshttp_request_;
const DATA_CONF = "data-conf",
	DATA_CONFX = "data-xsloader-conf";
const DATA_CONF2 = "data-conf2",
	DATA_CONF2X = "data-xsloader-conf2";
const DATA_MAIN = "data-main",
	DATA_MAINX = "data-xsloader-main";
const DATA_CONF_TYPE = "data-conf-type";

let serviceConfigUrl;
let dataConf = xsloader.script().getAttribute(DATA_CONF) || xsloader.script().getAttribute(DATA_CONFX);
let dataMain = xsloader.script().getAttribute(DATA_MAIN) || xsloader.script().getAttribute(DATA_MAINX);
let dataConfType = xsloader.script().getAttribute(DATA_CONF_TYPE);
if(dataConfType !== "json" && dataConfType != "js") {
	dataConfType = "auto";
}

let initFun = () => {
	function getMainPath(config) {
		let mainPath = config.main.getPath.call(config, dataMain);
		let path = location.pathname;

		let index = path.lastIndexOf("/");
		let name = path.substring(index + 1);
		if(name === "") {
			name = "index";
		}
		if(xsloader.endsWith(name, ".html")) {
			name = name.substring(0, name.length - 5);
		}
		if(!mainPath) {
			mainPath = "./main/{name}.js";
		}
		mainPath = mainPath.replace("{name}", name);
		return mainPath;
	}

	function extendConfig(config) {
		config = xsloader.extendDeep({
			properties: {},
			main: {
				getPath() {
					return dataMain || "./main/{name}.js";
				},
				name: "main",
				localConfigVar: "lconfig",
				globalConfigVar: "gconfig",
				before(name) {
					console.log("before:" + name);
				},
				after(name) {
					console.log("after:" + name);
				}
			},
			service: {
				hasGlobal: false,
				resUrls: []
			},
			chooseLoader(localConfig) { //返回一个configName；当此函数为service全局配置的函数时，localConfig为应用的配置对象;本地配置调用时，localConfig为null。
				return "default";
			},
			loader: {
				"default": {
					autoUrlArgs: true
				}
			}
		}, config);

		return config;
	}

	function loadServiceConfig(tag, url, callback, isLocal) {
		http({
			url: url,
			method: "get",
			timeout: 20000,
			handleType: "text",
			ok(confText) {

				let conf;
				if(dataConfType == "js") {
					conf = xsloader.xsEval(confText);
				} else if(dataConfType == "json") {
					conf = xsloader.xsParseJson(confText);
				} else {
					if(xsloader.startsWith(url, location.protocol + "//" + location.host + "/")) {
						//同域则默认用脚本解析
						conf = xsloader.xsEval(confText);
					} else {
						conf = xsloader.xsParseJson(confText);
					}
				}

				conf = extendConfig(conf);
				if(conf.beforeDealProperties) {
					conf.beforeDealProperties();
				}
				conf = xsloader.dealProperties(conf, conf.properties); //参数处理

				if(isLocal && conf.service.hasGlobal) {
					loadServiceConfig("global servie", conf.service.confUrl,
						function(globalConfig) {
							let localConfig = conf;
							global[globalConfig.main && globalConfig.main.localConfigVar || localConfig.main.localConfigVar] = localConfig;
							global[globalConfig.main && globalConfig.main.globalConfigVar || localConfig.main.globalConfigVar] = globalConfig;

							let mainName, mainPath, loaderName;

							loaderName = globalConfig.chooseLoader.call(globalConfig, localConfig);
							let conf;
							let loader;
							if(loaderName != null) {
								mainName = globalConfig.main.name;
								mainPath = utils.getPathWithRelative(location.href, getMainPath(globalConfig));
								loader = globalConfig.loader[loaderName];
								conf = globalConfig;
							}

							if(!loader) {
								loaderName = localConfig.chooseLoader.call(localConfig, null);
								mainName = localConfig.main.name;
								mainPath = utils.getPathWithRelative(location.href, getMainPath(localConfig));
								loader = localConfig.loader[loaderName];
								conf = localConfig;
							}

							if(!loader) {
								console.error("unknown loader:" + loaderName + "");
								return;
							}

							initXsloader(mainName, mainPath, loader, conf, localConfig);

						});
				} else {
					callback(conf);
				}
			},
			fail(err) {
				console.error("load " + tag + " config err:url=" + url + ",errinfo=" + err);
			}
		}).done();
	}

	function startLoad() {
		loadServiceConfig("local", serviceConfigUrl, function(localConfig) {
			global[localConfig.main.localConfigVar] = localConfig;

			let mainName = localConfig.main.name;

			let href = location.href;
			let index = href.lastIndexOf("?");
			if(index >= 0) {
				href = href.substring(0, index);
			}

			let mainPath = getMainPath(localConfig);

			mainPath = mainPath.indexOf("!") == -1 ? utils.getPathWithRelative(href, mainPath) : mainPath;
			let loaderName = localConfig.chooseLoader.call(localConfig, null);

			let loader = localConfig.loader[loaderName];
			if(!loader) {
				console.error("unknown local loader:" + loaderName);
				return;
			}
			initXsloader(href, mainName, mainPath, loader, localConfig, localConfig);
		}, true);
	}

	function initXsloader(pageHref, mainName, mainPath, loader, conf, localConfig) {
		let resUrls = [];
		conf.service.resUrl && resUrls.push(conf.service.resUrl);
		localConfig !== conf && localConfig.service.resUrl && resUrls.push(localConfig.service.resUrl);

		conf.service.resUrls && Array.pushAll(resUrls, conf.service.resUrls);
		localConfig !== conf && localConfig.service.resUrls && Array.pushAll(resUrls, localConfig.service.resUrls);

		xsloader._resUrlBuilder = function(groupModule) {
			let as = [];
			utils.each(resUrls, function(url) {
				as.push(xsloader.appendArgs2Url(url, "m=" + encodeURIComponent(groupModule)));
			});
			return as;
		};
		loader.ignoreProperties = true;
		loader.defineFunction = loader.defineFunction || {};
		loader.depsPaths = loader.depsPaths || {};
		if(mainPath.indexOf("!") != -1) { //插件调用
			let theConfig = xsloader(loader);

			mainName = "_plugin_main_";
			let deps = [];
			if(theConfig.deps) { //手动添加*依赖
				if(theConfig.deps["*"]) {
					Array.pushAll(deps, theConfig.deps["*"]);
				}
				if(theConfig.deps[mainName]) {
					Array.pushAll(deps, theConfig.deps[mainName]);
				}
			}
			deps.push(mainPath);
			xsloader.define(mainName, deps, function() {

			}).then({
				absUrl: pageHref
			});
		} else if(!xsloader.hasDefine(mainName)) {
			loader.depsPaths[mainName] = mainPath; //让其依赖*中的所有依赖
			xsloader(loader);
		} else {
			xsloader(loader);
		}

		loader.defineFunction[mainName] = function(originCallback, originThis, originArgs) {
			if(xsloader.isFunction(conf.main.before)) {
				conf.main.before.call(conf, mainName);
			}
			let rt = originCallback.apply(originThis, originArgs);

			if(xsloader.isFunction(conf.main.after)) {
				conf.main.after.call(conf, mainName);
			}
			return rt;
		};

		xsloader.require([mainName], function(main) {}).error((err, invoker) => {
			if(invoker) {
				console.error("error occured:invoker.url=", invoker.getUrl());
			}
			console.error("invoke main err:");
			console.error(err);
		});
	}
	xsloader.asyncCall(startLoad, true);
};

if(dataConf) {
	serviceConfigUrl = utils.getPathWithRelative(location.href, dataConf);
} else if((dataConf = (xsloader.script().getAttribute(DATA_CONF2) || xsloader.script().getAttribute(DATA_CONF2X)))) {
	serviceConfigUrl = utils.getPathWithRelative(xsloader.scriptSrc(), dataConf);
} else {
	initFun = null;
}
initFun && initFun();
import utils from "../util/index.js";
import script from "./script.js";
const global = utils.global;
const xsloader = global.xsloader;
const theDefinedMap = {};
const INNER_DEPS_PLUGIN = "__inner_deps__";
const innerDepsMap = {}; //内部依赖加载插件用于保存依赖的临时map

function getModule(nameOrUrl) {
	nameOrUrl = utils.removeQueryHash(nameOrUrl);
	let m = theDefinedMap[nameOrUrl];
	return m ? m.get() : null;
}

function setModule(nameOrUrl, m) {
	nameOrUrl = utils.removeQueryHash(nameOrUrl);
	let last = theDefinedMap[nameOrUrl];
	theDefinedMap[nameOrUrl] = m;
	return last;
}

function buildInvoker(obj) {
	let invoker = obj["thiz"];
	let module = obj.module || obj;
	let id = xsloader.randId();
	invoker.getId = function() {
		return id;
	};
	invoker.getUrl = function(relativeUrl, appendArgs, optionalAbsUrl) {
		if(optionalAbsUrl && !utils.dealPathMayAbsolute(optionalAbsUrl).absolute) {
			throw new Error(-1, "expected absolute url:" + optionalAbsUrl);
		}
		if(appendArgs === undefined) {
			appendArgs = true;
		}
		let url;
		if(relativeUrl === undefined) {
			url = this.getAbsoluteUrl();
		} else if(xsloader.startsWith(relativeUrl, ".") || utils.dealPathMayAbsolute(relativeUrl).absolute) {
			url = utils.getPathWithRelative(optionalAbsUrl || this.rurl(), relativeUrl);
		} else {
			url = xsloader.config().baseUrl + relativeUrl;
		}
		if(appendArgs) {
			if(url == script.thePageUrl) {
				url += location.search + location.hash;
			}
			return xsloader.config().dealUrl(module, url);
		} else {
			return url;
		}
	};
	invoker.require = function() {
		let h = xsloader.require.apply(invoker, arguments);
		return h;
	};
	invoker.define = function() {
		let h = xsloader.define.apply(invoker, arguments);
		return h;
	};
	invoker.rurl = function(defineObject) {
		return defineObject && defineObject.absUrl || this.absUrl() || this.getAbsoluteUrl();
	};
	invoker.defineAsync = function() {
		let h = this.define.apply(this, arguments);
		return h;
	};
	invoker.withAbsUrl = function(absUrl) {
		let moduleMap = {
			module: module,
			src: absUrl,
			absUrl: absUrl,
			name: invoker.getName(),
			invoker: invoker.invoker()
		};
		moduleMap.thiz = new script.Invoker(moduleMap);
		buildInvoker(moduleMap);
		return moduleMap.thiz;
	};
}

//新建模块实例
//relyCallback(depModuleThis)
function newModuleInstance(module, thatInvoker, relyCallback, pluginArgs) {
	let instanceModule = {
		relyCallback: relyCallback,
		_invoker: thatInvoker,
		_module_: null,
		initInvoker: function() {
			//确保正确的invoker
			if(module.ignoreAspect) {
				return;
			}
			let obj = this._object;
			let invoker = this._invoker;

			let addTheAttrs = (theObj) => {
				theObj._invoker_ = invoker;
				if(theObj._module_) {
					theObj._modules_ = theObj._modules_ || [];
					theObj._modules_.push(theObj._module_);
				}
				theObj._module_ = this._module_;
				return theObj;
			};

			let isSingle = module.instanceType != "clone";

			if(xsloader.isObject(obj)) {
				if(module.loopObject && !isSingle) {
					throw new Error("loop dependency not support single option:" + module.name);
				}
				this._object = addTheAttrs(isSingle ? obj : xsloader.clone(obj));
			} else if(xsloader.isFunction(obj)) {
				this._object = addTheAttrs(obj);
			}

		},
		_object: null,
		_setDepModuleObjectGen: function(obj) {
			this._object = obj;
			this.initInvoker();
		},
		module: module,
		moduleObject: function() {
			return this._object;
		},
		genExports: function() {
			this._setDepModuleObjectGen({});
			return this._object;
		},
		_getCacheKey: function(pluginArgs) {
			if(this._object.getCacheKey) {
				return this._object.getCacheKey.call(this.thiz, pluginArgs);
			}
			let id = this._invoker.getUrl();
			return id;
		},
		_willCache: function(pluginArgs, cacheResult) {
			if(this._object.willCache) {
				return this._object.willCache.call(this.thiz, pluginArgs, cacheResult);
			}
			return true;
		},
		lastSinglePluginResult: function(pluginArgs) {
			let id = this._getCacheKey(pluginArgs);
			return this.module.lastSinglePluginResult(id, pluginArgs);
		},
		setSinglePluginResult: function(pluginArgs, obj) {
			let id = this._getCacheKey(pluginArgs);
			let willCache = this._willCache(pluginArgs, obj);
			return this.module.setSinglePluginResult(willCache, id, pluginArgs, obj);
		},
		init: function(justForSingle) {
			let relyCallback = this.relyCallback;
			this._module_ = this.module.dealInstance(this);
			this._setDepModuleObjectGen(this.module.loopObject || this.module.moduleObject);
			if(pluginArgs !== undefined) {
				if(!this._object) {
					throw new Error("pulgin error:" + this.module.name);
				}
				if(this._object.isSingle === undefined) {
					this._object.isSingle = true; //同样的参数也需要重新调用
				}
				if(justForSingle && !this._object.isSingle) {
					throw new Error("just for single plugin");
				}

				let hasFinished = false;
				let onload = (result, ignoreAspect) => {
					if(result == undefined) {
						result = {
							__default: true
						};
					}
					hasFinished = true;
					if(this._object.isSingle) {
						this.setSinglePluginResult(pluginArgs, {
							result: result,
							ignoreAspect: ignoreAspect
						});
					}
					this.module.ignoreAspect = ignoreAspect === undefined || ignoreAspect;
					this._setDepModuleObjectGen(result);
					relyCallback(this);
				};
				let onerror = (err) => {
					hasFinished = true;
					relyCallback(this, new xsloader.PluginError(err || false));
				};
				let args = [pluginArgs, onload, onerror, xsloader.config()].concat(this.module.depModules);
				try {
					let cacheResult;
					if(this._object.isSingle && (cacheResult = this.lastSinglePluginResult(pluginArgs)) !== undefined) {
						let last = cacheResult;
						onload(last.result, last.ignoreAspect);
					} else {
						this._object.pluginMain.apply(this.thiz, args);
					}
				} catch(e) {
					console.warn(e);
					onerror(e);
				}
				if(!hasFinished) {
					setTimeout(function() {
						if(!hasFinished) {
							console.warn("invoke plugin may failed:page=" + location.href + ",plugin=" + module.name + "!" + pluginArgs);
						}
					}, xsloader.config().waitSeconds * 1000);
				}
			} else {
				relyCallback(this);
			}
		},

	};

	let moduleMap = {
		module: module,
		src: module.thiz.getAbsoluteUrl(),
		absUrl: module.thiz.absUrl(),
		name: module.thiz.getName(),
		invoker: instanceModule._invoker
	};
	instanceModule.thiz = new script.Invoker(moduleMap);

	buildInvoker(instanceModule);
	return instanceModule;
}

function _newModule(name, absUrl, thatInvoker, callback) {
	let defineObject = new script.DefineObject(name,null, null, false);
	defineObject.src = null;
	defineObject.deps = null;
	defineObject.thatInvoker = thatInvoker;
	defineObject.callback = callback;
	defineObject.handle = {
		absUrl: absUrl
	};
	return newModule(defineObject);
}

//
//模块依赖来源：(另见module.js:mayAddDeps,define.js:theRealDefine)
//1、define里声明的
//2、define或require里直接require('...')
//3、config里配置的
//4、手动通过handle.before或depBefore进行修改的
/*
 *模块的名字来源：(另见define.js:onModuleLoaded)
 * 1、模块url地址:一定存在
 * 2、模块define时提供的：可选
 * 3、paths或depsPaths提供的：可选
 * 4、name!提供的：可选
 */
function newModule(defineObject) {

	let instances = []; //所有模块实例
	let moduleMap = {
		id: utils.getAndIncIdCount(),
		name: defineObject.selfname || defineObject.src,
		deps: defineObject.deps || [],
		relys: [],
		otherModule: undefined,
		directDefineIndex: 0, //模块直接声明的依赖开始索引
		ignoreAspect: false,
		depModules: null,
		src: null, //绝对路径,可能等于当前页面路径
		absUrl: defineObject.getMineAbsUrl(),
		callback: defineObject.callback,
		_loadCallback: null,
		moduleObject: undefined, //依赖模块对应的对象
		loopObject: undefined, //循环依赖对象
		invoker: defineObject.thatInvoker,
		instanceType: "single",
		setInstanceType(instanceType) {
			this.instanceType = instanceType;
		},
		_singlePluginResult: {},
		lastSinglePluginResult(id, pluginArgs) {
			if(this._singlePluginResult[id]) {
				return this._singlePluginResult[id][pluginArgs];
			}
		},
		setSinglePluginResult(willCache, id, pluginArgs, obj) {
			if(willCache) {
				if(!this._singlePluginResult[id]) {
					this._singlePluginResult[id] = {};
				}
				this._singlePluginResult[id][pluginArgs] = obj;
			} else {
				if(this._singlePluginResult[id]) {
					delete this._singlePluginResult[id][pluginArgs];
				}
			}
		},
		finish(args) {
			if(this.directDefineIndex != 0) {
				let _directArgs = [];
				for(let i = this.directDefineIndex; i < args.length; i++) {
					_directArgs.push(args[i]);
				}
				args = _directArgs;
			}
			this.depModules = args;
			let obj;
			if(xsloader.isFunction(this.callback)) {
				try {
					script.currentDefineModuleQueue.push(this);
					script.obj = this.callback.apply(this.thiz, args);
					script.currentDefineModuleQueue.pop();
				} catch(e) {
					script.currentDefineModuleQueue.pop();
					console.error("error occured,invoker.url=", this.invoker ? this.invoker.getUrl() : "");
					console.error(e);
					this.setState("error", e);
					return;
				}
			} else {
				obj = this.callback;
				if(this.moduleObject !== undefined) {
					console.log("ignore moudule named '" + moduleMap.name + "':" + obj);
				}
			}
			let isDefault = false;
			if(obj === undefined) {
				isDefault = true;
				obj = {
					__default: true
				};
			}
			if(this.loopObject) {
				if(!xsloader.isObject(obj)) {
					throw new Error("循环依赖的模块必须是对象：" + this.name);
				}
				for(let x in obj) {
					this.loopObject[x] = obj[x];
				}
				obj = this.loopObject;
			}
			//this.moduleObject不为undefined，则使用了exports
			if(this.moduleObject === undefined ||
				!isDefault && obj !== undefined //如果使用了return、则优先使用
			) {
				this.moduleObject = obj;
			}
			this.setState("defined");
		},
		state: "init", //init,loading,loaded,defined,error,
		errinfo: null,
		_callback(fun) {
			let thiz = this;
			let _state = thiz.state;
			if(_state == 'defined' || thiz.loopObject) {
				let theCallback = function() {
					if(fun) {
						let depModule = newModuleInstance(thiz, fun.thatInvoker, fun.relyCallback, fun.pluginArgs);
						depModule.init();
					}
				};
				//已经加载了模块，仍然需要判断为其另外设置的依赖模块是否已被加载
				let deps = !thiz.loopObject && xsloader.config().getDeps(thiz.name);
				//console.log(this.name,":",deps);
				//deps=null;
				if(deps && deps.length > 0) {
					xsloader.require(deps, function() {
						theCallback();
					}).then({
						defined_module_for_deps: thiz.name
					});
				} else {
					theCallback();
				}

				return false;
			} else if(_state == "timeout" || _state == "error") {
				if(fun) {
					fun.relyCallback(this, this.errinfo);
				}
				return false;
			} else {
				return true;
			}
		},
		setState(_state, errinfo) {
			this.state = _state;
			this.errinfo = errinfo;
			if(!this._callback()) {
				while(this.relys.length) {
					let fun = this.relys.shift();
					this._callback(fun);
				}
			}
		},
		get() {
			if(this.otherModule) {
				this.state = this.otherModule.state; //状态同步,保持与otherModule状态相同
				return this.otherModule;
			}
			return this;
		},
		/**
		 * 依赖当前模块、表示依赖otherModule模块，当前模块为别名或引用。
		 * @param {Object} otherModule
		 */
		toOtherModule(otherModule) {
			this.otherModule = otherModule;
			this.get(); //状态同步
			let theRelys = this.relys;
			this.relys = [];
			while(theRelys.length) {
				let fun = theRelys.shift();
				otherModule.relyIt(fun.thatInvoker, fun.relyCallback, fun.pluginArgs);
			}
		},
		whenNeed(loadCallback) {
			if(this.relys.length || this.otherModule && this.otherModule.relys.length) {
				loadCallback(); //已经被依赖了
			} else {
				this._loadCallback = loadCallback;
			}
		},
		/**
		 * 
		 * @param {Object} thatInvoker
		 * @param {Object} callbackFun function(depModule,err)
		 * @param {Object} pluginArgs
		 */
		relyIt(thatInvoker, callbackFun, pluginArgs) {
			if(this.otherModule) {
				this.get(); //状态同步
				this.otherModule.relyIt(thatInvoker, callbackFun, pluginArgs); //传递给otherModule
				return;
			}
			let fun = {
				thatInvoker: thatInvoker,
				relyCallback: callbackFun,
				pluginArgs: pluginArgs
			};
			if(this._callback(fun)) {
				this.relys.push(fun);
			}
			if(this._loadCallback) { //将会加载此模块及其依赖的模块
				let loadCallback = this._loadCallback;
				this._loadCallback = null;
				loadCallback();
			}
		}
	};
	moduleMap.thiz = new script.Invoker(moduleMap);

	//返回_module_
	moduleMap.dealInstance = function(moduleInstance) {
		instances.push(moduleInstance);
		let _module_ = {
			opId: null,
			setToAll(name, value, opId) {
				if(opId !== undefined && opId == this.opId) {
					return; //防止循环
				}
				opId = opId || _getModuleId();
				this.opId = opId;

				let obj = {};
				if(xsloader.isString(name)) {
					obj[name] = value;
				} else if(xsloader.isObject(name)) {
					for(let k in name) {
						obj[k] = name[k];
					}
				} else {
					throw new Error("unknown param:" + name);
				}

				utils.each(instances, function(ins) {
					let mobj = ins.moduleObject();
					for(let k in obj) {
						mobj[k] = obj[k];
					}
					if(mobj._modules_) {
						utils.each(mobj._modules_, function(_m_) {
							_m_.setToAll(name, value, opId);
						});
					}
				});
			}

		};

		return _module_;
	};

	//添加到前面
	//提供的参数deps为define里声明的
	moduleMap.mayAddDeps = function(deps) {
		let moduleDeps = this.deps;
		utils.each(moduleDeps, function(dep) {
			if(xsloader.indexInArray(deps, dep) < 0) {
				deps.push(dep);
			}
		}, false, true);
		this.deps = deps;
		return deps;
	};
	moduleMap.printOnNotDefined = function() {
		let root = {
			nodes: []
		};
		this._printOnNotDefined(root);

		let leafs = [];

		function findLeaf(node) {
			if(node.nodes.length) {
				utils.each(node.nodes, function(item) {
					findLeaf(item);
				});
			} else {
				leafs.push(node);
			}
		}
		findLeaf(root);

		function genErrs(node, infos) {
			infos.push(node.err);
			if(node.parent) {
				genErrs(node.parent, infos);
			}
		}
		utils.each(leafs, function(leaf) {
			let infos = [];
			genErrs(leaf, infos);
			infos = infos.reverse();
			console.error("load module error stack:my page=" + location.href);
			for(let i = 1; i < infos.length;) {
				let as = [];
				as.push("");
				for(let k = 0; k < 3 && i < infos.length; k++) {
					as.push(infos[i++]);
				}
				console.info(as.join("--->"));
			}
			let errModule = leaf.module;
			if(leaf.module && leaf.module.state == "defined") {
				errModule = leaf.parent.module;
			}
			if(errModule) {
				let as = [];
				for(let i = 0; i < errModule.deps.length; i++) {
					let dep = errModule.deps[i];
					let index = dep.lastIndexOf("!");
					if(index != -1) {
						dep = dep.substring(0, index);
					}
					let depMod = theDefinedMap[dep];
					if(depMod) {
						as.push(dep + ":" + depMod.state);
					} else {
						as.push(dep + ":null");
					}
				}
				console.info("failed module '" + errModule.name + "' deps state infos [" + as.join(",") + "]");
			}
		});

	};
	moduleMap._printOnNotDefined = function(parentNode) {
		let node = {
			err: "[" + this.name + "].state=" + this.state,
			module: this,
			parent: parentNode,
			nodes: []
		};
		parentNode.nodes.push(node);
		if(this.state == "defined") {
			return;
		}

		utils.each(this.deps, function(dep) {
			let indexPlguin = dep.indexOf("!");
			if(indexPlguin > 0) {
				dep = dep.substring(0, indexPlguin);
			}
			let mod = getModule(dep);
			if(mod && mod.state == "defined") {
				mod._printOnNotDefined(node);
				return;
			}
			//只打印一个错误栈
			if(mod) {
				mod._printOnNotDefined(node);
			} else {
				node.nodes.push({
					parent: parentNode,
					nodes: [],
					err: "[" + dep + "] has not module"
				});
			}
		});
	};
	setModule(moduleMap.name, moduleMap);

	buildInvoker(moduleMap);
	return moduleMap;
}

let randModuleIndex = 0;

function _getModuleId() {
	return "_xs_req_2019_" + randModuleIndex++;
}
//处理嵌套依赖
function _dealEmbedDeps(deps) {
	for(let i = 0; i < deps.length; i++) {
		let dep = deps[i];
		if(xsloader.isArray(dep)) {
			//内部的模块顺序加载
			let modName = "inner_order_" + _getModuleId();
			let isOrderDep = !(dep.length > 0 && dep[0] === false);
			if(dep.length > 0 && (dep[0] === false || dep[0] === true)) {
				dep = dep.slice(1);
			}
			innerDepsMap[modName] = {
				deps: dep,
				orderDep: isOrderDep
			};

			//console.log(innerDepsMap[modName]);
			deps[i] = INNER_DEPS_PLUGIN + "!" + modName;
		}
	}
}

function _getPluginParam(path) {
	let pluginIndex = path.indexOf("!");
	if(pluginIndex > 0) {
		return path.substring(pluginIndex);
	} else {
		return "";
	}
}

//everyOkCallback(depModules,module),errCallback(err,invoker)
function everyRequired(defineObject, module, everyOkCallback, errCallback) {
	if(defineObject.isError) {
		return;
	}

	let config = xsloader.config();
	const deps = module.deps;

	utils.replaceModulePrefix(config, deps); //前缀替换
	_dealEmbedDeps(deps); //处理嵌套依赖

	for(let i = 0; i < deps.length; i++) {
		//console.log(module.name+("("+defineObject.handle.defined_module_for_deps+")"), ":", deps);
		let m = deps[i];
		let jsFilePath = utils.isJsFile(m);

		if(module.thiz.rurl(defineObject)) { //替换相对路径为绝对路径
			if(jsFilePath && xsloader.startsWith(m, ".")) {
				m = utils.getPathWithRelative(module.thiz.rurl(defineObject), jsFilePath.path) + _getPluginParam(m);
				deps[i] = m;
			}
		}
		let paths = utils.graphPath.tryAddEdge(defineObject.handle.defined_module_for_deps || module.name, m);
		if(paths.length > 0) {
			let moduleLoop = getModule(m); //该模块必定已经被定义过
			moduleLoop.loopObject = {};
		}
	}

	let isError = false,
		hasCallErr = false,
		theExports;
	let depCount = deps.length;
	//module.jsScriptCount = 0;
	let depModules = new Array(depCount);

	let invoker_the_module = module.thiz;

	function checkFinish(index, dep_name, depModule, syncHandle) {
		depModules[index] = depModule;

		if( /*(depCount == 0 || depCount - module.jsScriptCount == 0)*/ depCount <= 0 && !isError) {
			everyOkCallback(depModules, module);
		} else if(isError) {
			module.setState('error', isError);
			if(!hasCallErr) {
				hasCallErr = true;
				errCallback({
					err: isError,
					index: index,
					dep_name: dep_name
				}, invoker_the_module);
			}
		}!isError && syncHandle && syncHandle();
	}

	utils.each(deps, function(dep, index, ary, syncHandle) {
		let originDep = dep;
		let pluginArgs = undefined;
		let pluginIndex = dep.indexOf("!");
		if(pluginIndex > 0) {
			pluginArgs = dep.substring(pluginIndex + 1);
			dep = dep.substring(0, pluginIndex);
		}
		let relyItFun = function() {
			getModule(dep).relyIt(invoker_the_module, function(depModule, err) {

				if(!err) {
					depCount--;
					if(dep == "exports") {
						if(theExports) {
							module.moduleObject = theExports;
						} else {
							theExports = module.moduleObject = depModule.genExports();
						}
					}
				} else {
					isError = err;
				}
				checkFinish(index, originDep, depModule, syncHandle);
			}, pluginArgs);
		};

		if(!getModule(dep)) {
			let isJsFile = utils.isJsFile(dep);
			do {

				let urls;

				if(!isJsFile && dep.indexOf("/") < 0 && dep.indexOf(":") >= 0) {
					let i1 = dep.indexOf(":");
					let i2 = dep.indexOf(":", i1 + 1);
					let i3 = i2 > 0 ? dep.indexOf(":", i2 + 1) : -1;
					if(i2 == -1) {
						isError = "illegal module:" + dep;
						errCallback(isError, invoker_the_module);
						break;
					}
					let version;
					let groupModule;
					if(i3 == -1) {
						version = config.defaultVersion[dep];
						groupModule = dep + ":" + version;
					} else {
						version = dep.substring(i3 + 1);
						groupModule = dep;
					}
					if(version === undefined) {
						isError = "unknown version for:" + dep;
						errCallback(isError, invoker_the_module);
						break;
					}
					let _url = xsloader._resUrlBuilder(groupModule);
					urls = xsloader.isArray(_url) ? _url : [_url];
				} else if(config.isInUrls(dep)) {
					urls = config.getUrls(dep);
				} else if(isJsFile) {
					urls = [dep];
				} else {
					urls = [];
				}

				let module2 = _newModule(dep, module.absUrl, module.thiz);
				module2.setState("loading");
				utils.each(urls, function(url, index) {
					if(xsloader.startsWith(url, ".") || xsloader.startsWith(url, "/")) {
						if(!module2.thiz.rurl(defineObject)) {
							isError = "script url is null:'" + module2.name;
							throw new Error(isError);
						}
						url = utils.getPathWithRelative(module2.thiz.rurl(defineObject), url);
					} else {
						let absolute = utils.dealPathMayAbsolute(url);
						if(absolute.absolute) {
							url = absolute.path;
						} else {
							url = config.baseUrl + url;
						}
					}
					urls[index] = config.dealUrl(module2, url);
				});

				mayAsyncCallLoadModule();

				function mayAsyncCallLoadModule() {
					//					if(IE_VERSION > 0 && IE_VERSION <= 10) {
					//						asyncCall(function() {
					//							loadModule();
					//						});
					//					} else {
					//						loadModule();
					//					}
					loadModule();
				}

				//加载模块dep:module2
				function loadModule(index = 0) {
					if(index >= urls.length) {
						return;
					}
					let url = urls[index];
					module2.src = url;
					script.loadScript(module2.name, url, (scriptData) => {

					}, (err) => {
						isError = err;
						errCallback(isError, invoker_the_module);
					});
				}

			} while (false);
		}
		relyItFun();
	}, defineObject.handle.orderDep);
	//TODO STRONG ie10及以下版本，js文件一个一个加载，从而解决缓存等造成的混乱问题
}

export default {
	setModule,
	newModule,
	getModule,
	everyRequired,
	INNER_DEPS_PLUGIN,
	innerDepsMap,
	buildInvoker,
	newModuleInstance
};
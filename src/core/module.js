import utils from "../util/index.js";
import script from "./script.js";
import moduleDef from "./module-def";
const global = utils.global;
const xsloader = global.xsloader;

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
					throw new Error("loop dependency not support single option:" + module.description());
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
		initInstance: function(justForSingle) {
			let relyCallback = this.relyCallback;
			this._module_ = this.module.dealInstance(this);
			this._setDepModuleObjectGen(this.module.loopObject || this.module.moduleObject);
			if(pluginArgs !== undefined) {
				if(!this._object) {
					throw new Error("pulgin error:" + this.module.description());
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
					relyCallback(this, new utils.PluginError(err || false));
				};

				try {
					let cacheResult;
					if(this._object.isSingle && (cacheResult = this.lastSinglePluginResult(pluginArgs)) !== undefined) {
						let last = cacheResult;
						onload(last.result, last.ignoreAspect);
					} else {
						let args = [pluginArgs, onload, onerror, xsloader.config()].concat(this.module.args);
						this._object.pluginMain.apply(this.thiz, args);
					}
				} catch(e) {
					//console.warn(e);
					onerror(e);
				}
				if(!hasFinished) {
					setTimeout(function() {
						if(!hasFinished) {
							console.warn("invoke plugin may failed:page=" + location.href + ",plugin=" + module.selfname + "!" + pluginArgs);
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
		src: module.src,
		absUrl: () => module.thiz.absUrl(),
		selfname: module.thiz.getName(),
		invoker: instanceModule._invoker
	};
	instanceModule.thiz = new script.Invoker(moduleMap);

	//	if(module.selfname == "css") {
	//		console.log("absUrl=" + instanceModule.thiz.absUrl() + ",invoker.absUrl=" + instanceModule.thiz.invoker().absUrl());
	//	}

	//	buildInvoker(instanceModule);
	return instanceModule;
}

function _newModule(name, src, thatInvoker, callback) {
	src = utils.removeQueryHash(src);
	let defineObject = new script.DefineObject(src, null, [name, null, callback]);
	defineObject.thatInvoker = thatInvoker;
	defineObject.appendConfigDepsAndEmbedDeps(); //添加配置依赖，该模块对象是加载者、而不是define者
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
 * 3、paths或depsPaths提供的：可选，且可能为默认模块
 * 4、name!提供的：可选
 */
function newModule(defineObject) {

	let instances = []; //所有模块实例
	let moduleMap = {
		id: utils.getAndIncIdCount(),
		selfname: defineObject.selfname,
		parent: defineObject.parentDefine,
		description() {
			return "selfname=" + (this.selfname || "") + ",src=" + this.src;
		},
		deps: defineObject.deps || [],
		relys: [],
		ignoreAspect: false,
		args: null,
		src: defineObject.src, //绝对路径,可能等于当前页面路径
		absUrlFromModule: () => defineObject.absUrlFromDefineObject(),
		getCallback: () => defineObject.callback,
		_dealApplyArgs: (args) => args,
		_loadCallback: null,
		moduleObject: undefined, //依赖模块对应的对象
		loopObject: undefined, //循环依赖对象
		invoker: defineObject.thatInvoker,
		instanceType: "single",
		reinitByDefineObject(defineObject) {
			this.deps = defineObject.deps || [];
			this.getCallback = () => defineObject.callback;
		},
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
			args = this._dealApplyArgs(args);
			this.args = args;
			let obj;
			if(xsloader.isFunction(this.getCallback())) {
				try {
					script.currentDefineModuleQueue.push(this);
					obj = this.getCallback().apply(this.thiz, args);
					script.currentDefineModuleQueue.pop();
				} catch(e) {
					script.currentDefineModuleQueue.pop();
					console.error("error occured,invoker.url=", this.invoker ? this.invoker.getUrl() : "");
					console.error(e);
					this.setState("error", e);
					throw e;
				}
			} else {
				obj = this.getCallback();
				if(this.moduleObject !== undefined) {
					console.warn("ignore moudule:" + moduleMap.description());
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
					throw new Error("循环依赖的模块必须是对象：" + this.description());
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
						depModule.initInstance();
					}
				};
				//已经加载了模块，仍然需要判断为其另外设置的依赖模块是否已被加载
				let deps = !thiz.loopObject && xsloader.config().getDeps(thiz.selfname);
				//console.log(this.selfname,":",deps);
				//deps=null;
				if(deps && deps.length > 0) {
					xsloader.require(deps, () => {
						theCallback();
					}).then({
						defined_module_for_deps: this.selfname
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
			if(this.refmodule) {
				this.state = this.refmodule.state; //状态同步,保持与refmodule状态相同
				return this.refmodule;
			}
			return this;
		},
		refmodule: undefined, //引用指定模块
		/**
		 * 依赖当前模块、表示依赖otherModule模块，当前模块为别名或引用。
		 * @param {Object} otherModule
		 */
		toOtherModule(otherModule) {
			this.refmodule = otherModule;
			this.get(); //状态同步
			let theRelys = this.relys;
			this.relys = [];
			while(theRelys.length) {
				let fun = theRelys.shift();
				this.refmodule.relyIt(fun.thatInvoker, fun.relyCallback, fun.pluginArgs);
			}
		},
		whenNeed(loadCallback) {
			if(this.relys.length || this.refmodule && this.refmodule.relys.length) {
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
			if(this.refmodule) {
				this.get(); //状态同步
				this.refmodule.relyIt(thatInvoker, callbackFun, pluginArgs); //传递给refmodule
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
	new script.Invoker(moduleMap);

	//返回_module_
	moduleMap.dealInstance = function(moduleInstance) {
		instances.push(moduleInstance);
		let _module_ = {
			opId: null,
			setToAll(name, value, opId) {
				if(opId !== undefined && opId == this.opId) {
					return; //防止循环
				}
				opId = opId || getModuleId();
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
				for(let k = 0; k < 3 && i < infos.length; k++) {
					as.push(infos[i++]);
				}
				console.warn(as.join("\n\t--->"));
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
					let depMod = moduleDef.getModule(dep);
					if(depMod) {
						as.push(dep + ":" + depMod.state);
					} else {
						as.push(dep + ":null");
					}
				}
				console.warn("failed module:" + errModule.description() + ",\n\tdeps state infos [" + as.join(",") + "]");
				for(let i = 0; i < errModule.deps.length; i++) {
					let dep = errModule.deps[i];
					let index = dep.lastIndexOf("!");
					if(index != -1) {
						dep = dep.substring(0, index);
					}
					let depMod = moduleDef.getModule(dep);
					if(depMod) {
						console.warn("\t" + dep + ":src=" + depMod.src + ",absUrl=" + (depMod.thiz && depMod.thiz.absUrl()));
					} else {
						console.warn(dep + ":");
					}
				}
			}
		});

	};
	moduleMap._printOnNotDefined = function(parentNode) {
		let node = {
			err: "[" + this.description() + "].state=" + this.state,
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
			let mod = moduleDef.getModule(dep);
			if(mod && mod.state == "defined") {
				mod._printOnNotDefined(node);
				return;
			}
			//只打印一个错误栈
			if(mod) {
				mod._printOnNotDefined && mod._printOnNotDefined(node);
			} else {
				node.nodes.push({
					parent: parentNode,
					nodes: [],
					err: "[" + dep + "] has not module"
				});
			}
		});
	};
	moduleDef.setModule(moduleMap.selfname, moduleMap);

	return moduleMap;
}

let randModuleIndex = 0;

function getModuleId() {
	return "_xs_req_2019_" + randModuleIndex++;
}

//everyOkCallback(depModules,module),errCallback(err,invoker)
function everyRequired(defineObject, module, everyOkCallback, errCallback) {
	if(defineObject.isError) {
		return;
	}

	//处理相对路径,此时模块的依赖已经全部处理好了
	defineObject.dealRelative(module);

	let config = xsloader.config();

	let isError = false,
		hasCallErr = false,
		theExports;
	let depCount = module.deps.length;
	//module.jsScriptCount = 0;
	let depModules = new Array(depCount);

	let invoker_of_module = module.thiz;

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
				}, invoker_of_module);
			}
		}!isError && syncHandle && syncHandle();
	}

	utils.each(module.deps, function(dep, index, ary, syncHandle) {
		//		if(xsloader.startsWith(dep, "css!")) {
		//			console.log("src=" + module.src + ",absUrl=" + invoker_of_module.absUrl() + ",absolute=" + invoker_of_module.src());
		//		}
		let originDep = dep;
		let pluginArgs = undefined;
		let pluginIndex = dep.indexOf("!");
		if(pluginIndex > 0) {
			pluginArgs = dep.substring(pluginIndex + 1);
			dep = dep.substring(0, pluginIndex);
		}
		let relyItFun = function() {
			moduleDef.getModule(dep)
				.relyIt(invoker_of_module, function(depModule, err) {
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

		if(!moduleDef.getModule(dep)) {
			let isJsFile = utils.isJsFile(dep);
			do {
				let urls;
				if(!isJsFile && dep.indexOf("/") < 0 && dep.indexOf(":") >= 0) {
					let i1 = dep.indexOf(":");
					let i2 = dep.indexOf(":", i1 + 1);
					let i3 = i2 > 0 ? dep.indexOf(":", i2 + 1) : -1;
					if(i2 == -1) {
						isError = "illegal module:" + dep;
						errCallback(isError, invoker_of_module);
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
						errCallback(isError, invoker_of_module);
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

				//TODO errCallback是否无效??
				if(urls.length == 0) {
					//提前依赖模块
					moduleDef.preDependOn(dep);
				} else {
					utils.each(urls, function(url, index) {
						if(xsloader.startsWith(url, ".") || xsloader.startsWith(url, "/")) {
							if(!invoker_of_module.rurl(defineObject)) {
								isError = "script url is null:'" + module.description();
								errCallback(isError, invoker_of_module);
							}
							url = utils.getPathWithRelative(invoker_of_module.rurl(defineObject), url);
						} else {
							let absolute = utils.dealPathMayAbsolute(url);
							if(absolute.absolute) {
								url = absolute.path;
							} else {
								url = config.baseUrl + url;
							}
						}
						if(urls[index]==dep){
							dep=url;
						}
						urls[index] = config.dealUrl(dep, url);
					});
				}

				if(!isError && urls.length) {
					utils.replaceModulePrefix(config, urls); //前缀替换

					let m2Name = isJsFile ? null : dep;
					let module2 = _newModule(m2Name, urls[0], invoker_of_module);
					module2.setState("loading"); //只有此处才设置loading状态

					let configDeps = [];
					if(m2Name) {
						let _deps = config.getDeps(m2Name);
						utils.each(_deps, (d) => {
							if(xsloader.indexInArray(configDeps, d) == -1) {
								configDeps.push(d);
							}
						});
					}

					utils.each(urls, (url) => {
						let _deps = config.getDeps(url);
						utils.each(_deps, (d) => {
							if(xsloader.indexInArray(configDeps, d) == -1) {
								configDeps.push(d);
							}
						});
					});

					if(configDeps.length) {
						//先加载配置依赖
						xsloader.require(configDeps, () => {
							loadModule();
						});
					} else {
						loadModule();
					}

					//加载模块dep:module2
					function loadModule(index = 0) {
						if(index >= urls.length) {
							return;
						}
						let url = urls[index];
						moduleDef.setLastDefineObject(url, defineObject);
						if(index > 0) {
							let oldSrc = module2.src;
							module2.src = url;
							moduleDef.replaceModuleSrc(oldSrc, module2);
						}
						script.loadScript(module2.selfname, url, (scriptData) => {
							let defaultMod;
							if(module2.state == "loading") { //module2.selfname为配置名称，尝试默认模块或者唯一的模块
								//(唯一的模块用于支持：脚本里只有一个define、且指定了模块名、且此处的模块名与其自己指定了不相等)
								defaultMod = moduleDef.getModule(module2.src, null, module2);
								if(defaultMod && module2 != defaultMod) {
									module2.toOtherModule(defaultMod);
								}
							}

							if(!defaultMod && module2.state == "loading") {
								//isError = "load module err(may not define default):" + module2.description();
								//errCallback(isError, invoker_of_module);
								//？？没有define的情况、直接完成
								try {
									module2.finish([]);
								} catch(e) {
									isError = e;
									errCallback(isError, invoker_of_module);
								}
							}
						}, (err) => {
							if(index + 1 < urls.length) {
								loadModule(index + 1);
							} else {
								isError = err;
								errCallback(isError, invoker_of_module);
							}
						});
					}
				}
			} while (false);
		}
		if(!isError) {
			relyItFun();
		}
	}, defineObject.handle.orderDep);
	//TODO STRONG ????ie10及以下版本，js文件一个一个加载，从而解决缓存等造成的混乱问题
}

export default {
	...moduleDef,
	newModule,
	everyRequired,
	newModuleInstance,
	getModuleId
};
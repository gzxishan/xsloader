import * as loader from './script-loader.js';
import { xsloader } from './xsloader.js';
import * as utils from '../utils/index.js';

const currentDefineModuleQueue = loader.currentDefineModuleQueue;
let idCount = 2019;
let theDefinedMap = {}; //存放原始模块

function _onScriptComplete(moduleName, cache, aurl, isRequire, lastThenOptionObj) {
	let ifmodule = getModule(moduleName);
	if(ifmodule && ifmodule.state != 'loading' && ifmodule.state != 'init') {
		let lastModule = ifmodule;
		if(aurl && lastModule.aurl == aurl && moduleName == aurl) { //已经加载过js模块
			try {
				console.warn("already loaded js:" + aurl);
			} catch(e) {
				//TODO handle the exception
			}
			return;
		} else {
			throwError(-2, "already define '" + moduleName + "'");
		}
	}

	let context = loader.getContext();
	let data = cache.data;
	let deps = cache.deps;
	let callback = cache.callback;
	let thenOption = cache.thenOption;

	thenOption.absUrl = thenOption.absUrl || function() {
		return this.absoluteUrl || (this.thatInvoker ? this.thatInvoker.absUrl() : null);
	}
	cache.name = moduleName || cache.name;

	let module = getModule(moduleName);
	if(!module) {
		module = _newModule(moduleName, null, callback, thenOption.thatInvoker, thenOption.absoluteUrl);
	}

	deps = cache.deps = module.mayAddDeps(deps);
	if(thenOption.before) {
		thenOption.before(deps);
	}
	if(lastThenOptionObj && lastThenOptionObj.thenOption.depBefore) {
		lastThenOptionObj.thenOption.depBefore(lastThenOptionObj.index, cache.name, deps, 2);
	}

	if(cache.name && xsloader._ignoreAspect_[cache.name] || cache.selfname && xsloader._ignoreAspect_[cache.selfname]) {
		module.ignoreAspect = true;
	}

	if(cache.selfname && cache.selfname != cache.name) {
		let moduleSelf = getModule(cache.selfname);
		if(moduleSelf) {
			if(moduleSelf.state == "init") {
				setModule(cache.selfname, module);
				moduleSelf.toOtherModule(module);
			} else if(moduleSelf.cacheId == cache.id) {
				return;
			} else {
				throwError(-2, "already define '" + cache.selfname + "'");
			}
		} else {
			setModule(cache.selfname, module);
		}
	}
	module.aurl = aurl;
	module.setState("loaded");
	module.callback = callback;
	module.setInstanceType(thenOption.instance || theConfig.instance);

	if(!module.aurl && data.isRequire) {
		module.aurl = theLoaderUrl;
	}

	if(deps.length == 0) {
		module.finish([]); //递归结束
	} else {
		_everyRequired(data, thenOption, module, deps, function(depModules) {

			let args = [];
			let depModuleArgs = [];
			each(depModules, function(depModule) {
				depModuleArgs.push(depModule);
				args.push(depModule && depModule.moduleObject());
			});
			args.push(depModuleArgs);
			module.finish(args);
		}, function(err, invoker) {
			thenOption.onError(err, invoker);
		});
	}

};

function getModule(nameOrUrl) {
	nameOrUrl = utils.removeUrlParam(nameOrUrl);
	let m = theDefinedMap[nameOrUrl];
	return m ? m.get() : null;
}

function setModule(nameOrUrl, m) {
	nameOrUrl = utils.removeUrlParam(nameOrUrl);
	let last = theDefinedMap[nameOrUrl];
	theDefinedMap[nameOrUrl] = m;
	return last;
}

function _Async_Object_(invoker, asyncDefine) {
	this.getInvoker = function() {
		return invoker;
	}
	this.isAsyncDefine = function() {
		return asyncDefine;
	}
}

function _buildInvoker(obj) {
	let invoker = obj["thiz"];
	let module = obj.module || obj;
	let id = utils.randId();
	invoker.getId = function() {
		return id;
	};
	invoker.getUrl = function(relativeUrl, appendArgs, optionalAbsUrl) {
		if(optionalAbsUrl && !utils.dealPathMayAbsolute(optionalAbsUrl).absolute) {
			throwError(-1, "expected absolute url:" + optionalAbsUrl)
		}
		if(appendArgs === undefined) {
			appendArgs = true;
		}
		let url;
		let theConfig = loader.getConfig();
		if(relativeUrl === undefined) {
			url = this.getAbsoluteUrl();
		} else if(utils.startsWith(relativeUrl, ".") || utils.dealPathMayAbsolute(relativeUrl).absolute) {
			url = utils.getPathWithRelative(optionalAbsUrl || this.rurl(), relativeUrl);
		} else {
			url = theConfig.baseUrl + relativeUrl;
		}
		if(appendArgs) {
			if(url == thePageUrl) {
				url += location.search + location.hash;
			}
			return theConfig.dealUrl(module, url);
		} else {
			return url;
		}
	};
	invoker.require = function() {
		let h = xsloader.require.apply(new _Async_Object_(invoker, false), arguments);
		return h;
	};
	invoker.define = function() {
		let h = xsloader.define.apply(new _Async_Object_(invoker, false), arguments);
		return h;
	};
	invoker.rurl = function(thenOption) {
		return thenOption && thenOption.absUrl() || this.absUrl() || this.getAbsoluteUrl();
	};
	invoker.defineAsync = invoker.define;
	invoker.withAbsUrl = function(absoluteUrl) {
		let newObj = {
			module: module,
			thiz: {
				getAbsoluteUrl() {
					return absoluteUrl;
				},
				absUrl() {
					return absoluteUrl;
				},
				getName() {
					return invoker.getName();
				},
				invoker() {
					return invoker.invoker();
				}
			}
		};
		_buildInvoker(newObj);
		return newObj.thiz;
	};
};

function _newModule(name, deps, callback, thatInvoker, absoluteUrl) {
	let instances = []; //所有模块实例
	let moduleMap = {
		id: idCount++,
		name: name,
		deps: deps || [],
		relys: [],
		otherModule: undefined,
		directDefineIndex: 0, //模块直接声明的依赖开始索引
		ignoreAspect: false,
		depModules: null,
		aurl: null, //绝对路径,可能等于当前页面路径
		callback: callback,
		moduleObject: undefined, //依赖模块对应的对象
		loopObject: undefined, //循环依赖对象
		invoker: thatInvoker,
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
			if(isFunction(this.callback)) {
				try {
					currentDefineModuleQueue.push(this);
					obj = this.callback.apply(this.thiz, args);
					currentDefineModuleQueue.pop();
				} catch(e) {
					currentDefineModuleQueue.pop();
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
				if(!isObject(obj)) {
					throwError(-1201, "循环依赖的模块必须是对象：" + this.name);
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
						let depModule = _newDepModule(thiz, fun.thatInvoker, fun.relyCallback, fun.pluginArgs);
						depModule.init();
					}
				};
				//已经加载了模块，仍然需要判断为其另外设置的依赖模块是否已被加载
				let deps = !thiz.loopObject && theConfig.getDeps(thiz.name);
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
				this.state = this.otherModule.state; //状态同步
				return this.otherModule;
			}
			return this;
		},
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
		/**
		 * 
		 * @param {Object} thatInvoker
		 * @param {Object} callbackFun function(depModule,err)
		 * @param {Object} pluginArgs
		 */
		relyIt(thatInvoker, callbackFun, pluginArgs) {
			if(this.otherModule) {
				this.get(); //状态同步
				this.otherModule.relyIt(thatInvoker, callbackFun, pluginArgs);
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
		},
		thiz: {
			getAbsoluteUrl() {
				return moduleMap.aurl;
			},
			getName() {
				return moduleMap.name;
			},
			invoker() {
				return moduleMap.invoker;
			},
			absUrl() { //用于获取其他模块地址的参考路径
				return absoluteUrl;
			}
		}
	};

	//返回_module_
	moduleMap.dealInstance = function(moduleInstance) {
		instances.push(moduleInstance);
		let _module_ = {
			opId: null,
			setToAll: function(name, value, opId) {
				if(opId !== undefined && opId == this.opId) {
					return; //防止循环
				}
				opId = opId || getModuleId();
				this.opId = opId;

				let obj = {};
				if(isString(name)) {
					obj[name] = value;
				} else if(isObject(name)) {
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
	moduleMap.mayAddDeps = function(deps) {
		let moduleDeps = this.deps;
		let insertCount = 0;
		utils.each(moduleDeps, function(dep) {
			if(indexInArray(deps, dep) < 0) {
				deps.splice(0, 0, dep);
				insertCount++;
			}
		}, false, true);
		this.deps = deps;
		this.directDefineIndex += insertCount;
		return deps;
	};
	moduleMap.printOnNotDefined = function() {
		let root = {
			nodes: []
		};
		this._printOnNotDefined(root);

		let leafs = [];

		let findLeaf = function(node) {
			if(node.nodes.length) {
				utils.each(node.nodes, function(item) {
					findLeaf(item);
				});
			} else {
				leafs.push(node);
			}
		}
		findLeaf(root);

		let genErrs = function(node, infos) {
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
	setModule(name, moduleMap);
	_buildInvoker(moduleMap);
	return moduleMap;
}

function getThatInvokerForDef_Req(thiz, nullNew) {
	if(thiz instanceof _Async_Object_) {
		return thiz.getInvoker();
	}
	let invoker = thiz && utils.isFunction(thiz.invoker) &&
		utils.isFunction(thiz.getName) && utils.isFunction(thiz.getUrl) &&
		utils.isFunction(thiz.getAbsoluteUrl) ? thiz : null;
	if(!invoker && nullNew) {
		let newObj = {
			module: {
				name: ""
			},
			thiz: {
				getAbsoluteUrl() {
					return thePageUrl;
				},
				absUrl() {
					return thePageUrl;
				},
				getName() {
					return "__root__";
				},
				invoker() {
					return this;
				}
			}
		};
		_buildInvoker(newObj);
		invoker = newObj.thiz;
	}
	return invoker;
}

loader.initDefine(function theRealDefine(defines) {
	defines.forEach((defineObject) => {
		let {
			thiz,
			args,
			src,
			isRequire,
			parentDefine,
			handle,
		} = defineObject;
		defineObject.thatInvoker = getThatInvokerForDef_Req(thiz);

		let [name, deps, callback] = args;

		if(typeof name !== 'string') {
			callback = deps;
			deps = name;
			name = src;
		}

		if(!utils.isArray(deps)) {
			callback = deps;
			deps = null;
		}

		if(!deps) {
			deps = [];
		}

		if(!isRequire) {
			xsloader.appendInnerDeps(deps, callback);
		}

		let context = loader.getContext();

		if(utils.isFunction(callback)) {
			let originCallback = callback;
			callback = function() {
				let config = theConfig;
				let rt;
				if(utils.isFunction(config.defineFunction[cache.name])) {
					let args = [];
					for(let i = 0; i < arguments.length; i++) {
						args.push(arguments[i]);
					}
					rt = config.defineFunction[cache.name].apply(this, [originCallback, this, args]);
				} else {
					rt = originCallback.apply(this, arguments);
				}

				originCallback = null;
				return rt;
			};
			callback.originCallback = originCallback;
		}

		_onScriptComplete(name, defineObject, src, isRequire)

	});
});

//定义模块
export const define = function() {
	return loader.predefine.apply(this, arguments);
}

export const require = function() {
	return loader.prerequire.apply(this, arguments);
}

xsloader.define = define;
xsloader.defineAsync = define;
xsloader.require = require;

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

xsloader.clear_module_ = function() {
	let modules = arguments;
	for(let i = 0; i < modules.length; i++) {
		if(modules[i]) {
			delete modules[i]._module_;
			delete modules[i]._modules_;
		}
	}
}
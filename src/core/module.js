import * as script from './script.js';
import { xsloader } from './xsloader.js';
import * as utils from '../utils/index.js';

const currentDefineModuleQueue = script.currentDefineModuleQueue;
let idCount = 2019;
let theDefinedMap = {}; //存放原始模块

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
		let theConfig = script.getConfig();
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

function newModule(name, deps, callback, thatInvoker, absoluteUrl) {
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

function _getPluginParam(path) {
	let pluginIndex = path.indexOf("!");
	if(pluginIndex > 0) {
		return path.substring(pluginIndex);
	} else {
		return "";
	}
}

//everyOkCallback(depModules,module),errCallback(err,invoker)
function everyRequired(data, thenOption, module, deps, everyOkCallback, errCallback) {

	if(data.isError) {
		return;
	}

	let config = theConfig;
	let context = theContext;

	utils.replaceModulePrefix(config, deps); //前缀替换
	_dealEmbedDeps(deps); //处理嵌套依赖

	for(let i = 0; i < deps.length; i++) {
		//console.log(module.name+("("+thenOption.defined_module_for_deps+")"), ":", deps);
		let m = deps[i];
		let jsFilePath = _isJsFile(m);

		if(module.thiz.rurl(thenOption)) { //替换相对路径为绝对路径
			if(jsFilePath && _startsWith(m, ".")) {
				m = _getPathWithRelative(module.thiz.rurl(thenOption), jsFilePath.path) + _getPluginParam(m);
				deps[i] = m;
			}
		}
		let paths = graphPath.tryAddEdge(thenOption.defined_module_for_deps || module.name, m);
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
			let isJsFile = _isJsFile(dep);
			do {

				let willDelay = false;
				let urls;
				let _deps = config.getDeps(dep); //未加载模块前，获取其依赖
				if(thenOption.depBefore) {
					thenOption.depBefore(index, dep, _deps, 1);
				}

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
					urls = isArray(_url) ? _url : [_url];
				} else if(config.isInUrls(dep)) {
					urls = config.getUrls(dep);
				} else if(isJsFile) {
					urls = [dep];
				} else {
					willDelay = true; //延迟加载
					urls = [];
				}

				let module2 = _newModule(dep, _deps, null, /*thenOption.thatInvoker ||*/ module.thiz);
				if(willDelay && _deps.length == 0) {
					break;
				}
				module2.aurl = urls[0];

				let loadAllScript = function() {
					if(_deps.length > 0) {
						_everyRequired(data, thenOption, module2, _deps, function(depModules, module2) {
							let args = [];
							let hasExports = false;
							each(depModules, function(depModule) {
								args.push(depModule && depModule.moduleObject());
							});
							mayAsyncCallLoadScript();
						}, function(err, invoker) {
							isError = err;
							errCallback(err, invoker);
						});
					} else {
						mayAsyncCallLoadScript();
					}
				}

				function mayAsyncCallLoadScript() {
					if(IE_VERSION > 0 && IE_VERSION <= 10) {
						asyncCall(function() {
							loadScript();
						});
					} else {
						loadScript();
					}
				};

				function loadScript() {
					if(!urls.length) {
						return;
					}
					let callbackObj = {
						module: module2
					};
					callbackObj.okCallbackForLastScript = function(depModule) {
							checkFinish(index, originDep, depModule, syncHandle);
						},
						callbackObj.onScriptLoad = function(evt) {
							if(callbackObj.removed) {
								return;
							}
							if(evt.type === 'load' ||
								(readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {

								//TODO STRONG 直接认定队列里的模块全来自于该脚本
								let scriptData = __getScriptData(evt, callbackObj);

								loadScriptMap[scriptData.node.src] = true;
								callbackObj.removed = true;
								let hasAnonymous = false;
								let defQueue = context.defQueue;
								context.defQueue = [];
								let defineCount = defQueue.length;

								for(let i2 = 0; i2 < defQueue.length; i2++) {
									let cache = defQueue[i2];
									let isCurrentScriptDefine = true;
									if(hasAnonymous || !isCurrentScriptDefine) {
										if(!cache.name) {
											let errinfo = "multi anonymous define in a script:" + (scriptData.node && scriptData.node.src) + "," + (cache.callback && cache.callback.originCallback || cache.callback);
											isError = errinfo;
											checkFinish(index, undefined, undefined, syncHandle);
											throwError(-10, errinfo);
										}
									} else {
										hasAnonymous = !cache.name;
									}

									let parentDefine = cache.data.parentDefine;
									if(parentDefine) {
										defineCount--;
									}

									let aurl = cache.src;
									if(isCurrentScriptDefine) {
										if(cache.src == theLoaderUrl) {
											aurl = _getAbsolutePath(scriptData.node); //获取脚本地址
										} else {
											aurl = cache.src || _getAbsolutePath(scriptData.node); //获取脚本地址
										}
									}

									if(aurl) {
										let i = aurl.indexOf("?");
										if(i >= 0) {
											aurl = aurl.substring(0, i);
										}
									}
									//对于只有一个define的脚本，优先使用外部指定的模块名称、同时也保留define提供的名称。
									if(defineCount == 1 && !parentDefine) {
										let name = scriptData.name || cache.name;
										cache.selfname = cache.name;
										cache.name = name;
									} else {
										cache.name = cache.name || scriptData.name;
									}

									//TODO STRONG 对应的脚本应该是先执行
									_onScriptComplete(cache.name, cache, aurl, undefined, {
										thenOption: thenOption,
										index: index,
										dep: originDep
									});
								}

								if(defineCount == 0) { //用于支持没有define的js库
									//module.jsScriptCount++;
									callbackObj.module.finish([]);
									//callbackObj.module.setState("defined");
									//checkFinish(index, scriptData.name, undefined, syncHandle);
								}

							}
						};
					callbackObj.onScriptError = function(evt) {
						if(callbackObj.removed) {
							return;
						}
						let scriptData = __getScriptData(evt, callbackObj);
						callbackObj.removed = true;
						let errinfo = "load module '" + scriptData.name + "' error:" + xsJson2String(evt);
						isError = errinfo;
						errCallback(errinfo, invoker_the_module);
					};
					module2.setState("loading");
					each(urls, function(url, index) {
						if(_startsWith(url, ".") || _startsWith(url, "/")) {
							if(!module2.thiz.rurl(thenOption)) {
								isError = "script url is null:'" + module2.name + "'," + module2.callback;
								throwError(-11, isError);
							}
							url = _getPathWithRelative(module2.thiz.rurl(thenOption), url);
						} else {
							let absolute = _dealAbsolute(url);
							if(absolute.absolute) {
								url = absolute.path;
							} else {
								url = config.baseUrl + url;
							}
						}
						urls[index] = config.dealUrl( /*thenOption.thatInvoker && thenOption.thatInvoker.getName() || */ module2, url);
					});
					__browserLoader(context, module2, urls, callbackObj);
				}

				loadAllScript();
			} while (false);
		}
		relyItFun();
	}, thenOption.orderDep);
	//TODO STRONG ie10及以下版本，js文件一个一个加载，从而解决缓存等造成的混乱问题
}

export {
	getModule,
	setModule,
	newModule,
	everyRequired,
}
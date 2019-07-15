import * as script from './script.js';
import { xsloader } from './xsloader.js';
import * as utils from '../utils/index.js';

import * as moduleObject from './module.js';

function onScriptComplete(defineObject, lastDefineObject) {
	let aurl = defineObject.src;
	let module = moduleObject.getModule(defineObject.selfname);
	if(module && module.state != 'loading' && module.state != 'init') {
		throwError(-2, "already define '" + defineObject.selfname + "'");
	}

	thenOption.absUrl = thenOption.absUrl || function() {
		return this.absoluteUrl || (this.thatInvoker ? this.thatInvoker.absUrl() : null);
	}

	let config = script.getConfig();

	let deps = defineObject.deps;
	let module = ifmodule;
	if(!module) {
		module = moduleObject.newModule(defineObject.selfname, null, defineObject.callback,
			defineObject.thatInvoker, defineObject.handle.absoluteUrl);
	}

	deps = module.mayAddDeps(deps);
	if(defineObject.handle.before) {
		defineObject.handle.before(deps);
	}
	if(lastDefineObject && lastDefineObject.then.depBefore) {
		lastDefineObject.handle.depBefore(lastDefineObject.index, defineObject.selfname, deps, 2);
	}

	if(module.name && xsloader._ignoreAspect_[module.name] ||
		defineObject.selfname && xsloader._ignoreAspect_[defineObject.selfname]) {
		module.ignoreAspect = true;
	}

	if(module.name && defineObject.selfname != module.name) {
		let moduleSelf = getModule(defineObject.selfname);
		if(moduleSelf) {
			if(moduleSelf.state == "init") {
				moduleObject.setModule(defineObject.selfname, module);
				moduleSelf.toOtherModule(module);
			} else {
				throwError(-2, "already define '" + cache.selfname + "'");
			}
		} else {
			moduleObject.setModule(defineObject.selfname, module);
		}
	}
	module.setState("loaded");
	module.callback = defineObject.callback;
	module.setInstanceType(defineObject.handle.instance || config.instance);

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

function _Async_Object_(invoker, asyncDefine) {
	this.getInvoker = function() {
		return invoker;
	}
	this.isAsyncDefine = function() {
		return asyncDefine;
	}
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

const defineHandle = script.initDefine(function theRealDefine(defines) {
	defines.forEach((defineObject) => {
		let {
			thiz,
			args,
			src,
			isRequire,
			parentDefine,
			handle: {
				onError,
				before,
				depBefore,
				orderDep,
				absoluteUrl,
				instance,
			},
		} = defineObject;
		defineObject.thatInvoker = getThatInvokerForDef_Req(thiz);

		let [selfname, deps, callback] = args;

		if(typeof selfname !== 'string') {
			callback = deps;
			deps = selfname;
			selfname = src;
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

		let context = script.getContext();

		if(utils.isFunction(callback)) {
			let originCallback = callback;
			callback = function() {
				let config = script.getConfig();
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
		defineObject.selfname = selfname;
		defineObject.deps = deps;
		defineObject.callback = callback;
		onScriptComplete(defineObject);

	});
});

//定义模块
export const define = function() {
	return defineHandle.predefine.apply(this, arguments);
}

export const require = function() {
	return defineHandle.prerequire.apply(this, arguments);
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
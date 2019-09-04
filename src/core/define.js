import utils from "../util/index.js";
import script from "./script.js";
import moduleScript from "./module.js";

const global = utils.global;
const xsloader = global.xsloader;
const theDefinedMap = {};

const defineHandle = script.initDefine(function theRealDefine(defines) {
	utils.each(defines, (defineObject) => {
		let {
			thiz,
			args,
			isRequire,
			src, //必存在src
			parentDefine,
			thatInvoker,
			handle: {
				onError,
				before,
				depBefore,
				orderDep,
				absoluteUrl,
				instance,
			},
		} = defineObject;

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

		//获取函数体里直接require('...')的依赖
		//if(!isRequire) {
		utils.appendInnerDeps(deps, callback);
		//}
		//获取配置里配置的依赖
		let _deps = xsloader.script().getDeps(src);
		utils.each(_deps, (dep) => {
			deps.push(dep);
		});
		if(selfname && selfname != src) {
			deps = xsloader.script().getDeps(selfname);
			utils.each(_deps, (dep) => {
				deps.push(dep);
			});
		}

		if(xsloader.isFunction(callback)) {
			let originCallback = callback;
			callback = function() {
				let config = xsloader.script();
				let rt;
				if(xsloader.isFunction(config.defineFunction[cache.name])) {
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
		onModuleLoaded(defineObject);

	});
});

/**
 * 当前模块脚本已经完成加载、但其依赖的模块可能需要加载。
 * 当前模块：src、selfname已经确定。
 * 若当前模块依赖为0、则可以直接finish；若当前模块存在其他依赖、则设置回调，等待被其他地方依赖时再触发。
 * @param {Object} defineObject 当前模块
 * @param {Object} lastDefineObject 第一次加载当前模块的模块
 */
function onModuleLoaded(defineObject, lastDefineObject) {

	//先根据src获取模块
	let ifmodule = moduleScript.getModule(defineObject.src);
	if(ifmodule) {
		if(ifmodule.state != 'loading' && ifmodule.state != 'init') {
			//正常
		} else if(ifmodule.state == "defined") {
			throw new Error("already define '" + ifmodule.selfname + "'(src=" + ifmodule.src + ")");
		} else {
			throw new Error("already define failed '" + ifmodule.selfname + "'(src=" + ifmodule.src + ")");
		}

		if(ifmodule.selfname != ifmodule.src) {
			//此处的名字可能由配置指定
			let moduleSelf = getModule(ifmodule.selfname);
			if(moduleSelf) {
				if(moduleSelf != ifmodule) {
					if(moduleSelf.state == "init") {
						setModule(ifmodule.selfname, module);
						moduleSelf.toOtherModule(module);
					} else {
						throw Error("already define '" + ifmodule.selfname + "'");
					}
				}
			} else {
				setModule(ifmodule.selfname, module);
			}
		}
		if(defineObject.src != defineObject.selfname && ifmodule.selfname != defineObject.selfname) {
			//此处的名字一定是define时指定
			//TODO
		}
	}

	let module = moduleScript.getModule(defineObject.selfname || defineObject.src);
	if(!module) {
		module = moduleScript.newModule(defineObject);
	} else {
		//defineObject里的deps最初是直接声明的依赖,应该出现在最前面
		module.mayAddDeps(defineObject.deps);
	}

	if(defineObject.handle.before) {
		defineObject.before(module.deps);
	}
	if(lastDefineObject && lastDefineObject.handle.depBefore) {
		lastDefineObject.handle.depBefore(lastDefineObject.index, module.name, module.deps, 2);
	}

	if(xsloader._ignoreAspect_[module.name]) {
		module.ignoreAspect = true;
	}

	module.setState("loaded");
	module.setInstanceType(defineObject.handle.instance || xsloader.config().instance);

	if(deps.length == 0) {
		module.finish([]); //递归结束
	} else {
		//在其他模块依赖此模块时进行加载
		let needCallback = function() {
			moduleScript.everyRequired(defineObject, module, (depModules) => {
				let args = [];
				let depModuleArgs = [];
				utils.each(depModules, (depModule) => {
					depModuleArgs.push(depModule);
					args.push(depModule && depModule.moduleObject());
				});
				args.push(depModuleArgs);
				module.finish(args);
			}, (err, invoker) => {
				define.handle.onError(err, invoker);
			});
		};

		if(defineObject.isRequire) {
			needCallback();
		} else {
			module.whenNeed(needCallback);
		}
	}

};

//定义模块
const define = function() {
	return defineHandle.predefine.apply(this, arguments);
}

const require = function() {
	return defineHandle.prerequire.apply(this, arguments);
}

xsloader.define = define;
xsloader.defineAsync = define;
xsloader.require = require;
global.define = define;
global.require = require;
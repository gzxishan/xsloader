import utils from "./util/index.js";
import script from "./core/script.js";
import moduleScript from "./core/module.js";

const global = utils.global;
const xsloader = global.xsloader;

const defineHandle = script.initDefine(function theRealDefine(defines, loaded = () => {}) {
	utils.each(defines, (defineObject) => {
		if(xsloader.isFunction(defineObject.callback)) {
			let originCallback = defineObject.callback;
			defineObject.callback = function() {
				let config = xsloader.config();
				let rt;

				let defineFun;
				utils.each(defineObject.names, (name) => {
					let fun = config.defineFunction[name];
					if(xsloader.isFunction(fun)) {
						defineFun = fun;
						return false;
					}
				});

				if(defineFun) {
					let args = [];
					for(let i = 0; i < arguments.length; i++) {
						args.push(arguments[i]);
					}
					rt = defineFun.apply(this, [originCallback, this, args]);
				} else {
					rt = originCallback.apply(this, arguments);
				}

				originCallback = null;
				return rt;
			};
			defineObject.callback.originCallback = originCallback;
		}
		onModuleLoaded(defineObject, moduleScript.getLastDefineObject(defineObject.src));
		loaded();
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
	let ifmodule = moduleScript.getModule(defineObject.src, defineObject.selfname);
	if(ifmodule) {
		if(ifmodule.state == "loading") {
			ifmodule.reinitByDefineObject(defineObject);
		}
	} else {
		ifmodule = moduleScript.newModule(defineObject);
	}

	let names = []; //[defineObject.src];
	if(defineObject.selfname && defineObject.selfname != defineObject.src) {
		names.push(defineObject.selfname);
	}

	if(ifmodule.selfname && ifmodule.selfname != defineObject.selfname && ifmodule.selfname != defineObject.src) {
		//此处的名字可能由配置指定
		names.push(ifmodule.selfname);
	}
	defineObject.names = names; //一个模块的所有名字，包括src
	utils.each(names, (name) => {
		moduleScript.setModule(name, ifmodule);
		if(xsloader._ignoreAspect_[name]) {
			ifmodule.ignoreAspect = true;
		}
	});

	let module = ifmodule;

	if(defineObject.handle.before) {
		defineObject.handle.before(module.deps);
	}
	if(lastDefineObject && lastDefineObject.handle.depBefore) {
		lastDefineObject.handle.depBefore(lastDefineObject.index, module.selfname, module.deps, 2);
	}

	module.setState("loaded");
	module.setInstanceType(defineObject.handle.instance || xsloader.config().instance);

	if(module.deps.length == 0) {
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
				defineObject.handle.onError(err, invoker);
			});
		};

		if(defineObject.isRequire) {
			needCallback();
		} else {
			module.whenNeed(needCallback);
		}
	}

}

//定义模块
const define = function() {
	return defineHandle.predefine.apply(this, arguments);
};

const require = function() {
	return defineHandle.prerequire.apply(this, arguments);
};

require.has = function() {
	var args = arguments;
	if(args.length == 0) {
		return false;
	}
	for(var i = 0; i < args.length; i++) {
		var module = moduleScript.getModule(args[i]);
		if(!module || module.state != "defined") {
			return false;
		}
	}
	return true;
};

xsloader.define = define;
xsloader.defineAsync = define;
xsloader.require = require;
global.define = define;
global.require = require;

define.amd = true;
define("exports", function() {});
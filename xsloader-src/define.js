import U from "./util/index.js";
import script from "./core/script.js";
import moduleScript from "./core/module.js";

const G = U.global;
const L = G.xsloader;

const defineHandle = script.initDefine(function theRealDefine(defines, loaded = () => {}) {
	U.each(defines, (defineObject) => {
		if (L.isFunction(defineObject.callback)) {
			let originCallback = defineObject.callback;
			defineObject.callback = function() {
				//				if(defineObject.isRequire) {
				//					console.log("1======require:" + defineObject.selfname);
				//					console.log(defineObject);
				//					console.log(originCallback);
				//				}
				let config = L.config();
				let rt;

				let defineFun;
				U.each(defineObject.names, (name) => {
					let fun = config.defineFunction[name];
					if (L.isFunction(fun)) {
						defineFun = fun;
						return false;
					}
				});

				if (defineFun) {
					let args = [];
					for (let i = 0; i < arguments.length; i++) {
						args.push(arguments[i]);
					}
					rt = defineFun.apply(this, [originCallback, this, args]);
				} else {
					rt = originCallback.apply(this, arguments);
				}

				originCallback = null;
				return rt;
			};
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
	//同一个模块可能分属于不同的module对象，加载者module当前处于loading状态、需要将其依赖追加进来、确保依赖完整
	moduleScript.appendLoadingModuleDeps(defineObject);
	//先根据src获取模块
	let ifmodule = moduleScript.getModule(defineObject.src, defineObject.selfname);

	let moduleBeforeCurrentPath;
	if (!ifmodule && defineObject.srcBeforeCurrentPath) { //根据处理__currentPath前的地址获取模块
		moduleBeforeCurrentPath = moduleScript.getModule(defineObject.srcBeforeCurrentPath);
	}

	if (ifmodule) {
		if (ifmodule.state == "loading") {
			ifmodule.reinitByDefineObject(defineObject);
		}
	} else {
		ifmodule = moduleScript.newModule(defineObject);
		moduleBeforeCurrentPath && moduleBeforeCurrentPath.toOtherModule(ifmodule);
	}

	if (defineObject.selfname != defineObject.src) {
		defineObject.pushName(defineObject.selfname);
	}

	if (ifmodule.selfname != defineObject.src) {
		//此处的名字可能由配置指定
		defineObject.pushName(ifmodule.selfname);
	}
	//一个模块的所有名字，包括src
	U.each(defineObject.names, (name) => {
		moduleScript.setModule(name, ifmodule);
		if (L.ignoreAspect_[name]) {
			ifmodule.ignoreAspect = true;
		}
	});
	defineObject.appendConfigDepsAndEmbedDeps(ifmodule); //添加配置依赖:在配置文件里直接通过src、名称配置的

	let module = ifmodule;

	if (defineObject.handle.before) {
		defineObject.handle.before(module.deps);
	}
	if (lastDefineObject && lastDefineObject.handle.depBefore) {
		lastDefineObject.handle.depBefore(lastDefineObject.index, module.selfname, module.deps, 2);
	}

	module.setState("loaded");
	module.setInstanceType(defineObject.handle.instance || L.config().instance);

	if (module.deps.length == 0) {
		try {
			module.finish([]); //递归结束
		} catch (e) {
			defineObject.handle.onError(e);
		}
	} else {
		//在其他模块依赖此模块时进行加载
		let needCallback = function() {
			moduleScript.everyRequired(defineObject, module, (depModules) => {
				let args = [];
				let depModuleArgs = [];
				U.each(depModules, (depModule) => {
					depModuleArgs.push(depModule);
					args.push(depModule && depModule.moduleObject());
				});
				args.push(depModuleArgs);
				try {
					module.finish(args);
				} catch (e) {
					defineObject.handle.onError(e);
				}
			}, (err, invoker) => {
				return defineObject.handle.onError(err, invoker);
			});
		};

		if (defineObject.isRequire) {
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

require.get = function(name) {
	if (!L.isString(name)) {
		throw new Error("expected string type for module name");
	} else {
		return require.call(this, name);
	}
};

require.has = function() {
	var args = arguments;
	if (args.length == 0) {
		return false;
	}
	for (var i = 0; i < args.length; i++) {
		var module = moduleScript.getModule(args[i]);
		if (!module || module.state != "defined") {
			return false;
		}
	}
	return true;
};

L.define = define;
//deprecated
L.defineAsync = define;
L.require = require;
G.define = define;
G.require = require;

define.amd = true;

//声明exports,内部会做特殊处理
define("exports", function() {});

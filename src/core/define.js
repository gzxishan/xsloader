import * as loader from './script-loader.js';
import { xsloader } from './xsloader.js';
import * as utils from '../utils/index.js';

const currentDefineModuleQueue = []; //当前回调的模块
currentDefineModuleQueue.peek = function() {
	if(this.length > 0) {
		return this[this.length - 1];
	}
};

loader.initDefine(function theRealDefine(defines) {
	defines.forEach((defineObject) => {
		let {
			thiz,
			args,
			src,
			handle,
		} = defineObject;
		defineObject.parentDefine = currentDefineModuleQueue.peek();

		let [name, deps, callback] = args;

		if(typeof name !== 'string') {
			callback = deps;
			deps = name;
			name = null;
		}

		if(!utils.isArray(deps)) {
			callback = deps;
			deps = null;
		}

		if(!deps) {
			deps = [];
		}

		if(!handle.isRequire) {
			xsloader.appendInnerDeps(deps, callback);
		}

		let context = theContext;

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

	});
});

export const define = function() {
	return loader.predefine.apply(this, arguments);
}

xsloader.define = define;
xsloader.defineAsync = defineAsync;
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
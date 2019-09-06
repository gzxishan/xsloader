import utils from "../util/index.js";
const global = utils.global;
const theDefinedMap = {};
const lastDefinObjectMap = {};

class ModuleDef {
	src;
	defaultModule; //默认模块（ define时未指定selfname的） 只能有一个
	modules; //define的其他模块（含有selfname）
	isPreDependOn; //用于提前依赖
	_preModule;
	targetDef; //用于提前依赖
	constructor(src, isPreDependOn = false) {
		this.src = src;
		this.isPreDependOn = isPreDependOn;
		this.modules = {};
		this.defaultModule = null;
		this.targetDef = null;
		if(isPreDependOn) {
			this._preModule = {
				relyQueue: [],
				get() {
					return this;
				},
				relyIt() {
					let args = [];
					for(let i = 0; i < arguments.length; i++) {
						args.push(arguments[i]);
					}
					this.relyQueue.push(args);
				}
			};
		}
	}
	giveRelys(module) {
		let queue = this._preModule.relyQueue;
		this._preModule = null;
		while(queue.length) {
			let args = queue.shift();
			module.relyIt.apply(module, args);
		}
	}
}

function _isSrc(nameOrUrl) {
	let isSrc = /^[a-zA-Z0-9]+:\/\//.test(nameOrUrl);
	return isSrc;
}

function setLastDefineObject(src, defineObject) {
	src = utils.removeQueryHash(src);
	lastDefinObjectMap[src] = defineObject;
}

function getLastDefineObject(src) {
	src = utils.removeQueryHash(src);
	return lastDefinObjectMap[src];
}

function getModule(nameOrUrl, selfname = null) {
	nameOrUrl = utils.removeQueryHash(nameOrUrl);
	let isSrc = _isSrc(nameOrUrl);

	let moduleDef = theDefinedMap[nameOrUrl];
	if(moduleDef) {
		let module;
		if(isSrc) { //如果提供地址、则获取默认模块
			if(selfname) {
				module = moduleDef.modules[selfname];
			} else {
				module = moduleDef.defaultModule;
			}
		} else {
			if(moduleDef.isPreDependOn) {
				module = moduleDef._preModule;
			} else {
				module = moduleDef.modules[nameOrUrl];
			}
		}
		return module ? module.get() : null;
	} else {
		return null;
	}
}

//提前依赖不存在的模块
function preDependOn(name) {
	let isSrc = _isSrc(name);
	if(isSrc) {
		throw new Error("expected name,but src:" + name);
	} else if(theDefinedMap[name]) {
		throw new Error("already defined:" + name);
	} else {
		let def = new ModuleDef(null, !!name);
		theDefinedMap[name] = def;
	}
}

/**
 * 替换模块的src，用于加载含有多个地址模块的情况（提供多个地址、直到加载成功）
 * @param {Object} oldSrc
 * @param {Object} module
 */
function replaceModuleSrc(oldSrc, module) {
	let moduleDef = theDefinedMap[oldSrc];
	if(!moduleDef) {
		throw new Error("not found module:src=" + oldSrc);
	} else if(theDefinedMap[module.src]) {
		throw new Error("already exists module:src=" + module.src);
	} else {
		moduleDef.src = module.src;
		delete theDefinedMap[oldSrc];
		theDefinedMap[module.src] = moduleDef;
	}
}

function clearEmptyModuleBySrc(src) {
	let moduleDef = theDefinedMap[src];
	if(moduleDef && !moduleDef.defaultModule) {
		if(moduleDef.defaultModule) {
			throw new Error("not empty module:src=" + src);
		} else {
			for(let x in moduleDef.modules) {
				throw new Error("not empty module:src=" + src);
			}
		}
		delete theDefinedMap[src];
	}
}

/**
 * 同一个模块可重复设置。
 * @param {Object} name 模块名字，若为空则表示模块模块。多个不同的名字可能指向同一个模块。
 * @param {Object} module 模块，必须含有src
 */
function setModule(name, module) {
	let src = module.src;
	if(!src) {
		throw new Error("expected module src!");
	}
	let moduleDef = theDefinedMap[src];
	if(moduleDef) {
		if(name) {
			let lasfDef = theDefinedMap[name];
			if(theDefinedMap[name] && lasfDef != moduleDef && !lasfDef.isPreDependOn) {
				throw new Error("already define module:\n\tname=" + name + ",current.src=" + src + ",\n\tthat.src=" + theDefinedMap[name].src);
			} else {
				moduleDef.modules[name] = module;
				theDefinedMap[name] = moduleDef;
				if(lasfDef && lasfDef.isPreDependOn) {
					lasfDef.giveRelys(module);
				}
			}
		} else {
			//默认模块
			if(moduleDef.defaultModule && moduleDef.defaultModule != module) {
				throw new Error("already define default module:src=" + src);
			} else {
				moduleDef.defaultModule = module;
			}
		}
	} else {
		moduleDef = new ModuleDef(src);
		theDefinedMap[src] = moduleDef;
		if(name) {
			moduleDef.modules[name] = module;
			let lasfDef = theDefinedMap[name];
			if(lasfDef && !lasfDef.isPreDependOn) {
				throw new Error("already define module:\n\tname=" + name + ",current.src=" + src + ",\n\tthat.src=" + theDefinedMap[name].src);
			} else {
				theDefinedMap[name] = moduleDef;
				if(lasfDef && lasfDef.isPreDependOn) {
					lasfDef.giveRelys(module);
				}
			}
		} else {
			//默认模块
			moduleDef.defaultModule = module;
		}
	}
}

export default {
	getModule,
	setModule,
	replaceModuleSrc,
	clearEmptyModuleBySrc,
	preDependOn,
	setLastDefineObject,
	getLastDefineObject,
};
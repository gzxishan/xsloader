import moduleScript from "../module.js";
import U from "../../util/index.js";
const L = U.global.xsloader;

/**
 * exists!module1 or module2 or module3|windowVar1|windowVar2...
 */
L.define("exists", {
	isSingle: true,
	pluginMain(arg, onload, onerror, config) {
		let vars = arg.split("|");
		for(let i = 0; i < vars.length; i++) {
			vars[i] = vars[i].trim();
		}
		if(vars.length == 0) {
			onerror("args error for exists!");
		} else {
			let moduleNames = (vars[0].replace(/\s/g, " ")).split(" or ");
			let moduleName;
			let module;
			for(let i = 0; i < moduleNames.length; i++) {
				moduleName = moduleNames[i].trim();
				module = moduleScript.getModule(moduleName);
				if(module) {
					break;
				}
			}
			if(module) {
				this.invoker().withAbsUrl().require([moduleName], function(mod, depModuleArgs) {
					onload(mod);
				}).error(function(e) {
					onerror(e);
				});
			} else {
				let obj = undefined;
				for(let i = 1; i < vars.length; i++) {
					if(window[vars[i]]) {
						obj = window[vars[i]];
						break;
					}
				}
				if(obj === undefined) {
					onerror("not found:" + arg);
				} else {
					onload(obj);
				}
			}
		}
	}
});
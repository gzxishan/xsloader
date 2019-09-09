import moduleScript from "../module.js";
import utils from "../../util/index.js";
const global = utils.global;
const xsloader = global.xsloader;

xsloader.define("exists", {
	isSingle: true,
	pluginMain(arg, onload, onerror, config) {
		let vars = arg.split("|");
		for(let i = 0; i < vars.length; i++) {
			vars[i] = vars[i].trim();
		}
		if(vars.length == 0) {
			onerror("args error for exists!");
		} else {
			let moduleName = vars[0];
			let module = moduleScript.getModule(moduleName);
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
import moduleScript from "../module.js";
import utils from "../../util/index.js";
const global = utils.global;
const xsloader = global.xsloader;

xsloader.define(moduleScript.INNER_DEPS_PLUGIN, {
	pluginMain(depId, onload, onerror, config) {
		let depsObj = moduleScript.innerDepsMap[depId];
		let deps = depsObj.deps;
		//delete innerDepsMap[depId];
		this.invoker().require(deps, function() {
			let args = [];
			for(let k = 0; k < arguments.length; k++) {
				args.push(arguments[k]);
			}
			onload(args);
		}).then({
			orderDep: depsObj.orderDep
		});
	},
	getCacheKey(depId) {
		return depId;
	}
});
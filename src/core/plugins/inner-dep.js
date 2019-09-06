import script from "../script.js";
import utils from "../../util/index.js";
const global = utils.global;
const xsloader = global.xsloader;

//内部依赖加载插件

xsloader.define(script.INNER_DEPS_PLUGIN, {
	pluginMain(depId, onload, onerror, config) {
		let depsObj = script.innerDepsMap[depId];
		let deps = depsObj.deps;
		//delete innerDepsMap[depId];
		this.invoker().require(deps, function() {
			let args = [];
			for(let k = 0; k < arguments.length; k++) {
				args.push(arguments[k]);
			}
			onload(args);
		}).then({
			orderDep: depsObj.orderDep,
			error(err, invoker) {
				onerror(new utils.PluginError(err, invoker));
			}
		});
	},
	getCacheKey(depId) {
		return depId;
	}
});
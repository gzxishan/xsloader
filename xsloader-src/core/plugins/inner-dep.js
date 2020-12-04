import script from "../script.js";
import U from "../../util/index.js";
const L = U.global.xsloader;

//内部依赖加载插件

L.define(script.INNER_DEPS_PLUGIN, {
	pluginMain(depId, onload, onerror, config) {
		let depsObj = script.innerDepsMap[depId];
		let deps = depsObj.deps;
		//delete innerDepsMap[depId];
		let newInvoker = this.invoker().withAbsUrl(depsObj.absUrl);
		newInvoker.src = () => depsObj.src;
		newInvoker.require(deps, function() {
			let args = [];
			for(let k = 0; k < arguments.length; k++) {
				args.push(arguments[k]);
			}
			onload(args);
		}).then({
			orderDep: depsObj.orderDep,
			error(err, invoker) {
				onerror(new U.PluginError(err, invoker));
			}
		}).setTag(`${script.INNER_DEPS_PLUGIN}![${deps.join(',')}]`);
	},
	getCacheKey(depId) {
		return depId;
	}
});
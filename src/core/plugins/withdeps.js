import utils from "../../util/index.js";
const global = utils.global;
const xsloader = global.xsloader;
/**
 * 格式:withdeps!modulePath=>>[deps]
 */
xsloader.define("withdeps", {
	pluginMain(arg, onload, onerror, config) {
		let index = arg.indexOf("=>>");
		if(index == -1) {
			onerror("expected:=>>");
			return;
		}
		let moduleName = arg.substring(0, index);
		let depsStr = arg.substring(index + 3);
		let deps;
		try {
			deps = xsloader.xsParseJson(depsStr);
			if(!xsloader.isArray(deps)) {
				onerror("deps is not Array:" + depsStr);
				return;
			}
		} catch(e) {
			onerror("deps error:" + depsStr);
			return;
		}
		this.invoker().require([
			[false].concat(deps), moduleName
		], function(_deps, mod, depModuleArgs) {
			onload(mod);
		}).then({
			orderDep: true
		});
	}
});
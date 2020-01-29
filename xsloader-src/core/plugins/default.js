import utils from "../../util/index.js";
const global = utils.global;
const xsloader = global.xsloader;

/**
 * 格式:default!module
 */
xsloader.define("default", {
	isSingle: true,
	pluginMain(arg, onload, onerror, config) {
		let dep = arg;
		let handle = this.invoker().withAbsUrl().require([dep], function(mod, depModuleArgs) {
			if(xsloader.isObject(mod)) {
				mod = mod["default"];
				if(mod === undefined) {
					mod = null;
				}
			} else {
				mod = null;
			}
			onload(mod);
		}).error(function(err, invoker) {
			onerror(err);
		});
	}
});
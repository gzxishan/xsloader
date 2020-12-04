import U from "../../util/index.js";
const L = U.global.xsloader;

/**
 * 格式:default!module
 */
L.define("default", {
	isSingle: true,
	pluginMain(arg, onload, onerror, config) {
		let dep = arg;
		let handle = this.invoker().withAbsUrl().require([dep], function(mod, depModuleArgs) {
			if(L.isObject(mod)) {
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
		}).setTag(`default!${arg}`);
	},
});
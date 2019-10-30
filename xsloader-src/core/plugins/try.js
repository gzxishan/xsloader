import utils from "../../util/index.js";
const global = utils.global;
const xsloader = global.xsloader;

/**
 * 格式:name!module
 */
xsloader.define("try", {
	isSingle: true,
	pluginMain(arg, onload, onerror, config) {
		let dep = arg;
		this.invoker().withAbsUrl().require([dep], function(mod, depModuleArgs) {
			onload(mod);
		}).error(function(e) {
			console.warn(e);
			onload(null);
		});
	}
});
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
		let handle = this.invoker().withAbsUrl().require([dep], function(mod, depModuleArgs) {
			onload(mod);
		}).error(function(err, invoker) {
			console.info(`try!:require '${dep}' failed`)
			this.logError(err, invoker, "info");
			onload(null);
		});
		if(handle.waitTime && handle.waitTime > 1000) {
			handle.waitTime -= 1000;
		}
	}
});
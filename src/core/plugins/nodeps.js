import utils from "../../util/index.js";
const global = utils.global;
const xsloader = global.xsloader;

xsloader.define("nodeps", {
	isSingle: true,
	pluginMain(arg, onload, onerror, config) {
		this.invoker().require([arg], function(mod, depModuleArgs) {
			onload(mod);
		}).then({
			depBefore(index, dep, depDeps) {
				depDeps.splice(0, depDeps.length);
			}
		}).error(function(e) {
			onerror(e);
		});
	}
});
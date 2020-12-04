import U from "../../util/index.js";
const L = U.global.xsloader;

/**
 * 格式:name!module
 */
L.define("try", {
	isSingle: true,
	pluginMain(arg, onload, onerror, config) {
		let dep = arg;
		let handle = this.invoker().withAbsUrl().require([dep], function(mod, depModuleArgs) {
			onload(mod);
		}).error(function(err, invoker) {
			console.info(`try!:require '${dep}' failed`);
			this.logError(err, invoker, "info");
			return {
				ignoreErrState:true,
				onGetModule:()=>{
					return null;
				},
				onFinish:()=>{
					onload(null);
				}
			}
		}).setTag(`try!${arg}`);
		if(handle.waitTime && handle.waitTime > 1000) {
			handle.waitTime -= 1000;
		}
	}
});
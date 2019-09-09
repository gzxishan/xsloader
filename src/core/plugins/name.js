import moduleScript from "../module.js";
import utils from "../../util/index.js";
const global = utils.global;
const xsloader = global.xsloader;

/**
 * 格式:name!moduleName=>>modulePath
 */

xsloader.define("name", {
	isSingle: true,
	pluginMain(arg, onload, onerror, config) {
		let index = arg.indexOf("=>>");
		if(index == -1) {
			onerror("expected:=>>");
			return;
		}
		let moduleName = arg.substring(0, index);
		moduleName = moduleName.replace(/，/g, ',');
		let names = moduleName.split(",");
		let dep = arg.substring(index + 3);
		this.invoker().withAbsUrl().require([dep], function(mod, depModuleArgs) {
			let existsMods = [];
			for(let i = 0; i < names.length; i++) {
				let newName = names[i];
				let lastM = moduleScript.getModule(newName);
				if(lastM && lastM.state != "init") {
					existsMods.push(newName);
					continue;
				}
				let module = depModuleArgs[0].module;
				if(lastM) {
					lastM.toOtherModule(module);
				} else {
					moduleScript.setModule(newName, module);
				}
			}
			if(existsMods.length) {
				console.warn("already exists:", existsMods.join(','));
			}
			onload(mod);
		}).error(function(e) {
			onerror(e);
		});
	}
});
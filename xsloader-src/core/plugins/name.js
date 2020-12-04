import moduleScript from "../module.js";
import U from "../../util/index.js";
const L = U.global.xsloader;

/**
 * 格式:name!moduleName=>>modulePath
 */

L.define("name", {
	isSingle: true,
	pluginMain(arg, onload, onerror, config) {
		let index = arg.indexOf("=>>");
		if (index == -1) {
			onerror("expected:=>>");
			return;
		}
		let moduleName = arg.substring(0, index);
		moduleName = moduleName.replace(/，/g, ',');
		let names = moduleName.split(",");
		let dep = arg.substring(index + 3);
		this.invoker().withAbsUrl().require([dep], function(mod, depModuleArgs) {
			let existsMods = [];
			for (let i = 0; i < names.length; i++) {
				let newName = names[i];
				let lastM = moduleScript.getModule(newName);
				if (lastM && lastM.state != "init" && !lastM.preDependModule) {
					let errinfo = "\tselfname=" + newName + ",state=" + lastM.state + ",src=" + lastM.src;
					if (lastM.id === depModuleArgs[0].module.id) { //模块自己已经定义了
						console.info("already define name by self:" + errinfo);
					} else {
						existsMods.push(errinfo);
					}
					continue;
				}
				let module = depModuleArgs[0].module;
				if (lastM && !lastM.preDependModule) {
					lastM.toOtherModule(module);
				} else {
					moduleScript.setModule(newName, module);
				}
			}
			if (existsMods.length) {
				onerror("already exists:" + existsMods.join('\n'));
			} else {
				onload(mod);
			}
		}).error(function(e) {
			onerror(e);
		}).setTag(`name!${arg}`);
	},
});

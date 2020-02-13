import U from "../../util/index.js";
const L = U.global.xsloader;
/**
 * 格式：window!varNameInWindow=>>modulePath
 */
//window插件,用于添加模块到window对象中
L.define("window", {
	isSingle: true,
	pluginMain: function(arg, onload, onerror, config, http) {
		let index = arg.indexOf("=>>");
		if(index == -1) {
			onerror("expected:=>>");
			return;
		}
		let moduleName = arg.substring(0, index);
		let dep = arg.substring(index + 3);
		this.invoker().withAbsUrl().require([dep], function(mod, depModuleArgs) {
			window[moduleName] = mod;
			onload(mod);
		});
	}
});
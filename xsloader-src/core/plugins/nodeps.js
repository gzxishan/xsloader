import utils from "../../util/index.js";
const global = utils.global;
const xsloader = global.xsloader;

/**
 * 插件用于加载某些js文件，忽略其所有依赖，可用于忽略在加载webpack等打包的模块时自动添加内部require('...')的依赖
 */
xsloader.define("nodeps", {
	isSingle: true,
	pluginMain(arg, onload, onerror, config) {
		this.invoker().withAbsUrl().require([arg], function(mod, depModuleArgs) {
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
import utils from "../../util/index.js";
const global = utils.global;
const xsloader = global.xsloader;

/**
 * 加载json对象
 */
xsloader.define("json", ["xshttp"], {
	isSingle: true,
	pluginMain(name, onload, onerror, config, http) {
		let url = this.invoker().getUrl(name, true);
		http().url(url)
			.handleAs("json")
			.ok(function(json) {
				onload(json);
			})
			.fail(function(err) {
				onerror(err);
			})
			.done();
	}
});
import U from "../../util/index.js";
const L = U.global.xsloader;

/**
 * 加载json对象
 */
L.define("json", ["xshttp"], {
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
import U from "../../util/index.js";
const L = U.global.xsloader;

L.define("text", ["xshttp"], {
	isSingle: true,
	pluginMain(name, onload, onerror, config, http) {
		let url = this.invoker().getUrl(name, true);
		http().url(url)
			.handleAs("text")
			.ok(function(text) {
				onload(text);
			})
			.fail(function(err) {
				onerror(err);
			})
			.done();
	},
	dealPluginArgs(pluginArgs) {
		return pluginArgs;
	},
});

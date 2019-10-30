import utils from "../../util/index.js";
const global = utils.global;
const xsloader = global.xsloader;

xsloader.define("text", ["xshttp"], {
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
	}
});
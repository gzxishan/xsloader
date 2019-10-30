import utils from "../../util/index.js";
const global = utils.global;
const xsloader = global.xsloader;

xsloader.define("ready", {
	pluginMain(depId, onload, onerror, config) {
		xsloader.onReady(function() {
			onload();
		});
	}
});
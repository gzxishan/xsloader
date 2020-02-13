import U from "../../util/index.js";
const L = U.global.xsloader;

L.define("ready", {
	pluginMain(depId, onload, onerror, config) {
		L.onReady(function() {
			onload();
		});
	}
});
import utils from "../../util/index.js";
const global = utils.global;
const xsloader = global.xsloader;

/**
 * 用于图片加载
 */
xsloader.define("image", {
	pluginMain(name, onload, onerror, config) {
		let src = this.invoker().getUrl(name, false);
		let img = new Image();
		let callback = (ok) => {
			let image = img;
			img = null;
			image.onload = null;
			image.οnerrοr = null;
			onload(ok ? image : null);
		};
		img.onload = function() {
			callback(true);
		};
		img.οnerrοr = function() {
			callback(false);
		};
		img.src = src;
		xsloader.asyncCall(() => {
			if(img) {
				setTimeout(() => {
					if(img) {
						callback(false);
					}
				}, config.plugins.image.timeout);
			}
		});
	}
});
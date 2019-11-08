import JSON from './json.js';
import "./ie.js";
import ProxyUtil from './proxy.js';

function polyfillInit(global, xsloader) {
	let proxy = ProxyUtil();
	if(!global['Proxy']) {
		global.Proxy = proxy;
	}
	xsloader.Proxy = proxy;
}

export {
	JSON,
	polyfillInit
};
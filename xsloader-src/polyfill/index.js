import JSON from './json.js';
import "./ie.js";
import ProxyUtil from './proxy.js';

function polyfillInit(G, L) {
	let proxy = ProxyUtil();
	if(!G['Proxy']) {
		G.Proxy = proxy;
	}
	L.Proxy = proxy;
}

export {
	JSON,
	polyfillInit
};
import utils from "../util/index.js";

const global = utils.global;
const xsloader = global.xsloader;

let isDOM = (typeof HTMLElement === 'object') ?
	function(obj) {
		return obj && (obj instanceof HTMLElement);
	} :
	function(obj) {
		return obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string';
	};

let onReadyFun = (function() {
	let isGlobalReady = false;
	let bindReadyQueue = [];

	function BindReady(callback) {
		if(isGlobalReady) {
			callback();
			return;
		}
		let isReady = false;

		function ready() {
			if(isReady) return;
			isReady = true;
			isGlobalReady = true;
			callback();
		}
		// Mozilla, Opera and webkit nightlies currently support this event
		if(document.addEventListener) {
			let fun;
			fun = function() {
				document.removeEventListener("DOMContentLoaded", fun);
				ready();
			};
			document.addEventListener("DOMContentLoaded", fun);

		} else if(document.attachEvent) {
			// ensure firing before onload,
			// maybe late but safe also for iframes
			let fun;
			fun = function() {
				if(document.readyState === "complete") {
					document.detachEvent("onreadystatechange", fun);
					ready();
				}
			};
			document.attachEvent("onreadystatechange", fun);
			// If IE and not an iframe
			// continually check to see if the document is ready

			let fun2;
			fun2 = function() {
				if(isReady) return;
				try {
					// If IE is used, use the trick by Diego Perini
					// http://javascript.nwbox.com/IEContentLoaded/
					document.documentElement.doScroll("left");
				} catch(error) {
					setTimeout(fun2, 0);
					return;
				}
				// and execute any waiting functions
				ready();
			};

			if(document.documentElement.doScroll && typeof global.frameElement === "undefined")(fun2)();
		} else {
			xsloader.asyncCall(null, true).next(function() {
				ready();
			});
		}
		this.readyCall = ready;
	}
	let onReady = function(callback) {
		if(document.readyState === "complete") {
			isGlobalReady = true;
		}
		let br = new BindReady(callback);
		if(!isGlobalReady) {
			bindReadyQueue.push(br);
		}
	};
	onReady(function() {
		isGlobalReady = true;
	});

	if(document.readyState === "complete") {
		isGlobalReady = true;
	} else {
		let addEventHandle;
		if(global.addEventListener) {
			addEventHandle = function(type, callback) {
				global.addEventListener(type, callback, false);
			};
		} else if(global.attachEvent) {
			addEventHandle = function(type, callback) {
				global.attachEvent("on" + type, callback);
			};
		} else {
			addEventHandle = function(type, callback) {
				xsloader.asyncCall(null, true).next(function() {
					callback();
				});
			};
		}
		addEventHandle("load", function() {
			isGlobalReady = true;
			while(bindReadyQueue.length) {
				bindReadyQueue.shift().readyCall();
			}
		});
	}
	return onReady;
})();

export default {
	isDOM,
	onReady: onReadyFun
};
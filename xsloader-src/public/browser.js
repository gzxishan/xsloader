import U from "../util/index.js";

const G = U.global;
const L = G.xsloader;

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
		let removeListener;

		function ready() {
			if(isReady) return;
			isReady = true;
			isGlobalReady = true;
			if(removeListener) {
				removeListener();
				removeListener = null;
			}
			callback();
		}
		// Mozilla, Opera and webkit nightlies currently support this event
		if(document.addEventListener) {
			let fun;
			fun = function() {
				ready();
			};
			removeListener = function() {
				document.removeEventListener("DOMContentLoaded", fun);
			};
			document.addEventListener("DOMContentLoaded", fun);

		} else if(document.attachEvent) {
			// ensure firing before onload,
			// maybe late but safe also for iframes
			let fun;
			fun = function() {
				if(document.readyState === "complete") {
					ready();
				}
			};
			removeListener = function() {
				document.detachEvent("onreadystatechange", fun);
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

			if(document.documentElement.doScroll && typeof G.frameElement === "undefined")(fun2)();
		} else {
			L.asyncCall(null, true).next(function() {
				ready();
			});
		}
		this.readyCall = ready;
	}
	let onReady = function(callback) {
		if(document.readyState === "complete") {
			isGlobalReady = true;
		}

		if(isGlobalReady) {
			callback();
		} else {
			let br = new BindReady(callback);
			bindReadyQueue.push(br);
		}
	};

	let addEventHandle;
	onReady(function() {
		isGlobalReady = true;
		if(addEventHandle && addEventHandle.remove) {
			addEventHandle.remove();
			addEventHandle = null;
		}
	});

	if(document.readyState === "complete") {
		isGlobalReady = true;
	} else {
		if(G.addEventListener) {
			addEventHandle = function(type, callback) {
				let fun = function() {
					addEventHandle.remove();
					callback();
				};
				G.addEventListener(type, fun, false);
				addEventHandle.remove = function() {
					if(fun) {
						G.removeEventListener(type, fun);
						fun = null;
					}
				};
			};
		} else if(G.attachEvent) {
			addEventHandle = function(type, callback) {
				let fun = function() {
					addEventHandle.remove();
					callback();
				};
				G.attachEvent("on" + type, fun);
				addEventHandle.remove = function() {
					if(fun) {
						G.detachEvent("on" + type, fun);
						fun = null;
					}
				};
			};
		} else {
			addEventHandle = function(type, callback) {
				L.asyncCall(null, true).next(function() {
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
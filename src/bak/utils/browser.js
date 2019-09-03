//-1表示不是ie，其余检测结果为6~11及edge
const IE_VERSION = (() => {
	let userAgent = navigator.userAgent; //取得浏览器的userAgent字符串  
	let isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1; //判断是否IE<11浏览器  
	let isEdge = userAgent.indexOf("Edge") > -1 && !isIE; //判断是否IE的Edge浏览器  
	let isIE11 = userAgent.indexOf('Trident') > -1 && userAgent.indexOf("rv:11.0") > -1;
	if(isIE) {
		let reIE = new RegExp("MSIE[\\s]+([0-9.]+);").exec(userAgent);
		let fIEVersion = parseInt(reIE && reIE[1] || -1);
		return fIEVersion == -1 ? -1 : fIEVersion;
	} else if(isEdge) {
		return 'edge'; //edge
	} else if(isIE11) {
		return 11; //IE11  
	} else {
		return -1; //不是ie浏览器
	}
})();
const safariVersion = (function() {
	let ua = navigator.userAgent.toLowerCase();
	let s;
	return(s = ua.match(/version\/([\d.]+).*safari/)) ? parseInt(s[1]) : -1;
})();
const isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]';
const defContextName = "xsloader1.1.0";

//ie9
try {
	if(Function.prototype.bind && console && typeof console.log == "object") {
		["log", "info", "warn", "error", "assert", "dir", "clear", "profile", "profileEnd"]
		.forEach(function(method) {
			console[method] = this.call(console[method], console);
		}, Function.prototype.bind);
	}
} catch(e) {
	try {
		window.console = {
			log: function() {},
			error: function() {},
			warn: function() {}
		};
	} catch(e) {}
}

try {
	if(!String.prototype.trim) {
		String.prototype.trim = function() {
			return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
		}
	}

	if(!Array.prototype.indexOf) {
		Array.prototype.indexOf = function(elem, offset) {
			for(var i = offset === undefined ? 0 : offset; i < this.length; i++) {
				if(this[i] == elem) {
					return i;
				}
			}
			return -1;
		};
	}
	if(!Array.pushAll) {
		Array.pushAll = function(thiz, arr) {
			if(!isArray(arr)) {
				throw new Error("not array:" + arr);
			}
			for(var i = 0; i < arr.length; i++) {
				thiz.push(arr[i]);
			}
			return thiz;
		};
	}
} catch(e) {
	console.error(e);
}

function getScriptBySubname(subname) {
	let ss = document.getElementsByTagName('script');
	if(subname) {
		for(let i = 0; i < ss.length; i++) {
			let script = ss[i];
			let src = script.src;
			src = src.substring(src.lastIndexOf("/"));
			if(src.indexOf(subname) >= 0) {
				return script;
			}
		}
	} else {
		return ss;
	}
}

function isDom = ((typeof HTMLElement === 'object') ?
	function(obj) {
		return obj && (obj instanceof HTMLElement);
	} :
	function(obj) {
		return obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string';
	});

const head = document.head || document.getElementsByTagName('head')[0];

function getMineTopWindow() {
	let win = window;
	try {
		while(true) {
			if(win.parent && win != win.parent && (win.location.hostname == win.parent.hostname) && win.parent[defContextName]) {
				win = win.parent;
			} else {
				break;
			}
		}
	} catch(e) {}
	return win;
}

function getMineParentWindow() {
	let win = window;
	try {
		if(win.parent && win != win.parent && (win.location.hostname == win.parent.hostname) && win.parent[defContextName]) {
			win = win.parent;
		}
	} catch(e) {}
	return win;
}

export {
	IE_VERSION,
	safariVersion,
	isOpera,
	getScriptBySubname,
	isDom,
	head,
	getMineTopWindow,
	getMineParentWindow,
	defContextName,
};
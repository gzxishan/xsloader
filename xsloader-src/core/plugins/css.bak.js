import U from "../../util/index.js";
const L = U.global.xsloader;

/*
 * Require-CSS RequireJS css! loader plugin
 * 0.1.8
 * Guy Bedford 2014
 * MIT
 */
L.define("css", function() {
	if(typeof window == 'undefined')
		return {
			load: function(n, r, load) {
				load();
			}
		};
	let engine = window.navigator.userAgent.match(/Trident\/([^ ;]*)|AppleWebKit\/([^ ;]*)|Opera\/([^ ;]*)|rv\:([^ ;]*)(.*?)Gecko\/([^ ;]*)|MSIE\s([^ ;]*)|AndroidWebKit\/([^ ;]*)/) || 0;
	let useImportLoad = false;
	let useOnload = true;
	if(engine[1] || engine[7])
		useImportLoad = parseInt(engine[1]) < 6 || parseInt(engine[7]) <= 9;
	else if(engine[2] || engine[8] || 'WebkitAppearance' in document.documentElement.style)
		useOnload = false;
	else if(engine[4])
		useImportLoad = parseInt(engine[4]) < 18;
	let cssAPI = {};
	let curStyle, curSheet;
	let createStyle = function() {
		curStyle = document.createElement('style');
		L.appendHeadDom(curStyle);
		curSheet = curStyle.styleSheet || curStyle.sheet;
	};
	let ieCnt = 0;
	let ieLoads = [];
	let ieCurCallback;
	let createIeLoad = function(url) {
		curSheet.addImport(url);
		curStyle.onload = function() {
			processIeLoad();
		};

		ieCnt++;
		if(ieCnt == 31) {
			createStyle();
			ieCnt = 0;
		}
	};
	let processIeLoad = function() {
		ieCurCallback();
		let nextLoad = ieLoads.shift();
		if(!nextLoad) {
			ieCurCallback = null;
			return;
		}
		ieCurCallback = nextLoad[1];
		createIeLoad(nextLoad[0]);
	};
	let importLoad = function(url, callback) {
		callback = callback || function() {};
		if(!curSheet || !curSheet.addImport)
			createStyle();

		if(curSheet && curSheet.addImport) {
			if(ieCurCallback) {
				ieLoads.push([url, callback]);
			} else {
				createIeLoad(url);
				ieCurCallback = callback;
			}
		} else {
			curStyle.textContent = '@import "' + url + '";';
			let loadInterval = setInterval(function() {
				try {
					curStyle.sheet.cssRules;
					clearInterval(loadInterval);
					callback();
				} catch(e) {
					console.warn(e);
				}
			}, 10);
		}
	};
	let linkLoad = function(url, callback) {
		callback = callback || function() {};
		let link = document.createElement('link');
		link.type = 'text/css';
		link.rel = 'stylesheet';
		if(useOnload)
			link.onload = function() {
				link.onload = function() {};
				setTimeout(callback, 7);
			};
		else {
			let loadInterval = setInterval(function() {
				for(let i = 0; i < document.styleSheets.length; i++) {
					let sheet = document.styleSheets[i];
					if(sheet.href == link.href) {
						clearInterval(loadInterval);
						return callback();
					}
				}
			}, 10);
		}
		link.href = url;
		L.appendHeadDom(link);
	};
	cssAPI.pluginMain = function(cssId, onload, onerror, config) {
		//			if(cssId.indexOf(".css") != cssId.length - 4) {
		//				cssId += ".css";
		//			}
//		console.log("cssId="+cssId+",cssSrc="+this.invoker().getUrl(cssId, true)+",absUrl="+this.invoker().absUrl());
		(useImportLoad ? importLoad : linkLoad)(this.invoker().getUrl(cssId, true), onload);
	};
	cssAPI.getCacheKey = function(cssId) {
		//			if(cssId.indexOf(".css") != cssId.length - 4) {
		//				cssId += ".css";
		//			}
		let invoker = this.invoker();
		return invoker ? invoker.getUrl(cssId, true) : cssId;
	};
	cssAPI.loadCss = function(cssPath, callback) {
		(useImportLoad ? importLoad : linkLoad)(L.getUrl(cssPath), callback);
	};

	cssAPI.loadCsses = function() {
		let args = arguments;
		for(let i = 0; i < args.length; i++) {
			(useImportLoad ? importLoad : linkLoad)(L.getUrl(args[i]), null);
		}
	};
	return cssAPI;
});
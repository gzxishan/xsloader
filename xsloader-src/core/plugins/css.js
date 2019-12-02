import utils from "../../util/index.js";
const global = utils.global;
const xsloader = global.xsloader;

/*
 * Require-CSS RequireJS css! loader plugin
 * 0.1.8
 * Guy Bedford 2014
 * MIT
 */
xsloader.define("css", function() {

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
	let realFirstDom;
	const invokerUrl2CssNodes = {};

	function appendCssDom(dom, invokerUrl, inverse) {

		if(invokerUrl && inverse) {
			if(!invokerUrl2CssNodes[invokerUrl]) {
				//不同invoker间、逆向插入
				invokerUrl2CssNodes[invokerUrl] = {
					first: dom,
					last: dom,
				};

				let nextDom;//将会插入在该节点之前
				if(realFirstDom) {
					nextDom = realFirstDom;
				} else {
					nextDom = xsloader.script().nextSibling;
				}
				let head = xsloader.head();
				realFirstDom = dom;
				head.insertBefore(dom, nextDom);
			} else {
				//同一个invoker间正序加载
				let lastDom = invokerUrl2CssNodes[invokerUrl].last;
				let nextDom = lastDom.nextSibling;
				let head = xsloader.head();
				invokerUrl2CssNodes[invokerUrl].last = dom;
				head.insertBefore(dom, nextDom);
			}

		} else {
			xsloader.appendHeadDom(dom);
		}
	}

	let curStyle, curSheet;
	let createStyle = function(invokerUrl, inverse) {
		curStyle = document.createElement('style');
		appendCssDom(curStyle, invokerUrl, inverse);
		curSheet = curStyle.styleSheet || curStyle.sheet;
	};
	let ieCnt = 0;
	let ieLoads = [];
	let ieCurCallback;
	let createIeLoad = function(url, invokerUrl, inverse) {
		curSheet.addImport(url);
		curStyle.onload = function() {
			processIeLoad(invokerUrl, inverse);
		};

		ieCnt++;
		if(ieCnt == 31) {
			createStyle(invokerUrl, inverse);
			ieCnt = 0;
		}
	};
	let processIeLoad = function(invokerUrl, inverse) {
		ieCurCallback();
		let nextLoad = ieLoads.shift();
		if(!nextLoad) {
			ieCurCallback = null;
			return;
		}
		ieCurCallback = nextLoad[1];
		createIeLoad(nextLoad[0], invokerUrl, inverse);
	};
	let importLoad = function(url, callback, invokerUrl, inverse) {
		callback = callback || function() {};
		if(!curSheet || !curSheet.addImport)
			createStyle(invokerUrl, inverse);

		if(curSheet && curSheet.addImport) {
			if(ieCurCallback) {
				ieLoads.push([url, callback]);
			} else {
				createIeLoad(url, invokerUrl, inverse);
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
	let linkLoad = function(url, callback, invokerUrl, inverse) {
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
		appendCssDom(link, invokerUrl, inverse);
	};
	cssAPI.pluginMain = function(cssId, onload, onerror, config) {
		let inverse = !(config.css && config.css.inverse === false); //默认逆向
		//			if(cssId.indexOf(".css") != cssId.length - 4) {
		//				cssId += ".css";
		//			}
		//		console.log("cssId="+cssId+",cssSrc="+this.invoker().getUrl(cssId, true)+",absUrl="+this.invoker().absUrl());
		(useImportLoad ? importLoad : linkLoad)(this.invoker().getUrl(cssId, true), onload, this.invoker().src(), inverse);
	};
	cssAPI.getCacheKey = function(cssId) {
		//			if(cssId.indexOf(".css") != cssId.length - 4) {
		//				cssId += ".css";
		//			}
		let invoker = this.invoker();
		return invoker ? invoker.getUrl(cssId, true) : cssId;
	};
	cssAPI.loadCss = function(cssPath, callback) {
		(useImportLoad ? importLoad : linkLoad)(xsloader.getUrl(cssPath), callback);
	};

	cssAPI.loadCsses = function() {
		let args = arguments;
		for(let i = 0; i < args.length; i++) {
			(useImportLoad ? importLoad : linkLoad)(xsloader.getUrl(args[i]), null);
		}
	};
	return cssAPI;
});
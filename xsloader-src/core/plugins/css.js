import utils from "../../util/index.js";
import script from "../script.js";
const global = utils.global;
const xsloader = global.xsloader;

/*
 * Require-CSS RequireJS css! loader plugin
 * 0.1.8
 * Guy Bedford 2014
 * MIT
 */
xsloader.define("css", function() {

	let lastDom; //始终执行最后一个style（inverse处理的）
	//层级之间，越顶层的、越在后面；同级之间，索引越大的、越在后面
	class Node {
		parent;
		children = {};
		_maxindex = -1;
		_minindex;
		doms = {}; //index:dom
		src;
		constructor(src) {
			this.src = src;
		}

		addChild(src, node) {
			this.children[src] = node;
			node.parent = this;
		}
		getChild(src) {
			return this.children[src];
		}

		/**
		 * 将添加到返回节点之前
		 */
		findAnchor(index, dom) {
			if(dom) {
				this.doms[index] = dom;
			}

			let anchorDom;
			if(this._maxindex == -1) {
				this._maxindex = index;
				this._minindex = index;
				//层级之间,反向添加
				let p = this.parent;
				while(p) {
					if(p._maxindex == -1) {
						p = p.parent;
					} else {
						anchorDom = p.doms[p._minindex];
						break;
					}
				}
			} else {
				//同级之间、按照索引大小顺序添加
				if(index > this._maxindex) {
					anchorDom = this.doms[this._maxindex].nextSibling;
					this._maxindex = index;
				} else {
					if(this._minindex > index) {
						this._minindex = index;
					}
					for(let i = index + 1; i < this._maxindex; i++) {
						if(this.doms[i]) {
							anchorDom = this.doms[i];
							break;
						}
					}
				}
			}

			if(!anchorDom) {
				anchorDom = lastDom ? lastDom.nextSibling : xsloader.script().nextSibling;
			}

			return anchorDom;
		}
	}

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

	let cssIndex = 0;
	//src:Node
	const rootNodes = {};

	function domIndex(dom) {
		let index = 0;
		while((dom = dom.previousSibling)) {
			index++;
		}
		return index;
	}

	function buildAndGetNode(mthiz) {
		let src = mthiz.src();
		let p = mthiz.invoker();

		while(p && p.src() == src) {
			p = p.invoker();
		}

		if(p) {
			let pnode = buildAndGetNode(p);
			let node = pnode.getChild(src);
			if(!node) {
				node = new Node(src);
				pnode.addChild(src, node);
			}
			return node;
		} else {
			//root
			if(!rootNodes[src]) {
				rootNodes[src] = new Node(src);
			}
			return rootNodes[src];
		}
	}

	function appendCssDom(dom, cssThis, inverse) {
		if(cssThis && inverse) {
			let mthis = cssThis.invoker();
			let node = buildAndGetNode(mthis);
			dom.setAttribute("data-insert-index", cssIndex++);
			let index = cssThis.getIndex();
			let nextDom = node.findAnchor(index, dom);
			script.head().insertBefore(dom, nextDom);

			if(!lastDom || domIndex(dom) > domIndex(lastDom)) {
				lastDom = dom;
			}
		} else {
			xsloader.appendHeadDom(dom);
		}

	}

	let curStyle, curSheet;
	let createStyle = function(mthis, inverse) {
		curStyle = document.createElement('style');
		appendCssDom(curStyle, mthis, inverse);
		curSheet = curStyle.styleSheet || curStyle.sheet;
	};
	let ieCnt = 0;
	let ieLoads = [];
	let ieCurCallback;
	let createIeLoad = function(url, mthis, inverse) {
		curSheet.addImport(url);
		curStyle.onload = function() {
			processIeLoad(mthis, inverse);
		};

		ieCnt++;
		if(ieCnt == 31) {
			createStyle(mthis, inverse);
			ieCnt = 0;
		}
	};
	let processIeLoad = function(mthis, inverse) {
		ieCurCallback();
		let nextLoad = ieLoads.shift();
		if(!nextLoad) {
			ieCurCallback = null;
			return;
		}
		ieCurCallback = nextLoad[1];
		createIeLoad(nextLoad[0], mthis, inverse);
	};
	let importLoad = function(url, callback, mthis, inverse) {
		callback = callback || function() {};
		if(!curSheet || !curSheet.addImport)
			createStyle(mthis, inverse);

		if(curSheet && curSheet.addImport) {
			if(ieCurCallback) {
				ieLoads.push([url, callback]);
			} else {
				createIeLoad(url, mthis, inverse);
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
	let linkLoad = function(url, callback, mthis, inverse) {
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
		appendCssDom(link, mthis, inverse);
	};
	cssAPI.pluginMain = function(cssId, onload, onerror, config) {
		let inverse = !(config.css && config.css.inverse === false); //默认逆向
		//			if(cssId.indexOf(".css") != cssId.length - 4) {
		//				cssId += ".css";
		//			}
		//		console.log("cssId="+cssId+",cssSrc="+this.invoker().getUrl(cssId, true)+",absUrl="+this.invoker().absUrl());
		(useImportLoad ? importLoad : linkLoad)(this.invoker().getUrl(cssId, true), onload, this, inverse);
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
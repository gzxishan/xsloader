import utils from "../../util/index.js";
const global = utils.global;
const xsloader = global.xsloader;

xsloader.define("xsloader4j-server-bridge", [], function() {
	const base64 = new xsloader.Base64();
	let isDebug = false;

	/**
	 * 用于支持jsx代码
	 * @param {Object} vm
	 */
	function __renderJsx(vm) {
		return function(component, props /*, ...children*/ ) {
			if(!vm || !vm.$createElement) {
				let Vue = xsloader.require.get("vue");
				vm = new Vue();
			}
			let $createElement = vm.$createElement;
			if(!$createElement) {
				throw new Error("not found function '$createElement'");
			}
			let children = [];
			for(let i = 2; i < arguments.length; i++) {
				children.push(arguments[i]);
			}
			return $createElement(component, props, children);
		};
	}

	const mod = {
		getDefine(thiz) {
			return thiz.define;
		},
		getRequire(thiz) {
			return thiz.require;
		},
		getInvoker(thiz) {
			return thiz.invoker();
		},
		renderJsx(vm) {
			return __renderJsx(vm);
		},
		getVueCompiler(thiz) {
			let rt = function(exports) {
				let Vue = xsloader.require.get("vue");
				let _default = exports['default'] || exports;
				if(_default.template) {

					//处理src,href,url(...)
					let dealUrl = function(reg, group, str, appendArgs, fun) {
						fun = fun || function(regResult, url) {
							return url;
						};

						let result = "";
						while(true) {
							let rs = reg.exec(str);
							if(!rs) {
								result += str;
								break;
							} else {
								let rurl = rs[group].trim();

								result += str.substring(0, rs.index);
								if(xsloader.startsWith(rurl, "url(")) {
									result += rs[0];
								} else {
									result += fun(rs, thiz.getUrl(rurl, appendArgs));
								}
								str = str.substring(rs.index + rs[0].length);
							}
						}
						return result;
					};

					//排除掉':src'等属性
					_default.template = dealUrl(/(^|\s)(src|href)\s*=\s*('|")([^'"\(\)]+)('|")/, 4, _default.template, false, function(regResult, url) {
						return regResult[2] + "=" + regResult[3] + url + regResult[5];
					});
					_default.template = dealUrl(/(^|\s)url\(([^\(\)]+)\)/, 2, _default.template, true); //后处理url，src与href中可能包含url(...)
					let res;
					try {
						if(isDebug) {
							console.log("compile vue template content,url=", thiz.getUrl());
						}
						res = Vue.compile(_default.template); //用template有bug，根元素有多个时出现死循环
					} catch(e) {
						console.error("url=", thiz.getUrl());
						throw e;
					}
					_default.render = res.render;
					_default.staticRenderFns = res.staticRenderFns;
				}
				delete _default.template;
			};
			return rt;
		},
		getVtemplate(thiz) {
			let vtemplate = (component) => {
				return(resolve, reject) => {
					let invoker = thiz.invoker();
					thiz.require([component], (comp) => {
						resolve(comp);
					}).error((err) => {
						reject(err.err);
					});
				}
			};
			return vtemplate;
		},
		getImporter(thiz) {
			let vtemplate = this.getVtemplate(thiz);
			return function(name) {
				return new Promise(vtemplate(name));
			};
		},
		getStyleBuilder(thiz) {
			return function(cssContent) {
				if(cssContent) {
					let id = xsloader.randId();
					let count = 0;
					let styleDom = document.createElement("style");
					styleDom.setAttribute("id", id);
					styleDom.setAttribute("type", "text/css");
					styleDom.innerHTML = cssContent;

					let obj = {
						init() {
							if(count <= 0) {
								xsloader.appendHeadDom(styleDom);
							}
							count++;
							return {
								destroy() {
									if(--count <= 0) {
										let element = document.getElementById(id);
										if(element) {
											element.parentNode.removeChild(element);
										}
									}
								}
							};
						}

					};
					return obj;
				}
			};
		},
		decodeBase64(base64Content) {
			if(base64Content) {
				return base64.decode(base64Content);
			}
		}

	};

	return mod;
});
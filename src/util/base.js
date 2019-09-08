import global from './global.js';
const xsloader = global.xsloader;
const commentRegExp = /\/\*[\s\S]*?\*\/|([^:"'=]|^)\/\/.*$/mg;
const cjsRequireRegExp = /[^.]require\s*\(\s*["']([^'"\r\n]+)["']\s*\)/g;

//基于有向图进行循环依赖检测
function GraphPath() {
	let pathEdges = {};
	let vertexMap = {};
	let depMap = {};
	this.addEdge = function(begin, end) {
		depMap[begin + "|" + end] = true;
		if(!pathEdges[begin]) {
			pathEdges[begin] = [];
		}
		if(!vertexMap[begin]) {
			vertexMap[begin] = true;
		}
		if(!vertexMap[end]) {
			vertexMap[end] = true;
		}
		pathEdges[begin].push({
			begin: begin,
			end: end
		});
	};

	this.hasDep = function(name, dep) {
		return depMap[name + "|" + dep];
	};

	this.tryAddEdge = function(begin, end) {
		this.addEdge(begin, end);
		let paths = this.hasLoop();
		if(paths.length > 0) {
			pathEdges[begin].pop();
		}
		return paths;
	};

	this.hasLoop = function() {
		let visited = {};
		let recursionStack = {};

		for(let x in vertexMap) {
			visited[x] = false;
			recursionStack[x] = false;
		}

		let has = false;
		let paths = [];
		for(let name in vertexMap) {
			paths = [];
			if(checkLoop(name, visited, recursionStack, paths)) {
				has = true;
				break;
			}
		}
		return has ? paths : [];
	};

	function checkLoop(v, visited, recursionStack, paths) {
		if(!visited[v]) {
			visited[v] = true;
			recursionStack[v] = true;
			paths.push(v);

			if(pathEdges[v]) {
				let edges = pathEdges[v];
				for(let i = 0; i < edges.length; i++) {
					let edge = edges[i];
					if(!visited[edge.end] && checkLoop(edge.end, visited, recursionStack, paths)) {
						return true;
					} else if(recursionStack[edge.end]) {
						paths.push(edge.end);
						return true;
					}
				}
			}
		}
		recursionStack[v] = false;
		return false;
	}
}

//使得内部的字符串变成数组
function strValue2Arr(obj) {
	if(!obj || xsloader.isArray(obj)) {
		return;
	}
	for(let x in obj) {
		if(xsloader.isString(obj[x])) {
			obj[x] = [obj[x]];
		}
	}
}

/**
 * 同步模式下，返回false表示终止循环。
 * @param {Object} ary
 * @param {Object} func
 * @param {Object} isSync
 * @param {Object} fromEnd
 */
function each(ary, func, isSync, fromEnd) {
	if(ary) {
		if(isSync) {
			function fun(index) {
				if(fromEnd ? index < 0 : index >= ary.length) {
					return;
				}
				let handle = function(rs) {
					if(rs) {
						return;
					}
					fun(fromEnd ? index - 1 : index + 1);
				};
				func(ary[index], index, ary, handle);
			}
			fun(fromEnd ? ary.length - 1 : 0);
		} else {
			if(fromEnd) {
				for(let i = ary.length - 1; i >= 0; i--) {
					if(func(ary[i], i, ary) === false) {
						break;
					}
				}
			} else {
				for(let i = 0; i < ary.length; i++) {
					if(func(ary[i], i, ary) === false) {
						break;
					}
				}
			}
		}

	}
}

function __commentReplace(match, singlePrefix) {
	return singlePrefix || '';
}
//添加内部直接require('...')的模块
function appendInnerDeps(deps, callback) {
	if(xsloader.isFunction(callback)) {
		callback
			.toString()
			.replace(commentRegExp, __commentReplace)
			.replace(cjsRequireRegExp, function(match, dep) {
				if(xsloader.indexInArray(deps, dep) == -1) {
					deps.push(dep);
				}
			});
	}
}

let idCount = 2019;

function getAndIncIdCount() {
	return idCount++;
}

class PluginError {
	constructor(err, invoker) {
		if(err instanceof PluginError) {
			this.err = err.err;
			this.invoker = err.invoker;
		} else {
			this.err = err;
			this.invoker = invoker;
		}
	}
}

let isXsLoaderEnd = false;
const IE_VERSION = (function getIEVersion() {
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

export default {
	graphPath: new GraphPath(),
	strValue2Arr,
	each,
	appendInnerDeps,
	getAndIncIdCount,
	PluginError,
	loaderEnd() {
		isXsLoaderEnd = true;
	},
	isLoaderEnd() {
		return isXsLoaderEnd;
	},
	IE_VERSION,
};
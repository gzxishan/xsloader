import global from './global.js';
const L = global.xsloader;
const COMMENT_REGEXP = /\/\*[\s\S]*?\*\/|([^:"'=]|^)\/\/.*$/mg;
const REPLACE_REQUIRE_GET_REGEXP = /(^|[\s\(\),;.\?:]+)require\s*\.\s*get\s*\(\s*["']([^'"\r\n]+)["']\s*\)/g;
const REPLACE_REQUIRE_REGEXP = /(^|[\s\(\),;.\?:]+)require\s*\(\s*["']([^'"\r\n]+)["']\s*\)/g;
const NOT_REQUIRE_REGEXP = /\.\s*$/;

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
	if(!obj || L.isArray(obj)) {
		return;
	}
	for(let x in obj) {
		if(L.isString(obj[x])) {
			obj[x] = [obj[x]];
		}
	}
}

/**
 * 同步模式下，返回false表示终止循环。
 * @param {Object} ary
 * @param {Object} func(item,index,array)
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

function __appendInnerDeps(deps, callbackString, reg, depIndex, notIndex) {
	callbackString.replace(reg, function() {
		let dep = arguments[depIndex];
		if((!notIndex || !NOT_REQUIRE_REGEXP.test(arguments[notIndex])) && L.indexInArray(deps, dep) == -1) {
			deps.push(dep);
		}
	});
}

//添加内部直接require.get('...')或require('...')的模块
function appendInnerDeps(deps, callback) {
	if(L.isFunction(callback)) {
		let theConfig = L.config();
		let innerDepType = !theConfig ? "disable" : theConfig.props.innerDepType;
		if(innerDepType != "disable") {

			const callbackString = callback
				.toString()
				.replace(COMMENT_REGEXP, __commentReplace);

			if(innerDepType == "auto") {
				if(callbackString.indexOf("__webpack_require__") >= 0) {
					innerDepType = "disable";
				}
			}

			if(innerDepType == "auto") {
				__appendInnerDeps(deps, callbackString, REPLACE_REQUIRE_REGEXP, 2, 1);
				__appendInnerDeps(deps, callbackString, REPLACE_REQUIRE_GET_REGEXP, 2, 1);
			} else if(innerDepType == "require") {
				__appendInnerDeps(deps, callbackString, REPLACE_REQUIRE_REGEXP, 2, 1);
			} else if(innerDepType == "require.get") {
				__appendInnerDeps(deps, callbackString, REPLACE_REQUIRE_GET_REGEXP, 2, 1);
			}

		}

	}
}

let idCount = 2019;

function getAndIncIdCount() {
	return idCount++;
}

class PluginError {
	constructor(err, invoker, extra) {
		this.err = err;
		this.invoker = invoker;
		this.extra = extra;
	}
}

function unwrapError(err) {
	if(err) {
		let n = 0;
		while(err instanceof PluginError && n++ < 100) {
			err = err.err;
		}
	}
	return err;
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

function isEmptyObject(obj){
	if(obj===null||obj===undefined){
		return true;
	}else if(!L.isObject(obj)){
		throw new Error("expected object:"+obj);
	}else{
		for(let k in obj){
			return false;
		}
		return true;
	}
}

export default {
	graphPath: new GraphPath(),
	strValue2Arr,
	each,
	appendInnerDeps,
	getAndIncIdCount,
	PluginError,
	unwrapError,
	loaderEnd() {
		isXsLoaderEnd = true;
	},
	isLoaderEnd() {
		return isXsLoaderEnd;
	},
	IE_VERSION,
	isEmptyObject,
};
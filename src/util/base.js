import global from './global.js';
const xsloader = global.xsloader;

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
					if(func(ary[i], i, ary)) {
						break;
					}
				}
			} else {
				for(let i = 0; i < ary.length; i++) {
					if(func(ary[i], i, ary)) {
						break;
					}
				}
			}
		}

	}
}

export default {
	graphPath:new GraphPath(),
	strValue2Arr,
	each
};
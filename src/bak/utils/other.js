function tryCall(fun, defaultReturn, thiz, exCallback) {
	let rs;
	try {
		thiz = thiz === undefined ? this : thiz;
		rs = fun.call(thiz);
	} catch(e) {
		if(exCallback) {
			exCallback(e);
		} else {
			console.log(e);
		}
	}
	if(rs === undefined || rs === null) {
		rs = defaultReturn;
	}
	return rs;
};

function extend(target) {
	for(let i = 1; i < arguments.length; i++) {
		let obj = arguments[i];
		if(!obj) {
			continue;
		}
		for(let x in obj) {
			let value = obj[x];
			if(value === undefined) {
				continue;
			}
			target[x] = obj[x];
		}
	}
	return target;
}

function extendDeep(target) {
	if(!target) {
		return target;
	}
	for(let i = 1; i < arguments.length; i++) {
		let obj = arguments[i];
		if(!obj) {
			continue;
		}

		for(let x in obj) {
			let value = obj[x];
			if(value === undefined) {
				continue;
			}
			if(isObject(value) && isObject(target[x])) {
				target[x] = extendDeep(target[x], value);
			} else {
				target[x] = obj[x];
			}
		}
	}
	return target;
}

const setTimeout = window.setTimeout;

function AsyncCall(useTimer) {
	let thiz = this;
	let count = 0;
	let ctrlCallbackMap = {};

	function initCtrlCallback(callbackObj) {
		let mineCount = count + "";
		if(!ctrlCallbackMap[mineCount]) {
			let ctrlCallback = function() {
				count++;
				let asyncCallQueue = ctrlCallbackMap[mineCount];
				delete ctrlCallbackMap[mineCount];
				while(asyncCallQueue.length) {
					let callbackObj = asyncCallQueue.shift();
					let lastReturn = undefined;
					try {
						if(callbackObj.callback) {
							lastReturn = callbackObj.callback.call(callbackObj.handle, callbackObj.obj, mineCount);
						}
					} catch(e) {
						console.error(e);
					}
					let handle;
					while(callbackObj.nextCallback.length) {
						let nextObj = callbackObj.nextCallback.shift();
						if(!handle) {
							handle = thiz.pushTask(nextObj.callback, lastReturn);
						} else {
							handle.next(nextObj.callback);
						}
					}
				}
			};
			ctrlCallbackMap[mineCount] = [];
			if(!useTimer && global.Promise && global.Promise.resolve) {
				global.Promise.resolve().then(ctrlCallback);
			} else {
				setTimeout(ctrlCallback, 0);
			}
		}
		let queue = ctrlCallbackMap[mineCount];
		queue.push(callbackObj);
	}

	this.pushTask = function(callback, obj) {
		let callbackObj;
		let handle = {
			next: function(nextCallback, lastReturn) {
				callbackObj.nextCallback.push({
					callback: nextCallback,
					lastReturn: lastReturn
				});
				return this;
			}
		};
		callbackObj = {
			callback: callback,
			obj: obj,
			nextCallback: [],
			handle: handle
		};

		initCtrlCallback(callbackObj);

		return handle;
	};
}

let theAsyncCall = new AsyncCall();
let theAsyncCallOfTimer = new AsyncCall(true);

let asyncCall = function(callback, useTimer) {
	if(useTimer) {
		return theAsyncCallOfTimer.pushTask(callback);
	} else {
		return theAsyncCall.pushTask(callback);
	}
};

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

//基于有向图进行循环依赖检测
function GraphPath() {
	var pathEdges = {};
	var vertexMap = {};
	var depMap = {};
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
		var paths = this.hasLoop();
		if(paths.length > 0) {
			pathEdges[begin].pop();
		}
		return paths;
	};

	this.hasLoop = function() {
		var visited = {};
		var recursionStack = {};

		for(var x in vertexMap) {
			visited[x] = false;
			recursionStack[x] = false;
		}

		var has = false;
		var paths = [];
		for(var name in vertexMap) {
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
				var edges = pathEdges[v];
				for(var i = 0; i < edges.length; i++) {
					var edge = edges[i];
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
};
let graphPath = new GraphPath(); //用于检测循环依赖

let randId = (() => {
	let idCount = 2019;
	const T = 3600 * 1000 * 24 * 30;
	//生成一个随机的id，只保证在本页面是唯一的
	return(suffix) => {
		let id = "i" + parseInt(new Date().getTime() % T) + "_" + parseInt(Math.random() * 100) + "_" + (idCount++);
		if(suffix !== undefined) {
			id += suffix;
		}
		return id;
	}
})()

export {
	setTimeout,
	tryCall,
	extend,
	extendDeep,
	asyncCall,
	each,
	graphPath,
	randId,
}
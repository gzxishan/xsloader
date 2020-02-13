let G;
if(typeof window !== undefined) {
	G = window;
} else if(typeof self !== undefined) {
	G = self;
} else if(typeof global !== undefined) {
	G = global;
} else {
	throw new Error("not found global var!");
}

/**
 * 用于包装变量，防止JSON.stringify等时输出指定变量。
 * @param {Object} val
 */
function InVar(val) {
	this.get = function() {
		return val;
	};

	this.set = function(newVal) {
		let old = val;
		val = newVal;
		return old;
	};
}
G.InVar = InVar;

export default G;
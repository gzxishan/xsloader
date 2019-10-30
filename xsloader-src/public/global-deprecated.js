import utils from "../util/index.js";

const global = utils.global;
const xsloader = global.xsloader;

//ie9
try {
	if(Function.prototype.bind && console && (typeof console['log'] == "object")) {
		utils.each(["log", "info", "warn", "error", "assert", "dir", "clear", "profile", "profileEnd"], (method) => {
			let thiz = Function.prototype.bind;
			console[method] = thiz.call(console[method], console);
		});
	}
} catch(e) {
	global.console = {
		log: function() {},
		error: function() {},
		warn: function() {}
	};
}

try {

	if(!Array.prototype.indexOf) {
		Array.prototype.indexOf = function(elem, offset) {
			for(let i = offset === undefined ? 0 : offset; i < this.length; i++) {
				if(this[i] == elem) {
					return i;
				}
			}
			return -1;
		};
	}

	if(!Array.pushAll) {
		Array.pushAll = function(thiz, arr) {
			if(!xsloader.isArray(arr)) {
				throw new Error("not array:" + arr);
			}
			for(let i = 0; i < arr.length; i++) {
				thiz.push(arr[i]);
			}
			return thiz;
		};
	}
} catch(e) {
	console.error(e);
}

function startsWith(str, starts) {
	if(!(typeof str == "string")) {
		return false;
	}
	return str.indexOf(starts) == 0;
}

function endsWith(str, ends) {
	if(!(typeof str == "string")) {
		return false;
	}
	let index = str.lastIndexOf(ends);
	if(index >= 0 && (str.length - ends.length == index)) {
		return true;
	} else {
		return false;
	}
}

function _indexInArray(array, ele, offset = 0, compare) {
	let index = -1;
	if(array) {
		for(let i = offset || 0; i < array.length; i++) {
			if(compare) {
				if(compare(array[i], ele, i, array)) {
					index = i;
					break;
				}
			} else {
				if(array[i] == ele) {
					index = i;
					break;
				}
			}

		}
	}
	return index;
}

function indexInArray(array, ele, compare) {
	return _indexInArray(array, ele, 0, compare);
}

function indexInArrayFrom(array, ele, offset, compare) {
	return _indexInArray(array, ele, offset, compare);
}

export default {
	startsWith,
	endsWith,
	indexInArray,
	indexInArrayFrom
};
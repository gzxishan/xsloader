const ostring = Object.prototype.toString;

function isArray(it) {
	return it && (it instanceof Array) || ostring.call(it) === '[object Array]';
}

function isFunction(it) {
	return it && (typeof it == "function") || ostring.call(it) === '[object Function]';
}

function isObject(it) {
	if(it === null || it === undefined) {
		return false;
	}
	return(typeof it == "object") || ostring.call(it) === '[object Object]';
}

function isString(it) {
	return it && (typeof it == "string") || ostring.call(it) === '[object String]';
}

function isDate(it) {
	return it && (it instanceof Date) || ostring.call(it) === '[object Date]';
}

function isRegExp(it) {
	return it && (it instanceof RegExp) || ostring.call(it) === '[object RegExp]';
}

function isEmpty(it) {
	return it === null || it === undefined || it === "";
}

export default {
	isArray,
	isFunction,
	isObject,
	isString,
	isDate,
	isRegExp,
	isEmpty,
};
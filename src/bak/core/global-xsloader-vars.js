import {
	setTimeout,
	scripts,
	IE_VERSION,
	global,
	tglobal,
	xsJSON,
	getNodeAbsolutePath,
	getPathWithRelative,
	dealPathMayAbsolute,
	appendArgs2Url,
} from '../utils.js';

const globalVars = {};

globalVars.randId = tglobal.randId || (() => {
	let idCount = 1991;
	const T = 3600 * 1000 * 24 * 30;
	//生成一个随机的id，只保证在本页面是唯一的
	return(suffix) => {
		let id = "i" + parseInt(new Date().getTime() % T) + "_" + parseInt(Math.random() * 100) + "_" + (idCount++);
		if(suffix !== undefined) {
			id += suffix;
		}
		return id;
	}
})();

globalVars.startsWith = (str, starts) => {
	if(!(typeof str == "string")) {
		return false;
	}
	return str.indexOf(starts) == 0;
};
globalVars.endsWith = (str, ends) => {
	if(!(typeof str == "string")) {
		return false;
	}
	let index = str.lastIndexOf(ends);
	if(index >= 0 && (str.length - ends.length == index)) {
		return true;
	} else {
		return false;
	}
};
globalVars.xsEval = (scriptString) => {
	try {
		let rs = IE_VERSION > 0 && IE_VERSION < 9 ? eval("[" + scriptString + "][0]") : eval("(" + scriptString + ")");
		return rs;
	} catch(e) {
		throw e;
	}
};

globalVars.xsParseJson = (str, option) => {
	if(str === "" || str === null || str === undefined || !isString(str)) {
		return str;
	}

	option = xsloader.extend({
		fnStart: "", //"/*{f}*/",
		fnEnd: "", //"/*{f}*/",
		rcomment: "\\/\\/#\\/\\/"
	}, option);

	let fnMap = {};
	let fnOffset = 0;
	let replacer = undefined;
	if(option.fnStart && option.fnEnd) {
		while(true) {
			let indexStart = str.indexOf(option.fnStart, fnOffset);
			let indexEnd = str.indexOf(option.fnEnd, indexStart == -1 ? fnOffset : indexStart + option.fnStart.length);
			if(indexStart == -1 && indexEnd == -1) {
				break;
			} else if(indexStart == -1) {
				console.warn("found end:" + option.fnEnd + ",may lack start:" + option.fnStart);
				break;
			} else if(indexEnd == -1) {
				console.warn("found start:" + option.fnStart + ",may lack end:" + option.fnEnd);
				break;
			}
			let fnId = "_[_" + randId() + "_]_";
			let fnStr = str.substring(indexStart + option.fnStart.length, indexEnd).trim();
			if(!_startsWith(fnStr, "function(")) {
				throw "not a function:" + fnStr;
			}
			try {
				str = str.substring(0, indexStart) + '"' + fnId + '"' + str.substring(indexEnd + option.fnEnd.length);
				let fn = xsEval(fnStr);
				fnMap[fnId] = fn;
			} catch(e) {
				console.error(fnStr);
				throw e;
			}
			fnOffset = indexStart + fnId.length;
		}
		replacer = function(key, val) {
			if(isString(val) && fnMap[val]) {
				return fnMap[val];
			} else {
				return val;
			}
		};
	}

	if(option.rcomment) {
		str = str.replace(/(\r\n)|\r/g, "\n"); //统一换行符号
		str = str.replace(new RegExp(option.rcomment + "[^\\n]*(\\n|$)", "g"), ""); //去除行注释
	}

	try {
		let jsonObj = xsJSON;
		return jsonObj.parse(str, replacer);
	} catch(e) {
		try {
			let reg = new RegExp('position[\\s]*([0-9]+)[\\s]*$')
			if(e.message && reg.test(e.message)) {
				let posStr = e.message.substring(e.message.lastIndexOf("position") + 8);
				let pos = parseInt(posStr.trim());
				let _str = str.substring(pos);
				console.error(e.message + ":" + _str.substring(0, _str.length > 100 ? 100 : _str.length));
			}
		} catch(e) {}
		throw e;
	}
};
globalVars.xsJson2String = (obj) => {
	let jsonObj = xsJSON;
	return jsonObj.stringify(obj);
};

const indexInArray = (array, ele, offset, compare) => {
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
};
globalVars.indexInArrayFrom = indexInArray;
/**
 * function(array,ele,compare):得到ele在array中的位置，若array为空或没有找到返回-1；compare(arrayEle,ele)可选函数，默认为==比较.
 */
globalVars.indexInArray = (array, ele, compare) => {
	return indexInArray(array, ele, 0, compare);
};

/**
 * function(path,relative,isPathDir):相对于path，获取relative的绝对路径
 */
globalVars.getPathWithRelative = (path, relative, isPathDir) => {
	let pathQuery = "";
	let relativeQuery = "";
	let qIndex = path.lastIndexOf("?");
	if(qIndex >= 0) {
		pathQuery = path.substring(qIndex);
		path = path.substring(0, qIndex);
	} else {
		qIndex = path.lastIndexOf("#");
		if(qIndex >= 0) {
			pathQuery = path.substring(qIndex);
			path = path.substring(0, qIndex);
		}
	}

	qIndex = relative.lastIndexOf("?");
	if(qIndex >= 0) {
		relativeQuery = relative.substring(qIndex);
		relative = relative.substring(0, qIndex);
	} else {
		qIndex = relative.lastIndexOf("#");
		if(qIndex >= 0) {
			relativeQuery = relative.substring(qIndex);
			relative = relative.substring(0, qIndex);
		}
	}

	let absolute = dealPathMayAbsolute(relative);
	if(absolute.absolute) {
		return absolute.path + relativeQuery;
	}

	if(isPathDir === undefined) {
		let index = path.lastIndexOf("/");
		if(index == path.length - 1) {
			isPathDir = true;
		} else {
			if(index == -1) {
				index = 0;
			} else {
				index++;
			}
			isPathDir = path.indexOf(".", index) == -1;
		}
	}

	if(path.endsWith("/")) {
		path = path.substring(0, path.length - 1);
	}

	let isRelativeDir = false;
	if(relative == "." || relative.endsWith("/")) {
		relative = relative.substring(0, relative.length - 1);
		isRelativeDir = true;
	} else if(relative == "." || relative == ".." || relative.endsWith("/.") || relative.endsWith("/..")) {
		isRelativeDir = true;
	}

	let prefix = "";
	let index = -1;
	let absolute2 = dealPathMayAbsolute(path);
	if(absolute2.absolute) {
		path = absolute2.path;
		let index2 = path.indexOf("//");
		index = path.indexOf("/", index2 + 2);
		if(index == -1) {
			index = path.length;
		}
	}

	prefix = path.substring(0, index + 1);
	path = path.substring(index + 1);

	let stack = path.split("/");
	if(!isPathDir && stack.length > 0) {
		stack.pop();
	}
	let relatives = relative.split("/");
	for(let i = 0; i < relatives.length; i++) {
		let str = relatives[i];
		if(".." == str) {
			if(stack.length == 0) {
				throw new Error("no more upper path!");
			}
			stack.pop();
		} else if("." != str) {
			stack.push(str);
		}
	}
	if(stack.length == 0) {
		return "";
	}
	let result = prefix + stack.join("/");
	if(isRelativeDir && !result.endsWith("/")) {
		result += "/";
	}
	//		result += pathQuery;
	result = appendArgs2Url(result, relativeQuery);
	return result;
};

for(let v in globalVars) {
	global[v] = globalVars[v];
}
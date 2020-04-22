const ABSOLUTE_PROTOCOL_REG = /^(([a-zA-Z0-9_]*:\/\/)|(\/)|(\/\/))/;
const ABSOLUTE_PROTOCOL_REG2 = /^([a-zA-Z0-9_]+:)\/\/([^/\s]+)/;
const defaultJsExts = [".js", ".js+", ".js++", ".es", "es6", ".jsx", ".vue",".*"];

import global from './global.js';
const L = global.xsloader;

function isJsFile(path) {
	if(!L.isString(path) || path.indexOf(".") == -1) {
		return false;
	}
	let pluginIndex = path.indexOf("!");
	if(pluginIndex > 0) {
		path = path.substring(0, pluginIndex);
	}
	let index = path.indexOf("?");
	if(index > 0) {
		path = path.substring(0, index);
	}
	index = path.indexOf("#");
	if(index > 0) {
		path = path.substring(0, index);
	}
	let theConfig = L.config();

	let jsExts = theConfig && theConfig.jsExts || defaultJsExts;
	for(let i = 0; i < jsExts.length; i++) {
		if(L.endsWith(path, jsExts[i])) {
			return {
				ext: jsExts[i],
				path: path
			};
		}
	}
	return false;
}

function dealPathMayAbsolute(path, currentUrl) {
	currentUrl = currentUrl || location.href;
	let rs = ABSOLUTE_PROTOCOL_REG.exec(path);

	let finalPath;
	let absolute;
	if(rs) {
		let protocol = rs[1];
		absolute = true;

		rs = ABSOLUTE_PROTOCOL_REG2.exec(currentUrl);
		let _protocol = rs && rs[1] || location.protocol;
		let _host = rs && rs[2] || location.host;

		if(protocol == "//") {
			finalPath = _protocol + "//" + path;
		} else if(protocol == "/") {
			finalPath = _protocol + "//" + _host + path;
		} else {
			finalPath = path;
		}

	} else {
		absolute = false;
		finalPath = path;
	}
	return {
		absolute: absolute,
		path: finalPath
	};
}

function getPathWithRelative(path, relative, isPathDir) {

	let relativeQuery = "";
	let qIndex = path.lastIndexOf("?");
	if(qIndex >= 0) {
		path = path.substring(0, qIndex);
	} else {
		qIndex = path.lastIndexOf("#");
		if(qIndex >= 0) {
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

	if(L.endsWith(path, "/")) {
		path = path.substring(0, path.length - 1);
	}

	let isRelativeDir = false;
	if(relative == "." || L.endsWith(relative, "/")) {
		relative = relative.substring(0, relative.length - 1);
		isRelativeDir = true;
	} else if(relative == "." || relative == ".." || L.endsWith("/.") || L.endsWith("/..")) {
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
				
				throw new Error("no more upper path:path="+arguments[0]+",relative="+arguments[1]);
			}
			stack.pop();
		} else if("." != str) {
			stack.push(str);
		}
	}
//	if(stack.length == 0) {
//		return "";
//	}
	let result = prefix + stack.join("/");
	if(isRelativeDir && !L.endsWith(result, "/")) {
		result += "/";
	}
	result = L.appendArgs2Url(result, relativeQuery);
	return result;
}

function getNodeAbsolutePath(node) {
	let src = node.src || node.getAttribute("src");
	return getPathWithRelative(location.href, src);
}

//去掉url的query参数和#参数
function removeQueryHash(url) {
	if(url) {
		let index = url.indexOf("?");
		if(index >= 0) {
			url = url.substring(0, index);
		}

		index = url.indexOf("#");
		if(index >= 0) {
			url = url.substring(0, index);
		}
	}
	return url;
}

const REPLACE_STRING_PROPERTIES_EXP = new RegExp("\\$\\{([^\\{]+)\\}");
const ALL_TYPE_PROPERTIES_EXP = new RegExp("^\\$\\[([^\\[\\]]+)\\]$");

function propertiesDeal(configObject, properties) {
	if(!properties) {
		return configObject;
	}

	function replaceStringProperties(string, properties, property) {
		let rs;
		let str = string;
		rs = ALL_TYPE_PROPERTIES_EXP.exec(str);
		if(rs) {
			let propKey = rs[1];
			let propValue = L.getObjectAttr(properties, propKey);
			if(propValue === undefined) {
				return str;
			} else {
				return propValue;
			}
		}

		let result = "";
		while(true) {
			rs = REPLACE_STRING_PROPERTIES_EXP.exec(str);
			if(!rs) {
				result += str;
				break;
			} else {
				let propKey = rs[1];
				if(property !== undefined && property.propertyKey == propKey) {
					throw new Error("replace property error:propertyKey=" + propKey);
				} else if(property) {
					property.has = true;
				}
				result += str.substring(0, rs.index);
				result += L.getObjectAttr(properties, propKey);
				str = str.substring(rs.index + rs[0].length);
			}
		}
		return result;
	}

	//处理属性引用
	function replaceProperties(obj, property, enableKeyAttr) {
		if(!obj) {
			return obj;
		}
		if(L.isFunction(obj)) {
			return obj;
		} else if(L.isArray(obj)) {
			for(let i = 0; i < obj.length; i++) {
				obj[i] = replaceProperties(obj[i], property, enableKeyAttr);
			}
		} else if(L.isString(obj)) {
			obj = replaceStringProperties(obj, properties, property);
		} else if(L.isObject(obj)) {
			if(property) {
				property.has = false;
			}
			let replaceKeyMap = {};
			for(let x in obj) {
				if(property) {
					property.propertyKey = x;
				}
				obj[x] = replaceProperties(obj[x], property, enableKeyAttr);
				if(enableKeyAttr) {
					let _x = replaceStringProperties(x, properties, property);
					if(_x !== x) {
						replaceKeyMap[x] = _x;
					}
				}
			}
			for(let x in replaceKeyMap) {
				let objx = obj[x];
				delete obj[x];
				obj[replaceKeyMap[x]] = objx;
			}
		}

		return obj;

	}

	if(!properties.__dealt__) {
		let property = {
			has: false
		};

		for(let x in properties) {
			let fun = properties[x];
			if(L.isFunction(fun)) {
				properties[x] = fun.call(properties);
			}
		}
		do {
			replaceProperties(properties, property);
		} while (property.has);
		properties.__dealt__ = true;
	}

	return replaceProperties(configObject, undefined, true);
}

function replaceModulePrefix(config, deps) {

	if(!deps||deps.length==0) {
		return;
	}

	for(let i = 0; i < deps.length; i++) {
		let m = deps[i];
		if(typeof m == "string") {
			let index = m.indexOf("!");
			let pluginParam = index > 0 ? m.substring(index) : "";
			m = index > 0 ? m.substring(0, index) : m;

			index = m.indexOf("?");
			let query = index > 0 ? m.substring(index) : "";
			m = index > 0 ? m.substring(0, index) : m;

			let is = isJsFile(m);
			if(config.autoExt&&/\/[^\/.]+$/.test(m)){//自动后缀，需要后台支持
				deps[i] = m + config.autoExtSuffix + query + pluginParam;
			}
			else if(!is && !/\.[^\/\s]*$/.test(m) && (L.startsWith(m, ".") || dealPathMayAbsolute(m).absolute)) {
				deps[i] = m + ".js" + query + pluginParam;
			}
		}
	}

	if(config.modulePrefixCount) {
		//模块地址的前缀替换
		for(let prefix in config.modulePrefix) {
			let replaceStr = config.modulePrefix[prefix].replace;
			let len = prefix.length;
			for(let i = 0; i < deps.length; i++) {
				let m = deps[i];
				if(typeof m == "string") {
					let pluginIndex = m.indexOf("!");
					let pluginName = null;
					if(pluginIndex >= 0) {
						pluginName = m.substring(0, pluginIndex + 1);
						m = m.substring(pluginIndex + 1);
					}
					if(L.startsWith(m, prefix)) {
						let dep = replaceStr + m.substring(len);
						deps[i] = pluginName ? pluginName + dep : dep;
					}
				}
			}
		}
	}
}

function getScriptBySubname(subname) {
	let ss = document.getElementsByTagName('script');
	if(subname) {
		for(let i = 0; i < ss.length; i++) {
			let script = ss[i];
			let src = script.src;
			src = src.substring(src.lastIndexOf("/"));
			if(src.indexOf(subname) >= 0) {
				return script;
			}
		}
	} else {
		return ss;
	}
}

const thePageUrl = (function() {
	let url = location.href;
	url = removeQueryHash(url);
	return url;
})();

export default {
	getPathWithRelative,
	getNodeAbsolutePath,
	dealPathMayAbsolute,
	removeQueryHash,
	propertiesDeal,
	replaceModulePrefix,
	isJsFile,
	getScriptBySubname,
	thePageUrl,
};
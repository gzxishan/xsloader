import utils from "../util/index.js";
////////////////////

import deprecated from './global-deprecated.js';
import base from './global-base.js';
//////////////////
import is from './is.js';
import funs from './funs.js';
import browser from './browser.js';

const global = utils.global;
const xsloader=global.xsloader;

let toGlobal = {
	...deprecated,
	...base
};
for(let k in toGlobal) {
	xsloader[k] = toGlobal[k];
	global[k] = toGlobal[k];
}

let justLoader = {
	...is,
	...funs,
	...browser,
	_ignoreAspect_: {

	}
};
for(let k in justLoader) {
	xsloader[k] = justLoader[k];
}
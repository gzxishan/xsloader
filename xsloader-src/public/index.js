import U from "../util/index.js";
////////////////////

import deprecated from './global-deprecated.js';
import base from './global-base.js';
//////////////////
import is from './is.js';
import funs from './funs.js';
import browser from './browser.js';

const G = U.global;
const L = G.xsloader;

const env = {
	version: ENV_XSLOADER_VERSION
};

let toGlobal = {
	...deprecated,
	...base
};
for(let k in toGlobal) {
	L[k] = toGlobal[k];
	G[k] = toGlobal[k];
}

let justLoader = {
	...is,
	...funs,
	...browser,
	ignoreAspect_: {

	},
	each: U.each,
	Base64: U.base64,
	env,
};
for(let k in justLoader) {
	L[k] = justLoader[k];
}
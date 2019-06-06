import {
	global,
	tglobal,
	globalVars,
	setTimeout,
	randId,
	IE_VERSION
} from './utils';

for(let v in globalVars){
	global[v]=globalVars[v];
}


export let xsloader = function() {

};

global.xsloader = xsloader;
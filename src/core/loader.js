import global from '../util/global.js';
let loaderFun;
let xsloader = global.xsloader = function() {
	return loaderFun.apply(this, arguments);
};

export default {
	loaderFun: (fun) => {
		loaderFun = fun;
	}
};
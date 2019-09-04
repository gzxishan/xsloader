import utils from "../../util/index.js";
const global = utils.global;
const xsloader = global.xsloader;

xsloader.define("xsrequest", ["xshttp"], function(http) {
	/**
	 * 参数列表:
	 * callback:function(rs)
	 * async:始终为true
	 * 其他参数同xshttp
	 * 不断返回then(function()).then,当返回false时取消调用后面的回调。
	 * @param {Object} option
	 */
	let xsRequest = function(option) {
		option = xsloader.extend({
			params: undefined,
			headers: undefined,
			method: undefined,
			url: undefined,
			callback: undefined
		}, option);
		let isResponsed = false;
		let callbacksQueue = [function(rs) {
			return rs;
		}];
		if(option.callback) {
			callbacksQueue.push(option.callback);
		}
		callbacksQueue.callback = function(rs) {
			isResponsed = true;
			for(let i = 0; i < this.length; i++) {
				let callback = this[i];
				rs = callback(rs);
				if(rs === false) {
					return;
				}
			}
		};

		option.ok = function(rs) {
			callbacksQueue.callback(rs);
		};
		option.fail = function(err) {
			callbacksQueue.callback({
				code: -1,
				desc: err
			});
		};
		option.async = true;

		function newHandle() {
			let handle = {
				then: function(callback) {
					if(isResponsed) {
						throw new Error("already responsed!");
					}
					callbacksQueue.push(callback);
					return newHandle();
				}
			};
			return handle;
		}
		http(option).done();
		return newHandle();
	};

	return xsRequest;
});
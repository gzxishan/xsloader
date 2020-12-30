import U from "../../util/index.js";
const L = U.global.xsloader;

/**
 * 返回Request返回一个Promise
 */
L.define("request", ["xshttp"], function(http) {
	/**
	 * 参数列表:
	 * async:始终为true
	 * ok与fail失效
	 * 其他参数同xshttp
	 * 不断返回then(function()).then,当返回false时取消调用后面的回调。
	 * @param {Object} option
	 */
	let Request = function(option) {
		option = L.extend({
			params: undefined,
			headers: undefined,
			method: undefined,
			url: undefined,
			callback: undefined
		}, option);
		option.async = true;

		let promise = new Promise((resolve, reject) => {
			option.ok = function(rs) {
				resolve(rs);
			};
			option.fail = function(err) {
				reject(err);
			};
			http(option).done();
		});

		return promise;
	};

	return Request;
});
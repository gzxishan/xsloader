divLog("--------------moduleB.js");
define(["text!./moduleB.js", "css!./css/css1.css", "css!./css/css2.css"], function(btext) {
	divLog("B:");
	divLog(btext);
	//divLog(this);
	divLog("thisUrl:" + this.getUrl());
	divLog("invoker().getUrl():" + this.invoker().getUrl());
	return {};
});

//define([],{});

define('moduleC', ["exports", "json!./json/json1.json", "json!./json/json2.json", "util/ready.js!"], function(exports, json1, json2) {
	divLog("C:");
	divLog(json1);
	divLog(json2);
	//divLog(this);
	divLog("thisUrl:" + this.getUrl());
	divLog("invoker().getUrl():" + this.invoker().getUrl());
	exports.name = "C";
	exports.test = function() {
		divLog("C.test:this._invoker_.getUrl():" + this._invoker_.getUrl());
	};
});
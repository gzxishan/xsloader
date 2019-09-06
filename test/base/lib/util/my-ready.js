divLog("------------ready-run");
define({
	pluginMain: function(pluginArgs, onload, onerror, config) {
		divLog("ready::::::::");
		divLog("thisUrl:" + this.getUrl());
		divLog("this.invoker().getUrl():" + this.invoker().getUrl());
		setTimeout(function() {
			onload();
		}, 2000);
	}
});
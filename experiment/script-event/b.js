define(function() {
	console.log("this is b.")
	console.log("b.current.src:", currentScript())
	loaderScript("sub/d.js");
})
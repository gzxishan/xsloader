define(function() {
	console.log("this is a.")
	console.log("a.current.src:", currentScript())
	loaderScript("sub/c.js");
})
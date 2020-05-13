window.divLog = function(obj) {
	var div = document.getElementById("logDiv");
	var txt = (typeof obj == "string") && obj || xsJson2String(obj) || "";
	txt = txt.replace(/\\r\\n|\\n/g, "\n");
	txt = txt.replace(/\\t/g, "    ");

	div.innerText = div.innerText + "\n" + txt;
};

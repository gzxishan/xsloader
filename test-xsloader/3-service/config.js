{
	main:{
		after:function(name){
			(window.divLog||console.log)("after:::"+name+",ie="+xsloader.IE_VERSION);
		}
	}
}

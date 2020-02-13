const NODE_ENV = (process.env.NODE_ENV || "").trim();
const isProduct = NODE_ENV == 'production';

module.exports = function(api) {
	api.cache(true);

	const presets = [];

	if(isProduct) {
		presets.push(["minify", {
			"mangle": {
				"topLevel": false,
			},
			"simplify": false,//设置为true有bug:【let result="";while(true){...{break;}...}return result;】result变量被混淆，但仍然return result;导致报错
			"builtIns": false,
			"booleans": false,
			"keepFnName": false,
		}]);
	}

	presets.push([
		"@babel/preset-env",
		{
			"modules": false,
			"targets": {
				"browsers": ["ie>=9"]
			},
			"useBuiltIns": false,
		},
	]);

	const plugins = [
		'@babel/plugin-proposal-object-rest-spread',
		'@babel/plugin-proposal-export-default-from',
		'@babel/plugin-proposal-class-properties',
		//		"transform-es3-property-literals",
		//		"transform-es3-member-expression-literals",
		//		"@babel/plugin-transform-reserved-words"
	];
	return {
		presets,
		plugins,
		shouldPrintComment: (val) => /@preserve|@license|Released under the/i.test(val)
	};
}
const NODE_ENV = (process.env.NODE_ENV || "").trim();
const isProduct = NODE_ENV == 'production';

module.exports = function(api) {
	api.cache(true);

	const presets = [];

	if(isProduct) {
		presets.push(["minify", {
			"mangle": {
				"topLevel": false,
				"exclude":{
					__renderJsx:true
				}
			},
			"simplify": false, //设置为true有bug:【let result="";while(true){...{break;}...}return result;】result变量被混淆，但仍然return result;导致报错
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
		['@babel/plugin-proposal-object-rest-spread'],
		['@babel/plugin-proposal-export-default-from'],
		['@babel/plugin-transform-react-jsx', {
			pragma: "__renderJsx(this)",
			throwIfNamespace: false
		}],
		//		"transform-es3-property-literals",
		//		"transform-es3-member-expression-literals",
		//		"@babel/plugin-transform-reserved-words"，
		["@babel/plugin-proposal-decorators", {
			"legacy": true
		}],
		["@babel/plugin-proposal-class-properties", {
			"loose": true
		}],
		["@babel/plugin-proposal-private-methods", {
		    "loose": true
		}],
		["@babel/plugin-proposal-private-property-in-object", {
		    "loose": true
		}],
		["@babel/plugin-proposal-nullish-coalescing-operator"],
		["@babel/plugin-proposal-optional-chaining"],
		["@babel/plugin-proposal-numeric-separator"],
		["@babel/plugin-proposal-throw-expressions"],
		["@babel/plugin-proposal-logical-assignment-operators"],
		["@babel/plugin-proposal-do-expressions"]
	];
	return {
		presets,
		plugins,
		shouldPrintComment: (val) => /@preserve|@license|Released under the/i.test(val)
	};
}
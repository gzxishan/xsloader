const NODE_ENV = (process.env.NODE_ENV || "").trim();
const isProduct = NODE_ENV == 'production';

module.exports = function(api) {
	api.cache(true);

	const presets = [
		[
			"@babel/preset-env",
			{
				"modules": false,
				"targets": {
					"browsers": ["ie>=9"]
				},
				"useBuiltIns": false,
			},
		],
	];
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
		shouldPrintComment:(val) =>  /@preserve|@license|Released under the/i.test(val)
	};
}
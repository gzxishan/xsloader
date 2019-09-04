module.exports = function(api) {
	api.cache(true);

	const presets = [
		[
			"@babel/env",
			{
				"modules": false,
				"targets": {
					"browsers": ["ie >=9"]
				},
				"useBuiltIns": false,
			},
		],
	];
	const plugins = [
		'@babel/plugin-proposal-object-rest-spread',
		'@babel/plugin-proposal-export-default-from',
		'@babel/plugin-proposal-class-properties'
	];
	return {
		presets,
		plugins
	};
}
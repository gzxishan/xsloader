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
		'@babel/plugin-proposal-object-rest-spread'
	];
	return {
		presets,
		plugins
	};
}
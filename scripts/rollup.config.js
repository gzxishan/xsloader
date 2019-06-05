// Rollup plugins
//import babel from 'rollup-plugin-babel';
//import resolve from 'rollup-plugin-node-resolve';
//import uglify from 'rollup-plugin-uglify';

import { eslint } from 'rollup-plugin-eslint';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

module.exports = {
	input: 'src/main.js',
	output: {
		file: 'dist/xsloader.js',
		format: 'umd',
		name: 'xsloader',
		sourcemap: true,
		exports: "named"
	},
	treeshake: true,
	plugins: [
		resolve({
			browser: true
		}),
		eslint({
			exclude: 'node_modules/**'
		}),
		babel({
			exclude: 'node_modules/**'
		}),
	],
};
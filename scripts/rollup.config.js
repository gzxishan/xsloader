import { uglify } from 'rollup-plugin-uglify';
import { eslint } from 'rollup-plugin-eslint';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import pkg from '../package.json';

const NODE_ENV = (process.env.NODE_ENV || "").trim();
const isProduct = NODE_ENV == 'production';

const banner =
	'/*!\n' +
	` * xsloader.js v${pkg.version}\n` +
	` * home:${pkg.homepage}\n`+
	` * (c) 2018-${new Date().getFullYear()} ${pkg.author}\n` +
	` * Released under the ${pkg.license} License.\n` +
	` * build time:${new Date().toGMTString()}\n`+
	' */'

module.exports = {
	input: 'src/main.js',
	output: {
		banner,
		file: (isProduct ? 'dist/xsloader.min.js' : 'dist/xsloader.js'),
		format: 'iife',
		name: 'xsloaderjs',
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
		(isProduct && uglify()),
	],
};
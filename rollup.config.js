//import { uglify } from 'rollup-plugin-uglify';
import {
	eslint
} from 'rollup-plugin-eslint';
import fs from "fs";
import path from "path";
import babel from 'rollup-plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import pkg from './package.json';
import replace from 'rollup-plugin-replace';

const NODE_ENV = (process.env.NODE_ENV || "").trim();
const isProduct = NODE_ENV == 'production';

const banner =
	'/*!\n' +
	` * xsloader${isProduct?'.min':''}.js v${pkg.version}\n` +
	` * home:${pkg.homepage}\n` +
	` * (c) 2018-${new Date().getFullYear()} ${pkg.author}\n` +
	` * Released under the ${pkg.license} License.\n` +
	` * build time:${new Date().toString()}\n` +
	' */'

const rollupPlugins = [{
		//替换：///#或//#//
		load(id) {
			if(id.indexOf(path.sep+"xsloader-src"+path.sep)>0){
				console.log("load script file:"+id);
				let content = fs.readFileSync(id, 'utf-8');
				content = content.replace(/(^|\n)(\s*)((\/\/#\/\/)|\/\/\/#)/g, "$1$2#");
				return content;
			}
		}
	},
	replace({
		ENV_XSLOADER_VERSION: JSON.stringify(pkg.version),
	}),
	resolve({
		browser: true
	})
];

!isProduct && rollupPlugins.push(eslint({
	exclude: 'node_modules/**'
}));

rollupPlugins.push(babel({
	exclude: 'node_modules/**'
}));

//使用babel-preset-minify，uglify混淆后sourcemap调试不匹配
//isProduct && rollupPlugins.push(uglify({
//	compress: {
//		join_vars: true, //合并连续 var 声明
//		sequences: true, //连续声明变量，用逗号隔开来。
//		conditionals: false, //优化if等判断以及条件选择
//		if_return: false, //优化 if/return 和 if/continue
//		passes: 3
//	},
//	output: {
//		semicolons: false,
//		beautify: false,
//		comments: true //注释的保留已在babel里面进行过滤
//	}
//}));

export default {
	input: 'xsloader-src/main.js',
	output: {
		banner,
		file: (isProduct ? 'dist/xsloader.min.js' : 'dist/xsloader.js'),
		format: 'iife',
		name: 'xsloaderjs',
		sourcemap: true,
		exports: "named"
	},
	treeshake: true,
	plugins: rollupPlugins
};

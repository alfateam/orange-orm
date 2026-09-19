import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';

const { peerDependencies } = require('../package.json');
const runtimePackages = ['@sqlite.org/sqlite-wasm', ...Object.keys(peerDependencies)];

export default [
	newConfig('./src/indexBrowser.mjs', './dist/index.browser.mjs', {
		bundleDependencies: true
	}),
	newConfig('./src/browser/managed-sync-worker.mjs', './dist/managed-sync-worker.mjs', {
		bundleDependencies: true
	}),
	newConfig('./src/browser/sqlite-worker.mjs', './dist/sqlite-worker.mjs'),
	newConfig('./src/browser/sqlite-url-worker.mjs', './dist/sqlite-url-worker.mjs')
];

function newConfig(input, file, options = {}) {
	return {
		input,
		output: {
			file,
			format: 'esm',
			interop: 'auto'
		},
		plugins: [json(), nodeResolve({ preferBuiltins: false }), commonjs({
			transformMixedEsModules: true,
			esmExternals: true,
			requireReturnsDefault: 'preferred'
		})],
		external(id) {
			// SQLite must retain its own import.meta.url so the application build
			// can process its WASM and helper files in the installed package.
			return runtimePackages.some(name => id === name || id.startsWith(name + '/'))
				|| !options.bundleDependencies && id.includes('node_modules');
		},
		onwarn: (warning, warn) => {
			if (warning.code === 'CIRCULAR_DEPENDENCY')
				console.warn(`[CIRCULAR_DEPENDENCY] ${warning.message}`);
			else
				warn(warning);
		}
	};
}

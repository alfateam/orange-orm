import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';

export default [
	newConfig('./src/indexBrowser.js', './dist/index.browser.mjs'),
	newConfig('./src/client/managedSyncWorkerEntry.js', './dist/managed-sync-worker.mjs', {
		bundleDependencies: true
	})
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
			return !options.bundleDependencies && id.includes('node_modules');
		},
		onwarn: (warning, warn) => {
			if (warning.code === 'CIRCULAR_DEPENDENCY')
				console.warn(`[CIRCULAR_DEPENDENCY] ${warning.message}`);
			else
				warn(warning);
		}
	};
}

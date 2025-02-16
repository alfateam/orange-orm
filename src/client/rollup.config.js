import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';

export default {
	input: './src/indexBrowser.js',
	output: {
		file: './src/client/index.mjs',
		format: 'esm',
		interop: 'auto'
	},

	// plugins: [json(), commonjs()],
	plugins: [json(), nodeResolve({ preferBuiltins: false }), commonjs({
		transformMixedEsModules: true,
		esmExternals: true,      // Add this
		requireReturnsDefault: 'preferred'  // Change this
	})],
	external(id) {
		// If it's in node_modules, mark as external
		return id.includes('node_modules');
	},
	onwarn: (warning, warn) => {
		if (warning.code === 'CIRCULAR_DEPENDENCY') {
			// Log the full circular dependency warning message
			console.warn(`[CIRCULAR DEPENDENCY] ${warning.message}`);
		} else {
			// For all other warnings, use Rollup's default handler.
			warn(warning);
		}
	},
};
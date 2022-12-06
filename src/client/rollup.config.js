import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';

export default {
	input: './src/client/index.js',
	output: {
		file: './src/client/index.mjs',
		format: 'esm'
	},
	plugins: [commonjs(), nodeResolve({browser: true})],
	external: ['vue']
};
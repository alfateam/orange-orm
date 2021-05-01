import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

export default {
	input: 'index.js',
	output: {
		file: 'rdb.esm.js',
		format: 'esm'
	},
	onwarn: (message, warn) => {
		if (message.code === 'CIRCULAR_DEPENDENCY') return;
		warn(message);
	},
	plugins: [commonjs(), nodeResolve({browser: true, preferBuiltins: true}), json()]
};
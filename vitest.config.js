// vitest.config.js
/** @type {import('vitest').UserConfig} */
module.exports = {
	test: {
		// Copied baseline excludes (since configDefaults is ESM-only)
		exclude: [
			'**/node_modules/**',
			'**/dist/**',
			'**/cypress/**',
			'**/.{idea,git,cache}/**',
			'**/coverage/**',
			'**/*.deno.test.js',
			'**/*.bun.test.js',
		],
		threads: false,
	},
};

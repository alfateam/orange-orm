module.exports = {
	'env': {
		'node': true,
		'es6': true
	},
	'extends': [
		'eslint:recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		// 'plugin:jest/recommended'
	],
	'parserOptions': {
		'sourceType': 'module',
		'ecmaVersion': 2018
	},
	'ignorePatterns': ['*esm.js', '*.ts'],
	'rules': {
		'@typescript-eslint/no-empty-function': 0,
		'@typescript-eslint/no-var-requires': 0,
		'@typescript-eslint/ban-ts-comment': 0,
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': [2, { 'args': 'after-used', 'ignoreRestSiblings': true, 'argsIgnorePattern': '^_' }],
		'indent': ['error', 'tab'],
		// 'linebreak-style': ['error', 'unix'],
		'quotes': ['error', 'single'],
		'semi': ['error', 'always'],
		'no-console': 'off',
		'no-debugger': 'off',
		'no-trailing-spaces': 'error',
		'no-underscore-dangle': 0,
		'space-before-function-paren': ['error', {
			'anonymous': 'never',
			'named': 'never',
			'asyncArrow': 'always'
		}],
		// 'jest/no-disabled-tests': 'warn',
		// 'jest/no-focused-tests': 'error',
		// 'jest/no-identical-title': 'error',
		// 'jest/prefer-to-have-length': 'warn',
		// 'jest/valid-expect': 'error'
	},
	'plugins': [ '@typescript-eslint']
	// 'plugins': ['jest', '@typescript-eslint']
};


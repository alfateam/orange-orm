module.exports = {
	"env": {
		"node": true,
		"es6": true
	},
	"extends": [
		"eslint:recommended"
	],
	"parserOptions": {
		"sourceType": "module",
		"ecmaVersion": 2018
	},
	"rules": {
		"indent": ["error", "tab"],
		"linebreak-style": ["error", "unix"],
		"quotes": ["error", "single"],
		"semi": ["error", "always"],
		"space-before-function-paren": ["error", "never"],
		"no-console": "off",
		"no-debugger": "off",
		"no-trailing-spaces": "error",
		"no-underscore-dangle": 0,
		"no-unused-vars": [2, { "args": "after-used", "ignoreRestSiblings": true,"argsIgnorePattern": "^_"}]
	},
}

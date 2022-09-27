let useHook = require('../useHook');
let cls;


function tryGetSessionContext() {
	if (useHook()) {
		if (!cls)
			cls = require('node-cls');
		let context = cls.getContext('rdb');
		return context && context.rdb;
	}
	else
		return process.domain && process.domain.rdb;
}

module.exports = tryGetSessionContext;
let useHook = require('./useHook');
let cls;


function tryGetSessionContext() {
	if (useHook()) {
		if (!cls)
			cls = require('./node-cls');
		let context = cls.getContext('rdb');
		return context;
	}
	else
		return process.domain;
}

module.exports = tryGetSessionContext;
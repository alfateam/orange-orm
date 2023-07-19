let useHook = require('../useHook');
let cls;

function deleteSessionContext() {
	if (useHook()) {
		if (!cls)
			cls = require('../node-cls');
		let context = cls.get('rdb');
		delete context.rdb;
		if (context.exit)
			cls.exit('rdb');
	}
	else
		delete process.domain.rdb;
}

module.exports = deleteSessionContext;
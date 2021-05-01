let useHook = require('../useHook');
let cls = require('node-cls');

function deleteSessionContext() {
	if (useHook()) {
		let context = cls.get('rdb');
		delete context.rdb;
		if (context.exit)
			cls.exit('rdb');
	}
	else if (process)
		delete process.domain.rdb;
}

module.exports = deleteSessionContext;
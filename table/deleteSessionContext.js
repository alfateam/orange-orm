let useHook = require('../useHook');
let cls = require('../node-cls');

if (useHook)
	module.exports = function () {
		let context = cls.getContext('rdb');
		delete context.rdb;
		if (context.exitContext)
			cls.exitContext('rdb');
	}
else
	module.exports = function () {
		delete process.domain.rdb;
	}
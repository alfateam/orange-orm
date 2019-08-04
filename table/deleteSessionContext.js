let useHook = require('../useHook');
let cls = require('node-cls');

if (useHook)
	module.exports = function() {
		let context = cls.get('rdb');
		delete context.rdb;
		if (context.exit)
			cls.exit('rdb');
	};
else
	module.exports = function() {
		delete process.domain.rdb;
	};
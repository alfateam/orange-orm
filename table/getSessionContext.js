let useHook = require('../useHook');
let cls = require('node-cls');


function getSessionContext() {
	if (useHook())
		return cls.getContext('rdb').rdb;
	else
		return process.domain.rdb;
}

module.exports = getSessionContext;
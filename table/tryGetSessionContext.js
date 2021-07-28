let useHook = require('../useHook');
let cls = require('node-cls');


function tryGetSessionContext() {
	if (useHook()) {

        let context = cls.getContext('rdb');
        return context && context.rdb;
    }
	else
        return process.domain && process.domain.rdb;
}

module.exports = tryGetSessionContext;
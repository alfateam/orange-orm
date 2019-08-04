let useHook = require('../useHook');
let cls = require('node-cls');

if (useHook)
	module.exports = function() {
		return cls.getContext('rdb').rdb;
	};
else
	module.exports =  function() {
		return process.domain.rdb;
	};

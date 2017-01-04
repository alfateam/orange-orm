var newDecodeCore = require('../newDecodeCore');
var cloneDate = require('./cloneDate');

function _new(column) {	
	var decodeCore = newDecodeCore(column);	
	
	return function(value) {
		value = decodeCore(value);
		if (value === null)
			return value;
		return cloneDate(value);
	};
}

module.exports = _new;
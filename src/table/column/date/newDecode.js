var newDecodeCore = require('../newDecodeCore');
var dateToISOString = require('../../../dateToISOString');

function _new(column) {
	var decodeCore = newDecodeCore(column);

	return function(context, value) {
		value = decodeCore(context, value);
		if (value === null)
			return value;
		else if (typeof value === 'string')
			return value.replace(' ', 'T').replace(' ', '');
		return dateToISOString(value);
	};
}

module.exports = _new;
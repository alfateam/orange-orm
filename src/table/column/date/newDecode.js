var newDecodeCore = require('../newDecodeCore');
var dateToISOString = require('../../../dateToISOString');

function _new(column) {
	var decodeCore = newDecodeCore(column);

	return function(context, value) {
		value = decodeCore(context, value);
		if (value === null)
			return value;
		else if (typeof value === 'string') {
			var iso = value.replace(' ', 'T').replace(' ', '');
			return iso.replace(/(T\d{2}:\d{2}:\d{2}(?:\.\d+)?[+-]\d{2})$/, '$1:00');
		}
		return dateToISOString(value);
	};
}

module.exports = _new;

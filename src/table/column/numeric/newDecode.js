var newDecodeCore = require('../newDecodeCore');

function _new(column) {
	var decodeCore = newDecodeCore(column);

	return function(context, value) {
		value = decodeCore(context, value);
		if (value === null)
			return value;
		if (typeof(value) !== 'number')
			return parseFloat(value);
		return value;
	};
}

module.exports = _new;
var newDecodeCore = require('../newDecodeCore');

function _new(column) {
	var decodeCore = newDecodeCore(column);

	return function(value) {
		value = decodeCore(value);
		if (value === null)
			return value;
		else
			return value.toString('base64');
	};
}

module.exports = _new;
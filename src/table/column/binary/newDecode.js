var newDecodeCore = require('../newDecodeCore');

function _new(column) {
	var decodeCore = newDecodeCore(column);

	return function(context, value) {
		value = decodeCore(context, value);
		if (value === null)
			return value;
		else
			return value.toString('base64');
	};
}

module.exports = _new;
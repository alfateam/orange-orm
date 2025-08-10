var newDecodeCore = require('../newDecodeCore');

function _new(column) {
	var decodeCore = newDecodeCore(column);

	return function(context, value) {
		value = decodeCore(context, value);
		if (value === null)
			return value;
		if (typeof(value) === 'string')
			return value;
		if (value.toString)
			return value.toString();
		return value;
	};
}

module.exports = _new;
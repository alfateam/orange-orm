var newDecodeCore = require('../newDecodeCore');
var getSessionSingleton = require('../../getSessionSingleton');

function _new(column) {
	var decodeCore = newDecodeCore(column);

	return function(context, value) {

		var toBase64  = getSessionSingleton(context, 'decodeBinary') || toBase64Default;

		value = decodeCore(context, value);
		if (value === null)
			return value;
		else {
			const ret = toBase64(value);
			return ret;
		}
	};
}

function toBase64Default(buffer) {
	return buffer.toString('base64');

}

module.exports = _new;
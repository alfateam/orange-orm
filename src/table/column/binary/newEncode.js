var purify = require('./purify');
var newParam = require('../../query/newParameterized');

function _new(_column) {

	function encode(_context, value) {
		value = purify(value);
		if (value === null)
			return newParam('null');
		return newParam('?', [Buffer.from(value, 'base64')]);
	}
	encode.unsafe = function(_context, value) {
		value = purify(value);
		if (value === null)
			return 'null';
		return Buffer.from(value, 'base64');
	};

	encode.direct = function(_context, value) {
		return Buffer.from(value, 'base64');
	};

	return encode;
}

module.exports = _new;
var purify = require('./purify');
var newParam = require('../../query/newParameterized');
var getSessionSingleton = require('../../getSessionSingleton');

function _new(_column) {

	function encode(context, value) {
		value = purify(value);
		if (value === null)
			return newParam('null');

		var encodeCore = getSessionSingleton(context, 'encodeBinary') || encodeDefault;
		const enc = encodeCore(value);
		return newParam('?', [enc]);
	}
	encode.unsafe = function(context, value) {
		value = purify(value);
		if (value === null)
			return 'null';
		var encodeCore = getSessionSingleton(context, 'encodeBinary') || encodeDefault;
		return encodeCore(value);
	};

	encode.direct = function(context, value) {
		var encodeCore = getSessionSingleton(context, 'encodeBinary') || encodeDefault;
		return encodeCore(value);
	};

	return encode;
}

function encodeDefault(base64) {
	return Buffer.from(base64, 'base64');
}

module.exports = _new;
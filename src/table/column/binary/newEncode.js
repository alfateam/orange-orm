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
	if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function')
		return Buffer.from(base64, 'base64');
	if (typeof atob !== 'function')
		throw new Error('Binary columns require Buffer or atob support.');
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++)
		bytes[i] = binary.charCodeAt(i);
	return bytes;
}

module.exports = _new;

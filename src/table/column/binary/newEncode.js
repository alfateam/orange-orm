var purify = require('./purify');
var newParam = require('../../query/newParameterized');

function _new(_column) {

	return encode;

	function encode(value) {
		value = purify(value);
		if (value === null)
			return newParam('null');
		return newParam('?', [value]);
	}
}

module.exports = _new;
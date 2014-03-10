var purify = require('./purify');
var newParam = require('../../query/newParameterized');

function _new(column) {
	
	return encode;

	function encode(value) {
		value = purify(value);
		if (value === null)
		 	return newParam('null');
		return newParam("E'\\\\x" + value.toString('hex') + "'");				
	}
}

module.exports = _new;
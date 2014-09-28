var purify = require('./purify');
var newParam = require('../../query/newParameterized');
var getEncodeBuffer = require('../../getSessionSingleton').bind(null,'encodeBuffer');

function _new(column) {
	
	return encode;

	function encode(value) {
		value = purify(value);
		if (value === null)
		 	return newParam('null');
		var encodeBuffer = getEncodeBuffer();
		return newParam(encodeBuffer(value));				
	}
}

module.exports = _new;
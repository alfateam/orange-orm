var purify = require('./purify');
var newParam = require('../../query/newParameterized');
var getSessionSingleton = require('../../getSessionSingleton');
var newEncodeSafe = require('../newEncodeSafe');

function _new(column) {
	

	function encode(value) {
		value = purify(value);
		if (value === null) {
			if (column.dbNull === null)
				return newParam('null');
			return newParam('\'' + column.dbNull + '\'');
		}
		var encodeCore =  getSessionSingleton('encodeBoolean');

		if (value)
			return newParam(encodeCore(true));	
		return newParam(encodeCore(false));	
	}

	encode.safe = newEncodeSafe(column, purify);
	return encode;
}

module.exports = _new;
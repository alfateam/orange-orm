var purify = require('./purify');
var newParam = require('../../query/newParameterized');
var getSessionSingleton = require('../../getSessionSingleton');

function _new(column) {
	
	return encode;

	function encode(value) {
		value = purify(value);
		if (value === null) {
			if (column.dbNull === null)
				return newParam('null');
			return newParam('\'' + column.dbNull + '\'');
		}
		encodeCore = getSessionSingleton = getSessionSingleton('encodeBoolean');

		if (value)
			return newParam(encodeCore(true));	
		return newParam(encodeCore(false));	
	}
}

module.exports = _new;
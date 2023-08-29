var purify = require('./purify');
var newParam = require('../../query/newParameterized');
var getSessionSingleton = require('../../getSessionSingleton');

function _new(column) {

	function encode(value) {
		value = purify(value);
		if (value === null) {
			if (column.dbNull === null)
				return newParam('null');
			return newParam('\'' + column.dbNull + '\'');
		}
		var encodeCore =  getSessionSingleton('encodeBoolean');


		return newParam('?', [encodeCore(value)]);
	}

	return encode;
}

module.exports = _new;
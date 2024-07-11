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
		var encodeCore = getSessionSingleton('encodeBoolean');


		return newParam('?', [encodeCore(value)]);
	}

	encode.unsafe = function(value) {
		value = purify(value);
		if (value === null) {
			if (column.dbNull === null)
				return 'null';
			return '\'' + column.dbNull + '\'';
		}
		var encodeCore = getSessionSingleton('encodeBoolean');


		return encodeCore(value);
	};

	encode.direct = function(value) {
		var encodeCore = getSessionSingleton('encodeBoolean');

		return encodeCore(value);
	};

	return encode;
}

module.exports = _new;
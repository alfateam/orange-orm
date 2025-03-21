var purify = require('./purify');
var newParam = require('../../query/newParameterized');
var getSessionSingleton = require('../../getSessionSingleton');

function _new(column) {

	function encode(context, value) {
		value = purify(value);
		if (value === null) {
			if (column.dbNull === null)
				return newParam('null');
			return newParam('\'' + column.dbNull + '\'');
		}
		var encodeCore = getSessionSingleton(context, 'encodeBoolean');


		return newParam('?', [encodeCore(value)]);
	}

	encode.unsafe = function(context, value) {
		value = purify(value);
		if (value === null) {
			if (column.dbNull === null)
				return 'null';
			return '\'' + column.dbNull + '\'';
		}
		var encodeCore = getSessionSingleton(context, 'encodeBoolean');


		return encodeCore(value);
	};

	encode.direct = function(context, value) {
		var encodeCore = getSessionSingleton(context, 'encodeBoolean');

		return encodeCore(value);
	};

	return encode;
}

module.exports = _new;
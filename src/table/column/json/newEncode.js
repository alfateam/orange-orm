var newPara = require('../../query/newParameterized');
var purify = require('./purify');
var getSessionContext = require('../../getSessionContext');
var getSessionSingleton = require('../../getSessionSingleton');

function _new(column) {

	const encode = function(context, candidate) {
		var value = purify(candidate);
		if (value == null) {
			if(column.dbNull === null)
				return newPara('null');
			return newPara('\'' + column.dbNull + '\'');
		}
		var ctx = getSessionContext(context);
		var encodeCore = getSessionSingleton(context, 'encodeJSON') || ((v) => v);
		var formatIn = ctx.formatJSONIn;
		return newPara(formatIn ? formatIn('?') : '?', [encodeCore(value)]);
	};

	encode.unsafe = function(context, candidate) {
		var value = purify(candidate);
		if (value == null) {
			if(column.dbNull === null)
				return 'null';
			return '\'' + column.dbNull + '\'';
		}
		var encodeCore = getSessionSingleton(context, 'encodeJSON') || ((v) => v);

		if (encodeCore) {
			value = encodeCore(value);
		}
		return value;
	};

	encode.direct = function(context, value) {
		var encodeCore = getSessionSingleton(context, 'encodeJSON') || ((v) => v);

		if (encodeCore) {
			value = encodeCore(value);
		}
		return value;
	};

	return encode;
}

module.exports = _new;
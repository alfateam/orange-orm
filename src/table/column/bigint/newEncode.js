var newPara = require('../../query/newParameterized');
var purify = require('../string/purify');
var getSessionContext = require('../../getSessionContext');
var getSessionSingleton = require('../../getSessionSingleton');

function _new(column) {
	var encode = function(context, value) {
		value = purify(value);
		if (value == null) {
			if (column.dbNull === null)
				return newPara('null');
			return newPara('\'' + column.dbNull + '\'');
		}
		var ctx = getSessionContext(context);
		var encodeCore = ctx.encodeBigint || encodeBigint;
		var formatIn = ctx.formatBigintIn;
		return newPara(formatIn ? formatIn('?') : '?', [encodeCore(value)]);
	};

	encode.unsafe = function(context, value) {
		value = purify(value);
		if (value == null) {
			if (column.dbNull === null)
				'null';
			return '\'' + column.dbNull + '\'';
		}
		var encodeCore = getSessionSingleton(context, 'encodeBigint') || encodeBigint;
		return encodeCore(value);
	};

	encode.direct = function(context, value) {
		var encodeCore = getSessionSingleton(context, 'encodeBigint') || encodeBigint;
		return encodeCore(value);
	};

	return encode;


}
function encodeBigint(value) {
	return value;
}

module.exports = _new;

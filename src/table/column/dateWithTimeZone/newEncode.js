var newPara = require('../../query/newParameterized');
var purify = require('../date/purify');
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
		var encodeCore = ctx.encodeDateTz || ctx.encodeDate || encodeDate;
		return newPara('?', [encodeCore(value)]);
	};

	encode.unsafe = function(context, value) {
		value = purify(value);
		if (value == null) {
			if (column.dbNull === null)
				return 'null';
			return '\'' + column.dbNull + '\'';
		}
		var encodeCore = getSessionSingleton(context, 'encodeDateTz') || getSessionSingleton(context, 'encodeDateTz') || getSessionSingleton(context, 'encodeDate') || encodeDate;
		return encodeCore(value);
	};

	encode.direct = function(context, value) {
		var encodeCore = getSessionSingleton(context, 'encodeDateTz') || getSessionSingleton(context, 'encodeDateTz') || getSessionSingleton(context, 'encodeDate') || encodeDate;
		return encodeCore(value);
	};

	return encode;
}

function encodeDate(date) {
	if (date.toISOString)
		return truncate(date.toISOString());
	return truncate(date);
}

function truncate(date) {
	return date;
}

module.exports = _new;

var newPara = require('../../query/newParameterized');
var purify = require('./purify');
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
		var encodeCore = ctx.encodeDate || encodeDate;
		var formatIn = ctx.formatDateIn;
		return newPara(formatIn ? formatIn('?') : '?', [encodeCore(value)]);
	};

	encode.unsafe = function(context, value) {
		value = purify(value);
		if (value == null) {
			if (column.dbNull === null)
				'null';
			return '\'' + column.dbNull + '\'';
		}
		var encodeCore = getSessionSingleton(context, 'encodeDate') || encodeDate;
		return encodeCore(value);
	};

	encode.direct = function(context, value) {
		var encodeCore = getSessionSingleton(context, 'encodeDate') || encodeDate;
		return encodeCore(value);
	};

	return encode;


}
function encodeDate(date) {
	date = date.toISOString ? removeTimezone(date.toISOString(date)) : removeTimezone(date);
	return date;
}

function removeTimezone(isoString) {
	let dateTimePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?/;
	let match = isoString.match(dateTimePattern);
	return match ? match[0] : isoString;
}


module.exports = _new;

var newPara = require('../../query/newParameterized');
var purify = require('./purify');
var getSessionSingleton = require('../../getSessionSingleton');

function _new(column) {
	var encode = function(value) {
		value = purify(value);
		if (value == null) {
			if (column.dbNull === null)
				return newPara('null');
			return newPara('\'' + column.dbNull + '\'');
		}
		var encodeCore = getSessionSingleton('encodeDate') || encodeDate;
		return newPara('?', [encodeCore(value)]);
	};

	encode.unsafe = function(value) {
		value = purify(value);
		if (value == null) {
			if (column.dbNull === null)
				return newPara('null');
			return newPara('\'' + column.dbNull + '\'');
		}
		var encodeCore = getSessionSingleton('encodeDate') || encodeDate;
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

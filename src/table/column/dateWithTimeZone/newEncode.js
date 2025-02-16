var newPara = require('../../query/newParameterized');
var purify = require('../date/purify');

function _new(column) {
	var encode = function(_context, value) {
		value = purify(value);
		if (value == null) {
			if (column.dbNull === null)
				return newPara('null');
			return newPara('\'' + column.dbNull + '\'');
		}
		return newPara('?', [encodeDate(value)]);
	};

	encode.unsafe = function(_context, value) {
		value = purify(value);
		if (value == null) {
			if (column.dbNull === null)
				return 'null';
			return '\'' + column.dbNull + '\'';
		}
		return encodeDate(value);
	};

	encode.direct = function(_context, value) {
		return encodeDate(value);
	};

	return encode;


}
function encodeDate(date) {
	if (date.toISOString)
		return truncate(date.toISOString(date));
	return truncate(date);
}

function truncate(date) {
	return date;
}


module.exports = _new;

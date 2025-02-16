var newPara = require('../../query/newParameterized');
var purify = require('./purify');

function _new(column) {

	var encode = function(_context, value) {
		value = purify(value);
		if (value == null) {
			if (column.dbNull === null)
				return newPara('null');
			return newPara('\'' + column.dbNull + '\'');
		}
		return newPara('?', [value]);
	};

	encode.unsafe = function(_context, value) {
		value = purify(value);
		if (value == null) {
			if (column.dbNull === null)
				return 'null';
			return '\'' + column.dbNull + '\'';
		}
		return '\'' + value + '\'';
	};

	encode.direct = function(_context, value) {
		return value ;
	};

	return encode;

}

module.exports = _new;
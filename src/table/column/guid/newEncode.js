var newPara = require('../../query/newParameterized');
var purify = require('./purify');

function _new(column) {

	const encode = function(candidate) {
		var value = purify(candidate);
		if (value == null) {
			if (column.dbNull === null)
				return newPara('null');
			return newPara('\'' + column.dbNull + '\'');
		}
		return newPara('\'' + value + '\'');
	};

	encode.unsafe = function(candidate) {
		var value = purify(candidate);
		if (value == null) {
			if (column.dbNull === null)
				return 'null';
			return '\'' + column.dbNull + '\'';
		}
		return '\'' + value + '\'';
	};

	encode.direct = function(value) {
		return value ;
	};


	return encode;
}

module.exports = _new;
var purify = require('./purify');
var newParam = require('../../query/newParameterized');

module.exports = function(column) {

	function encode(value) {
		value = purify(value);
		if (value == null) {
			var dbNull = column.dbNull;
			return newParam('' + dbNull + '');
		}
		return newParam('' + value);
	}

	encode.unsafe = function(value) {
		value = purify(value);
		if (value == null) {
			var dbNull = column.dbNull;
			return '' + dbNull + '';
		}
		return '' + value;
	};

	encode.direct = function(value) {
		value = purify(value);
		if (value == null) {
			if (column.dbNull === null)
				return null;
			return column.dbNull;
		}
		return value ;
	};

	return encode;
};
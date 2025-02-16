var purify = require('./purify');
var newParam = require('../../query/newParameterized');

module.exports = function(column) {

	function encode(_context, value) {
		value = purify(value);
		if (value == null) {
			var dbNull = column.dbNull;
			return newParam('' + dbNull + '');
		}
		return newParam('' + value);
	}

	encode.unsafe = function(_context, value) {
		value = purify(value);
		if (value == null) {
			var dbNull = column.dbNull;
			return '' + dbNull + '';
		}
		return '' + value;
	};

	encode.direct = function(_context, value) {
		return value ;
	};

	return encode;
};
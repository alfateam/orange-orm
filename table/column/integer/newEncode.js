var purify = require('./purify');
var newParam = require('../../query/newParameterized');

module.exports = function(column) {
	return encode;

	function encode(value) {
		value = purify(value);
		if (value == null)
			return newParam(column.dbNull.toString());
		return newParam('' + value);
	}
};
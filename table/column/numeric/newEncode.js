var purify = require('./purify');

module.exports = function(column) {
	return encode;

	function encode(value) {
		value = purify(value);
		if (value == null)
			return column.dbNull.toString();
		return '' + value;
	}
};
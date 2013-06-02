module.exports = function(column) {
	return encode;

	function encode(value) {
		if (value === null)
			return column.dbNull.toString();
		return '' + value;
	}
};
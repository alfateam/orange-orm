module.exports = function(column) {
	return decode;

	function decode(value) {
		if (value === column.dbNull)
			return null;
		return value;
	}
};
function _new(column) {

	return function(value) {
		if (value == column.dbNull)
			return null;
		return value;
	}
}

module.exports = _new;
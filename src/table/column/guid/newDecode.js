function _new(column) {

	return function(_context, value) {
		if (value == column.dbNull)
			return null;
		return value.toLowerCase();
	};
}

module.exports = _new;
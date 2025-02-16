function _new(column) {

	return function(_context, value) {
		if (value == column.dbNull)
			return null;
		return value;
	};
}

module.exports = _new;
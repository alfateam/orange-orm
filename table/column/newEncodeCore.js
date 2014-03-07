function _new(column) {
	
	return function(value) {
		if (value == null) {
			return '\'' + column.dbNull + '\'';
		}

		return '\'' + value + '\'';	
	}
}

module.exports = _new;
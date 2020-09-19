function _createDto(table, row) {
	var dto = {};
	var columns = table._columns;
	var length = columns.length;
	for (var i = 0; i < length; i++) {
		var column = columns[i];
		if (!('serializable' in column && !column.serializable)) {
			var alias = column.alias;
			dto[alias] = row[alias];
		}
	}
	return dto;
}

module.exports = _createDto;

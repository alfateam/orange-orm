function mapFields(strategy, table, row, dto) {
	var columns = table._columns;
	for (var i = 0; i < columns.length; i++) {
		var col = columns[i];
		if (! ('serializable' in col && !col.serializable)) {
			var alias = col.alias;
			dto[alias] = row[alias];
		}
	}
	return  dto;
}

module.exports = mapFields;
let flags = require('../../../flags');

function _createDto(table, row) {
	var dto = {};
	var columns = table._columns;
	var length = columns.length;
	flags.useProxy = false;
	for (var i = 0; i < length; i++) {
		var column = columns[i];
		if (!('serializable' in column && !column.serializable)) {
			var alias = column.alias;
			if (column.toDto)
				dto[alias] = column.toDto(row[alias]);
			else
				dto[alias] = row[alias];
		}
	}
	flags.useProxy = true;
	return dto;
}

module.exports = _createDto;

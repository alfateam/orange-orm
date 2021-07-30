let flags = require('../../../flags');

function _createDto(table, row) {
	var dto = {};
	var columns = table._columns;
	flags.useProxy = false;
	for (let name in row) {
		let column = table[name];
		if (table._aliases.has(name) && !('serializable' in column && !column.serializable)) {
			if (column.toDto)
				dto[name] = column.toDto(row[name]);
			else
				dto[name] = row[name];
		}
	}

	flags.useProxy = true;
	return dto;
}

module.exports = _createDto;

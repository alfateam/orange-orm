var decodeDbRow = require('../resultToRows/decodeDbRow');

function newRow(table) {
	var dto = {};
	table._columns.forEach(addColumn);

	function addColumn(column) {
		var alias = column.alias;
		if ('default' in column) {
			if (typeof column.default === 'function')
				dto[alias] = column.default();
			else if (column.toDto)
				dto[alias] = column.toDto(column.default);
			else
				dto[alias] = column.default;
		}
		else
			dto[alias] = null;
	}

	for (var i = 1; i < arguments.length; i++) {
		var pkValue = arguments[i];
		var column = table._primaryColumns[i - 1];
		dto[column.alias] = pkValue;
	}

	return decodeDbRow(table, table, dto);
}

module.exports = newRow;

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
			dto[alias] = undefined;
	}
	const arg = arguments[1];
	if (isObject(arg))
		for(let name in arg) {
			if (table[name] && table[name].equal)
				dto[name] = arg[name];
		}
	else
		for (var i = 1; i < arguments.length; i++) {
			var pkValue = arguments[i];
			var column = table._primaryColumns[i - 1];
			dto[column.alias] = pkValue;
		}
	return decodeDbRow(table, table, dto);
}

function isObject(object) {
	return (object === Object(object) && !Array.isArray(object) && !(object instanceof Date));
}

module.exports = newRow;

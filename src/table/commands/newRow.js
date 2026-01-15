var decodeDbRow = require('../resultToRows/decodeDbRow');
var flags = require('../../flags');

function newRow(context, {table, _options, shouldValidate = true}) {
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
		else if (flags.useLazyDefaults && 'lazyDefault' in column && !column.isPrimary) {
			if (typeof column.lazyDefault === 'function')
				dto[alias] = column.lazyDefault();
			else if (column.toDto)
				dto[alias] = column.toDto(column.lazyDefault);
			else
				dto[alias] = column.lazyDefault;
		}
		else if (column.dbNull !== null)
			dto[alias] = null;
		else
			dto[alias] = undefined;
	}
	const arg = arguments[2];
	if (isObject(arg))
		for (let name in arg) {
			if (table[name] && table[name].equal)
				dto[name] = arg[name];
		}
	else
		for (var i = 2; i < arguments.length; i++) {
			var pkValue = arguments[i];
			var column = table._primaryColumns[i - 1];
			dto[column.alias] = pkValue;
		}

	return decodeDbRow(context, table, table, dto, shouldValidate, true);
}

function isObject(object) {
	return (object === Object(object) && !Array.isArray(object) && !(object instanceof Date));
}

module.exports = newRow;

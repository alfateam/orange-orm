var shallowDbRowToRow = require('../resultToRows/shallowDbRowToRow');                                

function newRow(table, id, id2, etc) {
	var dto = {};
	table._columns.forEach(addColumn);
	
	function addColumn(column) {
		var alias = column.alias;
		if ('default' in column) 
			dto[alias] = column.default;
		else
			dto[alias] = null;
	}

	for (var i = 1; i < arguments.length; i++) {
		var pkValue = arguments[i];
		var column = table._primaryColumns[i-1];
		dto[column.alias] = pkValue;
	}

	return shallowDbRowToRow(table, dto);
}

module.exports = newRow;
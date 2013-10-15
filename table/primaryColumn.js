var newColumn = require('./column');

function addColumn(table,columnName) {	
	var column = newColumn(table,columnName);
	table.primaryColumns.push(column);
	return column;
}

module.exports = addColumn;
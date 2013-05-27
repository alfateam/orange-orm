var newColumn = require('./column/newColumn');

function addColumn(table,columnName) {
	var column = newColumn(columnName);
	table.columns.push(column);
	return column;
}

module.exports = addColumn;
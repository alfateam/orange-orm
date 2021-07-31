var dbRowToRow = require('./dbRowToRow');
var newRowArray = require('../rowArray');

function dbRowsToRows(span, dbRows) {
	var rows = newRowArray();
	for (var i = 0; i < dbRows.length; i++) {
		var row = dbRowToRow(span, dbRows[i]);
		rows.push(row);
	}
	return rows;
}

module.exports = dbRowsToRows;
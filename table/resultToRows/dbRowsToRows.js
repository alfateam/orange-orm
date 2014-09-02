var dbRowToRow = require('./dbRowToRow');
var newRowArray = require('../rowArray');

function dbRowsToRows(span, result) {
    var rows = newRowArray(span.table);
    var dbRows = result[0];
    var queryContext = dbRows.queryContext;
    for (var i = 0; i < dbRows.length; i++) {
        var row = dbRowToRow(span, dbRows[i], queryContext);
        rows.push(row);
    }
    return rows;
}

module.exports = dbRowsToRows;
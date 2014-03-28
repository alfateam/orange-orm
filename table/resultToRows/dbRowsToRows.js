var dbRowToRow = require('./dbRowToRow');

function dbRowsToRows(span, result) {
    var rows = [];
    var dbRows = result[0];
    var visitor = {};
    visitor.visitJoin = function() {};
    visitor.visitOne = function() {};
    for (var i = 0; i < dbRows.length; i++) {
        var row = dbRowToRow(span, dbRows[i]);
        rows.push(row);

        visitor.visitMany = function(leg) {
            leg.expand(row);
        };

        span.legs.forEach(expandLeg);

        function expandLeg(leg) {
            leg.accept(visitor);
        }
    }
    return rows;
}

module.exports = dbRowsToRows;
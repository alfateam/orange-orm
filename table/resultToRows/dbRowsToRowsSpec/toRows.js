var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c) {
    c.dbRowToRow = requireMock('./dbRowToRow');
    c.newRowArray = requireMock('../rowArray');
    c.rowArray = [];
    c.table = {};    
    c.queryContext = {};
    c.span = {};
    c.span.table = c.table;
    c.dbRow1 = {};
    c.dbRow2 = {};
    c.res1 = [c.dbRow1, c.dbRow2];
    c.res2 = {};
    c.result = [c.res1, c.res2];
    c.result.queryContext = c.queryContext;

    c.row1 = {};
    c.row2 = {};
    c.dbRowToRow.expect(c.span, c.dbRow1, c.queryContext).return(c.row1);
    c.dbRowToRow.expect(c.span, c.dbRow2, c.queryContext).return(c.row2);

    c.newRowArray.expect(c.table).return(c.rowArray);

    c.expected = [c.row1, c.row2];

    c.returned = require('../dbRowsToRows')(c.span, c.result);
}

module.exports = act;
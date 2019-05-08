var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c) {
    c.dbRowToRow = requireMock('./dbRowToRow');
    c.newRowArray = requireMock('../rowArray');
    c.rowArray = [];
    c.table = {};
    c.span = {};
    c.span.table = c.table;
    c.dbRow1 = {};
    c.dbRow2 = {};
    c.result = [c.dbRow1, c.dbRow2];

    c.row1 = {};
    c.row2 = {};
    c.dbRowToRow.expect(c.span, c.dbRow1).return(c.row1);
    c.dbRowToRow.expect(c.span, c.dbRow2).return(c.row2);

    c.newRowArray.expect().return(c.rowArray);

    c.expected = [c.row1, c.row2];

    c.returned = require('../dbRowsToRows')(c.span, c.result);
}

module.exports = act;
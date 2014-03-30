var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c) {
    c.span = {};
    c.dbRow1 = {};
    c.dbRow2 = {};
    c.res1 = [c.dbRow1, c.dbRow2];
    c.res2 = {};
    c.result = [c.res1, c.res2];

    c.row1 = {};
    c.row2 = {};
    c.dbRowToRow = requireMock('./dbRowToRow');
    c.dbRowToRow.expect(c.span, c.dbRow1).return(c.row1);
    c.dbRowToRow.expect(c.span, c.dbRow2).return(c.row2);


    c.expected = [c.row1, c.row2];

    c.returned = require('../dbRowsToRows')(c.span, c.result);
}

module.exports = act;
var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.rows = {};
	c.span = {};
	c.result = {};
	c.table = {};
	c.span.table = c.table;

	c.dbRowsToRows  = requireMock('./resultToRows/dbRowsToRows');

	c.dbRowsToRows.expect(c.span, c.result).return(c.rows);

	c.result.shift = mock();
	c.result.shift.expect();

	c.sut = require('../resultToRows');
	c.subResultToRows = requireMock('./resultToRows/subResultToRows');
	c.subResultToRows.expect(c.span, c.result);

	c.returned = c.sut(c.span, c.result);
}

module.exports = act;
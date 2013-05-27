var newSut = require('../integer');
var column = {};
var dbNull = {};


function act(c) {
	column.dbNull = dbNull;
	c.dbNull = dbNull;
	c.column = column;
	c.sut = newSut(column);
}

module.exports = act;
var dbNull = 0;
var expected = '0';

function act(c) {
	c.column.dbNull = dbNull;
	c.expected = expected; 
	c.returned = c.sut(undefined);
}

module.exports = act;
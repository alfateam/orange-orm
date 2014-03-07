var dbNull = {};
var value = 'foo';

function act(c) {	
	c.expected = '\'foo\'';
	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(value);
}

act.base = '../new';
module.exports = act;
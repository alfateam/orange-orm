var dbNull = {};
var value = false;

function act(c) {	
	c.expected = 'FALSE';
	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(value);
}

act.base = '../new';
module.exports = act;
var dbNull = {};
var value = true;

function act(c) {	
	c.expected = 'TRUE';
	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(value);
}

act.base = '../new';
module.exports = act;
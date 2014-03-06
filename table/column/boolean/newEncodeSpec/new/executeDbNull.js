var dbNull = 'foo';

function act(c) {	
	c.expected = '\'foo\'';
	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(null);
}

act.base = '../new';
module.exports = act;
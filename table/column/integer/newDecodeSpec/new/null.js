var dbNull = 0;

function act(c) {
	c.column.dbNull = dbNull;
	c.expected = null; 
	c.returned = c.sut(dbNull);
}

act.base = '../new';
module.exports = act;
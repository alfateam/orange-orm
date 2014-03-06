var dbNull = null;

function act(c) {	
	c.expected = 'null';
	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(null);
}

module.exports = act;
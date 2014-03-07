var dbNull = {};

function act(c) {	
	c.expected = '\'' + dbNull + '\'';
	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(null);
}

act.base = '../new';
module.exports = act;
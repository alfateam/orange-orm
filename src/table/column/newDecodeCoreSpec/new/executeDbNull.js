var dbNull = {};

function act(c) {	
	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(dbNull);
}

act.base = '../new';
module.exports = act;
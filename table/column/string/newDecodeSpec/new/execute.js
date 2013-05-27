var dbNull = {};
var value = {};

function act(c) {	
	c.value = value;
	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(value);
}

act.base = '../new';
module.exports = act;
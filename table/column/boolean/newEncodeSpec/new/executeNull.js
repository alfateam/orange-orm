var dbNull = null;

function act(c) {	
	c.purify.expect(c.arg).return(null);
	c.expected = 'null';
	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(c.arg);
}

module.exports = act;
var dbNull = null;

function act(c) {	
	c.purify.expect(c.arg).return(null);
	c.formatted = 'null';

	c.expected = {};
	c.newParam.expect(c.formatted).return(c.expected);

	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(c.arg);
}

module.exports = act;
var dbNull = 'nullValue';

function act(c) {	
	c.formatted = dbNull;
	c.expected = {};

	c.newParam.expect(c.formatted).return(c.expected);

	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(null, c.column);
}

module.exports = act;
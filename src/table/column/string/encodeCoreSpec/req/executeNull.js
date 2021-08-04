var dbNull = 'nullValue';

function act(c) {	
	c.formatted = dbNull;
	c.expected = {};

	c.newParam.expect(c.formatted).return(c.expected);

	c.dbNull = dbNull;
	c.column.dbNull = dbNull;

	c.purify.expect(c.initArg).return(null);
	c.returned = c.sut(c.initArg, c.column);

}

module.exports = act;
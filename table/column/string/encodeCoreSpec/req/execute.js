var dbNull = 'nullValue';
var value = 'foo';

function act(c) {	
	c.formatted = 'foo';
	c.expected = {};

	c.stringIsSafe.expect(value).return(true);
	c.newParam.expect(c.formatted).return(c.expected);

	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(value, c.colum);
}

module.exports = act;
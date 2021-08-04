var dbNull = {};
var value = {};

function act(c) {	
	c.expected = {};
	c.value = value;
	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.purify.expect(c.value).return(c.expected);
	c.returned = c.sut(value);
}

module.exports = act;
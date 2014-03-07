var dbNull = 'foo';

function act(c) {	
	c.purify.expect(c.arg).return(null);
	c.formatted = '\'foo\'';

	c.expected = {};
	c.newParam.expect(c.formatted).return(c.expected);

	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(c.arg);
}

act.base = '../new';
module.exports = act;
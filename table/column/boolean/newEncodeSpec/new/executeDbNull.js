var dbNull = 'foo';

function act(c) {	
	c.purify.expect(c.arg).return(null);
	c.expected = '\'foo\'';
	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(c.arg);
}

act.base = '../new';
module.exports = act;
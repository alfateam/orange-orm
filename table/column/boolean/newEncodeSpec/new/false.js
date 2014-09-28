var dbNull = {};
var value = false;

function act(c) {	
	c.purify.expect(c.arg).return(value);
	c.formatted = 'false';

	c.expected = {};
	c.newParam.expect(c.formatted).return(c.expected);

	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(c.arg);
}

act.base = '../new';
module.exports = act;
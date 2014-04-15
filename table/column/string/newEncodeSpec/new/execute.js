var dbNull = {};
var value = 'foo';

function act(c) {	
	c.formatted = '\'foo\'';
	c.expected = {};

	c.stringIsSafe.expect(value).return(true);
	c.newParam.expect(c.formatted).return(c.expected);

	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.purify.expect(c.initArg).return(value);
	c.returned = c.sut(c.initArg);
}

act.base = '../new';
module.exports = act;
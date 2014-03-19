var dbNull = {};
var candidate = {};
var value = 'foo';

function act(c) {	
	c.formatted = '\'foo\'';
	c.expected = {};

	c.purify.expect(candidate).return(value);
	c.newParam.expect(c.formatted).return(c.expected);

	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(candidate);
}

act.base = '../new';
module.exports = act;
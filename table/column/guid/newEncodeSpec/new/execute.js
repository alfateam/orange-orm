var dbNull = {};
var value = 'foo';

function act(c) {	
	c.formatted = '\'foo\'';
	c.expected = {};

	c.newParam.expect(c.formatted).return(c.expected);
	c.negotiateGuidFormat.expect(value);

	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(value);
}

act.base = '../new';
module.exports = act;
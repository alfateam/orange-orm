var dbNull = {};
var value = 'someString';

function act(c) {	
	c.formatted = "'" + value + "'";
	c.expected = {};

	c.dbNull = dbNull;
	c.column.dbNull = dbNull;

	c.newParam.expect(c.formatted).return(c.expected);

	c.purify.expect(c.initArg).return(value);
	c.returned = c.sut(c.initArg);
}

act.base = '../new';
module.exports = act;
var dbNull = null;

function act(c) {	
	c.formatted = 'null';
	c.expected = {};

	c.newParam.expect(c.formatted).return(c.expected);

	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.purify.expect(c.initArg).return(null);
	c.returned = c.sut(c.initArg);
}

act.base = '../../new';
module.exports = act;
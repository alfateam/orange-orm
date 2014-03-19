var dbNull = {};

function act(c) {	
	c.formatted = '\'' + dbNull + '\'';

	c.purify.expect(null).return(null);
	c.newParam.expect(c.formatted).return(c.expected);
	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(null);
}

act.base = '../new';
module.exports = act;
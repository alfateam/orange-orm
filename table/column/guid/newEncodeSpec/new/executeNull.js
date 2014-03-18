var dbNull = {};

function act(c) {	
	c.formatted = '\'' + dbNull + '\'';

	c.newParam.expect(c.formatted).return(c.expected);
	c.negotiateGuidFormat.expect(null);
	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(null);
}

act.base = '../new';
module.exports = act;
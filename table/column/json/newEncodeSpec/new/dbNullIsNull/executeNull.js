var dbNull = null;

function act(c) {	
	c.formatted = 'null';

	c.purify.expect(null).return(null);
	c.newParam.expect(c.formatted).return(c.expected);
	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(null);
}

act.base = '../../new';
module.exports = act;
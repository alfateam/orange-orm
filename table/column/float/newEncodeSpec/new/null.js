var dbNull = 0;
var expected = '0';

function act(c) {
	c.purify.expect(c.arg).return(null);
	c.column.dbNull = dbNull;
	c.expected = expected; 
	c.returned = c.sut(c.arg);
}

act.base = '../new';
module.exports = act;
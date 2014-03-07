var dbNull = 0;
var formatted = '0';

function act(c) {
	c.purify.expect(c.arg).return(null);
	c.column.dbNull = dbNull;
	c.formatted = formatted; 

	c.expected = {};
	c.newParam.expect(c.formatted).return(c.expected);

	c.returned = c.sut(c.arg);
}

act.base = '../new';
module.exports = act;
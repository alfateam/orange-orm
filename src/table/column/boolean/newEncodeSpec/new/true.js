var dbNull = {};
var value = true;

function act(c) {	
	c.purify.expect(c.arg).return(value);
	c.formatted = {};
	
	c.encodeBoolean = c.mock();
	c.encodeBoolean.expect(value).return(c.formatted);
	c.getSessionSingleton.expect('encodeBoolean').return(c.encodeBoolean);

	c.expected = {};
	c.newParam.expect(c.formatted).return(c.expected);

	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.returned = c.sut(c.arg);
}

act.base = '../new';
module.exports = act;
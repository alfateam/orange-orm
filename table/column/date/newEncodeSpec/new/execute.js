var dbNull = {};
var valueAsText = '2014-02-16T06:49:40.297-0200';
var value = new Date(valueAsText);
var zulu = value.toISOString();

function act(c) {	
	c.encodeDate = c.mock();
	c.getSessionSingleton.expect('encodeDate').return(c.encodeDate);	
	c.encodeDate.expect(value).return(c.formatted);

	c.expected = {};

	c.newParam.expect(c.formatted).return(c.expected);

	c.dbNull = dbNull;
	c.column.dbNull = dbNull;
	c.purify.expect(c.initArg).return(value);
	c.returned = c.sut(c.initArg);
}

act.base = '../new';
module.exports = act;
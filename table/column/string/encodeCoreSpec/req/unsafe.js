var dbNull = {};

function act(c) {	
	c.value = {};
	c.param = {};
	c.expected = {};
	c.stringIsSafe.expect(c.value).return(false);

	c.newParam.expect('$').return(c.param);

	c.param.addParameter = c.mock();
	c.param.addParameter.expect(c.value).return(c.expected);
	
	c.purify.expect(c.initArg).return(c.value);
	c.returned = c.sut(c.initArg, c.column);

}

module.exports = act;
var dbNull = {};

function act(c) {	
	c.value = {};
	c.param = {};
	c.expected = {};
	c.stringIsSafe.expect(c.value).return(false);
	c.purify.expect(c.initArg).return(c.value);
	c.newParam.expect('?', c.value).return(c.expected);

	c.returned = c.sut(c.initArg);

}

module.exports = act;
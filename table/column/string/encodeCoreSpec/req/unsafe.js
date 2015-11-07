var dbNull = {};

function act(c) {	
	c.value = {};
	c.expected = {};

	c.purify.expect(c.initArg).return(c.value);
	c.stringIsSafe.expect(c.value).return(false);

	c.newParam.expect('?', [c.value]).return(c.expected);
	
	c.returned = c.sut(c.initArg, c.column);
}

module.exports = act;
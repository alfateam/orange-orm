var arg = {};

function act(c) {	
	c.expected = {};
	c.tryParseISO.expect(arg).return();
	c.cloneDate.expect(arg).return(c.expected);

	c.returned = c.sut(arg);
}

module.exports = act;
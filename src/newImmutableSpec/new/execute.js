function act(c){
	c.expected = {};
	c.arg = {};
	c.arg2 = {};
	c.fn.expect(c.arg, c.arg2).return(c.expected);
	c.returned = c.sut(c.arg, c.arg2);
}

module.exports = act;
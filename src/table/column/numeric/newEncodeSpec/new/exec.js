function act(c) {
	c.purify.expect(c.arg).return(2.24);
	c.formatted = '2.24';

	c.expected = {};
	c.newParam.expect(c.formatted).return(c.expected);

	c.returned = c.sut(c.arg);
}

act.base = '../new';
module.exports = act;
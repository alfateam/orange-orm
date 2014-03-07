function act(c) {
	c.purify.expect(c.arg).return(2);
	c.expected = '2';
	c.returned = c.sut(c.arg);
}

act.base = '../new';
module.exports = act;
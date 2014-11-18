var arg = '2014-05-11 06:49:40.297-0200';
var expected = new Date('2014-05-11 06:49:40.297-0200');

function act(c) {
	c.expected = expected;	
	c.returned = c.sut(arg);
}

module.exports = act;
var value = 2;
var expected = '2';

function act(c) {
	c.expected = expected;
	c.returned = c.sut.encode(value);
}

act.base = '../new';
module.exports = act;
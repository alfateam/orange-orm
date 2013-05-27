var value = 'foo';
var expected = '\'foo\' is not a number';

function act(c) {
	c.expected = expected;
	try {
		c.sut.encode(value);
	}
	catch (err) {
		c.thrownMsg = err.message;
	}
	
}

act.base = '../new';
module.exports = act;
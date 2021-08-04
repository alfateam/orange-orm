var arg = 'foo';
var expected = '\'foo\' is not a number';

function act(c) {
	c.expected = expected;
	try {
		c.sut(arg);
	}
	catch(error) {
		c.thrownMsg = error.message;
	}
}

module.exports = act;
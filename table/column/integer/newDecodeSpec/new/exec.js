var value = 2;

function act(c) {
	c.expected = value;
	c.returned = c.sut(value);
}

act.base = '../new';
module.exports = act;
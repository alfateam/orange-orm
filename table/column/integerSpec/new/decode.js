var value = {};

function act(c) {
	c.value = value;
	c.returned = c.sut.decode(value);
}

act.base = '../new';
module.exports = act;
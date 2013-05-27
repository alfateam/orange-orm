var range2 = {};

function act(c) {
	c.range2 = range2;
	c.sut.addRange(range2)
}

act.base = '../addRange';
module.exports = act;
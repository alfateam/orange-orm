var range1 = {};

function act(c) {
	c.range1 = range1;
	c.sut.addRange(range1);
}

module.exports = act;
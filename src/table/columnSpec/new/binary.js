var requireMock = require('a').requireMock;

function act(c) {
	var binary = requireMock('./column/binary');
	binary.expect(c.column);
	c.binary = binary;
	c.returned = c.sut.binary();
}

act.base = '../new';
module.exports = act;
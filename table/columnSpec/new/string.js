var requireMock = require('a').requireMock;

function act(c) {
	var addString = requireMock('./column/string');
	addString.expect(c.column);
	c.string = addString;
	c.returned = c.sut.string();
}

act.base = '../new';
module.exports = act;
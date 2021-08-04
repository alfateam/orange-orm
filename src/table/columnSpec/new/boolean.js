var requireMock = require('a').requireMock;
var expected = {};

function act(c) {
	var bool = requireMock('./column/boolean');
	bool.expect(c.column);
	c.bool = bool;
	c.returned = c.sut.boolean();
}

act.base = '../new';
module.exports = act;
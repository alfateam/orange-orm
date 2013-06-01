var requireMock = require('a_mock').requireMock;

function act(c) {
	var add = requireMock('./column/float');
	add.expect(c.column);
	c.float = add;
	c.returned = c.sut.float();
}

act.base = '../new';
module.exports = act;
var requireMock = require('a').requireMock;

function act(c) {
	var add = requireMock('./column/json');
	add.expect(c.column);
	c.json = add;
	c.returned = c.sut.json();
}

act.base = '../new';
module.exports = act;
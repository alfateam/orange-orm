var requireMock = require('a').requireMock;

function act(c) {
	var add = requireMock('./column/date');
	add.expect(c.column);
	c.date = add;
	c.returned = c.sut.date();
}

act.base = '../new';
module.exports = act;
var requireMock = require('a').requireMock;

function act(c) {
	var add = requireMock('./column/guid');
	add.expect(c.column);
	c.guid = add;
	c.returned = c.sut.guid();
}

act.base = '../new';
module.exports = act;
var requireMock = require('a_mock').requireMock;
var precision = {};
var scale = {};

function act(c) {
	var add = requireMock('./column/numeric');
	add.expect(c.column,precision,scale);
	c.numeric = add;
	c.returned = c.sut.numeric(precision,scale);
}

act.base = '../new';
module.exports = act;
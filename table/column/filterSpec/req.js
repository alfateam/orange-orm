var amock = require('a_mock');
var requireMock = amock.requireMock;
var newParameterized = requireMock('./newParameterized');

function act(c) {
	c.newParameterized = newParameterized;
	c.mock = amock.mock;
	c.column = {};
	c.column.name = 'columnName';
	c.sut = require('../filter');
}

module.exports = act;
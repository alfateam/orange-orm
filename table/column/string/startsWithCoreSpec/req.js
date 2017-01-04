var amock = require('a');
var requireMock = amock.requireMock;
var newBoolean = requireMock('../newBoolean');

function act(c) {
	c.newBoolean = newBoolean;
	c.mock = amock.mock;
	c.column = {};
	c.column._dbName = 'columnName';
	c.operator = 'LIKE';
	c.sut = require('../startsWithCore');
}

module.exports = act;
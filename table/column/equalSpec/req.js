var amock = require('a');
var requireMock = amock.requireMock;

function act(c) {
	c.newBoolean = requireMock('./newBoolean');
	c.encodeFilterArg = requireMock('./encodeFilterArg');
	c.mock = amock.mock;
	c.column = {};
	c.column._dbName = 'columnName';
	c.sut = require('../equal');
}

module.exports = act;
var amock = require('a');
var requireMock = amock.requireMock;
var newBoolean = requireMock('./newBoolean');
var encodeFilterArg = requireMock('./encodeFilterArg');

function act(c) {
	c.newBoolean = newBoolean;
	c.encodeFilterArg = encodeFilterArg;
	c.mock = amock.mock;
	c.column = {};
	c.column._dbName = 'columnName';
	c.sut = require('../lessThanOrEqual');
}

module.exports = act;
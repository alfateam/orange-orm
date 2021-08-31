var amock = require('a');
var requireMock = amock.requireMock;
var newBoolean = requireMock('./newBoolean');
var encodeFilterArg = requireMock('./encodeFilterArg');
var alias = '_2';

function act(c) {
	c.alias = alias;
	c.newBoolean = newBoolean;
	c.encodeFilterArg = encodeFilterArg;
	c.mock = amock.mock;
	c.column = {};
	c.column._dbName = 'columnName';
	c.sut = require('../notEqual');
}

module.exports = act;
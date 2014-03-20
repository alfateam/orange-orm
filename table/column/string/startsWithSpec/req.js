var amock = require('a');
var requireMock = amock.requireMock;
var newBoolean = requireMock('../newBoolean');
var extractAlias = requireMock('../extractAlias');
var encodeCore = requireMock('./encodeCore');

function act(c) {
	c.encodeCore = encodeCore;
	c.newBoolean = newBoolean;
	c.extractAlias = extractAlias;
	c.mock = amock.mock;
	c.column = {};
	c.column._dbName = 'columnName';
	c.sut = require('../startsWith');
}

module.exports = act;
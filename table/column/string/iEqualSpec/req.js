var amock = require('a');
var requireMock = amock.requireMock;
var newBoolean = requireMock('../newBoolean');
var encodeCore = requireMock('./encodeCore');

function act(c) {
	c.encodeCore = encodeCore;
	c.newBoolean = newBoolean;
	c.mock = amock.mock;
	c.column = {};
	c.column._dbName = 'columnName';

	c.equal = requireMock('../equal');
	
	c.sut = require('../iEqual');
}

module.exports = act;
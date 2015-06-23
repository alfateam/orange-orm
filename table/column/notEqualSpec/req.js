var amock = require('a');
var requireMock = amock.requireMock;
var newBoolean = requireMock('./newBoolean');
var alias = '_2';

function act(c) {
	c.alias = alias;
	c.newBoolean = newBoolean;	
	c.mock = amock.mock;
	c.column = {};
	c.column._dbName = 'columnName';
	c.sut = require('../notEqual');
}

module.exports = act;
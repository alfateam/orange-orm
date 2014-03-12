var amock = require('a');
var requireMock = amock.requireMock;
var newBoolean = requireMock('./newBoolean');
var extractAlias = requireMock('./extractAlias');
var alias = '_2';
var optionalAlias = {};

function act(c) {
	c.alias = alias;
	c.optionalAlias = optionalAlias;
	extractAlias.expect(optionalAlias).return(alias);
	c.newBoolean = newBoolean;	
	c.mock = amock.mock;
	c.column = {};
	c.column._dbName = 'columnName';
	c.sut = require('../notEqual');
}

module.exports = act;
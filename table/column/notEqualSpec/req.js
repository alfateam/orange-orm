var amock = require('a_mock');
var requireMock = amock.requireMock;
var newParameterized = requireMock('./newParameterized');
var extractAlias = requireMock('./extractAlias');
var alias = '_2';
var optionalAlias = {};

function act(c) {
	c.alias = alias;
	c.optionalAlias = optionalAlias;
	extractAlias.expect(optionalAlias).return(alias);
	c.newParameterized = newParameterized;	
	c.mock = amock.mock;
	c.column = {};
	c.column.name = 'columnName';
	c.sut = require('../notEqual');
}

module.exports = act;
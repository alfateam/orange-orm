var amock = require('a_mock');
var requireMock = amock.requireMock;
var newParameterized = requireMock('./newParameterized');
var extractAlias = requireMock('./extractAlias');

function act(c) {
	c.newParameterized = newParameterized;
	c.extractAlias = extractAlias;
	c.mock = amock.mock;
	c.column = {};
	c.column.name = 'columnName';
	c.sut = require('../in');
}


module.exports = act;
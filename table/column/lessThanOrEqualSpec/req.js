var amock = require('a');
var requireMock = amock.requireMock;
var newParameterized = requireMock('../query/newParameterized');
var extractAlias = requireMock('./extractAlias');

function act(c) {
	c.newParameterized = newParameterized;
	c.extractAlias = extractAlias;
	c.mock = amock.mock;
	c.column = {};
	c.column._dbName = 'columnName';
	c.sut = require('../lessThanOrEqual');
}

module.exports = act;
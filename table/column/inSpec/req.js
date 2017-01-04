var amock = require('a');
var requireMock = amock.requireMock;
var newParameterized = requireMock('../query/newParameterized');
var newBoolean = requireMock('./newBoolean');
var encodeFilterArg = requireMock('./encodeFilterArg');


function act(c) {
	c.newBoolean = newBoolean;
	c.newParameterized = newParameterized;
	c.encodeFilterArg = encodeFilterArg;
	c.mock = amock.mock;
	c.column = {};
	c.column._dbName = 'columnName';
	c.sut = require('../in');
}


module.exports = act;
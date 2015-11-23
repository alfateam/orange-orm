var a = require('a');
var requireMock = a.requireMock;
var newBoolean = requireMock('./newBoolean');
var encodeFilterArg = requireMock('./encodeFilterArg');

function act(c) {
	c.newBoolean = newBoolean;
	c.encodeFilterArg = encodeFilterArg;
	c.mock = a.mock;
	c.column = {};
	c.column._dbName = 'columnName';
	c.sut = require('../lessThan');
}

module.exports = act;
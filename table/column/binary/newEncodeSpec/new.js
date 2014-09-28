var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;
	c.requireMock = requireMock;
	c.column = {};
	c.value = {};

	c.purify = requireMock('./purify');
	c.param = requireMock('../../query/newParameterized');
	c.getSessionSingleton = c.requireMock('../../getSessionSingleton');

	c.sut = require('../newEncode')(c.column);
}

module.exports = act;
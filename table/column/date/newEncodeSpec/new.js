var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c) {
	c.initArg = {};
	c.mock = mock;
	c.column = {};

	c.newParam = requireMock('../../query/newParameterized');
	c.purify = requireMock('./purify');
	c.newEncodeSafe = requireMock('../newEncodeSafe');
	c.getSessionSingleton = requireMock('../../getSessionSingleton');

	c.getSessionSingleton.bind = c.mock();
	
	c.encodeSafe = {};
	c.newEncodeSafe.expect(c.column, c.purify).return(c.encodeSafe);

	c.sut = require('../newEncode')(c.column);
}

module.exports = act;
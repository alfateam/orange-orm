var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.fn = c.mock();

	c.sut = require('../newImmutable')(c.fn);
}

module.exports = act;
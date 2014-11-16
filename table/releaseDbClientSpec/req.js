var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.getSessionSingleton = requireMock('./getSessionSingleton');
	c.deleteSessionContext = requireMock('./deleteSessionContext');

	c.deleteSessionContext.expect();	

	c.sut = require('../releaseDbClient');
}

module.exports = act;
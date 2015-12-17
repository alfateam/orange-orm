
var a  = require('a');

function act(c){		
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.then = a.then;
	c.commitCommand = c.requireMock('./commands/commitCommand');
	c.pushCommand = c.requireMock('./commands/pushCommand');
	c.executeChanges = c.requireMock('./executeQueries/executeChanges');
	c.releaseDbClient = c.requireMock('./releaseDbClient');
	c.popChanges = c.requireMock('./popChanges');
	c.getSessionSingleton = c.requireMock('./getSessionSingleton');	
	
	c.sut = require('../commit');
}


module.exports = act;
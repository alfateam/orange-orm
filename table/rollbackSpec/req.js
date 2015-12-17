var a  = require('a');

function act(c){		
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	
	c.rollbackCommand = c.requireMock('./commands/rollbackCommand');
	c.executeQuery = c.requireMock('./executeQueries/executeQuery');
	c.releaseDbClient = c.requireMock('./releaseDbClient');
	c.popChanges = c.requireMock('./popChanges');
	c.newThrow = c.requireMock('./newThrow');
	c.resultToPromise = c.requireMock('./resultToPromise');
	c.getSessionSingleton = c.requireMock('./getSessionSingleton');	
	
	c.sut = require('../rollback');
}


module.exports = act;
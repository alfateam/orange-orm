
var a  = require('a');
var mock = a.mock;
var requireMock  = a.requireMock;


function act(c){		
	c.mock = mock;
	c.rollbackCommand = requireMock('./commands/rollbackCommand');
	c.executeQuery = requireMock('./executeQueries/executeQuery');
	c.releaseDbClient = requireMock('./releaseDbClient');
	c.popChanges = requireMock('./popChanges');
	
	c.sut = require('../rollback');
}


module.exports = act;
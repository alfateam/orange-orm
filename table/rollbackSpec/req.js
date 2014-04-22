
var a  = require('a');
var mock = a.mock;
var requireMock  = a.requireMock;


function act(c){		

	c.rollbackCommand = requireMock('./commands/rollbackCommand');
	c.executeQuery = requireMock('./executeQueries/executeQuery');

	c.sut = require('../rollback');
}


module.exports = act;
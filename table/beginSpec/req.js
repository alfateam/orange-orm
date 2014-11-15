
var a  = require('a');
var mock = a.mock;
var requireMock  = a.requireMock;


function act(c){		
	c.beginCommand = requireMock('./commands/beginCommand');
	c.executeQuery = requireMock('./executeQueries/executeQuery');
	c.setSessionSingleton = requireMock('./setSessionSingleton');
	
	c.sut = require('../begin');
}


module.exports = act;
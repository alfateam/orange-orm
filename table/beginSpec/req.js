
var a  = require('a');
var mock = a.mock;
var requireMock  = a.requireMock;


function act(c){		
	c.resetChangeSet = requireMock('./newChangeSet');
	c.beginCommand = requireMock('./commands/beginCommand');
	c.executeQuery = requireMock('./executeQueries/executeQuery');


	c.sut = require('../begin');
}


module.exports = act;
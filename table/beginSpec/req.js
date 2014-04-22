
var a  = require('a');
var mock = a.mock;
var requireMock  = a.requireMock;


function act(c){		
	c.resetChangeSet = requireMock('./newChangeSet');
	c.pushCommand = requireMock('./commands/pushCommand');
	c.beginCommand = requireMock('./commands/beginCommand');

	c.sut = require('../begin');
}


module.exports = act;
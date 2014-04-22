
var a  = require('a');
var mock = a.mock;
var requireMock  = a.requireMock;


function act(c){		

	c.commitCommand = requireMock('./commands/commitCommand');
	c.pushCommand = requireMock('./commands/pushCommand');
	c.executeChanges = requireMock('./executeQueries/executeChanges');

	c.sut = require('../commit');
}


module.exports = act;
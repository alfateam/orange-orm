
var a  = require('a');
var mock = a.mock;
var requireMock  = a.requireMock;


function act(c){		
	c.mock = mock;
	c.commitCommand = requireMock('./commands/commitCommand');
	c.pushCommand = requireMock('./commands/pushCommand');
	c.executeChanges = requireMock('./executeQueries/executeChanges');
	c.releaseDbClient = requireMock('./releaseDbClient');

	c.sut = require('../commit');
}


module.exports = act;
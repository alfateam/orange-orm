
var a  = require('a');
var mock = a.mock;
var requireMock  = a.requireMock;


function act(c){		
	c.mock = mock;
	c.commitCommand = requireMock('./commands/commitCommand');
	c.pushCommand = requireMock('./commands/pushCommand');
	c.releaseDbClient = requireMock('./releaseDbClient');
	c.flush = requireMock('./commands/flush');
			
	c.sut = require('../commit');
}


module.exports = act;
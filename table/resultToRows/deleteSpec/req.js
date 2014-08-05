var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;

	c.pushCommand = c.requireMock('../commands/pushCommand');
	c.newDeleteCommand = c.requireMock('./delete/newDeleteCommand');
	c.removeFromCache = c.requireMock('./delete/removeFromCache');		
	
	c.sut = require('../delete')
}

module.exports = act;
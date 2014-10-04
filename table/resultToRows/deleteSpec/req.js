var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;

	c.pushCommand = c.requireMock('../commands/pushCommand');
	c.newDeleteCommand = c.requireMock('../commands/newDeleteCommand');
	c.removeFromCache = c.requireMock('./delete/removeFromCache');

	c.newPrimaryKeyFilter = c.requireMock('../newPrimaryKeyFilter');
	
	c.sut = require('../delete')
}

module.exports = act;
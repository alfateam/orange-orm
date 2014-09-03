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
	c.strategyToSpan = c.requireMock('../strategyToSpan');
	
	c.alias = '_0';

	c.innerJoin = {};
	c.newParameterized  = c.requireMock('../query/newParameterized');
	c.newParameterized.expect().return(c.innerJoin);		
	
	c.sut = require('../delete')
}

module.exports = act;
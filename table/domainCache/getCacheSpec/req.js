var a = require('a');

function act(c){
	c.requireMock = a.requireMock;
	
	c.newCache = a.requireMock('../newCache');
	c.id = 'id';

	c.getSessionSingleton = c.requireMock('../getSessionSingleton');
	c.setSessionSingleton = c.requireMock('../setSessionSingleton');
	

	c.sut = require('../getCache');
}

module.exports = act;
var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.id = 'someId';
	c.newId = requireMock('../newId');
	c.newId.expect().return(c.id);

	c.newCache = requireMock('./newCache');	

	c.sut = require('../newDomainCache')();
}

module.exports = act;
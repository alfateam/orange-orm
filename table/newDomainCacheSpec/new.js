var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.id = 'someId';
	c.initialId = {};
	c.newId = requireMock('../domainCache/negotiateId');
	c.newId.expect(c.initialId).return(c.id);

	c.newCache = requireMock('./newCache');	

	c.sut = require('../newDomainCache')(c.initialId);
}

module.exports = act;
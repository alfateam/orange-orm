var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.cache = {};
	c.id = 'someId';
	c.getCache = requireMock('./domainCache/getCache');	
	c.mock = mock;	
	c.newId = requireMock('../newId');
	c.newId.expect().return(c.id);

	c.sut = require('../newDomainCache')();

	c.stubCache = function() {
		c.getCache.expect(c.id).return(c.cache);
	}
}

module.exports = act;
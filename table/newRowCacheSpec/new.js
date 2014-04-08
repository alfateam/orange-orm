var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.domainCache = {};
	c.domainCache.getAll = {};
	c.newDomainCache = requireMock('./newDomainCache');
	c.newDomainCache.expect().return(c.domainCache);
	c.domainCache.subscribeAdded = {};
	c.domainCache.subscribeRemoved = {};
	
	c.table = {};		

	c.sut = require('../newRowCache')(c.table);

	c.mockTable = function() {
		c.pk = {};
		c.pkAlias = 'pkAlias';
		c.pk.alias = c.pkAlias;

		c.pk2 = {};
		c.pk2Alias = 'pk2Alias';
		c.pk2.alias = c.pk2Alias;
	
		c.primaryColumns = [c.pk, c.pk2];
		c.table._primaryColumns = c.primaryColumns;	
	};
}

module.exports = act;
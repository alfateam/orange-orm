var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.synchronizeAdded = requireMock('./manyCache/synchronizeAdded');
	c.synchronizeChanged = requireMock('./manyCache/synchronizeChanged');
	c.cacheCore = {};
	c.cacheCore.tryAdd = mock();
	c.cacheCore.tryGet = mock();

	c.newCacheCore = requireMock('../newCache');
	c.newCacheCore.expect().return(c.cacheCore);

	c.joinRelation = {};
	c.parentTable = {};
	c.joinRelation.childTable = c.parentTable;
	
	c.synchronizeAdded.expectAnything().expect(c.joinRelation).whenCalled(onSynchronizeAdded);

	function onSynchronizeAdded(fn) {
		c.synchronizedAction = fn;
	}
	
	c.primaryColumn = {};
	c.alias = 'pk1';
	c.primaryColumn.alias = c.alias;
	
	c.primaryColumn2 = {};	
	c.alias2 = 'pk2';
	c.primaryColumn2.alias = c.alias2;
	c.parentTable._primaryColumns = [c.primaryColumn, c.primaryColumn2];
	c.sut = require('../newManyCacheCore')(c.joinRelation);
}

module.exports = act;
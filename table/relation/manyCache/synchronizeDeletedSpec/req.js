var a = require('a');
var mock = a.mock;

function act(c){
	c.mock = mock;	
	c.extractParentKey = a.requireMock('./extractParentKey');
	c.tryRemove = mock();
	c.joinRelation = {};
	c.parentTable = {};
	c.joinRelation.parentTable = c.parentTable;
	c.cache = {};
	c.cache.subscribeDeleted = c.mock();
	c.cache.subscribeDeleted.expectAnything().whenCalled(subscribeDeleted);
	
	c.raiseDeleted = function() {};
	
	function subscribeDeleted(cb){
		c.raiseDeleted = cb;
	}
	c.parentTable._cache = c.cache;
        
	c.sut = require('../synchronizeDeleted')(c.tryRemove, c.joinRelation);
}

module.exports = act;
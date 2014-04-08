var a = require('a');
var mock = a.mock;

function act(c){
	c.mock = mock;	
	c.extractParentKey = a.requireMock('./extractParentKey');
	c.tryAdd = mock();
	c.joinRelation = {};
	c.parentTable = {};
	c.joinRelation.parentTable = c.parentTable;
	c.cache = {};
	c.cache.subscribeAdded = c.mock();
	c.cache.subscribeAdded.expectAnything().whenCalled(subscribeAdded);
	
	c.raiseAdded = function() {};
	
	function subscribeAdded(cb){
		c.raiseAdded = cb;
	}
	c.parentTable._cache = c.cache;
        
	c.sut = require('../synchronizeAdded')(c.tryAdd, c.joinRelation);
}

module.exports = act;
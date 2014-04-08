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
	c.cache.subscribeRemoved = c.mock();
	c.cache.subscribeRemoved.expectAnything().whenCalled(subscribeRemoved);
	
	c.raiseRemoved = function() {};
	
	function subscribeRemoved(cb){
		c.raiseRemoved = cb;
	}
	c.parentTable._cache = c.cache;
        
	c.sut = require('../synchronizeRemoved')(c.tryRemove, c.joinRelation);
}

module.exports = act;
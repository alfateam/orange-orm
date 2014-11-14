var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	
	c.joinRelation ={};
	c.key = {};
	c.parentTable = {};
	c.cache = {};
	c.parentTable._cache = c.cache;
	c.joinRelation.parentTable = c.parentTable;
	c.cacheChanged = function() {};
	c.cache.subscribeChangedOnce = mock();
	c.cache.subscribeChangedOnce.expectAnything().whenCalled(onSubscribe);

	function onSubscribe(cb) {
		c.cacheChanged = cb;
	}

	c.setSessionSingleton = requireMock('../setSessionSingleton');
	

	c.sut = require('../newInvalidateCache')(c.key, c.joinRelation);
}

module.exports = act;
var a = require('a');

function act(c){
	c.requireMock = a.requireMock;
	c.mock = a.mock;	
	c.synchronizeAdded = c.requireMock('./manyCache/synchronizeAdded');
	c.synchronizeRemoved = c.requireMock('./manyCache/synchronizeRemoved');
	c.synchronizeChanged = c.requireMock('./manyCache/synchronizeChanged');
	c.extractParentKey = c.requireMock('./manyCache/extractParentKey');
	
	c.newCacheCore = c.requireMock('./newManyCacheCore');
	c.key = {};
	c.newId = c.requireMock('../../newId');
	c.newId.expect().return(c.key);

	c.setSessionSingleton = c.requireMock('../setSessionSingleton');
	c.getSessionSingleton = c.requireMock('../getSessionSingleton');	

	c.joinRelation = {};
	c.sut = require('../newManyCache')(c.joinRelation);
}

module.exports = act;
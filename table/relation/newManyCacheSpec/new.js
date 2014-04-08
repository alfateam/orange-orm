var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.synchronizeAdded = requireMock('./manyCache/synchronizeAdded');
	c.synchronizeRemoved = requireMock('./manyCache/synchronizeRemoved');
	c.synchronizeChanged = requireMock('./manyCache/synchronizeChanged');
	c.extractParentKey = requireMock('./manyCache/extractParentKey');
	
	c.newCacheCore = requireMock('./newManyCacheCore');
	c.key = {};
	c.newId = requireMock('../../newId');
	c.newId.expect().return(c.key);

	c.joinRelation = {};
	c.sut = require('../newManyCache')(c.joinRelation);
}

module.exports = act;
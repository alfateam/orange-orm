var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.newCacheCore = requireMock('./newManyCacheCore');
	c.newInvalidateCache = requireMock('./newInvalidateCache');
	c.key = {};
	c.newId = requireMock('../../newId');
	c.newId.expect().return(c.key);

	c.joinRelation = {};
	c.sut = require('../newManyCache')(c.joinRelation);
}

module.exports = act;
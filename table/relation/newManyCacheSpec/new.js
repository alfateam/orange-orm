var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.newCacheCore = requireMock('./newManyCacheCore');

	c.joinRelation = {};
	c.sut = require('../newManyCache')(c.joinRelation);
}

module.exports = act;
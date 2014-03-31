var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.newManyCache = requireMock('./newManyCache');
	c.manyCache = {};	
	c.joinRelation = {};
	c.newManyCache.expect(c.joinRelation).return(c.manyCache);

	c.sut = require('../newOneCache')(c.joinRelation);
}

module.exports = act;
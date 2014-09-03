var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var expectRequire = a.expectRequire;

function act(c){
	c.mock = mock;
	c.then = a.then;
	c.childTable = {};
	c.joinRelation = {};
	c.cache = {};
	c.cache.tryGet = c.mock();
	c.newForeignKeyFilter = requireMock('./relation/newForeignKeyFilter');
	c.newCache = requireMock('./relation/newManyCache');
	c.newCache.expect(c.joinRelation).return(c.cache);
	c.joinRelation.parentTable = c.childTable;
	
	c.getRelatives = requireMock('./oneRelation/getRelatives');
	c.newLeg = requireMock('./relation/newManyLeg');	
	c.resultToPromise = requireMock('./resultToPromise');

	c.newGetRelated = requireMock('./oneRelation/newGetRelated');

	c.sut = require('../newManyRelation')(c.joinRelation);
}

module.exports = act;
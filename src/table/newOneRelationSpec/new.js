var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var expectRequire = a.expectRequire;

function act(c){
	c.mock = mock;
	c.then = a.then;
	c.childTable = {};
	c.joinRelation = {};
	c.oneCache = {};
	c.oneCache.tryGet = c.mock();
	c.newForeignKeyFilter = requireMock('./relation/newForeignKeyFilter');
	c.newOneCache = requireMock('./relation/newOneCache');
	c.newOneCache.expect(c.joinRelation).return(c.oneCache);
	c.joinRelation.parentTable = c.childTable;
	
	c.getRelatives = requireMock('./oneRelation/getRelatives');
	c.newLeg = requireMock('./relation/newOneLeg');	
	c.resultToPromise = requireMock('./resultToPromise');

	c.newGetRelated = requireMock('./newGetRelated');

	c.sut = require('../newOneRelation')(c.joinRelation);
}

module.exports = act;
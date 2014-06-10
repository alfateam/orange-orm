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
	
	c.newExpanderCache = requireMock('./relation/newExpanderCache');
	c.expanderCache = {};
	c.newExpanderCache.expect(c.joinRelation).return(c.expanderCache);
	c.expanderCache.tryGet = mock();
	c.expanderCache.tryAdd = mock();

	c.getFarRelated = requireMock('./oneRelation/getFarRelated');
	c.newLeg = requireMock('./relation/newOneLeg');	
	c.resultToPromise = requireMock('./resultToPromise');
	c.sut = require('../newOneRelation')(c.joinRelation);
}

module.exports = act;
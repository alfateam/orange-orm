var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;
var expectRequire = a.expectRequire;

function act(c){
	c.childTable = {};
	c.joinRelation = {};
	c.joinRelation.parentTable = c.childTable;
	c.newLeg = requireMock('./relation/newOneLeg');	
	c.sut = require('../newOneRelation')(c.joinRelation);
}

module.exports = act;
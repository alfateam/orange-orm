var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	
	c.then = a.then;	
	c.relationName = 'lines';
	c.relation = {};
	c.lineTable = {};
	c.relation.childTable = c.lineTable;
	c.lineStrategy = {};
	c.strategy = {lines : c.lineStrategy, other: {}};
	c.dto = {};	

	c.sut = require('../newManyRelatedToDto')(c.relationName, c.relation, c.strategy, c.dto);

}

module.exports = act;
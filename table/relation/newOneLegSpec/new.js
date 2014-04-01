var a = require('a');
var requireMock = a.requireMock;
var mock = a.mock;
var joinRelation = {};
var parentTable = {};
var childTable = {};
var columns = {};
var newCollection = requireMock('../../newCollection');
var emptyCollection = {};

function act(c){	
	c.relation = {};
	c.relation.joinRelation = joinRelation;
	joinRelation.parentTable = parentTable;
	joinRelation.childTable = childTable;
	joinRelation.columns = columns;
	newCollection.expect().return(emptyCollection);
	c.emptyCollection = emptyCollection;
	c.childTable = childTable;
	c.parentTable = parentTable;
	c.columns = columns;
	c.mock = mock;
	c.relation.expand = {};

	c.sut = require('../newOneLeg')(c.relation);
}

module.exports = act;
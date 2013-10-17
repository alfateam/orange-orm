var a = require('a');
var requireMock = a.requireMock;
var mock = a.mock;
var relation = {};
var parentTable = {};
var childTable = {};
var columns = {};
var newCollection = requireMock('../../newCollection');
var emptyCollection = {};

function act(c){	
	relation.parentTable = parentTable;
	relation.childTable = childTable;
	relation.columns = columns;
	newCollection.expect().return(emptyCollection);
	c.emptyCollection = emptyCollection;
	c.childTable = childTable;
	c.parentTable = parentTable;
	c.columns = columns;
	c.mock = mock;
	c.sut = require('../newJoinLeg')(relation);
}

module.exports = act;
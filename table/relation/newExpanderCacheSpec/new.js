var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c){
	c.mock = mock;	

	c.table = {};
	c.joinRelation = {};
	c.joinRelation.childTable = c.table;

	c.rowCache = {};
	c.newRowCache = requireMock('../newRowCache');
	c.newRowCache.expect(c.table).return(c.rowCache);

	c.returned =  require('../newExpanderCache')(c.joinRelation);
}

module.exports = act;
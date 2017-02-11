var a = require('a');
var requireMock = a.requireMock;
var mock = a.mock;

module.exports = function(c) {
	c.mock = mock;
	c.newShallowJoinSql = requireMock('./newShallowJoinSql');
	c.newQuery = requireMock('../../newQuery');
	c.extractOrderBy = requireMock('../extractOrderBy');
	
	c.sut = require('../manyLegToQuery');
}

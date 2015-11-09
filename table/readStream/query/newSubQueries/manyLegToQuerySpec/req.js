var a = require('a');
var requireMock = a.requireMock;
var mock = a.mock;

module.exports = function(c) {
	c.mock = mock;
	c.newShallowJoinSql = requireMock('../../../query/singleQuery/joinSql/newShallowJoinSqlCore');
	c.newQuery = requireMock('../../newQuery');
	c.newParameterized = requireMock('../../../query/newParameterized');
	c.extractOrderBy = requireMock('../../../extractOrderBy');
	
	c.sut = require('../manyLegToQuery');
}

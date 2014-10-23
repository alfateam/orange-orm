var a = require('a');
var requireMock = a.requireMock;
var mock = a.mock;

module.exports = function(c) {
	c.mock = mock;
	c.newShallowJoinSql = requireMock('../query/singleQuery/joinSql/newShallowJoinSql');
	c.newQuery = requireMock('../newQuery');
	c.newParameterized = requireMock('../query/newParameterized');
	c.sut = require('../joinLegToQuery');
}

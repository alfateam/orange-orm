var a = require('a');
var requireMock = a.requireMock;
var mock = a.mock;

module.exports = function(c) {
	c.mock = mock;
	c.newShallowJoinSql = requireMock('../query/addSubQueries/newShallowJoinSql');

	c.newQuery = requireMock('../newQuery');
	c.sut = require('../joinLegToQuery');
}

var a = require('a');
var requireMock = a.requireMock;
var mock = a.mock;

module.exports = function(c) {
	c.mock = mock;
	c.newShallowJoinSql = requireMock('./newShallowJoinSql');
	c.addSubQueries = requireMock('../addSubQueries');
	c.sut = require('../oneLegToQuery');
}

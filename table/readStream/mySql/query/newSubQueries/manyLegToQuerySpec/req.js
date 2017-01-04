var a = require('a');
var requireMock = a.requireMock;
var mock = a.mock;

module.exports = function(c) {
    c.mock = mock;
    c.extractOrderBy = requireMock('../../../extractOrderBy');
    c.newShallowJoinSql = requireMock('../../../../query/singleQuery/joinSql/newShallowJoinSqlCore');
    c.newQuery = requireMock('./newQueryCore');

    c.sut = require('../manyLegToQuery');
}

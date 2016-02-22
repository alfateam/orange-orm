var a = require('a');
var requireMock = a.requireMock;	
var newColumnSql = requireMock('./singleQuery/newColumnSql');
var newJoinSql = requireMock('./singleQuery/newJoinSql');
var newWhereSql = requireMock('./singleQuery/newWhereSql');
var negotiateLimit = requireMock('./singleQuery/negotiateLimit');

var table = {};
var filter = {};
var span = {};
var alias = '_2';
var parameters = {};
var innerJoin = {};
var orderBy = ' <orderBy>';
var limit = ' <limit>';

function act(c) {
	c.requireMock = a.requireMock;
	c.mock = a.mock;
    filter.parameters = parameters;
    c.parameters = parameters;
    c.alias = alias;
    c.table = table;
    c.filter = filter;
    c.limit = limit;
    c.span = span;
    c.innerJoin = innerJoin;
    c.newColumnSql = newColumnSql;
    c.newJoinSql = newJoinSql;
    c.newWhereSql = newWhereSql;
    c.negotiateLimit = negotiateLimit;

    c.queryContext = c.mock();
    c.newqueryContext = c.requireMock('./singleQuery/newQueryContext');
    c.newqueryContext.expect(filter, alias, innerJoin).return(c.queryContext);
    c.negotiateExclusive = c.requireMock('./singleQuery/negotiateExclusive');    

    c.sut = require('../newSingleQuery')(table, filter, span, alias, innerJoin, orderBy, limit);
}

module.exports = act;

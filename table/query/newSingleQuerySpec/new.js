var a = require('a');
var requireMock = a.requireMock;	
var newColumnSql = requireMock('./singleQuery/newColumnSql');
var newJoinSql = requireMock('./singleQuery/newJoinSql');
var newWhereSql = requireMock('./singleQuery/newWhereSql');
var negotiateLimit = requireMock('./singleQuery/negotiateLimit');

var table = {};
var filter = {
    parameters: [3,'foo']
};
var span = {};
var alias = '_2';
var innerJoin = {
    parameters: [1,2]
};
var orderBy = ' <orderBy>';
var limit = ' <limit>';
var exclusive = {};

function act(c) {
	c.requireMock = a.requireMock;
	c.mock = a.mock;
    c.filter = filter;
    c.parameters = [1,2,3,'foo'];
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
    c.exclusive = exclusive;

    c.queryContext = c.mock();
    c.newqueryContext = c.requireMock('./singleQuery/newQueryContext');
    c.newqueryContext.expect(filter, alias, innerJoin).return(c.queryContext);
    c.negotiateExclusive = c.requireMock('./singleQuery/negotiateExclusive');    

    c.sut = require('../newSingleQuery')(table, filter, span, alias, innerJoin, orderBy, limit, exclusive);
}

module.exports = act;

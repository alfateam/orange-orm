var requireMock = require('a').requireMock;
var mock = require('a').mock;
var newSingleQuery = requireMock('./query/newSingleQuery');
var extractFilter = requireMock('./query/extractFilter');
var extractOrderBy = requireMock('./query/extractOrderBy');
var extractLimit = requireMock('./query/extractLimit');
var extractExclusive = requireMock('./query/extractExclusive');
var extractLimitQuery = requireMock('./query/extractLimitQuery');


var table = {};
var filter = {};
var initialFilter = {};
var orderBy = {};
var limit = {};
var initialOrderBy = {};
var singleQuery = {
};
var subQuery = {};
var span = {};
var spanOrderBy = {};
var alias = '_2;'
var innerJoin = {};
var limit = {};
var originalOrderBy = {};
var exclusive = {};
var limitQuery = {};

function act(c) {
	c.queries = {};
	c.queries.push = mock();
	c.queries.push.expect(singleQuery);
	c.singleQuery = singleQuery;
	c.limitQuery = limitQuery;
	span.orderBy = spanOrderBy;

	extractFilter.expect(initialFilter).return(filter);
	extractOrderBy.expect(table,alias,spanOrderBy,originalOrderBy).return(orderBy);
	extractLimit.expect(span).return(limit);
	extractLimitQuery.expect(table, filter, span, alias, orderBy, limit).return(limitQuery);
	newSingleQuery.expect(table,filter,span,alias,innerJoin,orderBy,limit,exclusive).return(singleQuery);
	c.returned = require('../newQuery')(c.queries,table,initialFilter,span,alias,innerJoin,originalOrderBy,exclusive);
}

module.exports = act;

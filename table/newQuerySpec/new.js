var requireMock = require('a').requireMock;
var mock = require('a').mock;
var newSingleQuery = requireMock('./query/newSingleQuery');
var addSubQueries = requireMock('./query/addSubQueries');
var extractFilter = requireMock('./query/extractFilter');
var extractOrderBy = requireMock('./query/extractOrderBy');
var extractLimit = requireMock('./query/extractLimit');
var extractExclusive = requireMock('./query/extractExclusive');

var table = {};
var filter = {};
var initialFilter = {};
var orderBy = {};
var limit = {};
var initialOrderBy = {};
var singleQuery = {};
var subQuery = {};
var span = {};
var spanOrderBy = {};
var alias = '_2;'
var expected = {};
var innerJoin = {};
var limit = {};
var originalOrderBy = {};
var exclusive = {};

function act(c) {
	c.queries = {};
	c.queries.push = mock();
	c.queries.push.expect(singleQuery);
	
	span.orderBy = spanOrderBy;
	c.addSubQueries = addSubQueries;

	extractFilter.expect(initialFilter).return(filter);
	extractOrderBy.expect(table,alias,spanOrderBy,originalOrderBy).return(orderBy);
	extractLimit.expect(span).return(limit);
	newSingleQuery.expect(table,filter,span,alias,innerJoin,orderBy,limit,exclusive).return(singleQuery);
	addSubQueries.expect(c.queries,table,filter,span,alias,innerJoin).return(expected);	
	c.returned = require('../newQuery')(c.queries,table,initialFilter,span,alias,innerJoin,originalOrderBy,exclusive);
}

module.exports = act;

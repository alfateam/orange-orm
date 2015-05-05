var requireMock = require('a').requireMock;
var mock = require('a').mock;
var newSingleQuery = requireMock('./query/newSingleQuery');
var addSubQueries = requireMock('./query/addSubQueries');
var extractFilter = requireMock('./query/extractFilter');
var extractOrderBy = requireMock('./query/extractOrderBy');

var table = {};
var filter = {};
var initialFilter = {};
var orderBy = {};
var initialOrderBy = {};
var singleQuery = {};
var subQuery = {};
var span = {};
var alias = '_2;'
var expected = {};
var innerJoin = {};

function act(c) {
	c.queries = {};
	c.queries.push = mock();
	c.queries.push.expect(singleQuery);
	
	c.addSubQueries = addSubQueries;

	extractFilter.expect(initialFilter).return(filter);
	extractOrderBy.expect(table, alias, initialOrderBy).return(orderBy);
	newSingleQuery.expect(table,filter,span,alias,innerJoin,orderBy).return(singleQuery);
	addSubQueries.expect(c.queries,table,filter,span,alias,innerJoin).return(expected);
	c.returned = require('../newQuery')(c.queries,table,initialFilter,span,alias,innerJoin,initialOrderBy);
}

module.exports = act;

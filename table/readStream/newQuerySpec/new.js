var requireMock = require('a').requireMock;
var mock = require('a').mock;
var newSingleQuery = requireMock('./query/newSingleQuery');
var newSubQueries = requireMock('./query/newSubQueries');
var extractFilter = requireMock('./query/extractFilter');
var extractOrderBy = requireMock('./query/extractOrderBy');

var table = {};
var filter = {};
var initialFilter = {};
var orderBy = {};
var initialOrderBy = {};
var singleQuery = {};
var subQueries = {};

var span = {};
var alias = '_2;'
var expected = {};

function act(c) {
	extractFilter.expect(initialFilter).return(filter);
	extractOrderBy.expect(table, alias, initialOrderBy).return(orderBy);

	newSubQueries.expect(table,span,alias).return(subQueries);

	c.expected = {};
	newSingleQuery.expect(table,filter,span,alias,subQueries,orderBy).return(c.expected);
	c.returned = require('../newQuery')(table,initialFilter,span,alias,initialOrderBy);
}

module.exports = act;

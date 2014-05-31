var requireMock = require('a').requireMock;
var mock = require('a').mock;
var newSingleQuery = requireMock('./query/newSingleQuery');
var addSubQueries = requireMock('./query/addSubQueries');
var extractFilter = requireMock('./query/extractFilter');

var table = {};
var filter = {};
var initialFilter = {};
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
	newSingleQuery.expect(table,filter,span,alias,innerJoin).return(singleQuery);
	addSubQueries.expect(c.queries,table,filter,span,alias,innerJoin).return(expected);
	c.returned = require('../newQuery')(c.queries,table,initialFilter,span,alias,innerJoin);
}

module.exports = act;

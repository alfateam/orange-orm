var requireMock = require('a').requireMock;
var mock = require('a').mock;
var newSingleQuery = requireMock('./query/newSingleQuery');
var newSubQueries = requireMock('./query/newSubQueries');
var extractFilter = requireMock('../../query/extractFilter');
var extractOrderBy = requireMock('../extractOrderBy');
var extractLimit = requireMock('../extractLimit');
var newParameterized = requireMock('../../query/newParameterized');
var table = {};
var filter = {};
var initialFilter = {};
var orderBy = {};
var singleQuery = {};
var subQueries = {};
var limit = {};

var span = {};
var alias = '_2;'
var expected = {};

function act(c) {
	extractFilter.expect(initialFilter).return(filter);
	extractOrderBy.expect(alias, span).return(orderBy);
	extractLimit.expect(span).return(limit);

	newSubQueries.expect(table,span,alias).return(subQueries);

	c.singleQuery = {
		sql: mock(),
		parameters: {}
	};
	newSingleQuery.expect(table,filter,alias,subQueries,orderBy,limit).return(c.singleQuery);

	c.expected = {};
	c.sql = {};
	c.singleQuery.sql.expect().return(c.sql);
	newParameterized.expect(c.sql, c.singleQuery.parameters).return(c.expected);

	c.returned = require('../newQueryCore')(table,initialFilter,span,alias);
}

module.exports = act;

var requireMock = require('a').requireMock;
var mock = require('a').mock;

var newCompositeQuery = requireMock('./query/newCompositeQuery');
var newSingleQuery = requireMock('./query/newSingleQuery');
var addSubQueries = requireMock('./query/addSubQueries');
var extractFilter = requireMock('./query/extractFilter');

var table = {};
var filter = {};
var initialFilter = {};
var compositeQuery = {};
var singleQuery = {};
var subQuery = {};
var compositeQuery2 = mock();
var span = {};
var alias = '_2;'
var expected = {};

function act(c) {
	extractFilter.expect(initialFilter).return(filter);
	newCompositeQuery.expect().return(compositeQuery);
	newSingleQuery.expect(table,filter,span,alias).return(singleQuery);
	compositeQuery.add = mock();
	compositeQuery.add.expect(singleQuery).return(compositeQuery2);
	addSubQueries.expect(compositeQuery2,table,filter,span,alias).return(expected);
	c.expected = expected;
	c.returned = require('../newQuery')(table,initialFilter,span,alias);
}

module.exports = act;

var requireMock = require('a_mock').requireMock;
var mock = require('a_mock').mock;

var newCompositeQuery = requireMock('./query/newCompositeQuery');
var newSingleQuery = requireMock('./query/newSingleQuery');
var addSubQueries = requireMock('./selectQuery/addSubQueries')

var table = {};
var filter = {};
var compositeQuery = {};
var singleQuery = {};
var subQuery = {};
var compositeQuery2 = mock();
var expected = {};
var span = {};
var alias = '_2;'

function act(c) {
	newCompositeQuery.expect().return(compositeQuery);
	newSingleQuery.expect(table,filter,span,alias).return(singleQuery);
	compositeQuery.add = mock();
	compositeQuery.add.expect(singleQuery).return(compositeQuery2);
	addSubQueries.expect(compositeQuery2,table,filter,span,alias).return(expected);
	c.expected = expected;
	c.returned = require('../newQuery')(table,filter,span,alias);
}

module.exports = act;

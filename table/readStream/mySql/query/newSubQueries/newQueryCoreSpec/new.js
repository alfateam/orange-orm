var requireMock = require('a').requireMock;
var mock = require('a').mock;
var newSingleQuery = requireMock('./newSingleQueryCore');
var newSubQueries = requireMock('../newSubQueries');

var table = {};
var orderBy = {};
var initialOrderBy = {};
var singleQuery = {};
var subQueries = {};

var span = {};
var alias = '_2;'
var expected = {};

function act(c) {

	newSubQueries.expect(table,span,alias).return(subQueries);

	c.expected = {};
	newSingleQuery.expect(table,alias,subQueries).return(c.expected);
	c.returned = require('../newQueryCore')(table,span,alias);
}

module.exports = act;

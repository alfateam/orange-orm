var newSingleQuery = require('./query/newSingleQuery');
var newSubQueries = require('./query/newSubQueries');
var extractFilter = require('../../table/query/extractFilter');
var extractOrderBy = require('../../table/query/extractOrderBy');
var extractLimit = require('../../table/query/extractLimit');
var newParameterized = require('../../table/query/newParameterized');

function newQuery(table,filter,span,alias) {
	filter = extractFilter(filter);
	var orderBy = extractOrderBy(table,alias,span.orderBy);
	
	var limit = extractLimit(span);
	var subQueries = newSubQueries(table,span,alias);
	var query = newSingleQuery(table,filter,span,alias,subQueries,orderBy,limit);
	return newParameterized(query.sql(), query.parameters);
}

module.exports = newQuery;
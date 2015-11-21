var newSingleQuery = require('./query/newSingleQuery');
var newSubQueries = require('./query/newSubQueries');
var extractFilter = require('../../query/extractFilter');
var extractOrderBy = require('../../query/extractOrderBy');
var newParameterized = require('../../query/newParameterized');

function newQuery(table,filter,span,alias,orderBy) {	
	filter = extractFilter(filter);
	orderBy = extractOrderBy(table,alias,orderBy);
	var subQueries = newSubQueries(table,span,alias);
	var query = newSingleQuery(table,filter,alias,subQueries,orderBy);
	return newParameterized(query.sql(), query.parameters);
}

module.exports = newQuery;
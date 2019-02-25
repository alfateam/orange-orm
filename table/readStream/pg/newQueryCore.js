var newSingleQuery = require('./query/newSingleQuery');
var newSubQueries = require('./query/newSubQueries');
var extractFilter = require('../../query/extractFilter');
var extractOrderBy = require('../extractOrderBy');
var extractLimit = require('../extractLimit');
var newParameterized = require('../../query/newParameterized');

function newQuery(table,filter,span,alias) {	
	filter = extractFilter(filter);
	var orderBy = extractOrderBy(alias,span);
	var limit = extractLimit(span);
	var subQueries = newSubQueries(table,span,alias);
	var query = newSingleQuery(table,filter,span,alias,subQueries,orderBy,limit);
	return newParameterized(query.sql(), query.parameters);
}

module.exports = newQuery;
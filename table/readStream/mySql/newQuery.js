var newSingleQuery = require('./query/newSingleQuery');
var newSubQueries = require('./query/newSubQueries');
var extractFilter = require('../../query/extractFilter');
var extractOrderBy = require('../extractOrderBy');

function newQuery(table,filter,span,alias) {	
	filter = extractFilter(filter);
	orderBy = extractOrderBy(alias,span);
	var subQueries = newSubQueries(table,span,alias);
	return newSingleQuery(table,filter,alias,subQueries,orderBy);
}

module.exports = newQuery;
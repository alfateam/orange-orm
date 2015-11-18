var newSingleQuery = require('./query/newSingleQuery');
var newSubQueries = require('./query/newSubQueries');
var extractFilter = require('../query/extractFilter');
var extractOrderBy = require('../query/extractOrderBy');

function newQuery(table,filter,span,alias,orderBy) {	
	filter = extractFilter(filter);
	orderBy = extractOrderBy(table,alias,orderBy);
	var subQueries = newSubQueries(table,span,alias);
	return newSingleQuery(table,filter,alias,subQueries,orderBy);
}

module.exports = newQuery;
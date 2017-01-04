var newSingleQuery = require('./query/newSingleQuery');
var newSubQueries = require('./query/newSubQueries');
var extractFilter = require('../../query/extractFilter');
var extractOrderBy = require('../extractOrderBy');
var extractLimit = require('../extractLimit');

function newQuery(table,filter,span,alias) {	
	filter = extractFilter(filter);
	var orderBy = extractOrderBy(alias,span);
	var limit = extractLimit(span);

	var subQueries = newSubQueries(table,span,alias);
	return newSingleQuery(table,filter,alias,subQueries,orderBy,limit);
}

module.exports = newQuery;
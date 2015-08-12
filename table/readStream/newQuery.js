var newSingleQuery = require('./query/newSingleQuery');
var extractFilter = require('./query/extractFilter');
var extractOrderBy = require('./query/extractOrderBy');

function newQuery(table,filter,span,alias,innerJoin,orderBy) {	
	filter = extractFilter(filter);
	orderBy = extractOrderBy(table,alias,orderBy);
	return newSingleQuery(table,filter,span,alias,innerJoin,orderBy);
}

module.exports = newQuery;
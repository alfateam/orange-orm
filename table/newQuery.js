var newSingleQuery = require('./query/newSingleQuery');
var addSubQueries = require('./query/addSubQueries');
var extractFilter = require('./query/extractFilter');
var extractOrderBy = require('./query/extractOrderBy');

function newQuery(queries,table,filter,span,alias,innerJoin,orderBy) {	
	filter = extractFilter(filter);
	orderBy = extractOrderBy(table,alias,orderBy);
	var singleQuery = newSingleQuery(table,filter,span,alias,innerJoin,orderBy);
	queries.push(singleQuery);
	addSubQueries(queries,table,filter,span,alias,innerJoin);
	return queries;
}

module.exports = newQuery;
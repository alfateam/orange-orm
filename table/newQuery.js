var newSingleQuery = require('./query/newSingleQuery');
var addSubQueries = require('./query/addSubQueries');
var extractFilter = require('./query/extractFilter');

function newQuery(queries,table,filter,span,alias,innerJoin) {	
	filter = extractFilter(filter);
	var singleQuery = newSingleQuery(table,filter,span,alias,innerJoin);
	queries.push(singleQuery);
	filter = filter.prepend(innerJoin);
	addSubQueries(queries,table,filter,span,alias);
	return queries;
}

module.exports = newQuery;
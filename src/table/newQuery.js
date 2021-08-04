var newSingleQuery = require('./query/newSingleQuery');
var extractFilter = require('./query/extractFilter');
var extractOrderBy = require('./query/extractOrderBy');
var extractLimit = require('./query/extractLimit');

function newQuery(queries,table,filter,span,alias,innerJoin,orderBy,exclusive) {
	filter = extractFilter(filter);
	orderBy = extractOrderBy(table,alias,span.orderBy,orderBy);
	var limit = extractLimit(span);
	var singleQuery = newSingleQuery(table,filter,span,alias,innerJoin,orderBy,limit,exclusive);
	queries.push(singleQuery);

	return queries;
}

module.exports = newQuery;
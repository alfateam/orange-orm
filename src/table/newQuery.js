var newSingleQuery = require('./query/newSingleQuery');
var extractFilter = require('./query/extractFilter');
var extractOrderBy = require('./query/extractOrderBy');
var extractLimit = require('./query/extractLimit');
var extractOffset = require('./query/extractOffset');

function newQuery(queries,table,filter,span,alias,innerJoin,orderBy,exclusive) {
	filter = extractFilter(filter);
	orderBy = extractOrderBy(table,alias,span.orderBy,orderBy);
	var limit = extractLimit(span);
	var offset = extractOffset(span);
	var singleQuery = newSingleQuery(table,filter,span,alias,innerJoin,orderBy,limit,offset,exclusive);
	queries.push(singleQuery);

	return queries;
}

module.exports = newQuery;
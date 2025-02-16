var newSingleQuery = require('./query/newSingleQuery');
var extractFilter = require('./query/extractFilter');
var extractOrderBy = require('./query/extractOrderBy');
var extractLimit = require('./query/extractLimit');
var extractOffset = require('./query/extractOffset');

function newQuery(context, queries,table,filter,span,alias,innerJoin,orderBy,exclusive) {
	filter = extractFilter(filter);
	orderBy = extractOrderBy(context, table,alias,span.orderBy,orderBy);
	var limit = extractLimit(context, span);
	var offset = extractOffset(context, span);
	var singleQuery = newSingleQuery(context, table,filter,span,alias,innerJoin,orderBy,limit,offset,exclusive);
	queries.push(singleQuery);

	return queries;
}

module.exports = newQuery;
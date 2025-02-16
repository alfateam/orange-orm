var newSingleQuery = require('./query/newSingleQuery');
var extractFilter = require('../table/query/extractFilter');
var extractOrderBy = require('../table/query/extractOrderBy');
var extractLimit = require('../table/query/extractLimit');
var newParameterized = require('../table/query/newParameterized');
var extractOffset = require('../table/query/extractOffset');

function newQuery(context,table,filter,span,alias) {
	filter = extractFilter(filter);
	var orderBy = extractOrderBy(context,table,alias,span.orderBy);
	var limit = extractLimit(context, span);
	var offset = extractOffset(context, span);

	var query = newSingleQuery(context,table,filter,span,alias,orderBy,limit,offset);
	return newParameterized(query.sql(), query.parameters);
}

module.exports = newQuery;
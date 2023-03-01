var newSingleQuery = require('./query/newSingleQuery');
var extractFilter = require('../../table/query/extractFilter');
var extractOrderBy = require('../../table/query/extractOrderBy');
var extractLimit = require('../../table/query/extractLimit');
var extractOffset = require('../../table/query/extractOffset');
var newParameterized = require('../../table/query/newParameterized');

function newQuery(table,filter,span,alias) {
	filter = extractFilter(filter);
	var orderBy = extractOrderBy(table,alias,span.orderBy);
	var limit = extractLimit(span);
	var offset = extractOffset(span);
	var subQueries = '';
	var query = newSingleQuery(table,filter,span,alias,subQueries,orderBy,limit,offset);
	return newParameterized(query.sql(), query.parameters);
}

module.exports = newQuery;
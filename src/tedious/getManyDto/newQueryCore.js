var newSingleQuery = require('./query/newSingleQuery');
var newSubQueries = require('./query/newSubQueries');
var extractFilter = require('../../table/query/extractFilter');
var extractOrderBy = require('../../table/query/extractOrderBy');
var extractLimit = require('../../table/query/extractLimit');
var limitAndOffset = require('../limitAndOffset');

function newQuery(context, table, filter, span, alias) {
	filter = extractFilter(filter);
	var orderBy = extractOrderBy(context, table, alias, span.orderBy);
	var limit = extractLimit(context, span);
	var offset = limitAndOffset(span);

	var subQueries = newSubQueries(newQuery, context, table, span, alias);
	return newSingleQuery(context, table, filter, span, alias, subQueries, orderBy, limit, offset);
}

module.exports = newQuery;
var newSingleQuery = require('./query/newSingleQuery');
var newSubQueries = require('./query/newSubQueries');
var extractFilter = require('../../table/query/extractFilter');
var extractOrderBy = require('../../table/query/extractOrderBy');
var extractLimit = require('../../table/query/extractLimit');
// var newParameterized = require('../../table/query/newParameterized');
var limitAndOffset = require('../limitAndOffset');

function newQuery(table,filter,span,alias) {
	filter = extractFilter(filter);
	var orderBy = extractOrderBy(table,alias,span.orderBy);
	var limit = extractLimit(span);
	var offset = limitAndOffset(span);

	var subQueries = newSubQueries(table,span,alias);
	return newSingleQuery(table,filter,span,alias,subQueries,orderBy,limit,offset);
	// return newParameterized(query.sql(), query.parameters);
	//todo
}

module.exports = newQuery;
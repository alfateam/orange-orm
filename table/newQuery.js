var newCompositeQuery = require('./query/newCompositeQuery');
var newSingleQuery = require('./query/newSingleQuery');
var addSubQueries = require('./query/addSubQueries');
var extractFilter = require('./query/extractFilter');

function newQuery(table,filter,span,alias) {	
	filter = extractFilter(filter);
	var compositeQuery = newCompositeQuery();
	var singleQuery = newSingleQuery(table,filter,span,alias);
	compositeQuery = compositeQuery.add(singleQuery);
	return addSubQueries(compositeQuery,table,filter,span,alias);
}

module.exports = newQuery;
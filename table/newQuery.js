var newCompositeQuery = require('./query/newCompositeQuery');
var newSingleQuery = require('./query/newSingleQuery');
var addSubQueries = require('./selectQuery/addSubQueries')

function newQuery(table,filter,span,alias) {	
	var compositeQuery = newCompositeQuery();
	var singleQuery = newSingleQuery(table,filter,span,alias);
	compositeQuery = compositeQuery.add(singleQuery);
	return addSubQueries(compositeQuery,table,filter,span,alias);
}

module.exports = newQuery;
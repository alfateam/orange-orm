var newSingleQuery = require('../../getManyDto/query/newSingleQuery');
var extractFilter = require('../query/extractFilter');
var extractLimit = require('../query/extractLimit');
var newParameterized = require('../query/newParameterized');
var extractOffset = require('../query/extractOffset');

function newQuery(table,filter,span,alias) {
	filter = extractFilter(filter);
	var orderBy = '';
	var limit = extractLimit(span);
	var offset = extractOffset(span);

	var query = newSingleQuery(table,filter,span,alias,orderBy,limit,offset);
	const groupClause = groupBy(span);
	return newParameterized(query.sql(), query.parameters).append(groupClause);
}

function groupBy(span) {
	const keys =  Object.keys(span.aggregates).filter(x => span.aggregates[x].column);
	if (keys.length === 0)
		return '';
	return ' GROUP BY ' + keys.join(',');
}

module.exports = newQuery;



////
// const newQueryCore = require('../../getManyDto/newQuery');
// const newParameterized = require('../query/newParameterized');

// function newQuery(_table,_filter,span,_alias) {
// 	const query = newQueryCore.apply(null, arguments);
// 	const groupClause = groupBy(span);
// 	return newParameterized(query.sql(), query.parameters).append(groupClause);
// }


// module.exports = newQuery;
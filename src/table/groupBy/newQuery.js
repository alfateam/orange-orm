var newSingleQuery = require('../../getManyDto/query/newSingleQuery');
var extractFilter = require('../query/extractFilter');
var extractLimit = require('../query/extractLimit');
var newParameterized = require('../query/newParameterized');
var extractOffset = require('../query/extractOffset');

function newQuery(context, table,filter,span,alias) {
	filter = extractFilter(filter);
	var orderBy = '';
	var limit = extractLimit(context, span);
	var offset = extractOffset(context, span);

	var query = newSingleQuery(context, table,filter,span,alias,orderBy,limit,offset);
	const groupClause = groupBy(span);
	return newParameterized(query.sql(), query.parameters).append(groupClause);
}

function groupBy(span) {
	const keys =  Object.keys(span.aggregates).filter(x => span.aggregates[x].column);
	if (keys.length === 0)
		return '';
	return ' GROUP BY ' + keys.map(key => span.aggregates[key].groupBy).join(',');
}

module.exports = newQuery;
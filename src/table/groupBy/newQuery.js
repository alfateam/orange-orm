const newQueryCore = require('../../getManyDto/newQuery');

function newQuery(_table,_filter,span,_alias) {
	const query = newQueryCore.apply(null, arguments);
	const groupClause = groupBy(span);
	return newParameterized(query.sql(), query.parameters).append(groupClause);
}

function groupBy(span) {
	const keys =  Object.keys(span.aggregates);
	if (keys.length === 0)
		return '';
	return ' ' + keys.join(',');
}

module.exports = newQuery;
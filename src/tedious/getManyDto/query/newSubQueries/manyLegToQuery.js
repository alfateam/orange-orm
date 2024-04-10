var newShallowJoinSql = require('../../../../table/query/singleQuery/joinSql/newShallowJoinSqlCore');
var newQuery = require('../../newQueryCore');

function manyLegToQuery(rightAlias, leg, _legNo) {
	var leftAlias = rightAlias + leg.name;
	var span = leg.span;
	var rightTable = leg.table;
	var rightColumns = rightTable._primaryColumns;
	var leftColumns = leg.columns;

	var filter = newShallowJoinSql(rightTable, leftColumns, rightColumns, leftAlias, rightAlias, leg.span.where);
	var query = newQuery(span.table, filter, span, leftAlias);
	return query.prepend('JSON_QUERY( coalesce((').append(` FOR JSON PATH, INCLUDE_NULL_VALUES),'[]')) "${leg.name}"`);
}

module.exports = manyLegToQuery;
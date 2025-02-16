const newShallowJoinSql = require('../../../../table/query/singleQuery/joinSql/newShallowJoinSqlCore');
const newParameterized = require('../../../../table/query/newParameterized');
const formatString = require('../../../../format');

function oneLegToQuery(newQuery, context, rightAlias, leg, _legNo) {
	let leftAlias = rightAlias + leg.name;
	let span = leg.span;
	let rightTable = leg.table;
	let rightColumns = rightTable._primaryColumns;
	let leftColumns = leg.columns;

	let filter = newShallowJoinSql(context, rightTable, leftColumns, rightColumns, leftAlias, rightAlias, leg.span.where);
	let query = newQuery(context, span.table, filter, span, leftAlias);
	let sql = 'SELECT TOP 1' + query.sql().substring(6);
	return newParameterized(formatString('JSON_QUERY((%s FOR JSON PATH, INCLUDE_NULL_VALUES, WITHOUT_ARRAY_WRAPPER)) "%s"', sql, leg.name), query.parameters);
}

module.exports = oneLegToQuery;
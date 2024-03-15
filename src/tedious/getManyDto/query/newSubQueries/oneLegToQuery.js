var newShallowJoinSql = require('../../../../table/query/singleQuery/joinSql/newShallowJoinSqlCore');
var newQuery = require('../../newQueryCore');
var newParameterized = require('../../../../table/query/newParameterized');
var util = require('util');

function oneLegToQuery(rightAlias,leg,_legNo) {
	var leftAlias = rightAlias + leg.name;
	var span = leg.span;
	var rightTable = leg.table;
	var rightColumns = rightTable._primaryColumns;
	var leftColumns = leg.columns;

	var filter  = newShallowJoinSql(rightTable,leftColumns,rightColumns,leftAlias,rightAlias,leg.span.where);
	var query = newQuery(span.table,filter,span,leftAlias);
	var sql = 'SELECT TOP 1' + query.sql().substring(6);
	return newParameterized(util.format('JSON_QUERY((%s FOR JSON PATH, INCLUDE_NULL_VALUES, WITHOUT_ARRAY_WRAPPER)) "%s"',sql, leg.name ), query.parameters);
}

module.exports = oneLegToQuery;
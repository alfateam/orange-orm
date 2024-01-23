var newShallowJoinSql = require('../../../../table/query/singleQuery/joinSql/newShallowJoinSqlCore');
var newQuery = require('../../newQueryCore');
var newParameterized = require('../../../../table/query/newParameterized');
var util = require('util');

function manyLegToQuery(rightAlias, leg, legNo) {
	var leftAlias = rightAlias + 'x' + legNo;
	var span = leg.span;
	var rightTable = leg.table;
	var rightColumns = rightTable._primaryColumns;
	var leftColumns = leg.columns;

	var shallowJoin = newShallowJoinSql(rightTable, leftColumns, rightColumns, leftAlias, rightAlias);
	var filter = newParameterized(shallowJoin);
	var query = newQuery(span.table, filter, span, leftAlias);
	return util.format('JSON_QUERY( coalesce((%s FOR JSON PATH, INCLUDE_NULL_VALUES),\'[]\')) "%s"', query.sql(), leg.name);

}

module.exports = manyLegToQuery;
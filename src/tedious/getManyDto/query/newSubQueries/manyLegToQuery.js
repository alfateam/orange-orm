var newShallowJoinSql = require('../../../../table/query/singleQuery/joinSql/newShallowJoinSqlCore');
var newQuery = require('../../newQueryCore');
var newParameterized = require('../../../../table/query/newParameterized');
var util = require('util');

function manyLegToQuery(rightAlias, leg, legNo) {
	//todo
	// var leftAlias = rightAlias + 'x' + legNo;
	var leftAlias = rightAlias + leg.name;
	var span = leg.span;
	var rightTable = leg.table;
	var rightColumns = rightTable._primaryColumns;
	var leftColumns = leg.columns;

	var filter = newShallowJoinSql(rightTable, leftColumns, rightColumns, leftAlias, rightAlias, leg.span.where);
	var query = newQuery(span.table, filter, span, leftAlias);
	return query.prepend('JSON_QUERY( coalesce((').append(` FOR JSON PATH, INCLUDE_NULL_VALUES),\'[]\')) "${leg.name}"`)
	// return util.format('JSON_QUERY( coalesce((%s FOR JSON PATH, INCLUDE_NULL_VALUES),\'[]\')) "%s"', query.sql(), leg.name);

}

module.exports = manyLegToQuery;
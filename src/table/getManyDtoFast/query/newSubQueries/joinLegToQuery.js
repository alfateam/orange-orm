var newShallowJoinSql = require('../../../../table/query/singleQuery/joinSql/newShallowJoinSqlCore');
var newQuery = require('../../newQueryCore');
var newParameterized = require('../../../../table/query/newParameterized');

function joinLegToQuery(parentAlias,leg,_legNo) {
	var childAlias = parentAlias + leg.name;
	var span = leg.span;
	var parentTable = leg.table;
	var childColumns = span.table._primaryColumns;
	var parentColumns = leg.columns;

	var shallowJoin  = newShallowJoinSql(parentTable,childColumns,parentColumns,childAlias,parentAlias);
	var filter = newParameterized(shallowJoin);
	var query = newQuery(span.table,filter,span,childAlias);
	return query.prepend(',JSON_QUERY((').append(` FOR JSON PATH, INCLUDE_NULL_VALUES, WITHOUT_ARRAY_WRAPPER)) "${leg.name}"`);
}

module.exports = joinLegToQuery;
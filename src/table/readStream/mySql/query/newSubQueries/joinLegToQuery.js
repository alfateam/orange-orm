var newShallowJoinSql = require('../../../../query/singleQuery/joinSql/newShallowJoinSqlCore');
const quote = require('../../../../quote');
var newQuery = require('./newQueryCore');
var util = require('util');

function joinLegToQuery(parentAlias,leg,legNo) {
	var childAlias = parentAlias + 'x' + legNo;
	var span = leg.span;
	var childTable = span.table;
	var parentTable = leg.table;
	var childColumns = span.table._primaryColumns;
	var parentColumns = leg.columns;

	var shallowJoin  = newShallowJoinSql(parentTable,childColumns,parentColumns,childAlias,parentAlias);
	var query = newQuery(childTable,span,childAlias);

	return util.format(',\'%s\',(select %s from %s %s where %s)', leg.name, query.sql(), quote(childTable._dbName), quote(childAlias), shallowJoin);
}

module.exports = joinLegToQuery;
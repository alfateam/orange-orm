var newShallowJoinSql = require('../../../../query/singleQuery/joinSql/newShallowJoinSqlCore');
var newQuery = require('../../newQuery');
var newParameterized = require('../../../../query/newParameterized');
var util = require('util');

function joinLegToQuery(parentAlias,leg,legNo) {	
	var childAlias = parentAlias + '_' + legNo;
	var span = leg.span;
	var parentTable = leg.table;	
	var childColumns = span.table._primaryColumns;
	var parentColumns = leg.columns;	 

	var shallowJoin  = newShallowJoinSql(parentTable,childColumns,parentColumns,childAlias,parentAlias);
	var filter = newParameterized(shallowJoin);
	var query = newQuery(span.table,filter,span,childAlias);
	return util.format(',(select row_to_json(r) from (%s) r ) "%s"', query.sql(), leg.name );

}

module.exports = joinLegToQuery;
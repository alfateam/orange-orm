var newShallowJoinSql = require('../singleQuery/joinSql/newShallowJoinSql');
var newQuery = require('../../newQuery');
var newParameterized = require('../newParameterized');
var emptyFilter;

function joinLegToQuery(queries, parentAlias,leg,legNo,filter, innerJoin) {	
	var childAlias = parentAlias + '_' + legNo;
	var span = leg.span;
	var parentTable = leg.table;	
	var childColumns = span.table._primaryColumns;
	var parentColumns = leg.columns;	 

	var shallowJoin  = newShallowJoinSql(parentTable,childColumns,parentColumns,childAlias,parentAlias);
	var innerJoin = newParameterized(' INNER' + shallowJoin).append(innerJoin);	
	return newQuery(queries, span.table,filter,span,childAlias,innerJoin);
}

module.exports = joinLegToQuery;
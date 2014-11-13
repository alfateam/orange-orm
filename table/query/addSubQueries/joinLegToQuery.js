var newShallowJoinSql = require('../singleQuery/joinSql/newShallowJoinSql');
var addSubQueries = require('../addSubQueries');
var newParameterized = require('../newParameterized');

function joinLegToQuery(queries, parentAlias,leg,legNo,filter, innerJoin) {	
	var childAlias = parentAlias + '_' + legNo;
	var span = leg.span;
	var parentTable = leg.table;	
	var childColumns = span.table._primaryColumns;
	var parentColumns = leg.columns;	 

	var shallowJoin  = newShallowJoinSql(parentTable,childColumns,parentColumns,childAlias,parentAlias);
	innerJoin = newParameterized(' INNER' + shallowJoin).append(innerJoin);	
	return addSubQueries(queries, span.table,filter,span,childAlias,innerJoin);
}

module.exports = joinLegToQuery;